// Files functionality
let currentFiles = [];
let filesProjects = [];
let selectedProjectId = null;

async function loadFiles() {
    try {
        // Load files data - get all files that have projects associated
        const filesResponse = await fetch('/api/files');
        if (!filesResponse.ok) {
            throw new Error('Error al cargar datos de archivos');
        }

        const filesData = await filesResponse.json();
        // Filter to show only files that have projects associated
        currentFiles = (filesData.files || []).filter(file => file.project_id && file.project_name);
        
        // Get unique projects that have files
        const projectsWithFiles = getProjectsWithFiles(currentFiles);
        filesProjects = projectsWithFiles;

        // Always load all projects for the filter dropdown
        try {
            const projectsResponse = await fetch('/api/projects');
            if (projectsResponse.ok) {
                const projectsData = await projectsResponse.json();
                const allProjects = projectsData.projects || [];
                
                // Merge projects with files and all projects
                const allProjectsMap = new Map();
                allProjects.forEach(project => {
                    allProjectsMap.set(project.id, {
                        id: project.id,
                        name: project.name,
                        fileCount: 0
                    });
                });
                
                // Update file counts for projects that have files
                projectsWithFiles.forEach(project => {
                    if (allProjectsMap.has(project.id)) {
                        allProjectsMap.get(project.id).fileCount = project.fileCount;
                    }
                });
                
                filesProjects = Array.from(allProjectsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
            }
        } catch (error) {
            console.error('Error loading all projects:', error);
        }

        // Populate project dropdown
        await populateProjectDropdown();

        // Render files table
        renderFilesTable();

    } catch (error) {
        console.error('Load files error:', error);
        app.showNotification('Error cargando archivos', 'danger');
    }
}

function getProjectsWithFiles(files) {
    // Create a map to store unique projects with their file counts
    const projectMap = new Map();
    
    files.forEach(file => {
        if (file.project_id && file.project_name) {
            if (!projectMap.has(file.project_id)) {
                projectMap.set(file.project_id, {
                    id: file.project_id,
                    name: file.project_name,
                    fileCount: 0
                });
            }
            projectMap.get(file.project_id).fileCount++;
        }
    });
    
    // Convert map to array and sort by name
    return Array.from(projectMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}

async function populateProjectDropdown() {
    const projectSelect = document.getElementById('fileProjectFilter');
    const uploadProjectSelect = document.getElementById('fileProject');
    
    // Populate filter dropdown with all projects
    if (projectSelect) {
        projectSelect.innerHTML = '<option value="">Todas las obras con archivos</option>';
        filesProjects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.id;
            if (project.fileCount > 0) {
                option.textContent = `${project.name} (${project.fileCount} archivo${project.fileCount !== 1 ? 's' : ''})`;
            } else {
                option.textContent = `${project.name} (sin archivos)`;
            }
            projectSelect.appendChild(option);
        });
    }
    
    // For upload modal, we need all projects, not just those with files
    if (uploadProjectSelect) {
        try {
            const projectsResponse = await fetch('/api/projects');
            if (projectsResponse.ok) {
                const projectsData = await projectsResponse.json();
                const allProjects = projectsData.projects || [];
                
                uploadProjectSelect.innerHTML = '<option value="">Sin obra específica</option>';
                allProjects.forEach(project => {
                    const option = document.createElement('option');
                    option.value = project.id;
                    option.textContent = project.name;
                    uploadProjectSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error loading all projects for upload:', error);
            // Fallback to projects with files only
            uploadProjectSelect.innerHTML = '<option value="">Sin obra específica</option>';
            filesProjects.forEach(project => {
                const option = document.createElement('option');
                option.value = project.id;
                option.textContent = project.name;
                uploadProjectSelect.appendChild(option);
            });
        }
    }
}

function renderFilesTable() {
    const tbody = document.getElementById('filesTableBody');
    if (!tbody) return;

    // Filter files by selected project
    let filteredFiles = currentFiles;
    if (selectedProjectId) {
        filteredFiles = currentFiles.filter(file => file.project_id == selectedProjectId);
    }

    if (filteredFiles.length === 0) {
        if (selectedProjectId) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-muted py-4">
                        <i class="bi bi-folder fs-1 d-block mb-2"></i>
                        No hay archivos asociados a esta obra
                    </td>
                </tr>
            `;
        } else {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-muted py-4">
                        <i class="bi bi-folder fs-1 d-block mb-2"></i>
                        No hay archivos asociados a obras
                        <br><small class="text-muted">Los archivos sin obra asociada no se muestran en esta vista</small>
                    </td>
                </tr>
            `;
        }
        return;
    }

    tbody.innerHTML = filteredFiles.map(file => `
        <tr>
            <td>
                <div class="d-flex align-items-center">
                    <i class="bi ${getFileIcon(file.file_type)} me-2 text-primary"></i>
                    <div>
                        <h6 class="mb-1">${file.original_name}</h6>
                        ${file.description ? `<small class="text-muted">${file.description.substring(0, 50)}${file.description.length > 50 ? '...' : ''}</small>` : ''}
                    </div>
                </div>
            </td>
            <td>${file.project_name || 'Sin obra'}</td>
            <td>
                <span class="badge bg-secondary">
                    ${getFileTypeText(file.file_type)}
                </span>
            </td>
            <td>${formatFileSize(file.file_size)}</td>
            <td>${file.uploaded_by_name || 'Desconocido'}</td>
            <td>${new Date(file.created_at).toLocaleDateString()}</td>
            <td>
                <div class="btn-group" role="group">
                    <button class="btn btn-sm btn-outline-primary" onclick="downloadFile(${file.id})" title="Descargar">
                        <i class="bi bi-download"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-warning" onclick="editFile(${file.id})" title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-info" onclick="viewFileDetails(${file.id})" title="Ver detalles">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteFile(${file.id})" title="Eliminar">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function getFileIcon(fileType) {
    const iconMap = {
        'image': 'bi-image',
        'pdf': 'bi-file-pdf',
        'excel': 'bi-file-excel',
        'word': 'bi-file-word',
        'cad': 'bi-file-earmark-binary',
        'other': 'bi-file-earmark'
    };
    return iconMap[fileType] || 'bi-file-earmark';
}

function getFileTypeText(fileType) {
    const typeMap = {
        'image': 'Imagen',
        'pdf': 'PDF',
        'excel': 'Excel',
        'word': 'Word',
        'cad': 'CAD',
        'other': 'Otro'
    };
    return typeMap[fileType] || 'Desconocido';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function uploadFiles() {
    const fileInput = document.getElementById('fileInput');
    const projectSelect = document.getElementById('fileProject');
    const descriptionInput = document.getElementById('fileDescription');
    const isSharedCheckbox = document.getElementById('fileIsShared');

    if (!fileInput.files || fileInput.files.length === 0) {
        app.showNotification('Por favor selecciona al menos un archivo', 'warning');
        return;
    }

    const formData = new FormData();
    
    // Add files
    for (let i = 0; i < fileInput.files.length; i++) {
        formData.append('files', fileInput.files[i]);
    }
    
    // Add other data
    formData.append('projectId', projectSelect.value || '');
    formData.append('description', descriptionInput.value || '');
    formData.append('isShared', isSharedCheckbox.checked);

    try {
        app.showLoading(true);
        
        const response = await fetch('/api/files/upload', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (response.ok) {
            app.showNotification(
                `${result.files.length} archivo(s) subido(s) correctamente`, 
                'success'
            );
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('fileUploadModal'));
            modal.hide();
            
            // Reset form
            document.getElementById('fileUploadForm').reset();
            
            // Reload files to update the filter dropdown
            await loadFiles();
        } else {
            app.showNotification(result.error || 'Error al subir archivos', 'danger');
        }
    } catch (error) {
        console.error('Upload files error:', error);
        app.showNotification('Error de conexión', 'danger');
    } finally {
        app.showLoading(false);
    }
}

async function downloadFile(fileId) {
    try {
        app.showLoading(true);
        
        const response = await fetch(`/api/files/${fileId}/download`);
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al descargar el archivo');
        }

        // Get filename from Content-Disposition header
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = 'archivo';
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="(.+)"/);
            if (filenameMatch) {
                filename = filenameMatch[1];
            }
        }

        // Create blob and download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        app.showNotification('Archivo descargado correctamente', 'success');
    } catch (error) {
        console.error('Download file error:', error);
        app.showNotification(error.message || 'Error al descargar el archivo', 'danger');
    } finally {
        app.showLoading(false);
    }
}

async function deleteFile(fileId) {
    const file = currentFiles.find(f => f.id === fileId);
    if (!file) return;

    // Create a more detailed confirmation dialog
    const confirmMessage = `¿Estás seguro de que quieres eliminar el archivo "${file.original_name}"?\n\n` +
                          `Detalles del archivo:\n` +
                          `- Tamaño: ${formatFileSize(file.file_size)}\n` +
                          `- Tipo: ${getFileTypeText(file.file_type)}\n` +
                          `- Obra: ${file.project_name || 'Sin obra'}\n\n` +
                          `⚠️ Esta acción no se puede deshacer y eliminará tanto el archivo físico como su registro en la base de datos.`;
    
    if (!confirm(confirmMessage)) return;

    try {
        app.showLoading(true);
        
        const response = await fetch(`/api/files/${fileId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            app.showNotification(`Archivo "${file.original_name}" eliminado correctamente`, 'success');
            // Reload files to update the filter dropdown
            await loadFiles();
        } else {
            const result = await response.json();
            app.showNotification(result.error || 'Error al eliminar el archivo', 'danger');
        }
    } catch (error) {
        console.error('Delete file error:', error);
        app.showNotification('Error de conexión al eliminar el archivo', 'danger');
    } finally {
        app.showLoading(false);
    }
}

async function viewFileDetails(fileId) {
    try {
        const response = await fetch(`/api/files/${fileId}`);
        if (!response.ok) throw new Error('Error al cargar detalles del archivo');
        
        const data = await response.json();
        showFileDetailsModal(data.file);
    } catch (error) {
        console.error('View file error:', error);
        app.showNotification('Error cargando detalles del archivo', 'danger');
    }
}

async function editFile(fileId) {
    const file = currentFiles.find(f => f.id === fileId);
    if (!file) return;

    // Populate form with file data
    document.getElementById('editFileId').value = file.id;
    document.getElementById('editFileDescription').value = file.description || '';
    document.getElementById('editFileProject').value = file.project_id || '';
    document.getElementById('editFileIsShared').checked = file.is_shared || false;

    // Load all projects for the edit modal
    try {
        const projectsResponse = await fetch('/api/projects');
        if (projectsResponse.ok) {
            const projectsData = await projectsResponse.json();
            const allProjects = projectsData.projects || [];
            
            const editProjectSelect = document.getElementById('editFileProject');
            if (editProjectSelect) {
                editProjectSelect.innerHTML = '<option value="">Sin obra específica</option>';
                allProjects.forEach(project => {
                    const option = document.createElement('option');
                    option.value = project.id;
                    option.textContent = project.name;
                    editProjectSelect.appendChild(option);
                });
                
                // Set the current project as selected
                editProjectSelect.value = file.project_id || '';
            }
        }
    } catch (error) {
        console.error('Error loading projects for edit:', error);
    }

    // Update modal title
    document.getElementById('editFileModalTitle').textContent = `Editar: ${file.original_name}`;

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('editFileModal'));
    modal.show();
}

async function saveFileChanges() {
    const fileId = document.getElementById('editFileId').value;
    const description = document.getElementById('editFileDescription').value;
    const projectId = document.getElementById('editFileProject').value;
    const isShared = document.getElementById('editFileIsShared').checked;

    const fileData = {
        description: description,
        projectId: projectId || null,
        isShared: isShared
    };

    try {
        app.showLoading(true);
        
        const response = await fetch(`/api/files/${fileId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(fileData)
        });

        const result = await response.json();

        if (response.ok) {
            app.showNotification('Archivo actualizado correctamente', 'success');
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('editFileModal'));
            modal.hide();
            
            // Reload files to update the filter dropdown
            await loadFiles();
        } else {
            app.showNotification(result.error || 'Error al actualizar el archivo', 'danger');
        }
    } catch (error) {
        console.error('Update file error:', error);
        app.showNotification('Error de conexión', 'danger');
    } finally {
        app.showLoading(false);
    }
}

function showFileDetailsModal(file) {
    // Create modal HTML
    const modalHtml = `
        <div class="modal fade" id="fileDetailsModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">
                            <i class="bi ${getFileIcon(file.file_type)}"></i> ${file.original_name}
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-8">
                                <div class="card mb-3">
                                    <div class="card-header">
                                        <h6><i class="bi bi-info-circle"></i> Información del Archivo</h6>
                                    </div>
                                    <div class="card-body">
                                        <div class="row">
                                            <div class="col-md-6">
                                                <p><strong>Nombre:</strong> ${file.original_name}</p>
                                                <p><strong>Tipo:</strong> 
                                                    <span class="badge bg-secondary">
                                                        ${getFileTypeText(file.file_type)}
                                                    </span>
                                                </p>
                                                <p><strong>Tamaño:</strong> ${formatFileSize(file.file_size)}</p>
                                            </div>
                                            <div class="col-md-6">
                                                <p><strong>Obra:</strong> ${file.project_name || 'Sin obra'}</p>
                                                <p><strong>Subido por:</strong> ${file.uploaded_by_name || 'Desconocido'}</p>
                                                <p><strong>Fecha:</strong> ${new Date(file.created_at).toLocaleString()}</p>
                                            </div>
                                        </div>
                                        ${file.description ? `<p><strong>Descripción:</strong><br>${file.description}</p>` : ''}
                                    </div>
                                </div>
                            </div>
                            
                            <div class="col-md-4">
                                <div class="card">
                                    <div class="card-header">
                                        <h6><i class="bi bi-gear"></i> Acciones</h6>
                                    </div>
                                    <div class="card-body">
                                        <div class="d-grid gap-2">
                                            <button class="btn btn-primary" onclick="downloadFile(${file.id}); bootstrap.Modal.getInstance(document.getElementById('fileDetailsModal')).hide();">
                                                <i class="bi bi-download"></i> Descargar Archivo
                                            </button>
                                            <button class="btn btn-outline-warning" onclick="editFile(${file.id}); bootstrap.Modal.getInstance(document.getElementById('fileDetailsModal')).hide();">
                                                <i class="bi bi-pencil"></i> Editar Archivo
                                            </button>
                                            <button class="btn btn-outline-danger" onclick="deleteFile(${file.id}); bootstrap.Modal.getInstance(document.getElementById('fileDetailsModal')).hide();">
                                                <i class="bi bi-trash"></i> Eliminar Archivo
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal if any
    const existingModal = document.getElementById('fileDetailsModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Add modal to DOM and show
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('fileDetailsModal'));
    modal.show();

    // Clean up modal after hiding
    document.getElementById('fileDetailsModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

function filterFilesByProject() {
    const projectSelect = document.getElementById('fileProjectFilter');
    selectedProjectId = projectSelect.value;
    renderFilesTable();
}

// Reset form when modal is shown
document.addEventListener('DOMContentLoaded', function() {
    const fileUploadModal = document.getElementById('fileUploadModal');
    if (fileUploadModal) {
        fileUploadModal.addEventListener('show.bs.modal', function() {
            document.getElementById('fileUploadForm').reset();
        });
    }
});

// Export functions for global access
window.loadFiles = loadFiles;
window.uploadFiles = uploadFiles;
window.downloadFile = downloadFile;
window.deleteFile = deleteFile;
window.viewFileDetails = viewFileDetails;
window.editFile = editFile;
window.saveFileChanges = saveFileChanges;
window.filterFilesByProject = filterFilesByProject;
