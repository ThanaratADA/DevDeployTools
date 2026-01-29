/**
 * Deploy History
 * Handles fetching and displaying previous deployments.
 */

$(document).ready(function () {
    $('#refreshHistoryBtn').on('click', loadDeployHistory);
});

function loadDeployHistory() {
    if (!window.currentProject) {
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
            project: window.currentProject
        },
        dataType: 'json',
        success: function (response) {
            if (response.success) {
                displayDeployHistory(response.history);
            } else {
                showHistoryError();
            }
        },
        error: function () {
            showHistoryError();
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
                    <span class="history-folder"><i class="fas fa-folder"></i> ${escapeHtml(item.folder)}</span>
                    <span class="history-date"><i class="fas fa-clock"></i> ${dateStr}</span>
                </div>
                <div class="history-content">${escapeHtml(item.readme)}</div>
            </div>
        `);
        container.append(historyItem);
    });
}

function showHistoryError() {
    $('#deployHistory').html(`
        <div class="text-center text-danger">
            <i class="fas fa-exclamation-triangle fa-2x mb-3"></i>
            <p>เกิดข้อผิดพลาดในการโหลดประวัติ</p>
        </div>
    `);
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
