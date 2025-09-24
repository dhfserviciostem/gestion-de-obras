// Users functionality
let currentUsers = [];

async function loadUsers() {
    try {
        const response = await fetch('/api/users');
        if (!response.ok) {
            throw new Error('Error al cargar datos de usuarios');
        }

        const data = await response.json();
        currentUsers = data.users || [];

        // Render users table
        renderUsersTable();

    } catch (error) {
        console.error('Load users error:', error);
        app.showNotification('Error cargando usuarios', 'danger');
    }
}

function renderUsersTable() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    if (currentUsers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted py-4">
                    <i class="bi bi-person-check fs-1 d-block mb-2"></i>
                    No hay usuarios registrados
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = currentUsers.map(user => `
        <tr>
            <td>
                <div>
                    <h6 class="mb-1">${user.first_name} ${user.last_name}</h6>
                    <small class="text-muted">@${user.username}</small>
                </div>
            </td>
            <td>${user.email}</td>
            <td>
                <span class="badge ${getRoleBadgeClass(user.role)}">
                    ${getRoleText(user.role)}
                </span>
            </td>
            <td>${user.phone || 'No especificado'}</td>
            <td>
                <span class="badge ${user.is_active ? 'bg-success' : 'bg-danger'}">
                    ${user.is_active ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>
                <div class="btn-group" role="group">
                    <button class="btn btn-sm btn-outline-info" onclick="viewUser(${user.id})" title="Ver detalles">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-primary" onclick="editUser(${user.id})" title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    ${user.id !== app.currentUser?.id ? `
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteUser(${user.id})" title="Eliminar">
                            <i class="bi bi-trash"></i>
                        </button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `).join('');
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

function getRoleBadgeClass(role) {
    const classMap = {
        'admin': 'bg-danger',
        'manager': 'bg-warning',
        'supervisor': 'bg-info',
        'worker': 'bg-secondary'
    };
    return classMap[role] || 'bg-secondary';
}

async function saveUser() {
    const userData = {
        username: document.getElementById('userUsername').value,
        email: document.getElementById('userEmail').value,
        password: document.getElementById('userPassword').value,
        firstName: document.getElementById('userFirstName').value,
        lastName: document.getElementById('userLastName').value,
        role: document.getElementById('userRole').value,
        phone: document.getElementById('userPhone').value || null,
        isActive: document.getElementById('userIsActive').checked
    };

    const userId = document.getElementById('userId').value;
    const isEdit = userId !== '';

    if (!userData.username || !userData.email || !userData.firstName || !userData.lastName) {
        app.showNotification('Los campos marcados con * son requeridos', 'danger');
        return;
    }

    if (!isEdit && !userData.password) {
        app.showNotification('La contraseña es requerida para nuevos usuarios', 'danger');
        return;
    }

    try {
        app.showLoading(true);
        
        const response = await fetch(`/api/users${isEdit ? `/${userId}` : ''}`, {
            method: isEdit ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        const result = await response.json();

        if (response.ok) {
            app.showNotification(
                isEdit ? 'Usuario actualizado correctamente' : 'Usuario creado correctamente', 
                'success'
            );
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('userModal'));
            modal.hide();
            
            // Reload users
            await loadUsers();
        } else {
            app.showNotification(result.error || 'Error al guardar el usuario', 'danger');
        }
    } catch (error) {
        console.error('Save user error:', error);
        app.showNotification('Error de conexión', 'danger');
    } finally {
        app.showLoading(false);
    }
}

function editUser(userId) {
    const user = currentUsers.find(u => u.id === userId);
    if (!user) return;

    // Populate form with user data
    document.getElementById('userId').value = user.id;
    document.getElementById('userUsername').value = user.username || '';
    document.getElementById('userEmail').value = user.email || '';
    document.getElementById('userPassword').value = ''; // Don't populate password
    document.getElementById('userFirstName').value = user.first_name || '';
    document.getElementById('userLastName').value = user.last_name || '';
    document.getElementById('userRole').value = user.role || 'worker';
    document.getElementById('userPhone').value = user.phone || '';
    document.getElementById('userIsActive').checked = user.is_active;

    // Update modal title
    document.getElementById('userModalTitle').textContent = 'Editar Usuario';

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('userModal'));
    modal.show();
}

async function deleteUser(userId) {
    const user = currentUsers.find(u => u.id === userId);
    if (!user) return;

    const confirmMessage = `¿Estás seguro de que quieres eliminar el usuario "${user.first_name} ${user.last_name}"?\n\nEsta acción no se puede deshacer.`;
    
    if (!confirm(confirmMessage)) return;

    try {
        app.showLoading(true);
        
        const response = await fetch(`/api/users/${userId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            app.showNotification('Usuario eliminado correctamente', 'success');
            await loadUsers();
        } else {
            const result = await response.json();
            app.showNotification(result.error || 'Error al eliminar el usuario', 'danger');
        }
    } catch (error) {
        console.error('Delete user error:', error);
        app.showNotification('Error de conexión', 'danger');
    } finally {
        app.showLoading(false);
    }
}

