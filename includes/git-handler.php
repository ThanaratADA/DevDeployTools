<?php
/**
 * AdaSoft Deploy Tool - Git Handler
 * Handles all Git related operations
 */

class GitHandler {
    private $config;
    
    public function __construct($config) {
        $this->config = $config;
    }
    
    public function getCommits($project, $limit = 30) {
        $projectPath = $this->config['sourcePath'] . $this->config['projects'][$project];
        
        if (!is_dir($projectPath)) {
            return ['success' => false, 'message' => 'Project path not found'];
        }
        
        // Validate and sanitize limit (10-100)
        $limit = max(10, min(100, intval($limit)));
        
        // Get current branch
        $branchCommand = "git -C \"$projectPath\" rev-parse --abbrev-ref HEAD 2>&1";
        $currentBranch = trim(shell_exec($branchCommand));
        
        // Check if actually a git repo
        if (strpos($currentBranch, 'fatal:') !== false) {
            // NEW: Auto-fix for Dubious Ownership
            if (strpos($currentBranch, 'detected dubious ownership') !== false) {
                $pathForGit = str_replace('\\', '/', $projectPath);
                shell_exec("git config --global --add safe.directory \"$pathForGit\"");
                
                // Retry getting branch
                $currentBranch = trim(shell_exec($branchCommand));
                if (strpos($currentBranch, 'fatal:') === false) {
                    // Success! Proceed to get commits
                } else {
                    $errorMsg = '<b>ตรวจพบปัญหาเรื่องสิทธิ์การเข้าถึง (Security Check)</b><br>';
                    $errorMsg .= 'ระบบพยายามแก้ไขอัตโนมัติแล้วแต่ไม่สำเร็จเนื่องจากติดสิทธิ์ของ Windows';
                    $errorMsg .= '<br><br><b>วิธีแก้ไข:</b> คัดลอกคำสั่งด้านล่างไปรันใน Command Prompt (CMD) ด้วยสิทธิ์ <b>Admin</b>:';
                    $errorMsg .= '<br><code style="display:block; padding:10px; background:#f0f0f0; margin-top:5px; color:#d63384; word-break:break-all;">git config --system --add safe.directory *</code>';
                    return ['success' => false, 'message' => $errorMsg . ' <br><br><small style="opacity:0.7;">Details: ' . $currentBranch . '</small>'];
                }
            } else {
                $errorMsg = 'ไม่พบที่จัดเก็บ Git (Repository) ในตำแหน่งที่ระบุ';
                if (strpos($currentBranch, 'No such file or directory') !== false) {
                    $errorMsg = 'ไม่พบโฟลเดอร์โปรเจกต์ตามที่ตั้งค่าไว้ (Path ไม่ถูกต้อง)';
                }
                return ['success' => false, 'message' => $errorMsg . ' <br><br><small style="opacity:0.7;">Details: ' . $currentBranch . '</small>'];
            }
        }

        // Get commits with detailed information
        // Format: hash|author|date|message
        $command = "git -C \"$projectPath\" log --pretty=format:\"%h|%an|%ai|%s\" -$limit 2>&1";
        $output = shell_exec($command);
        
        if (!$output || strpos($output, 'fatal:') !== false) {
            return ['success' => false, 'message' => 'ไม่พบประวัติการ Commit หรือ Git เกิดข้อผิดพลาด <br><small>(' . $output . ')</small>'];
        }
        
        $commits = [];
        $lines = explode("\n", trim($output));
        foreach ($lines as $line) {
            if (!empty($line)) {
                $parts = explode('|', $line, 4);
                if (count($parts) >= 4) {
                    $commits[] = [
                        'hash' => $parts[0],
                        'author' => $parts[1],
                        'date' => $parts[2],
                        'message' => $parts[3],
                        'branch' => $currentBranch
                    ];
                }
            }
        }
        
        return ['success' => true, 'commits' => $commits, 'branch' => $currentBranch];
    }
    
    public function getChangedFiles($project, $commits) {
        $projectPath = $this->config['sourcePath'] . $this->config['projects'][$project];
        
        if (!is_dir($projectPath)) {
            return ['success' => false, 'message' => 'Project path not found'];
        }
        
        $allFiles = [];
        
        foreach ($commits as $commit) {
            // ใช้ git -C เพื่อรองรับข้าม Drive
            $command = "git -C \"$projectPath\" show -m --name-only --format= $commit 2>&1";
            $output = shell_exec($command);
            
            if ($output && strpos($output, 'fatal:') === false) {
                $files = explode("\n", trim($output));
                foreach ($files as $file) {
                    if (!empty($file) && !in_array($file, $allFiles)) {
                        $allFiles[] = $file;
                    }
                }
            }
        }
        
        return ['success' => true, 'files' => $allFiles];
    }
}
?>