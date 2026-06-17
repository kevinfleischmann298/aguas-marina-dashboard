// Inicialización y Migración Dinámica
let productos = [...catalogoCompleto].map(p => {
    if (p.precio_costo === undefined) {
        let pmay = p.precio_mayorista;
        let pmin = p.precio_minorista;
        let costo = pmay || pmin || null;
        p.precio_costo = costo;
        p.margen_mayorista = 0;
        p.margen_minorista = 0;
        if (costo && pmay && pmin) {
            p.margen_minorista = Math.round(((pmin - costo) / costo) * 100);
        }
    }
    return p;
});

let currentSector = 'all';
let currentOrigen = 'all';
let currentUso = 'all';
let searchTerm = '';

const productsGrid = document.getElementById('productsGrid');
const searchInput = document.getElementById('searchInput');
const sectorFilters = document.getElementById('sectorFilters');
const origenFilters = document.getElementById('origenFilters');
const usoFilters = document.getElementById('usoFilters');
const totalCount = document.getElementById('totalCount');

const editModal = document.getElementById('editModal');
const closeModal = document.getElementById('closeModal');
const saveProduct = document.getElementById('saveProduct');
const deleteProduct = document.getElementById('deleteProduct');

const editId = document.getElementById('editId');
const editNombre = document.getElementById('editNombre');
const editPresentacion = document.getElementById('editPresentacion');
const editCosto = document.getElementById('editCosto');
const editMargenMay = document.getElementById('editMargenMay');
const editMargenMin = document.getElementById('editMargenMin');
const calcMay = document.getElementById('calcMay');
const calcMin = document.getElementById('calcMin');
const editSinStock = document.getElementById('editSinStock');

const massiveModal = document.getElementById('massiveModal');
const closeMassiveModal = document.getElementById('closeMassiveModal');
const applyMassive = document.getElementById('applyMassive');

// Helper functions para cálculo
function getPrecioMay(p) {
    if (!p.precio_costo) return null;
    return Math.round(p.precio_costo * (1 + (p.margen_mayorista || 0) / 100));
}

function getPrecioMin(p) {
    if (!p.precio_costo) return null;
    return Math.round(p.precio_costo * (1 + (p.margen_minorista || 0) / 100));
}

function formatPrice(price) {
    if (!price && price !== 0) return 'Consultar';
    return '$' + parseInt(price).toLocaleString('es-AR');
}

function renderProducts(filteredList) {
    productsGrid.innerHTML = '';
    if (filteredList.length === 0) {
        productsGrid.innerHTML = '<p style="color: var(--text-secondary); grid-column: 1/-1;">No se encontraron productos.</p>';
        totalCount.innerText = 0;
        return;
    }

    filteredList.forEach(prod => {
        const card = document.createElement('div');
        card.className = prod.sin_stock ? 'card sin-stock' : 'card';
        
        let stockHtml = prod.sin_stock ? `<span class="badge-stock">Sin Stock</span>` : '';
        
        let pmay = getPrecioMay(prod);
        let pmin = getPrecioMin(prod);

        let priceHtml = '';
        if (pmay && pmin && pmay !== pmin) {
            priceHtml = `
                <div class="card-price">
                    <div><span class="price-label">Mayorista</span> ${formatPrice(pmay)}</div>
                    <div><span class="price-label">Minorista</span> ${formatPrice(pmin)}</div>
                </div>
            `;
        } else if (pmay) {
            priceHtml = `<div class="card-price"><div><span class="price-label">Precio Único (May)</span> ${formatPrice(pmay)}</div></div>`;
        } else if (pmin) {
            priceHtml = `<div class="card-price"><div><span class="price-label">Precio Único (Min)</span> ${formatPrice(pmin)}</div></div>`;
        } else {
             priceHtml = `<div class="card-price"><div><span class="price-label">Precio</span> Consultar</div></div>`;
        }

        let codeHtml = prod.codigo ? `<div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 4px;">Cód: ${prod.codigo}</div>` : '';

        card.innerHTML = `
            <button class="btn-edit" onclick="openModal('${prod.id}')">✏️</button>
            <div class="card-header">
                <div class="card-title">
                    ${prod.nombre} ${stockHtml}
                    ${codeHtml}
                </div>
                <div class="card-badge">${prod.sector}</div>
            </div>
            <div class="card-meta">
                <span>📦 Presentación: <strong>${prod.presentacion}</strong></span>
                <span>💧 Uso: <strong>${prod.uso}</strong></span>
                <span style="color: rgba(255,255,255,0.3); font-size: 0.75rem;">Costo: ${formatPrice(prod.precio_costo)}</span>
            </div>
            ${priceHtml}
        `;
        productsGrid.appendChild(card);
    });
    totalCount.innerText = filteredList.length;
}

function filterData() {
    let filtered = productos;
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(p => 
            p.nombre.toLowerCase().includes(term) || 
            (p.codigo && p.codigo.includes(term))
        );
    }
    if (currentOrigen !== 'all') filtered = filtered.filter(p => p.sector === currentOrigen);
    if (currentUso !== 'all') filtered = filtered.filter(p => p.uso === currentUso);

    renderProducts(filtered);
}

