<?php
/**
 * AdaSoft Deploy Tool - Configuration Handler
 * Handles all configuration related operations
 */

class ConfigHandler {
    private $configFile;
    private $defaultConfig;
    
    public function __construct($configFile = 'deploy_config.json') {
        $this->configFile = $configFile;
        
        // NEW: Load initial config from deploy_config.json
        // D:\WebServer\Apache24\htdocs\DeploysV1\DevSecTools\deploy_config.json
        $masterConfigPath = 'D:\\WebServer\\Apache24\\htdocs\\DeploysV1\\DevSecTools\\deploy_config.json';
        
        if (file_exists($masterConfigPath)) {
            $this->defaultConfig = json_decode(file_get_contents($masterConfigPath), true);
        } elseif (file_exists($this->configFile)) {
            $this->defaultConfig = json_decode(file_get_contents($this->configFile), true);
        } else {
            // Fallback: minimal default structure if file not found
            $this->defaultConfig = [
                'sourcePath' => 'D:\\WebServer\\Apache24\\htdocs\\',
                'destinationPath' => 'D:\\PackFile_Deploy\\',
                'projects' => [],
                'projectMiddleFolders' => [],
                'projectDestinationNames' => [],
                'googleDrivePaths' => [],
                'readmeTemplates' => []
            ];
        }
    }
    
    public function loadConfig() {
        if (!file_exists($this->configFile)) {
            file_put_contents($this->configFile, json_encode($this->defaultConfig, JSON_PRETTY_PRINT));
            return $this->defaultConfig;
        }
        
        $config = json_decode(file_get_contents($this->configFile), true);
        
        // Ensure all required keys exist
        $config = $this->ensureConfigKeys($config);
        
        return $config;
    }
    
    private function ensureConfigKeys($config) {
        $requiredKeys = ['readmeTemplates', 'googleDrivePaths', 'projectDestinationNames', 'projectMiddleFolders'];
        
        foreach ($requiredKeys as $key) {
            if (!isset($config[$key])) {
                $config[$key] = $this->defaultConfig[$key];
            }
        }
        
        return $config;
    }
    
    public function updateConfig($postData) {
        $config = $this->loadConfig();
        
        // Update basic paths
        $config['sourcePath'] = $postData['sourcePath'];
        $config['destinationPath'] = $postData['destinationPath'];
        
        // Update projects
        $config['projects'] = [];
        if (isset($postData['projectNames']) && isset($postData['projectPaths'])) {
            for ($i = 0; $i < count($postData['projectNames']); $i++) {
                if (!empty($postData['projectNames'][$i]) && !empty($postData['projectPaths'][$i])) {
                    $config['projects'][$postData['projectNames'][$i]] = $postData['projectPaths'][$i];
                }
            }
        }
        
        // Update Google Drive paths (per project)
        $config['googleDrivePaths'] = [];
        if (isset($postData['driveProjects']) && isset($postData['driveXPatch'])) {
            for ($i = 0; $i < count($postData['driveProjects']); $i++) {
                $project = $postData['driveProjects'][$i];
                if (!empty($project)) {
                    $config['googleDrivePaths'][$project] = [
                        'xPatch' => $postData['driveXPatch'][$i] ?? '',
                        'xUpgrade' => $postData['driveXUpgrade'][$i] ?? '',
                        'xDatabase' => $postData['driveXDatabase'][$i] ?? '',
                        'unitTest' => $postData['driveUnitTest'][$i] ?? '',
                        'impact' => $postData['driveImpact'][$i] ?? '',
                        'versionHistory' => $postData['driveVersionHistory'][$i] ?? '',
                        'lastVersion' => $postData['driveLastVersion'][$i] ?? '',
                        'lastVersionView' => $postData['driveLastVersionView'][$i] ?? '',
                        'sheetAppName' => $postData['driveSheetAppName'][$i] ?? ''
                    ];
                }
            }
        }
        
        // Update readme templates
        $config['readmeTemplates'] = [];
        if (isset($postData['templateProjects']) && isset($postData['templateContents'])) {
            for ($i = 0; $i < count($postData['templateProjects']); $i++) {
                if (!empty($postData['templateProjects'][$i]) && !empty($postData['templateContents'][$i])) {
                    $config['readmeTemplates'][$postData['templateProjects'][$i]] = $postData['templateContents'][$i];
                }
            }
        }
        
        // Update project destination names and middle folders
        $config['projectDestinationNames'] = [];
        $config['projectMiddleFolders'] = [];
        if (isset($postData['projectNames']) && isset($postData['projectDestNames']) && isset($postData['projectMiddleFolders'])) {
            for ($i = 0; $i < count($postData['projectNames']); $i++) {
                if (!empty($postData['projectNames'][$i])) {
                    $config['projectDestinationNames'][$postData['projectNames'][$i]] = $postData['projectDestNames'][$i] ?? 'StoreBack ( Web Application )';
                    $config['projectMiddleFolders'][$postData['projectNames'][$i]] = $postData['projectMiddleFolders'][$i] ?? 'AdaStoreBack';
                }
            }
        }

        // Update StoreBack Colors
        if (isset($postData['storeBackColors'])) {
             $config['storeBackColors'] = $postData['storeBackColors'];
        }
        
        file_put_contents($this->configFile, json_encode($config, JSON_PRETTY_PRINT));
        return true;
    }
}
?>