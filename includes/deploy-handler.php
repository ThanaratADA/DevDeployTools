<?php
/**
 * AdaSoft Deploy Tool - Deploy Handler
 * Handles all deployment operations
 */

class DeployHandler {
    private $config;
    
    public function __construct($config) {
        $this->config = $config;
    }
    
    public function deploy($project, $version, $deployNotes, $filesList) {
        $sourcePath = $this->config['sourcePath'] . $this->config['projects'][$project];
        $destinationPath = $this->config['destinationPath'];
        
        // Check and create project folder in destination if not exists
        $projectDestinationPath = $destinationPath . $project;
        if (!is_dir($projectDestinationPath)) {
            if (!mkdir($projectDestinationPath, 0777, true)) {
                return $this->createErrorResponse("Failed to create project folder: $project");
            }
            $this->addMessage('info', "Created project folder: $project");
        } else {
            $this->addMessage('success', "Project folder exists: $project");
        }
        
        $deployFolder = $project . '-' . $version . '-' . date('dmY');
        $fullDeployPath = $projectDestinationPath . '/' . $deployFolder;
        
        // Create deployment folder structure
        $middleFolderName = $this->config['projectMiddleFolders'][$project] ?? 'AdaStoreBack';
        $destinationFolderName = $this->config['projectDestinationNames'][$project] ?? 'StoreBack ( Web Application )';
        $deployProjectPath = $fullDeployPath . '/' . $middleFolderName . '/' . $destinationFolderName;
        
        if (!is_dir($deployProjectPath)) {
            mkdir($deployProjectPath, 0777, true);
        }
        
        $files = explode("\n", $filesList);
        $stats = ['success' => 0, 'failed' => 0, 'notFound' => 0];
        
        foreach ($files as $file) {
            $file = trim($file);
            if (empty($file)) continue;
            
            $sourceFile = $sourcePath . '/' . $file;
            $destFile = $deployProjectPath . '/' . $file;
            $destDir = dirname($destFile);
            
            // Create directory structure if not exists
            if (!is_dir($destDir)) {
                mkdir($destDir, 0777, true);
            }
            
            if (file_exists($sourceFile)) {
                if (copy($sourceFile, $destFile)) {
                    $this->addMessage('success', $file);
                    $stats['success']++;
                } else {
                    $this->addMessage('danger', "Failed: $file");
                    $stats['failed']++;
                }
            } else {
                $this->addMessage('warning', "Not found: $file");
                $stats['notFound']++;
            }
        }
        
        // Create readme file in deployment folder
        $readmeFile = $fullDeployPath . '/Readme.txt';
        if (file_put_contents($readmeFile, $deployNotes)) {
            $this->addMessage('info', 'Created Readme.txt');
        }
        
        // Create version file in project subfolder
        $versionFile = $deployProjectPath . '/version_deploy.txt';
        $versionContent = "Version $version " . date('dmY');
        if (file_put_contents($versionFile, $versionContent)) {
            $this->addMessage('info', 'Created version_deploy.txt');
        }
        
        return [
            'success' => true,
            'stats' => $stats,
            'deployFolder' => $deployFolder,
            'fullPath' => $fullDeployPath,
            'projectPath' => $projectDestinationPath
        ];
    }
    
    public function getDeployHistory($project) {
        $projectDestinationPath = $this->config['destinationPath'] . $project;
        
        $history = [];
        if (is_dir($projectDestinationPath)) {
            $folders = scandir($projectDestinationPath);
            foreach ($folders as $folder) {
                if ($folder != '.' && $folder != '..' && is_dir($projectDestinationPath . '/' . $folder)) {
                    $readmePath = $projectDestinationPath . '/' . $folder . '/Readme.txt';
                    $versionPath = $projectDestinationPath . '/' . $folder . '/' . 
                                 ($this->config['projectMiddleFolders'][$project] ?? 'AdaStoreBack') . '/' . 
                                 ($this->config['projectDestinationNames'][$project] ?? 'StoreBack ( Web Application )') . 
                                 '/version_deploy.txt';
                    
                    $deployInfo = [
                        'folder' => $folder,
                        'date' => filemtime($projectDestinationPath . '/' . $folder),
                        'readme' => file_exists($readmePath) ? file_get_contents($readmePath) : 'ไม่พบ Readme',
                        'version' => file_exists($versionPath) ? file_get_contents($versionPath) : 'ไม่พบ Version'
                    ];
                    $history[] = $deployInfo;
                }
            }
            
            // Sort by date descending
            usort($history, function($a, $b) {
                return $b['date'] - $a['date'];
            });
        }
        
        return ['success' => true, 'history' => $history];
    }
    
    public function downloadReadme($project, $version, $content) {
        // Process template variables
        $projectPaths = $this->config['googleDrivePaths'][$project] ?? [];
        $processedContent = str_replace([
            '{PROJECT}',
            '{VERSION}',
            '{X_PATCH}',
            '{X_UPGRADE}',
            '{UNIT_TEST}',
            '{VERSION_HISTORY}',
            '{LAST_VERSION}'
        ], [
            $project,
            $version,
            $projectPaths['xPatch'] ?? 'ไม่มี',
            $projectPaths['xUpgrade'] ?? 'ไม่มี',
            $projectPaths['unitTest'] ?? 'ไม่มี',
            $projectPaths['versionHistory'] ?? 'ไม่มี',
            $projectPaths['lastVersion'] ?? 'ไม่มี'
        ], $content);
        
        $filename = $project . '-' . $version . '-' . date('dmY') . '-Readme.txt';
        
        header('Content-Type: text/plain; charset=utf-8');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Content-Length: ' . strlen($processedContent));
        
        echo $processedContent;
        exit;
    }
    
    private function addMessage($type, $message) {
        // This would be used to collect messages for display
        // Implementation depends on how you want to handle message display
    }
    
    private function createErrorResponse($message) {
        return [
            'success' => false,
            'message' => $message
        ];
    }
}
?>