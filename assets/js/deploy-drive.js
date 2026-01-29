/**
 * Deploy Drive
 * Handles Google Drive Links helper logic.
 */

$(document).ready(function () {
    $('#autoFillLinksBtn').on('click', handleAutoFillLinks);

    // Open Link Buttons
    $('#openLinkXPatch').on('click', function (e) { e.preventDefault(); openInputLink('linkXPatch'); });
    $('#openLinkXUpgrade').on('click', function (e) { e.preventDefault(); openInputLink('linkXUpgrade'); });
    $('#openLinkXDatabase').on('click', function (e) { e.preventDefault(); openInputLink('linkXDatabase'); });
    $('#openLinkUnitTest').on('click', function (e) { e.preventDefault(); openInputLink('linkUnitTest'); });
    $('#openLinkImpact').on('click', function (e) { e.preventDefault(); openInputLink('linkImpact'); });

    // Quick Access
    $('#openXPatchBtn').on('click', function () { openGoogleDriveLink('xPatch'); });
    $('#openXUpgradeBtn').on('click', function () { openGoogleDriveLink('xUpgrade'); });
    $('#openXDatabaseBtn').on('click', function () { openGoogleDriveLink('xDatabase'); });
    $('#openUnitTestBtn').on('click', function () { downloadUnitTestTemplate(); });
    $('#openVersionHistoryBtn').on('click', function () { openGoogleDriveLink('versionHistory'); });

    // View Last Version (Sheet)
    $('#openLastVersionBtn, #openLastVersionSheetBtn').on('click', function () {
        if (!window.currentProject) { showAlert('warning', 'กรุณาเลือกโปรเจ็คก่อน'); return; }
        const drivePaths = window.deployConfig.googleDrivePaths[window.currentProject] || {};
        const url = drivePaths.lastVersionView || drivePaths.lastVersion;
        if (url) window.open(url, '_blank');
        else showAlert('warning', 'ไม่พบ Link ใน Config');
    });

    // Get Last Version from Sheet logic
    $('#getLastVersionBtn').on('click', handleGetLastVersion);

    // Update next version when current version changes
    $('#oetLastVersion').on('input', updateNextVersion);

    // Link Inputs Change -> Trigger Update Notes
    $('#linkXPatch, #linkXUpgrade, #linkXDatabase, #linkUnitTest, #linkImpact').on('input', function () {
        if (typeof updateDeployNotes === 'function') updateDeployNotes();
    });
});

function autoFillLinksFromConfig() {
    if (!window.currentProject) return;
    const drivePaths = window.deployConfig.googleDrivePaths[window.currentProject] || {};

    if (!$('#linkXUpgrade').val() && drivePaths.xUpgrade) $('#linkXUpgrade').val(drivePaths.xUpgrade);
    if (!$('#linkXDatabase').val() && drivePaths.xDatabase) $('#linkXDatabase').val(drivePaths.xDatabase);

    $('#linkXPatch').val('');
    $('#linkUnitTest').val('');
    $('#linkImpact').val('');
}

function handleAutoFillLinks() {
    if (!window.currentProject) { showAlert('warning', 'กรุณาเลือกโปรเจ็คก่อน'); return; }
    const drivePaths = window.deployConfig.googleDrivePaths[window.currentProject] || {};

    if (!drivePaths.xUpgrade && !drivePaths.xDatabase) {
        showAlert('warning', 'ไม่พบ Base Links ในการตั้งค่า<br>กรุณาตั้งค่า Base Links ก่อน');
        return;
    }

    if (drivePaths.xUpgrade) $('#linkXUpgrade').val(drivePaths.xUpgrade);
    if (drivePaths.xDatabase) $('#linkXDatabase').val(drivePaths.xDatabase);
    $('#linkXPatch').val('');
    $('#linkUnitTest').val('');
    $('#linkImpact').val('');

    showAlert('success', 'Auto-fill Links สำเร็จ');
    if (typeof updateDeployNotes === 'function') updateDeployNotes();
}

function clearLinks() {
    $('#linkXPatch').val('');
    $('#linkXUpgrade').val('');
    $('#linkXDatabase').val('');
    $('#linkUnitTest').val('');
    $('#linkImpact').val('');
}

function openGoogleDriveLink(linkType) {
    if (!window.currentProject) { showAlert('warning', 'กรุณาเลือกโปรเจ็คก่อน'); return; }
    if (linkType === 'unitTest') { downloadUnitTestTemplate(); return; }

    const drivePaths = window.deployConfig.googleDrivePaths[window.currentProject] || {};
    const link = drivePaths[linkType];
    if (!link) {
        showAlert('warning', `ไม่พบ Link สำหรับ ${linkType}<br>กรุณาตั้งค่าใน Configuration`);
        return;
    }
    window.open(link, '_blank');
}

