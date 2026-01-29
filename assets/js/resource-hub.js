/**
 * Resource Hub (Center Links) Logic
 * Separated from deploy-functions.js
 */

(function () {
    'use strict';

    let centerLinks = []; // Global within this scope

    // ----------------------------------------
    // HELPER FUNCTIONS (Hoisted)
    // ----------------------------------------

    function loadLinks() {
        $.post('', { action: 'getLinks' }, function (response) {
            try {
                const res = JSON.parse(response);
                if (res.success) {
                    centerLinks = res.links;
                    renderLinks();
                }
            } catch (e) {
                console.error('Error parsing links:', e);
            }
        });
    }

    function saveLinks() {
        $.post('', {
            action: 'saveLinks',
            links: JSON.stringify(centerLinks)
        }, function (response) {
            try {
                const res = JSON.parse(response);
                if (!res.success) showAlert('danger', 'เกิดข้อผิดพลาดในการบันทึกลิงก์');
            } catch (e) {
                console.error('Error saving links:', e);
            }
        });
    }

    function handleCategoryFields(cat) {
        $('#extraFields > div').addClass('d-none');
        $(`.extra-${cat}`).removeClass('d-none');

        // Toggle Custom Color Picker
        if (cat === 'meeting' || cat === 'sheet' || cat === 'other') {
            $('#customColorGroup').removeClass('d-none').show();
        } else {
            $('#customColorGroup').hide();
        }
    }

    function addCredentialItem(user, pass, role = 'HQ', desc = '', extra = {}) {
        const roleOptions = `
            <option value="HQ" ${role === 'HQ' ? 'selected' : ''}>HQ</option>
            <option value="Agency" ${role === 'Agency' ? 'selected' : ''}>Agency</option>
            <option value="Branch" ${role === 'Branch' ? 'selected' : ''}>Branch</option>
        `;

        // Random Pastel Background Color
        const hue = Math.floor(Math.random() * 360);
        const bgColor = `hsl(${hue}, 100%, 97%)`;
        const borderColor = `hsl(${hue}, 100%, 90%)`;

        // Extra Values (Safe access)
        const agnCode = extra.agnCode || '';
        const agnName = extra.agnName || '';
        const bchCode = extra.bchCode || '';
        const bchName = extra.bchName || '';

        // Visibility Classes
        const showAgency = (role === 'Agency' || role === 'Branch') ? '' : 'd-none';
        const showBranch = (role === 'Branch') ? '' : 'd-none';

        const item = $(`
                <div class="credential-item mb-3 border p-3 rounded position-relative" style="background-color: ${bgColor}; border-color: ${borderColor} !important;">
                    <button type="button" class="close text-danger position-absolute" style="top: -10px; right: -5px; opacity: 1; background: #fff; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border: 1px solid #ffadad; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" onclick="$(this).parent().remove()">
                        <span aria-hidden="true" style="font-size: 1.2rem; line-height: 0;">&times;</span>
                    </button>
                    <div class="row">
                        <div class="col-5">
                            <label class="small text-muted mb-0">Username</label>
                            <input type="text" class="form-control form-control-sm credential-user mb-2" value="${user}">
                        </div>
                        <div class="col-4">
                            <label class="small text-muted mb-0">Password</label>
                            <input type="text" class="form-control form-control-sm credential-pass mb-2" value="${pass}">
                        </div>
                        <div class="col-3">
                            <label class="small text-muted mb-0">Role</label>
                            <select class="form-control form-control-sm credential-role mb-2">
                                ${roleOptions}
                            </select>
                        </div>
                        
                        <!-- Agency Fields -->
                        <div class="col-12 agency-fields ${showAgency} bg-white p-2 mb-2 rounded border border-light">
                             <div class="row">
                                <div class="col-6">
                                    <label class="small text-muted mb-0">รหัสตัวแทน (Agency Code)</label>
                                    <input type="text" class="form-control form-control-sm credential-agn-code" value="${agnCode}" placeholder="เช่น AGN00xxx">
                                </div>
                                <div class="col-6">
                                    <label class="small text-muted mb-0">ชื่อตัวแทน (Agency Name)</label>
                                    <input type="text" class="form-control form-control-sm credential-agn-name" value="${agnName}" placeholder="ระบุชื่อตัวแทน">
                                </div>
                             </div>
                        </div>

                        <!-- Branch Fields -->
                        <div class="col-12 branch-fields ${showBranch} bg-white p-2 mb-2 rounded border border-light">
                             <div class="row">
                                <div class="col-6">
                                    <label class="small text-muted mb-0">รหัสสาขา (Branch Code)</label>
                                    <input type="text" class="form-control form-control-sm credential-bch-code" value="${bchCode}" placeholder="เช่น BCH00xxx">
                                </div>
                                <div class="col-6">
                                    <label class="small text-muted mb-0">ชื่อสาขา (Branch Name)</label>
                                    <input type="text" class="form-control form-control-sm credential-bch-name" value="${bchName}" placeholder="ระบุชื่อสาขา">
                                </div>
                             </div>
                        </div>

                        <div class="col-12">
                            <input type="text" class="form-control form-control-sm credential-desc" placeholder="คำอธิบายเพิ่มเติม (Description)" value="${desc}">
                        </div>
                    </div>
                </div>
            `);

        // Bind Change Event for Role
        item.find('.credential-role').change(function () {
            const val = $(this).val();
            const container = $(this).closest('.credential-item');

            if (val === 'Agency') {
                container.find('.agency-fields').removeClass('d-none');
                container.find('.branch-fields').addClass('d-none');
            } else if (val === 'Branch') {
                container.find('.agency-fields').removeClass('d-none');
                container.find('.branch-fields').removeClass('d-none');
            } else {
                container.find('.agency-fields').addClass('d-none');
                container.find('.branch-fields').addClass('d-none');
            }
        });

        $('#credentials-container').append(item);
    }


    function renderLinks() {
        const categories = ['AdaPos5StoreBack', 'meeting', 'other'];
        categories.forEach(cat => {
            const container = $(`#list-${cat}`);
            container.empty();

            let catLinks = [];
            if (cat === 'other') {
                // Include both 'other' and 'sheet'
                catLinks = centerLinks.filter(l => l.category === 'other' || l.category === 'sheet');
            } else {
                catLinks = centerLinks.filter(l => l.category === cat);
            }

            // Sort Links
            catLinks.sort((a, b) => (a.order || 0) - (b.order || 0));

            catLinks.forEach(link => {
                let metaIcons = '';

                // Determine Logic based on actual link category
                const currentCat = link.category;

                // --- Color Logic (Same as before) ---
                let cardStyle = '';
                let titleStyle = '';
                let btnStyle = '';

                // Helper: Get Contrast Color (Black/White) based on Bg Hex
                const getContrastYIQ = (hexcolor) => {
                    hexcolor = hexcolor.replace("#", "");
                    var r = parseInt(hexcolor.substr(0, 2), 16);
                    var g = parseInt(hexcolor.substr(2, 2), 16);
                    var b = parseInt(hexcolor.substr(4, 2), 16);
                    var yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
                    return (yiq >= 128) ? '#212529' : 'white';
                };

                // Helper: Meeting Colors (Strictly Cool Tones: Blue/Purple)
                const getMeetingColor = () => {
                    const palettes = [
                        { bg: '#E3F2FD', border: '#90CAF9', text: '#0D47A1' }, // Blue 50 -> Text Blue 900
                        { bg: '#F3E5F5', border: '#CE93D8', text: '#7B1FA2' }, // Purple 50 -> Text Purple 700
                        { bg: '#E8EAF6', border: '#9FA8DA', text: '#283593' }, // Indigo 50 -> Text Indigo 800
                        { bg: '#E1F5FE', border: '#81D4FA', text: '#01579B' }, // Light Blue 50 -> Text Light Blue 900
                        { bg: '#EDE7F6', border: '#B39DDB', text: '#4527A0' }  // Deep Purple 50 -> Text Deep Purple 800
                    ];
                    return palettes[Math.floor(Math.random() * palettes.length)];
                };

                // Helper: Other/Sheet Colors (Strictly Warm Tones: Orange/Yellow/Red/Brown)
                const getOtherColor = () => {
                    const palettes = [
                        { bg: '#FFF3E0', border: '#FFCC80', text: '#E65100' }, // Orange 50 -> Text Orange 900
                        { bg: '#FFF8E1', border: '#FFE082', text: '#FF6F00' }, // Amber 50 -> Text Amber 900
                        { bg: '#FFEBEE', border: '#EF9A9A', text: '#C62828' }, // Red 50 -> Text Red 800
                        { bg: '#FBE9E7', border: '#FFAB91', text: '#D84315' }, // Deep Orange 50 -> Text Deep Orange 800
                        { bg: '#EFEBE9', border: '#BCAAA4', text: '#4E342E' }  // Brown 50 -> Text Brown 800
                    ];
                    return palettes[Math.floor(Math.random() * palettes.length)];
                };

                if (currentCat === 'AdaPos5StoreBack') {
                    const tier = (link.serverTier || 'DEV').toUpperCase();

                    // Default Colors (Fallback)
                    const defaultColors = {
                        'DEV': '#C8E6C9',
                        'SIT': '#BBDEFB',
                        'PROD': '#FFE082',
                        'CS': '#E0F7FA'
                    };

                    // Get Config Colors
                    const configColors = (window.deployConfig && window.deployConfig.storeBackColors) ? window.deployConfig.storeBackColors : {};
                    const bgColor = configColors[tier] || defaultColors[tier] || '#ffffff';

                    // Calculate Text Color (Contrast)
                    const textColor = getContrastYIQ(bgColor);
                    const borderColor = textColor === 'white' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)';

                    // Apply Styles
                    cardStyle = `background-color: ${bgColor}; border: 1px solid ${borderColor}; color: ${textColor};`;
                    titleStyle = `color: ${textColor} !important;`;
                    btnStyle = `color: ${textColor}; background: rgba(255,255,255,0.4); border: 1px solid rgba(255,255,255,0.2);`;

                } else if (currentCat === 'meeting' || currentCat === 'sheet' || currentCat === 'other') {
                    // Logic ใหม่: Check customBgColor ก่อน
                    if (link.customBgColor && link.customBgColor !== '#ffffff') {
                        // Use Custom Color
                        const textColor = getContrastYIQ(link.customBgColor);
                        cardStyle = `background-color: ${link.customBgColor}; border: 1px solid rgba(0,0,0,0.1); color: ${textColor};`;
                        titleStyle = `color: ${textColor} !important;`;
                        btnStyle = `color: ${textColor}; background: rgba(255,255,255,0.3); border: 1px solid rgba(255,255,255,0.3);`;
                    } else {
                        // Use Default Palette (Random)
                        let theme;
                        if (currentCat === 'meeting') {
                            theme = getMeetingColor();
                        } else {
                            theme = getOtherColor();
                        }
                        cardStyle = `background-color: ${theme.bg}; border: 1px solid ${theme.border}; color: ${theme.text};`;
                        titleStyle = `color: ${theme.text} !important;`;
                        btnStyle = `color: ${theme.text}; background: rgba(255,255,255,0.6); border: 1px solid ${theme.border}33;`;
                    }
                }
                // ------------------

                if (currentCat === 'AdaPos5StoreBack') {
                    const tierClass = `badge-${(link.serverTier || 'DEV').toLowerCase()}`;

                    // --- 1. Compact View Content (Badges เรียงกัน) ---
                    let compactBadges = '';
                    if (link.credentials && link.credentials.length > 0) {
                        compactBadges = link.credentials.map(c => {
                            // ย่อ Agency/Branch ใน Compact View เพื่อประหยัดพื้นที่
                            let extraInfo = '';
                            if (c.role === 'Agency' && c.agnCode) {
                                extraInfo = ` <span class="badge badge-warning text-dark ml-1" style="font-size:0.7em;">${c.agnCode}</span>`;
                            } else if (c.role === 'Branch' && c.bchCode) {
                                extraInfo = ` <span class="badge badge-info text-dark ml-1" style="font-size:0.7em;">${c.agnCode}/${c.bchCode}</span>`;
                            }
                            const tooltip = `User: ${c.user}\nRole: ${c.role || '-'}`;
                            return `<span class="badge badge-light border mr-1 mb-1" title="${tooltip}"><i class="fas fa-user small"></i> ${c.user}${extraInfo}</span>`;
                        }).join('');
                    } else if (link.user) {
                        const isDarkBg = (cardStyle.includes('#008f66') || cardStyle.includes('#8B0000') || cardStyle.includes('#9E9E1E'));
                        const badgeClass = isDarkBg ? 'badge-light text-dark border-0' : 'badge-light border';
                        compactBadges = `<span class="badge ${badgeClass} mr-1" title="${link.user}"><i class="fas fa-user small"></i> ${link.user}</span>`;
                    }

                    // --- 2. Expanded View Content (แยก Card เล็ก ละเอียด) ---
                    let expandedContent = '';
                    if (link.credentials && link.credentials.length > 0) {
                        expandedContent = link.credentials.map(c => {
                            let roleBadge = c.role ? `<span class="mr-1" style="opacity: 0.7; font-size: 0.85em;">[${c.role}]</span>` : '';

                            // Agency/Branch เต็มรูปแบบ
                            let extraInfo = '';
                            if (c.role === 'Agency' && c.agnCode) {
                                const nameDisplay = c.agnName ? ` <span style="font-weight:normal; margin-left:5px;">(${c.agnName})</span>` : '';
                                extraInfo = `<div class="mt-2">
                                    <span class="badge badge-light border text-dark shadow-sm" style="font-size:0.8rem; background: rgba(255,255,255,0.9); padding: 5px 10px;">ตัวแทนขาย : <b class="ml-2">${c.agnCode}</b>${nameDisplay}</span>
                                </div>`;
                            } else if (c.role === 'Branch' && c.bchCode) {
                                const agnNameDisplay = c.agnName ? ` <span style="font-weight:normal; margin-left:5px;">(${c.agnName})</span>` : '';
                                const bchNameDisplay = c.bchName ? ` <span style="font-weight:normal; margin-left:5px;">(${c.bchName})</span>` : '';
                                extraInfo = `<div class="mt-2 d-flex flex-wrap" style="gap: 8px;">
                                    <span class="badge badge-light border text-dark shadow-sm" style="font-size:0.8rem; background: rgba(255,255,255,0.9); padding: 5px 10px;">ตัวแทนขาย : <b class="ml-2">${c.agnCode}</b>${agnNameDisplay}</span>
                                    <span class="badge badge-light border text-dark shadow-sm" style="font-size:0.8rem; background: rgba(255,255,255,0.9); padding: 5px 10px;">สาขา : <b class="ml-2">${c.bchCode}</b>${bchNameDisplay}</span>
                                </div>`;
                            }

                            const tooltip = `User: ${c.user}`;
                            // Styling for expanded user box (Adjusted for Light Pastel BG)
                            const cardSmallStyle = "background: rgba(255,255,255,0.7); border: 1px solid rgba(0,0,0,0.08); border-radius: 8px; padding: 10px; margin-bottom: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);";

                            return `
                             <div class="user-card-small d-flex flex-column align-items-start w-100" style="${cardSmallStyle}">
                                <div class="d-flex w-100 justify-content-between align-items-center">
                                     <span class="badge badge-light border" title="${tooltip}"><i class="fas fa-user small"></i> ${roleBadge}${c.user}</span>
                                     
                                     <div class="ml-auto d-flex" style="gap:5px;">
                                        <!-- Copy User Button -->
                                        <button class="btn-link-action btn-link-copy-user" data-user="${c.user}" title="Copy Username" style="${btnStyle}; width:28px; height:28px; font-size:0.8rem; display:flex; align-items:center; justify-content:center;"><i class="far fa-copy"></i></button>
                                        <!-- Copy Pass Button -->
                                        <button class="btn-link-action btn-link-copy-pass" data-pass="${c.pass}" title="Copy Password" style="${btnStyle}; width:28px; height:28px; font-size:0.8rem; display:flex; align-items:center; justify-content:center;"><i class="fas fa-key"></i></button>
                                     </div>
                                </div>
                                ${extraInfo}
                             </div>`;
                        }).join('');
                    } else {
                        // fallback for no credential or simple user
                        expandedContent = compactBadges;
                    }

                    // Construct Meta Icons with Toggle logic
                    metaIcons = `
                        <div class="d-flex align-items-center mb-2">
                            <span class="category-badge ${tierClass}" style="border: 1px solid rgba(0,0,0,0.1); margin-right: 10px;">${link.serverTier || 'DEV'}</span>
                        </div>
                        
                        <!-- Compact View (Visible by default) -->
                        <div class="compact-view-content w-100">
                            ${compactBadges}
                        </div>

                        <!-- Expanded View (Hidden by default, shown via CSS) -->
                        <div class="expanded-view-content w-100" style="display:none;">
                            ${expandedContent}
                        </div>
                    `;
                } else if (currentCat === 'sheet') {
                    const styleMap = { 'Work': 'badge-work', 'Knowledge': 'badge-knowledge', 'Center': 'badge-center' };
                    const style = styleMap[link.sheetType] || 'badge-work';
                    metaIcons = `<span class="category-badge ${style}">${link.sheetType}</span>`;
                } else if (currentCat === 'meeting') {
                    const style = `badge-${link.meetingType.toLowerCase()}`;
                    metaIcons = `<span class="category-badge ${style}">${link.meetingType}</span>`;
                }

                let actionButtons = ``;

                // สำหรับ StoreBack ปุ่ม Copy Pass ไปอยู่ใน Card เล็กแล้ว
                if (currentCat === 'AdaPos5StoreBack') {
                    // Main Actions
                    const copyUrlBtn = `<button class="btn-link-action btn-link-copy-url ${btnStyle}" data-url="${link.url}" title="Copy Link"><i class="fas fa-link"></i></button>`;
                    const editBtn = `<button class="btn-link-action btn-link-edit ${btnStyle}" title="แก้ไข"><i class="fas fa-pencil-alt"></i></button>`;
                    const delBtn = `<button class="btn-link-action btn-link-delete ${btnStyle}" title="ลบ"><i class="fas fa-trash-alt"></i></button>`;
                    const expandBtn = `<button class="btn-link-action btn-expand ${btnStyle}" title="ขยาย/ย่อ"><i class="fas fa-expand-alt"></i></button>`;

                    actionButtons = `
                        ${expandBtn}
                        ${copyUrlBtn}
                        ${editBtn}
                        ${delBtn}
                    `;

                } else {
                    // Other Categories (Simple)
                    if (link.pass) { // Single Pass Legacy
                        actionButtons += `<button class="btn-link-action btn-link-copy-pass ${btnStyle}" data-pass="${link.pass}" title="Copy Password"><i class="fas fa-key"></i></button>`;
                    }
                    actionButtons += `
                        <button class="btn-link-action btn-link-copy-url ${btnStyle}" data-url="${link.url}" title="Copy Link"><i class="fas fa-link"></i></button>
                        <button class="btn-link-action btn-link-edit ${btnStyle}" title="แก้ไข"><i class="fas fa-pencil-alt"></i></button>
                        <button class="btn-link-action btn-link-delete ${btnStyle}" title="ลบ"><i class="fas fa-trash-alt"></i></button>
                    `;
                }

                const item = $(`
                <div class="link-item-modern shadow-sm border-0" data-id="${link.id}" style="${cardStyle}">
                    <div class="link-item-info">
                        <a href="${link.url}" target="_blank" class="link-item-title font-weight-bold" title="${link.title}" style="${titleStyle}">
                            ${link.title}
                        </a>
                        <div class="link-item-meta mt-2">
                            ${metaIcons}
                        </div>
                    </div>
                    <div class="link-item-actions">
                        ${actionButtons}
                    </div>
                </div>
            `);
                container.append(item);
            });
        });

        // Initialize Sortable Optimized (More Smooth)
        $(".link-list").sortable({
            connectWith: ".link-list",
            placeholder: "ui-sortable-placeholder",
            opacity: 0.8,           // Slightly more visible
            distance: 10,           // More distance to confirm intent
            tolerance: 'pointer',   // Better accuracy
            cursor: 'grabbing',
            forcePlaceholderSize: true,
            helper: 'clone',        // Smoother dragging visually
            zIndex: 9999,
            scroll: true,           // Allow scrolling while dragging
            start: function (event, ui) {
                ui.placeholder.height(ui.item.outerHeight());
                ui.item.addClass('is-dragging-item');
                $(this).addClass('is-sorting-list');
                // Temporarily disable transitions on all items to prevent jitter
                $('.link-item-modern').css('transition', 'none');
            },
            stop: function (event, ui) {
                ui.item.removeClass('is-dragging-item');
                $(this).removeClass('is-sorting-list');
                // Restore transitions
                $('.link-item-modern').css('transition', '');
            },
            update: function (event, ui) {
                // Only process once per movement (ignore the one from the "receiving" side if moving between lists)
                if (this === ui.item.parent()[0]) {
                    setTimeout(() => {
                        $("#linkContainer .link-list").each(function () {
                            const cat = $(this).data('category');
                            $(this).find('.link-item-modern').each(function (index) {
                                const id = $(this).data('id');
                                const link = centerLinks.find(l => l.id == id);
                                if (link) {
                                    link.category = cat;
                                    link.order = index;
                                }
                            });
                        });
                        saveLinks();
                    }, 50);
                }
            }
        }).disableSelection();
    }

    // Global Event for Expand Button
    $(document).on('click', '.btn-expand', function () {
        const card = $(this).closest('.link-item-modern');
        const icon = $(this).find('i');

        card.toggleClass('expanded-view');

        if (card.hasClass('expanded-view')) {
            icon.removeClass('fa-expand-alt').addClass('fa-compress-alt');
        } else {
            icon.removeClass('fa-compress-alt').addClass('fa-expand-alt');
        }
    });

    // ----------------------------------------
    // EVENT HANDLERS (DOM Ready)
    // ----------------------------------------
    $(function () {
        // Load Links Immediately
        loadLinks();

        // Add New Link Button
        $('#btnAddLink').click(function () {
            $('#linkModalTitle').text('เพิ่มลิงก์ใหม่');
            $('#formLink')[0].reset();
            $('#linkId').val('');
            $('#linkCustomBgColor').val('#ffffff'); // Reset Color
            $('#credentials-container').empty(); // Clear dynamic inputs

            // Start with one empty credential input for StoreBack
            handleCategoryFields('AdaPos5StoreBack');
            addCredentialItem('', '', 'HQ', '');

            // Bind Add Credential Button
            $('#btnAddCredential').off('click').click(function () {
                addCredentialItem('', '', 'HQ', '');
            });

            $('#modalLinkEdit').modal('show');
        });

        // Global Bind Add Credential
        $('#btnAddCredential').off('click').click(function () {
            addCredentialItem('', '', 'HQ', '');
        });

        // Edit Link Button
        $(document).on('click', '.btn-link-edit', function () {
            const id = $(this).closest('.link-item-modern').data('id');
            const link = centerLinks.find(l => l.id == id);
            if (!link) return;

            $('#linkModalTitle').text('แก้ไขลิงก์');
            $('#linkId').val(link.id);
            $('#linkCategory').val(link.category);
            $('#linkTitle').val(link.title);
            $('#linkUrl').val(link.url);
            $('#linkCustomBgColor').val(link.customBgColor || '#ffffff'); // Load Color

            // Clear and Populate Credentials
            $('#credentials-container').empty();
            if (link.credentials && link.credentials.length > 0) {
                // Pass whole object 'c' as extra to fill Agency/Branch fields
                link.credentials.forEach(c => addCredentialItem(c.user, c.pass, c.role, c.desc, c));
            } else {
                // Fallback for legacy data or start with one empty if StoreBack
                if (link.category === 'AdaPos5StoreBack') {
                    addCredentialItem(link.user || '', link.pass || '', 'HQ', '');
                }
            }

            // For Other Category
            $('#linkOtherUser').val(link.user || '');
            $('#linkOtherPass').val(link.pass || '');

            $('#linkServerTier').val(link.serverTier || 'DEV');
            $('#linkSheetType').val(link.sheetType || 'Work');
            $('#linkMeetingType').val(link.meetingType || 'Private');

            handleCategoryFields(link.category);

            // Bind Add Button for Edit Mode
            $('#btnAddCredential').off('click').click(function () {
                addCredentialItem('', '', 'HQ', '');
            });

            $('#modalLinkEdit').modal('show');
        });

        // Delete Link Button
        $(document).on('click', '.btn-link-delete', function () {
            if (confirm('ยืนยันที่จะลบลิงก์นี้หรือไม่?')) {
                const id = $(this).closest('.link-item-modern').data('id');
                centerLinks = centerLinks.filter(l => l.id != id);
                renderLinks();
                saveLinks();
                showAlert('success', 'ลบลิงก์เรียบร้อยแล้ว');
            }
        });

        // Helper to animate copy button
        const animateCopyBtn = (btn) => {
            const originalHtml = btn.html();
            btn.html('<i class="fas fa-check"></i>').addClass('text-success');
            setTimeout(() => {
                btn.html(originalHtml).removeClass('text-success');
            }, 1500);
        };

        // Copy Password Button
        $(document).on('click', '.btn-link-copy-pass', function () {
            const pass = $(this).data('pass');
            const btn = $(this);
            if (pass) {
                navigator.clipboard.writeText(pass).then(function () {
                    animateCopyBtn(btn);
                    showAlert('success', 'คัดลอกรหัสผ่านแล้ว');
                }, function (err) {
                    showAlert('danger', 'คัดลอกไม่สำเร็จ: ' + err);
                });
            }
        });

        // Copy Username Button (New)
        $(document).on('click', '.btn-link-copy-user', function () {
            const user = $(this).data('user');
            const btn = $(this);
            if (user) {
                navigator.clipboard.writeText(user).then(function () {
                    animateCopyBtn(btn);
                    showAlert('success', 'คัดลอก Username แล้ว');
                }, function (err) {
                    showAlert('danger', 'คัดลอกไม่สำเร็จ: ' + err);
                });
            }
        });

        // Category Change
        $('#linkCategory').change(function () {
            handleCategoryFields($(this).val());
        });

        // Copy Link Button
        $(document).on('click', '.btn-link-copy-url', function () {
            const url = $(this).data('url');
            if (url) {
                navigator.clipboard.writeText(url).then(function () {
                    showAlert('success', 'คัดลอกลิงก์เรียบร้อย');
                }, function (err) {
                    showAlert('danger', 'คัดลอกลิงก์ไม่สำเร็จ: ' + err);
                });
            }
        });

        // Save Link Button
        $('#btnSaveLink').click(function () {
            const id = $('#linkId').val();
            const category = $('#linkCategory').val();
            const title = $('#linkTitle').val().trim();
            const url = $('#linkUrl').val().trim();
            const customBgColor = $('#linkCustomBgColor').val(); // Get Color

            if (!title || !url) {
                showAlert('warning', 'กรุณาระบุหัวข้อและ URL');
                return;
            }

            // Collect Credentials
            let credentials = [];
            if (category === 'AdaPos5StoreBack') {
                $('#credentials-container .credential-item').each(function () {
                    const u = $(this).find('.credential-user').val().trim();
                    const p = $(this).find('.credential-pass').val().trim();
                    const r = $(this).find('.credential-role').val();
                    const d = $(this).find('.credential-desc').val().trim();

                    // Collect Extra Fields
                    const agnCode = $(this).find('.credential-agn-code').val().trim();
                    const agnName = $(this).find('.credential-agn-name').val().trim();
                    const bchCode = $(this).find('.credential-bch-code').val().trim();
                    const bchName = $(this).find('.credential-bch-name').val().trim();

                    if (u || p) {
                        credentials.push({
                            user: u,
                            pass: p,
                            role: r,
                            desc: d,
                            agnCode: agnCode,
                            agnName: agnName,
                            bchCode: bchCode,
                            bchName: bchName
                        });
                    }
                });
            }

            // Collect Other User/Pass
            let userVal = '';
            let passVal = '';
            if (category === 'other') {
                userVal = $('#linkOtherUser').val().trim();
                passVal = $('#linkOtherPass').val().trim();
            }

            const linkData = {
                id: id ? id : Date.now(),
                category: category,
                title: title,
                url: url,
                credentials: credentials,
                user: userVal,
                pass: passVal,
                serverTier: $('#linkServerTier').val(),
                sheetType: $('#linkSheetType').val(),
                meetingType: $('#linkMeetingType').val(),
                customBgColor: customBgColor, // Save Color
                order: id ? (centerLinks.find(l => l.id == id)?.order || 0) : 999
            };

            if (id) {
                const idx = centerLinks.findIndex(l => l.id == id);
                centerLinks[idx] = linkData;
            } else {
                centerLinks.push(linkData);
            }

            renderLinks();
            saveLinks();
            $('#modalLinkEdit').modal('hide');
            showAlert('success', 'บันทึกข้อมูลลิงก์แล้ว');
        });

        // Toggle Panel (Robust + Persistence)
        $(document).on('click', '#toggleLinkHubBtn', function () {
            const panel = $(this).closest('.card').find('.card-body');
            const icon = $(this).find('i');
            panel.slideToggle(300, function () {
                if (typeof window.savePanelCollapsedState === 'function') {
                    window.savePanelCollapsedState('linkHubPanel', !$(this).is(':visible'));
                }
            });
            icon.toggleClass('fa-chevron-up fa-chevron-down');
        });
    });

})();


