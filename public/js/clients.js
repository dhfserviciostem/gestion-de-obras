// Clients functionality
let clientsData = [];

async function loadClients() {
    try {
        const response = await fetch('/api/clients');
        if (!response.ok) {
            throw new Error('Error al cargar datos de clientes');
        }

        const data = await response.json();
        clientsData = data.clients || [];

        // Render clients table
        renderClientsTable();

    } catch (error) {
        console.error('Load clients error:', error);
        app.showNotification('Error cargando clientes', 'danger');
    }
}

function renderClientsTable() {
    const tbody = document.getElementById('clientsTableBody');
    if (!tbody) return;

    if (clientsData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted py-4">
                    <i class="bi bi-people fs-1 d-block mb-2"></i>
                    No hay clientes registrados
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = clientsData.map(client => `
        <tr>
            <td>
                <div>
                    <h6 class="mb-1">${client.name}</h6>
                    ${client.company ? `<small class="text-muted">${client.company}</small>` : ''}
                </div>
            </td>
            <td>${client.email || 'No especificado'}</td>
            <td>${client.phone || 'No especificado'}</td>
            <td>${client.city || 'No especificado'}</td>
            <td>${client.contact_person || 'No especificado'}</td>
            <td>
                <div class="btn-group" role="group">
                    <button class="btn btn-sm btn-outline-info" onclick="viewClient(${client.id})" title="Ver detalles">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-primary" onclick="editClient(${client.id})" title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteClient(${client.id})" title="Eliminar">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function saveClient() {
    const clientData = {
        name: document.getElementById('clientName').value,
        company: document.getElementById('clientCompany').value || null,
        email: document.getElementById('clientEmail').value || null,
        phone: document.getElementById('clientPhone').value || null,
        address: document.getElementById('clientAddress').value || null,
        city: document.getElementById('clientCity').value || null,
        state: document.getElementById('clientState').value || null,
        postalCode: document.getElementById('clientPostalCode').value || null,
        country: document.getElementById('clientCountry').value || 'España',
        contactPerson: document.getElementById('clientContactPerson').value || null,
        notes: document.getElementById('clientNotes').value || null
    };

    const clientId = document.getElementById('clientId').value;
    const isEdit = clientId !== '';

    if (!clientData.name) {
        app.showNotification('El nombre del cliente es requerido', 'danger');
        return;
    }

    try {
        app.showLoading(true);
        
        const response = await fetch(`/api/clients${isEdit ? `/${clientId}` : ''}`, {
            method: isEdit ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(clientData)
        });

        const result = await response.json();

        if (response.ok) {
            app.showNotification(
                isEdit ? 'Cliente actualizado correctamente' : 'Cliente creado correctamente', 
                'success'
            );
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('clientModal'));
            modal.hide();
            
            // Reload clients
            await loadClients();
        } else {
            app.showNotification(result.error || 'Error al guardar el cliente', 'danger');
        }
    } catch (error) {
        console.error('Save client error:', error);
        app.showNotification('Error de conexión', 'danger');
    } finally {
        app.showLoading(false);
    }
}

function editClient(clientId) {
    const client = clientsData.find(c => c.id === clientId);
    if (!client) return;

    // Populate form with client data
    document.getElementById('clientId').value = client.id;
    document.getElementById('clientName').value = client.name || '';
    document.getElementById('clientCompany').value = client.company || '';
    document.getElementById('clientEmail').value = client.email || '';
    document.getElementById('clientPhone').value = client.phone || '';
    document.getElementById('clientAddress').value = client.address || '';
    document.getElementById('clientCity').value = client.city || '';
    document.getElementById('clientState').value = client.state || '';
    document.getElementById('clientPostalCode').value = client.postal_code || '';
    document.getElementById('clientCountry').value = client.country || 'España';
    document.getElementById('clientContactPerson').value = client.contact_person || '';
    document.getElementById('clientNotes').value = client.notes || '';

    // Update modal title
    document.getElementById('clientModalTitle').textContent = 'Editar Cliente';

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('clientModal'));
    modal.show();
}

async function deleteClient(clientId) {
    const client = clientsData.find(c => c.id === clientId);
    if (!client) return;

    const confirmMessage = `¿Estás seguro de que quieres eliminar el cliente "${client.name}"?\n\nEsta acción no se puede deshacer.`;
    
    if (!confirm(confirmMessage)) return;

    try {
        app.showLoading(true);
        
        const response = await fetch(`/api/clients/${clientId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            app.showNotification('Cliente eliminado correctamente', 'success');
            await loadClients();
        } else {
            const result = await response.json();
            app.showNotification(result.error || 'Error al eliminar el cliente', 'danger');
        }
    } catch (error) {
        console.error('Delete client error:', error);
        app.showNotification('Error de conexión', 'danger');
    } finally {
        app.showLoading(false);
    }
}

async function viewClient(clientId) {
    try {
        const response = await fetch(`/api/clients/${clientId}`);
        if (!response.ok) throw new Error('Error al cargar detalles del cliente');
        
        const data = await response.json();
        showClientDetailsModal(data.client);
    } catch (error) {
        console.error('View client error:', error);
        app.showNotification('Error cargando detalles del cliente', 'danger');
    }
}

function showClientDetailsModal(client) {
    // Create modal HTML
    const modalHtml = `
        <div class="modal fade" id="clientDetailsModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">
                            <i class="bi bi-people"></i> ${client.name}
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6><i class="bi bi-info-circle"></i> Información de Contacto</h6>
                                <p><strong>Nombre:</strong> ${client.name}</p>
                                ${client.company ? `<p><strong>Empresa:</strong> ${client.company}</p>` : ''}
                                ${client.email ? `<p><strong>Email:</strong> <a href="mailto:${client.email}">${client.email}</a></p>` : ''}
                                ${client.phone ? `<p><strong>Teléfono:</strong> <a href="tel:${client.phone}">${client.phone}</a></p>` : ''}
                                ${client.contact_person ? `<p><strong>Persona de Contacto:</strong> ${client.contact_person}</p>` : ''}
                            </div>
                            <div class="col-md-6">
                                <h6><i class="bi bi-geo-alt"></i> Dirección</h6>
                                ${client.address ? `<p><strong>Dirección:</strong> ${client.address}</p>` : ''}
                                ${client.city ? `<p><strong>Ciudad:</strong> ${client.city}</p>` : ''}
                                ${client.state ? `<p><strong>Provincia:</strong> ${client.state}</p>` : ''}
                                ${client.postal_code ? `<p><strong>Código Postal:</strong> ${client.postal_code}</p>` : ''}
                                ${client.country ? `<p><strong>País:</strong> ${client.country}</p>` : ''}
                            </div>
                        </div>
                        ${client.notes ? `<p><strong>Notas:</strong><br>${client.notes}</p>` : ''}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        <button type="button" class="btn btn-primary" onclick="editClient(${client.id}); bootstrap.Modal.getInstance(document.getElementById('clientDetailsModal')).hide();">
                            <i class="bi bi-pencil"></i> Editar Cliente
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal if any
    const existingModal = document.getElementById('clientDetailsModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Add modal to DOM and show
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('clientDetailsModal'));
    modal.show();

    // Clean up modal after hiding
    document.getElementById('clientDetailsModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

// Reset form when modal is shown for new client
document.addEventListener('DOMContentLoaded', function() {
    const clientModal = document.getElementById('clientModal');
    if (clientModal) {
        clientModal.addEventListener('show.bs.modal', function() {
            // Only reset if we're creating a new client (no clientId set)
            if (!document.getElementById('clientId').value) {
                document.getElementById('clientForm').reset();
                document.getElementById('clientId').value = '';
                document.getElementById('clientModalTitle').textContent = 'Nuevo Cliente';
                // Set default values
                document.getElementById('clientCountry').value = 'España';
            }
        });
        
        // Clear the clientId when modal is hidden to ensure next open is for new client
        clientModal.addEventListener('hidden.bs.modal', function() {
            document.getElementById('clientId').value = '';
        });
    }
});

// Export functions for global access
window.loadClients = loadClients;
window.saveClient = saveClient;
window.editClient = editClient;
window.deleteClient = deleteClient;
window.viewClient = viewClient;
