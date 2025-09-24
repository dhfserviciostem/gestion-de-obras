// Activities functionality
let currentActivities = [];
let activitiesProjects = [];
let activitiesUsers = [];

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

async function loadActivities() {
    try {
        // Load activities, projects and users data
        const [activitiesResponse, projectsResponse, usersResponse] = await Promise.all([
            fetch('/api/activities'),
            fetch('/api/projects'),
            fetch('/api/users')
        ]);

        if (!activitiesResponse.ok || !projectsResponse.ok) {
            throw new Error('Error al cargar datos de actividades');
        }

        const activitiesData = await activitiesResponse.json();
        const projectsData = await projectsResponse.json();
        const usersData = usersResponse.ok ? await usersResponse.json() : { users: [] };

        currentActivities = activitiesData.activities || [];
        activitiesProjects = projectsData.projects || [];
        activitiesUsers = usersData.users || [];

        // Populate dropdowns
        populateProjectDropdown();
        populateUserDropdown();

        // Render activities table
        renderActivitiesTable();

    } catch (error) {
        console.error('Load activities error:', error);
        app.showNotification('Error cargando actividades', 'danger');
    }
}

function populateProjectDropdown() {
    const projectSelect = document.getElementById('activityProject');
    if (!projectSelect) return;

    projectSelect.innerHTML = '<option value="">Seleccionar proyecto...</option>';
    activitiesProjects.forEach(project => {
        const option = document.createElement('option');
        option.value = project.id;
        option.textContent = project.name;
        projectSelect.appendChild(option);
    });
}

function populateUserDropdown() {
    const userSelect = document.getElementById('activityAssignedTo');
    if (!userSelect) return;

    userSelect.innerHTML = '<option value="">Sin asignar</option>';
    activitiesUsers.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = `${user.first_name} ${user.last_name}`;
        userSelect.appendChild(option);
    });
}

