/**
 * Deploy Templates
 * Handles Readme generation and template features.
 */

$(document).ready(function () {
    $('#loadTemplateBtn').on('click', handleLoadTemplate);
    $('#downloadReadmeBtn').on('click', handleDownloadReadme);
    $('#problemsText, #solutionsText, #remarksText, #configText').on('input', updateDeployNotes);
});

function handleLoadTemplate() {
    if (!window.currentProject) { showAlert('warning', 'กรุณาเลือกโปรเจ็คก่อน'); return; }

    const template = window.deployConfig.readmeTemplates[window.currentProject];
    if (!template) { showAlert('warning', 'ไม่พบ template สำหรับโปรเจ็คนี้'); return; }

    const problems = $('#problemsText').val().trim();
    const solutions = $('#solutionsText').val().trim();
    const remarks = $('#remarksText').val().trim();
    const configText = $('#configText').val().trim();
    const version = $('input[name="version"]').val().trim();

    const linkXPatch = $('#linkXPatch').val().trim();
    const linkXUpgrade = $('#linkXUpgrade').val().trim();
    const linkXDatabase = $('#linkXDatabase').val().trim();
    const linkUnitTest = $('#linkUnitTest').val().trim();
    const linkImpact = $('#linkImpact').val().trim();

    let content = template;
    content = content.replace(/{PROJECT}/g, window.currentProject);
    content = content.replace(/{VERSION}/g, version || 'XX.XX.XX.XX.XX.XX');
    content = content.replace(/{PROBLEMS}/g, problems || '- ระบุปัญหาที่นี่');
    content = content.replace(/{SOLUTIONS}/g, solutions || '- ระบุวิธีแก้ไขที่นี่');
    content = content.replace(/{REMARKS}/g, remarks || '- ไม่มี');
    content = content.replace(/{CONFIG}/g, configText || '- ไม่มี');

    const drivePaths = window.deployConfig.googleDrivePaths[window.currentProject] || {};
    content = content.replace(/{X_PATCH}/g, linkXPatch || drivePaths.xPatch || 'ไม่มี');
    content = content.replace(/{X_UPGRADE}/g, linkXUpgrade || drivePaths.xUpgrade || 'ไม่มี');
    content = content.replace(/{X_DATABASE}/g, linkXDatabase || drivePaths.xDatabase || 'ไม่มี');
    content = content.replace(/{UNIT_TEST}/g, linkUnitTest || drivePaths.unitTest || 'ไม่มี');
    content = content.replace(/{IMPACT}/g, linkImpact || drivePaths.impact || 'ไม่มี');
    content = content.replace(/{VERSION_HISTORY}/g, drivePaths.versionHistory || 'ไม่มี');
    content = content.replace(/{LAST_VERSION}/g, drivePaths.lastVersionView || drivePaths.lastVersion || 'ไม่มี');

    $('#deployNotes').val(content);
    showAlert('success', 'โหลด template สำเร็จ');
}

function updateDeployNotes() {
    const currentNotes = $('#deployNotes').val();
    if (!currentNotes.includes('{')) return; // Not using template format
    handleLoadTemplate();
}

function handleDownloadReadme() {
    const project = window.currentProject;
    const version = $('input[name="version"]').val().trim();
    const content = $('#deployNotes').val().trim();

    if (!project) { showAlert('warning', 'กรุณาเลือกโปรเจ็คก่อน'); return; }
    if (!version) { showAlert('warning', 'กรุณาระบุเวอร์ชั่นก่อน'); return; }
    if (!content) { showAlert('warning', 'กรุณาระบุ Deploy Notes ก่อน'); return; }

    const form = $('<form>', { method: 'POST', action: '' });
    form.append($('<input>', { type: 'hidden', name: 'action', value: 'downloadReadme' }));
    form.append($('<input>', { type: 'hidden', name: 'project', value: project }));
    form.append($('<input>', { type: 'hidden', name: 'version', value: version }));
    form.append($('<input>', { type: 'hidden', name: 'content', value: content }));

    $('body').append(form);
    form.submit();
    form.remove();

    showAlert('success', 'กำลังดาวน์โหลด Readme...');
}
