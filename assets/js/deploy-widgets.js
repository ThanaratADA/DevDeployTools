/**
 * Deploy Widgets
 * Handles Radio, Mini Calendar, and Help widgets.
 */

$(function () {
    // ================== RADIO PLAYER ==================
    const radioBtn = $('#radioWidgetBtn');
    const playerPanel = $('#radioPlayerPanel');
    const playBtn = $('#radioPlayBtn');
    const closeBtn = $('#closeRadioPanel');
    const stationSelect = $('#radioStationSelect');
    const audio = document.getElementById('mainAudioPlayer');
    const stationNameText = $('#currentStationName');
    const miniVisualizer = $('#radioVisualizerMini');
    const statusText = $('#radioStatusText');
    let hls = null;
    let isPlaying = false;

    radioBtn.click(() => playerPanel.fadeToggle(300));
    closeBtn.click(() => playerPanel.fadeOut(300));

    if (audio) {
        audio.addEventListener('waiting', () => { if (isPlaying) statusText.text('(กำลังโหลด...)').css('color', 'var(--warning-color)'); });
        audio.addEventListener('playing', () => statusText.text('(สด)').css('color', 'var(--success-color)'));
        audio.addEventListener('error', (e) => {
            console.error("📻 Audio Error:", e);
            statusText.text('(ผิดพลาด)').css('color', 'var(--danger-color)');
            updateUI(false);
            isPlaying = false;
        });
    }

    playBtn.click(() => isPlaying ? pauseRadio() : playRadio());

    stationSelect.change(function () {
        const name = $(this).find('option:selected').text();
        stationNameText.html('<i class="fas fa-compact-disc fa-spin-slow mr-2"></i> ' + name);
        if (isPlaying) playRadio();
        else statusText.text('พร้อมสตรีมรายการสด');
    });

    $('#radioVolume, #radioVolumeH').on('input', function () {
        const val = $(this).val();
        $('#radioVolume, #radioVolumeH').val(val);
        if (audio) audio.volume = val;
    });

    function playRadio() {
        const url = stationSelect.val();
        statusText.text('...กำลังเชื่อมต่อ...').css('color', '#38bdf8');
        if (audio) { audio.pause(); audio.src = ""; audio.load(); }
        if (hls) { hls.destroy(); hls = null; }

        if (url.includes('.m3u8')) {
            if (window.Hls && Hls.isSupported()) {
                hls = new Hls({ enableWorker: true, lowLatencyMode: true });
                hls.loadSource(url);
                hls.attachMedia(audio);
                hls.on(Hls.Events.MANIFEST_PARSED, () => audio.play().catch(onPlayError));
                hls.on(Hls.Events.ERROR, (e, data) => { if (data.fatal) onPlayError(data); });
            } else if (audio.canPlayType('application/vnd.apple.mpegurl')) {
                audio.src = url;
                audio.addEventListener('canplay', () => audio.play().catch(onPlayError), { once: true });
            }
        } else {
            audio.src = url;
            audio.play().catch(onPlayError);
        }

        isPlaying = true;
        updateUI(true);
        function onPlayError(e) {
            console.error("Play Error:", e);
            statusText.text('ไม่สามารถรับชมได้').css('color', 'var(--danger-color)');
            updateUI(false);
            isPlaying = false;
        }
    }

    function pauseRadio() {
        if (audio) audio.pause();
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

    if (audio) audio.volume = 0.5;

    // Smart Invite
    if (localStorage.getItem('ada_radio_prompted') !== 'true') {
        setTimeout(() => {
            if (!isPlaying && !playerPanel.is(':visible')) $('#modalRadioInvite').modal('show');
        }, 60000);
    }
    $('#btnAcceptRadio').click(function () {
        $('#modalRadioInvite').modal('hide');
        localStorage.setItem('ada_radio_prompted', 'true');
        playerPanel.fadeIn(400);
        setTimeout(playRadio, 500);
    });

    // ================== MINI CALENDAR ==================
    let currentViewDate = new Date();
    function updateCalendar(date) {
        const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        $('#calMonth').text(months[date.getMonth()]);
        $('#calDate').text(date.getDate());
        $('#calDayName').text(days[date.getDay()]);

        const yyyy = date.getFullYear(), mm = String(date.getMonth() + 1).padStart(2, '0'), dd = String(date.getDate()).padStart(2, '0');
        $('#realDateInput').val(`${yyyy}-${mm}-${dd}`);
    }

    $('#btnShowFullCal, #openCalendarPicker').click(() => $('#realDateInput')[0].showPicker());
    $('#realDateInput').change(function () {
        const d = new Date($(this).val());
        if (!isNaN(d.getTime())) updateCalendar(currentViewDate = d);
    });
    $('#prevDay').click(() => { currentViewDate.setDate(currentViewDate.getDate() - 1); updateCalendar(currentViewDate); });
    $('#nextDay').click(() => { currentViewDate.setDate(currentViewDate.getDate() + 1); updateCalendar(currentViewDate); });
    updateCalendar(currentViewDate);

    // ================== HELP WIDGET ==================
    $('#floatingHelpBtn').click(function () {
        $('#helpQuestionArea').show();
        $('#helpResponseArea').hide();
        $('#modalHelpTask').modal('show');
    });

    $('#btnHelpYes').click(function () {
        const secret = '4Lil4Lit4LiH4LiW4Liy4Lih4Lie4Li14LmI4LmA4LiI4Lih4Liq4LmM4Liq4Li0';
        try {
            $('#secretMessage').text(decodeURIComponent(escape(atob(secret))));
            $('#helpQuestionArea').fadeOut(300, () => $('#helpResponseArea').fadeIn(300));
        } catch (e) {
            $('#secretMessage').text('Error');
        }
    });
});
