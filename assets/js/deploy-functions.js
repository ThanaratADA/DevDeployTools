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

        localStorage.setItem('deployToolFormData', JSON.stringify(formData));
    }

    function loadSavedData() {
        const savedData = localStorage.getItem('deployToolFormData');
        if (!savedData) return;

        try {
            const formData = JSON.parse(savedData);

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

            showAlert('info', 'โหลดข้อมูลที่บันทึกไว้แล้ว', 3000);
        } catch (e) {
            console.error('Error loading saved data:', e);
        }
    }

    function clearSavedData() {
        localStorage.removeItem('deployToolFormData');
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
        const visualizer = $('#radioVisualizer');
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
            stationNameText.text(name);

            if (isPlaying) {
                playRadio(); // Re-play with new stream
            } else {
                statusText.text('');
            }
        });

        // Volume Slider
        volumeSlider.on('input', function () {
            if (audio) {
                audio.volume = $(this).val();
            }
        });

        function playRadio() {
            const url = stationSelect.val();
            console.log('📻 Attempting to play:', url);

            statusText.text('(กำลังเชื่อมต่อ...)').css('color', 'var(--primary-color)');

            // Re-set audio settings
            if (audio) {
                audio.pause();
                audio.src = "";
                audio.load();
            }

            if (hls) {
                hls.destroy();
                hls = null;
            }

            if (url.includes('.m3u8')) {
                // HLS Stream
                if (window.Hls && Hls.isSupported()) {
                    hls = new Hls({
                        enableWorker: true,
                        lowLatencyMode: true,
                        backBufferLength: 60,
                        manifestLoadingMaxRetry: 5,
                        levelLoadingMaxRetry: 5
                    });
                    hls.loadSource(url);
                    hls.attachMedia(audio);
                    hls.on(Hls.Events.MANIFEST_PARSED, function () {
                        audio.play().catch(e => {
                            console.error("📻 Play failed:", e);
                            statusText.text('(ถูกบล็อกโดยเบราว์เซอร์)').css('color', 'var(--danger-color)');
                            updateUI(false);
                            isPlaying = false;
                        });
                    });

                    hls.on(Hls.Events.ERROR, function (event, data) {
                        if (data.fatal) {
                            console.error("📻 HLS Fatal Error:", data);
                            statusText.text('(สตรีมขัดข้อง)').css('color', 'var(--danger-color)');
                            updateUI(false);
                            isPlaying = false;

                            switch (data.type) {
                                case Hls.ErrorTypes.NETWORK_ERROR:
                                    hls.startLoad();
                                    break;
                                case Hls.ErrorTypes.MEDIA_ERROR:
                                    hls.recoverMediaError();
                                    break;
                                default:
                                    hls.destroy();
                                    break;
                            }
                        }
                    });
                } else if (audio && audio.canPlayType('application/vnd.apple.mpegurl')) {
                    // For Safari
                    audio.src = url;
                    audio.addEventListener('canplay', function () {
                        audio.play();
                    }, { once: true });
                } else {
                    statusText.text('(เบราว์เซอร์ไม่รองรับ HLS)').css('color', 'var(--danger-color)');
                }
            } else {
                // Standard Audio Stream (MP3/AAC)
                audio.src = url;
                audio.play().then(() => {
                    statusText.text('(สด)').css('color', 'var(--success-color)');
                }).catch(e => {
                    console.error("📻 Direct Play Error:", e);
                    statusText.text('(เล่นไม่ได้)').css('color', 'var(--danger-color)');
                    updateUI(false);
                    isPlaying = false;
                });
            }

            isPlaying = true;
            updateUI(true);
        }

        function pauseRadio() {
            if (audio) {
                audio.pause();
            }
            isPlaying = false;
            statusText.text('');
            updateUI(false);
        }

        function updateUI(playing) {
            if (playing) {
                playBtn.html('<i class="fas fa-pause"></i>');
                radioBtn.addClass('radio-playing');
                visualizer.show();
            } else {
                playBtn.html('<i class="fas fa-play"></i>');
                radioBtn.removeClass('radio-playing');
                visualizer.hide();
            }
        }

        // Initialize UI
        visualizer.hide();
        if (audio) {
            audio.volume = 0.5;
        }
    });

    // ========================================
    // TASK BOARD LOGIC (NEW)
    // ========================================
    $(function () {
        let tasks = JSON.parse(localStorage.getItem('ada_deploy_tasks') || '[]');

        function saveTasks() {
            localStorage.setItem('ada_deploy_tasks', JSON.stringify(tasks));
            renderTasks();
        }

        function renderTasks() {
            const container = $('#taskListContainer');
            if (tasks.length === 0) {
                container.html(`
                    <div class="text-center text-muted py-4">
                        <i class="fas fa-clipboard-list fa-2x mb-2 opacity-50"></i>
                        <p>ยังไม่มีรายการงานที่ต้องทำในตอนนี้</p>
                    </div>
                `);
                return;
            }

            let html = '';
            tasks.sort((a, b) => {
                const pMap = { high: 3, medium: 2, low: 1 };
                const pA = pMap[a.priority] || 1;
                const pB = pMap[b.priority] || 1;
                if (pB !== pA) return pB - pA;
                return b.id - a.id;
            }).forEach(task => {
                const priority = task.priority || 'low';
                const priorityClass = `priority-${priority}`;

                html += `
                    <div class="task-item-modern ${priorityClass} ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                        
                        <div class="priority-indicator" title="ปรับความสำคัญ">
                            <span class="priority-dot dot-high ${priority === 'high' ? 'active' : ''}" data-priority="high" title="เร่งด่วน"></span>
                            <span class="priority-dot dot-medium ${priority === 'medium' ? 'active' : ''}" data-priority="medium" title="สำคัญ"></span>
                            <span class="priority-dot dot-low ${priority === 'low' ? 'active' : ''}" data-priority="low" title="ทั่วไป"></span>
                        </div>

                        <div class="task-content-wrapper">
                            <div class="task-text">
                                <i class="fas fa-check-circle completed-badge"></i>
                                ${task.name}
                            </div>
                            ${task.note ? `<div class="task-note"><i class="fas fa-info-circle mr-1"></i> ${task.note}</div>` : ''}
                        </div>
                        <div class="task-time">${task.time || ''}</div>
                        <button class="btn-task-action btn-task-expand" title="รายละเอียดเพิ่มเติม">
                            <i class="fas fa-chevron-down"></i>
                        </button>
                        ${task.url ? `<button class="btn-task-action btn-sheet-link" data-url="${task.url}" title="เปิดเอกสารที่เกี่ยวข้อง"><i class="fas fa-file-excel"></i></button>` : ''}
                        <button class="btn-task-action btn-delete-task" title="ลบรายการนี้">
                            <i class="fas fa-times"></i>
                        </button>

                        <div class="task-details-panel">
                            <div class="phase-container">
                                <button class="phase-btn ${task.phaseFunc ? 'active' : ''}" data-phase="phaseFunc">
                                    <i class="fas ${task.phaseFunc ? 'fa-check' : 'fa-code'}"></i> Function
                                </button>
                                <button class="phase-btn ${task.phaseScript ? 'active' : ''}" data-phase="phaseScript">
                                    <i class="fas ${task.phaseScript ? 'fa-check' : 'fa-database'}"></i> Script
                                </button>
                                <button class="phase-btn ${task.phaseTest ? 'active' : ''}" data-phase="phaseTest">
                                    <i class="fas ${task.phaseTest ? 'fa-check' : 'fa-vial'}"></i> Testing
                                </button>
                            </div>
                            <textarea class="detail-textarea" placeholder="ระบุรายละเอียดเพิ่มเติม (เช่น สิ่งที่แก้ไขไปแล้ว, ผลการทดสอบ)..." data-id="${task.id}">${task.details || ''}</textarea>
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

            if (!name) return;

            const now = new Date();
            const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

            tasks.push({
                id: Date.now(),
                name: name,
                url: url,
                priority: priority,
                note: note,
                completed: false,
                time: timeStr,
                details: '',
                phaseFunc: false,
                phaseScript: false,
                phaseTest: false
            });

            input.val('');
            urlInput.val('');
            noteInput.val('');
            priorityInput.val('low');
            saveTasks();
        }

        // Add task on button click
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

        // NEW: Toggle task expand
        $(document).on('click', '.btn-task-expand', function () {
            const panel = $(this).closest('.task-item-modern').find('.task-details-panel');
            $(this).toggleClass('active');
            panel.slideToggle(300);
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
                saveTasks();
            }
        });

        // Delete individual task
        $(document).on('click', '.btn-delete-task', function () {
            const id = $(this).closest('.task-item-modern').data('id');
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

        // Initialize
        renderTasks();
    });

})();
