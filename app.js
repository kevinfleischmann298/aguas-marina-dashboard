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
searchInput.addEventListener('input', (e) => {
    searchTerm = e.target.value;
    const activeBtn = document.querySelector('.nav-btn.active');
    const target = activeBtn ? activeBtn.getAttribute('data-target') : 'view-catalogo';
    
    if (target === 'view-catalogo') {
        filterData();
    } else if (target === 'view-pedidos') {
        renderPedidos();
    } else if (target === 'view-ratings') {
        renderRatings();
    } else if (target === 'view-clientes') {
        renderClientesVIP();
    }
});

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

// --- CONFIGURACIÓN DE API DINÁMICA ---
let API_BASE = localStorage.getItem('API_BASE_URL') || 'http://18.223.110.105:3000/api';

const apiUrlInput = document.getElementById('apiUrlInput');
const apiStatus = document.getElementById('apiStatus');

if (apiUrlInput) {
    apiUrlInput.value = API_BASE;
    apiUrlInput.addEventListener('change', (e) => {
        let val = e.target.value.trim();
        if (val.endsWith('/')) val = val.slice(0, -1);
        API_BASE = val;
        localStorage.setItem('API_BASE_URL', API_BASE);
        cargarDatosAPI();
    });
}

// Variables globales para datos y gráficos
let dataPedidos = [];
let dataRatings = [];
let dataClientesVIP = [];

let salesChartInstance = null;
let ratingsChartInstance = null;

async function verificarConexionAPI() {
    if (!apiStatus) return false;
    apiStatus.className = 'api-status disconnected';
    apiStatus.innerText = '🔴 Probando...';
    try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 3000);
        const res = await fetch(`${API_BASE}/ratings`, { signal: controller.signal });
        clearTimeout(id);
        if (res.ok) {
            apiStatus.className = 'api-status connected';
            apiStatus.innerText = '🟢 Conectado';
            return true;
        }
    } catch(e) {}
    apiStatus.className = 'api-status disconnected';
    apiStatus.innerText = '🔴 Desconectado';
    return false;
}

async function cargarDatosAPI() {
    const connected = await verificarConexionAPI();
    
    // El KPI de catálogo se actualiza siempre desde el catálogo local
    const kpiCatalogEl = document.getElementById('kpi-catalog');
    if (kpiCatalogEl) kpiCatalogEl.innerText = productos.length;
    
    if (!connected) {
        document.getElementById('kpi-sales').innerText = '$0';
        document.getElementById('kpi-orders-count').innerText = '0 pedidos';
        document.getElementById('kpi-rating').innerText = '0.0';
        document.getElementById('kpi-rating-count').innerText = '0 opiniones';
        document.getElementById('kpi-vip').innerText = '0';
        return;
    }
    
    try {
        const [resPedidos, resRatings, resVIP] = await Promise.all([
            fetch(`${API_BASE}/pedidos`).then(r => r.ok ? r.json() : []).catch(() => []),
            fetch(`${API_BASE}/ratings`).then(r => r.ok ? r.json() : []).catch(() => []),
            fetch(`${API_BASE}/clientes_calidad`).then(r => r.ok ? r.json() : []).catch(() => [])
        ]);
        
        dataPedidos = resPedidos || [];
        dataRatings = resRatings || [];
        dataClientesVIP = resVIP || [];
        
        recalcularKPIs();
        renderCharts();
    } catch(e) {
        console.error("Error cargando datos de la API del bot:", e);
    }
}

function recalcularKPIs() {
    // 1. Catálogo (local)
    const kpiCatalogEl = document.getElementById('kpi-catalog');
    if (kpiCatalogEl) kpiCatalogEl.innerText = productos.length;
    
    // 2. Ventas de Hoy
    const hoyStr = new Date().toISOString().split('T')[0];
    let totalHoy = 0;
    let pedidosHoyCount = 0;
    
    dataPedidos.forEach(p => {
        if (p.fecha && p.fecha.startsWith(hoyStr)) {
            totalHoy += parseFloat(p.total) || 0;
            pedidosHoyCount++;
        }
    });
    
    const kpiSalesEl = document.getElementById('kpi-sales');
    const kpiOrdersCountEl = document.getElementById('kpi-orders-count');
    if (kpiSalesEl) kpiSalesEl.innerText = '$' + totalHoy.toLocaleString('es-AR');
    if (kpiOrdersCountEl) kpiOrdersCountEl.innerText = `${pedidosHoyCount} pedido${pedidosHoyCount !== 1 ? 's' : ''} hoy`;
    
    // 3. Satisfacción Promedio
    const kpiRatingEl = document.getElementById('kpi-rating');
    const kpiRatingCountEl = document.getElementById('kpi-rating-count');
    
    if (dataRatings.length > 0) {
        let suma = 0;
        let validRatings = 0;
        dataRatings.forEach(r => {
            if (r.rating) {
                suma += parseFloat(r.rating);
                validRatings++;
            }
        });
        const prom = validRatings > 0 ? (suma / validRatings).toFixed(1) : '0.0';
        if (kpiRatingEl) kpiRatingEl.innerText = prom;
        if (kpiRatingCountEl) kpiRatingCountEl.innerText = `${validRatings} opinio${validRatings !== 1 ? 'nes' : 'n'}`;
        
        const avgEl = document.getElementById('ratingsAverage');
        const starsEl = document.getElementById('ratingsStars');
        const totalEl = document.getElementById('ratingsTotal');
        if (avgEl) avgEl.innerText = prom;
        if (starsEl) starsEl.innerText = '⭐'.repeat(Math.round(prom)) + '☆'.repeat(5 - Math.round(prom));
        if (totalEl) totalEl.innerText = `${validRatings} valoraciones en total`;
    } else {
        if (kpiRatingEl) kpiRatingEl.innerText = '0.0';
        if (kpiRatingCountEl) kpiRatingCountEl.innerText = '0 opiniones';
    }
    
    // 4. Clientes VIP
    const kpiVipEl = document.getElementById('kpi-vip');
    if (kpiVipEl) kpiVipEl.innerText = dataClientesVIP.length;
}

