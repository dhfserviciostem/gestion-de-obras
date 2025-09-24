// Main Application JavaScript
class ConstructionApp {
    constructor() {
        this.currentUser = null;
        this.currentSection = 'dashboard';
        this.init();
    }

    init() {
        this.setupEventListeners();
        // Always show login modal first
        this.showLogin();
    }

    setupEventListeners() {
        // Login form
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.login();
        });

        // Logout button
        document.getElementById('logoutBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.logout();
        });

        // Navigation links
        document.querySelectorAll('[data-section]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.getAttribute('data-section');
                this.showSection(section);
            });
        });

        // Profile link
        document.getElementById('profileLink').addEventListener('click', (e) => {
            e.preventDefault();
            this.showProfile();
        });
    }

    async checkAuthStatus() {
        try {
            const response = await fetch('/api/auth/me');
            if (response.ok) {
                const data = await response.json();
                this.currentUser = data.user;
                this.showMainApp();
                this.showSection('dashboard'); // Load dashboard by default
            } else {
                this.showLogin();
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            this.showLogin();
        }
    }

    async login() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('loginError');

        this.hideError(errorDiv);
        this.showLoading(true);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                this.currentUser = data.user;
                this.showMainApp();
                this.showNotification('Bienvenido al sistema', 'success');
                // Load dashboard data after successful login
                this.showSection('dashboard');
            } else {
                this.showError(errorDiv, data.error || 'Error de autenticación');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError(errorDiv, 'Error de conexión');
        } finally {
            this.showLoading(false);
        }
    }

    async logout() {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            this.currentUser = null;
            this.showLogin();
            this.showNotification('Sesión cerrada correctamente', 'info');
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    showLogin() {
        document.getElementById('mainApp').classList.add('d-none');
        const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
        
        // Clear form before showing modal
        document.getElementById('loginForm').reset();
        
        // Show modal and focus on username field after it's fully shown
        loginModal.show();
        
        // Wait for modal to be fully shown before focusing
        document.getElementById('loginModal').addEventListener('shown.bs.modal', function() {
            document.getElementById('username').focus();
        }, { once: true });
        this.hideError(document.getElementById('loginError'));
    }

    showMainApp() {
        const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
        if (loginModal) {
            loginModal.hide();
        }
        
        document.getElementById('mainApp').classList.remove('d-none');
        document.getElementById('currentUserName').textContent = 
            `${this.currentUser.firstName} ${this.currentUser.lastName}`;
    }

    showSection(sectionName, filter = null) {
        // Clear any existing filters when switching sections
        if (this.currentSection !== sectionName) {
            this.clearAllFilters();
        }

        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.add('d-none');
        });

        // Show selected section
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.classList.remove('d-none');
        }

        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = document.querySelector(`[data-section="${sectionName}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        // Handle special filters
        if (filter) {
            this.handleSectionFilter(sectionName, filter);
        }

        this.currentSection = sectionName;

        // Load section content
        this.loadSectionContent(sectionName);
    }

    clearAllFilters() {
        // Remove filter indicator
        const existingIndicator = document.querySelector('.filter-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }
        
        // Restore original data for all sections
        if (this.originalProjectsData) {
            projectsData = [...this.originalProjectsData];
            this.originalProjectsData = null;
        }
        
        if (this.originalActivitiesData) {
            currentActivities = [...this.originalActivitiesData];
            this.originalActivitiesData = null;
        }
    }

    handleSectionFilter(sectionName, filter) {
        // Add a small delay to ensure the section is loaded
        setTimeout(() => {
            switch (sectionName) {
                case 'projects':
                    if (filter === 'active') {
                        this.showNotification('Mostrando solo obras en progreso', 'info');
                        this.filterProjectsByStatus('in_progress');
                    }
                    break;
                case 'activities':
                    if (filter === 'pending') {
                        this.showNotification('Mostrando solo actividades pendientes', 'info');
                        this.filterActivitiesByStatus('pending');
                    }
                    break;
            }
        }, 100);
    }

    filterProjectsByStatus(status) {
        // Store original data if not already stored
        if (!this.originalProjectsData) {
            this.originalProjectsData = [...projectsData];
        }
        
        // Debug: Log available statuses
        console.log('Available project statuses:', this.originalProjectsData.map(p => p.status));
        console.log('Filtering by status:', status);
        
        // Filter projects by status
        const filteredProjects = this.originalProjectsData.filter(project => {
            return project.status === status;
        });
        
        console.log('Filtered projects:', filteredProjects);
        
        // Update the global projectsData with filtered data
        projectsData = filteredProjects;
        
        // Re-render the table
        if (typeof renderProjectsTable === 'function') {
            renderProjectsTable();
        }
        
        // Add filter indicator with appropriate message
        const statusText = this.getStatusDisplayText(status);
        this.addFilterIndicator('projects', `${statusText} (${filteredProjects.length})`);
        
        // Show message if no results
        if (filteredProjects.length === 0) {
            this.showNotification(`No hay obras con estado "${statusText}"`, 'warning');
        }
    }

    getStatusDisplayText(status) {
        const statusMap = {
            'planning': 'Obras en planificación',
            'in_progress': 'Obras en progreso',
            'on_hold': 'Obras en pausa',
            'completed': 'Obras completadas',
            'cancelled': 'Obras canceladas'
        };
        return statusMap[status] || `Obras con estado "${status}"`;
    }

    filterActivitiesByStatus(status) {
        // Store original data if not already stored
        if (!this.originalActivitiesData) {
            this.originalActivitiesData = [...currentActivities];
        }
        
        // Debug: Log available statuses
        console.log('Available activity statuses:', this.originalActivitiesData.map(a => a.status));
        console.log('Filtering activities by status:', status);
        
        // Filter activities by status
        const filteredActivities = this.originalActivitiesData.filter(activity => {
            return activity.status === status;
        });
        
        console.log('Filtered activities:', filteredActivities);
        
        // Update the global currentActivities with filtered data
        currentActivities = filteredActivities;
        
        // Re-render the table
        if (typeof renderActivitiesTable === 'function') {
            renderActivitiesTable();
        }
        
        // Add filter indicator with appropriate message
        const statusText = this.getActivityStatusDisplayText(status);
        this.addFilterIndicator('activities', `${statusText} (${filteredActivities.length})`);
        
        // Show message if no results
        if (filteredActivities.length === 0) {
            this.showNotification(`No hay actividades con estado "${statusText}"`, 'warning');
        }
    }

    getActivityStatusDisplayText(status) {
        const statusMap = {
            'pending': 'Actividades pendientes',
            'in_progress': 'Actividades en progreso',
            'completed': 'Actividades completadas',
            'cancelled': 'Actividades canceladas'
        };
        return statusMap[status] || `Actividades con estado "${status}"`;
    }

    addFilterIndicator(section, text) {
        // Remove existing filter indicator
        const existingIndicator = document.querySelector('.filter-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }
        
        // Create filter indicator
        const indicator = document.createElement('div');
        indicator.className = 'filter-indicator alert alert-info d-flex justify-content-between align-items-center';
        indicator.innerHTML = `
            <span><i class="bi bi-funnel"></i> ${text}</span>
            <button type="button" class="btn btn-sm btn-outline-secondary" onclick="app.clearFilter('${section}')">
                <i class="bi bi-x"></i> Limpiar filtro
            </button>
        `;
        
        // Insert at the top of the section
        const sectionElement = document.getElementById(`${section}-section`);
        if (sectionElement) {
            const firstChild = sectionElement.firstElementChild;
            if (firstChild) {
                sectionElement.insertBefore(indicator, firstChild);
            } else {
                sectionElement.appendChild(indicator);
            }
        }
    }

    clearFilter(section) {
        // Remove filter indicator
        const existingIndicator = document.querySelector('.filter-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }
        
        // Restore original data
        switch (section) {
            case 'projects':
                if (this.originalProjectsData) {
                    projectsData = [...this.originalProjectsData];
                    this.originalProjectsData = null;
                    if (typeof renderProjectsTable === 'function') {
                        renderProjectsTable();
                    }
                }
                break;
            case 'activities':
                if (this.originalActivitiesData) {
                    currentActivities = [...this.originalActivitiesData];
                    this.originalActivitiesData = null;
                    if (typeof renderActivitiesTable === 'function') {
                        renderActivitiesTable();
                    }
                }
                break;
        }
        
        this.showNotification('Filtro eliminado', 'info');
    }

    async loadSectionContent(sectionName) {
        this.showLoading(true);
        
        try {
            switch (sectionName) {
                case 'dashboard':
                    await this.loadDashboard();
                    break;
                case 'projects':
                    await this.loadProjects();
                    break;
                case 'activities':
                    await this.loadActivities();
                    break;
                case 'clients':
                    await this.loadClients();
                    break;
                case 'suppliers':
                    await this.loadSuppliers();
                    break;
                case 'files':
                    await this.loadFiles();
                    break;
                case 'users':
                    await this.loadUsers();
                    break;
            }
        } catch (error) {
            console.error(`Error loading ${sectionName}:`, error);
            this.showNotification(`Error cargando ${sectionName}`, 'danger');
        } finally {
            this.showLoading(false);
        }
    }

    async loadDashboard() {
        if (typeof loadDashboard === 'function') {
            await loadDashboard();
        }
    }

    async loadProjects() {
        if (typeof loadProjects === 'function') {
            await loadProjects();
        }
    }

    async loadActivities() {
        if (typeof loadActivities === 'function') {
            await loadActivities();
        }
    }

    async loadClients() {
        if (typeof loadClients === 'function') {
            await loadClients();
        }
    }

    async loadSuppliers() {
        if (typeof loadSuppliers === 'function') {
            await loadSuppliers();
        }
    }

    async loadFiles() {
        // Use the dedicated files functionality
        if (typeof loadFiles === 'function') {
            await loadFiles();
        } else {
            console.warn('Files functionality not loaded');
        }
    }

    async loadUsers() {
        if (this.currentUser.role !== 'admin' && this.currentUser.role !== 'manager') {
            this.showNotification('No tienes permisos para ver esta sección', 'warning');
            this.showSection('dashboard');
            return;
        }
        
        if (typeof loadUsers === 'function') {
            await loadUsers();
        }
    }

    async loadGenericSection(type, title) {
        const section = document.getElementById(`${type}-section`);
        if (!section) return;

        try {
            const response = await fetch(`/api/${type}`);
            if (!response.ok) throw new Error(`Error loading ${type}`);
            
            const data = await response.json();
            this.renderGenericSection(section, type, title, data[type] || []);
        } catch (error) {
            console.error(`Error loading ${type}:`, error);
            section.innerHTML = `<div class="alert alert-danger">Error cargando ${title}</div>`;
        }
    }

    renderGenericSection(section, type, title, items) {
        const iconMap = {
            activities: 'list-task',
            clients: 'people',
            suppliers: 'truck',
            files: 'folder',
            users: 'person-gear'
        };

        section.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2><i class="bi bi-${iconMap[type]}"></i> Gestión de ${title}</h2>
                <button class="btn btn-primary" onclick="app.showCreateModal('${type}')">
                    <i class="bi bi-plus-circle"></i> Nuevo ${title.slice(0, -1)}
                </button>
            </div>
            <div class="card">
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead class="table-dark">
                                <tr id="${type}TableHeader"></tr>
                            </thead>
                            <tbody id="${type}TableBody"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        this.renderTable(type, items);
    }

    renderTable(type, items) {
        const headerElement = document.getElementById(`${type}TableHeader`);
        const bodyElement = document.getElementById(`${type}TableBody`);
        
        if (!headerElement || !bodyElement) return;

        // Define table headers for each type
        const headers = {
            activities: ['Nombre', 'Proyecto', 'Asignado a', 'Estado', 'Progreso', 'Fecha Fin', 'Acciones'],
            clients: ['Nombre', 'Empresa', 'Email', 'Teléfono', 'Ciudad', 'Acciones'],
            suppliers: ['Nombre', 'Empresa', 'Tipo', 'Email', 'Teléfono', 'Acciones'],
            files: ['Nombre', 'Tipo', 'Proyecto', 'Tamaño', 'Subido por', 'Fecha', 'Acciones'],
            users: ['Usuario', 'Nombre', 'Email', 'Rol', 'Estado', 'Fecha Registro', 'Acciones']
        };

        // Render headers
        headerElement.innerHTML = headers[type].map(header => `<th>${header}</th>`).join('');

        // Render rows
        bodyElement.innerHTML = items.map(item => this.renderTableRow(type, item)).join('');
    }

    renderTableRow(type, item) {
        switch (type) {
            case 'activities':
                return `
                    <tr>
                        <td>${item.name}</td>
                        <td>${item.project_name || 'N/A'}</td>
                        <td>${item.assigned_to_name || 'Sin asignar'}</td>
                        <td><span class="badge status-${item.status}">${this.getStatusText(item.status)}</span></td>
                        <td>
                            <div class="progress" style="height: 6px;">
                                <div class="progress-bar" style="width: ${item.progress_percentage || 0}%"></div>
                            </div>
                            <small>${item.progress_percentage || 0}%</small>
                        </td>
                        <td>${item.end_date ? new Date(item.end_date).toLocaleDateString() : 'N/A'}</td>
                        <td>
                            <button class="btn btn-sm btn-outline-primary" onclick="app.editItem('${type}', ${item.id})">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="app.deleteItem('${type}', ${item.id})">
                                <i class="bi bi-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            case 'clients':
                return `
                    <tr>
                        <td>${item.name}</td>
                        <td>${item.company || 'N/A'}</td>
                        <td>${item.email || 'N/A'}</td>
                        <td>${item.phone || 'N/A'}</td>
                        <td>${item.city || 'N/A'}</td>
                        <td>
                            <button class="btn btn-sm btn-outline-primary" onclick="app.editItem('${type}', ${item.id})">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="app.deleteItem('${type}', ${item.id})">
                                <i class="bi bi-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            case 'suppliers':
                return `
                    <tr>
                        <td>${item.name}</td>
                        <td>${item.company || 'N/A'}</td>
                        <td><span class="badge bg-info">${this.getSupplierTypeText(item.supplier_type)}</span></td>
                        <td>${item.email || 'N/A'}</td>
                        <td>${item.phone || 'N/A'}</td>
                        <td>
                            <button class="btn btn-sm btn-outline-primary" onclick="app.editItem('${type}', ${item.id})">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="app.deleteItem('${type}', ${item.id})">
                                <i class="bi bi-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            case 'files':
                return `
                    <tr>
                        <td>
                            <i class="bi bi-${this.getFileIcon(item.file_type)}"></i>
                            ${item.original_name}
                        </td>
                        <td><span class="badge bg-secondary">${item.file_type}</span></td>
                        <td>${item.project_name || 'N/A'}</td>
                        <td>${this.formatFileSize(item.file_size)}</td>
                        <td>${item.uploaded_by_name || 'N/A'}</td>
                        <td>${new Date(item.created_at).toLocaleDateString()}</td>
                        <td>
                            <button class="btn btn-sm btn-outline-success" onclick="app.downloadFile(${item.id})">
                                <i class="bi bi-download"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="app.deleteItem('${type}', ${item.id})">
                                <i class="bi bi-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            case 'projects':
                return `
                    <tr>
                        <td>${item.name}</td>
                        <td>${item.client_name || 'Sin cliente'}</td>
                        <td><span class="badge status-${item.status}">${this.getStatusText(item.status)}</span></td>
                        <td>
                            <div class="progress" style="height: 6px;">
                                <div class="progress-bar" style="width: ${item.progress_percentage || 0}%"></div>
                            </div>
                            <small>${item.progress_percentage || 0}%</small>
                        </td>
                        <td>${item.start_date ? new Date(item.start_date).toLocaleDateString() : 'N/A'}</td>
                        <td>${item.end_date ? new Date(item.end_date).toLocaleDateString() : 'N/A'}</td>
                        <td>
                            <button class="btn btn-sm btn-outline-primary" onclick="app.editItem('${type}', ${item.id})">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="app.deleteItem('${type}', ${item.id})">
                                <i class="bi bi-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            case 'users':
                return `
                    <tr>
                        <td>${item.username}</td>
                        <td>${item.first_name} ${item.last_name}</td>
                        <td>${item.email}</td>
                        <td><span class="badge bg-primary">${this.getRoleText(item.role)}</span></td>
                        <td>
                            <span class="badge ${item.is_active ? 'bg-success' : 'bg-danger'}">
                                ${item.is_active ? 'Activo' : 'Inactivo'}
                            </span>
                        </td>
                        <td>${new Date(item.created_at).toLocaleDateString()}</td>
                        <td>
                            <button class="btn btn-sm btn-outline-primary" onclick="app.editItem('${type}', ${item.id})">
                                <i class="bi bi-pencil"></i>
                            </button>
                            ${item.id !== this.currentUser.id ? `
                                <button class="btn btn-sm btn-outline-danger" onclick="app.deleteItem('${type}', ${item.id})">
                                    <i class="bi bi-trash"></i>
                                </button>
                            ` : ''}
                        </td>
                    </tr>
                `;
            default:
                return '';
        }
    }

    // Utility methods
    getStatusText(status) {
        const statusMap = {
            'pending': 'Pendiente',
            'in_progress': 'En Progreso',
            'completed': 'Completado',
            'cancelled': 'Cancelado',
            'on_hold': 'En Pausa',
            'planning': 'Planificación'
        };
        return statusMap[status] || status;
    }

    getSupplierTypeText(type) {
        const typeMap = {
            'materials': 'Materiales',
            'equipment': 'Equipos',
            'services': 'Servicios',
            'subcontractor': 'Subcontratista'
        };
        return typeMap[type] || type;
    }

    getRoleText(role) {
        const roleMap = {
            'admin': 'Administrador',
            'manager': 'Gerente',
            'supervisor': 'Supervisor',
            'worker': 'Trabajador'
        };
        return roleMap[role] || role;
    }

    getFileIcon(fileType) {
        const iconMap = {
            'image': 'image',
            'excel': 'file-earmark-spreadsheet',
            'word': 'file-earmark-word',
            'pdf': 'file-earmark-pdf',
            'cad': 'file-earmark-code',
            'other': 'file-earmark'
        };
        return iconMap[fileType] || 'file-earmark';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Modal and form methods
    showCreateModal(type) {
        // Show appropriate modal based on type
        switch(type) {
            case 'activities':
                // Activities don't have a dedicated modal in the current HTML, show notification
                this.showNotification('Funcionalidad de crear actividades pendiente de implementar', 'info');
                break;
            case 'clients':
                // Clients don't have a dedicated modal in the current HTML, show notification
                this.showNotification('Funcionalidad de crear clientes pendiente de implementar', 'info');
                break;
            case 'suppliers':
                // Suppliers don't have a dedicated modal in the current HTML, show notification
                this.showNotification('Funcionalidad de crear proveedores pendiente de implementar', 'info');
                break;
            case 'projects':
                // Projects modal exists, show it
                const projectModal = new bootstrap.Modal(document.getElementById('projectModal'));
                document.getElementById('projectModalTitle').textContent = 'Nueva Obra';
                document.getElementById('projectForm').reset();
                document.getElementById('projectId').value = '';
                projectModal.show();
                break;
            case 'files':
                this.showNotification('Funcionalidad de subir archivos pendiente de implementar', 'info');
                break;
            case 'users':
                this.showNotification('Funcionalidad de crear usuarios pendiente de implementar', 'info');
                break;
            default:
                this.showNotification(`Funcionalidad de crear ${type} no disponible`, 'warning');
        }
    }

    editItem(type, id) {
        switch (type) {
            case 'projects':
                editProject(id);
                break;
            case 'activities':
                editActivity(id);
                break;
            case 'clients':
                editClient(id);
                break;
            case 'suppliers':
                editSupplier(id);
                break;
            case 'users':
                editUser(id);
                break;
            default:
                console.log(`Edit ${type} with id ${id} - not implemented`);
        }
    }

    async deleteItem(type, id) {
        if (!confirm('¿Estás seguro de que quieres eliminar este elemento?')) {
            return;
        }

        try {
            const response = await fetch(`/api/${type}/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.showNotification('Elemento eliminado correctamente', 'success');
                this.loadSectionContent(this.currentSection);
            } else {
                const data = await response.json();
                this.showNotification(data.error || 'Error al eliminar', 'danger');
            }
        } catch (error) {
            console.error('Delete error:', error);
            this.showNotification('Error de conexión', 'danger');
        }
    }

    async downloadFile(fileId) {
        try {
            const response = await fetch(`/api/files/${fileId}/download`);
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = ''; // Browser will use filename from Content-Disposition header
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                this.showNotification('Error al descargar el archivo', 'danger');
            }
        } catch (error) {
            console.error('Download error:', error);
            this.showNotification('Error de conexión', 'danger');
        }
    }

    showProfile() {
        this.showSection('profile');
        this.loadProfileData();
    }

    async loadProfileData() {
        if (this.currentUser) {
            document.getElementById('profileFirstName').textContent = this.currentUser.firstName || '-';
            document.getElementById('profileLastName').textContent = this.currentUser.lastName || '-';
            document.getElementById('profileUsername').textContent = this.currentUser.username || '-';
            document.getElementById('profileEmail').textContent = this.currentUser.email || '-';
            document.getElementById('profilePhone').textContent = this.currentUser.phone || '-';
            document.getElementById('profileRole').textContent = this.getRoleDisplayName(this.currentUser.role) || '-';
            document.getElementById('profileDisplayName').textContent = `${this.currentUser.firstName} ${this.currentUser.lastName}`;
            document.getElementById('profileRoleDisplay').textContent = this.getRoleDisplayName(this.currentUser.role);
            
            if (this.currentUser.created_at) {
                const date = new Date(this.currentUser.created_at);
                document.getElementById('profileCreatedAt').textContent = date.toLocaleDateString('es-ES');
            }
        }
    }

    getRoleDisplayName(role) {
        const roles = {
            'admin': 'Administrador',
            'manager': 'Gerente',
            'supervisor': 'Supervisor',
            'worker': 'Trabajador'
        };
        return roles[role] || role;
    }

    // Utility methods
    showLoading(show) {
        const spinner = document.getElementById('loadingSpinner');
        if (show) {
            spinner.classList.remove('d-none');
        } else {
            spinner.classList.add('d-none');
        }
    }

    showError(element, message) {
        element.textContent = message;
        element.classList.remove('d-none');
    }

    hideError(element) {
        element.classList.add('d-none');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        notification.style.cssText = 'top: 100px; right: 20px; z-index: 9999; min-width: 300px;';
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }

    // Utility function to reset forms
    resetForm(formId, titleId, titleText, defaultValues = {}) {
        const form = document.getElementById(formId);
        const title = document.getElementById(titleId);

        if (form) {
            form.reset();
        }

        if (title) {
            title.textContent = titleText;
        }

        // Set default values
        Object.keys(defaultValues).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = defaultValues[key];
                } else {
                    element.value = defaultValues[key];
                }
            }
        });
    }

    // Utility function to format currency in Chilean Pesos
    formatCurrency(amount) {
        if (amount === null || amount === undefined || amount === '') {
            return '$0';
        }
        
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount)) {
            return '$0';
        }
        
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(numAmount);
    }

    // Utility function to parse currency input (remove formatting)
    parseCurrency(value) {
        if (!value) return '';
        return value.replace(/[^\d]/g, '');
    }

    // Quick action functions to open modals directly
    openNewProjectModal() {
        // Reset form for new project
        document.getElementById('projectForm').reset();
        document.getElementById('projectId').value = '';
        document.getElementById('projectModalTitle').textContent = 'Nueva Obra';
        
        // Set default values
        document.getElementById('projectStatus').value = 'planning';
        
        // Open modal
        const modal = new bootstrap.Modal(document.getElementById('projectModal'));
        modal.show();
    }

    openNewActivityModal() {
        // Reset form for new activity
        document.getElementById('activityForm').reset();
        document.getElementById('activityId').value = '';
        document.getElementById('activityModalTitle').textContent = 'Nueva Actividad';
        
        // Set default values
        document.getElementById('activityPriority').value = 'medium';
        
        // Populate project dropdown
        const projectSelect = document.getElementById('activityProject');
        if (projectSelect && window.activitiesProjects) {
            projectSelect.innerHTML = '<option value="">Seleccionar proyecto...</option>';
            window.activitiesProjects.forEach(project => {
                const option = document.createElement('option');
                option.value = project.id;
                option.textContent = project.name;
                projectSelect.appendChild(option);
            });
        }
        
        // Populate user dropdown
        if (window.populateUserDropdown) {
            window.populateUserDropdown();
        }
        
        // Open modal
        const modal = new bootstrap.Modal(document.getElementById('activityModal'));
        modal.show();
    }

    openNewClientModal() {
        // Reset form for new client
        document.getElementById('clientForm').reset();
        document.getElementById('clientId').value = '';
        document.getElementById('clientModalTitle').textContent = 'Nuevo Cliente';
        
        // Open modal
        const modal = new bootstrap.Modal(document.getElementById('clientModal'));
        modal.show();
    }

    openNewFileModal() {
        // Reset form for new file upload
        document.getElementById('fileUploadForm').reset();
        
        // Open modal
        const modal = new bootstrap.Modal(document.getElementById('fileUploadModal'));
        modal.show();
    }
}

// Global functions for edit modals
function editProfile() {
    const modal = new bootstrap.Modal(document.getElementById('editProfileModal'));
    
    // Populate form with current user data
    document.getElementById('editFirstName').value = app.currentUser.firstName || '';
    document.getElementById('editLastName').value = app.currentUser.lastName || '';
    document.getElementById('editEmail').value = app.currentUser.email || '';
    document.getElementById('editPhone').value = app.currentUser.phone || '';
    
    modal.show();
}

function editProject(projectId) {
    const modal = new bootstrap.Modal(document.getElementById('editProjectModal'));
    
    // Load clients for dropdown and project data
    Promise.all([
        fetch('/api/clients'),
        fetch(`/api/projects/${projectId}`)
    ])
    .then(responses => Promise.all(responses.map(r => r.json())))
    .then(([clientsData, projectData]) => {
        // Populate clients dropdown
        const clientSelect = document.getElementById('editProjectClient');
        clientSelect.innerHTML = '<option value="">Seleccionar cliente</option>';
        if (clientsData.clients) {
            clientsData.clients.forEach(client => {
                const option = document.createElement('option');
                option.value = client.id;
                option.textContent = client.name;
                clientSelect.appendChild(option);
            });
        }
        
        // Populate project data
        if (projectData.project) {
            const project = projectData.project;
            document.getElementById('editProjectId').value = project.id;
            document.getElementById('editProjectName').value = project.name || '';
            document.getElementById('editProjectDescription').value = project.description || '';
            document.getElementById('editProjectStartDate').value = project.start_date ? project.start_date.split('T')[0] : '';
            document.getElementById('editProjectEndDate').value = project.end_date ? project.end_date.split('T')[0] : '';
            document.getElementById('editProjectBudget').value = project.estimated_budget || '';
            document.getElementById('editProjectStatus').value = project.status || '';
            document.getElementById('editProjectClient').value = project.client_id || '';
            
            modal.show();
        }
    })
    .catch(error => {
        console.error('Error loading project data:', error);
        app.showNotification('Error al cargar los datos del proyecto', 'danger');
    });
}

function editActivity(activityId) {
    const modal = new bootstrap.Modal(document.getElementById('editActivityModal'));
    
    // Load projects, users, and activity data
    Promise.all([
        fetch('/api/projects'),
        fetch('/api/users'),
        fetch(`/api/activities/${activityId}`)
    ])
    .then(responses => Promise.all(responses.map(r => r.json())))
    .then(([projectsData, usersData, activityData]) => {
        // Populate projects dropdown
        const projectSelect = document.getElementById('editActivityProject');
        projectSelect.innerHTML = '<option value="">Seleccionar proyecto</option>';
        if (projectsData.projects) {
            projectsData.projects.forEach(project => {
                const option = document.createElement('option');
                option.value = project.id;
                option.textContent = project.name;
                projectSelect.appendChild(option);
            });
        }
        
        // Populate assigned users dropdown
        const assignedSelect = document.getElementById('editActivityAssigned');
        assignedSelect.innerHTML = '<option value="">Sin asignar</option>';
        if (usersData.users) {
            usersData.users.forEach(user => {
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = `${user.first_name} ${user.last_name}`;
                assignedSelect.appendChild(option);
            });
        }
        
        // Populate activity data
        if (activityData.activity) {
            const activity = activityData.activity;
            document.getElementById('editActivityId').value = activity.id;
            document.getElementById('editActivityTitle').value = activity.name || activity.title || '';
            document.getElementById('editActivityDescription').value = activity.description || '';
            document.getElementById('editActivityProject').value = activity.project_id || '';
            document.getElementById('editActivityAssigned').value = activity.assigned_to || '';
            document.getElementById('editActivityStatus').value = activity.status || '';
            document.getElementById('editActivityPriority').value = activity.priority || '';
            document.getElementById('editActivityDueDate').value = activity.due_date || activity.end_date ? (activity.due_date || activity.end_date).split('T')[0] : '';
            
            modal.show();
        }
    })
    .catch(error => {
        console.error('Error loading activity data:', error);
        app.showNotification('Error al cargar los datos de la actividad', 'danger');
    });
}

function editClient(clientId) {
    const modal = new bootstrap.Modal(document.getElementById('editClientModal'));
    
    // Load client data and populate form
    fetch(`/api/clients/${clientId}`)
        .then(response => response.json())
        .then(data => {
            if (data.client) {
                const client = data.client;
                document.getElementById('editClientId').value = client.id;
                document.getElementById('editClientName').value = client.name || '';
                document.getElementById('editClientCompany').value = client.company || '';
                document.getElementById('editClientEmail').value = client.email || '';
                document.getElementById('editClientPhone').value = client.phone || '';
                document.getElementById('editClientAddress').value = client.address || '';
                document.getElementById('editClientCity').value = client.city || '';
                document.getElementById('editClientState').value = client.state || '';
                document.getElementById('editClientPostalCode').value = client.postal_code || '';
                
                modal.show();
            }
        })
        .catch(error => {
            console.error('Error loading client:', error);
            app.showNotification('Error al cargar los datos del cliente', 'danger');
        });
}

function editSupplier(supplierId) {
    const modal = new bootstrap.Modal(document.getElementById('editSupplierModal'));
    
    // Load supplier data and populate form
    fetch(`/api/suppliers/${supplierId}`)
        .then(response => response.json())
        .then(data => {
            if (data.supplier) {
                const supplier = data.supplier;
                document.getElementById('editSupplierId').value = supplier.id;
                document.getElementById('editSupplierName').value = supplier.name || '';
                document.getElementById('editSupplierCompany').value = supplier.company || '';
                document.getElementById('editSupplierEmail').value = supplier.email || '';
                document.getElementById('editSupplierPhone').value = supplier.phone || '';
                document.getElementById('editSupplierType').value = supplier.supplier_type || '';
                document.getElementById('editSupplierPaymentTerms').value = supplier.payment_terms || '';
                
                modal.show();
            }
        })
        .catch(error => {
            console.error('Error loading supplier:', error);
            app.showNotification('Error al cargar los datos del proveedor', 'danger');
        });
}

function editUser(userId) {
    const modal = new bootstrap.Modal(document.getElementById('editUserModal'));
    
    // Load user data and populate form
    fetch(`/api/users/${userId}`)
        .then(response => response.json())
        .then(data => {
            if (data.user) {
                const user = data.user;
                document.getElementById('editUserId').value = user.id;
                document.getElementById('editUserFirstName').value = user.first_name || '';
                document.getElementById('editUserLastName').value = user.last_name || '';
                document.getElementById('editUserUsername').value = user.username || '';
                document.getElementById('editUserEmail').value = user.email || '';
                document.getElementById('editUserPhone').value = user.phone || '';
                document.getElementById('editUserRole').value = user.role || '';
                
                modal.show();
            }
        })
        .catch(error => {
            console.error('Error loading user:', error);
            app.showNotification('Error al cargar los datos del usuario', 'danger');
        });
}

// Initialize the application
const app = new ConstructionApp();

// Add form submission handlers
document.getElementById('editProfileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        firstName: document.getElementById('editFirstName').value,
        lastName: document.getElementById('editLastName').value,
        email: document.getElementById('editEmail').value,
        phone: document.getElementById('editPhone').value
    };
    
    const password = document.getElementById('editPassword').value;
    if (password) {
        formData.password = password;
    }
    
    try {
        const response = await fetch('/api/auth/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            app.showNotification('Perfil actualizado correctamente', 'success');
            bootstrap.Modal.getInstance(document.getElementById('editProfileModal')).hide();
            // Refresh profile data
            app.loadProfileData();
        } else {
            const error = await response.json();
            app.showNotification(error.error || 'Error al actualizar perfil', 'danger');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        app.showNotification('Error de conexión', 'danger');
    }
});

const editProjectForm = document.getElementById('editProjectForm');
if (editProjectForm) {
    editProjectForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const projectId = document.getElementById('editProjectId').value;
    const formData = {
        name: document.getElementById('editProjectName').value,
        description: document.getElementById('editProjectDescription').value,
        clientId: document.getElementById('editProjectClient').value || null,
        startDate: document.getElementById('editProjectStartDate').value,
        endDate: document.getElementById('editProjectEndDate').value,
        estimatedBudget: document.getElementById('editProjectBudget').value,
        status: document.getElementById('editProjectStatus').value
    };
    
    try {
        const response = await fetch(`/api/projects/${projectId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            app.showNotification('Proyecto actualizado correctamente', 'success');
            bootstrap.Modal.getInstance(document.getElementById('editProjectModal')).hide();
            app.loadProjects();
        } else {
            const error = await response.json();
            app.showNotification(error.error || 'Error al actualizar proyecto', 'danger');
        }
    } catch (error) {
        console.error('Error updating project:', error);
        app.showNotification('Error de conexión', 'danger');
    }
    });
}

