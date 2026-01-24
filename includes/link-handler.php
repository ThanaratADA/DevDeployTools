<?php
/**
 * LinkHandler - จัดการการเก็บข้อมูล Link สำคัญลงในไฟล์ center_link.json
 */
class LinkHandler {
    private $linkFile;

    public function __construct() {
        $this->linkFile = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'center_link.json';
    }

    /**
     * บันทึกรายการ Link ทั้งหมดลงในไฟล์
     */
    public function saveLinks($links) {
        try {
            file_put_contents($this->linkFile, json_encode($links, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
            return ['success' => true];
        } catch (Exception $e) {
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    /**
     * โหลดรายการ Link ทั้งหมดจากไฟล์
     */
    public function loadLinks() {
        if (file_exists($this->linkFile)) {
            $data = file_get_contents($this->linkFile);
            return json_decode($data, true) ?: [];
        }
        return [];
    }
}
