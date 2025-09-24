// Suppliers functionality
let currentSuppliers = [];

async function loadSuppliers() {
    try {
        const response = await fetch('/api/suppliers');
        if (!response.ok) {
            throw new Error('Error al cargar datos de proveedores');
        }

        const data = await response.json();
        currentSuppliers = data.suppliers || [];

        // Render suppliers table
        renderSuppliersTable();

    } catch (error) {
        console.error('Load suppliers error:', error);
        app.showNotification('Error cargando proveedores', 'danger');
    }
}

function renderSuppliersTable() {
    const tbody = document.getElementById('suppliersTableBody');
    if (!tbody) return;

    if (currentSuppliers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted py-4">
                    <i class="bi bi-truck fs-1 d-block mb-2"></i>
                    No hay proveedores registrados
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = currentSuppliers.map(supplier => `
        <tr>
            <td>
                <div>
                    <h6 class="mb-1">${supplier.name}</h6>
                    ${supplier.company ? `<small class="text-muted">${supplier.company}</small>` : ''}
                </div>
            </td>
            <td>
                <span class="badge bg-secondary">
                    ${getSupplierTypeText(supplier.supplier_type)}
                </span>
            </td>
            <td>${supplier.email || 'No especificado'}</td>
            <td>${supplier.phone || 'No especificado'}</td>
            <td>${supplier.city || 'No especificado'}</td>
            <td>${supplier.contact_person || 'No especificado'}</td>
            <td>
                <div class="btn-group" role="group">
                    <button class="btn btn-sm btn-outline-info" onclick="viewSupplier(${supplier.id})" title="Ver detalles">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-primary" onclick="editSupplier(${supplier.id})" title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteSupplier(${supplier.id})" title="Eliminar">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function getSupplierTypeText(type) {
    const typeMap = {
        'materials': 'Materiales',
        'equipment': 'Equipos',
        'services': 'Servicios',
        'labor': 'Mano de Obra',
        'other': 'Otros'
    };
    return typeMap[type] || type;
}

async function saveSupplier() {
    const supplierData = {
        name: document.getElementById('supplierName').value,
        company: document.getElementById('supplierCompany').value || null,
        email: document.getElementById('supplierEmail').value || null,
        phone: document.getElementById('supplierPhone').value || null,
        address: document.getElementById('supplierAddress').value || null,
        city: document.getElementById('supplierCity').value || null,
        state: document.getElementById('supplierState').value || null,
        postalCode: document.getElementById('supplierPostalCode').value || null,
        country: document.getElementById('supplierCountry').value || 'España',
        contactPerson: document.getElementById('supplierContactPerson').value || null,
        supplierType: document.getElementById('supplierType').value,
        taxId: document.getElementById('supplierTaxId').value || null,
        paymentTerms: document.getElementById('supplierPaymentTerms').value || null,
        notes: document.getElementById('supplierNotes').value || null
    };

    const supplierId = document.getElementById('supplierId').value;
    const isEdit = supplierId !== '';

    if (!supplierData.name) {
        app.showNotification('El nombre del proveedor es requerido', 'danger');
        return;
    }

    try {
        app.showLoading(true);
        
        const response = await fetch(`/api/suppliers${isEdit ? `/${supplierId}` : ''}`, {
            method: isEdit ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(supplierData)
        });

        const result = await response.json();

        if (response.ok) {
            app.showNotification(
                isEdit ? 'Proveedor actualizado correctamente' : 'Proveedor creado correctamente', 
                'success'
            );
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('supplierModal'));
            modal.hide();
            
            // Reload suppliers
            await loadSuppliers();
        } else {
            app.showNotification(result.error || 'Error al guardar el proveedor', 'danger');
        }
    } catch (error) {
        console.error('Save supplier error:', error);
        app.showNotification('Error de conexión', 'danger');
    } finally {
        app.showLoading(false);
    }
}

function editSupplier(supplierId) {
    const supplier = currentSuppliers.find(s => s.id === supplierId);
    if (!supplier) return;

    // Populate form with supplier data
    document.getElementById('supplierId').value = supplier.id;
    document.getElementById('supplierName').value = supplier.name || '';
    document.getElementById('supplierCompany').value = supplier.company || '';
    document.getElementById('supplierEmail').value = supplier.email || '';
    document.getElementById('supplierPhone').value = supplier.phone || '';
    document.getElementById('supplierAddress').value = supplier.address || '';
    document.getElementById('supplierCity').value = supplier.city || '';
    document.getElementById('supplierState').value = supplier.state || '';
    document.getElementById('supplierPostalCode').value = supplier.postal_code || '';
    document.getElementById('supplierCountry').value = supplier.country || 'España';
    document.getElementById('supplierContactPerson').value = supplier.contact_person || '';
    document.getElementById('supplierType').value = supplier.supplier_type || 'materials';
    document.getElementById('supplierTaxId').value = supplier.tax_id || '';
    document.getElementById('supplierPaymentTerms').value = supplier.payment_terms || '';
    document.getElementById('supplierNotes').value = supplier.notes || '';

    // Update modal title
    document.getElementById('supplierModalTitle').textContent = 'Editar Proveedor';

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('supplierModal'));
    modal.show();
}

async function deleteSupplier(supplierId) {
    const supplier = currentSuppliers.find(s => s.id === supplierId);
    if (!supplier) return;

    const confirmMessage = `¿Estás seguro de que quieres eliminar el proveedor "${supplier.name}"?\n\nEsta acción no se puede deshacer.`;
    
    if (!confirm(confirmMessage)) return;

    try {
        app.showLoading(true);
        
        const response = await fetch(`/api/suppliers/${supplierId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            app.showNotification('Proveedor eliminado correctamente', 'success');
            await loadSuppliers();
        } else {
            const result = await response.json();
            app.showNotification(result.error || 'Error al eliminar el proveedor', 'danger');
        }
    } catch (error) {
        console.error('Delete supplier error:', error);
        app.showNotification('Error de conexión', 'danger');
    } finally {
        app.showLoading(false);
    }
}

async function viewSupplier(supplierId) {
    try {
        const response = await fetch(`/api/suppliers/${supplierId}`);
        if (!response.ok) throw new Error('Error al cargar detalles del proveedor');
        
        const data = await response.json();
        showSupplierDetailsModal(data.supplier);
    } catch (error) {
        console.error('View supplier error:', error);
        app.showNotification('Error cargando detalles del proveedor', 'danger');
    }
}

function showSupplierDetailsModal(supplier) {
    // Create modal HTML
    const modalHtml = `
        <div class="modal fade" id="supplierDetailsModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">
                            <i class="bi bi-truck"></i> ${supplier.name}
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6><i class="bi bi-info-circle"></i> Información de Contacto</h6>
                                <p><strong>Nombre:</strong> ${supplier.name}</p>
                                ${supplier.company ? `<p><strong>Empresa:</strong> ${supplier.company}</p>` : ''}
                                <p><strong>Tipo:</strong> 
                                    <span class="badge bg-secondary">${getSupplierTypeText(supplier.supplier_type)}</span>
                                </p>
                                ${supplier.email ? `<p><strong>Email:</strong> <a href="mailto:${supplier.email}">${supplier.email}</a></p>` : ''}
                                ${supplier.phone ? `<p><strong>Teléfono:</strong> <a href="tel:${supplier.phone}">${supplier.phone}</a></p>` : ''}
                                ${supplier.contact_person ? `<p><strong>Persona de Contacto:</strong> ${supplier.contact_person}</p>` : ''}
                            </div>
                            <div class="col-md-6">
                                <h6><i class="bi bi-geo-alt"></i> Dirección</h6>
                                ${supplier.address ? `<p><strong>Dirección:</strong> ${supplier.address}</p>` : ''}
                                ${supplier.city ? `<p><strong>Ciudad:</strong> ${supplier.city}</p>` : ''}
                                ${supplier.state ? `<p><strong>Provincia:</strong> ${supplier.state}</p>` : ''}
                                ${supplier.postal_code ? `<p><strong>Código Postal:</strong> ${supplier.postal_code}</p>` : ''}
                                ${supplier.country ? `<p><strong>País:</strong> ${supplier.country}</p>` : ''}
                            </div>
                        </div>
                        <div class="row mt-3">
                            <div class="col-md-6">
                                <h6><i class="bi bi-receipt"></i> Información Fiscal</h6>
                                ${supplier.tax_id ? `<p><strong>NIF/CIF:</strong> ${supplier.tax_id}</p>` : ''}
                                ${supplier.payment_terms ? `<p><strong>Términos de Pago:</strong> ${supplier.payment_terms}</p>` : ''}
                            </div>
                        </div>
                        ${supplier.notes ? `<p><strong>Notas:</strong><br>${supplier.notes}</p>` : ''}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        <button type="button" class="btn btn-primary" onclick="editSupplier(${supplier.id}); bootstrap.Modal.getInstance(document.getElementById('supplierDetailsModal')).hide();">
                            <i class="bi bi-pencil"></i> Editar Proveedor
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal if any
    const existingModal = document.getElementById('supplierDetailsModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Add modal to DOM and show
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('supplierDetailsModal'));
    modal.show();

    // Clean up modal after hiding
    document.getElementById('supplierDetailsModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

// Reset form when modal is shown for new supplier
document.addEventListener('DOMContentLoaded', function() {
    const supplierModal = document.getElementById('supplierModal');
    if (supplierModal) {
        supplierModal.addEventListener('show.bs.modal', function() {
            // Only reset if we're creating a new supplier (no supplierId set)
            if (!document.getElementById('supplierId').value) {
                document.getElementById('supplierForm').reset();
                document.getElementById('supplierId').value = '';
                document.getElementById('supplierModalTitle').textContent = 'Nuevo Proveedor';
                // Set default values
                document.getElementById('supplierCountry').value = 'España';
                document.getElementById('supplierType').value = 'materials';
            }
        });
        
        // Clear the supplierId when modal is hidden to ensure next open is for new supplier
        supplierModal.addEventListener('hidden.bs.modal', function() {
            document.getElementById('supplierId').value = '';
        });
    }
});

// Export functions for global access
window.loadSuppliers = loadSuppliers;
window.saveSupplier = saveSupplier;
window.editSupplier = editSupplier;
window.deleteSupplier = deleteSupplier;
window.viewSupplier = viewSupplier;