// Edición de Productos
function updateLiveCalculations() {
    let c = parseFloat(editCosto.value) || 0;
    let mMay = parseFloat(editMargenMay.value) || 0;
    let mMin = parseFloat(editMargenMin.value) || 0;
    calcMay.innerText = formatPrice(Math.round(c * (1 + mMay / 100)));
    calcMin.innerText = formatPrice(Math.round(c * (1 + mMin / 100)));
}

[editCosto, editMargenMay, editMargenMin].forEach(el => el.addEventListener('input', updateLiveCalculations));

window.openModal = function(id) {
    const prod = productos.find(p => p.id === id);
    if (!prod) return;

    editId.value = prod.id;
    editNombre.value = prod.nombre;
    editPresentacion.value = prod.presentacion;
    editCosto.value = prod.precio_costo || '';
    editMargenMay.value = prod.margen_mayorista || 0;
    editMargenMin.value = prod.margen_minorista || 0;
    editSinStock.checked = prod.sin_stock === true;

    updateLiveCalculations();
    editModal.classList.remove('hidden');
}

closeModal.addEventListener('click', () => editModal.classList.add('hidden'));

saveProduct.addEventListener('click', () => {
    const id = editId.value;
    const index = productos.findIndex(p => p.id === id);
    if (index !== -1) {
        productos[index].nombre = editNombre.value;
        productos[index].presentacion = editPresentacion.value;
        productos[index].precio_costo = editCosto.value ? parseInt(editCosto.value) : null;
        productos[index].margen_mayorista = editMargenMay.value ? parseFloat(editMargenMay.value) : 0;
        productos[index].margen_minorista = editMargenMin.value ? parseFloat(editMargenMin.value) : 0;
        productos[index].sin_stock = editSinStock.checked;
    } else {
        // Es un nuevo producto
        productos.unshift({
            id: id,
            nombre: editNombre.value || 'Sin nombre',
            presentacion: editPresentacion.value || 'Unidad',
            precio_costo: editCosto.value ? parseInt(editCosto.value) : null,
            margen_mayorista: editMargenMay.value ? parseFloat(editMargenMay.value) : 0,
            margen_minorista: editMargenMin.value ? parseFloat(editMargenMin.value) : 0,
            sin_stock: editSinStock.checked,
            sector: 'Manual',
            uso: 'Varios'
        });
    }
    editModal.classList.add('hidden');
    filterData();
});

deleteProduct.addEventListener('click', () => {
    if(confirm('¿Seguro que quieres eliminar este producto?')) {
        productos = productos.filter(p => p.id !== editId.value);
        editModal.classList.add('hidden');
        filterData();
    }
});

window.openNewProductModal = function() {
    editId.value = "PRD-NEW-" + Date.now();
    editNombre.value = '';
    editPresentacion.value = '';
    editCosto.value = '';
    editMargenMay.value = '0';
    editMargenMin.value = '0';
    editSinStock.checked = false;
    updateLiveCalculations();
    editModal.classList.remove('hidden');
}

// Aumento Masivo
window.openMassiveUpdateModal = function() {
    massiveModal.classList.remove('hidden');
}

closeMassiveModal.addEventListener('click', () => massiveModal.classList.add('hidden'));

applyMassive.addEventListener('click', () => {
    const origen = document.getElementById('massiveOrigen').value;
    const target = document.getElementById('massiveTarget').value;
    const percent = parseFloat(document.getElementById('massivePercent').value);

    if (!percent || isNaN(percent)) return alert("Ingresa un porcentaje válido");

    let count = 0;
    productos.forEach(p => {
        if (origen === 'all' || p.sector === origen) {
            if (target === 'costo' && p.precio_costo) {
                p.precio_costo = Math.round(p.precio_costo * (1 + percent / 100));
                count++;
            } else if (target === 'margen_may') {
                p.margen_mayorista = (p.margen_mayorista || 0) + percent;
                count++;
            } else if (target === 'margen_min') {
                p.margen_minorista = (p.margen_minorista || 0) + percent;
                count++;
            }
        }
    });

    massiveModal.classList.add('hidden');
    filterData();
    alert(`Aumento masivo aplicado a ${count} productos.`);
});

// Exportación
window.exportData = function() {
    // Generar precios calculados fijos para el JSON de WhatsApp
    const exportList = productos.map(p => ({
        ...p,
        precio_mayorista: getPrecioMay(p),
        precio_minorista: getPrecioMin(p)
    }));

    const dataStr = JSON.stringify(exportList, null, 2);
    const blobJson = new Blob([dataStr], { type: "application/json" });
    const aJson = document.createElement('a');
    aJson.href = URL.createObjectURL(blobJson);
    aJson.download = "catalogo.json";
    aJson.click();

    const jsStr = "const catalogoCompleto = " + dataStr + ";";
    const blobJs = new Blob([jsStr], { type: "application/javascript" });
    const aJs = document.createElement('a');
    aJs.href = URL.createObjectURL(blobJs);
    aJs.download = "data.js";
    aJs.click();
}

// Filtros Listeners
searchInput.addEventListener('input', (e) => { searchTerm = e.target.value; filterData(); });

origenFilters.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
        document.querySelectorAll('#origenFilters .tag').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentOrigen = e.target.getAttribute('data-filter');
        filterData();
    }
});

usoFilters.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
        document.querySelectorAll('#usoFilters .tag').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentUso = e.target.getAttribute('data-filter');
        filterData();
    }
});

filterData();
