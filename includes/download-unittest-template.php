<?php
/**
 * Download Unit Test Template
 * Generates and downloads a blank Excel template for unit testing
 */

require_once __DIR__ . '/../vendor/autoload.php';

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;

// Get project name
$project = $_GET['project'] ?? 'Template';
$safeProject = preg_replace('/[^a-zA-Z0-9._-]/', '', $project);

// Create new spreadsheet
$spreadsheet = new Spreadsheet();
$sheet = $spreadsheet->getActiveSheet();

// Set title
$sheet->setTitle('Unit Test');

// Header row
$sheet->setCellValue('A1', 'Unit Test Template - ' . $safeProject);
$sheet->mergeCells('A1:F1');
$sheet->getStyle('A1')->getFont()->setBold(true)->setSize(16);
$sheet->getStyle('A1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
$sheet->getStyle('A1')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FF4472C4');
$sheet->getStyle('A1')->getFont()->getColor()->setARGB('FFFFFFFF');
$sheet->getRowDimension(1)->setRowHeight(30);

// Column headers
$headers = ['No.', 'Test Case', 'Input', 'Expected Output', 'Actual Output', 'Status'];
$col = 'A';
foreach ($headers as $header) {
    $sheet->setCellValue($col . '2', $header);
    $sheet->getStyle($col . '2')->getFont()->setBold(true);
    $sheet->getStyle($col . '2')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FFD9E1F2');
    $sheet->getStyle($col . '2')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
    $col++;
}

// Set column widths
$sheet->getColumnDimension('A')->setWidth(8);
$sheet->getColumnDimension('B')->setWidth(30);
$sheet->getColumnDimension('C')->setWidth(25);
$sheet->getColumnDimension('D')->setWidth(25);
$sheet->getColumnDimension('E')->setWidth(25);
$sheet->getColumnDimension('F')->setWidth(12);

// Add sample rows
for ($i = 3; $i <= 12; $i++) {
    $sheet->setCellValue('A' . $i, $i - 2);
    $sheet->getStyle('A' . $i)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
}

// Add borders
$sheet->getStyle('A1:F12')->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);

// Set headers for download
header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
header('Content-Disposition: attachment; filename="UnitTest_' . $safeProject . '.xlsx"');
header('Cache-Control: max-age=0');

// Write file
$writer = new Xlsx($spreadsheet);
$writer->save('php://output');
exit;
