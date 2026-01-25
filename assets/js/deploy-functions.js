/**
 * AdaSoft Deploy Tool - JavaScript Functions
 * Handles all client-side interactions and AJAX calls
 */

(function () {
    'use strict';

    // ========================================
    // 1. GLOBAL VARIABLES
    // ========================================
    let selectedCommits = [];
    let currentProject = '';
    let saveDraftTimer = null; // NEW: สำหรับหน่วงเวลาการเซฟ Draft
    let filteredImportTasks = []; // NEW: เก็บรายการ Task ที่กรองมาเพื่อ Import
    let importTaskSolutions = {}; // NEW: เก็บ Solution ที่พิมพ์แยกตอน Import (Key=ID, Value=Text)
    let selectedImportTaskIds = []; // NEW: เก็บ ID งานที่เลือกไว้เพื่อ persistence

    // ========================================
    // 2. INITIALIZATION
    // ========================================
    $(document).ready(function () {
        initializeEventHandlers();
        loadSavedData();
    });

    // ========================================
    // 3. EVENT HANDLERS INITIALIZATION
    // ========================================
    function initializeEventHandlers() {
        // Project selection change
        $('#projectSelect').on('change', handleProjectChange);

        // Load files button
        $('#loadFilesBtn').on('click', handleLoadFiles);

        // Clear files button
        $('#clearFilesBtn').on('click', handleClearFiles);

        // Load template button
        $('#loadTemplateBtn').on('click', handleLoadTemplate);

        // Download readme button
        $('#downloadReadmeBtn').on('click', handleDownloadReadme);

        // Load from Task Board button (Modified to open MODAL instead of auto-loading)
        $(document).on('click', '#loadFromTaskBoardBtn', function (e) {
            e.preventDefault();
            // trigger the logic inside our Task Board module
            if (typeof $('#loadFromTaskBoardBtn').click === 'function') {
                // Ensure default dates if empty
                if (!$('#loadTaskStartDate').val()) {
                    const today = new Date().toISOString().split('T')[0];
                    $('#loadTaskStartDate').val(today);
                    $('#loadTaskEndDate').val(today);
                }
                if (currentProject) $('#loadTaskProjectFilter').val(currentProject);

                // Call the render function we defined in the Task Board scope
                // Since it's inside a closure, we trigger the click on the same button 
                // but we need to prevent recursion if we use the same ID.
                // However, the new logic we added later in the file is also bound to this ID.
                // To be safe, just open the modal and call the render function.
                $('#modalLoadTask').modal('show');
                // The filterAndRenderImportTasks will be called by the other listener
            }
        });

        // Refresh history button
        $('#refreshHistoryBtn').on('click', handleRefreshHistory);

        // Toggle History button
        $('#toggleHistoryBtn').on('click', function () {
            const cardBody = $('#historyPanel').find('.card-body');
            const icon = $(this).find('i');

            cardBody.slideToggle();

            if (icon.hasClass('fa-chevron-up')) {
                icon.removeClass('fa-chevron-up').addClass('fa-chevron-down');
            } else {
                icon.removeClass('fa-chevron-down').addClass('fa-chevron-up');
            }
        });

        // Form submission
        $('#deployForm').on('submit', handleFormSubmit);

        // Auto-update deploy notes when problems/solutions change
        $('#problemsText, #solutionsText, #remarksText, #configText').on('input', updateDeployNotes);

        // Auto-update deploy notes when links change
        $('#linkXPatch, #linkXUpgrade, #linkXDatabase, #linkUnitTest, #linkImpact').on('input', updateDeployNotes);

        // Auto-fill links button
        $('#autoFillLinksBtn').on('click', handleAutoFillLinks);

        // Open Link Buttons (next to input fields)
        $('#openLinkXPatch').on('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Opening X-Patch link');
            openInputLink('linkXPatch');
        });
        $('#openLinkXUpgrade').on('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Opening X-Upgrade link');
            openInputLink('linkXUpgrade');
        });
        $('#openLinkXDatabase').on('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Opening X-Database link');
            openInputLink('linkXDatabase');
        });
        $('#openLinkUnitTest').on('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Opening Unit Test link');
            openInputLink('linkUnitTest');
        });
        $('#openLinkImpact').on('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Opening Impact link');
            openInputLink('linkImpact');
        });

        // Quick Access Buttons
        $('#openXPatchBtn').on('click', function () { openGoogleDriveLink('xPatch'); });
        $('#openXUpgradeBtn').on('click', function () { openGoogleDriveLink('xUpgrade'); });
        $('#openXDatabaseBtn').on('click', function () { openGoogleDriveLink('xDatabase'); });
        $('#openUnitTestBtn').on('click', function () { downloadUnitTestTemplate(); });
        $('#openVersionHistoryBtn').on('click', function () { openGoogleDriveLink('versionHistory'); });

        // ปุ่ม Current Version (ชุดขวาล่าง) - เปิด View Link ตรงๆ
        $('#openLastVersionBtn').on('click', function () {
            if (!currentProject) { showAlert('warning', 'กรุณาเลือกโปรเจ็คก่อน'); return; }
            const drivePaths = window.deployConfig.googleDrivePaths[currentProject] || {};
            const url = drivePaths.lastVersionView || drivePaths.lastVersion;
            if (url) {
                window.open(url, '_blank');
            } else {
                showAlert('warning', 'ไม่พบ Link ใน Config');
            }
        });

        // Get Last Version from Sheet
        $('#getLastVersionBtn').on('click', handleGetLastVersion);

        // Commits limit change
        console.log('Binding commitsLimit change event, element exists:', $('#commitsLimit').length > 0);
        $('#commitsLimit').on('change', handleCommitsLimitChange);

        // Open Last Version Sheet (View)
        // Open Last Version Sheet (View)
        $('#openLastVersionSheetBtn').on('click', function () {
            if (!currentProject) {
                showAlert('warning', 'กรุณาเลือกโปรเจ็คก่อน');
                return;
            }
            const drivePaths = window.deployConfig.googleDrivePaths[currentProject] || {};

            // หยิบ Link จากหน้า Config (ช่อง View) มาเปิดตรงๆ เลย
            const url = drivePaths.lastVersionView || drivePaths.lastVersion;

            if (!url) {
                showAlert('warning', 'ไม่พบ Link ใน Config');
                return;
            }

            window.open(url, '_blank');
        });

        // Save form data on input
        $('#deployForm input, #deployForm textarea, #deployForm select').on('change input', saveFormData);

        // Version increment logic
        $('#oetLastVersion').on('input', updateNextVersion);
    }

    // ========================================
    // 4. PROJECT CHANGE HANDLER
    // ========================================
    function handleProjectChange() {
        currentProject = $(this).val();

        // Update select styling
        if (currentProject) {
            $(this).removeClass('text-muted').addClass('text-primary');

            // Update Project Select Status with current time
            const now = new Date();
            const dateTimeStr = now.toLocaleDateString('th-TH') + ' ' + now.toLocaleTimeString('th-TH', { hour12: false });
            $('#projectSelectTime').text(dateTimeStr);
            $('#projectSelectStatus').fadeIn();
        } else {
            $(this).removeClass('text-primary').addClass('text-muted');
            $('#projectSelectStatus').fadeOut();
        }

        if (!currentProject) {
            resetCommitsList();
            resetHistory();
            clearLinks();
            return;
        }

        // Auto-fill links from base configuration
        autoFillLinksFromConfig();

        // NEW: Auto-sync Version Control from Sheet
        handleGetLastVersion();

        // Update quick access buttons
        updateQuickAccessButtons();

        // Show loading state
        showCommitsLoading();

        // Get commits limit from dropdown
        const commitsLimit = $('#commitsLimit').val() || 30;

        // Load commits via AJAX
        $.ajax({
            url: '',
            method: 'POST',
            data: {
                action: 'getCommits',
                project: currentProject,
                limit: commitsLimit
            },
            dataType: 'json',
            success: function (response) {
                if (response.success) {
                    displayCommits(response.commits);
                    // Update branch display if available
                    if (response.branch) {
                        updateBranchDisplay(response.branch);
                    }
                } else {
                    showCommitsError(response.message);
                }
            },
            error: function () {
                showCommitsError('เกิดข้อผิดพลาดในการโหลด commits');
            }
        });

        // Load deploy history
        loadDeployHistory();
    }

    // ========================================
    // 5. COMMITS DISPLAY
    // ========================================
    function displayCommits(commits) {
        const container = $('#commitsList');
        container.empty();

        if (!commits || commits.length === 0) {
            container.html(`
                <div class="text-center text-muted">
                    <i class="fas fa-inbox fa-2x mb-3"></i>
                    <p>ไม่พบ commits</p>
                </div>
            `);
            return;
        }

        commits.forEach(function (commit) {
            // Format date
            const commitDate = new Date(commit.date);
            const dateStr = commitDate.toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            const timeStr = commitDate.toLocaleTimeString('th-TH', {
                hour: '2-digit',
                minute: '2-digit'
            });

            const commitItem = $(`
                <div class="commit-item" data-hash="${commit.hash}">
                    <input type="checkbox" class="commit-checkbox" value="${commit.hash}">
                    <div class="commit-details">
                        <div class="commit-header">
                            <span class="commit-hash">${commit.hash}</span>
                            <span class="commit-branch">
                                <i class="fas fa-code-branch"></i> ${escapeHtml(commit.branch)}
                            </span>
                        </div>
                        <div class="commit-message">${escapeHtml(commit.message)}</div>
                        <div class="commit-meta">
                            <span class="commit-author">
                                <i class="fas fa-user"></i> ${escapeHtml(commit.author)}
                            </span>
                            <span class="commit-date">
                                <i class="fas fa-calendar"></i> ${dateStr}
                            </span>
                            <span class="commit-time">
                                <i class="fas fa-clock"></i> ${timeStr}
                            </span>
                        </div>
                    </div>
                </div>
            `);

            // Click handler for commit item
            commitItem.on('click', function (e) {
                if (e.target.type !== 'checkbox') {
                    const checkbox = $(this).find('.commit-checkbox');
                    checkbox.prop('checked', !checkbox.prop('checked')).trigger('change');
                }
            });

            // Checkbox change handler
            commitItem.find('.commit-checkbox').on('change', function () {
                const hash = $(this).val();
                const isChecked = $(this).prop('checked');

                if (isChecked) {
                    selectedCommits.push(hash);
                    $(this).closest('.commit-item').addClass('selected');
                } else {
                    selectedCommits = selectedCommits.filter(h => h !== hash);
                    $(this).closest('.commit-item').removeClass('selected');
                }

                // Enable/disable load files button
                $('#loadFilesBtn').prop('disabled', selectedCommits.length === 0);
            });

            container.append(commitItem);
        });
    }

    function showCommitsLoading() {
        $('#commitsList').html(`
            <div class="text-center">
                <div class="spinner"></div>
                <p class="text-muted mt-3">กำลังโหลด commits...</p>
            </div>
        `);
        $('#loadFilesBtn').prop('disabled', true);
    }

    function showCommitsError(message) {
        $('#commitsList').html(`
            <div class="text-center text-danger">
                <i class="fas fa-exclamation-triangle fa-2x mb-3"></i>
                <p>${message}</p>
            </div>
        `);
    }

    function resetCommitsList() {
        $('#commitsList').html(`
            <div class="text-center text-muted">
                <i class="fas fa-info-circle fa-2x mb-3"></i>
                <p>กรุณาเลือกโปรเจ็คก่อนเพื่อดู commits</p>
            </div>
        `);
        selectedCommits = [];
        $('#loadFilesBtn').prop('disabled', true);
        // Clear branch display
        $('#currentBranch').remove();
    }

    function updateBranchDisplay(branch) {
        // Remove existing branch display
        $('#currentBranch').remove();

        // Add branch display to card header
        const branchBadge = $(`
            <span id="currentBranch" style="margin-left: 15px; font-size: 0.9rem; color: rgba(255,255,255,0.9);">
                <i class="fas fa-code-branch"></i> ${escapeHtml(branch)}
            </span>
        `);

        $('.card-header-custom:contains("Git Commits Selection")').append(branchBadge);
    }

    // ========================================
    // 6. LOAD FILES HANDLER
    // ========================================
    function handleLoadFiles() {
        if (selectedCommits.length === 0) {
            showAlert('warning', 'กรุณาเลือก commits ก่อน');
            return;
        }

        // Show loading state
        const btn = $(this);
        const originalHtml = btn.html();
        btn.html('<i class="fas fa-spinner fa-spin"></i> กำลังโหลด...').prop('disabled', true);

        $.ajax({
            url: '',
            method: 'POST',
            data: {
                action: 'getChangedFiles',
                project: currentProject,
                commits: selectedCommits
            },
            dataType: 'json',
            success: function (response) {
                if (response.success) {
                    const currentFiles = $('#filesList').val().trim();
                    const newFiles = response.files.join('\n');

                    if (currentFiles) {
                        // Merge with existing files (remove duplicates)
                        const allFiles = [...new Set([...currentFiles.split('\n'), ...response.files])];
                        $('#filesList').val(allFiles.join('\n'));
                    } else {
                        $('#filesList').val(newFiles);
                    }

                    showAlert('success', `โหลดไฟล์สำเร็จ: ${response.files.length} ไฟล์`);

                    // Scroll to files textarea
                    $('html, body').animate({
                        scrollTop: $('#filesList').offset().top - 100
                    }, 500);
                } else {
                    showAlert('danger', response.message);
                }
            },
            error: function () {
                showAlert('danger', 'เกิดข้อผิดพลาดในการโหลดไฟล์');
            },
            complete: function () {
                btn.html(originalHtml).prop('disabled', false);
            }
        });
    }

    // ========================================
    // 7. CLEAR FILES HANDLER
    // ========================================
    function handleClearFiles() {
        if (confirm('คุณต้องการล้างรายการไฟล์ทั้งหมดหรือไม่?')) {
            $('#filesList').val('');
            showAlert('info', 'ล้างรายการไฟล์แล้ว');
        }
    }

    // ========================================
    // 8. TEMPLATE HANDLER
    // ========================================
    function handleLoadTemplate() {
        if (!currentProject) {
            showAlert('warning', 'กรุณาเลือกโปรเจ็คก่อน');
            return;
        }

        const template = window.deployConfig.readmeTemplates[currentProject];
        if (!template) {
            showAlert('warning', 'ไม่พบ template สำหรับโปรเจ็คนี้');
            return;
        }

        // Get current values
        const problems = $('#problemsText').val().trim();
        const solutions = $('#solutionsText').val().trim();
        const remarks = $('#remarksText').val().trim();
        const configText = $('#configText').val().trim();
        const version = $('input[name="version"]').val().trim();

        // Get Google Drive Links from form
        const linkXPatch = $('#linkXPatch').val().trim();
        const linkXUpgrade = $('#linkXUpgrade').val().trim();
        const linkXDatabase = $('#linkXDatabase').val().trim();
        const linkUnitTest = $('#linkUnitTest').val().trim();
        const linkImpact = $('#linkImpact').val().trim();

        // Replace placeholders
        let content = template;
        content = content.replace(/{PROJECT}/g, currentProject);
        content = content.replace(/{VERSION}/g, version || 'XX.XX.XX.XX.XX.XX');
        content = content.replace(/{PROBLEMS}/g, problems || '- ระบุปัญหาที่นี่');
        content = content.replace(/{SOLUTIONS}/g, solutions || '- ระบุวิธีแก้ไขที่นี่');
        content = content.replace(/{REMARKS}/g, remarks || '- ไม่มี');
        content = content.replace(/{CONFIG}/g, configText || '- ไม่มี');

        // Replace Google Drive Links (use form values, fallback to base config)
        const drivePaths = window.deployConfig.googleDrivePaths[currentProject] || {};
        content = content.replace(/{X_PATCH}/g, linkXPatch || drivePaths.xPatch || 'ไม่มี');
        content = content.replace(/{X_UPGRADE}/g, linkXUpgrade || drivePaths.xUpgrade || 'ไม่มี');
        content = content.replace(/{X_DATABASE}/g, linkXDatabase || drivePaths.xDatabase || 'ไม่มี');
        content = content.replace(/{UNIT_TEST}/g, linkUnitTest || drivePaths.unitTest || 'ไม่มี');
        content = content.replace(/{IMPACT}/g, linkImpact || drivePaths.impact || 'ไม่มี');
        content = content.replace(/{VERSION_HISTORY}/g, drivePaths.versionHistory || 'ไม่มี');

        // Use View Link (Center) for Readme content, fallback to CSV link if view link is missing
        content = content.replace(/{LAST_VERSION}/g, drivePaths.lastVersionView || drivePaths.lastVersion || 'ไม่มี');

        $('#deployNotes').val(content);
        showAlert('success', 'โหลด template สำเร็จ');
    }

    // ========================================
    // 8.1 LOAD FROM TASK BOARD HANDLER
    // ========================================
    function handleLoadTasksFromBoard() {
        try {
            const tasksJson = localStorage.getItem('ada_deploy_tasks');
            if (!tasksJson || tasksJson === '[]') {
                showAlert('warning', 'ไม่พบรายการงานใน Task Board (กรุณาเพิ่มงานก่อน)');
                return;
            }

            let tasks = JSON.parse(tasksJson);
            const completedTasks = tasks.filter(t => t.completed === true);

            if (completedTasks.length === 0) {
                showAlert('warning', 'ไม่พบรายการงานที่ "ติ๊กถูก" ใน Task Board');
                return;
            }

            let taskTexts = completedTasks.map(t => {
                let line = `- ${t.name}`;
                if (t.details && t.details.trim() !== "") {
                    line += `: ${t.details.trim()}`;
                }
                return line;
            });

            const newText = taskTexts.join('\n');
            const $problemsField = $('#problemsText');

            const currentVal = $problemsField.val().trim();
            if (currentVal) {
                $problemsField.val(currentVal + '\n' + newText);
            } else {
                $problemsField.val(newText);
            }

            showAlert('success', `โหลดงานจาก Task Board สำเร็จ (${completedTasks.length} รายการ)`);

            if (typeof updateDeployNotes === 'function') {
                updateDeployNotes();
            }

        } catch (err) {
            console.error('Error loading tasks:', err);
            showAlert('danger', 'เกิดข้อผิดพลาด: ' + err.message);
        }
    }

    // ========================================
    // 9. UPDATE DEPLOY NOTES
    // ========================================
    function updateDeployNotes() {
        // Auto-update only if using template format
        const currentNotes = $('#deployNotes').val();
        if (!currentNotes.includes('{')) {
            return; // Not using template format
        }

        // Trigger template load
        handleLoadTemplate();
    }

    // ========================================
    // 10. DOWNLOAD README HANDLER
    // ========================================
    function handleDownloadReadme() {
        const project = currentProject;
        const version = $('input[name="version"]').val().trim();
        const content = $('#deployNotes').val().trim();

        if (!project) {
            showAlert('warning', 'กรุณาเลือกโปรเจ็คก่อน');
            return;
        }

        if (!version) {
            showAlert('warning', 'กรุณาระบุเวอร์ชั่นก่อน');
            return;
        }

        if (!content) {
            showAlert('warning', 'กรุณาระบุ Deploy Notes ก่อน');
            return;
        }

        // Create form and submit
        const form = $('<form>', {
            method: 'POST',
            action: ''
        });

        form.append($('<input>', { type: 'hidden', name: 'action', value: 'downloadReadme' }));
        form.append($('<input>', { type: 'hidden', name: 'project', value: project }));
        form.append($('<input>', { type: 'hidden', name: 'version', value: version }));
        form.append($('<input>', { type: 'hidden', name: 'content', value: content }));

        $('body').append(form);
        form.submit();
        form.remove();

        showAlert('success', 'กำลังดาวน์โหลด Readme...');
    }

    // ========================================
    // 11. DEPLOY HISTORY
    // ========================================
    function loadDeployHistory() {
        if (!currentProject) {
            resetHistory();
            return;
        }

        $('#historyPanel').show();
        $('#deployHistory').html(`
            <div class="text-center">
                <div class="spinner"></div>
                <p class="text-muted mt-3">กำลังโหลดประวัติ...</p>
            </div>
        `);

        $.ajax({
            url: '',
            method: 'POST',
            data: {
                action: 'getDeployHistory',
                project: currentProject
            },
            dataType: 'json',
            success: function (response) {
                if (response.success) {
                    displayDeployHistory(response.history);
                } else {
                    $('#deployHistory').html(`
                        <div class="text-center text-danger">
                            <i class="fas fa-exclamation-triangle fa-2x mb-3"></i>
                            <p>เกิดข้อผิดพลาดในการโหลดประวัติ</p>
                        </div>
                    `);
                }
            },
            error: function () {
                $('#deployHistory').html(`
                    <div class="text-center text-danger">
                        <i class="fas fa-exclamation-triangle fa-2x mb-3"></i>
                        <p>เกิดข้อผิดพลาดในการโหลดประวัติ</p>
                    </div>
                `);
            }
        });
    }

    function displayDeployHistory(history) {
        const container = $('#deployHistory');
        container.empty();

        if (!history || history.length === 0) {
            container.html(`
                <div class="text-center text-muted">
                    <i class="fas fa-inbox fa-2x mb-3"></i>
                    <p>ยังไม่มีประวัติการ Deploy</p>
                </div>
            `);
            return;
        }

        history.forEach(function (item) {
            const date = new Date(item.date * 1000);
            const dateStr = date.toLocaleString('th-TH');

            const historyItem = $(`
                <div class="history-item">
                    <div class="history-header">
                        <span class="history-folder">
                            <i class="fas fa-folder"></i> ${escapeHtml(item.folder)}
                        </span>
                        <span class="history-date">
                            <i class="fas fa-clock"></i> ${dateStr}
                        </span>
                    </div>
                    <div class="history-content">${escapeHtml(item.readme)}</div>
                </div>
            `);

            container.append(historyItem);
        });
    }

    function handleRefreshHistory() {
        loadDeployHistory();
    }

    function resetHistory() {
        $('#historyPanel').hide();
        $('#deployHistory').html(`
            <div class="text-center text-muted">
                <i class="fas fa-clock fa-2x mb-3"></i>
                <p>เลือกโปรเจ็คเพื่อดู Deploy History</p>
            </div>
        `);
    }

    // ========================================
    // 12. FORM SUBMISSION
    // ========================================
    function handleFormSubmit(e) {
        // Validate form
        const project = $('#projectSelect').val();
        const version = $('input[name="version"]').val().trim();
        const filesList = $('#filesList').val().trim();
        const deployNotes = $('#deployNotes').val().trim();

        if (!project) {
            e.preventDefault();
            showAlert('warning', 'กรุณาเลือกโปรเจ็ค');
            return false;
        }

        if (!version) {
            e.preventDefault();
            showAlert('warning', 'กรุณาระบุเวอร์ชั่น');
            return false;
        }

        if (!filesList) {
            e.preventDefault();
            showAlert('warning', 'กรุณาระบุไฟล์ที่ต้องการ Deploy');
            return false;
        }

        if (!deployNotes) {
            e.preventDefault();
            showAlert('warning', 'กรุณาระบุ Deploy Notes');
            return false;
        }

        // Confirm deployment
        const confirmMsg = `คุณต้องการ Deploy โปรเจ็ค ${project} เวอร์ชั่น ${version} หรือไม่?`;
        if (!confirm(confirmMsg)) {
            e.preventDefault();
            return false;
        }

        // Show loading
        const submitBtn = $('#deployForm button[type="submit"]');
        submitBtn.html('<i class="fas fa-spinner fa-spin"></i> กำลัง Deploy...').prop('disabled', true);

        // Clear saved data after successful deployment
        clearSavedData();
    }

    // ========================================
    // 13. LOCAL STORAGE (AUTO-SAVE)
    // ========================================
    function saveFormData() {
        const formData = {
            project: $('#projectSelect').val(),
            version: $('input[name="version"]').val(),
            filesList: $('#filesList').val(),
            problemsText: $('#problemsText').val(),
            solutionsText: $('#solutionsText').val(),
            remarksText: $('#remarksText').val(),
            configText: $('#configText').val(),
            deployNotes: $('#deployNotes').val(),
            // Save Google Drive Links
            linkXPatch: $('#linkXPatch').val(),
            linkXUpgrade: $('#linkXUpgrade').val(),
            linkXDatabase: $('#linkXDatabase').val(),
            linkUnitTest: $('#linkUnitTest').val(),
            linkImpact: $('#linkImpact').val(),
            // Save commits limit
            commitsLimit: $('#commitsLimit').val()
        };

        // 1. เก็บไว้ที่ LocalStorage ก่อน (Backup)
        localStorage.setItem('deployToolFormData', JSON.stringify(formData));

        // 2. ส่งไปบันทึกที่ Server แบบ Debounce (รอหยุดพิมพ์ 2 วินาทีค่อยเซฟ)
        if (saveDraftTimer) clearTimeout(saveDraftTimer);
        saveDraftTimer = setTimeout(function () {
            $.ajax({
                url: '',
                method: 'POST',
                data: {
                    action: 'saveDraft',
                    draft: JSON.stringify(formData) // ส่งเป็น JSON String
                },
                success: function () {
                    console.log('Draft saved to server');
                }
            });
        }, 2000);
    }

    function loadSavedData() {
        // 1. ลองโหลดจาก Server ก่อน
        $.ajax({
            url: '',
            method: 'POST',
            data: { action: 'getDraft' },
            dataType: 'json',
            success: function (response) {
                if (response.success && response.draft) {
                    applyFormData(response.draft);
                    showAlert('info', 'โหลดข้อมูลร่าง (Draft) จาก Server แล้ว', 3000);
                } else {
                    // 2. ถ้าไม่มีงานใน Server ลองโหลดจาก LocalStorage (Migration / Fallback)
                    const savedData = localStorage.getItem('deployToolFormData');
                    if (savedData) {
                        applyFormData(JSON.parse(savedData));

                        // NEW: ทำการ Migration ข้อมูลขึ้น Server ทันที
                        saveFormData();
                        showAlert('success', 'ย้ายข้อมูลร่างจาก Browser เข้าสู่ Server สำเร็จ', 4000);
                    }
                }
            }
        });
    }

    function applyFormData(formData) {
        if (!formData) return;
        try {
            if (formData.project) $('#projectSelect').val(formData.project).trigger('change');
            if (formData.version) $('input[name="version"]').val(formData.version);
            if (formData.filesList) $('#filesList').val(formData.filesList);
            if (formData.problemsText) $('#problemsText').val(formData.problemsText);
            if (formData.solutionsText) $('#solutionsText').val(formData.solutionsText);
            if (formData.remarksText) $('#remarksText').val(formData.remarksText);
            if (formData.configText) $('#configText').val(formData.configText);
            if (formData.deployNotes) $('#deployNotes').val(formData.deployNotes);

            // Load Google Drive Links
            if (formData.linkXPatch) $('#linkXPatch').val(formData.linkXPatch);
            if (formData.linkXUpgrade) $('#linkXUpgrade').val(formData.linkXUpgrade);
            if (formData.linkXDatabase) $('#linkXDatabase').val(formData.linkXDatabase);
            if (formData.linkUnitTest) $('#linkUnitTest').val(formData.linkUnitTest);
            if (formData.linkImpact) $('#linkImpact').val(formData.linkImpact);

            // Load commits limit
            if (formData.commitsLimit) $('#commitsLimit').val(formData.commitsLimit);
        } catch (e) {
            console.error('Error applying form data:', e);
        }
    }

    function clearSavedData() {
        localStorage.removeItem('deployToolFormData');
        $.ajax({
            url: '',
            method: 'POST',
            data: { action: 'saveDraft', draft: null }
        });
    }

    // ========================================
    // 14. GOOGLE DRIVE LINKS MANAGEMENT
    // ========================================
    function autoFillLinksFromConfig() {
        if (!currentProject) return;

        const drivePaths = window.deployConfig.googleDrivePaths[currentProject] || {};

        // Auto-fill only X-Upgrade and X-Database (not X-Patch, Unit Test, Impact)
        // X-Patch: Must create new folder for each version
        // Unit Test: Must create new folder for each version
        // Impact: Optional, may or may not exist

        if (!$('#linkXUpgrade').val() && drivePaths.xUpgrade) {
            $('#linkXUpgrade').val(drivePaths.xUpgrade);
        }
        if (!$('#linkXDatabase').val() && drivePaths.xDatabase) {
            $('#linkXDatabase').val(drivePaths.xDatabase);
        }

        // Clear X-Patch, Unit Test, and Impact (leave empty)
        $('#linkXPatch').val('');
        $('#linkUnitTest').val('');
        $('#linkImpact').val('');
    }

    function handleAutoFillLinks() {
        if (!currentProject) {
            showAlert('warning', 'กรุณาเลือกโปรเจ็คก่อน');
            return;
        }

        const drivePaths = window.deployConfig.googleDrivePaths[currentProject] || {};

        if (!drivePaths.xUpgrade && !drivePaths.xDatabase) {
            showAlert('warning', 'ไม่พบ Base Links ในการตั้งค่า<br>กรุณาตั้งค่า Base Links ก่อน');
            return;
        }

        // Fill only X-Upgrade and X-Database
        if (drivePaths.xUpgrade) $('#linkXUpgrade').val(drivePaths.xUpgrade);
        if (drivePaths.xDatabase) $('#linkXDatabase').val(drivePaths.xDatabase);

        // Clear X-Patch, Unit Test, and Impact (must be entered manually)
        $('#linkXPatch').val('');
        $('#linkUnitTest').val('');
        $('#linkImpact').val('');

        showAlert('success', 'Auto-fill Links สำเร็จ');

        // Trigger update deploy notes
        updateDeployNotes();
    }

    function clearLinks() {
        $('#linkXPatch').val('');
        $('#linkXUpgrade').val('');
        $('#linkXDatabase').val('');
        $('#linkUnitTest').val('');
        $('#linkImpact').val('');
    }

    function openGoogleDriveLink(linkType) {
        if (!currentProject) {
            showAlert('warning', 'กรุณาเลือกโปรเจ็คก่อน');
            return;
        }

        // Special handling for Unit Test - download template instead
        if (linkType === 'unitTest') {
            downloadUnitTestTemplate();
            return;
        }

        const drivePaths = window.deployConfig.googleDrivePaths[currentProject] || {};

        // เปิดตาม Link ใน Config ตรงๆ ตามประเภทที่ได้รับมา
        const link = drivePaths[linkType];

        if (!link) {
            showAlert('warning', `ไม่พบ Link สำหรับ ${getLinkDisplayName(linkType)}<br>กรุณาตั้งค่าใน Configuration`);
            return;
        }

        window.open(link, '_blank');
    }

    function downloadUnitTestTemplate() {
        if (!currentProject) {
            showAlert('warning', 'กรุณาเลือกโปรเจ็คก่อน');
            return;
        }

        // Google Drive Master Template
        const googleSheetId = "1JI1iyxKwxclFWcKmdYcF9jAnlqH1Rc78";
        const url = `https://docs.google.com/spreadsheets/d/${googleSheetId}/export?format=xlsx`;

        // Force download by navigating current window
        window.location.href = url;

        // Alert user
        alert(`✅ กำลังเริ่มดาวน์โหลด Unit Test Template...`);
    }

    function openInputLink(inputId) {
        let link = $(`#${inputId}`).val().trim();

        // Map input ID to config key
        // null = must be manually entered (new folder for each version)
        const configKeyMap = {
            'linkXPatch': null,      // Must enter manually (new folder per version)
            'linkXUpgrade': 'xUpgrade',    // Can use base link
            'linkXDatabase': 'xDatabase',  // Can use base link
            'linkUnitTest': null,    // Must enter manually (new folder per version)
            'linkImpact': 'impact'         // Can use base link
        };

        const configKey = configKeyMap[inputId];

        // If no link in input, try to use config link (only for allowed fields)
        if (!link && configKey) {
            if (!currentProject) {
                showAlert('warning', 'กรุณาเลือกโปรเจ็คก่อน');
                return;
            }

            const drivePaths = window.deployConfig.googleDrivePaths[currentProject] || {};
            link = drivePaths[configKey];

            if (!link) {
                showAlert('warning', 'กรุณากรอก Link หรือตั้งค่า Base Link ใน Configuration');
                return;
            }
        } else if (!link) {
            // X-Patch and Unit Test require manual input
            showAlert('warning', 'กรุณากรอก Link (ต้องสร้างโฟลเดอร์ใหม่สำหรับ Version นี้)');
            return;
        }

        // Validate URL format
        if (!link.startsWith('http://') && !link.startsWith('https://')) {
            showAlert('warning', 'Link ไม่ถูกต้อง กรุณากรอก URL ที่ขึ้นต้นด้วย http:// หรือ https://');
            return;
        }

        // Open in new tab
        window.open(link, '_blank');
    }

    function getLinkDisplayName(linkType) {
        const names = {
            'xPatch': 'X-Patch',
            'xUpgrade': 'X-Upgrade',
            'xDatabase': 'X-Database',
            'unitTest': 'Unit Test',
            'versionHistory': 'Version History',
            'lastVersion': 'Last Version'
        };
        return names[linkType] || linkType;
    }

    function updateQuickAccessButtons() {
        if (!currentProject) {
            $('#quickAccessButtons').hide();
            return;
        }

        const drivePaths = window.deployConfig.googleDrivePaths[currentProject] || {};

        // Show/hide buttons based on configured links
        $('#openXPatchBtn').toggle(!!drivePaths.xPatch);
        $('#openXUpgradeBtn').toggle(!!drivePaths.xUpgrade);
        $('#openXDatabaseBtn').toggle(!!drivePaths.xDatabase);
        $('#openUnitTestBtn').show(); // Always show - downloads template
        $('#openVersionHistoryBtn').toggle(!!drivePaths.versionHistory);
        $('#openLastVersionBtn').toggle(!!drivePaths.lastVersion);

        // Show container when project is selected
        $('#quickAccessButtons').show();
    }

    // ========================================
    // 15. UTILITY FUNCTIONS
    // ========================================
    function showAlert(type, message, duration = 5000) {
        const alertClass = `alert-${type}`;
        const iconClass = {
            success: 'fa-check-circle',
            warning: 'fa-exclamation-triangle',
            danger: 'fa-times-circle',
            info: 'fa-info-circle'
        }[type] || 'fa-info-circle';

        const alert = $(`
            <div class="alert-custom ${alertClass}">
                <i class="fas ${iconClass}"></i>
                <span>${escapeHtml(message)}</span>
            </div>
        `);

        // Insert at top of main container
        $('.main-container').prepend(alert);

        // Auto-remove after duration
        setTimeout(function () {
            alert.fadeOut(300, function () {
                $(this).remove();
            });
        }, duration);
    }

    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    // ========================================
    // 16. COMMITS LIMIT CHANGE HANDLER
    // ========================================
    function handleCommitsLimitChange() {
        console.log('handleCommitsLimitChange called');
        console.log('currentProject:', currentProject);

        if (!currentProject) {
            console.log('No project selected, returning');
            return;
        }

        // Save to localStorage
        saveFormData();

        // Reload commits with new limit
        showCommitsLoading();

        const commitsLimit = $('#commitsLimit').val() || 30;
        console.log('Loading commits with limit:', commitsLimit);

        $.ajax({
            url: '',
            method: 'POST',
            data: {
                action: 'getCommits',
                project: currentProject,
                limit: commitsLimit
            },
            dataType: 'json',
            success: function (response) {
                console.log('AJAX response:', response);
                if (response.success) {
                    displayCommits(response.commits);
                    if (response.branch) {
                        updateBranchDisplay(response.branch);
                    }
                    showAlert('success', `โหลด ${response.commits.length} commits สำเร็จ`, 2000);
                } else {
                    showCommitsError(response.message);
                }
            },
            error: function (xhr, status, error) {
                console.error('AJAX error:', status, error);
                showCommitsError('เกิดข้อผิดพลาดในการโหลด commits');
            }
        });
    }

    function handleGetLastVersion() {
        if (!currentProject) {
            showAlert('warning', 'กรุณาเลือกโปรเจ็คก่อน');
            return;
        }

        const drivePaths = window.deployConfig.googleDrivePaths[currentProject] || {};
        const sheetUrl = drivePaths.lastVersion;

        if (!sheetUrl) {
            showAlert('warning', 'ไม่พบ Link "Last Version" (Sheet)<br>กรุณาตั้งค่าใน Configuration');
            return;
        }

        // Show loading state
        const btn = $('#getLastVersionBtn');
        const originalHtml = btn.html();
        btn.html('<i class="fas fa-spinner fa-spin"></i> Loading...').prop('disabled', true);

        // Use Configured Sheet App Name, fallback to project name
        const searchName = drivePaths.sheetAppName || currentProject;

        $.ajax({
            url: 'includes/get-sheet-version.php',
            method: 'GET',
            data: {
                url: sheetUrl,
                app: searchName
            },
            dataType: 'json',
            success: function (response) {
                if (response.success) {
                    $('input[name="version"]').val(response.version);
                    $('#lastUpdateDate').val(response.deployDate || '-');
                    $('#lastUpdateBy').val(response.colE || '-');

                    let msg = `ดึงเวอร์ชั่นล่าสุดสำเร็จ`;
                    showAlert('success', msg);

                    // Update Sync Status with current time
                    const now = new Date();
                    const dateTimeStr = now.toLocaleDateString('th-TH') + ' ' + now.toLocaleTimeString('th-TH', { hour12: false });
                    $('#syncTime').text(dateTimeStr);
                    $('#syncStatus').fadeIn();

                    // Update next version automatically
                    updateNextVersion();
                } else {
                    let errorMsg = 'ไม่สามารถอ่านเวอร์ชั่นได้: ' + response.message;
                    if (response.count) errorMsg += '<br>Scanned rows: ' + response.count;
                    if (response.debug) errorMsg += '<br>Debug: ' + response.debug.join(', ');
                    showAlert('warning', errorMsg);
                }
            },
            error: function () {
                showAlert('danger', 'เกิดข้อผิดพลาดในการเชื่อมต่อกับ Server');
            },
            complete: function () {
                btn.html(originalHtml).prop('disabled', false);
            }
        });
    }

    /**
     * Update Next Version (+1) based on Last Version
     * General Rule: Increment second to last part and reset last part to 00
     */
    function updateNextVersion() {
        const lastVer = $('#oetLastVersion').val().trim();
        if (!lastVer) return;

        const parts = lastVer.split('.');
        const len = parts.length;

        // ต้องมีอย่างน้อย 2 ชุดขึ้นไป
        if (len >= 2) {
            const runnerIdx = len - 2; // ตำแหน่ง Running Version (ชุดรองสุดท้าย)
            const lastIdx = len - 1;   // ตำแหน่งท้ายสุด

            let runnerStr = parts[runnerIdx];
            let patchNum = parseInt(runnerStr);

            if (!isNaN(patchNum)) {
                // เพิ่มค่า +1 และคงจำนวนหลักเดิมไว้ (Padding) เช่น 124 -> 125
                const originalLen = runnerStr.length;
                parts[runnerIdx] = (patchNum + 1).toString().padStart(originalLen, '0');

                // แทนที่หลักสุดท้ายด้วย 00
                parts[lastIdx] = "00";

                const nextVer = parts.join('.');
                $('#oetNextVersion').val(nextVer);

                // Trigger change เพื่อบันทึกลง localStorage
                $('#oetNextVersion').trigger('change');
            }
        }
    }

    // ========================================
    // RADIO PLAYER LOGIC
    // ========================================
    $(function () {
        const radioBtn = $('#radioWidgetBtn');
        const playerPanel = $('#radioPlayerPanel');
        const playBtn = $('#radioPlayBtn');
        const closeBtn = $('#closeRadioPanel');
        const stationSelect = $('#radioStationSelect');
        const volumeSlider = $('#radioVolume');
        const audio = document.getElementById('mainAudioPlayer');
        const stationNameText = $('#currentStationName');
        const miniVisualizer = $('#radioVisualizerMini');
        const statusText = $('#radioStatusText');

        let hls = null;
        let isPlaying = false;

        // Toggle Panel
        radioBtn.click(function () {
            playerPanel.fadeToggle(300);
        });

        closeBtn.click(function () {
            playerPanel.fadeOut(300);
        });

        // Audio Element Events
        if (audio) {
            audio.addEventListener('waiting', () => {
                if (isPlaying) statusText.text('(กำลังโหลด...)').css('color', 'var(--warning-color)');
            });
            audio.addEventListener('playing', () => {
                statusText.text('(สด)').css('color', 'var(--success-color)');
            });
            audio.addEventListener('error', (e) => {
                console.error("📻 Audio Element Error:", e);
                statusText.text('(ผิดพลาด)').css('color', 'var(--danger-color)');
                updateUI(false);
                isPlaying = false;
            });
        }

        // Play/Pause Logic
        playBtn.click(function () {
            if (isPlaying) {
                pauseRadio();
            } else {
                playRadio();
            }
        });

        // Station Change
        stationSelect.change(function () {
            const name = $(this).find('option:selected').text();
            const url = $(this).val();
            stationNameText.html('<i class="fas fa-compact-disc fa-spin-slow mr-2"></i> ' + name);

            if (isPlaying) {
                playRadio(); // Re-play with new stream
            } else {
                statusText.text('พร้อมสตรีมรายการสด');
            }
        });

        // Volume Sliders (Sync H & V)
        $('#radioVolume, #radioVolumeH').on('input', function () {
            const val = $(this).val();
            $('#radioVolume, #radioVolumeH').val(val);
            if (audio) {
                audio.volume = val;
            }
        });

        function playRadio() {
            const url = stationSelect.val();
            console.log('📻 Attempting to play:', url);

            statusText.text('...กำลังเชื่อมต่อ...').css('color', '#38bdf8');

            if (audio) {
                audio.pause();
                audio.src = "";
                audio.load();
            }

            if (hls) {
                hls.destroy();
                hls = null;
            }

            // 1) กันเคส playlist ไม่ให้ยิงตรง
            if (url.endsWith('.pls') || url.endsWith('.m3u')) {
                statusText.text('Playlist not supported directly').css('color', 'var(--danger-color)');
                updateUI(false);
                isPlaying = false;
                return;
            }

            if (url.includes('.m3u8')) {
                // HLS Stream
                if (window.Hls && Hls.isSupported()) {
                    hls = new Hls({
                        enableWorker: true,
                        lowLatencyMode: true
                    });
                    hls.loadSource(url);
                    hls.attachMedia(audio);
                    hls.on(Hls.Events.MANIFEST_PARSED, function () {
                        audio.play().catch(onPlayError);
                    });

                    hls.on(Hls.Events.ERROR, function (event, data) {
                        if (data.fatal) {
                            statusText.text('สตรีมขัดข้อง (Fatal)').css('color', 'var(--danger-color)');
                            updateUI(false);
                            isPlaying = false;
                        }
                    });
                } else if (audio && audio.canPlayType('application/vnd.apple.mpegurl')) {
                    audio.src = url;
                    audio.addEventListener('canplay', function () {
                        audio.play().catch(onPlayError);
                    }, { once: true });
                } else {
                    statusText.text('Browser not supporting HLS').css('color', 'var(--danger-color)');
                    updateUI(false);
                    isPlaying = false;
                    return;
                }
            } else {
                // Standard Audio Stream (MP3/AAC)
                audio.src = url;
                audio.play().then(() => {
                    statusText.text('เพลงกำลังบรรเลง • LIVE').css('color', 'var(--success-color)');
                }).catch(onPlayError);
            }

            isPlaying = true;
            updateUI(true);

            function onPlayError(e) {
                console.error("📻 Play Error:", e);
                statusText.text('ไม่สามารถรับชมได้ในขณะนี้').css('color', 'var(--danger-color)');
                updateUI(false);
                isPlaying = false;
            }
        }


        function pauseRadio() {
            if (audio) {
                audio.pause();
            }
            isPlaying = false;
            statusText.text('หยุดการเล่นชั่วคราว');
            updateUI(false);
        }

        function updateUI(playing) {
            if (playing) {
                playBtn.html('<i class="fas fa-pause"></i>').addClass('playing');
                playerPanel.addClass('radio-playing');
                radioBtn.addClass('radio-playing');
                miniVisualizer.show();
            } else {
                playBtn.html('<i class="fas fa-play"></i>').removeClass('playing');
                playerPanel.removeClass('radio-playing');
                radioBtn.removeClass('radio-playing');
                miniVisualizer.hide();
            }
        }

        // Initialize UI values
        if (audio) {
            audio.volume = 0.5;
            $('#radioVolume, #radioVolumeH').val(0.5);

            // Set initial name with icon
            const currentName = stationSelect.find('option:selected').text();
            if (currentName) {
                stationNameText.html('<i class="fas fa-compact-disc mr-2"></i> ' + currentName);
            }
        }

        // ========================================
        // RADIO SMART INVITE LOGIC (3 MINS)
        // ========================================
        let hasPromptedRadio = localStorage.getItem('ada_radio_prompted') === 'true';

        if (!hasPromptedRadio) {
            setTimeout(() => {
                // เช็คอีกครั้งว่ากำลังเล่นอยู่มั้ย (ถ้าเค้าเปิดเองก่อน 3 นาที ก็ไม่ต้องกวน)
                if (!isPlaying && !$('#radioPlayerPanel').is(':visible')) {
                    $('#modalRadioInvite').modal('show');
                }
            }, 60000); // 1 minute = 60,000 ms
        }

        $('#btnAcceptRadio').click(function () {
            $('#modalRadioInvite').modal('hide');
            localStorage.setItem('ada_radio_prompted', 'true');

            // เปิดแผงวิทยุ
            playerPanel.fadeIn(400);

            // เริ่มเล่นเพลง (Auto-play station แรกที่เลือกไว้)
            setTimeout(() => {
                playRadio();
                showAlert('success', 'เพลิดเพลินกับเสียงดนตรีระหว่างทำงานนะครับ 🎵');
            }, 500);
        });
    });

    // ========================================
    // MINI CALENDAR LOGIC (LIVE & SELECTOR)
    // ========================================
    $(function () {
        let currentViewDate = new Date();

        function updateCalendar(date) {
            const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const fullMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

            $('#calMonth').text(months[date.getMonth()]);
            $('#calDate').text(date.getDate());
            $('#calDayName').text(days[date.getDay()]);
            $('#calFullDate').text(`${date.getDate()} ${fullMonths[date.getMonth()]} ${date.getFullYear()}`);

            // Update hidden input value
            const yyyy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const dd = String(date.getDate()).padStart(2, '0');
            $('#realDateInput').val(`${yyyy}-${mm}-${dd}`);

            // Highlight border if it's today
            const today = new Date();
            if (date.toDateString() === today.toDateString()) {
                $('#miniCalendar').css('border-color', 'rgba(255, 255, 255, 0.5)');
            } else {
                $('#miniCalendar').css('border-color', 'rgba(255, 255, 255, 0.2)');
            }
        }

        // Open Real Calendar Picker
        $('#btnShowFullCal, #openCalendarPicker').click(function () {
            $('#realDateInput')[0].showPicker(); // Open Browser's Native Date Picker
        });

        // When date is changed from real picker
        $('#realDateInput').change(function () {
            const selectedDate = new Date($(this).val());
            if (!isNaN(selectedDate.getTime())) {
                currentViewDate = selectedDate;
                updateCalendar(currentViewDate);
            }
        });

        $('#prevDay').click(function () {
            currentViewDate.setDate(currentViewDate.getDate() - 1);
            updateCalendar(currentViewDate);
        });

        $('#nextDay').click(function () {
            currentViewDate.setDate(currentViewDate.getDate() + 1);
            updateCalendar(currentViewDate);
        });

        // Initialize with real today date (NOT Hardcode)
        updateCalendar(currentViewDate);
    });

    // ========================================
    // TASK BOARD LOGIC (NEW)
    // ========================================
    $(function () {
        let tasks = JSON.parse(localStorage.getItem('ada_deploy_tasks') || '[]');

        // ดึงข้อมูลจาก Server เมื่อเริ่มต้น
        loadTasksFromServer();

        // --- EMERGENCY RESTORE: AdaPPGroup ---
        // จะทำงานหลังจากโหลดข้อมูลเสร็จใน Callback ของ loadTasksFromServer
        // แต่เนื่องจาก JS เป็น Async เราต้องไปแทรกใน success ของ ajax หรือทำ interval เช็ค
        // เพื่อความง่าย แก้ไข function success ข้างล่างแทน


        function loadTasksFromServer() {
            $.ajax({
                url: '',
                method: 'POST',
                data: { action: 'getTasks' },
                dataType: 'json',
                success: function (response) {
                    if (response.success && response.tasks && response.tasks.length > 0) {
                        tasks = response.tasks;



                        localStorage.setItem('ada_deploy_tasks', JSON.stringify(tasks));
                        renderTasks();
                        renderHistory();
                        console.log('Tasks synced from server');
                    } else if (tasks.length > 0) {
                        // NEW: Migration จากเครื่องสู่ Server
                        console.log('Migrating local tasks to server...');
                        saveTasks();
                        showAlert('success', 'ย้ายรายการ Task Board เข้าสู่ระบบ Folder สำเร็จ', 4000);
                    }
                }
            });
        }

        function saveTasks() {
            // 1. บันทึกลง LocalStorage (เพื่อความเร็วในฝั่ง Client)
            localStorage.setItem('ada_deploy_tasks', JSON.stringify(tasks));

            // 2. ส่งไปบันทึกที่ Server (เพื่อเก็บลง Folder ตามโครงสร้างที่ต้องการ)
            $.ajax({
                url: '',
                method: 'POST',
                data: {
                    action: 'saveTasks',
                    tasks: JSON.stringify(tasks) // ส่งเป็น JSON String
                },
                dataType: 'json',
                success: function (res) {
                    if (res.success) {
                        console.log('Tasks saved to server folders');
                    }
                }
            });

            renderTasks();
            renderHistory();
        }

        // NEW: Render project checkboxes for new task form
        function renderProjectCheckboxes() {
            const container = $('#taskProjectList');
            const projects = (window.deployConfig && window.deployConfig.projects) ? window.deployConfig.projects : {};

            if (Object.keys(projects).length === 0) {
                container.html('<div class="text-muted small">ไม่พบรายชื่อโปรเจ็คใน Config</div>');
                return;
            }

            let html = '';
            Object.keys(projects).forEach(projName => {
                html += `
                    <label class="project-checkbox-item">
                        <input type="checkbox" name="taskProjects" value="${projName}">
                        <span>${projName}</span>
                    </label>
                `;
            });
            container.html(html);
        }

        function renderTasks() {
            const container = $('#taskListContainer');
            // กวาดเฉพาะที่ยังไม่ย้ายลง History (completed=false คือยังอยู่บน Board แต่ status อาจจะเป็น done, wait, hold)
            const activeTasks = tasks.filter(t => !t.completed);

            if (activeTasks.length === 0) {
                container.html(`
                    <div class="text-center text-muted py-4">
                        <i class="fas fa-clipboard-list fa-2x mb-2 opacity-50"></i>
                        <p>ยังไม่มีรายการงานที่ต้องทำในตอนนี้</p>
                    </div>
                `);
                return;
            }

            let html = '';
            activeTasks.sort((a, b) => {
                const pMap = { high: 3, medium: 2, low: 1 };
                const pA = pMap[a.priority] || 1;
                const pB = pMap[b.priority] || 1;
                if (pB !== pA) return pB - pA;
                return b.id - a.id;
            }).forEach(task => {
                const priority = task.priority || 'low';
                const priorityClass = `priority-${priority}`;

                // Status Styling & Badges
                let statusClass = '';
                let statusBadge = '';
                if (task.status === 'done') {
                    statusClass = 'task-status-done'; // CSS class needs to be defined or inline
                } else if (task.status === 'wait') {
                    statusClass = 'task-status-wait';
                    statusBadge = '<span class="badge badge-warning ml-2" style="font-size: 0.7rem;"><i class="fas fa-pause"></i> WAIT</span>';
                } else if (task.status === 'hold') {
                    statusClass = 'task-status-hold';
                    statusBadge = '<span class="badge badge-secondary ml-2" style="font-size: 0.7rem;"><i class="fas fa-hand-paper"></i> HOLD</span>';
                }

                // Create project badges
                let projectHtml = '';
                if (task.projects && task.projects.length > 0) {
                    projectHtml = '<div class="task-projects mt-1">';
                    task.projects.forEach(p => {
                        projectHtml += `<span class="task-project-badge">${p}</span>`;
                    });
                    projectHtml += '</div>';
                }

                // Buttons - Compact Version
                const btnDone = `<button class="btn btn-xs ${task.status === 'done' ? 'btn-success' : 'btn-outline-success'} btn-status-action" data-type="done" data-id="${task.id}" title="Done"><i class="fas fa-check"></i></button>`;
                const btnWait = `<button class="btn btn-xs ${task.status === 'wait' ? 'btn-warning' : 'btn-outline-warning'} btn-status-action" data-type="wait" data-id="${task.id}" title="Wait"><i class="fas fa-pause"></i></button>`;
                const btnHold = `<button class="btn btn-xs ${task.status === 'hold' ? 'btn-secondary' : 'btn-outline-secondary'} btn-status-action" data-type="hold" data-id="${task.id}" title="Hold"><i class="fas fa-hand-paper"></i></button>`;

                const isChecked = task.status === 'done' ? 'checked' : '';
                const opacityStyle = task.status === 'done' ? 'opacity: 0.7;' : '';

                // Background Color by Status
                let bgColor = '';
                if (task.status === 'done') {
                    bgColor = 'background: linear-gradient(to right, #a8d5a8 0%, #e8f5e8 100%);'; // เขียวเข้ม
                } else if (task.status === 'wait') {
                    bgColor = 'background: linear-gradient(to right, #ffd966 0%, #fff4cc 100%);'; // เหลืองส้มเข้ม
                } else if (task.status === 'hold') {
                    bgColor = 'background: linear-gradient(to right, #e89b9f 0%, #f8e0e2 100%);'; // แดงเลือดหมูเข้ม
                }

                html += `
                    <div class="task-item-modern compact-task-item ${priorityClass} d-flex align-items-center flex-nowrap" data-id="${task.id}" style="${opacityStyle} ${bgColor} gap: 10px;">
                        
                        <!-- 1. Left: Checkbox & Priority (Fixed Width) -->
                        <div class="d-flex align-items-center flex-shrink-0 item-status-col">
                             <div class="custom-control custom-checkbox" style="transform: scale(1.1);">
                                <input type="checkbox" class="custom-control-input task-checkbox-toggle" id="chk_${task.id}" ${isChecked} data-id="${task.id}">
                                <label class="custom-control-label" for="chk_${task.id}"></label>
                            </div>
                            <div class="priority-dot-single ml-2 custom-tooltip" data-priority="${priority}" title="Impact: ${priority.toUpperCase()}"></div>
                        </div>

                        <!-- 2. Center: Badges + Name (Flexible & Truncate) -->
                        <div class="d-flex align-items-center flex-grow-1" style="min-width: 0; overflow: hidden; gap: 8px;">
                            
                            <!-- Projects Badge -->
                            <div class="flex-shrink-0 d-flex">
                                ${projectHtml}
                            </div>
                            
                            <!-- Status Badges (Wait/Hold/Note) -->
                            ${task.note ? `<div class="flex-shrink-0"><span class="badge badge-light border text-muted" title="${task.note}" style="max-width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; vertical-align: middle;"><i class="fas fa-info-circle mr-1"></i>${task.note}</span></div>` : ''}
                            ${task.status !== 'active' && task.status !== 'done' ? `<div class="flex-shrink-0">${statusBadge}</div>` : ''}

                            <!-- Task Name (Truncate Last) -->
                            <div class="task-text font-weight-bold text-truncate" style="font-size: 0.95rem; color: #2d3748; padding-bottom: 1px;" title="${task.name}">
                                ${task.name}
                            </div>
                        </div>

                        <!-- 3. Right: Actions (Fixed, No Shrink) -->
                        <div class="d-flex align-items-center flex-shrink-0 ml-2 pl-2 border-left" style="gap: 8px;">
                            
                            <!-- Status Buttons -->
                            <div class="btn-group btn-group-sm" style="transform: scale(0.9);">
                                ${btnDone}
                                ${btnWait}
                                ${btnHold}
                            </div>

                            <!-- Tools -->
                             <div class="d-flex align-items-center" style="gap: 3px;">
                                <small class="text-muted mr-1 d-none d-xl-inline-block" style="font-size: 0.7rem; min-width: 35px; text-align: right;">${task.time || ''}</small>
                                <button class="btn btn-light btn-xs text-info btn-edit-task circle-btn-sm" data-id="${task.id}" title="แก้ไข"><i class="fas fa-edit" style="font-size: 0.7rem;"></i></button>
                                ${task.url ? `<button class="btn btn-light btn-xs text-success btn-sheet-link circle-btn-sm" data-url="${task.url}" title="Sheet"><i class="fas fa-file-excel" style="font-size: 0.7rem;"></i></button>` : ''}
                                <button class="btn btn-light btn-xs text-danger btn-delete-task circle-btn-sm" title="ลบ"><i class="fas fa-times" style="font-size: 0.7rem;"></i></button>
                             </div>
                        </div>
                    </div>
                `;
            });
            container.html(html);
        }

        function renderHistory() {
            const container = $('#taskHistoryList');
            const counter = $('#completedTasksCount');
            const limit = $('#historyLimit').val(); // '10', '30', '50', 'all'

            const completedTasks = tasks.filter(t => t.completed);
            counter.text(`${completedTasks.length} รายการ`);

            if (completedTasks.length === 0) {
                container.html('<div class="text-center text-muted py-3">ยังไม่มีประวัติงานที่ทำเสร็จ</div>');
                return;
            }

            // เรียงตามเวลาที่เสร็จล่าสุดขึ้นก่อน
            completedTasks.sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));

            // จำกัดจำนวนรายการ
            let displayTasks = completedTasks;
            if (limit !== 'all') {
                displayTasks = completedTasks.slice(0, parseInt(limit));
            }

            let html = '';
            displayTasks.forEach(task => {
                const doneDate = task.completedAt ? new Date(task.completedAt) : null;
                const dateStr = doneDate ? doneDate.toLocaleDateString('th-TH') : '-';
                const timeStr = doneDate ? doneDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '-';

                // Create project badges for history (Horizontal)
                let projectHtml = '';
                if (task.projects && task.projects.length > 0) {
                    projectHtml = '<div class="task-projects">';
                    task.projects.forEach(p => {
                        projectHtml += `<span class="task-project-badge" style="font-size: 0.65rem; padding: 1px 6px;">${p}</span>`;
                    });
                    projectHtml += '</div>';
                }

                html += `
                    <div class="history-task-item" data-id="${task.id}">
                        <div class="history-task-info">
                            <div class="history-task-header">
                                <i class="fas fa-check-circle text-success mr-2"></i> ${task.name}
                                ${projectHtml}
                            </div>
                            <div class="history-task-meta">
                                <span title="ลำดับความสำคัญ: ${task.priority.toUpperCase()}">
                                    <span class="history-priority-dot h-dot-${task.priority}"></span>
                                </span>
                                ${task.note ? `<span><i class="fas fa-info-circle"></i> ${task.note}</span>` : ''}
                                ${task.completedDate ? `<span class="text-success"><i class="fas fa-calendar-check"></i> ${task.completedDate}</span>` : ''}
                            </div>
                        </div>
                        <div class="history-task-time">
                            <div><i class="fas fa-calendar-alt"></i> ${dateStr}</div>
                            <div><i class="fas fa-clock"></i> ${timeStr} น.</div>
                        </div>
                        <div class="d-flex align-items-center ml-2" style="gap: 5px;">
                            <button class="btn-restore-task btn btn-link btn-sm p-0 text-primary" data-id="${task.id}" title="ย้ายงานกลับมายัง Task Board"><i class="fas fa-undo"></i></button>
                            <button class="btn-edit-task btn btn-link btn-sm p-0 text-secondary" data-id="${task.id}" title="แก้ไข"><i class="fas fa-edit"></i></button>
                            <button class="btn-task-action btn-delete-task btn-link btn-sm p-0 text-danger" title="ลบ"><i class="fas fa-trash-alt"></i></button>
                        </div>
                    </div>
                `;
            });
            container.html(html);
        }

        function addTask() {
            const input = $('#oetTaskName');
            const urlInput = $('#oetTaskRefUrl');
            const priorityInput = $('#ocmTaskPriority');
            const noteInput = $('#oetTaskNote');

            const name = input.val().trim();
            const url = urlInput.val().trim();
            const priority = priorityInput.val() || 'low';
            const note = noteInput.val().trim();

            const selectedProjects = [];
            $('input[name="taskProjects"]:checked').each(function () {
                selectedProjects.push($(this).val());
            });

            if (!name) return;

            const now = new Date();
            const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

            tasks.push({
                id: Date.now(),
                name: name,
                projects: selectedProjects,
                url: url,
                priority: priority,
                note: note,
                completed: false,
                status: 'doing', // Default status
                createdAt: Date.now(),
                completedAt: null,
                time: timeStr
            });

            // Reset Inputs
            input.val('');
            urlInput.val('');
            noteInput.val('');
            priorityInput.val('low');
            $('input[name="taskProjects"]').prop('checked', false).closest('.project-checkbox-item').removeClass('active');
            $('.priority-choice').removeClass('active');
            $('.priority-choice[data-value="low"]').addClass('active');

            saveTasks();
        }

        // --- Status Logic Handler ---
        // --- Status Logic Handler ---
        function handleStatusChange(taskId, newStatus) {
            const task = tasks.find(t => t.id == taskId);
            if (!task) return;

            task.status = newStatus;

            // ถ้า Done ให้เช็คว่าต้องย้ายลง History ไหม
            if (newStatus === 'done') {
                const myProjects = task.projects || [];

                // หา Task อื่นๆ ที่อยู่บน Board และมี Project ตรงกัน
                const sameProjectSiblingsOnBoard = tasks.filter(t =>
                    !t.completed &&
                    t.id !== task.id &&
                    t.projects.some(p => myProjects.includes(p))
                );

                // NEW Logic: เช็คว่ามีใครยังไม่เสร็จสมบูรณ์ไหม (Doing/Wait/Hold)
                const hasPending = sameProjectSiblingsOnBoard.some(t =>
                    t.status === 'doing' || t.status === 'wait' || t.status === 'hold'
                );

                if (!hasPending && sameProjectSiblingsOnBoard.length > 0) {
                    // กรณีมีเพื่อน และเพื่อนทั้งหมดก็ Done หมดแล้ว (ไม่มี Doing/Wait/Hold) 
                    // -> ย้ายทุกคนลง History (กวาดเรียบ Project Closed)

                    const now = Date.now();
                    const dateStr = new Date().toLocaleDateString('th-TH');

                    // 1. ตัวมันเอง
                    task.completed = true;
                    task.completedAt = now;
                    task.completedDate = dateStr;

                    // 2. เพื่อนๆ
                    sameProjectSiblingsOnBoard.forEach(sib => {
                        sib.completed = true;
                        sib.completedAt = now;
                        sib.completedDate = dateStr;
                    });

                    showAlert('success', 'Project Completed! ย้ายงานทั้งหมดลงประวัติเรียบร้อย');

                } else if (!hasPending && sameProjectSiblingsOnBoard.length === 0) {
                    // กรณีงานเดี่ยวๆ (ไม่มีเพื่อนในโปรเจ็คบนบอร์ด) หรือเพื่อนลง History ไปหมดแล้ว
                    // ให้ค้างไว้ก่อน (Status: Done) เผื่อ User อยากแก้ไขสถานะ 
                    // จะย้ายก็ต่อเมื่อ User กดลบ หรือระบบ Clear แบบ Manual (หรือจะให้ย้ายเลย? User บอก "กดอันเดียวย้ายหมด" แสดงว่าเขาไม่อยากให้มันหายวูบ)

                    // เอาแบบนี้: ถ้างานเดี่ยวๆ ให้ค้างไว้เป็น Done (ไม่ Auto Move) 
                    // แต่ถ้างานกลุ่ม และทุกคน Done หมด ให้ Move ยกแผง

                    // แต่เดี๋ยวก่อน requirement คือ "กรณีที่ทำเสร็จเป็น Task ยังไม่ต้องย้าย ต้องเสร็จทุก Task ในโปรเจ็คก่อนจึงจะย้าย"
                    // แปลว่าถ้างานเดี่ยวๆ มันก็คือ "เสร็จทุก Task" แล้วหนิ?

                    // OK งั้นยึด Active Logic: Pending Count == 0 -> Sweep
                    // แต่เพื่อกันพลาดสำหรับงานเดี่ยวๆ ผมจะ "Auto Complete" ก็ต่อเมื่อมันไม่ใช่การกดผิด
                    // เอาเป็นว่า ถ้างานเดี่ยว กด Done -> ย้ายเลย (ถือว่าจบจ็อบ)
                    // แต่ถ้ามีเพื่อน (Wait/Hold) -> ไม่ย้าย (ถูกต้องตามที่แก้ตะกี้)

                    // กลับมาใช้ Logic เดิมที่แก้ Wait/Hold = Pending ก่อนครับ

                    const now = Date.now();
                    const dateStr = new Date().toLocaleDateString('th-TH');

                    task.completed = true;
                    task.completedAt = now;
                    task.completedDate = dateStr;
                    showAlert('success', 'งานเสร็จสิ้นย้ายลงประวัติเรียบร้อย');
                } else {
                    // ยังมี Doing/Wait/Hold เหลือ -> แค่เปลี่ยนสถานะ (Render ใหม่จะโชว์ Done แต่ยังอยู่บนบอร์ด)
                }
            }

            saveTasks();
        }

        // Priority Choice Handler
        $(document).on('click', '.priority-choice', function () {
            const val = $(this).data('value');
            if ($(this).hasClass('edit-priority-choice')) {
                $('.edit-priority-choice').removeClass('active');
                $(this).addClass('active');
                $('#editTaskPriority').val(val);
            } else {
                $('.priority-choice').not('.edit-priority-choice').removeClass('active');
                $(this).addClass('active');
                $('#ocmTaskPriority').val(val);
            }
        });

        // Initialize Edit Checkboxes
        function renderEditModalProjectCheckboxes(task) {
            const container = $('#editTaskProjectList');
            const projects = (window.deployConfig && window.deployConfig.projects) ? window.deployConfig.projects : {};
            let html = '';
            Object.keys(projects).forEach(projName => {
                const isChecked = (task.projects || []).includes(projName);
                html += `
                    <label class="project-checkbox-item ${isChecked ? 'active' : ''}">
                        <input type="checkbox" class="edit-modal-project" value="${projName}" ${isChecked ? 'checked' : ''}>
                        <span>${projName}</span>
                    </label>
                `;
            });
            container.html(html || '<div class="text-muted small">ไม่พบรายชื่อโปรเจ็ค</div>');
        }

        // --- Event Bindings ---

        // Add Task
        $('#btnAddTask').off('click').on('click', addTask);

        // Project Checkbox Style
        $(document).on('change', 'input[name="taskProjects"]', function () {
            $(this).closest('.project-checkbox-item').toggleClass('active', $(this).is(':checked'));
        });

        // Checkbox Toggle (Acts as Done/Doing Toggle)
        $(document).on('change', '.task-checkbox-toggle', function () {
            const id = $(this).data('id');
            const isChecked = $(this).prop('checked');
            handleStatusChange(id, isChecked ? 'done' : 'doing');
        });

        // Status Buttons Click
        $(document).on('click', '.btn-status-action', function () {
            const id = $(this).data('id');
            const type = $(this).data('type');

            // ถ้ากดปุ่มเดิมซ้ำ ให้ toggle กลับเป็น doing (หรือจะบังคับเป็น status นั้นเลยก็ได้)
            // เอาแบบบังคับเป็น status นั้นเลยตาม Requirement ปุ่ม
            // แต่ถ้าอยาก Un-hold ก็ต้องมีวิธีกดกลับ...
            // Logic: ถ้า status ปัจจุบัน == type ที่กด -> กลับไปเป็น doing
            const task = tasks.find(t => t.id == id);
            if (task && task.status === type) {
                handleStatusChange(id, 'doing');
            } else {
                handleStatusChange(id, type);
            }
        });

        // NEW: Restore Task from History (ย้ายกลับมา Task Board)
        $(document).on('click', '.btn-restore-task', function (e) {
            e.preventDefault();
            const id = $(this).data('id') || $(this).closest('.history-task-item').data('id');
            const task = tasks.find(t => t.id == id);
            if (task) {
                if (confirm(`ยืนยันการย้ายงาน "${task.name}" กลับไปยัง Task Board หรือไม่?`)) {
                    task.completed = false;
                    task.status = 'doing'; // บังคับเป็นสถานะกำลังทำ
                    task.completedAt = null;
                    task.completedDate = null;

                    saveTasks(); // บันทึกและ Render ใหม่ทั้ง Board และ History
                    showAlert('success', 'ย้ายงานกลับมายัง Task Board ปัจจุบันแล้ว 🚀');
                }
            }
        });



        function openEditTaskModal(id) {
            const task = tasks.find(t => t.id == id);
            if (!task) return;

            $('#editTaskId').val(task.id);
            $('#editTaskName').val(task.name);
            const priority = task.priority || 'low';
            $('#editTaskPriority').val(priority);

            // NEW: Select correct color dot in Modal
            $('.edit-priority-choice').removeClass('active');
            $(`.edit-priority-choice[data-value="${priority}"]`).addClass('active');

            $('#editTaskUrl').val(task.url || '');
            $('#editTaskNote').val(task.note || '');
            $('#editTaskDetails').val(task.details || '');
            $('#editTaskDate').val(task.completedDate || '');

            // Reset and set Phases in Modal
            $('#editTaskPhaseGroup .phase-btn').each(function () {
                const phase = $(this).data('phase');
                $(this).toggleClass('active', !!task[phase]);
            });

            renderEditModalProjectCheckboxes(task);
            $('#modalEditTask').modal('show');
        }

        // Event for opening modal from Edit button
        $(document).on('click', '.btn-edit-task', function () {
            const id = $(this).closest('.task-item-modern, .history-task-item').data('id');
            openEditTaskModal(id);
        });

        // Toggle Phase in Edit Modal
        $(document).on('mousedown', '#editTaskPhaseGroup .phase-btn', function () {
            $(this).toggleClass('active');
        });

        // Save from Edit Modal
        $('#btnSaveEditTask').click(function () {
            const id = $('#editTaskId').val();
            const taskIndex = tasks.findIndex(t => t.id == id);

            if (taskIndex !== -1) {
                const task = tasks[taskIndex];
                task.name = $('#editTaskName').val().trim();
                task.priority = $('#editTaskPriority').val();
                task.url = $('#editTaskUrl').val().trim();
                task.note = $('#editTaskNote').val().trim();
                task.details = $('#editTaskDetails').val().trim();
                task.completedDate = $('#editTaskDate').val();

                // Get projects from modal
                task.projects = [];
                $('.edit-modal-project:checked').each(function () {
                    task.projects.push($(this).val());
                });

                // Get phases from modal
                $('#editTaskPhaseGroup .phase-btn').each(function () {
                    const phase = $(this).data('phase');
                    task[phase] = $(this).hasClass('active');
                });

                saveTasks();
                $('#modalEditTask').modal('hide');
                showAlert('success', 'ปรับปรุงข้อมูลรายการงานแล้ว');
            }
        });

        // Add task event
        $('#btnAddTask').click(addTask);

        // Add task on Enter key
        $('#oetTaskName, #oetTaskRefUrl, #oetTaskNote').keypress(function (e) {
            if (e.which == 13) addTask();
        });

        // Change Priority on Dot Click
        $(document).on('click', '.priority-dot', function () {
            const id = $(this).closest('.task-item-modern').data('id');
            const newPriority = $(this).data('priority');
            const task = tasks.find(t => t.id == id);

            if (task && task.priority !== newPriority) {
                task.priority = newPriority;
                saveTasks();
            }
        });

        // NEW: Import from Task Board Logic
        let filteredImportTasks = []; // Declare globally or in a scope accessible by btnConfirmImportTasks
        function filterAndRenderImportTasks() {
            const startDate = $('#loadTaskStartDate').val();
            const endDate = $('#loadTaskEndDate').val();
            const projectFilter = $('#loadTaskProjectFilter').val();

            const startTimestamp = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : 0;
            const endTimestamp = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : Infinity;

            filteredImportTasks = tasks.filter(task => {
                let taskTime = task.completedAt || 0;
                if (task.completedDate) {
                    taskTime = new Date(task.completedDate).getTime();
                }

                const dateMatch = taskTime >= startTimestamp && taskTime <= endTimestamp;
                let projectMatch = true;
                if (projectFilter !== 'all') {
                    projectMatch = task.projects && task.projects.includes(projectFilter);
                }

                return dateMatch && projectMatch && task.completed;
            });

            filteredImportTasks.sort((a, b) => {
                const timeA = a.completedAt || new Date(a.completedDate || 0).getTime();
                const timeB = b.completedAt || new Date(b.completedDate || 0).getTime();
                return timeB - timeA;
            });

            const tbody = $('#importTasksTableBody');
            tbody.empty();
            $('#checkAllTasksImport').prop('checked', false);
            $('#importTaskCount').text('เลือก 0 รายการ');

            if (filteredImportTasks.length === 0) {
                $('#noTasksFoundMessage').show();
                $('.table-responsive').hide();
            } else {
                $('#noTasksFoundMessage').hide();
                $('.table-responsive').show();

                filteredImportTasks.forEach(task => {
                    const doneDate = task.completedDate || (task.completedAt ? new Date(task.completedAt).toISOString().split('T')[0] : '-');
                    const isChecked = selectedImportTaskIds.includes(task.id.toString());

                    // Create project badges for table
                    let projectBadgesHtml = '';
                    if (task.projects && task.projects.length > 0) {
                        task.projects.forEach(p => {
                            projectBadgesHtml += `<span class="task-project-badge" style="display:inline-block; margin-bottom: 2px;">${p}</span>`;
                        });
                    } else {
                        projectBadgesHtml = '-';
                    }

                    tbody.append(`
                        <tr class="import-row-clickable" data-id="${task.id}" style="cursor: pointer;">
                            <td class="text-center" onclick="event.stopPropagation();">
                                <div class="custom-control custom-checkbox">
                                    <input type="checkbox" class="custom-control-input import-task-check" id="chkImport_${task.id}" value="${task.id}" ${isChecked ? 'checked' : ''}>
                                    <label class="custom-control-label" for="chkImport_${task.id}"></label>
                                </div>
                            </td>
                            <td style="white-space: nowrap; max-width: 250px; overflow: hidden;">${projectBadgesHtml}</td>
                            <td class="font-weight-bold">
                                ${task.name}
                                <div id="statusSol_${task.id}" class="mt-1">
                                    ${importTaskSolutions[task.id] ? '<span class="badge badge-success" style="font-size: 0.6rem;"><i class="fas fa-check"></i> ระบุการแก้ไขแล้ว</span>' : '<span class="badge badge-light text-muted" style="font-size: 0.6rem;">คลิกที่นี่เพื่อระบุการแก้ไข (ถ้ามี)</span>'}
                                </div>
                            </td>
                            <td class="text-center">
                                <span class="history-priority-dot h-dot-${task.priority}" title="ความสำคัญ: ${task.priority.toUpperCase()}"></span>
                            </td>
                            <td class="text-center" style="white-space: nowrap;"><small class="font-weight-bold">${doneDate}</small></td>
                        </tr>
                    `);
                });

                updateImportCount(); // Update count initially
            }
        }

        $('#loadFromTaskBoardBtn').click(function () {
            if (!$('#loadTaskStartDate').val()) {
                const today = new Date().toISOString().split('T')[0];
                $('#loadTaskStartDate').val(today);
                $('#loadTaskEndDate').val(today);
            }
            if (currentProject) $('#loadTaskProjectFilter').val(currentProject);
            filterAndRenderImportTasks();
            $('#modalLoadTask').modal('show');
        });

        $('#btnFilterImportTasks').click(function () {
            importTaskSolutions = {}; // Reset solutions when search again
            filterAndRenderImportTasks();
        });

        // Open sub-modal to enter solution when click row/task
        $(document).on('click', '.import-row-clickable', function () {
            const id = $(this).data('id');
            const task = filteredImportTasks.find(t => t.id.toString() === id.toString());
            if (!task) return;

            $('#importTaskSolId').val(task.id);
            $('#importTaskSolName').text(task.name);
            $('#importTaskSolText').val(importTaskSolutions[task.id] || '');

            $('#modalImportTaskSolution').modal('show');
        });

        // Save solution from sub-modal
        $('#btnSaveImportTaskSol').click(function () {
            const id = $('#importTaskSolId').val();
            const solution = $('#importTaskSolText').val().trim();

            if (solution) {
                importTaskSolutions[id] = solution;
                $(`#statusSol_${id}`).html('<span class="badge badge-success" style="font-size: 0.6rem;"><i class="fas fa-check"></i> ระบุการแก้ไขแล้ว</span>');
            } else {
                delete importTaskSolutions[id];
                $(`#statusSol_${id}`).html('<span class="badge badge-light text-muted" style="font-size: 0.6rem;">คลิกที่นี่เพื่อระบุการแก้ไข (ถ้ามี)</span>');
            }

            // Also auto-check the checkbox if solution is entered
            if (solution) {
                $(`#chkImport_${id}`).prop('checked', true).trigger('change');
            }

            $('#modalImportTaskSolution').modal('hide');
        });

        $(document).on('change', '#checkAllTasksImport', function () {
            const checked = $(this).prop('checked');
            $('.import-task-check').each(function () {
                $(this).prop('checked', checked);
                const id = $(this).val();
                if (checked) {
                    if (!selectedImportTaskIds.includes(id)) selectedImportTaskIds.push(id);
                } else {
                    selectedImportTaskIds = selectedImportTaskIds.filter(i => i !== id);
                }
            });
            updateImportCount();
        });

        $(document).on('change', '.import-task-check', function () {
            const id = $(this).val();
            const checked = $(this).prop('checked');
            if (checked) {
                if (!selectedImportTaskIds.includes(id)) selectedImportTaskIds.push(id);
            } else {
                selectedImportTaskIds = selectedImportTaskIds.filter(i => i !== id);
            }
            updateImportCount();
        });

        function updateImportCount() {
            // Count from global persistent array
            const count = selectedImportTaskIds.length;
            $('#importTaskCount').text(`เลือก ${count} รายการงาน`);
        }

        $('#btnConfirmImportTasks').click(function () {
            const selectedItems = [];

            // Get data based on persistent selectedImportTaskIds
            selectedImportTaskIds.forEach(id => {
                // Find task object in memory (all tasks)
                const task = tasks.find(t => t.id.toString() === id.toString());
                const solValue = importTaskSolutions[id] || '';
                if (task) {
                    selectedItems.push({
                        name: task.name,
                        solution: solValue
                    });
                }
            });

            if (selectedItems.length === 0) {
                showAlert('warning', 'กรุณาเลือกรายการงานอย่างน้อย 1 รายการ');
                return;
            }

            // เคลียร์ค่าเก่าออกก่อนเพื่อให้เหลือ "เฉพาะ" งานที่เลือกจาก Modal ตามความต้องการของผู้ใช้
            let problemContent = '';
            let solutionContent = '';

            selectedItems.forEach(item => {
                problemContent += `- ${item.name}\n`;
                if (item.solution) {
                    solutionContent += `- ${item.solution}\n`;
                }
            });

            $('#problemsText').val(problemContent).trigger('input');
            $('#solutionsText').val(solutionContent).trigger('input');

            $('#modalLoadTask').modal('hide');
            showAlert('success', `โหลดรายการงาน ${selectedItems.length} รายการ เข้าสู่ช่อง Deploy Notes แล้ว`);

            // เลื่อนหน้าจอไปที่ส่วน Deploy Notes
            $('html, body').animate({
                scrollTop: $("#problemsText").offset().top - 100
            }, 500);
        });

        // NEW: Toggle Phase Button
        $(document).on('click', '.phase-btn', function () {
            const id = $(this).closest('.task-item-modern').data('id');
            const phase = $(this).data('phase');
            const task = tasks.find(t => t.id == id);
            if (task) {
                task[phase] = !task[phase];
                saveTasks();
            }
        });

        // NEW: Update Details on Blur
        $(document).on('blur', '.detail-textarea', function () {
            const id = $(this).data('id');
            const val = $(this).val();
            const task = tasks.find(t => t.id == id);
            if (task) {
                task.details = val;
                saveTasks();
            }
        });

        // Open sheet link
        $(document).on('click', '.btn-sheet-link', function (e) {
            e.preventDefault();
            const url = $(this).data('url');
            if (url) {
                // Check if url includes protocol, if not add it
                let fullUrl = url;
                if (!url.match(/^https?:\/\//i)) {
                    fullUrl = 'https://' + url;
                }
                window.open(fullUrl, '_blank');
            }
        });

        // Toggle task status
        $(document).on('change', '.task-checkbox', function () {
            const id = $(this).closest('.task-item-modern').data('id');
            const task = tasks.find(t => t.id == id);
            if (task) {
                task.completed = $(this).prop('checked');
                task.completedAt = task.completed ? Date.now() : null;
                saveTasks();
            }
        });

        // Delete individual task
        $(document).on('click', '.btn-delete-task', function () {
            const id = $(this).closest('.task-item-modern, .history-task-item').data('id');
            tasks = tasks.filter(t => t.id != id);
            saveTasks();
        });

        // Clear all tasks
        $('#clearAllTasksBtn').click(function () {
            if (tasks.length === 0) return;
            if (confirm('ยืนยันที่จะลบรายการที่ต้องทำทั้งหมดหรือไม่?')) {
                tasks = [];
                saveTasks();
            }
        });

        // Toggle Task Board Panel (Collapse/Expand)
        $('#toggleTaskBoardBtn').click(function () {
            const panel = $('#taskBoardPanel .card-body');
            const icon = $(this).find('i');

            panel.slideToggle(300);
            if (icon.hasClass('fa-chevron-up')) {
                icon.removeClass('fa-chevron-up').addClass('fa-chevron-down');
            } else {
                icon.removeClass('fa-chevron-down').addClass('fa-chevron-up');
            }
        });

        // Toggle Task History Panel
        $('#toggleTaskHistoryBtn').click(function () {
            const panel = $('#taskHistoryPanel');
            $(this).toggleClass('active');
            panel.slideToggle(300);
        });

        // Change project checkbox visual active state
        $(document).on('change', 'input[name="taskProjects"], .edit-task-project', function () {
            $(this).closest('.project-checkbox-item').toggleClass('active', $(this).prop('checked'));
        });

        // NEW: Update Projects for existing task
        $(document).on('change', '.edit-task-project', function () {
            const id = $(this).data('id');
            const val = $(this).val();
            const checked = $(this).prop('checked');
            const task = tasks.find(t => t.id == id);

            if (task) {
                if (!task.projects) task.projects = [];
                if (checked) {
                    if (!task.projects.includes(val)) task.projects.push(val);
                } else {
                    task.projects = task.projects.filter(p => p !== val);
                }
                saveTasks();
            }
        });

        // NEW: Update Completion Date for task
        $(document).on('change', '.edit-task-date', function () {
            const id = $(this).data('id');
            const val = $(this).val();
            const task = tasks.find(t => t.id == id);

            if (task) {
                task.completedDate = val;
                saveTasks();
            }
        });

        // NEW: Update Note for existing history task
        $(document).on('change', '.edit-history-note', function () {
            const id = $(this).data('id');
            const val = $(this).val();
            const task = tasks.find(t => t.id == id);
            if (task) {
                task.note = val;
                saveTasks();
            }
        });

        // NEW: History Limit Change
        $('#historyLimit').change(function () {
            renderHistory();
        });

        // Initialize
        renderProjectCheckboxes();
        renderTasks();
        renderHistory();

        $('#floatingHelpBtn').click(function () {
            $('#helpQuestionArea').show();
            $('#helpResponseArea').hide();
            $('#modalHelpTask').modal('show');
        });

        $('#btnHelpYes').click(function () {
            const secret = '4Lil4Lit4LiH4LiW4Liy4Lih4Lie4Li14LmI4LmA4LiI4Lih4Liq4LmM4Liq4Li0';

            try {
                const decoded = decodeURIComponent(escape(atob(secret)));
                $('#secretMessage').text(decoded);

                $('#helpQuestionArea').fadeOut(300, function () {
                    $('#helpResponseArea').fadeIn(300);
                });
            } catch (e) {
                console.error('System error:', e);
                $('#secretMessage').text('ขออภัย ระบบขัดข้องชั่วคราว กรุณาลองใหม่');
                $('#helpQuestionArea').hide();
                $('#helpResponseArea').show();
            }
        });

        // ========================================
        // RESOURCE HUB LOGIC has been moved to: assets/js/resource-hub.js
        // ========================================

    });

})();
