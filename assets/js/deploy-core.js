/**
 * Deploy Core
 * Handles initialization, global state, form submission, and utilities.
 */

// ========================================
// GLOBAL STATE
// ========================================
window.selectedCommits = [];
window.currentProject = '';
window.saveDraftTimer = null;

$(document).ready(function () {
    initializeCoreEventHandlers();
    loadSavedData();
    applyPanelLayout();
});

function initializeCoreEventHandlers() {
    // Project selection
    $('#projectSelect').on('change', handleProjectChange);

    // Form submission
    $('#deployForm').on('submit', handleFormSubmit);

    // Auto-save on input
    $('#deployForm input, #deployForm textarea, #deployForm select').on('change input', saveFormData);

    // Toggle History button
    $('#toggleHistoryBtn').on('click', function () {
        const cardBody = $('#historyPanel').find('.card-body');
        const icon = $(this).find('i');
        cardBody.slideToggle(300, function () {
            savePanelCollapsedState('historyPanel', !$(this).is(':visible'));
        });
        icon.toggleClass('fa-chevron-up fa-chevron-down');
    });
}

/**
 * Save panel collapsed state to localStorage
 */
window.savePanelCollapsedState = function (panelId, isCollapsed) {
    let states = JSON.parse(localStorage.getItem('ada_deploy_collapsed') || '{}');
    states[panelId] = isCollapsed;
    localStorage.setItem('ada_deploy_collapsed', JSON.stringify(states));
};

// ========================================
// PROJECT CHANGE HANDLER (ORCHESTRATOR)
// ========================================
function handleProjectChange() {
    window.currentProject = $(this).val();

    // Update select styling
    if (window.currentProject) {
        $(this).removeClass('text-muted').addClass('text-primary');

        // Update Project Select Status with current time
        const now = new Date();
        const dateTimeStr = now.toLocaleDateString('th-TH') + ' ' + now.toLocaleTimeString('th-TH', { hour12: false });
        // Assuming these IDs exist
        $('#projectSelectTime').text(dateTimeStr);
        $('#projectSelectStatus').fadeIn();
    } else {
        $(this).removeClass('text-primary').addClass('text-muted');
        $('#projectSelectStatus').fadeOut();
    }

    if (!window.currentProject) {
        if (typeof resetCommitsList === 'function') resetCommitsList();
        if (typeof resetHistory === 'function') resetHistory();
        if (typeof clearLinks === 'function') clearLinks();
        return;
    }

    // Call modules
    if (typeof autoFillLinksFromConfig === 'function') autoFillLinksFromConfig();
    if (typeof handleGetLastVersion === 'function') handleGetLastVersion();
    if (typeof updateQuickAccessButtons === 'function') updateQuickAccessButtons();

    // Git Commits
    if (typeof showCommitsLoading === 'function') showCommitsLoading();

    const commitsLimit = $('#commitsLimit').val() || 30;

    $.ajax({
        url: '',
        method: 'POST',
        data: {
            action: 'getCommits',
            project: window.currentProject,
            limit: commitsLimit
        },
        dataType: 'json',
        success: function (response) {
            if (response.success) {
                if (typeof displayCommits === 'function') displayCommits(response.commits);
                if (response.branch && typeof updateBranchDisplay === 'function') {
                    updateBranchDisplay(response.branch);
                }
            } else {
                if (typeof showCommitsError === 'function') showCommitsError(response.message);
            }
        },
        error: function () {
            if (typeof showCommitsError === 'function') showCommitsError('เกิดข้อผิดพลาดในการโหลด commits');
        }
    });

    // History
    if (typeof loadDeployHistory === 'function') loadDeployHistory();
}

// ========================================
// FORM SUBMISSION
// ========================================
function handleFormSubmit(e) {
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

    const confirmMsg = `คุณต้องการ Deploy โปรเจ็ค ${project} เวอร์ชั่น ${version} หรือไม่?`;
    if (!confirm(confirmMsg)) {
        e.preventDefault();
        return false;
    }

    const submitBtn = $('#deployForm button[type="submit"]');
    submitBtn.html('<i class="fas fa-spinner fa-spin"></i> กำลัง Deploy...').prop('disabled', true);

    clearSavedData();
}

