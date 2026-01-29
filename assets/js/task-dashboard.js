/**
 * Task Dashboard Logic
 * Handles Chart.js rendering for Task Summary
 */

function refreshTaskDashboard() {
    $.post('index.php', { action: 'getTasks' }, function (response) {
        try {
            const res = typeof response === 'string' ? JSON.parse(response) : response;
            if (res.success && res.tasks) {
                renderTaskCharts(res.tasks);
            }
        } catch (e) { console.error("Error parsing tasks for dashboard", e); }
    });
}

function renderTaskCharts(tasks) {
    let statusCounts = { 'Done': 0, 'Pending': 0 };
    let projectCounts = {};

    tasks.forEach(task => {
        let isDone = task.completed === true;
        if (isDone) statusCounts['Done']++; else statusCounts['Pending']++;

        let projects = task.projects || ['Unassigned'];
        if (projects.length === 0) projects = ['Unassigned'];

        projects.forEach(p => {
            if (!projectCounts[p]) projectCounts[p] = { total: 0, done: 0 };
            projectCounts[p].total++;
            if (isDone) projectCounts[p].done++;
        });
    });

    // 1. Status Chart (Doughnut)
    const ctxStatus = document.getElementById('taskStatusChart').getContext('2d');
    if (window.myStatusChart) window.myStatusChart.destroy();
    window.myStatusChart = new Chart(ctxStatus, {
        type: 'doughnut',
        data: {
            labels: ['Completed', 'Pending'],
            datasets: [{
                data: [statusCounts.Done, statusCounts.Pending],
                backgroundColor: ['#28a745', '#ffc107'],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });

    // 2. Project Chart (Bar)
    const ctxProject = document.getElementById('taskProjectChart').getContext('2d');
    const pLabels = Object.keys(projectCounts);
    const pTotal = pLabels.map(k => projectCounts[k].total);
    const pDone = pLabels.map(k => projectCounts[k].done);

    if (window.myProjectChart) window.myProjectChart.destroy();
    window.myProjectChart = new Chart(ctxProject, {
        type: 'bar',
        data: {
            labels: pLabels,
            datasets: [
                {
                    label: 'Total Tasks',
                    data: pTotal,
                    backgroundColor: 'rgba(23, 162, 184, 0.7)',
                    borderColor: '#17a2b8',
                    borderWidth: 1
                },
                {
                    label: 'Completed',
                    data: pDone,
                    backgroundColor: 'rgba(40, 167, 69, 0.8)',
                    borderColor: '#28a745',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1 } }
            }
        }
    });

    // 3. Stats Summary
    const totalTasks = tasks.length;
    const percentDone = totalTasks > 0 ? Math.round((statusCounts.Done / totalTasks) * 100) : 0;

    $('#taskSummaryStats').html(`
        <div class="col-md-3">
            <div class="p-3 rounded text-center" style="background-color: #e8f5e9; border: 1px solid #c3e6cb;">
                <h3 class="text-success font-weight-bold m-0">${statusCounts.Done}</h3>
                <small class="text-muted">งานที่เสร็จแล้ว</small>
            </div>
        </div>
        <div class="col-md-3">
            <div class="p-3 rounded text-center" style="background-color: #fff3cd; border: 1px solid #ffeeba;">
                <h3 class="text-warning font-weight-bold m-0">${statusCounts.Pending}</h3>
                <small class="text-muted">งานรอสะสาง</small>
            </div>
        </div>
        <div class="col-md-3">
            <div class="p-3 rounded text-center" style="background-color: #d1ecf1; border: 1px solid #bee5eb;">
                <h3 class="text-info font-weight-bold m-0">${totalTasks}</h3>
                <small class="text-muted">งานทั้งหมด</small>
            </div>
        </div>
         <div class="col-md-3">
            <div class="p-3 rounded text-center" style="background-color: #f8f9fa; border: 1px solid #dee2e6;">
                <h3 class="text-secondary font-weight-bold m-0">${percentDone}%</h3>
                <small class="text-muted">ความคืบหน้า</small>
            </div>
        </div>
    `);
}

$(document).ready(function () {
    refreshTaskDashboard();
});
