<?php
/**
 * TaskHandler - จัดการการเก็บข้อมูลรายการงาน (Tasks) ลงในไฟล์ระบบ
 */
class TaskHandler {
    private $taskRoot;

    public function __construct() {
        // กำหนด Root Folder สำหรับเก็บ Task (อยู่ที่ DevSecTools/DataBase/Task)
        $this->taskRoot = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'DataBase' . DIRECTORY_SEPARATOR . 'Task';
        if (!is_dir($this->taskRoot)) {
            @mkdir($this->taskRoot, 0777, true);
        }
    }

    /**
     * บันทึกรายการงานทั้งหมดลงในไฟล์ระบบ และแยกไฟล์ตามโปรเจ็ค
     * @param array $tasks รายการงานทั้งหมดจากฝั่ง Client
     */
    public function saveTasks($tasks) {
        try {
            // 1. บันทึกไฟล์ Master (สำหรับการโหลดกลับมาแสดงผลที่หน้าเว็บ)
            $masterFile = $this->taskRoot . DIRECTORY_SEPARATOR . 'master_tasks.json';
            file_put_contents($masterFile, json_encode($tasks, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

            // 2. แยกบันทึกไฟล์ตามโปรเจ็ค (สำหรับงานแต่ละชิ้น)
            // เราจะวนลูปบันทึกเฉพาะงานที่เพิ่งอัปเดต หรือจะบันทึกทั้งหมดใหม่ (เพื่อให้โครงสร้างโฟลเดอร์เป็นปัจจุบัน)
            foreach ($tasks as $task) {
                $projects = isset($task['projects']) ? $task['projects'] : [];
                if (empty($projects)) {
                    $projects = ['Unassigned-Project'];
                }

                foreach ($projects as $project) {
                    // โครงสร้างโฟลเดอร์: Task / {Project} / Retail /
                    $dir = $this->taskRoot . DIRECTORY_SEPARATOR . $project . DIRECTORY_SEPARATOR . 'Retail';
                    if (!is_dir($dir)) {
                        @mkdir($dir, 0777, true);
                    }

                    // ชื่อไฟล์: {โปรเจ็ค} - {วันที่เวลาสะกดตาม ID}.json 
                    // ใช้ ID ของ task (timestamp) ในการตั้งชื่อเพื่อให้เป็นเอกลักษณ์
                    $taskTime = isset($task['id']) ? date('Ymd-His', $task['id'] / 1000) : date('Ymd-His');
                    $safeProjectName = preg_replace('/[^a-zA-Z0-9_\-\.]/', '_', $project);
                    $filename = "{$safeProjectName} - {$taskTime}.json";
                    $filePath = $dir . DIRECTORY_SEPARATOR . $filename;

                    // บันทึกข้อมูลงานลงในไฟล์แยก
                    file_put_contents($filePath, json_encode($task, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
                }
            }

            return ['success' => true, 'message' => 'บันทึกข้อมูลและแยกไฟล์ลง Folder เรียบร้อยแล้ว'];
        } catch (Exception $e) {
            return ['success' => false, 'message' => 'เกิดข้อผิดพลาดในการบันทึก: ' . $e->getMessage()];
        }
    }

    /**
     * โหลดรายการงานจาก Master File
     */
    public function loadTasks() {
        $masterFile = $this->taskRoot . DIRECTORY_SEPARATOR . 'master_tasks.json';
        if (file_exists($masterFile)) {
            $data = file_get_contents($masterFile);
            return json_decode($data, true) ?: [];
        }
        return [];
    }

    /**
     * บันทึกข้อมูลร่างแบบฟอร์ม (Draft)
     */
    public function saveDraft($draftData) {
        try {
            $draftFile = $this->taskRoot . DIRECTORY_SEPARATOR . 'active_draft.json';
            file_put_contents($draftFile, json_encode($draftData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
            return ['success' => true];
        } catch (Exception $e) {
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    /**
     * โหลดข้อมูลร่างแบบฟอร์ม (Draft)
     */
    public function loadDraft() {
        $draftFile = $this->taskRoot . DIRECTORY_SEPARATOR . 'active_draft.json';
        if (file_exists($draftFile)) {
            $data = file_get_contents($draftFile);
            return json_decode($data, true) ?: null;
        }
        return null;
    }
}
