// Dashboard functionality
let projectProgressChart = null;
let activityStatusChart = null;

async function loadDashboard() {
    try {
        // Load dashboard overview data
        const response = await fetch('/api/dashboard/overview');
        if (!response.ok) {
            // If dashboard API fails, load basic data from individual endpoints
            console.warn('Dashboard API not available, loading basic data');
            await loadBasicDashboardData();
            return;
        }
        
        const data = await response.json();
        
        // Update statistics cards
        updateStatisticsCards(data);
        
        // Update charts
        await updateCharts(data);
        
        // Update activity lists
        updateActivityLists(data);
        
    } catch (error) {
        console.error('Dashboard load error:', error);
        // Fallback to basic dashboard
        await loadBasicDashboardData();
    }
}

async function loadBasicDashboardData() {
    try {
        // Load basic statistics from individual endpoints
        const [projectsRes, activitiesRes, filesRes] = await Promise.all([
            fetch('/api/projects').catch(() => ({ ok: false })),
            fetch('/api/activities').catch(() => ({ ok: false })),
            fetch('/api/files').catch(() => ({ ok: false }))
        ]);

        const projects = projectsRes.ok ? (await projectsRes.json()).projects || [] : [];
        const activities = activitiesRes.ok ? (await activitiesRes.json()).activities || [] : [];
        const files = filesRes.ok ? (await filesRes.json()).files || [] : [];

        // Calculate basic statistics
        const basicData = {
            projectStats: {
                total_projects: projects.length,
                active_projects: projects.filter(p => p.status === 'in_progress').length,
                completed_projects: projects.filter(p => p.status === 'completed').length,
                avg_progress: projects.length > 0 ? projects.reduce((sum, p) => sum + (p.progress_percentage || 0), 0) / projects.length : 0
            },
            activityStats: {
                total_activities: activities.length,
                pending_activities: activities.filter(a => a.status === 'pending').length,
                active_activities: activities.filter(a => a.status === 'in_progress').length,
                completed_activities: activities.filter(a => a.status === 'completed').length
            },
            fileStats: {
                total_files: files.length
            },
            recentActivities: activities.slice(0, 5),
            overdueActivities: activities.filter(a => a.end_date && new Date(a.end_date) < new Date() && a.status !== 'completed').slice(0, 5)
        };

        // Update statistics cards
        updateStatisticsCards(basicData);
        
        // Update charts with basic data
        await updateBasicCharts(basicData);
        
        // Update activity lists
        updateActivityLists(basicData);
        
        app.showNotification('Dashboard cargado con datos básicos', 'info');
        
    } catch (error) {
        console.error('Basic dashboard load error:', error);
        // Show empty dashboard
        updateStatisticsCards({
            projectStats: { total_projects: 0, active_projects: 0, completed_projects: 0 },
            activityStats: { pending_activities: 0, active_activities: 0, completed_activities: 0 },
            fileStats: { total_files: 0 }
        });
        app.showNotification('No se pudieron cargar los datos del dashboard', 'warning');
    }
}

function updateStatisticsCards(data) {
    const { projectStats, activityStats, fileStats } = data;
    
    // Update project statistics
    document.getElementById('totalProjects').textContent = projectStats.total_projects || 0;
    document.getElementById('activeProjects').textContent = projectStats.active_projects || 0;
    document.getElementById('pendingActivities').textContent = activityStats.pending_activities || 0;
    document.getElementById('totalFiles').textContent = fileStats.total_files || 0;
}

async function updateCharts(data) {
    try {
        // Load project progress data
        const progressResponse = await fetch('/api/dashboard/project-progress');
        if (progressResponse.ok) {
            const progressData = await progressResponse.json();
            updateProjectProgressChart(progressData.projects || []);
        } else {
            // Fallback to basic project data
            updateProjectProgressChart([]);
        }
    } catch (error) {
        console.warn('Could not load project progress data:', error);
        updateProjectProgressChart([]);
    }
    
    // Update activity status chart
    updateActivityStatusChart(data.activityStats);
}

async function updateBasicCharts(data) {
    // Update charts with basic data when dashboard API is not available
    updateProjectProgressChart([]);
    updateActivityStatusChart(data.activityStats);
}