function renderCharts() {
    renderSalesChart();
    renderRatingsChart();
}

function renderSalesChart() {
    const canvas = document.getElementById('salesChart');
    if (!canvas) return;
    
    const labels = [];
    const salesData = [];
    
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayStr = d.toISOString().split('T')[0];
        const label = d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
        labels.push(label);
        
        let sum = 0;
        dataPedidos.forEach(p => {
            if (p.fecha && p.fecha.startsWith(dayStr)) {
                sum += parseFloat(p.total) || 0;
            }
        });
        salesData.push(sum);
    }
    
    if (salesChartInstance) {
        salesChartInstance.destroy();
    }
    
    const ctx = canvas.getContext('2d');
    salesChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Ventas ($)',
                data: salesData,
                borderColor: '#60a5fa',
                backgroundColor: 'rgba(96, 165, 250, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.3,
                pointBackgroundColor: '#3b82f6',
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return ' Ventas: $' + context.raw.toLocaleString('es-AR');
                        }
                    }
                }
            },
            scales: {
                x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } }
            }
        }
    });
}

function renderRatingsChart() {
    const canvas = document.getElementById('ratingsChart');
    if (!canvas) return;
    
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    dataRatings.forEach(r => {
        if (r.rating && counts[r.rating] !== undefined) {
            counts[r.rating]++;
        }
    });
    
    if (ratingsChartInstance) {
        ratingsChartInstance.destroy();
    }
    
    const ctx = canvas.getContext('2d');
    ratingsChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['5 ⭐', '4 ⭐', '3 ⭐', '2 ⭐', '1 ⭐'],
            datasets: [{
                data: [counts[5], counts[4], counts[3], counts[2], counts[1]],
                backgroundColor: [
                    '#10b981',
                    '#3b82f6',
                    '#fbbf24',
                    '#f59e0b',
                    '#ef4444'
                ],
                borderRadius: 4
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: { 
                    grid: { display: false }, 
                    ticks: { color: '#94a3b8', stepSize: 1 }, 
                    beginAtZero: true 
                },
                y: { 
                    grid: { display: false }, 
                    ticks: { color: '#f8fafc', font: { weight: 'bold' } } 
                }
            }
        }
    });
}

// Renderizado de listados

function renderPedidos() {
    const grid = document.getElementById('pedidosGrid');
    if (!grid) return;
    
    let filtered = dataPedidos;
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(p => 
            p.cliente_id.toLowerCase().includes(term) ||
            (p.productos && p.productos.some(prod => prod.nombre.toLowerCase().includes(term)))
        );
    }
    
    if (filtered.length === 0) {
        grid.innerHTML = '<p style="color: var(--text-secondary); grid-column: 1/-1;">No hay pedidos para mostrar.</p>';
        return;
    }
    
    grid.innerHTML = '';
    [...filtered].reverse().forEach(p => {
        const card = document.createElement('div');
        card.className = 'card';
        
        let dateLabel = 'Reciente';
        if (p.fecha) {
            try {
                dateLabel = new Date(p.fecha).toLocaleString('es-AR', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                });
            } catch(e) {}
        }
        
        const tipo = p.tipo_cliente || 'interactivo';
        const tipoBadge = `<span class="badge-pedido-tipo ${tipo}">${tipo === 'audio' ? '🎙️ Audio' : '📱 Chat'}</span>`;
        
        let prodListHtml = '';
        if (p.productos && p.productos.length > 0) {
            p.productos.forEach(prod => {
                prodListHtml += `
                    <div class="pedido-item">
                        <span class="pedido-item-name">${prod.nombre}</span>
                        <span class="pedido-item-qty">x${prod.cantidad}</span>
                    </div>
                `;
            });
        } else {
            prodListHtml = '<div style="font-size:0.8rem; color:var(--text-secondary);">Detalle no disponible</div>';
        }
        
        card.innerHTML = `
            <div class="pedido-header">
                <div class="pedido-cliente">
                    <span>📱 ${p.cliente_id.replace('@c.us', '')}</span>
                    ${tipoBadge}
                </div>
                <div class="pedido-fecha">${dateLabel}</div>
            </div>
            <div class="pedido-item-list">
                ${prodListHtml}
            </div>
            <div class="pedido-total-row">
                <span>Total</span>
                <span>$${parseFloat(p.total || 0).toLocaleString('es-AR')}</span>
            </div>
        `;
        grid.appendChild(card);
    });
}

