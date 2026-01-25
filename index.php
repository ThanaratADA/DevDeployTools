<?php
// Include components
require_once 'includes/config-handler.php';
require_once 'includes/git-handler.php';
require_once 'includes/deploy-handler.php';
require_once 'includes/task-handler.php';
require_once 'includes/link-handler.php';

// Initialize handlers
$configHandler = new ConfigHandler();
$config = $configHandler->loadConfig();
$gitHandler = new GitHandler($config);
$deployHandler = new DeployHandler($config);
$taskHandler = new TaskHandler();
$linkHandler = new LinkHandler();

// Handle AJAX requests
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['action'])) {
    switch ($_POST['action']) {
        case 'updateConfig':
            $configHandler->updateConfig($_POST);
            echo json_encode(['success' => true, 'message' => 'Configuration updated successfully']);
            exit;
            
        case 'getCommits':
            $limit = isset($_POST['limit']) ? intval($_POST['limit']) : 30;
            $result = $gitHandler->getCommits($_POST['project'], $limit);
            echo json_encode($result);
            exit;
            
        case 'getChangedFiles':
            $result = $gitHandler->getChangedFiles($_POST['project'], $_POST['commits']);
            echo json_encode($result);
            exit;
            
        case 'getDeployHistory':
            $result = $deployHandler->getDeployHistory($_POST['project']);
            echo json_encode($result);
            exit;
            
        case 'downloadReadme':
            $deployHandler->downloadReadme($_POST['project'], $_POST['version'], $_POST['content']);
            exit;

        // NEW: Task Board Save/Load
        case 'saveTasks':
            $tasksRaw = isset($_POST['tasks']) ? $_POST['tasks'] : '[]';
            $tasks = json_decode($tasksRaw, true) ?: [];
            $result = $taskHandler->saveTasks($tasks);
            echo json_encode($result);
            exit;

        case 'getTasks':
            $tasks = $taskHandler->loadTasks();
            echo json_encode(['success' => true, 'tasks' => $tasks]);
            exit;

        case 'saveDraft':
            $draftRaw = isset($_POST['draft']) ? $_POST['draft'] : 'null';
            $draft = json_decode($draftRaw, true);
            $result = $taskHandler->saveDraft($draft);
            echo json_encode($result);
            exit;

        case 'getDraft':
            $draft = $taskHandler->loadDraft();
            echo json_encode(['success' => true, 'draft' => $draft]);
            exit;

        // NEW: Link Center Hub
        case 'saveLinks':
            $linksRaw = isset($_POST['links']) ? $_POST['links'] : '[]';
            $links = json_decode($linksRaw, true) ?: [];
            $result = $linkHandler->saveLinks($links);
            echo json_encode($result);
            exit;

        case 'getLinks':
            $links = $linkHandler->loadLinks();
            echo json_encode(['success' => true, 'links' => $links]);
            exit;
    }
}

// Handle deployment
if ($_SERVER['REQUEST_METHOD'] == 'POST' && !isset($_POST['action'])) {
    $result = $deployHandler->deploy($_POST['project'], $_POST['version'], $_POST['deployNotes'], $_POST['filesList']);
    
    echo "<!DOCTYPE html>";
    echo "<html lang='th'>";
    echo "<head>";
    echo "<meta charset='UTF-8'>";
    echo "<meta name='viewport' content='width=device-width, initial-scale=1.0'>";
    echo "<title>Deploy Result - AdaSoft</title>";
    echo "<link rel='stylesheet' href='https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css'>";
    echo "<link rel='stylesheet' href='https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'>";
    echo "<link rel='stylesheet' href='assets/css/adasoft-theme.css'>";
    echo "</head>";
    echo "<body>";
    
    echo "<div class='main-container'>";
    
    // Success Header
    echo "<div class='alert-custom alert-success mb-4' style='font-size: 1.2rem; padding: 25px;'>";
    echo "<i class='fas fa-check-circle fa-2x' style='margin-right: 15px;'></i>";
    echo "<div style='flex: 1;'>";
    echo "<strong style='font-size: 1.3rem;'>Deploy สำเร็จ!</strong><br>";
    echo "<span style='opacity: 0.9;'>Package: " . htmlspecialchars($result['deployFolder']) . "</span>";
    echo "</div>";
    echo "</div>";
    
    // Statistics Card
    echo "<div class='row mb-4'>";
    echo "<div class='col-md-4'>";
    echo "<div class='card card-custom' style='border-left: 4px solid var(--success-color);'>";
    echo "<div class='card-body text-center'>";
    echo "<i class='fas fa-check-circle fa-3x' style='color: var(--success-color); margin-bottom: 10px;'></i>";
    echo "<h2 style='color: var(--success-color); margin: 0; font-weight: 700;'>" . $result['stats']['success'] . "</h2>";
    echo "<p style='color: var(--text-muted); margin: 0;'>ไฟล์สำเร็จ</p>";
    echo "</div>";
    echo "</div>";
    echo "</div>";
    
    if ($result['stats']['failed'] > 0) {
        echo "<div class='col-md-4'>";
        echo "<div class='card card-custom' style='border-left: 4px solid var(--danger-color);'>";
        echo "<div class='card-body text-center'>";
        echo "<i class='fas fa-times-circle fa-3x' style='color: var(--danger-color); margin-bottom: 10px;'></i>";
        echo "<h2 style='color: var(--danger-color); margin: 0; font-weight: 700;'>" . $result['stats']['failed'] . "</h2>";
        echo "<p style='color: var(--text-muted); margin: 0;'>ไฟล์ล้มเหลว</p>";
        echo "</div>";
        echo "</div>";
        echo "</div>";
    }
    
    if ($result['stats']['notFound'] > 0) {
        echo "<div class='col-md-4'>";
        echo "<div class='card card-custom' style='border-left: 4px solid var(--warning-color);'>";
        echo "<div class='card-body text-center'>";
        echo "<i class='fas fa-exclamation-triangle fa-3x' style='color: var(--warning-color); margin-bottom: 10px;'></i>";
        echo "<h2 style='color: var(--warning-color); margin: 0; font-weight: 700;'>" . $result['stats']['notFound'] . "</h2>";
        echo "<p style='color: var(--text-muted); margin: 0;'>ไฟล์ไม่พบ</p>";
        echo "</div>";
        echo "</div>";
        echo "</div>";
    }
    echo "</div>";
    
    // Deploy Information
    echo "<div class='card card-custom mb-4'>";
    echo "<div class='card-header card-header-custom'>";
    echo "<i class='fas fa-info-circle'></i> ข้อมูล Deploy Package";
    echo "</div>";
    echo "<div class='card-body'>";
    echo "<div class='row'>";
    echo "<div class='col-md-6'>";
    echo "<p><strong><i class='fas fa-folder'></i> ชื่อ Package:</strong><br>";
    echo "<code style='font-size: 1rem; padding: 8px 12px; background: var(--bg-primary); border-radius: 6px; display: inline-block; margin-top: 5px;'>" . htmlspecialchars($result['deployFolder']) . "</code></p>";
    echo "</div>";
    echo "<div class='col-md-6'>";
    echo "<p><strong><i class='fas fa-map-marker-alt'></i> ตำแหน่งไฟล์:</strong><br>";
    echo "<code style='font-size: 0.85rem; padding: 8px 12px; background: var(--bg-primary); border-radius: 6px; display: inline-block; margin-top: 5px; word-break: break-all;'>" . htmlspecialchars($result['fullPath']) . "</code></p>";
    echo "</div>";
    echo "</div>";
    echo "</div>";
    echo "</div>";
    
    // Action Buttons
    echo "<div class='card card-custom mb-4'>";
    echo "<div class='card-header card-header-custom'>";
    echo "<i class='fas fa-tasks'></i> ขั้นตอนถัดไป";
    echo "</div>";
    echo "<div class='card-body'>";
    echo "<div class='row'>";
    
    // Open Folder Button
    echo "<div class='col-md-4 mb-3'>";
    echo "<div style='padding: 20px; background: var(--bg-primary); border-radius: var(--border-radius-sm); height: 100%;'>";
    echo "<h5 style='color: var(--primary-color);'><i class='fas fa-folder-open'></i> เปิดโฟลเดอร์</h5>";
    echo "<p style='font-size: 0.9rem; color: var(--text-muted);'>ตรวจสอบไฟล์ที่ Deploy แล้ว</p>";
    echo "<button class='btn btn-primary-custom btn-custom' onclick='openFolder(\"" . addslashes($result['fullPath']) . "\")'>";
    echo "<i class='fas fa-external-link-alt'></i> เปิดโฟลเดอร์";
    echo "</button>";
    echo "</div>";
    echo "</div>";
    
    // Copy Path Button
    echo "<div class='col-md-4 mb-3'>";
    echo "<div style='padding: 20px; background: var(--bg-primary); border-radius: var(--border-radius-sm); height: 100%;'>";
    echo "<h5 style='color: var(--success-color);'><i class='fas fa-copy'></i> Copy Path</h5>";
    echo "<p style='font-size: 0.9rem; color: var(--text-muted);'>คัดลอก Path สำหรับใช้งาน</p>";
    echo "<button class='btn btn-success-custom btn-custom' onclick='copyPath(\"" . addslashes($result['fullPath']) . "\")'>";
    echo "<i class='fas fa-clipboard'></i> Copy Path";
    echo "</button>";
    echo "</div>";
    echo "</div>";
    
    // New Deploy Button
    echo "<div class='col-md-4 mb-3'>";
    echo "<div style='padding: 20px; background: var(--bg-primary); border-radius: var(--border-radius-sm); height: 100%;'>";
    echo "<h5 style='color: var(--info-color);'><i class='fas fa-plus-circle'></i> Deploy ใหม่</h5>";
    echo "<p style='font-size: 0.9rem; color: var(--text-muted);'>กลับไปหน้าหลักเพื่อ Deploy ใหม่</p>";
    echo "<a href='?' class='btn btn-info-custom btn-custom'>";
    echo "<i class='fas fa-redo'></i> Deploy ใหม่";
    echo "</a>";
    echo "</div>";
    echo "</div>";
    
    echo "</div>";
    echo "</div>";
    echo "</div>";
    
    // Checklist
    echo "<div class='card card-custom mb-4'>";
    echo "<div class='card-header card-header-custom'>";
    echo "<i class='fas fa-clipboard-check'></i> Checklist ขั้นตอนต่อไป";
    echo "</div>";
    echo "<div class='card-body'>";
    echo "<div class='checklist-item'>";
    echo "<input type='checkbox' id='check1'> <label for='check1'>Upload ไฟล์ไปยัง Google Drive (X-Patch)</label>";
    echo "</div>";
    echo "<div class='checklist-item'>";
    echo "<input type='checkbox' id='check2'> <label for='check2'>Upload ไฟล์ไปยัง Google Drive (X-Upgrade)</label>";
    echo "</div>";
    echo "<div class='checklist-item'>";
    echo "<input type='checkbox' id='check3'> <label for='check3'>Upload Script ไปยัง Google Drive (X-Database)</label>";
    echo "</div>";
    echo "<div class='checklist-item'>";
    echo "<input type='checkbox' id='check4'> <label for='check4'>อัปเดต Version ใน Google Sheet</label>";
    echo "</div>";
    echo "<div class='checklist-item'>";
    echo "<input type='checkbox' id='check5'> <label for='check5'>แจ้ง Deploy ใน Line</label>";
    echo "</div>";
    echo "<div class='checklist-item'>";
    echo "<input type='checkbox' id='check6'> <label for='check6'>ทดสอบบน Server Dev</label>";
    echo "</div>";
    echo "</div>";
    echo "</div>";
    
    echo "</div>";
    
    echo "<script src='https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js'></script>";
    echo "<script>";
    echo "function openFolder(path) {";
    echo "  window.location.href = 'file:///' + path.replace(/\\\\/g, '/');";
    echo "}";
    echo "function copyPath(path) {";
    echo "  navigator.clipboard.writeText(path).then(function() {";
    echo "    alert('✅ Copy Path สำเร็จ!\\n\\n' + path);";
    echo "  }, function() {";
    echo "    prompt('Copy Path นี้:', path);";
    echo "  });";
    echo "}";
    echo "</script>";
    echo "</body>";
    echo "</html>";
    exit;
}

