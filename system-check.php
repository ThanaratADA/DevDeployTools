<?php
/**
 * AdaSoft Deploy Tool - System Check
 * ตรวจสอบความพร้อมของระบบก่อนใช้งาน Deploy Tool
 */

header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>System Check - Deploy Tool</title>
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
@import url('https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800&display=swap');
        body { padding: 20px; background: #f5f5f5; font-family: 'Sarabun', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
        .check-item { padding: 15px; margin: 10px 0; background: white; border-radius: 8px; border-left: 4px solid #ddd; }
        .check-item.success { border-left-color: #28a745; }
        .check-item.warning { border-left-color: #ffc107; }
        .check-item.error { border-left-color: #dc3545; }
        .check-title { font-weight: bold; margin-bottom: 5px; }
        .check-detail { font-size: 0.9rem; color: #666; }
        pre { background: #f8f9fa; padding: 10px; border-radius: 4px; font-size: 0.85rem; }
        .icon-success { color: #28a745; }
        .icon-warning { color: #ffc107; }
        .icon-error { color: #dc3545; }
        .back-btn { background: linear-gradient(135deg, #008f66 0%, #006648 100%); color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; display: inline-flex; align-items: center; gap: 10px; font-weight: 600; transition: all 0.3s; margin-bottom: 20px; border: none; }
        .back-btn:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0, 143, 102, 0.3); color: white; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <a href="index.php" class="back-btn mt-4">
            <i class="fas fa-arrow-left"></i> กลับหน้าหลัก
        </a>
        <h1 class="mb-4"><i class="fas fa-check-circle"></i> Deploy Tool - System Check</h1>
        <p class="text-muted">ตรวจสอบความพร้อมของระบบก่อนใช้งาน Deploy Tool</p>
        <hr>

        <?php
        $checks = [];
        $hasError = false;

        // 1. Check PHP Version
        $phpVersion = phpversion();
        $phpOk = version_compare($phpVersion, '7.0', '>=');
        $checks[] = [
            'status' => $phpOk ? 'success' : 'error',
            'icon' => $phpOk ? 'check-circle' : 'times-circle',
            'title' => 'PHP Version',
            'message' => "PHP Version: $phpVersion",
            'detail' => $phpOk ? 'PHP version เหมาะสม (>= 7.0)' : 'ต้องการ PHP >= 7.0'
        ];
        if (!$phpOk) $hasError = true;

        // 2. Check Git Installation
        $gitVersion = shell_exec('git --version 2>&1');
        $gitInstalled = !empty($gitVersion) && stripos($gitVersion, 'git version') !== false;
        $checks[] = [
            'status' => $gitInstalled ? 'success' : 'error',
            'icon' => $gitInstalled ? 'check-circle' : 'times-circle',
            'title' => 'Git Installation',
            'message' => $gitInstalled ? trim($gitVersion) : 'Git ไม่ได้ติดตั้งหรือไม่อยู่ใน PATH',
            'detail' => $gitInstalled ? 'Git พร้อมใช้งาน' : 'กรุณาติดตั้ง Git และเพิ่มเข้า System PATH'
        ];
        if (!$gitInstalled) $hasError = true;

        // 3. Check Git Path
        if ($gitInstalled) {
            $gitPath = shell_exec('where git 2>&1');
            if (empty($gitPath)) {
                $gitPath = shell_exec('which git 2>&1');
            }
            $checks[] = [
                'status' => 'success',
                'icon' => 'info-circle',
                'title' => 'Git Path',
                'message' => trim($gitPath),
                'detail' => 'ตำแหน่งของ Git executable'
            ];
        }

        // 4. Check Config File
        $configFile = __DIR__ . '/includes/config.json';
        $configExists = file_exists($configFile);
        $configReadable = $configExists && is_readable($configFile);
        
        $checks[] = [
            'status' => $configReadable ? 'success' : 'error',
            'icon' => $configReadable ? 'check-circle' : 'times-circle',
            'title' => 'Config File',
            'message' => $configReadable ? 'ไฟล์ config.json พบและอ่านได้' : 'ไม่พบหรืออ่านไฟล์ config.json ไม่ได้',
            'detail' => "Path: $configFile"
        ];
        if (!$configReadable) $hasError = true;

        // 5. Check Config JSON Syntax
        if ($configReadable) {
            $configContent = file_get_contents($configFile);
            $config = json_decode($configContent, true);
            $jsonValid = json_last_error() === JSON_ERROR_NONE;
            
            $checks[] = [
                'status' => $jsonValid ? 'success' : 'error',
                'icon' => $jsonValid ? 'check-circle' : 'times-circle',
                'title' => 'Config JSON Syntax',
                'message' => $jsonValid ? 'JSON syntax ถูกต้อง' : 'JSON syntax ผิด: ' . json_last_error_msg(),
                'detail' => $jsonValid ? 'ไฟล์ config สามารถ parse ได้' : 'กรุณาตรวจสอบ syntax ใน config.json'
            ];
            if (!$jsonValid) $hasError = true;

            // 6. Check Source Path
            if ($jsonValid && isset($config['sourcePath'])) {
                $sourcePath = $config['sourcePath'];
                $sourceExists = is_dir($sourcePath);
                
                $checks[] = [
                    'status' => $sourceExists ? 'success' : 'error',
                    'icon' => $sourceExists ? 'check-circle' : 'times-circle',
                    'title' => 'Source Path',
                    'message' => $sourceExists ? "Source path พบ: $sourcePath" : "Source path ไม่พบ: $sourcePath",
                    'detail' => $sourceExists ? 'โฟลเดอร์ source code มีอยู่' : 'กรุณาสร้างโฟลเดอร์หรือแก้ไข path ใน config.json'
                ];
                if (!$sourceExists) $hasError = true;

                // 7. Check Projects
                if ($sourceExists && isset($config['projects'])) {
                    foreach ($config['projects'] as $projectName => $projectPath) {
                        $fullPath = $sourcePath . $projectPath;
                        $projectExists = is_dir($fullPath);
                        
                        // Check if it's a git repository
                        $isGitRepo = false;
                        if ($projectExists) {
                            $gitDir = $fullPath . '.git';
                            $isGitRepo = is_dir($gitDir);
                        }
                        
                        $status = $projectExists && $isGitRepo ? 'success' : ($projectExists ? 'warning' : 'error');
                        $icon = $projectExists && $isGitRepo ? 'check-circle' : ($projectExists ? 'exclamation-triangle' : 'times-circle');
                        
                        $message = '';
                        if (!$projectExists) {
                            $message = "โฟลเดอร์ไม่พบ: $fullPath";
                        } elseif (!$isGitRepo) {
                            $message = "โฟลเดอร์พบแต่ไม่ใช่ Git repository: $fullPath";
                        } else {
                            // Try to get git info
                            $gitLog = shell_exec("cd \"$fullPath\" && git log -1 --oneline 2>&1");
                            $message = "โปรเจ็ค $projectName พร้อมใช้งาน";
                            if ($gitLog && stripos($gitLog, 'fatal') === false) {
                                $message .= " (Latest: " . trim(substr($gitLog, 0, 50)) . ")";
                            }
                        }
                        
                        $checks[] = [
                            'status' => $status,
                            'icon' => $icon,
                            'title' => "Project: $projectName",
                            'message' => $message,
                            'detail' => "Path: $fullPath"
                        ];
                        
                        if ($status === 'error') $hasError = true;
                    }
                }
            }

            // 8. Check Deploy Path
            if ($jsonValid && isset($config['deployPath'])) {
                $deployPath = $config['deployPath'];
                $deployExists = is_dir($deployPath);
                $deployWritable = $deployExists && is_writable($deployPath);
                
                $status = $deployWritable ? 'success' : ($deployExists ? 'warning' : 'error');
                $icon = $deployWritable ? 'check-circle' : ($deployExists ? 'exclamation-triangle' : 'times-circle');
                
                $message = '';
                if (!$deployExists) {
                    $message = "Deploy path ไม่พบ: $deployPath";
                } elseif (!$deployWritable) {
                    $message = "Deploy path ไม่สามารถเขียนได้: $deployPath";
                } else {
                    $message = "Deploy path พร้อมใช้งาน: $deployPath";
                }
                
                $checks[] = [
                    'status' => $status,
                    'icon' => $icon,
                    'title' => 'Deploy Path',
                    'message' => $message,
                    'detail' => $deployWritable ? 'สามารถสร้างไฟล์ได้' : 'กรุณาตรวจสอบสิทธิ์การเขียนไฟล์'
                ];
                
                if ($status === 'error') $hasError = true;
            }
        }

        // 9. Check shell_exec
        $shellExecEnabled = function_exists('shell_exec');
        $checks[] = [
            'status' => $shellExecEnabled ? 'success' : 'error',
            'icon' => $shellExecEnabled ? 'check-circle' : 'times-circle',
            'title' => 'PHP shell_exec()',
            'message' => $shellExecEnabled ? 'shell_exec() ใช้งานได้' : 'shell_exec() ถูก disable',
            'detail' => $shellExecEnabled ? 'สามารถเรียกใช้ Git commands ได้' : 'กรุณา enable shell_exec ใน php.ini'
        ];
        if (!$shellExecEnabled) $hasError = true;

        // Display Results
        foreach ($checks as $check) {
            $statusClass = $check['status'];
            $iconClass = "icon-{$check['status']}";
            echo "<div class='check-item {$statusClass}'>";
            echo "<div class='check-title'>";
            echo "<i class='fas fa-{$check['icon']} {$iconClass}'></i> ";
            echo htmlspecialchars($check['title']);
            echo "</div>";
            echo "<div class='check-detail'>{$check['message']}</div>";
            if (!empty($check['detail'])) {
                echo "<small class='text-muted'>{$check['detail']}</small>";
            }
            echo "</div>";
        }

        // Summary
        echo "<hr>";
        if (!$hasError) {
            echo "<div class='alert alert-success'>";
            echo "<h4><i class='fas fa-check-circle'></i> ระบบพร้อมใช้งาน!</h4>";
            echo "<p>ทุกอย่างพร้อมแล้ว คุณสามารถใช้งาน Deploy Tool ได้</p>";
            echo "<a href='index.php' class='btn btn-success'>";
            echo "<i class='fas fa-rocket'></i> เปิด Deploy Tool";
            echo "</a>";
            echo "</div>";
        } else {
            echo "<div class='alert alert-danger'>";
            echo "<h4><i class='fas fa-exclamation-triangle'></i> พบปัญหาที่ต้องแก้ไข</h4>";
            echo "<p>กรุณาแก้ไขปัญหาที่มีสถานะ <span class='text-danger'>error</span> ก่อนใช้งาน</p>";
            echo "<a href='docs/setup-guide.html' class='btn btn-primary' target='_blank'>";
            echo "<i class='fas fa-book'></i> ดู Setup Guide";
            echo "</a>";
            echo "</div>";
        }
        ?>

        <hr>
        <div class="text-center text-muted">
            <small>
                <i class="fas fa-info-circle"></i> 
                ถ้ายังมีปัญหา ดูเอกสารเพิ่มเติมที่ 
                <a href="docs/setup-guide.html" target="_blank">docs/setup-guide.html</a>
            </small>
        </div>
    </div>
</body>
</html>
