<?php
/**
 * Open Folder in File Explorer
 * Creates a batch file to open folder and executes it
 */

$templateDir = realpath(__DIR__ . '/../assets/template-unittest');

if (!$templateDir || !is_dir($templateDir)) {
    // Create folder if not exists
    $templateDir = __DIR__ . '/../assets/template-unittest';
    if (!is_dir($templateDir)) {
        mkdir($templateDir, 0755, true);
    }
    $templateDir = realpath($templateDir);
}

// Create batch file to open folder
$batFile = sys_get_temp_dir() . '/open_template_folder.bat';
$batContent = "@echo off\r\nstart \"\" \"$templateDir\"\r\nexit";
file_put_contents($batFile, $batContent);

// Execute batch file
if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
    pclose(popen("start /B \"\" \"$batFile\"", "r"));
}

// Return success
header('Content-Type: application/json');
echo json_encode([
    'success' => true,
    'path' => $templateDir,
    'message' => 'Opening folder in File Explorer...'
]);
