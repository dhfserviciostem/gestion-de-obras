// Projects functionality
let projectsData = [];
let projectsClients = [];

// Helper function to format date for input field
function formatDateForInput(dateString) {
    if (!dateString) return '';
    
    // If it's already in YYYY-MM-DD format, return as is
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateString;
    }
    
    // If it's in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ), extract date part
    if (dateString.includes('T')) {
        return dateString.split('T')[0];
    }
    
    // If it's in other formats, try to parse and format
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    } catch (error) {
        console.error('Error formatting date:', error);
        return '';
    }
}

async function loadProjects() {
    try {
        // Load projects and clients data
        const [projectsResponse, clientsResponse] = await Promise.all([
            fetch('/api/projects'),
            fetch('/api/clients')
        ]);

        if (!projectsResponse.ok || !clientsResponse.ok) {
            throw new Error('Error al cargar datos de proyectos');
        }

        const projectsResponseData = await projectsResponse.json();
        const clientsData = await clientsResponse.json();

        projectsData = projectsResponseData.projects || [];
        projectsClients = clientsData.clients || [];

        // Populate client dropdown
        populateClientDropdown();

        // Render projects table
        renderProjectsTable();

    } catch (error) {
        console.error('Load projects error:', error);
        app.showNotification('Error cargando proyectos', 'danger');
    }
}

function populateClientDropdown() {
    const clientSelect = document.getElementById('projectClient');
    if (!clientSelect) return;

    clientSelect.innerHTML = '<option value="">Seleccionar cliente...</option>';
    projectsClients.forEach(client => {
        const option = document.createElement('option');
        option.value = client.id;
        option.textContent = `${client.name}${client.company ? ` (${client.company})` : ''}`;
        clientSelect.appendChild(option);
    });
}