document.getElementById('editActivityForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const activityId = document.getElementById('editActivityId').value;
    const formData = {
        name: document.getElementById('editActivityTitle').value,
        description: document.getElementById('editActivityDescription').value,
        projectId: document.getElementById('editActivityProject').value || null,
        assignedTo: document.getElementById('editActivityAssigned').value || null,
        status: document.getElementById('editActivityStatus').value,
        priority: document.getElementById('editActivityPriority').value,
        endDate: document.getElementById('editActivityDueDate').value
    };
    
    try {
        const response = await fetch(`/api/activities/${activityId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            app.showNotification('Actividad actualizada correctamente', 'success');
            bootstrap.Modal.getInstance(document.getElementById('editActivityModal')).hide();
            app.loadActivities();
        } else {
            const error = await response.json();
            app.showNotification(error.error || 'Error al actualizar actividad', 'danger');
        }
    } catch (error) {
        console.error('Error updating activity:', error);
        app.showNotification('Error de conexión', 'danger');
    }
});

document.getElementById('editClientForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const clientId = document.getElementById('editClientId').value;
    const formData = {
        name: document.getElementById('editClientName').value,
        company: document.getElementById('editClientCompany').value,
        email: document.getElementById('editClientEmail').value,
        phone: document.getElementById('editClientPhone').value,
        address: document.getElementById('editClientAddress').value,
        city: document.getElementById('editClientCity').value,
        state: document.getElementById('editClientState').value,
        postalCode: document.getElementById('editClientPostalCode').value
    };
    
    try {
        const response = await fetch(`/api/clients/${clientId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            app.showNotification('Cliente actualizado correctamente', 'success');
            bootstrap.Modal.getInstance(document.getElementById('editClientModal')).hide();
            app.loadClients();
        } else {
            const error = await response.json();
            app.showNotification(error.error || 'Error al actualizar cliente', 'danger');
        }
    } catch (error) {
        console.error('Error updating client:', error);
        app.showNotification('Error de conexión', 'danger');
    }
});