function updateProjectProgressChart(projects) {
    const ctx = document.getElementById('projectProgressChart');
    if (!ctx) return;
    
    if (projectProgressChart) {
        projectProgressChart.destroy();
    }
    
    // Handle empty projects array
    if (!projects || projects.length === 0) {
        projects = [{ name: 'Sin datos', progress_percentage: 0 }];
    }
    
    const labels = projects.slice(0, 10).map(p => p.name && p.name.length > 20 ? p.name.substring(0, 20) + '...' : (p.name || 'Sin nombre'));
    const progressData = projects.slice(0, 10).map(p => p.progress_percentage || 0);
    const backgroundColors = progressData.map(progress => {
        if (progress >= 80) return '#198754'; // Green
        if (progress >= 50) return '#ffc107'; // Yellow
        if (progress >= 25) return '#fd7e14'; // Orange
        return '#dc3545'; // Red
    });
    
    projectProgressChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Progreso (%)',
                data: progressData,
                backgroundColor: backgroundColors,
                borderColor: backgroundColors,
                borderWidth: 1,
                borderRadius: 6,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Progreso: ${context.parsed.y}%`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 0
                    }
                }
            }
        }
    });
}

function updateActivityStatusChart(activityStats) {
    const ctx = document.getElementById('activityStatusChart');
    if (!ctx) return;
    
    if (activityStatusChart) {
        activityStatusChart.destroy();
    }
    
    // Ensure activityStats exists
    if (!activityStats) {
        activityStats = { pending_activities: 0, active_activities: 0, completed_activities: 0 };
    }
    
    const data = [
        activityStats.pending_activities || 0,
        activityStats.active_activities || 0,
        activityStats.completed_activities || 0
    ];
    
    activityStatusChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Pendientes', 'En Progreso', 'Completadas'],
            datasets: [{
                data: data,
                backgroundColor: [
                    '#ffc107', // Yellow for pending
                    '#0dcaf0', // Cyan for in progress
                    '#198754'  // Green for completed
                ],
                borderColor: '#fff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((context.parsed * 100) / total).toFixed(1) : 0;
                            return `${context.label}: ${context.parsed} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function updateActivityLists(data) {
    // Update recent activities
    const recentList = document.getElementById('recentActivitiesList');
    if (recentList) {
        if (data.recentActivities && data.recentActivities.length > 0) {
            recentList.innerHTML = data.recentActivities.map(activity => `
                <div class="d-flex justify-content-between align-items-center mb-3 p-3 bg-light rounded">
                    <div>
                        <h6 class="mb-1">${activity.name || 'Sin nombre'}</h6>
                        <small class="text-muted">
                            <i class="bi bi-building"></i> ${activity.project_name || 'Sin proyecto'}
                            ${activity.assigned_to_name ? `<br><i class="bi bi-person"></i> ${activity.assigned_to_name}` : ''}
                        </small>
                    </div>
                    <div class="text-end">
                        <span class="badge status-${activity.status || 'pending'}">${getStatusText(activity.status || 'pending')}</span>
                        <br>
                        <small class="text-muted">${activity.updated_at ? new Date(activity.updated_at).toLocaleDateString() : 'Sin fecha'}</small>
                    </div>
                </div>
            `).join('');
        } else {
            recentList.innerHTML = '<p class="text-muted">No hay actividades recientes</p>';
        }
    }
    
    // Update overdue activities
    const overdueList = document.getElementById('overdueActivitiesList');
    if (overdueList) {
        if (data.overdueActivities && data.overdueActivities.length > 0) {
            overdueList.innerHTML = data.overdueActivities.map(activity => `
                <div class="d-flex justify-content-between align-items-center mb-3 p-3 bg-danger bg-opacity-10 border border-danger border-opacity-25 rounded">
                    <div>
                        <h6 class="mb-1 text-danger">${activity.name || 'Sin nombre'}</h6>
                        <small class="text-muted">
                            <i class="bi bi-building"></i> ${activity.project_name || 'Sin proyecto'}
                            ${activity.assigned_to_name ? `<br><i class="bi bi-person"></i> ${activity.assigned_to_name}` : ''}
                        </small>
                    </div>
                    <div class="text-end">
                        <span class="badge bg-danger">Vencida</span>
                        <br>
                        <small class="text-danger">
                            <i class="bi bi-calendar-x"></i> ${activity.end_date ? new Date(activity.end_date).toLocaleDateString() : 'Sin fecha'}
                        </small>
                    </div>
                </div>
            `).join('');
        } else {
            overdueList.innerHTML = '<p class="text-success"><i class="bi bi-check-circle"></i> No hay tareas vencidas</p>';
        }
    }
}

// Budget analysis functionality
async function loadBudgetAnalysis() {
    try {
        const response = await fetch('/api/dashboard/budget-analysis');
        if (!response.ok) throw new Error('Failed to load budget data');
        
        const data = await response.json();
        displayBudgetAnalysis(data);
    } catch (error) {
        console.error('Budget analysis error:', error);
    }
}

function displayBudgetAnalysis(data) {
    // Implementation for budget analysis display
    console.log('Budget analysis data:', data);
}

// Team performance functionality
async function loadTeamPerformance() {
    try {
        const response = await fetch('/api/dashboard/team-performance');
        if (!response.ok) throw new Error('Failed to load team data');
        
        const data = await response.json();
        displayTeamPerformance(data);
    } catch (error) {
        console.error('Team performance error:', error);
    }
}

function displayTeamPerformance(data) {
    // Implementation for team performance display
    console.log('Team performance data:', data);
}

// File usage statistics
async function loadFileUsage() {
    try {
        const response = await fetch('/api/dashboard/file-usage');
        if (!response.ok) throw new Error('Failed to load file usage data');
        
        const data = await response.json();
        displayFileUsage(data);
    } catch (error) {
        console.error('File usage error:', error);
    }
}

function displayFileUsage(data) {
    // Implementation for file usage display
    console.log('File usage data:', data);
}

// Helper function for status text
function getStatusText(status) {
    const statusMap = {
        'pending': 'Pendiente',
        'in_progress': 'En Progreso',
        'completed': 'Completada',
        'cancelled': 'Cancelada'
    };
    return statusMap[status] || 'Desconocido';
}

// Export functions for global access
window.loadDashboard = loadDashboard;