// ========================================
// LOCAL STORAGE (AUTO-SAVE)
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
        linkXPatch: $('#linkXPatch').val(),
        linkXUpgrade: $('#linkXUpgrade').val(),
        linkXDatabase: $('#linkXDatabase').val(),
        linkUnitTest: $('#linkUnitTest').val(),
        linkImpact: $('#linkImpact').val(),
        commitsLimit: $('#commitsLimit').val()
    };

    localStorage.setItem('deployToolFormData', JSON.stringify(formData));

    if (window.saveDraftTimer) clearTimeout(window.saveDraftTimer);
    window.saveDraftTimer = setTimeout(function () {
        $.ajax({
            url: '',
            method: 'POST',
            data: {
                action: 'saveDraft',
                draft: JSON.stringify(formData)
            },
            success: function () {
                console.log('Draft saved to server');
            }
        });
    }, 2000);
}

function loadSavedData() {
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
                const savedData = localStorage.getItem('deployToolFormData');
                if (savedData) {
                    applyFormData(JSON.parse(savedData));
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

        if (formData.linkXPatch) $('#linkXPatch').val(formData.linkXPatch);
        if (formData.linkXUpgrade) $('#linkXUpgrade').val(formData.linkXUpgrade);
        if (formData.linkXDatabase) $('#linkXDatabase').val(formData.linkXDatabase);
        if (formData.linkUnitTest) $('#linkUnitTest').val(formData.linkUnitTest);
        if (formData.linkImpact) $('#linkImpact').val(formData.linkImpact);

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
// UTILITIES
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

    $('.main-container').prepend(alert);

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
// PANEL LAYOUT MANAGER
// ========================================
function applyPanelLayout() {
    let config = JSON.parse(localStorage.getItem('ada_deploy_layout') || 'null');

    // Migration: Move historyPanel from topPanels to workflowPanels if found
    if (config && config.topPanels) {
        const historyIndex = config.topPanels.findIndex(p => p.id === 'historyPanel');
        if (historyIndex > -1) {
            const historyItem = config.topPanels.splice(historyIndex, 1)[0];
            if (!config.workflowPanels) config.workflowPanels = [];
            // Ensure not duplicate
            if (!config.workflowPanels.find(p => p.id === 'historyPanel')) {
                config.workflowPanels.push(historyItem);
            }
            localStorage.setItem('ada_deploy_layout', JSON.stringify(config));
        }
    }

    if (!config) return;

    // Apply Top Panels (Dashboard, Links, History)
    // We reverse iterate and insertAfter header to maintain Order 1, 2, 3 at the top
    if (config.topPanels && config.topPanels.length > 0) {
        const panels = config.topPanels.slice().reverse();
        panels.forEach(panel => {
            const el = $('#' + panel.id);
            if (el.length) {
                el.insertAfter('.header-section');
                if (config.hidden && config.hidden.includes(panel.id)) el.hide(); else el.show();
            }
        });
    }

    // Apply Workflow Panels (Project, TaskBoard, Git, Notes, Drive)
    // We append to form container in order
    const form = $('#deployForm');
    if (config.workflowPanels && config.workflowPanels.length > 0) {
        config.workflowPanels.forEach(panel => {
            const el = $('#' + panel.id);
            if (el.length) {
                form.append(el);
                if (config.hidden && config.hidden.includes(panel.id)) el.hide(); else el.show();
            }
        });
    }

    // Ensure Deploy Button is always at the bottom
    const btnContainer = $('#deployButtonContainer');
    if (btnContainer.length) {
        form.append(btnContainer);
    }

    // Apply Collapsed States (New)
    let collapsedStates = JSON.parse(localStorage.getItem('ada_deploy_collapsed') || '{}');
    Object.keys(collapsedStates).forEach(panelId => {
        if (collapsedStates[panelId]) {
            const panel = $('#' + panelId);
            if (panel.length) {
                panel.find('.card-body').hide();
                // Update icon (assuming standard toggle buttons)
                const toggleBtn = panel.find('[id^="toggle"]');
                if (toggleBtn.length) {
                    const icon = toggleBtn.find('i');
                    icon.removeClass('fa-chevron-up').addClass('fa-chevron-down');
                }
            }
        }
    });
}
