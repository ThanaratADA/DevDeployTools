<?php
/**
 * Open Template Folder Handler
 * Opens the template-unittest folder in File Explorer
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

// Return JSON with folder path
header('Content-Type: application/json');
echo json_encode([
    'success' => true,
    'path' => $templateDir,
    'message' => 'Opening folder...'
]);
