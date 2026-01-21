// Unit Test Helper Functions
function downloadUnitTestTemplate() {
    // Get current project from select element
    const projectName = $('#projectSelect').val();

    if (!projectName) {
        alert('❌ กรุณาเลือกโปรเจ็คก่อน');
        return;
    }

    // Ask user what they want to do
    const choice = confirm(`📁 Unit Test Template สำหรับ ${projectName}\n\nเลือกวิธีที่ต้องการ:\n\n✅ OK = เปิดโฟลเดอร์ (วางไฟล์เอง)\n❌ Cancel = ดาวน์โหลด Template (ไฟล์ Excel ว่าง)`);

    if (choice) {
        // Open folder
        openTemplateFolder(projectName);
    } else {
        // Download template
        downloadBlankTemplate(projectName);
    }
}

function openTemplateFolder(projectName) {
    $.ajax({
        url: 'includes/open-folder.php',
        method: 'GET',
        dataType: 'json',
        success: function (response) {
            if (response.success) {
                alert(`✅ เปิดโฟลเดอร์แล้ว!\n\nวางไฟล์ Unit Test Template ชื่อ:\n${projectName}.xlsx\n\nหมายเหตุ: ชื่อไฟล์ต้องตรงกับชื่อโปรเจ็คทุกตัวอักษร`);
            } else {
                alert('❌ ไม่สามารถเปิดโฟลเดอร์ได้');
            }
        },
        error: function () {
            alert('❌ เกิดข้อผิดพลาดในการเปิดโฟลเดอร์');
        }
    });
}

function downloadBlankTemplate(projectName) {
    const downloadUrl = `includes/download-unittest-template.php?project=${encodeURIComponent(projectName)}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `UnitTest_${projectName}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    alert(`✅ กำลังดาวน์โหลด Unit Test Template สำหรับ ${projectName}...`);
}
