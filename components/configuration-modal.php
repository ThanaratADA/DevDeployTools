<?php
/**
 * AdaSoft Deploy Tool - Configuration Modal
 * Modal for managing deployment configuration
 */
?>

<!-- Configuration Modal -->
<div class="modal fade" id="configModal" tabindex="-1" role="dialog" aria-labelledby="configModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-xl" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="configModalLabel">
                    <i class="fas fa-cog"></i> ตั้งค่าระบบ Deploy
                </h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <form id="configForm" method="POST">
                <input type="hidden" name="action" value="updateConfig">
                <div class="modal-body">
                    
                    <!-- ========================================
                         SECTION 1: PATH CONFIGURATION
                         ======================================== -->
                    <div class="card card-custom mb-4">
                        <div class="card-header card-header-custom">
                            <i class="fas fa-folder"></i> การตั้งค่า Path
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="floating-label">
                                        <label>Source Path (ที่เก็บโค้ด)</label>
                                        <input type="text" class="form-control form-control-custom" name="sourcePath" 
                                               value="<?= htmlspecialchars($config['sourcePath']) ?>" required>
                                    </div>
                                    <small class="text-muted">
                                        <i class="fas fa-info-circle"></i> ตัวอย่าง: D:\WebServer\Apache24\htdocs\
                                    </small>
                                </div>
                                <div class="col-md-6">
                                    <div class="floating-label">
                                        <label>Destination Path (ที่เก็บ Deploy Package)</label>
                                        <input type="text" class="form-control form-control-custom" name="destinationPath" 
                                               value="<?= htmlspecialchars($config['destinationPath']) ?>" required>
                                    </div>
                                    <small class="text-muted">
                                        <i class="fas fa-info-circle"></i> ตัวอย่าง: D:\PackFile_Deploy\
                                    </small>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- ========================================
                         SECTION 2: PROJECTS CONFIGURATION
                         ======================================== -->
                    <div class="card card-custom mb-4">
                        <div class="card-header card-header-custom d-flex justify-content-between align-items-center">
                            <span><i class="fas fa-project-diagram"></i> โปรเจ็คทั้งหมด</span>
                            <button type="button" class="btn btn-success-custom btn-sm" onclick="addProjectRow()">
                                <i class="fas fa-plus"></i> เพิ่มโปรเจ็ค
                            </button>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-bordered">
                                    <thead style="background: var(--bg-primary);">
                                        <tr>
                                            <th width="25%">ชื่อโปรเจ็ค</th>
                                            <th width="25%">Path โปรเจ็ค</th>
                                            <th width="20%">Middle Folder</th>
                                            <th width="25%">Destination Name</th>
                                            <th width="5%">ลบ</th>
                                        </tr>
                                    </thead>
                                    <tbody id="projectsTableBody">
                                        <?php foreach ($config['projects'] as $name => $path): ?>
                                        <tr>
                                            <td>
                                                <input type="text" class="form-control form-control-sm" 
                                                       name="projectNames[]" value="<?= htmlspecialchars($name) ?>" required>
                                            </td>
                                            <td>
                                                <input type="text" class="form-control form-control-sm" 
                                                       name="projectPaths[]" value="<?= htmlspecialchars($path) ?>" required>
                                            </td>
                                            <td>
                                                <input type="text" class="form-control form-control-sm" 
                                                       name="projectMiddleFolders[]" 
                                                       value="<?= htmlspecialchars($config['projectMiddleFolders'][$name] ?? 'AdaStoreBack') ?>">
                                            </td>
                                            <td>
                                                <input type="text" class="form-control form-control-sm" 
                                                       name="projectDestNames[]" 
                                                       value="<?= htmlspecialchars($config['projectDestinationNames'][$name] ?? 'StoreBack ( Web Application )') ?>">
                                            </td>
                                            <td class="text-center">
                                                <button type="button" class="btn btn-danger-custom btn-sm" onclick="removeRow(this)">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                        <?php endforeach; ?>
                                    </tbody>
                                </table>
                            </div>
                            <small class="text-muted">
                                <i class="fas fa-lightbulb"></i> 
                                <strong>Middle Folder:</strong> โฟลเดอร์กลางระหว่าง version กับ destination (เช่น AdaStoreBack)<br>
                                <i class="fas fa-lightbulb"></i> 
                                <strong>Destination Name:</strong> ชื่อโฟลเดอร์ปลายทางที่จะเก็บไฟล์ (เช่น StoreBack ( Web Application ))
                            </small>
                        </div>
                    </div>

                    <!-- ========================================
                         SECTION 3: GOOGLE DRIVE PATHS
                         ======================================== -->
                    <div class="card card-custom mb-4">
                        <div class="card-header card-header-custom d-flex justify-content-between align-items-center">
                            <span><i class="fab fa-google-drive"></i> Google Drive Links</span>
                            <div>
                                <button type="button" class="btn btn-info-custom btn-sm" onclick="syncDriveWithProjects()">
                                    <i class="fas fa-sync"></i> Sync กับโปรเจ็ค
                                </button>
                                <button type="button" class="btn btn-success-custom btn-sm" onclick="addDriveRow()">
                                    <i class="fas fa-plus"></i> เพิ่ม Link
                                </button>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-bordered">
                                    <thead style="background: var(--bg-primary);">
                                        <tr>
                                            <th width="12%">โปรเจ็ค</th>
                                            <th width="10%">X-Patch</th>
                                            <th width="10%">X-Upgrade</th>
                                            <th width="8%">X-DB</th>
                                            <th width="8%">Unit Test</th>
                                            <th width="10%">History</th>
                                            <th width="10%">Last (CSV)</th>
                                            <th width="10%">Last (View)</th>
                                            <th width="8%">App Name</th>
                                            <th width="4%">ลบ</th>
                                        </tr>
                                    </thead>
                                    <tbody id="driveTableBody">
                                        <?php foreach ($config['googleDrivePaths'] as $project => $paths): ?>
                                        <tr>
                                            <td>
                                                <input type="text" class="form-control form-control-sm" 
                                                       name="driveProjects[]" value="<?= htmlspecialchars($project) ?>" readonly>
                                            </td>
                                            <td>
                                                <input type="text" class="form-control form-control-sm" 
                                                       name="driveXPatch[]" value="<?= htmlspecialchars($paths['xPatch'] ?? '') ?>" 
                                                       placeholder="Link">
                                            </td>
                                            <td>
                                                <input type="text" class="form-control form-control-sm" 
                                                       name="driveXUpgrade[]" value="<?= htmlspecialchars($paths['xUpgrade'] ?? '') ?>" 
                                                       placeholder="Link">
                                            </td>
                                            <td>
                                                <input type="text" class="form-control form-control-sm" 
                                                       name="driveXDatabase[]" value="<?= htmlspecialchars($paths['xDatabase'] ?? '') ?>" 
                                                       placeholder="Link">
                                            </td>
                                            <td>
                                                <input type="text" class="form-control form-control-sm" 
                                                       name="driveUnitTest[]" value="<?= htmlspecialchars($paths['unitTest'] ?? '') ?>" 
                                                       placeholder="Link">
                                            </td>
                                            <td>
                                                <input type="text" class="form-control form-control-sm" 
                                                       name="driveVersionHistory[]" value="<?= htmlspecialchars($paths['versionHistory'] ?? '') ?>" 
                                                       placeholder="Link">
                                            </td>
                                            <td>
                                                <input type="text" class="form-control form-control-sm" 
                                                       name="driveLastVersion[]" value="<?= htmlspecialchars($paths['lastVersion'] ?? '') ?>" 
                                                       placeholder="Link CSV">
                                            </td>
                                            <td>
                                                <input type="text" class="form-control form-control-sm" 
                                                       name="driveLastVersionView[]" value="<?= htmlspecialchars($paths['lastVersionView'] ?? '') ?>" 
                                                       placeholder="Link View">
                                            </td>
                                            <td>
                                                <input type="text" class="form-control form-control-sm" 
                                                       name="driveSheetAppName[]" value="<?= htmlspecialchars($paths['sheetAppName'] ?? '') ?>" 
                                                       placeholder="App Name">
                                            </td>
                                            <td class="text-center">
                                                <button type="button" class="btn btn-danger-custom btn-sm" onclick="removeRow(this)">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                        <?php endforeach; ?>
                                    </tbody>
                                </table>
                            </div>
                            <small class="text-muted">
                                <i class="fas fa-info-circle"></i> 
                                ระบุ URL ของ Google Drive และ Google Sheets สำหรับแต่ละโปรเจ็ค
                                <br>
                                <i class="fas fa-lightbulb"></i> 
                                <strong>เคล็ดลับ:</strong> คลิก "Sync กับโปรเจ็ค" เพื่อสร้างแถวให้ตรงกับโปรเจ็คที่มีอัตโนมัติ
                            </small>
                        </div>
                    </div>

                    <!-- ========================================
                         SECTION 4: README TEMPLATES
                         ======================================== -->
                    <div class="card card-custom mb-4">
                        <div class="card-header card-header-custom d-flex justify-content-between align-items-center">
                            <span><i class="fas fa-file-alt"></i> Readme Templates</span>
                            <button type="button" class="btn btn-success-custom btn-sm" onclick="addTemplateRow()">
                                <i class="fas fa-plus"></i> เพิ่ม Template
                            </button>
                        </div>
                        <div class="card-body">
                            <div id="templatesContainer">
                                <?php foreach ($config['readmeTemplates'] as $project => $template): ?>
                                <div class="template-row mb-3 p-3" style="background: var(--bg-primary); border-radius: var(--border-radius-sm);">
                                    <div class="d-flex justify-content-between align-items-center mb-2">
                                        <strong>
                                            <i class="fas fa-project-diagram"></i> 
                                            <input type="text" class="form-control form-control-sm d-inline-block" 
                                                   style="width: 200px;" name="templateProjects[]" 
                                                   value="<?= htmlspecialchars($project) ?>" readonly>
                                        </strong>
                                        <button type="button" class="btn btn-danger-custom btn-sm" onclick="removeTemplateRow(this)">
                                            <i class="fas fa-trash"></i> ลบ
                                        </button>
                                    </div>
                                    <textarea class="form-control form-control-custom" name="templateContents[]" 
                                              rows="8" style="font-family: 'Courier New', monospace; font-size: 0.85rem;"><?= htmlspecialchars($template) ?></textarea>
                                </div>
                                <?php endforeach; ?>
                            </div>
                            <div class="alert alert-info mt-3">
                                <strong><i class="fas fa-info-circle"></i> ตัวแปรที่ใช้ได้:</strong><br>
                                <code>{PROJECT}</code> - ชื่อโปรเจ็ค<br>
                                <code>{VERSION}</code> - เวอร์ชั่น<br>
                                <code>{PROBLEMS}</code> - ปัญหา<br>
                                <code>{SOLUTIONS}</code> - แก้ไข<br>
                                <code>{CONFIG}</code> - การตั้งค่า<br>
                                <code>{REMARKS}</code> - หมายเหตุ<br>
                                <code>{X_PATCH}</code> - Link X-Patch<br>
                                <code>{X_UPGRADE}</code> - Link X-Upgrade<br>
                                <code>{X_DATABASE}</code> - Link X-Database (Script)<br>
                                <code>{UNIT_TEST}</code> - Link Unit Test<br>
                                <code>{IMPACT}</code> - Link Impact Analysis<br>
                                <code>{VERSION_HISTORY}</code> - Link Version History<br>
                                <code>{LAST_VERSION}</code> - Link Last Version
                            </div>
                        </div>
                    </div>

                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">
                        <i class="fas fa-times"></i> ยกเลิก
                    </button>
                    <button type="submit" class="btn btn-primary-custom">
                        <i class="fas fa-save"></i> บันทึกการตั้งค่า
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>

