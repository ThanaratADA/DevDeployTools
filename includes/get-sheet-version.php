<?php
/**
 * Get Version from Google Sheet CSV
 * Searches for a specific App Name in Column A and returns Version from Column B
 */

$csvUrl = $_GET['url'] ?? '';
$appName = $_GET['app'] ?? ''; // App name to search for (e.g., BackOffice)

if (empty($csvUrl)) {
    echo json_encode(['success' => false, 'message' => 'No URL provided']);
    exit;
}

// Ensure csvUrl is actually a CSV export link
if (strpos($csvUrl, 'output=csv') === false) {
    if (preg_match('/\/d\/([a-zA-Z0-9-_]+)/', $csvUrl, $matches)) {
        $id = $matches[1];
        $gid = '0';
        if (preg_match('/[#&]gid=([0-9]+)/', $csvUrl, $gidMatches)) {
            $gid = $gidMatches[1];
        }
        $csvUrl = "https://docs.google.com/spreadsheets/d/$id/export?format=csv&gid=$gid";
    }
}

try {
    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)\r\n"
        ]
    ]);
    
    $content = @file_get_contents($csvUrl, false, $context);
    
    if ($content === false) {
        throw new Exception("Cannot access Sheet. Please ensure it is 'Published to web' as CSV.");
    }
    
    // Handle potential BOM in first cell
    $content = preg_replace('/^\xEF\xBB\xBF/', '', $content);
    
    // Parse CSV rows robustly
    $rows = [];
    $lines = preg_split('/\r\n|\r|\n/', $content);
    foreach ($lines as $line) {
        if (!empty(trim($line))) {
            $rows[] = str_getcsv($line);
        }
    }
    
    $foundVersion = '';
    
    // Normalize app name for search
    $targetApp = strtolower(trim($appName));
    $debugLog = [];
    
    if (!empty($targetApp)) {
        // Search for App Name in Column A (Index 0)
        foreach ($rows as $row) {
            if (count($row) < 2) continue;
            
            $rawAppName = $row[0];
            $currentApp = strtolower(trim($rawAppName));
            
            // Debug check (keep last 5 checks)
            if (count($debugLog) < 5) $debugLog[] = "Checked '$currentApp' against '$targetApp'";
            // Check for exact match or contains
            if ($currentApp === $targetApp) {
                $foundVersion = trim($row[1]); // Col B
                $colD = isset($row[3]) ? trim($row[3]) : ''; 
                $colE = isset($row[4]) ? trim($row[4]) : ''; 
                $colF = isset($row[5]) ? trim($row[5]) : ''; 
                $colG = isset($row[6]) ? trim($row[6]) : '';
                break;
            }
        }
    }
    
    if (!empty($foundVersion)) {
        echo json_encode([
            'success' => true, 
            'version' => $foundVersion, 
            'deployDate' => $colD,     // Default mapping (D)
            'updateBy' => $colF,       // Current mapping (F) - might be wrong
            'colE' => $colE,           // Extra for debugging
            'colG' => $colG,           // Extra for debugging
            'message' => "Found version for $appName"
        ]);
    } else {
        echo json_encode([
            'success' => false, 
            'message' => "App '$appName' not found in Sheet.",
            'debug' => $debugLog,
            'count' => count($rows) . " rows scanned"
        ]);
    }

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