function downloadUnitTestTemplate() {
    if (!window.currentProject) { showAlert('warning', 'กรุณาเลือกโปรเจ็คก่อน'); return; }
    const googleSheetId = "1JI1iyxKwxclFWcKmdYcF9jAnlqH1Rc78";
    const url = `https://docs.google.com/spreadsheets/d/${googleSheetId}/export?format=xlsx`;
    window.location.href = url;
    alert(`✅ กำลังเริ่มดาวน์โหลด Unit Test Template...`);
}

function openInputLink(inputId) {
    let link = $(`#${inputId}`).val().trim();
    if (!link) {
        const configKeyMap = {
            'linkXPatch': null,
            'linkXUpgrade': 'xUpgrade',
            'linkXDatabase': 'xDatabase',
            'linkUnitTest': null,
            'linkImpact': 'impact'
        };
        const configKey = configKeyMap[inputId];
        if (configKey && window.currentProject) {
            const drivePaths = window.deployConfig.googleDrivePaths[window.currentProject] || {};
            link = drivePaths[configKey];
        }
    }

    if (!link) {
        showAlert('warning', 'กรุณากรอก Link หรือตั้งค่าใน Config');
        return;
    }
    if (!link.startsWith('http')) {
        showAlert('warning', 'Link ไม่ถูกต้อง (ต้องเริ่มด้วย http/https)');
        return;
    }
    window.open(link, '_blank');
}

function updateQuickAccessButtons() {
    if (!window.currentProject) { $('#quickAccessButtons').hide(); return; }
    const drivePaths = window.deployConfig.googleDrivePaths[window.currentProject] || {};

    $('#openXPatchBtn').toggle(!!drivePaths.xPatch);
    $('#openXUpgradeBtn').toggle(!!drivePaths.xUpgrade);
    $('#openXDatabaseBtn').toggle(!!drivePaths.xDatabase);
    $('#openUnitTestBtn').show();
    $('#openVersionHistoryBtn').toggle(!!drivePaths.versionHistory);
    $('#openLastVersionBtn').toggle(!!drivePaths.lastVersion);
    $('#quickAccessButtons').show();
}

function handleGetLastVersion() {
    if (!window.currentProject) { showAlert('warning', 'กรุณาเลือกโปรเจ็คก่อน'); return; }
    const drivePaths = window.deployConfig.googleDrivePaths[window.currentProject] || {};
    const sheetUrl = drivePaths.lastVersion;

    if (!sheetUrl) {
        showAlert('warning', 'ไม่พบ Link "Last Version" (Sheet)<br>กรุณาตั้งค่าใน Configuration');
        return;
    }

    const btn = $('#getLastVersionBtn');
    const originalHtml = btn.html();
    btn.html('<i class="fas fa-spinner fa-spin"></i> Loading...').prop('disabled', true);

    const searchName = drivePaths.sheetAppName || window.currentProject;

    $.ajax({
        url: 'includes/get-sheet-version.php',
        method: 'GET',
        data: { url: sheetUrl, app: searchName },
        dataType: 'json',
        success: function (response) {
            if (response.success) {
                $('input[name="version"]').val(response.version);
                $('#lastUpdateDate').val(response.deployDate || '-');
                $('#lastUpdateBy').val(response.colE || '-');
                showAlert('success', `ดึงเวอร์ชั่นล่าสุดสำเร็จ`);

                const now = new Date();
                const dateTimeStr = now.toLocaleDateString('th-TH') + ' ' + now.toLocaleTimeString('th-TH', { hour12: false });
                $('#syncTime').text(dateTimeStr);
                $('#syncStatus').fadeIn();

                updateNextVersion();
            } else {
                showAlert('warning', 'ไม่สามารถอ่านเวอร์ชั่นได้: ' + response.message);
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

function updateNextVersion() {
    const lastVer = $('#oetLastVersion').val().trim();
    if (!lastVer) return;

    const parts = lastVer.split('.');
    const len = parts.length;
    if (len >= 2) {
        const runnerIdx = len - 2;
        const lastIdx = len - 1;
        let runnerStr = parts[runnerIdx];
        let patchNum = parseInt(runnerStr);

        if (!isNaN(patchNum)) {
            parts[runnerIdx] = (patchNum + 1).toString().padStart(runnerStr.length, '0');
            parts[lastIdx] = "00";
            const nextVer = parts.join('.');
            $('#oetNextVersion').val(nextVer).trigger('change');
        }
    }
}