<script>
// ========================================
// CONFIGURATION MODAL FUNCTIONS
// ========================================

// Add new project row
function addProjectRow() {
    const tbody = document.getElementById('projectsTableBody');
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>
            <input type="text" class="form-control form-control-sm" name="projectNames[]" placeholder="ชื่อโปรเจ็ค" required>
        </td>
        <td>
            <input type="text" class="form-control form-control-sm" name="projectPaths[]" placeholder="Path" required>
        </td>
        <td>
            <input type="text" class="form-control form-control-sm" name="projectMiddleFolders[]" value="AdaStoreBack">
        </td>
        <td>
            <input type="text" class="form-control form-control-sm" name="projectDestNames[]" value="StoreBack ( Web Application )">
        </td>
        <td class="text-center">
            <button type="button" class="btn btn-danger-custom btn-sm" onclick="removeRow(this)">
                <i class="fas fa-trash"></i>
            </button>
        </td>
    `;
    tbody.appendChild(row);
}

// Add new drive row
function addDriveRow() {
    const tbody = document.getElementById('driveTableBody');
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>
            <input type="text" class="form-control form-control-sm" name="driveProjects[]" placeholder="Project Name">
        </td>
        <td>
            <input type="text" class="form-control form-control-sm" name="driveXPatch[]" placeholder="Link">
        </td>
        <td>
            <input type="text" class="form-control form-control-sm" name="driveXUpgrade[]" placeholder="Link">
        </td>
        <td>
            <input type="text" class="form-control form-control-sm" name="driveXDatabase[]" placeholder="Link">
        </td>
        <td>
            <input type="text" class="form-control form-control-sm" name="driveUnitTest[]" placeholder="Link">
        </td>
        <td>
            <input type="text" class="form-control form-control-sm" name="driveVersionHistory[]" placeholder="Link">
        </td>
        <td>
            <input type="text" class="form-control form-control-sm" name="driveLastVersion[]" placeholder="Link CSV">
        </td>
        <td>
            <input type="text" class="form-control form-control-sm" name="driveLastVersionView[]" placeholder="Link View">
        </td>
        <td>
            <input type="text" class="form-control form-control-sm" name="driveSheetAppName[]" placeholder="App Name">
        </td>
        <td class="text-center">
            <button type="button" class="btn btn-danger-custom btn-sm" onclick="removeRow(this)">
                <i class="fas fa-trash"></i>
            </button>
        </td>
    `;
    tbody.appendChild(row);
}