function renderRatings() {
    const grid = document.getElementById('ratingsGrid');
    if (!grid) return;
    
    let filtered = dataRatings;
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(r => 
            r.cliente_id.toLowerCase().includes(term) ||
            (r.comentario && r.comentario.toLowerCase().includes(term))
        );
    }
    
    if (filtered.length === 0) {
        grid.innerHTML = '<p style="color: var(--text-secondary); grid-column: 1/-1;">No hay valoraciones para mostrar.</p>';
        return;
    }
    
    grid.innerHTML = '';
    [...filtered].reverse().forEach(r => {
        const card = document.createElement('div');
        card.className = 'card';
        let stars = '⭐'.repeat(r.rating || 5);
        let commentHtml = r.comentario ? `<div class="rating-comment-bubble">"${r.comentario}"</div>` : '';
        
        let dateLabel = 'Reciente';
        if (r.fecha) {
            try { dateLabel = new Date(r.fecha).toLocaleDateString('es-AR'); } catch(e) {}
        }
        
        card.innerHTML = `
            <div class="card-header">
                <div class="card-title">${stars}</div>
                <div class="card-badge">${dateLabel}</div>
            </div>
            <div class="card-meta">
                <span>📱 Cliente: <strong>${r.cliente_id.replace('@c.us', '')}</strong></span>
                ${commentHtml}
            </div>
        `;
        grid.appendChild(card);
    });
}

function renderClientesVIP() {
    const grid = document.getElementById('clientesGrid');
    if (!grid) return;
    
    let filtered = dataClientesVIP;
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(c => c.cliente_id.toLowerCase().includes(term));
    }
    
    if (filtered.length === 0) {
        grid.innerHTML = '<p style="color: var(--text-secondary); grid-column: 1/-1;">No hay clientes VIP para mostrar.</p>';
        return;
    }
    
    grid.innerHTML = '';
    [...filtered].reverse().forEach(c => {
        const card = document.createElement('div');
        card.className = 'card';
        
        let dateLabel = 'Reciente';
        if (c.fecha_identificacion) {
            try { dateLabel = new Date(c.fecha_identificacion).toLocaleDateString('es-AR'); } catch(e) {}
        }
        
        card.innerHTML = `
            <div class="card-header">
                <div class="card-title">📱 ${c.cliente_id.replace('@c.us', '')}</div>
                <div class="card-badge" style="background: rgba(139, 92, 246, 0.15); color: #c084fc; border: 1px solid rgba(139, 92, 246, 0.2);">VIP</div>
            </div>
            <div class="card-meta">
                <span>📅 Detectado: <strong>${dateLabel}</strong></span>
                <span>🛒 Pedidos sin bot: <strong>${c.pedidos_sin_interaccion || 0}</strong></span>
            </div>
            <div class="card-price">
                <div><span class="price-label">Gasto Histórico</span> $${parseFloat(c.total_gastado || 0).toLocaleString('es-AR')}</div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Actualización manual expuesta globalmente
window.cargarPedidos = async function() {
    await cargarDatosAPI();
    renderPedidos();
};

// --- SISTEMA DE NAVEGACIÓN ---
const navBtns = document.querySelectorAll('.nav-btn');
const views = document.querySelectorAll('.view');

navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        navBtns.forEach(b => b.classList.remove('active'));
        views.forEach(v => v.style.display = 'none');
        
        btn.classList.add('active');
        const targetId = btn.getAttribute('data-target');
        document.getElementById(targetId).style.display = 'block';

        // Manejar visibilidad de filtros del catálogo
        const catalogFilters = document.querySelectorAll('.catalog-filter');
        if (targetId === 'view-catalogo') {
            catalogFilters.forEach(f => f.style.display = 'block');
        } else {
            catalogFilters.forEach(f => f.style.display = 'none');
        }

        // Limpiar búsqueda al cambiar de pestaña
        searchInput.value = '';
        searchTerm = '';

        // Cargar datos al hacer click para mantener sincronía
        if (targetId === 'view-pedidos') {
            renderPedidos();
            cargarDatosAPI().then(() => renderPedidos());
        }
        if (targetId === 'view-ratings') {
            renderRatings();
            cargarDatosAPI().then(() => renderRatings());
        }
        if (targetId === 'view-clientes') {
            renderClientesVIP();
            cargarDatosAPI().then(() => renderClientesVIP());
        }
    });
});

// Carga inicial y chequeo de API al abrir el dashboard
cargarDatosAPI();