document.getElementById('editSupplierForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const supplierId = document.getElementById('editSupplierId').value;
    const formData = {
        name: document.getElementById('editSupplierName').value,
        company: document.getElementById('editSupplierCompany').value,
        email: document.getElementById('editSupplierEmail').value,
        phone: document.getElementById('editSupplierPhone').value,
        supplierType: document.getElementById('editSupplierType').value,
        paymentTerms: document.getElementById('editSupplierPaymentTerms').value
    };
    
    try {
        const response = await fetch(`/api/suppliers/${supplierId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            app.showNotification('Proveedor actualizado correctamente', 'success');
            bootstrap.Modal.getInstance(document.getElementById('editSupplierModal')).hide();
            app.loadSuppliers();
        } else {
            const error = await response.json();
            app.showNotification(error.error || 'Error al actualizar proveedor', 'danger');
        }
    } catch (error) {
        console.error('Error updating supplier:', error);
        app.showNotification('Error de conexión', 'danger');
    }
});

document.getElementById('editUserForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const userId = document.getElementById('editUserId').value;
    const formData = {
        firstName: document.getElementById('editUserFirstName').value,
        lastName: document.getElementById('editUserLastName').value,
        username: document.getElementById('editUserUsername').value,
        email: document.getElementById('editUserEmail').value,
        phone: document.getElementById('editUserPhone').value,
        role: document.getElementById('editUserRole').value
    };
    
    const password = document.getElementById('editUserPassword').value;
    if (password) {
        formData.password = password;
    }
    
    try {
        const response = await fetch(`/api/users/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            app.showNotification('Usuario actualizado correctamente', 'success');
            bootstrap.Modal.getInstance(document.getElementById('editUserModal')).hide();
            app.loadUsers();
        } else {
            const error = await response.json();
            app.showNotification(error.error || 'Error al actualizar usuario', 'danger');
        }
    } catch (error) {
        console.error('Error updating user:', error);
        app.showNotification('Error de conexión', 'danger');
    }
});

// Export quick action functions globally
window.openNewProjectModal = () => app.openNewProjectModal();
window.openNewActivityModal = () => app.openNewActivityModal();
window.openNewClientModal = () => app.openNewClientModal();
window.openNewFileModal = () => app.openNewFileModal();