if ($_SERVER['REQUEST_METHOD'] == 'GET') {
?>
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AdaSoft Deploy Tool</title>
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="assets/css/adasoft-theme.css?v=<?php echo time(); ?>">
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
    <script src="https://code.jquery.com/ui/1.12.1/jquery-ui.min.js"></script>
</head>
<body>
    <div class="main-container">
        <!-- Header Section -->
        <div class="header-section position-relative" style="padding-bottom: 60px;">
            <div class="d-flex align-items-center">
                <div class="logo-container" style="margin-right: 15px;">
                    <img src="assets/images/AdaSoftLogo.jpg" alt="AdaSoft Logo" style="height: 50px; width: auto; filter: drop-shadow(0 5px 15px rgba(0, 0, 0, 0.2));">
                </div>
                <div>
                    <h1 class="mb-0" style="color: white; font-weight: 700; font-size: 2.2rem;">AdaSoft</h1>
                    <!-- <small style="color: rgba(255,255,255,0.8); font-size: 0.9rem;">Deploy System</small> -->
                </div>
            </div>
            <p class="mb-0 mt-2"><b>AdaPos + AdaStoreBack</b></p>
            <a href="DeployOriginal/DeployProject.php" class="btn btn-danger btn-sm" style="position: absolute; right: 20px; top: 95px; border-radius: 8px; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);" target="_blank">
                <i class="fas fa-box"></i> Deploy Original
            </a>
            <a href="system-check.php" class="config-btn" style="right: 200px;" title="ตรวจสอบระบบ" target="_blank">
                <i class="fas fa-check-circle"></i>
            </a>
            <a href="docs/git-troubleshoot.html" class="config-btn" style="right: 140px;" title="แก้ปัญหา Git" target="_blank">
                <i class="fab fa-git-alt"></i>
            </a>
            <a href="docs/setup-guide.html" class="config-btn" style="right: 80px;" title="คู่มือการใช้งาน" target="_blank">
                <i class="fas fa-question-circle"></i>
            </a>
            <button type="button" class="config-btn" style="right: 20px;" data-toggle="modal" data-target="#configModal" title="ตั้งค่า">
                <i class="fas fa-cog"></i>
            </button>
        </div>


     
        <div class="card card-custom mt-4" id="linkHubPanel">
            <div class="card-header card-header-custom d-flex justify-content-between align-items-center">
                <span><i class="fas fa-link"></i> Resource Hub (ศูนย์รวมลิงก์สำคัญ)</span>
                <div class="d-flex align-items-center">
                    <button type="button" class="btn btn-sm btn-outline-light mr-2" id="btnAddLink" title="เพิ่มลิงก์ใหม่">
                        <i class="fas fa-plus"></i> เพิ่มลิงก์
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-light" id="toggleLinkHubBtn">
                        <i class="fas fa-chevron-up"></i>
                    </button>
                </div>
            </div>
            <div class="card-body">
                <div class="row" id="linkContainer">
                    <!-- Categories will be injected here: AdaPos5StoreBack, Meeting, Other (Sheet merges with Other) -->
                    <div class="col-md-6">
                        <div class="link-category-card">
                            <h6><i class="fas fa-shield-alt text-danger"></i> AdaPos5StoreBack</h6>
                            <div class="link-list" id="list-AdaPos5StoreBack" data-category="AdaPos5StoreBack"></div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="link-category-card">
                            <h6><i class="fas fa-video text-primary"></i> Meeting</h6>
                            <div class="link-list" id="list-meeting" data-category="meeting"></div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="link-category-card">
                            <h6><i class="fas fa-ellipsis-h text-muted"></i> Other & Sheet</h6>
                            <div class="link-list" id="list-other" data-category="other"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Deploy History Panel -->
        <div class="card card-custom mt-4" id="historyPanel" style="display: none;">
            <div class="card-header card-header-custom d-flex justify-content-between align-items-center">
                <span><i class="fas fa-history"></i> Deploy History</span>
                <div>
                    <button type="button" class="btn btn-sm btn-outline-light mr-2" id="toggleHistoryBtn" title="พับเก็บ/เปิดออก">
                        <i class="fas fa-chevron-up"></i>
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-light" id="refreshHistoryBtn">
                        <i class="fas fa-sync-alt"></i> Refresh
                    </button>
                </div>
            </div>
            <div class="card-body">
                <div id="deployHistory">
                    <div class="text-center text-muted">
                        <i class="fas fa-clock fa-2x mb-3"></i>
                        <p>เลือกโปรเจ็คเพื่อดู Deploy History</p>
                    </div>
                </div>
            </div>
        </div>

        <div class="row">
            <!-- Main Content Area (Full Width) -->
            <div class="col-lg-12">
                <form id="deployForm" method="POST">
                    <!-- Project & Version Selection -->
                    <div class="row equal-height-row">
                        <div class="col-lg-6 equal-height-card">
                    <div class="card card-custom">
                        <div class="card-header card-header-custom">
                            <i class="fas fa-folder-open"></i> Project Selection
                        </div>
                        <div class="card-body" style="position: relative; min-height: 200px;">
                            <div class="floating-label">
                                <label>Project</label>
                                <select class="form-control form-control-custom" id="projectSelect" name="project" required>
                                    <option value="">-- Select Project --</option>
                                    <?php foreach ($config['projects'] as $name => $path): ?>
                                        <option value="<?= htmlspecialchars($name) ?>"><?= htmlspecialchars($name) ?></option>
                                    <?php endforeach; ?>
                                </select>
                            </div>

                            <!-- NEW: Project Selection Status Indicator -->
                            <div id="projectSelectStatus" style="display: none; position: absolute; bottom: 15px; right: 20px; border: 1px solid #28a745; color: #28a745; background-color: #f6fff6; padding: 2px 12px; border-radius: 4px; font-size: 0.75rem; box-shadow: 0 2px 4px rgba(40, 167, 69, 0.1);">
                                <i class="fas fa-check-circle mr-1"></i> Select Done: <span id="projectSelectTime"></span>
                            </div>
                        </div>
                    </div>
                </div>

                
                <div class="col-lg-6 equal-height-card">
                    <div class="card card-custom">
                        <div class="card-header card-header-custom">
                            <i class="fas fa-tag"></i> Version Control
                        </div>
                        <div class="card-body" style="position: relative; min-height: 200px;">
                            <!-- Version Input Section -->
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="floating-label mb-3">
                                        <div class="input-group">
                                            <input type="text" class="form-control form-control-custom" name="version" id="oetLastVersion" placeholder=" " required>
                                            <label>Current Version</label>
                                            <div class="input-group-append">
                                                <button class="btn btn-info-custom" type="button" id="getLastVersionBtn" data-toggle="tooltip" title="ดึงเวอร์ชั่นล่าสุดจาก Sheet">
                                                    <i class="fas fa-sync"></i>
                                                </button>
                                                <button class="btn btn-success-custom" type="button" id="openLastVersionSheetBtn" data-toggle="tooltip" title="เปิด Sheet">
                                                    <i class="fas fa-external-link-alt"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="floating-label mb-3">
                                        <input type="text" class="form-control form-control-custom" name="nextVersion" id="oetNextVersion" placeholder=" " required>
                                        <label>New Version</label>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Info Section (Separated from Floating Label) -->
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="form-group mb-0">
                                        <label class="text-muted small mb-1">Last Update</label>
                                        <input type="text" class="form-control form-control-sm" id="lastUpdateDate" readonly style="background-color: #f8f9fa;">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group mb-0">
                                        <label class="text-muted small mb-1">Update By</label>
                                        <input type="text" class="form-control form-control-sm" id="lastUpdateBy" readonly style="background-color: #f8f9fa;">
                                    </div>
                                </div>
                            </div>

                            <!-- NEW: Sync Status Indicator (Absolute Positioned at Bottom Right) -->
                            <div id="syncStatus" style="display: none; position: absolute; bottom: 15px; right: 20px; border: 1px solid #28a745; color: #28a745; background-color: #f6fff6; padding: 2px 12px; border-radius: 4px; font-size: 0.75rem; box-shadow: 0 2px 4px rgba(40, 167, 69, 0.1);">
                                <i class="fas fa-check-circle mr-1"></i> Sync Done: <span id="syncTime"></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


                    <!-- NEW: Task Board Panel -->
        <div class="card card-custom mt-4" id="taskBoardPanel">
            <div class="card-header card-header-custom d-flex justify-content-between align-items-center">
                <div class="d-flex align-items-center">
                    <span><i class="fas fa-tasks"></i> Task Board (รายการที่ต้องทำ)</span>
                </div>
                
                <div class="d-flex align-items-center">
                    <!-- Mini Calendar Widget -->
                    <div class="mini-calendar-widget" id="miniCalendar">
                        <div class="calendar-day-box" id="openCalendarPicker" style="position: relative; cursor: pointer;" title="คลิกเพื่อเลือกวันที่">
                            <span class="month" id="calMonth">...</span>
                            <span class="date" id="calDate">..</span>
                            <!-- Hidden Date Input attached to the box for perfect anchor -->
                            <input type="date" id="realDateInput" style="position: absolute; top:0; left:0; width:100%; height:100%; opacity:0; cursor:pointer; z-index:5;">
                        </div>
                        <div class="calendar-info">
                            <span class="day-name" id="calDayName">Loading...</span>
                            <span class="full-date" id="calFullDate">Fetching date...</span>
                        </div>
                        
                        <div class="calendar-nav ml-2">
                            <button type="button" class="cal-nav-btn" id="prevDay" title="ย้อนหลัง" style="position: relative; z-index: 6;"><i class="fas fa-chevron-left"></i></button>
                            <button type="button" class="cal-nav-btn" id="btnShowFullCal" title="เลือกวันที่" style="position: relative; z-index: 6;"><i class="fas fa-calendar-alt"></i></button>
                            <button type="button" class="cal-nav-btn" id="nextDay" title="ล่วงหน้า" style="position: relative; z-index: 6;"><i class="fas fa-chevron-right"></i></button>
                        </div>
                    </div>

                    <div class="header-actions">
                        <button type="button" class="btn btn-sm btn-outline-light mr-1" id="toggleTaskHistoryBtn" title="ดูประวัติงานที่เสร็จแล้ว">
                            <i class="fas fa-history"></i> History
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-light mr-1" id="toggleTaskBoardBtn" title="พับเก็บ/เปิดออก">
                            <i class="fas fa-chevron-up"></i>
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-light" id="clearAllTasksBtn" title="ล้างรายการงานทั้งหมด">
                            <i class="fas fa-trash-alt"></i> ล้าง
                        </button>
                    </div>
                </div>
            </div>
            <div class="card-body">
                <!-- NEW: Task History Panel (Initially Hidden) -->
                <div id="taskHistoryPanel" class="task-history-container mb-4" style="display: none;">
                    <div class="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                        <div class="d-flex align-items-center">
                            <h6 class="mb-0 text-primary mr-3"><i class="fas fa-check-circle"></i> ประวัติงานที่เสร็จแล้ว (History)</h6>
                            <select class="form-control form-control-sm" id="historyLimit" style="width: 130px; border-radius: 8px;">
                                <option value="5" selected>แสดง 5 รายการ</option>
                                <option value="10">แสดง 10 รายการ</option>
                                <option value="30">แสดง 30 รายการ</option>
                                <option value="50">แสดง 50 รายการ</option>
                                <option value="all">แสดงทั้งหมด</option>
                            </select>
                        </div>
                        <span class="badge badge-pill badge-success" id="completedTasksCount">0 รายการ</span>
                    </div>
                    <div id="taskHistoryList" class="task-history-list">
                        <!-- History items will be injected here -->
                    </div>
                </div>

                <!-- Row 1: Main Task Info -->
                <div class="row mb-3">
                    <div class="col-md-8">
                        <div class="floating-label mb-3">
                            <input type="text" class="form-control form-control-custom" id="oetTaskName" placeholder=" ">
                            <label>รายการที่ต้องทำ (Task Name)...</label>
                        </div>
                        
                        <!-- NEW: Multi-Project Selection -->
                        <div class="project-selection-wrapper p-2 border rounded shadow-sm bg-light">
                            <label class="d-block mb-1 font-weight-bold text-primary" style="font-size: 0.85rem;">
                                <i class="fas fa-project-diagram mr-1"></i> เลือกโปรเจ็คที่เกี่ยวข้อง:
                            </label>
                            <div class="d-flex flex-wrap" id="taskProjectList" style="gap: 10px;">
                                <!-- Checkboxes will be injected here via JS -->
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="d-flex flex-column justify-content-between h-100">
                            <div class="priority-selector-modern">
                                <div class="d-flex" style="gap: 12px; margin-bottom: 15px;" id="priorityChoices">
                                    <div class="priority-choice" data-value="high" title="เร่งด่วน (แดง)">
                                        <span class="color-dot bg-danger"></span>
                                    </div>
                                    <div class="priority-choice" data-value="medium" title="สำคัญ (ส้ม)">
                                        <span class="color-dot bg-warning"></span>
                                    </div>
                                    <div class="priority-choice active" data-value="low" title="ทั่วไป (ฟ้า)">
                                        <span class="color-dot bg-info"></span>
                                    </div>
                                </div>
                                <input type="hidden" id="ocmTaskPriority" value="low">
                            </div>
                            
                            <button type="button" class="btn btn-primary-custom w-100 font-weight-bold" id="btnAddTask" style="height: 45px; border-radius: 10px; font-size: 1rem;">
                                <i class="fas fa-plus"></i> สร้างงาน สร้างอาชีพ
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Row 2: Additional Details -->
                <div class="row g-2 mb-4 align-items-end">
                    <div class="col-md-6">
                        <div class="floating-label mb-0">
                            <input type="text" class="form-control form-control-custom" id="oetTaskRefUrl" placeholder=" ">
                            <label>Ref Sheet (URL)...</label>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="floating-label mb-0">
                            <input type="text" class="form-control form-control-custom" id="oetTaskNote" placeholder=" ">
                            <label>Note (เช่น Function, Script, Testing)...</label>
                        </div>
                    </div>
                </div>
                
                <div id="taskListContainer" class="task-list-modern">
                    <!-- Tasks will be injected here via JS -->
                    <div class="text-center text-muted py-4">
                        <i class="fas fa-clipboard-list fa-2x mb-2 opacity-50"></i>
                        <p>ยังไม่มีรายการงานที่ต้องทำในตอนนี้</p>
                    </div>
                </div>
            </div>
        </div>

        

            <div class="section-divider"></div>
            <!-- Git Commits & Files Section -->
            <div class="row equal-height-row">
                <div class="col-lg-6 equal-height-card">
                    <div class="card card-custom">
                        <div class="card-header card-header-custom d-flex justify-content-between align-items-center">
                            <span><i class="fab fa-git-alt"></i> Git Commits</span>
                            <div class="d-flex align-items-center">
                                <select class="form-control form-control-sm" id="commitsLimit" style="width: 80px; font-size: 0.85rem;">
                                    <option value="10">10</option>
                                    <option value="20">20</option>
                                    <option value="30" selected>30</option>
                                    <option value="50">50</option>
                                    <option value="100">100</option>
                                </select>
                                <span class="ml-2" style="font-size: 0.85rem; color: rgba(255,255,255,0.9);">Commits</span>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="commits-container" id="commitsList">
                                <div class="text-center text-muted">
                                    <i class="fas fa-info-circle fa-2x mb-3"></i>
                                    <p>กรุณาเลือกโปรเจ็คก่อนเพื่อดู commits</p>
                                </div>
                            </div>
                            <div class="mt-3 text-center">
                                <button type="button" class="btn-load-files-modern" id="loadFilesBtn" disabled>
                                    <i class="fas fa-download"></i> Load Files Path
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-lg-6 equal-height-card">
                    <div class="card card-custom">
                        <div class="card-header card-header-custom d-flex justify-content-between align-items-center">
                            <span><i class="fas fa-file-code"></i> Files to Deploy</span>
                             <button type="button" class="btn btn-sm btn-danger" id="clearFilesBtn" title="ล้างรายการไฟล์" style="width: 30px; height: 30px; border-radius: 50%; padding: 0; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,0.3); box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                                 <i class="fas fa-trash-alt" style="font-size: 0.8rem;"></i>
                             </button>
                        </div>
                        <div class="card-body">
                            <textarea class="form-control files-textarea" id="filesList" name="filesList" rows="15" placeholder="ไฟล์จะแสดงที่นี่หลังจากเลือก commits หรือสามารถพิมพ์เพิ่มเติมได้"></textarea>
                            <div class="mt-2">
                                <small class="text-muted">
                                    <i class="fas fa-lightbulb"></i> 
                                    คุณสามารถแก้ไขรายการไฟล์ได้โดยตรง หรือเพิ่มไฟล์เพิ่มเติม
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <!-- Deploy Notes Section -->
            <div class="card card-custom">
                <div class="card-header card-header-custom d-flex justify-content-between align-items-center">
                    <span><i class="fas fa-sticky-note"></i> Deploy Notes & Documentation</span>
                    <div>
                        <button type="button" class="btn btn-info-custom btn-sm py-2 px-3 mr-1" id="loadFromTaskBoardBtn" style="border-radius: 8px;">
                            <i class="fas fa-tasks"></i> โหลดจาก Task Board
                        </button>
                        <button type="button" class="btn btn-warning-custom btn-sm py-2 px-3 mr-1" id="loadTemplateBtn" style="border-radius: 8px;">
                            <i class="fas fa-file-import"></i> Load Template
                        </button>
                        <button type="button" class="btn btn-success-custom btn-sm py-2 px-3" id="downloadReadmeBtn" style="border-radius: 8px;">
                            <i class="fas fa-download"></i> Download Readme
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <label><i class="fas fa-clipboard-list"></i> ปัญหา (Problems):</label>
                            <textarea class="form-control form-control-custom" id="problemsText" rows="4" placeholder=""></textarea>
                        </div>
                        <div class="col-md-6">
                            <label><i class="fas fa-tools"></i> แก้ไข (Solutions):</label>
                            <textarea class="form-control form-control-custom" id="solutionsText" rows="4" placeholder=""></textarea>
                        </div>
                    </div>
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <label><i class="fas fa-cogs"></i> การตั้งค่า (Config):</label>
                            <textarea class="form-control form-control-custom" id="configText" rows="2" placeholder=""></textarea>
                        </div>
                        <div class="col-md-6">
                            <label><i class="fas fa-comment"></i> หมายเหตุ (Remarks):</label>
                            <textarea class="form-control form-control-custom" id="remarksText" rows="2" placeholder=""></textarea>
                        </div>
                    </div>
                    <div class="form-group">
                        <label><i class="fas fa-file-alt"></i> Deploy Notes (Full Content):</label>
                        <textarea class="form-control form-control-custom" id="deployNotes" name="deployNotes" rows="12" placeholder="เนื้อหาทั้งหมดจะแสดงที่นี่..." required></textarea>
                        <small class="text-muted mt-2">
                            <i class="fas fa-info-circle"></i> 
                            คุณสามารถแก้ไขเนื้อหาได้โดยตรง หรือใช้ฟิลด์ด้านบนเพื่อสร้างเนื้อหาอัตโนมัติ
                        </small>
                    </div>
                </div>
            </div>
            <div class="section-divider"></div>

            <!-- Google Drive Links Section -->
            <div class="card card-custom">
                <div class="card-header card-header-custom d-flex justify-content-between align-items-center">
                    <div class="d-flex align-items-center">
                        <span class="mr-3"><i class="fab fa-google-drive"></i> Google Drive Links</span>
                        <button type="button" class="btn btn-sm btn-warning-custom btn-icon-round" id="autoFillLinksBtn" title="ดึงลิงก์เริ่มต้น" style="width: 30px; height: 30px; border-radius: 50%; padding: 0; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,0.3); box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                            <i class="fas fa-rotate-right" style="font-size: 0.8rem;"></i>
                        </button>
                    </div>
                    <div id="quickAccessButtons" style="display: none;">
                        <div class="d-flex flex-column" style="gap: 5px;">
                            <!-- Row 1: Drive Folders -->
                            <div class="d-flex" style="gap: 5px;">
                                <button type="button" class="btn btn-sm btn-outline-light" id="openXPatchBtn" title="เปิด X-Patch Center" style="flex: 1; min-width: 180px;">
                                    <i class="fas fa-external-link-alt"></i> X-Patch
                                </button>
                                <button type="button" class="btn btn-sm btn-outline-light" id="openXUpgradeBtn" title="เปิด X-Upgrade Center" style="flex: 1; min-width: 180px;">
                                    <i class="fas fa-external-link-alt"></i> X-Upgrade
                                </button>
                                <button type="button" class="btn btn-sm btn-outline-light" id="openXDatabaseBtn" title="เปิด X-Database Center" style="flex: 1; min-width: 180px;">
                                    <i class="fas fa-external-link-alt"></i> X-Database
                                </button>
                            </div>
                            <!-- Row 2: Templates & Sheets -->
                            <div class="d-flex" style="gap: 5px;">
                                <button type="button" class="btn btn-sm btn-outline-light" id="openUnitTestBtn" title="ดาวน์โหลด Unit Test Template" style="flex: 1; min-width: 180px;">
                                    <i class="fas fa-download"></i> Unit Test Template
                                </button>
                                <button type="button" class="btn btn-sm btn-outline-light" id="openVersionHistoryBtn" title="เปิด Version History Sheet" style="flex: 1; min-width: 180px;">
                                    <i class="fas fa-table"></i> Version History
                                </button>
                                <button type="button" class="btn btn-sm btn-outline-light" id="openLastVersionBtn" title="เปิด Current Version Sheet (View)" style="flex: 1; min-width: 180px;">
                                    <i class="fas fa-external-link-alt"></i> Current Version
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="alert alert-info mb-3">
                        <i class="fas fa-info-circle"></i> 
                        <strong>คำแนะนำ:</strong> กรอก Link ของโฟลเดอร์ที่สร้างใหม่สำหรับ Version นี้ 
                        (ระบบจะดึงลิงก์เริ่มต้นจากที่ตั้งค่าไว้ให้โดยอัตโนมัติ)
                        <br>
                        <i class="fas fa-lightbulb"></i> 
                        <strong>เคล็ดลับ:</strong> คลิกปุ่มด้านบนเพื่อเปิด Google Drive/Sheets Center ของโปรเจ็คนี้
                    </div>
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <label><i class="fas fa-folder"></i> X-Patch Link:</label>
                            <div class="input-group">
                                <input type="text" class="form-control form-control-custom" id="linkXPatch" 
                                       placeholder="">
                                <div class="input-group-append">
                                    <button class="btn btn-success-custom" type="button" id="openLinkXPatch" title="เปิด Link">
                                        <i class="fas fa-external-link-alt"></i>
                                    </button>
                                </div>
                            </div>
                            <small class="text-danger font-weight-bold">
                                <i class="fas fa-exclamation-triangle"></i> ต้องกรอกเอง! สร้างโฟลเดอร์ใหม่สำหรับ Version นี้
                            </small>
                        </div>
                        <div class="col-md-6">
                            <label><i class="fas fa-folder"></i> X-Upgrade Link:</label>
                            <div class="input-group">
                                <input type="text" class="form-control form-control-custom" id="linkXUpgrade" 
                                       placeholder="">
                                <div class="input-group-append">
                                    <button class="btn btn-success-custom" type="button" id="openLinkXUpgrade" title="เปิด Link">
                                        <i class="fas fa-external-link-alt"></i>
                                    </button>
                                </div>
                            </div>
                             <small class="text-muted">
                                <i class="fas fa-info-circle"></i> ดึงลิงก์อัตโนมัติ (หรือกรอกเอง)
                            </small>
                        </div>
                    </div>
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <label><i class="fas fa-database"></i> X-Database Link:</label>
                            <div class="input-group">
                                <input type="text" class="form-control form-control-custom" id="linkXDatabase" 
                                       placeholder="https://drive.google.com/drive/folders/...">
                                <div class="input-group-append">
                                    <button class="btn btn-success-custom" type="button" id="openLinkXDatabase" title="เปิด Link">
                                        <i class="fas fa-external-link-alt"></i>
                                    </button>
                                </div>
                            </div>
                            <small class="text-muted">
                                <i class="fas fa-lightbulb"></i> Link ของโฟลเดอร์ X-Database (Script) สำหรับ Version นี้
                            </small>
                        </div>
                        <div class="col-md-6">
                            <label><i class="fas fa-vial"></i> Unit Test Link:</label>
                            <div class="input-group">
                                <input type="text" class="form-control form-control-custom" id="linkUnitTest" 
                                       placeholder="">
                                <div class="input-group-append">
                                    <button class="btn btn-success-custom" type="button" id="openLinkUnitTest" title="เปิด Link">
                                        <i class="fas fa-external-link-alt"></i>
                                    </button>
                                </div>
                            </div>
                            <small class="text-danger font-weight-bold">
                                <i class="fas fa-exclamation-triangle"></i> ต้องกรอกเอง! สร้างโฟลเดอร์ใหม่สำหรับ Version นี้
                            </small>
                        </div>
                    </div>
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <label class="text-primary font-weight-bold"><i class="fas fa-file-alt"></i> Impact Link:</label>
                            <div class="input-group">
                                <input type="text" class="form-control form-control-custom" id="linkImpact" 
                                       placeholder="">
                                <div class="input-group-append">
                                    <button class="btn btn-success-custom" type="button" id="openLinkImpact" title="เปิด Link">
                                        <i class="fas fa-external-link-alt"></i>
                                    </button>
                                </div>
                            </div>
                            <small class="text-primary font-weight-bold">
                                <i class="fas fa-lightbulb"></i> Link ของโฟลเดอร์ Impact Analysis (ถ้ามี)
                            </small>
                        </div>
                        <!-- <div class="col-md-6">
                             <small class="text-muted">
                                <i class="fas fa-info-circle"></i> ใช้ปุ่ม <i class="fas fa-magic text-warning"></i> ด้านบนเพื่อดึงลิงก์ X-Upgrade และ X-Database อัตโนมัติ
                            </small>
                        </div> -->
                    </div>
                </div>
            </div>

            <div class="section-divider"></div>



            <!-- Deploy Button -->
            <div class="text-center mt-4">
                <button type="submit" class="btn btn-primary-custom btn-custom btn-lg icon-btn pulse-animation">
                    <i class="fas fa-rocket"></i> Deploy Package
                </button>
            </div>
                </form>
            </div> <!-- End Main Content (Col-12) -->
        </div> <!-- End Row -->

        <!-- Quick Notes Floating Button -->
        <button type="button" class="floating-notes-btn" data-toggle="modal" data-target="#quickNotesModal" title="Quick Notes">
            <i class="fas fa-sticky-note"></i>
        </button>

        <!-- Quick Notes Modal -->
        <div class="modal fade" id="quickNotesModal" tabindex="-1" role="dialog" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered" role="document">
                <div class="modal-content border-0 shadow-lg" style="border-radius: 15px;">
                    <div class="modal-header bg-warning text-white" style="border-radius: 15px 15px 0 0;">
                        <h5 class="modal-title font-weight-bold"><i class="fas fa-sticky-note mr-2"></i>Quick Notes / Reminder</h5>
                        <button type="button" class="close text-white" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body p-0">
                        <textarea id="otaQuickNotes" class="form-control border-0 p-4" rows="10" 
                                  placeholder="บันทึกข้อความสั้นๆ ที่นี่... (ข้อมูลจะถูกบันทึกอัตโนมัติ)" 
                                  style="resize: none; font-size: 1rem; line-height: 1.6; background-color: #ffffv8; color: #555;"></textarea>
                    </div>
                </div>
            </div>
        </div>

      
        <div id="deployResult"></div>
    </div>

    <?php include 'components/configuration-modal.php'; ?>

    <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/js/bootstrap.min.js"></script>
    <script>
        // Pass config to JavaScript
        window.deployConfig = <?= json_encode($config) ?>;
    </script>
    <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
    <script src="assets/js/deploy-functions.js?v=<?php echo time(); ?>"></script>
    <script src="assets/js/resource-hub.js?v=<?php echo time(); ?>"></script>

    <script>
    // Unit Test Template Functions (Global)
    function downloadUnitTestTemplate() {
        const projectName = $('#projectSelect').val();
        
        if (!projectName) {
            alert('❌ กรุณาเลือกโปรเจ็คก่อน');
            return;
        }
        
        // Google Drive Master Template
        const googleSheetId = "1JI1iyxKwxclFWcKmdYcF9jAnlqH1Rc78";
        const url = `https://docs.google.com/spreadsheets/d/${googleSheetId}/export?format=xlsx`;
        
        window.location.href = url;
        alert(`✅ กำลังเริ่มดาวน์โหลด Unit Test Template...`);
    }

    $(document).ready(function() {
        // Deploy Checklist Interaction
        $('#deployProgressList input[type="checkbox"]').on('change', function() {
            const label = $(this).closest('label');
            if ($(this).is(':checked')) {
                label.addClass('text-success font-weight-bold').removeClass('text-primary bg-light');
                if (label.find('.fa-check-circle').length === 0) {
                    label.append('<i class="fas fa-check-circle float-right mt-1"></i>');
                }
                const nextLabel = label.next('label');
                if(nextLabel.length && !nextLabel.find('input').is(':checked')) {
                    nextLabel.addClass('text-primary font-weight-bold bg-light');
                }
            } else {
                label.removeClass('text-success font-weight-bold').addClass('text-primary font-weight-bold bg-light');
                label.find('.fa-check-circle').remove();
            }
        });

        // Quick Notes Logic
        const otaNotes = $('#otaQuickNotes');
        const savedNotes = localStorage.getItem('deploy_quick_notes');
        if (savedNotes) otaNotes.val(savedNotes);
        otaNotes.on('input', function() {
            localStorage.setItem('deploy_quick_notes', $(this).val());
        });
        $('#btnClearNotes').on('click', function() {
            if (confirm('คุณต้องการล้างโน๊ตทั้งหมดใช่หรือไม่?')) {
                otaNotes.val('');
                localStorage.removeItem('deploy_quick_notes');
            }
        });
    });
    </script>

    <!-- Radio Player Widget -->
    <div class="radio-widget-btn" id="radioWidgetBtn" title="ฟังวิทยุออนไลน์">
        <i class="fas fa-broadcast-tower"></i>
        <div class="radio-visualizer-mini" id="radioVisualizerMini" style="display: none;">
            <span></span><span></span><span></span><span></span>
        </div>
    </div>

    <!-- NEW: Edit Task Modal -->
    <div class="modal fade" id="modalEditTask" tabindex="-1" role="dialog" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-centered" role="document">
            <div class="modal-content border-0 shadow-lg" style="border-radius: 20px; overflow: hidden;">
                <div class="modal-header bg-primary-custom text-white border-0 py-3">
                    <h5 class="modal-title font-weight-bold"><i class="fas fa-edit mr-2"></i> แก้ไขรายการงาน (Edit Task)</h5>
                    <button type="button" class="close text-white" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body p-4 bg-light">
                    <input type="hidden" id="editTaskId">
                    
                    <div class="row g-3">
                        <div class="col-md-9">
                            <div class="form-group mb-4">
                                <label class="small font-weight-bold text-muted mb-1 ml-1">ชื่อรายการงาน (Task Name):</label>
                                <input type="text" class="form-control form-control-lg shadow-sm border-0" id="editTaskName" style="border-radius: 12px; font-size: 1rem;">
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="form-group mb-4">
                                <label class="small font-weight-bold text-muted mb-1 ml-1"></label>
                                <div class="priority-selector-modern mt-1">
                                    <div class="d-flex" style="gap: 12px;" id="editPriorityChoices">
                                        <div class="priority-choice edit-priority-choice" data-value="high" title="เร่งด่วน (แดง)">
                                            <span class="color-dot bg-danger"></span>
                                        </div>
                                        <div class="priority-choice edit-priority-choice" data-value="medium" title="สำคัญ (ส้ม)">
                                            <span class="color-dot bg-warning"></span>
                                        </div>
                                        <div class="priority-choice edit-priority-choice" data-value="low" title="ทั่วไป (ฟ้า)">
                                            <span class="color-dot bg-info"></span>
                                        </div>
                                    </div>
                                    <input type="hidden" id="editTaskPriority" value="low">
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="row g-3">
                        <div class="col-md-6">
                            <div class="form-group mb-4">
                                <label class="small font-weight-bold text-muted mb-1 ml-1">Ref Sheet (URL):</label>
                                <input type="text" class="form-control shadow-sm border-0" id="editTaskUrl" style="border-radius: 10px;">
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-group mb-4">
                                <label class="small font-weight-bold text-muted mb-1 ml-1">Note (บันทึกย่อ):</label>
                                <input type="text" class="form-control shadow-sm border-0" id="editTaskNote" style="border-radius: 10px;">
                            </div>
                        </div>
                    </div>

                    <div class="form-group mb-4">
                        <label class="small font-weight-bold text-primary mb-2 ml-1 d-block">
                            <i class="fas fa-project-diagram mr-1"></i> โปรเจ็คที่เกี่ยวข้อง (Project Selection):
                        </label>
                        <div class="project-selection-wrapper p-3 border-0 shadow-sm bg-white" style="border-radius: 15px;">
                            <div class="d-flex flex-wrap" id="editTaskProjectList" style="gap: 12px;">
                                <!-- Checkboxes injected via JS -->
                            </div>
                        </div>
                    </div>

                    <div class="form-group mb-4">
                        <label class="small font-weight-bold text-muted mb-1 ml-1">รายละเอียดการดำเนินการ (Details):</label>
                        <textarea class="form-control shadow-sm border-0" id="editTaskDetails" rows="4" style="border-radius: 15px;" placeholder="ระบุการทำงานหรือรายละเอียดเพิ่มเติม..."></textarea>
                    </div>

                    <div class="row g-3">
                        <div class="col-md-6">
                            <div class="form-group mb-0">
                                <label class="small font-weight-bold text-muted mb-1 ml-1"><i class="fas fa-calendar-altmr-1"></i> วันที่คาดว่าเสร็จ / เสร็จจริง:</label>
                                <input type="date" class="form-control shadow-sm border-0" id="editTaskDate" style="border-radius: 10px;">
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-group mb-0">
                                <label class="small font-weight-bold text-muted mb-1 ml-1">สถานะ Phase (Phases Status):</label>
                                <div class="d-flex" style="gap: 10px;" id="editTaskPhaseGroup">
                                    <button class="phase-btn flex-fill py-2" data-phase="phaseFunc">Function</button>
                                    <button class="phase-btn flex-fill py-2" data-phase="phaseScript">Script</button>
                                    <button class="phase-btn flex-fill py-2" data-phase="phaseTest">Testing</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer bg-white border-0 p-3">
                    <button type="button" class="btn btn-secondary-custom px-4" data-dismiss="modal" style="border-radius: 10px;">ยกเลิก</button>
                    <button type="button" class="btn btn-primary-custom px-5 font-weight-bold" id="btnSaveEditTask" style="border-radius: 10px;">
                        <i class="fas fa-save mr-2"></i> บันทึกการแก้ไข
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- NEW: Modal Load from Task Board -->
    <div class="modal fade" id="modalLoadTask" tabindex="-1" role="dialog" aria-hidden="true">
        <div class="modal-dialog modal-xl modal-dialog-centered" role="document">
            <div class="modal-content border-0 shadow-lg" style="border-radius: 20px; overflow: hidden;">
                <div class="modal-header bg-info-custom text-white border-0 py-3">
                    <h5 class="modal-title font-weight-bold"><i class="fas fa-tasks mr-2"></i> โหลดรายการงานจาก Task Board</h5>
                    <button type="button" class="close text-white" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body p-4 bg-light">
                    <!-- Filters Section -->
                    <div class="row g-3 mb-4 p-3 bg-white shadow-sm" style="border-radius: 15px;">
                        <div class="col-md-3">
                            <label class="small font-weight-bold text-muted mb-1 ml-1">ตั้งแต่วันที่:</label>
                            <input type="date" class="form-control" id="loadTaskStartDate" style="border-radius: 10px;">
                        </div>
                        <div class="col-md-3">
                            <label class="small font-weight-bold text-muted mb-1 ml-1">ถึงวันที่:</label>
                            <input type="date" class="form-control" id="loadTaskEndDate" style="border-radius: 10px;">
                        </div>
                        <div class="col-md-4">
                            <label class="small font-weight-bold text-muted mb-1 ml-1">กรองตามโปรเจ็ค:</label>
                            <select class="form-control" id="loadTaskProjectFilter" style="border-radius: 10px;">
                                <option value="all">-- ทั้งหมด --</option>
                                <?php foreach ($config['projects'] as $name => $path): ?>
                                    <option value="<?= htmlspecialchars($name) ?>"><?= htmlspecialchars($name) ?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <div class="col-md-2 align-self-end">
                            <button type="button" class="btn btn-primary-custom btn-block" id="btnFilterImportTasks" style="border-radius: 10px;">
                                <i class="fas fa-search"></i> ค้นหา
                            </button>
                        </div>
                    </div>

                    <!-- Task List Section -->
                    <div class="table-responsive bg-white shadow-sm" style="border-radius: 15px; max-height: 400px; overflow-y: auto;">
                        <table class="table table-hover mb-0">
                            <thead class="bg-primary-custom text-white">
                                <tr>
                                    <th width="40" class="text-center">
                                        <div class="custom-control custom-checkbox">
                                            <input type="checkbox" class="custom-control-input" id="checkAllTasksImport">
                                            <label class="custom-control-label" for="checkAllTasksImport"></label>
                                        </div>
                                    </th>
                                    <th width="150">โปรเจ็ค</th>
                                    <th>หัวข้องาน (Task Name)</th>
                                    <th width="80" class="text-center">ความสำคัญ</th>
                                    <th width="140" class="text-center">วันที่ทำสำเร็จ</th>
                                </tr>
                            </thead>
                            <tbody id="importTasksTableBody">
                                <!-- Tasks will be injected here via JS -->
                            </tbody>
                        </table>
                    </div>
                    <div id="noTasksFoundMessage" class="text-center py-5" style="display: none;">
                        <i class="fas fa-folder-open fa-3x text-muted mb-3"></i>
                        <p class="text-muted">ไม่พบรายการงานที่ตรงตามเงื่อนไข</p>
                    </div>
                </div>
                <div class="modal-footer bg-white border-0 p-3">
                    <div class="mr-auto ml-3">
                        <span class="badge badge-info py-2 px-3" id="importTaskCount">เลือก 0 รายการ</span>
                    </div>
                    <button type="button" class="btn btn-secondary-custom px-4" data-dismiss="modal" style="border-radius: 10px;">ยกเลิก</button>
                    <button type="button" class="btn btn-info-custom px-5 font-weight-bold" id="btnConfirmImportTasks" style="border-radius: 10px;">
                        <i class="fas fa-file-import mr-2"></i> โหลดเข้า Deploy Notes
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- NEW: Sub-Modal for Task Solution -->
    <div class="modal fade" id="modalImportTaskSolution" tabindex="-1" role="dialog" aria-hidden="true" style="z-index: 1060;">
        <div class="modal-dialog modal-dialog-centered" role="document">
            <div class="modal-content border-0 shadow-lg" style="border-radius: 20px;">
                <div class="modal-header bg-dark text-white border-0 py-3">
                    <h6 class="modal-title font-weight-bold"><i class="fas fa-tools mr-2"></i> ระบุการแก้ไข (Solution)</h6>
                    <button type="button" class="close text-white" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body p-4">
                    <input type="hidden" id="importTaskSolId">
                    <div class="mb-3">
                        <label class="small font-weight-bold text-muted d-block mb-1">หัวข้องาน:</label>
                        <div id="importTaskSolName" class="p-2 bg-light rounded font-weight-bold" style="font-size: 0.9rem;"></div>
                    </div>
                    <div class="form-group mb-0">
                        <label class="small font-weight-bold text-primary d-block mb-2">รายละเอียดการแก้ไข (Solutions Description):</label>
                        <textarea class="form-control border-0 shadow-sm" id="importTaskSolText" rows="6" style="border-radius: 15px; background: #f8fafc;" placeholder="ระบุว่าแก้ไขอย่างไร..."></textarea>
                    </div>
                </div>
                <div class="modal-footer border-0 p-3">
                    <button type="button" class="btn btn-secondary-custom px-4" data-dismiss="modal">ยกเลิก</button>
                    <button type="button" class="btn btn-primary-custom px-4" id="btnSaveImportTaskSol">ตกลง</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Modern Radio Player Panel -->
    <div class="radio-player-panel" id="radioPlayerPanel">
        <div class="radio-header-modern">
            <div class="d-flex align-items-center">
                <div class="live-indicator">
                    <span class="live-dot"></span>
                    LIVE
                </div>
                <h6 class="m-0 ml-2 font-weight-bold">Radio Selection</h6>
            </div>
            <button type="button" class="radio-close-btn" id="closeRadioPanel">
                <i class="fas fa-times"></i>
            </button>
        </div>
        
        <div class="radio-body-modern">
            <!-- Station Info with Mini Visualizer -->
            <div class="radio-info-container text-center">
                <div class="visualizer-wrapper mb-2">
                    <div class="mini-visualizer" id="miniVisualizer">
                        <span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span>
                    </div>
                </div>
                <h5 class="station-name-main" id="currentStationName"><i class="fas fa-music"></i></h5>
                <p class="station-status-sub" id="radioStatusText">พร้อมสตรีมรายการสด</p>
            </div>

            <!-- Station Selection -->
            <div class="station-selector-wrapper mt-3">
                <select class="radio-select-modern" id="radioStationSelect">
                    <optgroup label="ฮิตระดับโลก (Top 40)">
                        <option value="http://prmstrm.1.fm:8000/top40" selected>FM Absolute Top 40</option>
                        <option value="http://prmstrm.1.fm:8000/top40ballads">FM Top 40 Ballads</option>
                        <option value="http://stream.nonstopplay.co.uk/nsp-128k-mp3">NonStopPlay UK Hit Music</option>
                    </optgroup>
                    <optgroup label="ชิลล์ & สบาย (Relax)">
                        <option value="https://stream.radioparadise.com/mp3-192">Radio Paradise Main</option>
                        <option value="https://stream.radioparadise.com/mellow-192">Radio Paradise Mellow</option>
                        <option value="https://stream.radioparadise.com/rock-192">Radio Paradise Rock</option>
                    </optgroup>
                </select>
            </div>

            <!-- Main Controls -->
            <div class="radio-controls-main mt-4">
                <div class="volume-side-control">
                    <i class="fas fa-volume-down volum-icon"></i>
                </div>
                
                <button class="radio-main-play-btn" id="radioPlayBtn" title="เล่น/หยุด">
                    <i class="fas fa-play"></i>
                </button>

                <div class="volume-side-control">
                    <div class="volume-popup">
                        <input type="range" class="volume-slider-vertical" id="radioVolume" min="0" max="1" step="0.1" value="0.5">
                    </div>
                    <i class="fas fa-volume-up volum-icon"></i>
                </div>
            </div>
            
            <div class="volume-horizontal-container mt-3">
                 <input type="range" class="volume-slider-modern" id="radioVolumeH" min="0" max="1" step="0.05" value="0.5">
            </div>
        </div>
        
        <audio id="mainAudioPlayer" style="display:none;"></audio>
    </div>
    <!-- Floating Help Button -->
    <div class="floating-help-btn" id="floatingHelpBtn" title="ต้องการความช่วยเหลือ?">
        <i class="fas fa-question-circle"></i>
    </div>

    <!-- NEW: Radio Invitation Modal -->
    <div class="modal fade" id="modalRadioInvite" tabindex="-1" role="dialog" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered" role="document" style="max-width: 400px;">
            <div class="modal-content border-0 shadow-lg" style="border-radius: 20px; overflow: hidden;">
                <div class="modal-body p-0">
                    <div class="p-4 text-center" style="background: linear-gradient(135deg, #008f66 0%, #00b380 100%); color: white;">
                        <div class="mb-3">
                            <i class="fas fa-headphones-alt fa-4x mb-3 animate__animated animate__pulse animate__infinite" style="filter: drop-shadow(0 5px 15px rgba(0,0,0,0.2));"></i>
                        </div>
                        <h4 class="font-weight-bold mb-2"></h4>
                        <p class="mb-0 opacity-80">ฟังเพลงหน่อยไหม?</p>
                    </div>
                    <div class="p-4 bg-white text-center">
                        <div class="d-flex flex-column gap-2">
                            <button type="button" class="btn btn-primary-custom btn-lg w-100 mb-2" id="btnAcceptRadio" style="border-radius: 12px; height: 55px;">
                                <i class="fas fa-play-circle mr-2"></i> ฟังเพลงกันเลย!
                            </button>
                            <button type="button" class="btn btn-link text-muted" data-dismiss="modal">
                                ไว้ก่อนนะ
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Help Modal -->
    <div class="modal fade" id="modalHelpTask" tabindex="-1" role="dialog" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered" role="document">
            <div class="modal-content help-modal-content border-0 shadow-lg">
                <div class="modal-header help-modal-header py-3">
                    <h5 class="modal-title font-weight-bold"><i class="fas fa-lightbulb mr-2"></i> ระบบช่วยเหลือผู้ช่วยอัจฉริยะ</h5>
                    <button type="button" class="close text-white" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body p-4 text-center">
                    <div id="helpQuestionArea">
                        <i class="fas fa-tasks fa-3x text-primary mb-3"></i>
                        <h4 class="font-weight-bold mb-3">ประสบปัญหาเรื่อง Task อยู่ใช่ไหม?</h4>
                        <p class="text-muted">หากคุณกำลังติดขัดเรื่องความคืบหน้าของงาน หรือต้องการคำปรึกษาเพิ่มเติม</p>
                        <div class="d-flex justify-content-center mt-4" style="gap: 15px;">
                            <button type="button" class="btn btn-primary-custom px-5" id="btnHelpYes">ใช่ครับ/ค่ะ</button>
                            <button type="button" class="btn btn-outline-secondary px-5" data-dismiss="modal">ไม่เป็นไร</button>
                        </div>
                    </div>
                    <div id="helpResponseArea" style="display: none;">
                        <i class="fas fa-user-tie fa-4x text-success mb-3"></i>
                        <h3 class="font-weight-bold text-success mb-2">ไม่ต้องกังวลไป!</h3>
                        <div class="p-4 bg-light rounded-lg shadow-sm mb-3">
                            <h4 id="secretMessage" class="m-0 font-weight-bold text-dark"></h4>
                        </div>
                        <button type="button" class="btn btn-secondary-custom px-4" data-dismiss="modal">รับทราบครับ</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <!-- NEW: Modal for Add/Edit Link -->
    <div class="modal fade" id="modalLinkEdit" tabindex="-1" role="dialog" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered" role="document">
            <div class="modal-content border-0 shadow-lg" style="border-radius: 15px;">
                <div class="modal-header bg-primary-custom text-white" style="border-radius: 15px 15px 0 0;">
                    <h5 class="modal-title font-weight-bold" id="linkModalTitle">จัดการลิงก์</h5>
                    <button type="button" class="close text-white" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body p-4">
                    <form id="formLink">
                        <input type="hidden" id="linkId">
                        <div class="form-group mb-3">
                            <label class="small font-weight-bold">หมวดหมู่ (Category):</label>
                            <select class="form-control form-control-custom" id="linkCategory" required>
                                <option value="AdaPos5StoreBack">AdaPos5StoreBack (User/Pass)</option>
                                <option value="sheet">Sheet (เอกสาร)</option>
                                <option value="meeting">Meeting (ห้องประชุม)</option>
                                <option value="other">Other (ทรัพยากรอื่นๆ)</option>
                            </select>
                        </div>
                        <div class="form-group mb-3">
                            <label class="small font-weight-bold">หัวข้อ/คำอธิบาย:</label>
                            <input type="text" class="form-control form-control-custom" id="linkTitle" placeholder="เช่น Sheet สรุปงาน Dev" required>
                        </div>
                        <div class="form-group mb-3">
                            <label class="small font-weight-bold">URL (ลิงก์):</label>
                            <input type="url" class="form-control form-control-custom" id="linkUrl" placeholder="https://..." required>
                        </div>
                        
                        <!-- Dynamic Fields based on category -->
                        <div id="extraFields">
                            <!-- AdaPos5StoreBack Fields -->
                            <div class="extra-AdaPos5StoreBack d-none">
                                <div id="credentials-container">
                                    <!-- Dynamic Credential Items will be injected here -->
                                </div>
                                <button type="button" class="btn btn-sm btn-outline-success mt-2 w-100 dashed-btn" id="btnAddCredential">
                                    <i class="fas fa-plus-circle"></i> เพิ่ม User
                                </button>
                                
                                <div class="form-group mt-3 mb-0">
                                    <label class="small font-weight-bold">Server Tier:</label>
                                    <select class="form-control form-control-custom" id="linkServerTier">
                                        <option value="DEV">DEV (Development)</option>
                                        <option value="SIT">SIT (System Integration Test)</option>
                                        <option value="CS">CS (Customer Service / Support)</option>
                                        <option value="PROD">PROD (Production)</option>
                                    </select>
                                </div>
                            </div>
                            <!-- Sheet Fields -->
                            <div class="extra-sheet d-none">
                                <div class="form-group mb-0">
                                    <label class="small font-weight-bold">ประเภท Sheet:</label>
                                    <select class="form-control form-control-custom" id="linkSheetType">
                                        <option value="Work">สำหรับงาน</option>
                                        <option value="Knowledge">Knowledge Center</option>
                                        <option value="Center">Work Center</option>
                                    </select>
                                </div>
                            </div>
                            <!-- Meeting Fields -->
                            <div class="extra-meeting d-none">
                                <div class="form-group mb-0">
                                    <label class="small font-weight-bold">ประเภท Meeting:</label>
                                    <select class="form-control form-control-custom" id="linkMeetingType">
                                        <option value="Private">Meeting ส่วนตัว</option>
                                        <option value="Team">Meeting Team</option>
                                        <option value="Dev">Meeting Dev</option>
                                    </select>
                                </div>
                            </div>
                            
                            <!-- Other Fields (Optional User/Pass) -->
                            <!-- Other Fields (Optional User/Pass) -->
                            <div class="extra-other d-none">
                                <div class="alert alert-light border small text-muted mb-2 p-2">
                                    <i class="fas fa-info-circle"></i> Username/Password ใส่หรือไม่ก็ได้
                                </div>
                                <div class="row">
                                    <div class="col-6">
                                        <div class="form-group mb-0">
                                            <label class="small font-weight-bold">Username (Optional):</label>
                                            <input type="text" class="form-control form-control-custom" id="linkOtherUser">
                                        </div>
                                    </div>
                                    <div class="col-6">
                                        <div class="form-group mb-0">
                                            <label class="small font-weight-bold">Password (Optional):</label>
                                            <input type="text" class="form-control form-control-custom" id="linkOtherPass">
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Custom Color Picker (Common for Meeting/Sheet/Other but controlled by JS visibility) -->
                            <div class="form-group mt-3 mb-0" id="customColorGroup" style="display:none;">
                                <label class="small font-weight-bold">Custom Background Color (Optional):</label>
                                <div class="d-flex align-items-center">
                                    <input type="color" class="form-control form-control-color mr-2" id="linkCustomBgColor" value="#ffffff" title="Choose your color" style="width: 50px;">
                                    <small class="text-muted">เลือกสีพื้นหลังที่ต้องการ (ระบบจะคำนวณสีตัวอักษรให้อัตโนมัติ)</small>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer border-0">
                    <button type="button" class="btn btn-secondary" data-dismiss="modal" style="border-radius: 10px;">ยกเลิก</button>
                    <button type="button" class="btn btn-primary-custom px-4" id="btnSaveLink" style="border-radius: 10px;">บันทึกข้อมูล</button>
                </div>
            </div>
        </div>
    </div>
</body>
</html>

<?php } ?>