async function viewUser(userId) {
    try {
        const response = await fetch(`/api/users/${userId}`);
        if (!response.ok) throw new Error('Error al cargar detalles del usuario');
        
        const data = await response.json();
        showUserDetailsModal(data.user);
    } catch (error) {
        console.error('View user error:', error);
        app.showNotification('Error cargando detalles del usuario', 'danger');
    }
}

function showUserDetailsModal(user) {
    // Create modal HTML
    const modalHtml = `
        <div class="modal fade" id="userDetailsModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">
                            <i class="bi bi-person-check"></i> ${user.first_name} ${user.last_name}
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6><i class="bi bi-info-circle"></i> Información Personal</h6>
                                <p><strong>Nombre:</strong> ${user.first_name} ${user.last_name}</p>
                                <p><strong>Usuario:</strong> @${user.username}</p>
                                <p><strong>Email:</strong> <a href="mailto:${user.email}">${user.email}</a></p>
                                ${user.phone ? `<p><strong>Teléfono:</strong> <a href="tel:${user.phone}">${user.phone}</a></p>` : ''}
                            </div>
                            <div class="col-md-6">
                                <h6><i class="bi bi-shield-check"></i> Información del Sistema</h6>
                                <p><strong>Rol:</strong> 
                                    <span class="badge ${getRoleBadgeClass(user.role)}">
                                        ${getRoleText(user.role)}
                                    </span>
                                </p>
                                <p><strong>Estado:</strong> 
                                    <span class="badge ${user.is_active ? 'bg-success' : 'bg-danger'}">
                                        ${user.is_active ? 'Activo' : 'Inactivo'}
                                    </span>
                                </p>
                                <p><strong>Fecha de Registro:</strong> ${new Date(user.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        <button type="button" class="btn btn-primary" onclick="editUser(${user.id}); bootstrap.Modal.getInstance(document.getElementById('userDetailsModal')).hide();">
                            <i class="bi bi-pencil"></i> Editar Usuario
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal if any
    const existingModal = document.getElementById('userDetailsModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Add modal to DOM and show
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('userDetailsModal'));
    modal.show();

    // Clean up modal after hiding
    document.getElementById('userDetailsModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

// Reset form when modal is shown for new user
document.addEventListener('DOMContentLoaded', function() {
    const userModal = document.getElementById('userModal');
    if (userModal) {
        userModal.addEventListener('show.bs.modal', function() {
            // Only reset if we're creating a new user (no userId set)
            if (!document.getElementById('userId').value) {
                document.getElementById('userForm').reset();
                document.getElementById('userId').value = '';
                document.getElementById('userModalTitle').textContent = 'Nuevo Usuario';
                // Set default values
                document.getElementById('userRole').value = 'worker';
                document.getElementById('userIsActive').checked = true;
            }
        });
        
        // Clear the userId when modal is hidden to ensure next open is for new user
        userModal.addEventListener('hidden.bs.modal', function() {
            document.getElementById('userId').value = '';
        });
    }
});

// Export functions for global access
window.loadUsers = loadUsers;
window.saveUser = saveUser;
window.editUser = editUser;
window.deleteUser = deleteUser;
window.viewUser = viewUser;