function renderProjectsTable() {
    const tbody = document.getElementById('projectsTableBody');
    if (!tbody) return;

    if (projectsData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted py-4">
                    <i class="bi bi-building fs-1 d-block mb-2"></i>
                    No hay obras registradas
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = projectsData.map(project => `
        <tr>
            <td>
                <div>
                    <h6 class="mb-1">${project.name}</h6>
                    ${project.description ? `<small class="text-muted">${project.description.substring(0, 50)}${project.description.length > 50 ? '...' : ''}</small>` : ''}
                </div>
            </td>
            <td>${project.client_name || 'Sin cliente'}</td>
            <td>
                <span class="badge status-${project.status}">
                    ${getProjectStatusText(project.status)}
                </span>
            </td>
            <td>
                <div class="progress mb-1" style="height: 6px;">
                    <div class="progress-bar ${getProgressBarClass(project.progress_percentage)}" 
                         style="width: ${project.progress_percentage || 0}%"></div>
                </div>
                <small class="text-muted">${project.progress_percentage || 0}%</small>
            </td>
            <td>
                ${project.estimated_budget ? 
                    `<div>
                        <strong>${app.formatCurrency(project.estimated_budget)}</strong>
                        ${project.actual_cost ? `<br><small class="text-muted">Gastado: ${app.formatCurrency(project.actual_cost)}</small>` : ''}
                    </div>` : 
                    'No definido'
                }
            </td>
            <td>${project.start_date ? new Date(project.start_date).toLocaleDateString() : 'No definida'}</td>
            <td>
                <div class="btn-group" role="group">
                    <button class="btn btn-sm btn-outline-info" onclick="viewProject(${project.id})" title="Ver detalles">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-primary" onclick="editProject(${project.id})" title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-success" onclick="manageProjectTeam(${project.id})" title="Equipo">
                        <i class="bi bi-people"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteProject(${project.id})" title="Eliminar">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function getProjectStatusText(status) {
    const statusMap = {
        'planning': 'Planificación',
        'in_progress': 'En Progreso',
        'on_hold': 'En Pausa',
        'completed': 'Completado',
        'cancelled': 'Cancelado'
    };
    return statusMap[status] || status;
}

function getProgressBarClass(percentage) {
    if (percentage >= 80) return 'bg-success';
    if (percentage >= 50) return 'bg-info';
    if (percentage >= 25) return 'bg-warning';
    return 'bg-danger';
}

function formatCurrency(amount) {
    return app.formatCurrency(amount);
}

async function saveProject() {
    const form = document.getElementById('projectForm');
    const formData = new FormData(form);
    
    const projectData = {
        name: document.getElementById('projectName').value,
        description: document.getElementById('projectDescription').value,
        clientId: document.getElementById('projectClient').value || null,
        startDate: document.getElementById('projectStartDate').value || null,
        endDate: document.getElementById('projectEndDate').value || null,
        estimatedBudget: document.getElementById('projectBudget').value || null,
        status: document.getElementById('projectStatus').value,
        priority: document.getElementById('projectPriority').value,
        address: document.getElementById('projectAddress').value || null
    };

    const projectId = document.getElementById('projectId').value;
    const isEdit = projectId !== '';

    try {
        app.showLoading(true);
        
        const response = await fetch(`/api/projects${isEdit ? `/${projectId}` : ''}`, {
            method: isEdit ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(projectData)
        });

        const result = await response.json();

        if (response.ok) {
            app.showNotification(
                isEdit ? 'Obra actualizada correctamente' : 'Obra creada correctamente', 
                'success'
            );
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('projectModal'));
            modal.hide();
            
            // Reload projects
            await loadProjects();
        } else {
            app.showNotification(result.error || 'Error al guardar la obra', 'danger');
        }
    } catch (error) {
        console.error('Save project error:', error);
        app.showNotification('Error de conexión', 'danger');
    } finally {
        app.showLoading(false);
    }
}

function editProject(projectId) {
    const project = projectsData.find(p => p.id === projectId);
    if (!project) return;
    
    // Debug: Log project data to verify dates
    console.log('Project data for editing:', project);
    console.log('Start date:', project.start_date);
    console.log('End date:', project.end_date);

    // Populate form with project data
    document.getElementById('projectId').value = project.id;
    document.getElementById('projectName').value = project.name || '';
    document.getElementById('projectDescription').value = project.description || '';
    document.getElementById('projectClient').value = project.client_id || '';
    // Format dates for input fields (YYYY-MM-DD format)
    document.getElementById('projectStartDate').value = formatDateForInput(project.start_date);
    document.getElementById('projectEndDate').value = formatDateForInput(project.end_date);
    document.getElementById('projectBudget').value = project.estimated_budget || '';
    document.getElementById('projectStatus').value = project.status || 'planning';
    document.getElementById('projectPriority').value = project.priority || 'medium';
    document.getElementById('projectAddress').value = project.address || '';

    // Update modal title
    document.getElementById('projectModalTitle').textContent = 'Editar Obra';

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('projectModal'));
    modal.show();
}

async function deleteProject(projectId) {
    const project = projectsData.find(p => p.id === projectId);
    if (!project) return;

    const confirmMessage = `¿Estás seguro de que quieres eliminar la obra "${project.name}"?\n\nEsta acción no se puede deshacer y eliminará todas las actividades y archivos asociados.`;
    
    if (!confirm(confirmMessage)) return;

    try {
        app.showLoading(true);
        
        const response = await fetch(`/api/projects/${projectId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            app.showNotification('Obra eliminada correctamente', 'success');
            await loadProjects();
        } else {
            const result = await response.json();
            app.showNotification(result.error || 'Error al eliminar la obra', 'danger');
        }
    } catch (error) {
        console.error('Delete project error:', error);
        app.showNotification('Error de conexión', 'danger');
    } finally {
        app.showLoading(false);
    }
}

async function viewProject(projectId) {
    try {
        const response = await fetch(`/api/projects/${projectId}`);
        if (!response.ok) throw new Error('Error al cargar detalles del proyecto');
        
        const data = await response.json();
        showProjectDetailsModal(data);
    } catch (error) {
        console.error('View project error:', error);
        app.showNotification('Error cargando detalles de la obra', 'danger');
    }
}

function showProjectDetailsModal(data) {
    const { project, team, totalActivities } = data;
    
    // Create modal HTML
    const modalHtml = `
        <div class="modal fade" id="projectDetailsModal" tabindex="-1">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">
                            <i class="bi bi-building"></i> ${project.name}
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-8">
                                <div class="card mb-3">
                                    <div class="card-header">
                                        <h6><i class="bi bi-info-circle"></i> Información General</h6>
                                    </div>
                                    <div class="card-body">
                                        <div class="row">
                                            <div class="col-md-6">
                                                <p><strong>Cliente:</strong> ${project.client_name || 'No asignado'}</p>
                                                <p><strong>Estado:</strong> 
                                                    <span class="badge status-${project.status}">
                                                        ${getProjectStatusText(project.status)}
                                                    </span>
                                                </p>
                                                <p><strong>Prioridad:</strong> 
                                                    <span class="badge priority-${project.priority}">
                                                        ${getPriorityText(project.priority)}
                                                    </span>
                                                </p>
                                            </div>
                                            <div class="col-md-6">
                                                <p><strong>Fecha Inicio:</strong> ${project.start_date ? new Date(project.start_date).toLocaleDateString() : 'No definida'}</p>
                                                <p><strong>Fecha Fin:</strong> ${project.end_date ? new Date(project.end_date).toLocaleDateString() : 'No definida'}</p>
                                                <p><strong>Progreso:</strong> 
                                                    <div class="progress mt-1" style="height: 8px;">
                                                        <div class="progress-bar ${getProgressBarClass(project.progress_percentage)}" 
                                                             style="width: ${project.progress_percentage || 0}%"></div>
                                                    </div>
                                                    <small>${project.progress_percentage || 0}%</small>
                                                </p>
                                            </div>
                                        </div>
                                        ${project.description ? `<p><strong>Descripción:</strong><br>${project.description}</p>` : ''}
                                        ${project.address ? `<p><strong>Dirección:</strong><br>${project.address}</p>` : ''}
                                    </div>
                                </div>

                                <div class="card">
                                    <div class="card-header">
                                        <h6><i class="bi bi-currency-dollar"></i> Información Financiera</h6>
                                    </div>
                                    <div class="card-body">
                                        <div class="row">
                                            <div class="col-md-4">
                                                <div class="text-center">
                                                    <h4 class="text-primary">${formatCurrency(project.estimated_budget || 0)}</h4>
                                                    <small class="text-muted">Presupuesto Estimado</small>
                                                </div>
                                            </div>
                                            <div class="col-md-4">
                                                <div class="text-center">
                                                    <h4 class="text-warning">${formatCurrency(project.actual_cost || 0)}</h4>
                                                    <small class="text-muted">Costo Actual</small>
                                                </div>
                                            </div>
                                            <div class="col-md-4">
                                                <div class="text-center">
                                                    <h4 class="${(project.actual_cost || 0) <= (project.estimated_budget || 0) ? 'text-success' : 'text-danger'}">
                                                        ${formatCurrency((project.estimated_budget || 0) - (project.actual_cost || 0))}
                                                    </h4>
                                                    <small class="text-muted">Diferencia</small>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="col-md-4">
                                <div class="card mb-3">
                                    <div class="card-header">
                                        <h6><i class="bi bi-people"></i> Equipo del Proyecto</h6>
                                    </div>
                                    <div class="card-body">
                                        ${team.length > 0 ? 
                                            team.map(member => `
                                                <div class="d-flex justify-content-between align-items-center mb-2">
                                                    <div>
                                                        <strong>${member.full_name}</strong>
                                                        <br><small class="text-muted">${getRoleText(member.role)}</small>
                                                    </div>
                                                    <span class="badge bg-secondary">${getRoleText(member.user_role)}</span>
                                                </div>
                                            `).join('') :
                                            '<p class="text-muted">No hay miembros asignados</p>'
                                        }
                                    </div>
                                </div>

                                <div class="card">
                                    <div class="card-header">
                                        <h6><i class="bi bi-list-task"></i> Estadísticas</h6>
                                    </div>
                                    <div class="card-body">
                                        <div class="text-center mb-3">
                                            <h3 class="text-info">${totalActivities}</h3>
                                            <small class="text-muted">Total de Actividades</small>
                                        </div>
                                        <div class="d-grid gap-2">
                                            <button class="btn btn-outline-primary btn-sm" onclick="viewProjectActivities(${project.id})">
                                                <i class="bi bi-list-task"></i> Ver Actividades
                                            </button>
                                            <button class="btn btn-outline-info btn-sm" onclick="viewProjectFiles(${project.id})">
                                                <i class="bi bi-folder"></i> Ver Archivos
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        <button type="button" class="btn btn-primary" onclick="editProject(${project.id}); bootstrap.Modal.getInstance(document.getElementById('projectDetailsModal')).hide();">
                            <i class="bi bi-pencil"></i> Editar Proyecto
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal if any
    const existingModal = document.getElementById('projectDetailsModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Add modal to DOM and show
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('projectDetailsModal'));
    modal.show();

    // Clean up modal after hiding
    document.getElementById('projectDetailsModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

function getPriorityText(priority) {
    const priorityMap = {
        'low': 'Baja',
        'medium': 'Media',
        'high': 'Alta',
        'critical': 'Crítica'
    };
    return priorityMap[priority] || priority;
}

function getRoleText(role) {
    const roleMap = {
        'admin': 'Administrador',
        'manager': 'Gerente',
        'supervisor': 'Supervisor',
        'worker': 'Trabajador'
    };
    return roleMap[role] || role;
}

function viewProjectActivities(projectId) {
    // Switch to activities section with project filter
    app.showSection('activities');
    // TODO: Implement project filtering in activities section
}

function viewProjectFiles(projectId) {
    // Switch to files section with project filter
    app.showSection('files');
    // TODO: Implement project filtering in files section
}

function manageProjectTeam(projectId) {
    // TODO: Implement team management modal
    console.log('Manage team for project:', projectId);
}

// Reset form when modal is shown for new project
document.addEventListener('DOMContentLoaded', function() {
    const projectModal = document.getElementById('projectModal');
    if (projectModal) {
        projectModal.addEventListener('show.bs.modal', function() {
            // Only reset if we're creating a new project (no projectId set)
            if (!document.getElementById('projectId').value) {
                document.getElementById('projectForm').reset();
                document.getElementById('projectId').value = '';
                document.getElementById('projectModalTitle').textContent = 'Nueva Obra';
                // Set default values
                document.getElementById('projectStatus').value = 'planning';
                document.getElementById('projectPriority').value = 'medium';
            }
        });
        
        // Clear the projectId when modal is hidden to ensure next open is for new project
        projectModal.addEventListener('hidden.bs.modal', function() {
            document.getElementById('projectId').value = '';
        });
    }
});

// Add currency formatting to budget inputs
document.addEventListener('DOMContentLoaded', function() {
    const budgetInputs = ['projectBudget', 'editProjectBudget'];
    
    budgetInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            // Format on input
            input.addEventListener('input', function(e) {
                let value = e.target.value.replace(/[^\d]/g, '');
                if (value) {
                    e.target.value = parseInt(value).toLocaleString('es-CL');
                }
            });
            
            // Parse on blur (when user finishes typing)
            input.addEventListener('blur', function(e) {
                let value = e.target.value.replace(/[^\d]/g, '');
                e.target.value = value;
            });
        }
    });
});

async function viewProjectActivities(projectId) {
    try {
        app.showLoading(true);
        
        // Get project info first
        const projectResponse = await fetch(`/api/projects/${projectId}`);
        if (!projectResponse.ok) throw new Error('Error al cargar información del proyecto');
        const projectData = await projectResponse.json();
        const project = projectData.project;
        
        // Get activities for this project
        const activitiesResponse = await fetch(`/api/activities?projectId=${projectId}`);
        if (!activitiesResponse.ok) throw new Error('Error al cargar actividades del proyecto');
        const activitiesData = await activitiesResponse.json();
        const activities = activitiesData.activities || [];
        
        // Show activities modal
        showProjectActivitiesModal(project, activities);
        
    } catch (error) {
        console.error('Error loading project activities:', error);
        app.showNotification('Error al cargar las actividades del proyecto', 'danger');
    } finally {
        app.showLoading(false);
    }
}

async function viewProjectFiles(projectId) {
    try {
        app.showLoading(true);
        
        // Get project info first
        const projectResponse = await fetch(`/api/projects/${projectId}`);
        if (!projectResponse.ok) throw new Error('Error al cargar información del proyecto');
        const projectData = await projectResponse.json();
        const project = projectData.project;
        
        // Get files for this project
        const filesResponse = await fetch(`/api/files?projectId=${projectId}`);
        if (!filesResponse.ok) throw new Error('Error al cargar archivos del proyecto');
        const filesData = await filesResponse.json();
        const files = filesData.files || [];
        
        // Show files modal
        showProjectFilesModal(project, files);
        
    } catch (error) {
        console.error('Error loading project files:', error);
        app.showNotification('Error al cargar los archivos del proyecto', 'danger');
    } finally {
        app.showLoading(false);
    }
}

function showProjectActivitiesModal(project, activities) {
    // Create modal HTML
    const modalHtml = `
        <div class="modal fade" id="projectActivitiesModal" tabindex="-1">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">
                            <i class="bi bi-list-task"></i> Actividades de: ${project.name}
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        ${activities.length === 0 ? `
                            <div class="empty-state">
                                <i class="bi bi-list-task"></i>
                                <h5 class="text-muted">No hay actividades registradas</h5>
                                <p class="text-muted">Este proyecto no tiene actividades asociadas.</p>
                            </div>
                        ` : `
                            <div class="table-responsive">
                                <table class="table table-hover project-activities-table">
                                    <thead>
                                        <tr>
                                            <th>Actividad</th>
                                            <th>Asignado a</th>
                                            <th>Estado</th>
                                            <th>Progreso</th>
                                            <th>Prioridad</th>
                                            <th>Fechas</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${activities.map(activity => `
                                            <tr>
                                                <td>
                                                    <div>
                                                        <h6 class="mb-1">${activity.name}</h6>
                                                        ${activity.description ? `<small class="text-muted">${activity.description.substring(0, 60)}${activity.description.length > 60 ? '...' : ''}</small>` : ''}
                                                    </div>
                                                </td>
                                                <td>${activity.assigned_to_name || 'Sin asignar'}</td>
                                                <td>
                                                    <span class="badge status-${activity.status}">
                                                        ${getActivityStatusText(activity.status)}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div class="progress mb-1" style="height: 6px;">
                                                        <div class="progress-bar ${getProgressBarClass(activity.progress_percentage)}" 
                                                             style="width: ${activity.progress_percentage || 0}%"></div>
                                                    </div>
                                                    <small class="text-muted">${activity.progress_percentage || 0}%</small>
                                                </td>
                                                <td>
                                                    <span class="badge priority-${activity.priority}">
                                                        ${getPriorityText(activity.priority)}
                                                    </span>
                                                </td>
                                                <td>
                                                    <small>
                                                        <div><strong>Inicio:</strong> ${activity.start_date ? new Date(activity.start_date).toLocaleDateString() : 'No definida'}</div>
                                                        <div><strong>Fin:</strong> ${activity.end_date ? new Date(activity.end_date).toLocaleDateString() : 'No definida'}</div>
                                                    </small>
                                                </td>
                                                <td>
                                                    <div class="btn-group" role="group">
                                                        <button class="btn btn-sm btn-outline-info" onclick="viewActivity(${activity.id})" title="Ver detalles">
                                                            <i class="bi bi-eye"></i>
                                                        </button>
                                                        <button class="btn btn-sm btn-outline-primary" onclick="editActivity(${activity.id})" title="Editar">
                                                            <i class="bi bi-pencil"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        `}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        <button type="button" class="btn btn-primary" onclick="app.showSection('activities'); bootstrap.Modal.getInstance(document.getElementById('projectActivitiesModal')).hide();">
                            <i class="bi bi-list-task"></i> Ir a Actividades
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal if any
    const existingModal = document.getElementById('projectActivitiesModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Add modal to DOM and show
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('projectActivitiesModal'));
    modal.show();

    // Clean up modal after hiding
    document.getElementById('projectActivitiesModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

function showProjectFilesModal(project, files) {
    // Create modal HTML
    const modalHtml = `
        <div class="modal fade" id="projectFilesModal" tabindex="-1">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">
                            <i class="bi bi-folder"></i> Archivos de: ${project.name}
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        ${files.length === 0 ? `
                            <div class="empty-state">
                                <i class="bi bi-folder"></i>
                                <h5 class="text-muted">No hay archivos registrados</h5>
                                <p class="text-muted">Este proyecto no tiene archivos asociados.</p>
                            </div>
                        ` : `
                            <div class="table-responsive">
                                <table class="table table-hover project-files-table">
                                    <thead>
                                        <tr>
                                            <th>Archivo</th>
                                            <th>Tipo</th>
                                            <th>Tamaño</th>
                                            <th>Subido por</th>
                                            <th>Fecha</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${files.map(file => `
                                            <tr>
                                                <td>
                                                    <div class="d-flex align-items-center">
                                                        <i class="bi bi-file-earmark me-2 text-primary"></i>
                                                        <div>
                                                            <h6 class="mb-1">${file.original_name}</h6>
                                                            ${file.description ? `<small class="text-muted">${file.description}</small>` : ''}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span class="badge bg-secondary">${file.file_type}</span>
                                                </td>
                                                <td>${formatFileSize(file.file_size)}</td>
                                                <td>${file.uploaded_by_name || 'Usuario desconocido'}</td>
                                                <td>${new Date(file.created_at).toLocaleDateString()}</td>
                                                <td>
                                                    <div class="btn-group" role="group">
                                                        <button class="btn btn-sm btn-outline-success" onclick="downloadFile(${file.id})" title="Descargar">
                                                            <i class="bi bi-download"></i>
                                                        </button>
                                                        <button class="btn btn-sm btn-outline-danger" onclick="deleteFile(${file.id})" title="Eliminar">
                                                            <i class="bi bi-trash"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        `}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        <button type="button" class="btn btn-primary" onclick="app.showSection('files'); bootstrap.Modal.getInstance(document.getElementById('projectFilesModal')).hide();">
                            <i class="bi bi-folder"></i> Ir a Archivos
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal if any
    const existingModal = document.getElementById('projectFilesModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Add modal to DOM and show
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('projectFilesModal'));
    modal.show();

    // Clean up modal after hiding
    document.getElementById('projectFilesModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

// Helper function to format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Helper functions for activities (imported from activities.js)
function getActivityStatusText(status) {
    const statusMap = {
        'pending': 'Pendiente',
        'in_progress': 'En Progreso',
        'completed': 'Completada',
        'cancelled': 'Cancelada',
        'on_hold': 'En Pausa'
    };
    return statusMap[status] || status;
}

function getProgressBarClass(percentage) {
    if (percentage >= 80) return 'bg-success';
    if (percentage >= 50) return 'bg-info';
    if (percentage >= 25) return 'bg-warning';
    return 'bg-danger';
}

function getPriorityText(priority) {
    const priorityMap = {
        'low': 'Baja',
        'medium': 'Media',
        'high': 'Alta',
        'critical': 'Crítica'
    };
    return priorityMap[priority] || priority;
}

// Export functions for global access
window.loadProjects = loadProjects;
window.saveProject = saveProject;
window.editProject = editProject;
window.deleteProject = deleteProject;
window.viewProject = viewProject;
window.viewProjectActivities = viewProjectActivities;
window.viewProjectFiles = viewProjectFiles;
window.manageProjectTeam = manageProjectTeam;