// Sync Drive Links with Projects
function syncDriveWithProjects() {
    const projectNames = document.getElementsByName('projectNames[]');
    const driveProjects = document.getElementsByName('driveProjects[]');
    
    // Get existing drive project names
    const existingDriveProjects = Array.from(driveProjects).map(input => input.value.trim());
    
    // Get all project names
    const allProjects = Array.from(projectNames).map(input => input.value.trim()).filter(name => name);
    
    // Find projects that don't have drive links yet
    const missingProjects = allProjects.filter(project => !existingDriveProjects.includes(project));
    
    if (missingProjects.length === 0) {
        alert('✅ ทุกโปรเจ็คมี Google Drive Links แล้ว');
        return;
    }
    
    // Add rows for missing projects
    const tbody = document.getElementById('driveTableBody');
    missingProjects.forEach(projectName => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <input type="text" class="form-control form-control-sm" name="driveProjects[]" value="${projectName}" readonly>
            </td>
            <td>
                <input type="text" class="form-control form-control-sm" name="driveXPatch[]" placeholder="Link">
            </td>
            <td>
                <input type="text" class="form-control form-control-sm" name="driveXUpgrade[]" placeholder="Link">
            </td>
            <td>
                <input type="text" class="form-control form-control-sm" name="driveXDatabase[]" placeholder="Link">
            </td>
            <td>
                <input type="text" class="form-control form-control-sm" name="driveUnitTest[]" placeholder="Link">
            </td>
            <td>
                <input type="text" class="form-control form-control-sm" name="driveVersionHistory[]" placeholder="Link">
            </td>
            <td>
                <input type="text" class="form-control form-control-sm" name="driveLastVersion[]" placeholder="Link CSV">
            </td>
            <td>
                <input type="text" class="form-control form-control-sm" name="driveLastVersionView[]" placeholder="Link View">
            </td>
            <td>
                <input type="text" class="form-control form-control-sm" name="driveSheetAppName[]" placeholder="App Name">
            </td>
            <td class="text-center">
                <button type="button" class="btn btn-danger-custom btn-sm" onclick="removeRow(this)">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    alert(`✅ เพิ่ม Google Drive Links สำหรับ ${missingProjects.length} โปรเจ็ค:\n${missingProjects.join(', ')}`);
}


// Add new template row
function addTemplateRow() {
    const container = document.getElementById('templatesContainer');
    const div = document.createElement('div');
    div.className = 'template-row mb-3 p-3';
    div.style.cssText = 'background: var(--bg-primary); border-radius: var(--border-radius-sm);';
    div.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-2">
            <strong>
                <i class="fas fa-project-diagram"></i> 
                <input type="text" class="form-control form-control-sm d-inline-block" 
                       style="width: 200px;" name="templateProjects[]" placeholder="ชื่อโปรเจ็ค">
            </strong>
            <button type="button" class="btn btn-danger-custom btn-sm" onclick="removeTemplateRow(this)">
                <i class="fas fa-trash"></i> ลบ
            </button>
        </div>
        <textarea class="form-control form-control-custom" name="templateContents[]" 
                  rows="8" style="font-family: 'Courier New', monospace; font-size: 0.85rem;" 
                  placeholder="Deploy {PROJECT}&#10;{PROJECT} {VERSION}&#10;&#10;ปัญหา&#10;{PROBLEMS}&#10;&#10;แก้ไข&#10;{SOLUTIONS}"></textarea>
    `;
    container.appendChild(div);
}

// Remove row
function removeRow(button) {
    if (confirm('คุณต้องการลบรายการนี้หรือไม่?')) {
        button.closest('tr').remove();
    }
}

// Remove template row
function removeTemplateRow(button) {
    if (confirm('คุณต้องการลบ template นี้หรือไม่?')) {
        button.closest('.template-row').remove();
    }
}

// Handle config form submission
$(document).ready(function() {
    $('#configForm').on('submit', function(e) {
        e.preventDefault();
        
        const formData = $(this).serialize();
        
        $.ajax({
            url: '',
            method: 'POST',
            data: formData,
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    alert('✅ บันทึกการตั้งค่าสำเร็จ!\n\nกรุณา Refresh หน้าเพื่อใช้การตั้งค่าใหม่');
                    $('#configModal').modal('hide');
                    location.reload();
                } else {
                    alert('❌ เกิดข้อผิดพลาด: ' + (response.message || 'ไม่สามารถบันทึกได้'));
                }
            },
            error: function() {
                alert('❌ เกิดข้อผิดพลาดในการบันทึกการตั้งค่า');
            }
        });
    });
});
</script>

<style>
/* Additional styles for modal */
.modal-header {
    background: linear-gradient(135deg, #008f66 0%, #006648 100%) !important;
    color: white !important;
}

.modal-header .close {
    color: white !important;
    opacity: 0.8;
}

.modal-header .close:hover {
    opacity: 1;
}

.table-responsive {
    max-height: 400px;
    overflow-y: auto;
}

.table-bordered td input {
    border: 1px solid var(--border-color);
    padding: 6px 10px;
    border-radius: 4px;
}

.table-bordered td input:focus {
    outline: none;
    border-color: var(--primary-color);
}

.template-row {
    animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>