function renderActivitiesTable() {
    const tbody = document.getElementById('activitiesTableBody');
    if (!tbody) return;

    if (currentActivities.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-muted py-4">
                    <i class="bi bi-list-task fs-1 d-block mb-2"></i>
                    No hay actividades registradas
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = currentActivities.map(activity => `
        <tr>
            <td>
                <div>
                    <h6 class="mb-1">${activity.name}</h6>
                    ${activity.description ? `<small class="text-muted">${activity.description.substring(0, 50)}${activity.description.length > 50 ? '...' : ''}</small>` : ''}
                </div>
            </td>
            <td>${activity.project_name || 'Sin proyecto'}</td>
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
            <td>${activity.start_date ? new Date(activity.start_date).toLocaleDateString() : 'No definida'}</td>
            <td>
                <div class="btn-group" role="group">
                    <button class="btn btn-sm btn-outline-info" onclick="viewActivity(${activity.id})" title="Ver detalles">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-primary" onclick="editActivity(${activity.id})" title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteActivity(${activity.id})" title="Eliminar">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

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

async function saveActivity() {
    const activityData = {
        projectId: document.getElementById('activityProject').value,
        name: document.getElementById('activityName').value,
        description: document.getElementById('activityDescription').value,
        assignedTo: document.getElementById('activityAssignedTo').value || null,
        startDate: document.getElementById('activityStartDate').value || null,
        endDate: document.getElementById('activityEndDate').value || null,
        estimatedHours: document.getElementById('activityEstimatedHours').value || null,
        priority: document.getElementById('activityPriority').value,
        materialsNeeded: document.getElementById('activityMaterials').value || null,
        equipmentNeeded: document.getElementById('activityEquipment').value || null,
        notes: document.getElementById('activityNotes').value || null
    };

    const activityId = document.getElementById('activityId').value;
    const isEdit = activityId !== '';

    if (!activityData.projectId || !activityData.name) {
        app.showNotification('Proyecto y nombre de actividad son requeridos', 'danger');
        return;
    }

    try {
        app.showLoading(true);
        
        const response = await fetch(`/api/activities${isEdit ? `/${activityId}` : ''}`, {
            method: isEdit ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(activityData)
        });

        const result = await response.json();

        if (response.ok) {
            app.showNotification(
                isEdit ? 'Actividad actualizada correctamente' : 'Actividad creada correctamente', 
                'success'
            );
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('activityModal'));
            modal.hide();
            
            // Reload activities
            await loadActivities();
        } else {
            app.showNotification(result.error || 'Error al guardar la actividad', 'danger');
        }
    } catch (error) {
        console.error('Save activity error:', error);
        app.showNotification('Error de conexión', 'danger');
    } finally {
        app.showLoading(false);
    }
}

function editActivity(activityId) {
    const activity = currentActivities.find(a => a.id === activityId);
    if (!activity) return;
    
    // Debug: Log activity data to verify dates
    console.log('Activity data for editing:', activity);
    console.log('Start date:', activity.start_date);
    console.log('End date:', activity.end_date);

    // Populate form with activity data
    document.getElementById('activityId').value = activity.id;
    document.getElementById('activityProject').value = activity.project_id || '';
    document.getElementById('activityName').value = activity.name || '';
    document.getElementById('activityDescription').value = activity.description || '';
    document.getElementById('activityAssignedTo').value = activity.assigned_to || '';
    // Format dates for input fields (YYYY-MM-DD format)
    document.getElementById('activityStartDate').value = formatDateForInput(activity.start_date);
    document.getElementById('activityEndDate').value = formatDateForInput(activity.end_date);
    document.getElementById('activityEstimatedHours').value = activity.estimated_hours || '';
    document.getElementById('activityPriority').value = activity.priority || 'medium';
    document.getElementById('activityMaterials').value = activity.materials_needed || '';
    document.getElementById('activityEquipment').value = activity.equipment_needed || '';
    document.getElementById('activityNotes').value = activity.notes || '';

    // Update modal title
    document.getElementById('activityModalTitle').textContent = 'Editar Actividad';

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('activityModal'));
    modal.show();
}

async function deleteActivity(activityId) {
    const activity = currentActivities.find(a => a.id === activityId);
    if (!activity) return;

    const confirmMessage = `¿Estás seguro de que quieres eliminar la actividad "${activity.name}"?\n\nEsta acción no se puede deshacer.`;
    
    if (!confirm(confirmMessage)) return;

    try {
        app.showLoading(true);
        
        const response = await fetch(`/api/activities/${activityId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            app.showNotification('Actividad eliminada correctamente', 'success');
            await loadActivities();
        } else {
            const result = await response.json();
            app.showNotification(result.error || 'Error al eliminar la actividad', 'danger');
        }
    } catch (error) {
        console.error('Delete activity error:', error);
        app.showNotification('Error de conexión', 'danger');
    } finally {
        app.showLoading(false);
    }
}

async function viewActivity(activityId) {
    try {
        const response = await fetch(`/api/activities/${activityId}`);
        if (!response.ok) throw new Error('Error al cargar detalles de la actividad');
        
        const data = await response.json();
        showActivityDetailsModal(data.activity);
    } catch (error) {
        console.error('View activity error:', error);
        app.showNotification('Error cargando detalles de la actividad', 'danger');
    }
}

function showActivityDetailsModal(activity) {
    // Create modal HTML
    const modalHtml = `
        <div class="modal fade" id="activityDetailsModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">
                            <i class="bi bi-list-task"></i> ${activity.name}
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6><i class="bi bi-info-circle"></i> Información General</h6>
                                <p><strong>Proyecto:</strong> ${activity.project_name || 'No asignado'}</p>
                                <p><strong>Asignado a:</strong> ${activity.assigned_to_name || 'Sin asignar'}</p>
                                <p><strong>Estado:</strong> 
                                    <span class="badge status-${activity.status}">
                                        ${getActivityStatusText(activity.status)}
                                    </span>
                                </p>
                                <p><strong>Prioridad:</strong> 
                                    <span class="badge priority-${activity.priority}">
                                        ${getPriorityText(activity.priority)}
                                    </span>
                                </p>
                            </div>
                            <div class="col-md-6">
                                <h6><i class="bi bi-calendar"></i> Fechas</h6>
                                <p><strong>Fecha Inicio:</strong> ${activity.start_date ? new Date(activity.start_date).toLocaleDateString() : 'No definida'}</p>
                                <p><strong>Fecha Fin:</strong> ${activity.end_date ? new Date(activity.end_date).toLocaleDateString() : 'No definida'}</p>
                                <p><strong>Horas Estimadas:</strong> ${activity.estimated_hours || 'No definidas'}</p>
                                <p><strong>Horas Reales:</strong> ${activity.actual_hours || 'No registradas'}</p>
                            </div>
                        </div>
                        ${activity.description ? `<p><strong>Descripción:</strong><br>${activity.description}</p>` : ''}
                        ${activity.materials_needed ? `<p><strong>Materiales Necesarios:</strong><br>${activity.materials_needed}</p>` : ''}
                        ${activity.equipment_needed ? `<p><strong>Equipos Necesarios:</strong><br>${activity.equipment_needed}</p>` : ''}
                        ${activity.notes ? `<p><strong>Notas:</strong><br>${activity.notes}</p>` : ''}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        <button type="button" class="btn btn-primary" onclick="editActivity(${activity.id}); bootstrap.Modal.getInstance(document.getElementById('activityDetailsModal')).hide();">
                            <i class="bi bi-pencil"></i> Editar Actividad
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal if any
    const existingModal = document.getElementById('activityDetailsModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Add modal to DOM and show
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('activityDetailsModal'));
    modal.show();

    // Clean up modal after hiding
    document.getElementById('activityDetailsModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

// Reset form when modal is shown for new activity
document.addEventListener('DOMContentLoaded', function() {
    const activityModal = document.getElementById('activityModal');
    if (activityModal) {
        activityModal.addEventListener('show.bs.modal', function() {
            // Only reset if we're creating a new activity (no activityId set)
            if (!document.getElementById('activityId').value) {
                document.getElementById('activityForm').reset();
                document.getElementById('activityId').value = '';
                document.getElementById('activityModalTitle').textContent = 'Nueva Actividad';
                // Set default values
                document.getElementById('activityPriority').value = 'medium';
                
                // Populate project dropdown directly
                const projectSelect = document.getElementById('activityProject');
                if (projectSelect) {
                    projectSelect.innerHTML = '<option value="">Seleccionar proyecto...</option>';
                    activitiesProjects.forEach(project => {
                        const option = document.createElement('option');
                        option.value = project.id;
                        option.textContent = project.name;
                        projectSelect.appendChild(option);
                    });
                }
                
                // Populate user dropdown
                populateUserDropdown();
            }
        });
        
        // Clear the activityId when modal is hidden to ensure next open is for new activity
        activityModal.addEventListener('hidden.bs.modal', function() {
            document.getElementById('activityId').value = '';
        });
    }
});

// Export functions for global access
window.loadActivities = loadActivities;
window.saveActivity = saveActivity;
window.editActivity = editActivity;
window.deleteActivity = deleteActivity;
window.viewActivity = viewActivity;
