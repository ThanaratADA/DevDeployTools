/**
 * Deploy Git
 * Handles Commits fetching, caching, display, and file loading.
 */

$(document).ready(function () {
    // Event Handlers for Git Ops
    $('#loadFilesBtn').on('click', handleLoadFiles);
    $('#clearFilesBtn').on('click', handleClearFiles);
    $('#commitsLimit').on('change', handleCommitsLimitChange);
});

function handleCommitsLimitChange() {
    if (!window.currentProject) return;

    // Save choice
    if (typeof saveFormData === 'function') saveFormData();

    showCommitsLoading();
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
                displayCommits(response.commits);
                if (response.branch) updateBranchDisplay(response.branch);
                if (typeof showAlert === 'function') showAlert('success', `โหลด ${response.commits.length} commits สำเร็จ`, 2000);
            } else {
                showCommitsError(response.message);
            }
        },
        error: function () {
            showCommitsError('เกิดข้อผิดพลาดในการโหลด commits');
        }
    });
}

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
        const commitDate = new Date(commit.date);
        const dateStr = commitDate.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
        const timeStr = commitDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

        const commitItem = $(`
            <div class="commit-item" data-hash="${commit.hash}">
                <input type="checkbox" class="commit-checkbox" value="${commit.hash}">
                <div class="commit-details">
                    <div class="commit-header">
                        <span class="commit-hash">${commit.hash}</span>
                        <span class="commit-branch"><i class="fas fa-code-branch"></i> ${escapeHtml(commit.branch)}</span>
                    </div>
                    <div class="commit-message">${escapeHtml(commit.message)}</div>
                    <div class="commit-meta">
                        <span class="commit-author"><i class="fas fa-user"></i> ${escapeHtml(commit.author)}</span>
                        <span class="commit-date"><i class="fas fa-calendar"></i> ${dateStr}</span>
                        <span class="commit-time"><i class="fas fa-clock"></i> ${timeStr}</span>
                    </div>
                </div>
            </div>
        `);

        commitItem.on('click', function (e) {
            if (e.target.type !== 'checkbox') {
                const checkbox = $(this).find('.commit-checkbox');
                checkbox.prop('checked', !checkbox.prop('checked')).trigger('change');
            }
        });

        commitItem.find('.commit-checkbox').on('change', function () {
            const hash = $(this).val();
            const isChecked = $(this).prop('checked');
            if (isChecked) {
                window.selectedCommits.push(hash);
                $(this).closest('.commit-item').addClass('selected');
            } else {
                window.selectedCommits = window.selectedCommits.filter(h => h !== hash);
                $(this).closest('.commit-item').removeClass('selected');
            }
            $('#loadFilesBtn').prop('disabled', window.selectedCommits.length === 0);
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
    window.selectedCommits = [];
    $('#loadFilesBtn').prop('disabled', true);
    $('#currentBranch').remove();
}

function updateBranchDisplay(branch) {
    $('#currentBranch').remove();
    const branchBadge = $(`
        <span id="currentBranch" style="margin-left: 15px; font-size: 0.9rem; color: rgba(255,255,255,0.9);">
            <i class="fas fa-code-branch"></i> ${escapeHtml(branch)}
        </span>
    `);
    $('.card-header-custom:contains("Git Commits Selection")').append(branchBadge);
}

function handleLoadFiles() {
    if (window.selectedCommits.length === 0) {
        if (typeof showAlert === 'function') showAlert('warning', 'กรุณาเลือก commits ก่อน');
        return;
    }

    const btn = $(this);
    const originalHtml = btn.html();
    btn.html('<i class="fas fa-spinner fa-spin"></i> กำลังโหลด...').prop('disabled', true);

    $.ajax({
        url: '',
        method: 'POST',
        data: {
            action: 'getChangedFiles',
            project: window.currentProject,
            commits: window.selectedCommits
        },
        dataType: 'json',
        success: function (response) {
            if (response.success) {
                const currentFiles = $('#filesList').val().trim();
                const newFiles = response.files.join('\n');
                if (currentFiles) {
                    const allFiles = [...new Set([...currentFiles.split('\n'), ...response.files])];
                    $('#filesList').val(allFiles.join('\n'));
                } else {
                    $('#filesList').val(newFiles);
                }
                showAlert('success', `โหลดไฟล์สำเร็จ: ${response.files.length} ไฟล์`);
                $('html, body').animate({ scrollTop: $('#filesList').offset().top - 100 }, 500);
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

function handleClearFiles() {
    if (confirm('คุณต้องการล้างรายการไฟล์ทั้งหมดหรือไม่?')) {
        $('#filesList').val('');
        showAlert('info', 'ล้างรายการไฟล์แล้ว');
    }
}
