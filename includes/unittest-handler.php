<?php
/**
 * Unit Test Template Handler
 * Handles downloading unit test templates based on project
 */

// Get project name from request
$project = $_GET['project'] ?? '';

if (empty($project)) {
    http_response_code(400);
    die('Project name is required');
}

// Define template directory
$templateDir = __DIR__ . '/../assets/template-unittest/';

// Sanitize project name
$safeProject = preg_replace('/[^a-zA-Z0-9._-]/', '', $project);

// Define possible template files
$possibleFiles = [
    $safeProject . '.xlsx',
    $safeProject . '.xls',
    $safeProject . '.docx',
    $safeProject . '.doc',
    $safeProject . '.pdf'
];

// Find the template file
$templateFile = null;
foreach ($possibleFiles as $file) {
    $fullPath = $templateDir . $file;
    if (file_exists($fullPath)) {
        $templateFile = $fullPath;
        break;
    }
}

// If no specific template found, try default
if (!$templateFile) {
    $defaultFile = $templateDir . 'default.xlsx';
    if (file_exists($defaultFile)) {
        $templateFile = $defaultFile;
    }
}

// If still no template found
if (!$templateFile) {
    http_response_code(404);
    die('Unit Test template not found for project: ' . htmlspecialchars($project));
}

// Get file info
$fileName = basename($templateFile);
$fileSize = filesize($templateFile);
$fileExt = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

// Set content type based on extension
$contentTypes = [
    'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'xls' => 'application/vnd.ms-excel',
    'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'doc' => 'application/msword',
    'pdf' => 'application/pdf'
];

$contentType = $contentTypes[$fileExt] ?? 'application/octet-stream';

// Set headers for download
header('Content-Type: ' . $contentType);
header('Content-Disposition: attachment; filename="UnitTest_' . $safeProject . '.' . $fileExt . '"');
header('Content-Length: ' . $fileSize);
header('Cache-Control: no-cache, must-revalidate');
header('Pragma: no-cache');

// Output file
readfile($templateFile);
exit;
