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
        $this->defaultConfig = [
            'sourcePath' => 'D:\\WebServer\\Apache24\\htdocs\\',
            'destinationPath' => 'D:\\PackFile_Deploy\\',
            'projects' => [
                'AdaPos5.0-Retail' => 'AdaPos5.0-Retail',
                'AdaStoreBack' => 'AdaStoreBack',
                'AdaHQ' => 'AdaHQ'
            ],
            'projectMiddleFolders' => [
                'AdaPos5.0-Retail' => 'AdaStoreBack',
                'AdaStoreBack' => 'AdaStoreBack',
                'AdaHQ' => 'AdaStoreBack'
            ],
            'projectDestinationNames' => [
                'AdaPos5.0-Retail' => 'StoreBack ( Web Application )',
                'AdaStoreBack' => 'StoreBack ( Web Application )',
                'AdaHQ' => 'StoreBack ( Web Application )'
            ],
            'googleDrivePaths' => [
                'AdaPos5.0-Retail' => [
                    'xPatch' => '',
                    'xUpgrade' => '',
                    'unitTest' => '',
                    'versionHistory' => '',
                    'lastVersion' => ''
                ],
                'AdaStoreBack' => [
                    'xPatch' => '',
                    'xUpgrade' => '',
                    'unitTest' => '',
                    'versionHistory' => '',
                    'lastVersion' => ''
                ],
                'AdaHQ' => [
                    'xPatch' => '',
                    'xUpgrade' => '',
                    'unitTest' => '',
                    'versionHistory' => '',
                    'lastVersion' => ''
                ]
            ],
            'readmeTemplates' => [
                'AdaPos5.0-Retail' => "Deploy {PROJECT}\n{PROJECT} {VERSION}\n\nปัญหา\n{PROBLEMS}\n\nแก้ไข\n{SOLUTIONS}\n\nConfig\n{CONFIG}\n\nRemark\n{REMARKS}\n\nX-Patch: {X_PATCH}\nX-Upgrade: {X_UPGRADE}\nX-Upgrade (Database): {X_DATABASE}\nImpact: {IMPACT}\nUnit Test: {UNIT_TEST}\nVersion History: {VERSION_HISTORY}\nLast Version: {LAST_VERSION}",
                'AdaStoreBack' => "Deploy {PROJECT}\n{PROJECT} {VERSION}\n\nปัญหา\n{PROBLEMS}\n\nแก้ไข\n{SOLUTIONS}\n\nConfig\n{CONFIG}\n\nRemark\n{REMARKS}\n\nX-Patch: {X_PATCH}\nX-Upgrade: {X_UPGRADE}\nX-Upgrade (Database): {X_DATABASE}\nImpact: {IMPACT}\nUnit Test: {UNIT_TEST}\nVersion History: {VERSION_HISTORY}\nLast Version: {LAST_VERSION}",
                'AdaHQ' => "Deploy {PROJECT}\n{PROJECT} {VERSION}\n\nปัญหา\n{PROBLEMS}\n\nแก้ไข\n{SOLUTIONS}\n\nConfig\n{CONFIG}\n\nRemark\n{REMARKS}\n\nX-Patch: {X_PATCH}\nX-Upgrade: {X_UPGRADE}\nX-Upgrade (Database): {X_DATABASE}\nImpact: {IMPACT}\nUnit Test: {UNIT_TEST}\nVersion History: {VERSION_HISTORY}\nLast Version: {LAST_VERSION}"
            ]
        ];
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
        
        file_put_contents($this->configFile, json_encode($config, JSON_PRETTY_PRINT));
        return true;
    }
}
?>