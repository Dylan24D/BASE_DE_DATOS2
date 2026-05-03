// ============================================
// 1. LÓGICA DE ACCESO
// ============================================
const CREDENCIALES = { user: "Dyzin24", pass: "12345" };

// Contador de modales abiertos para manejar el bloqueo del scroll sin conflictos
let activeModals = 0;

function updateBodyScroll() {
    if (activeModals > 0) {
        document.body.style.overflow = 'hidden';
        document.body.classList.add('modal-active');
    } else {
        document.body.style.overflow = '';
        document.body.classList.remove('modal-active');
    }
}

function toggleUnidad(num) {
    const content = document.getElementById(`content-${num}`);
    const icon = document.getElementById(`icon-${num}`);
    if (!content || !icon) return;
    
    const isOpen = content.style.display === "block";
    
    // Cerrar todas las demás para que solo una esté abierta (opcional, ayuda al rendimiento)
    document.querySelectorAll('[id^="content-"]').forEach(el => el.style.display = 'none');
    document.querySelectorAll('[id^="icon-"]').forEach(el => el.innerText = '+');
    document.querySelectorAll('[id^="icon-"]').forEach(el => el.style.transform = 'rotate(0deg)');

    // Abrir la seleccionada
    content.style.display = isOpen ? "none" : "block";
    icon.innerText = isOpen ? "+" : "-";
    icon.style.transform = isOpen ? "rotate(0deg)" : "rotate(180deg)";
}

function validarAcceso() {
    const userIn = document.getElementById('user')?.value.trim();
    const passIn = document.getElementById('pass')?.value.trim();
    
    if (userIn === CREDENCIALES.user && passIn === CREDENCIALES.pass) {
        window.location.href = "admin.html";
    } else {
        alert("⚠️ Usuario o contraseña incorrectos.");
    }
}

// ============================================
// LÓGICA GLOBAL DE DESCARGA (FORZAR PDF)
// ============================================
async function descargarArchivo(url, nombre) {
    try {
        const respuesta = await fetch(url);
        const blob = await respuesta.blob();
        const urlBlob = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = urlBlob;
        link.download = nombre;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(urlBlob);
    } catch (error) {
        console.error("Error en descarga:", error);
        window.open(url, '_blank'); // Fallback si falla el fetch
    }
}

// ============================================
// 1.5 LÓGICA DE TEMAS (GENGAR VS PIKACHU)
// ============================================
const TEMAS = ['darkrai', 'charizard', 'greninja', 'sceptile'];

function toggleThemeMenu() {
    const menu = document.getElementById('theme-menu');
    if (menu) menu.classList.toggle('show');
}

// Cerrar el menú si se hace clic fuera
document.addEventListener('click', (e) => {
    const container = document.querySelector('.theme-selector-container');
    const menu = document.getElementById('theme-menu');
    if (container && !container.contains(e.target)) {
        menu?.classList.remove('show');
    }
});

function setTheme(themeName) {
    const body = document.body;
    body.classList.remove(...TEMAS.map(t => `${t}-theme`));
    body.classList.add(`${themeName}-theme`);
    localStorage.setItem('theme', themeName);
    updateThemeUI(themeName);
    document.getElementById('theme-menu')?.classList.remove('show');
}

function toggleTheme() {
    const body = document.body;
    let currentTheme = localStorage.getItem('theme') || 'darkrai';
    let nextIndex = (TEMAS.indexOf(currentTheme) + 1) % TEMAS.length;
    let nextTheme = TEMAS[nextIndex];

    body.classList.remove(...TEMAS.map(t => `${t}-theme`));
    body.classList.add(`${nextTheme}-theme`);
    
    localStorage.setItem('theme', nextTheme);
    updateThemeUI(nextTheme);
}

function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'darkrai';
    document.body.classList.add(`${savedTheme}-theme`);
    updateThemeUI(savedTheme);
}

function updateThemeUI(theme) {
    const themeImg = document.getElementById('theme-icon');
    if (themeImg) {
        const icons = {
            'darkrai': 'assets/siniestroo.png',
            'charizard': 'assets/fuegoo.png',
            'greninja': 'assets/aguaaa.png',
            'sceptile': 'assets/plantaa.png'
        };
        const alts = {
            'darkrai': 'Tipo Siniestro', 'charizard': 'Tipo Fuego',
            'greninja': 'Tipo Agua', 'sceptile': 'Tipo Planta'
        };
        themeImg.src = icons[theme] || 'assets/oscuridad.png';
        themeImg.alt = alts[theme] || 'Cambiar Tema';
    }
}

// ============================================
// 2. CONFIGURACIÓN SUPABASE
// ============================================
const SUPABASE_URL = 'https://iuemugmiuxzqwwhlbtcn.supabase.co'; 
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1ZW11Z21pdXh6cXd3aGxidGNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3MDk1MzAsImV4cCI6MjA5MjI4NTUzMH0.mONcS-nszajACwOXdnUJotVJBvn69wfVkrEtUtR0Y_s";
let dbClient = null;
const BUCKET_NAME = 'materiales';
let isFetchingData = false;

function mostrarMensajeUI(mensaje, tipo = "info") {
    let toast = document.getElementById('supabase-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'supabase-toast';
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.right = '20px';
        toast.style.padding = '12px 20px';
        toast.style.borderRadius = '8px';
        toast.style.zIndex = '9999';
        toast.style.fontFamily = 'monospace';
        toast.style.fontSize = '14px';
        toast.style.fontWeight = 'bold';
        document.body.appendChild(toast);
    }
    
    const colores = { success: '#00ff88', error: '#ff4444', info: '#00aaff', warning: '#ffaa00' };
    toast.style.backgroundColor = colores[tipo] || colores.info;
    toast.style.color = '#000';
    toast.textContent = `🔌 ${mensaje}`;
    
    setTimeout(() => { if(toast) toast.style.opacity = '0.5'; }, 4000);
    setTimeout(() => { if(toast) toast.remove(); }, 6000);
}

async function conectarBaseDeDatos() {
    if (dbClient) return true; // Ya conectado
    
    if (!window.supabase) {
        console.log("⏳ Supabase no detectado aún, esperando al evento...");
        return false;
    }

    console.log("🔄 Conectando a Supabase...");
    try {
        dbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
            auth: { persistSession: false }
        });
        
        console.log("✅ Conectado a Supabase");
        
        // Cargar datos de inmediato
        cargarSemanas();
        
        return true;
    } catch (error) {
        console.error("❌ Error conexión:", error);
        return false;
    }
}

async function verificarOCrearBucket() {
    if (!dbClient) return false;
    try {
        const { error } = await dbClient.storage.from(BUCKET_NAME).list();
        if (error && error.message.includes('not found')) {
            await dbClient.storage.createBucket(BUCKET_NAME, { public: true });
            console.log("✅ Bucket 'materiales' creado");
        }
        return true;
    } catch (e) { return false; }
}

// ============================================
// 3. CARGAR SEMANAS (16 semanas, 4 unidades)
// ============================================
let globalDbMap = {}; // Guardamos los datos globalmente para acceder desde los modales
const DEFAULT_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='120' viewBox='0 0 200 120'%3E%3Crect width='200' height='120' fill='%23333'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' fill='%23666' dy='.3em'%3ESemana%3C/text%3E%3C/svg%3E";

function crearTarjetaHTML(num, esAdmin = false) {
    const numeral = num < 10 ? '0' + num : num;
    const data = globalDbMap[num];
    const imgFinal = data?.img_url || DEFAULT_IMAGE;
    const tituloSemana = data?.titulo || `Semana ${numeral}`;
    
    // Procesar lista de archivos de forma robusta
    let archivos = [];
    if (data?.pdf_url) {
        if (Array.isArray(data.pdf_url)) archivos = data.pdf_url;
        else if (typeof data.pdf_url === 'string' && data.pdf_url.startsWith('[')) {
            try { archivos = JSON.parse(data.pdf_url); } catch(e) {}
        }
    }
    
    const tieneMaterial = archivos.length > 0;
    
    let materialHTML = "";
    if (tieneMaterial) {
        materialHTML = `<button class="btn-view-pdf" onclick="abrirModalMateriales(${num})">📂 Ver Archivos (${archivos.length})</button>`;
    } else {
        materialHTML = `<button class="btn-view-pdf" disabled>🔒 Sin material</button>`;
    }

    const inner = `
        <div class="card" style="opacity: ${data ? 1 : 0.7}">
            <img src="${imgFinal}" class="card-img" alt="Semana ${numeral}" 
                 onerror="this.src='${DEFAULT_IMAGE}'">
            <div class="card-body">
                <h3>${tituloSemana}</h3>
                <div class="card-button-group">
                    ${materialHTML}
                    ${(esAdmin && data) ? `
                        <button class="btn-view-pdf btn-mini" style="border-color: var(--gengar-eyes); color: var(--gengar-eyes);" onclick="abrirEditorAdmin(${num})">
                            📝 Editar Contenido
                        </button>
                        <button class="btn-delete btn-mini" style="margin-top: 5px;" onclick="eliminarRegistro(${num})">
                            🗑️ Borrar Todo
                        </button>` : ''
                    }
                </div>
            </div>
        </div>`;
    return `<div class="electric-border-container"><div class="electric-border-inner">${inner}</div></div>`;
}

async function cargarSemanas() {
    if (!dbClient) return;
    if (isFetchingData) return;
    isFetchingData = true;
    
    try {
        const { data: semanasDB, error } = await dbClient.from('semanas').select('*').order('id', { ascending: true });
        if (error) throw error;
        
        globalDbMap = {};
        if (semanasDB) {
            semanasDB.forEach(item => { globalDbMap[item.id] = item; });
        }
        
        const esAdmin = !!document.getElementById('admin-u1');
        
        for (let u = 1; u <= 4; u++) {
            const contAdm = document.getElementById(`admin-u${u}`);
            let html = "";
            for (let i = (u - 1) * 4 + 1; i <= u * 4; i++) html += crearTarjetaHTML(i, esAdmin);
            if (contAdm) contAdm.innerHTML = html;
        }

        // Soporte para ver todas las semanas en una cuadrícula única (útil para semanas.html)
        const contTodas = document.getElementById('semanas-todas');
        if (contTodas) {
            let htmlTodas = "";
            for (let i = 1; i <= 16; i++) htmlTodas += crearTarjetaHTML(i, esAdmin);
            contTodas.innerHTML = htmlTodas;
        }

        // Si hay un modal abierto, actualizar su contenido con los datos recién llegados
        const modalUnidad = document.getElementById('modal-unidades');
        if (modalUnidad && modalUnidad.style.display === 'flex') {
            const numUnidad = parseInt(document.getElementById('modal-titulo').innerText.slice(-1));
            if (!isNaN(numUnidad)) abrirModalUnidad(numUnidad);
        }

        console.log("✅ Semanas cargadas");
    } catch (e) { 
        console.error("Error cargando semanas:", e); 
    } finally { isFetchingData = false; }
}

// ============================================
// 4. GUARDAR CAMBIOS (SUBIR MATERIAL)
// ============================================
async function guardarCambios() {
    if (!dbClient) { alert("Sin conexión a Supabase"); return; }
    
    const semId = document.getElementById('semana-select')?.value;
    if (!semId) { alert("Selecciona una semana"); return; }
    
    const imgIn = document.getElementById('img-input');
    const pdfIn = document.getElementById('pdf-input');
    
    if ((!imgIn || imgIn.files.length === 0) && (!pdfIn || pdfIn.files.length === 0)) {
        alert("Selecciona al menos un archivo");
        return;
    }
    
    const btn = document.querySelector('.btn-admin-panel');
    const originalText = btn.innerText;
    btn.innerText = "⏳ SUBIENDO...";
    btn.disabled = true;
    
    try {
        const updates = { id: parseInt(semId) };
        const nuevoTitulo = document.getElementById('titulo-input')?.value.trim();
        if (nuevoTitulo) updates.titulo = nuevoTitulo;

        let currentBgUrl = null;
        
        // Subir imagen
        if (imgIn && imgIn.files.length > 0) {
            const file = imgIn.files[0];
            const ext = file.name.split('.').pop();
            const nombre = `imagenes/img_${semId}_${Date.now()}.${ext}`;
            const { error } = await dbClient.storage.from(BUCKET_NAME).upload(nombre, file, { upsert: true });
            if (error) throw error;
            const { data: urlData } = dbClient.storage.from(BUCKET_NAME).getPublicUrl(nombre);
            currentBgUrl = urlData.publicUrl;
            updates.img_url = currentBgUrl; // Fondo principal de la tarjeta
        }
        
        // Subir Múltiples Archivos
        if (pdfIn && pdfIn.files.length > 0) {
            // Obtener archivos existentes para no borrarlos (Adjuntar)
            const { data: currentWeek } = await dbClient.from('semanas').select('pdf_url, img_url').eq('id', semId).maybeSingle();
            let listaArchivos = [];
            if (currentWeek?.pdf_url) {
                try { listaArchivos = JSON.parse(currentWeek.pdf_url); } catch(e){}
            }
            
            // Si no se subió imagen nueva, intentar usar la del registro existente para los nuevos archivos
            const bgParaArchivos = currentBgUrl || currentWeek?.img_url || null;

            for (let i = 0; i < pdfIn.files.length; i++) {
                const file = pdfIn.files[i];
                const ext = file.name.split('.').pop();
                const nombre = `materiales/sem${semId}_${Date.now()}_${i}.${ext}`;
                
                const { error } = await dbClient.storage.from(BUCKET_NAME).upload(nombre, file, { upsert: true });
                if (error) throw error;
                
                const { data: urlData } = dbClient.storage.from(BUCKET_NAME).getPublicUrl(nombre);
                listaArchivos.push({ 
                    name: file.name, 
                    url: urlData.publicUrl, 
                    bg_url: bgParaArchivos 
                });
            }
            // Guardamos la lista como JSON string
            updates.pdf_url = JSON.stringify(listaArchivos);
        }
        
        // Guardar en BD
        const { error: dbErr } = await dbClient.from('semanas').upsert(updates, { onConflict: 'id' });
        if (dbErr) throw dbErr;
        
        alert("✅ Material subido correctamente");
        location.reload();
        
    } catch (err) {
        alert("Error: " + err.message);
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

// ============================================
// 4.5 GESTIÓN INDIVIDUAL (EDITAR/ELIMINAR ARCHIVOS)
// ============================================
function abrirEditorAdmin(num) {
    const data = globalDbMap[num];
    if (!data) return;

    const modal = document.getElementById('modal-lista-archivos'); // Reutilizamos el modal de lista
    const container = document.getElementById('lista-archivos-content');
    const titulo = document.getElementById('modal-archivos-titulo');

    if (!modal || !container || !titulo) return;

    titulo.innerText = `Editor: Semana ${num}`;
    
    let archivos = [];
    try { archivos = typeof data.pdf_url === 'string' ? JSON.parse(data.pdf_url) : (data.pdf_url || []); } catch(e){}

    let html = `
        <div class="admin-section-title">Nombre de la Semana</div>
        <div class="admin-edit-row">
            <input type="text" id="edit-titulo-${num}" class="input-edit-inline" value="${data.titulo || 'Semana ' + num}">
            <button class="btn-view-pdf btn-mini" onclick="actualizarTituloSemana(${num})">💾 Guardar</button>
        </div>
        <div class="admin-section-title">Fondo de la Semana</div>
        <div class="admin-edit-row" style="flex-wrap: wrap;">
            <input type="file" id="edit-fondo-${num}" class="admin-file" accept="image/*" style="flex: 1; min-width: 200px;">
            <button class="btn-view-pdf btn-mini" onclick="actualizarFondoSemana(${num}, this)">📤 Cambiar Fondo</button>
        </div>
        <div class="admin-section-title">Lista de Archivos (${archivos.length})</div>
    `;

    archivos.forEach((arc, index) => {
        html += `
            <div class="admin-edit-row">
                <input type="text" id="name-${num}-${index}" class="input-edit-inline" value="${arc.name}">
                <div class="archivo-actions">
                    <button class="btn-view-pdf btn-mini" onclick="renombrarArchivo(${num}, ${index})">💾</button>
                    <button class="btn-delete btn-mini" onclick="eliminarArchivoUnico(${num}, ${index})">🗑️</button>
                </div>
            </div>`;
    });

    container.innerHTML = html || '<p style="text-align:center; color:var(--text-muted);">No hay archivos para editar.</p>';
    
    if (modal.style.display !== 'flex') {
        activeModals++;
        modal.style.display = 'flex';
    }
    updateBodyScroll();
}

async function actualizarTituloSemana(id) {
    const nuevoTitulo = document.getElementById(`edit-titulo-${id}`).value.trim();
    if (!nuevoTitulo) return;

    try {
        const { error } = await dbClient.from('semanas').update({ titulo: nuevoTitulo }).eq('id', id);
        if (error) throw error;
        mostrarMensajeUI("Título actualizado", "success");
        cargarSemanas();
    } catch (e) { alert("Error: " + e.message); }
}

async function actualizarFondoSemana(id, btn) {
    const fileInput = document.getElementById(`edit-fondo-${id}`);
    if (!fileInput || fileInput.files.length === 0) {
        alert("Selecciona una imagen primero");
        return;
    }

    const file = fileInput.files[0];
    const originalText = btn.innerText;
    btn.innerText = "⏳...";
    btn.disabled = true;

    try {
        const ext = file.name.split('.').pop();
        const nombre = `imagenes/img_${id}_${Date.now()}.${ext}`;
        
        // 1. Subir al Storage
        const { error: uploadError } = await dbClient.storage.from(BUCKET_NAME).upload(nombre, file, { upsert: true });
        if (uploadError) throw uploadError;

        const { data: urlData } = dbClient.storage.from(BUCKET_NAME).getPublicUrl(nombre);
        const newUrl = urlData.publicUrl;

        // 2. Actualizar en BD
        const { error: dbError } = await dbClient.from('semanas').update({ img_url: newUrl }).eq('id', id);
        if (dbError) throw dbError;

        mostrarMensajeUI("Fondo actualizado", "success");
        cargarSemanas();
    } catch (e) {
        alert("Error: " + e.message);
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

async function renombrarArchivo(semanaId, index) {
    const nuevoNombre = document.getElementById(`name-${semanaId}-${index}`).value.trim();
    if (!nuevoNombre) return;

    try {
        const data = globalDbMap[semanaId];
        let archivos = JSON.parse(data.pdf_url);
        archivos[index].name = nuevoNombre;

        const { error } = await dbClient.from('semanas').update({ pdf_url: JSON.stringify(archivos) }).eq('id', semanaId);
        if (error) throw error;
        
        mostrarMensajeUI("Archivo renombrado", "success");
        cargarSemanas();
    } catch (e) { alert("Error: " + e.message); }
}

async function eliminarArchivoUnico(semanaId, index) {
    if (!confirm("¿Seguro que quieres eliminar este archivo permanentemente?")) return;

    try {
        const data = globalDbMap[semanaId];
        let archivos = JSON.parse(data.pdf_url);
        const archivoAEliminar = archivos[index];

        // 1. Intentar borrar del Storage
        const path = archivoAEliminar.url.split(`/${BUCKET_NAME}/`)[1];
        if (path) {
            const { error: storageErr } = await dbClient.storage.from(BUCKET_NAME).remove([path]);
            if (storageErr) console.warn("Aviso: No se pudo borrar el archivo físico, procediendo con la base de datos.");
        }

        // 2. Actualizar array en BD
        archivos.splice(index, 1);
        const { error: dbErr } = await dbClient.from('semanas').update({ 
            pdf_url: archivos.length > 0 ? JSON.stringify(archivos) : null 
        }).eq('id', semanaId);
        
        if (dbErr) throw dbErr;

        mostrarMensajeUI("Archivo eliminado", "success");
        
        // Actualizar UI sin cerrar modal
        globalDbMap[semanaId].pdf_url = archivos.length > 0 ? JSON.stringify(archivos) : null;
        abrirEditorAdmin(semanaId); 
        cargarSemanas();

    } catch (e) { alert("Error: " + e.message); }
}

// ============================================
// 5. ELIMINAR REGISTRO
// ============================================
async function eliminarRegistro(id) {
    if (!dbClient) return;
    if (!confirm(`¿Estás TOTALMENTE seguro? Esto eliminará la imagen de fondo, el título personalizado y TODOS los archivos de la semana ${id}.`)) return;
    
    try {
        const { data: semana } = await dbClient.from('semanas').select('img_url, pdf_url').eq('id', id).single();
        
        if (semana?.img_url) {
            const path = semana.img_url.split('/materiales/')[1];
            if (path) await dbClient.storage.from(BUCKET_NAME).remove([path]);
        }
        
        if (semana?.pdf_url) {
            if (semana.pdf_url.startsWith('[')) {
                const archivos = JSON.parse(semana.pdf_url);
                const paths = archivos.map(a => a.url.split('/materiales/')[1]).filter(p => p);
                if (paths.length > 0) await dbClient.storage.from(BUCKET_NAME).remove(paths);
            } else {
                const path = semana.pdf_url.split('/materiales/')[1];
                if (path) await dbClient.storage.from(BUCKET_NAME).remove([path]);
            }
        }
        
        await dbClient.from('semanas').delete().eq('id', id);
        alert(`✅ Semana ${id} eliminada`);
        location.reload();
    } catch (error) {
        alert("Error al eliminar: " + error.message);
    }
}

// ============================================
// 5.5 LÓGICA DE MINI VENTANAS (MODALES)
// ============================================
function abrirModalUnidad(num, elemento) {
    const modal = document.getElementById('modal-unidades');
    const titulo = document.getElementById('modal-titulo');
    const gridDestino = document.getElementById('modal-grid-content');

    if (!modal || !gridDestino || !titulo) return;
    
    titulo.innerText = `UNIDAD 0${num}`;
    
    let html = "";
    for (let i = (num - 1) * 4 + 1; i <= num * 4; i++) html += crearTarjetaHTML(i);
    gridDestino.innerHTML = html;
    
    if (modal.style.display !== 'flex') {
        activeModals++;
        modal.style.display = 'flex';
    }
    updateBodyScroll();
}

function cerrarModalUnidad(event) {
    // Cerrar solo si se hace clic en la X o fuera del contenido
    if (event.target.classList.contains('modal-overlay') || event.target.classList.contains('btn-close')) {
        const modal = document.getElementById('modal-unidades');
        if (modal && modal.style.display === 'flex') {
            activeModals--;
            modal.style.display = 'none';
        }
        updateBodyScroll();
    }
}

// ============================================
// 5.7 VISUALIZADOR DE PDF EN MODAL
// ============================================
function abrirVisualizadorPDF(url, titulo) {
    const modal = document.getElementById('modal-pdf');
    const iframe = document.getElementById('pdf-viewer-frame');
    const tituloModal = document.getElementById('pdf-modal-titulo');
    const container = document.querySelector('.pdf-viewer-container');

    if (modal && iframe && tituloModal && container) {
        tituloModal.innerText = titulo;
        
        // Detectar si el archivo es una imagen (especialmente pedido por el usuario)
        const esImagen = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);

        if (esImagen) {
            iframe.style.display = 'none';
            let img = document.getElementById('img-viewer-temp');
            if (!img) {
                img = document.createElement('img');
                img.id = 'img-viewer-temp';
                img.style.cssText = "width:100%; height:100%; object-fit:contain; display:block;";
                container.appendChild(img);
            }
            img.src = url;
            img.style.display = 'block';
        } else {
            const img = document.getElementById('img-viewer-temp');
            if (img) img.style.display = 'none';
            iframe.src = url;
            iframe.style.display = 'block';
        }

        if (modal.style.display !== 'flex') {
            activeModals++;
            modal.style.display = 'flex';
        }
        updateBodyScroll();
    }
}

function cerrarVisualizadorPDF(event) {
    if (event && !event.target.classList.contains('modal-overlay') && !event.target.classList.contains('btn-close')) {
        return;
    }
    const modal = document.getElementById('modal-pdf');
    const iframe = document.getElementById('pdf-viewer-frame');
    const img = document.getElementById('img-viewer-temp');
    if (modal) {
        if (modal.style.display === 'flex') {
            activeModals--;
            modal.style.display = 'none';
        }
        if (iframe) iframe.src = '';
        if (img) img.src = '';
        updateBodyScroll();
    }
}

// ============================================
// 5.8 MODAL DE LISTA DE ARCHIVOS (NUEVO FLUJO)
// ============================================
function abrirModalMateriales(num) {
    const data = globalDbMap[num];
    if (!data || !data.pdf_url) return;

    const modal = document.getElementById('modal-lista-archivos');
    const container = document.getElementById('lista-archivos-content');
    const titulo = document.getElementById('modal-archivos-titulo');

    if (!modal || !container || !titulo) return;

    titulo.innerText = `Archivos: Semana ${num < 10 ? '0' + num : num}`;
    let html = "";

    // Obtener array de archivos procesado
    let archivos = [];
    if (Array.isArray(data.pdf_url)) archivos = data.pdf_url;
    else if (typeof data.pdf_url === 'string') {
        try { archivos = JSON.parse(data.pdf_url); } catch(e) { archivos = [{name: 'Archivo', url: data.pdf_url}]; }
    }

    archivos.forEach(arc => {
        const styleBg = arc.bg_url ? `background-image: url('${arc.bg_url}');` : ``;
        const iconPlaceholder = arc.bg_url ? '' : '<span style="font-size: 1.5rem; color: var(--text-muted);">📄</span>';

        html += `
            <div class="archivo-item">
                <div class="archivo-bg-thumb" style="${styleBg}">
                    ${iconPlaceholder}
                </div>
                <div class="archivo-info-wrapper">
                    <span class="archivo-nombre" title="${arc.name}">${arc.name}</span>
                    <div class="archivo-actions">
                        <button class="btn-view-pdf btn-mini" onclick="abrirVisualizadorPDF('${arc.url}', '${arc.name}')">👁️ Ver</button>
                        <button class="btn-view-pdf btn-mini" onclick="descargarArchivo('${arc.url}', '${arc.name}')">💾</button>
                    </div>
                </div>
            </div>`;
    });

    container.innerHTML = html;
    if (modal.style.display !== 'flex') {
        activeModals++;
        modal.style.display = 'flex';
    }
    updateBodyScroll();
}

function cerrarModalMateriales(event) {
    if (event && !event.target.classList.contains('modal-overlay') && !event.target.classList.contains('btn-close')) return;
    const modal = document.getElementById('modal-lista-archivos');
    if (modal) {
        if (modal.style.display === 'flex') {
            activeModals--;
            modal.style.display = 'none';
        }
        updateBodyScroll();
    }
}

// ============================================
// 5.9 LISTENERS PARA INPUTS DE ARCHIVOS
// ============================================
function initAdminListeners() {
    const imgIn = document.getElementById('img-input');
    const pdfIn = document.getElementById('pdf-input');

    if (imgIn) imgIn.addEventListener('change', (e) => {
        const fileName = e.target.files[0]?.name || "Seleccionar Fondo";
        e.target.parentElement.querySelector('.text').innerText = fileName;
    });

    if (pdfIn) pdfIn.addEventListener('change', (e) => {
        const count = e.target.files.length;
        const text = count === 1 ? e.target.files[0].name : (count > 1 ? `${count} archivos seleccionados` : "Subir uno o varios archivos");
        e.target.parentElement.querySelector('.text').innerText = text;
    });
}

// ============================================
// 6. INICIALIZACIÓN
// ============================================
// Escuchar evento de carga de Supabase para conectar lo antes posible
window.addEventListener('supabase-cargado', () => {
    conectarBaseDeDatos();
});

function inicializarTodo() {
    initTheme();
    initAdminListeners();
    conectarBaseDeDatos();
    initChat(); // Inicializar persistencia del chat

    // Manejar acciones automáticas desde URL (ej: abrir unidad al llegar)
    const params = new URLSearchParams(window.location.search);
    const action = params.get('bot_action');
    const val = params.get('bot_val');
    if (action === 'unidad') setTimeout(() => abrirModalUnidad(val), 800);
    if (action === 'semana') setTimeout(() => abrirModalMateriales(val), 1000);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarTodo);
} else {
    inicializarTodo();
}

// Efecto Aura
let auraReq;
document.addEventListener('mousemove', (e) => {
    if (auraReq) cancelAnimationFrame(auraReq);
    auraReq = requestAnimationFrame(() => {
        const aura = document.querySelector('.mouse-aura');
        if (aura) {
            aura.style.setProperty('--mouse-x', `${(e.clientX / window.innerWidth) * 100}%`);
            aura.style.setProperty('--mouse-y', `${(e.clientY / window.innerHeight) * 100}%`);
        }
    });
});

// ============================================
// LÓGICA DEL CHATBOT (VOZ Y NAVEGACIÓN)
// ============================================
let chatHistory = JSON.parse(localStorage.getItem('gengar_chat_history')) || [];
let isChatInitializing = false;
let isBotSpeaking = true; // Control de voz
let maleVoice = null; // Variable global para almacenar la voz masculina

// Lista de imágenes secuenciales (IMPORTANTE: Reemplaza con tus nombres reales de archivo)
const BOT_AVATARS = [
    "assets/gengar_sinfon1.png",
    "assets/gengar_sinfon2.png",
    "assets/gengar_sinfon3.png",
    "assets/gengar_sinfon4.png", 
    "assets/gengar_sinfon5.png", 
    "assets/gengar_sinfon7.png", 
    "assets/gengar_sinfon8.png"
    
];
let currentAvatarIdx = 0;

// ICONOS FORMALES SVG Y LÓGICA DE AUDIO
const ICON_VOICE_ON = '<svg viewBox="0 0 24 24"><path d="M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.85 14,18.71V20.77C18.03,19.86 21,16.28 21,12C21,7.72 18.03,4.14 14,3.23M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16.03C15.5,15.29 16.5,13.77 16.5,12M3,9V15H7L12,20V4L7,9H3Z"/></svg>';
const ICON_VOICE_OFF = '<svg viewBox="0 0 24 24"><path d="M12,4L9.91,6.09L12,8.18M4.27,3L3,4.27L7.73,9H3V15H7L12,20V13.27L16.25,17.53C15.58,18.04 14.83,18.46 14,18.7V20.77C15.38,20.45 16.63,19.82 17.68,18.96L19.73,21L21,19.73L12,10.73M19,12C19,12.94 18.8,13.82 18.46,14.64L19.97,16.15C20.62,14.91 21,13.5 21,12C21,7.72 18.03,4.14 14,3.23V5.29C16.89,6.15 19,8.83 19,12M16.5,12C16.5,10.23 15.5,8.71 14,7.97V10.18L16.45,12.63C16.48,12.43 16.5,12.22 16.5,12Z"/></svg>';

function toggleBotVoice() {
    isBotSpeaking = !isBotSpeaking;
    localStorage.setItem('gengar_bot_speaking', isBotSpeaking);
    const voiceBtn = document.getElementById('chat-voice-toggle');
    if (voiceBtn) {
        voiceBtn.innerHTML = isBotSpeaking ? ICON_VOICE_ON : ICON_VOICE_OFF;
        voiceBtn.title = isBotSpeaking ? 'Desactivar Salida de Audio' : 'Activar Salida de Audio';
    }
    // Si el audio se desactiva, cancelar cualquier habla en curso
    if (!isBotSpeaking) {
        window.speechSynthesis.cancel();
    }
}

// Función para detectar y configurar una voz masculina en español
function setMaleVoice() {
    const voices = window.speechSynthesis.getVoices();
    // Buscamos voces masculinas en español con identificadores comunes (David, Pablo, etc.)
    const detectedVoice = voices.find(voice => voice.lang.startsWith('es') && 
        (voice.name.toLowerCase().includes('male') || 
         voice.name.toLowerCase().includes('david') || 
         voice.name.toLowerCase().includes('pablo') || 
         voice.name.toLowerCase().includes('microsoft david') ||
         voice.name.toLowerCase().includes('hombre')));
    
    // Asignamos la voz detectada; si no hay una masculina clara, usamos la primera en español
    maleVoice = detectedVoice || voices.find(v => v.lang.startsWith('es'));
}

// Aseguramos que las voces se carguen correctamente antes de hablar
if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = setMaleVoice;
    setMaleVoice(); // Llamada inmediata por si el navegador ya las tenía listas
}

// Función de Voz (Text-to-Speech)
function speak(text) {
    if (!isBotSpeaking) return;
    window.speechSynthesis.cancel(); // Detener voces anteriores
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 1; // Velocidad de habla
    if (maleVoice) utterance.voice = maleVoice;
    window.speechSynthesis.speak(utterance);
}

function updateBotAvatar() {
    const img = document.getElementById('chatbot-avatar');
    if (!img || BOT_AVATARS.length === 0) return;
    // Cambia a la siguiente imagen de la lista
    currentAvatarIdx = (currentAvatarIdx + 1) % BOT_AVATARS.length;
    img.src = BOT_AVATARS[currentAvatarIdx];
}

function toggleAvatarVisibility(show) {
    const avatar = document.getElementById('chatbot-avatar-container');
    const toggleBtn = document.getElementById('chat-avatar-toggle');

    if (!avatar) return;

    // Si no se pasa parámetro, es un toggle manual
    const currentlyHidden = avatar.classList.contains('avatar-hidden');
    const shouldShow = (show === undefined) ? currentlyHidden : show;

    if (shouldShow) {
        avatar.classList.remove('avatar-hidden');
        if (toggleBtn) toggleBtn.innerText = '❯';
        localStorage.setItem('gengar_avatar_hidden', 'false');
    } else {
        avatar.classList.add('avatar-hidden');
        if (toggleBtn) toggleBtn.innerText = '❮';
        localStorage.setItem('gengar_avatar_hidden', 'true');
    }
}

function initChat() {
    isChatInitializing = true;
    const container = document.getElementById('chatbot-container');
    // El estado de abierto/cerrado lo mantenemos en localStorage para que sea cómodo,
    // pero el historial de mensajes ahora depende de la sesión de la pestaña.
    const isClosed = localStorage.getItem('gengar_chat_closed') !== 'false';
    
    // Cargar preferencia de voz
    isBotSpeaking = localStorage.getItem('gengar_bot_speaking') !== 'false';
    const voiceBtn = document.getElementById('chat-voice-toggle');
    if (voiceBtn) {
        voiceBtn.innerHTML = isBotSpeaking ? ICON_VOICE_ON : ICON_VOICE_OFF;
    }
    
    // Aplicar preferencia de visibilidad del avatar
    const isAvatarHidden = localStorage.getItem('gengar_avatar_hidden') === 'true';
    toggleAvatarVisibility(!isAvatarHidden);

    if (container) {
        if (isClosed) container.classList.add('chatbot-closed');
        else container.classList.remove('chatbot-closed');

        // Evitar que los clics en elementos internos (como la X) disparen el listener de apertura del contenedor
        const chatHeader = document.getElementById('chatbot-header');
        const chatBody = document.getElementById('chatbot-body');
        const chatToggle = document.getElementById('chat-avatar-toggle');
        [chatHeader, chatBody, chatToggle].forEach(el => {
            if (el && !el.dataset.stopProp) {
                el.addEventListener('click', (e) => e.stopPropagation());
                el.dataset.stopProp = "true";
            }
        });

        // Permitir abrir el chat haciendo clic en la imagen de Gengar minimizada
        if (!container.dataset.listener) {
            container.addEventListener('click', (e) => {
                if (container.classList.contains('chatbot-closed')) toggleChat();
            });
            container.dataset.listener = "true";
        }
    }

    const msgDiv = document.getElementById('chatbot-messages');
    if (msgDiv) {
        msgDiv.innerHTML = ''; 

        // Si hay historial en esta sesión (navegación entre HTMLs), lo restauramos
        if (chatHistory.length > 0) {
            chatHistory.forEach(item => {
                if (item.type === 'msg') renderChatMessage(item.text, item.sender, false);
                else if (item.type === 'options') renderChatOptions(item.options, false);
            });
            setTimeout(scrollToBottom, 100); // Asegurar que baje al final del historial cargado
        } else {
            // Solo si la sesión es nueva (ventana recién abierta), mostramos la presentación
            const bienvenida = "¡Hola! Soy Gengar Bot, tu guía espectral. 👻\n\n" +
                               "He organizado mi ayuda por categorías para que puedas explorar el portafolio de Dylan:";
            addChatMessage(bienvenida, 'bot');
            addChatOptions([
                {text: '🌐 Mapa de la Web', cmd: 'ayuda navegacion'},
                {text: '📂 Mis Trabajos', cmd: 'ayuda semanas'},
                {text: '🎨 Cambiar Colores', cmd: 'ayuda tema'},
                {text: '👤 Avatar Gengar', cmd: 'ayuda avatar'},
                {text: '🛡️ Gestión Admin', cmd: 'ayuda admin'}
            ]);
        }
    }
    isChatInitializing = false; // Se mantiene para el control de scroll inicial
}

function clearChat() {
    if (confirm("¿Deseas limpiar el historial espectral?")) {
        localStorage.removeItem('gengar_chat_history');
        chatHistory = [];
        initChat();
    }
}

function toggleChat() {
    const container = document.getElementById('chatbot-container');
    if (container) {
        container.classList.toggle('chatbot-closed');
        localStorage.setItem('gengar_chat_closed', container.classList.contains('chatbot-closed'));
        if (!container.classList.contains('chatbot-closed')) {
            speak("Hola de nuevo");
            setTimeout(scrollToBottom, 50); // Bajar al final al abrir el chat
        }
    }
}

function scrollToBottom() {
    const msgDiv = document.getElementById('chatbot-messages');
    if (msgDiv) {
        msgDiv.scrollTo({
            top: msgDiv.scrollHeight,
            behavior: 'smooth'
        });
    }
}

function addChatMessage(text, sender) {
    renderChatMessage(text, sender, true);
}

function renderChatMessage(text, sender, save = true) {
    const msgDiv = document.getElementById('chatbot-messages');
    if (!msgDiv) return;
    const msg = document.createElement('div');
    msg.className = sender === 'bot' ? 'bot-msg' : 'user-msg';
    msg.innerText = text;
    msgDiv.appendChild(msg);

    if (save && !isChatInitializing) {
        // Desplazamiento suave hacia abajo solo para mensajes nuevos interactivos
        setTimeout(scrollToBottom, 50);
    }

    if (save) {
        chatHistory.push({ type: 'msg', text, sender });
        localStorage.setItem('gengar_chat_history', JSON.stringify(chatHistory));
        // Si el mensaje es del bot, rotamos la imagen
        if (sender === 'bot') {
            updateBotAvatar(); // Rotar avatar solo cuando el bot responde
            if (!isChatInitializing) speak(text);
        }
    }
}

function addChatOptions(options) {
    renderChatOptions(options, true);
}

function renderChatOptions(options, save = true) {
    const msgDiv = document.getElementById('chatbot-messages');
    if (!msgDiv) return;
    const container = document.createElement('div');
    container.className = 'chat-options-container';
    
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'chat-option-btn';
        btn.innerText = opt.text;
        btn.onclick = () => { addChatMessage(opt.text, 'user'); procesarComando(opt.cmd); };
        container.appendChild(btn);
    });
    msgDiv.appendChild(container);

    if (save && !isChatInitializing) {
        // Desplazamiento suave hacia abajo solo para opciones nuevas
        setTimeout(scrollToBottom, 50);
    }

    if (save) {
        chatHistory.push({ type: 'options', options });
        localStorage.setItem('gengar_chat_history', JSON.stringify(chatHistory)); // Guardar opciones también
    }
}

function handleChatKey(e) {
    if (e.key === 'Enter') sendChatMessage();
}

function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;

    addChatMessage(text, 'user');
    input.value = '';
    procesarComando(text.toLowerCase());
}

function procesarComando(text) {
    const rawText = text.toLowerCase();
    const isSemanasPage = window.location.pathname.includes('semanas.html');

    setTimeout(() => {
        // --- 1. ACCIONES DE INTERACCIÓN (EL "PODER" DE HACER CLICS) ---
        
        // Detectar Unidad (1-4)
        const unidadMatch = rawText.match(/unidad\s*(\d+)/);
        if (unidadMatch) {
            const num = parseInt(unidadMatch[1]);
            if (num < 1 || num > 4) {
                addChatMessage(`Dylan, la unidad ${num} está fuera de mis registros. Solo manejo de la 1 a la 4.`, 'bot');
                return;
            }

            if (isSemanasPage) {
                addChatMessage(`Abriendo la Unidad ${num}. Revisa las semanas para ver el material disponible.`, 'bot');
                abrirModalUnidad(num);
            } else {
                addChatMessage(`Entendido. Vamos a la sección de Semanas para explorar la Unidad ${num}.`, 'bot');
                setTimeout(() => window.location.href = `semanas.html?bot_action=unidad&bot_val=${num}`, 1500);
            }
            return;
        }

        // Detectar Semana/Trabajos (1-16)
        const semanaMatch = rawText.match(/semana\s*(\d+)/) || rawText.match(/trabajo[s]?\s*(\d+)/);
        if (semanaMatch) {
            const num = parseInt(semanaMatch[1]);
            const data = globalDbMap[num];
            let tieneMaterial = false;
            if (data?.pdf_url) {
                try {
                    const list = Array.isArray(data.pdf_url) ? data.pdf_url : JSON.parse(data.pdf_url);
                    tieneMaterial = list.length > 0;
                } catch(e){}
            }

            if (isSemanasPage) {
                if (!tieneMaterial) {
                    addChatMessage(`La semana ${num} aún no tiene trabajos registrados.`, 'bot');
                } else {
                    addChatMessage(`Buscando los archivos de la semana ${num}...`, 'bot');
                    abrirModalMateriales(num);
                }
            } else {
                if (!tieneMaterial) {
                    addChatMessage(`La semana ${num} todavía no tiene contenido para mostrar.`, 'bot');
                } else {
                    addChatMessage(`Claro, Dylan. Vamos a la sección de trabajos para mostrarte la semana ${num}.`, 'bot');
                    setTimeout(() => window.location.href = `semanas.html?bot_action=semana&bot_val=${num}`, 1500);
                }
            }
            return;
        }

        // --- 2. NAVEGACIÓN GENERAL ---
        if (rawText.includes('inicio') || rawText.includes('home') || rawText.includes('principal')) {
            addChatMessage('Entendido, volviendo al inicio...', 'bot');
            window.location.href = 'index.html?nav=true';
        } else if (rawText.includes('semana') || rawText.includes('clase') || rawText.includes('unidad')) {
            addChatMessage('Abriendo el registro semanal...', 'bot');
            window.location.href = 'semanas.html?nav=true';
        } else if (rawText.includes('presentacion') || rawText.includes('presentación') || rawText.includes('sobre ti') || rawText.includes('quien eres') || rawText.includes('perfil')) {
            addChatMessage('Mostrando presentación personal y perfil profesional.', 'bot');
            window.location.href = 'presentacion.html?nav=true';
        } else if (rawText.includes('tecnologia') || rawText.includes('tecnología') || rawText.includes('stack') || rawText.includes('herramientas')) {
            addChatMessage('Cargando el stack tecnológico...', 'bot');
            window.location.href = 'tecnologias.html?nav=true';
        } else if (rawText.includes('admin') || rawText.includes('login') || rawText.includes('gestión')) {
            addChatMessage('Accediendo al portal de administración...', 'bot');
            window.location.href = 'login.html?nav=true';
        } 
        // --- 3. CAMBIO DE TEMAS POR VOZ/TEXTO ---
        else if (rawText.includes('tema') || rawText.includes('color') || rawText.includes('modo')) {
            if (rawText.includes('fuego') || rawText.includes('charizard')) { setTheme('charizard'); addChatMessage('¡Fuego activado! 🔥', 'bot'); }
            else if (rawText.includes('agua') || rawText.includes('greninja')) { setTheme('greninja'); addChatMessage('Modo ninja activado 💧', 'bot'); }
            else if (rawText.includes('planta') || rawText.includes('sceptile')) { setTheme('sceptile'); addChatMessage('Poder de la naturaleza activo 🌿', 'bot'); }
            else if (rawText.includes('oscuro') || rawText.includes('siniestro') || rawText.includes('darkrai')) { setTheme('darkrai'); addChatMessage('Regresando a las sombras...', 'bot'); }
            else {
                addChatMessage('¿Qué tema prefieres?', 'bot');
                addChatOptions([
                    {text: '🔥 Fuego', cmd: 'tema fuego'}, {text: '💧 Agua', cmd: 'tema agua'},
                    {text: '🌿 Planta', cmd: 'tema planta'}, {text: '🌑 Sombras', cmd: 'tema oscuro'}
                ]);
            }
        }
        // --- 4. SISTEMA DE AYUDA JERÁRQUICO Y DESCRIPTIVO ---
        else if (rawText.includes('ayuda') || rawText.includes('opciones') || rawText.includes('hola')) {
            
            // Nivel 2: Navegación y descripción detallada de contenidos
            if (rawText.includes('navegacion') || rawText.includes('páginas') || rawText.includes('paginas')) {
                addChatMessage("Esto es lo que encontrarás en cada sección de tu web:", 'bot');
                addChatMessage("🏠 **Inicio**: Portada principal y bienvenida al curso.\n" +
                               "👤 **Presentación de Dylan**: Perfil profesional, visión y habilidades técnicas.\n" +
                               "� **Tecnologías**: Detalle de las herramientas usadas (GitHub, Supabase, MySQL).\n" +
                               "📅 **Semanas**: Organización por unidades de todos tus trabajos y archivos PDF.", 'bot');
                addChatOptions([
                    {text: '👤 Perfil de Dylan', cmd: 'perfil'},
                    {text: '💻 Ver Tecnologías', cmd: 'tecnologias'},
                    {text: '📅 Ver Trabajos', cmd: 'semanas'}
                ]);
            } 
            
            // Nivel 2: Explicación de Acceso Administrativo
            else if (rawText.includes('admin') || rawText.includes('gestión')) {
                addChatMessage("¡Espera un momento! 🛡️ Para gestionar tus archivos, primero debes identificarte.", 'bot');
                addChatMessage("Es muy sencillo: ve a la página de **Login**, ingresa tu usuario y clave, y así podré darte acceso al panel para subir o borrar material.", 'bot');
                addChatOptions([
                    {text: '🔑 Ir al Login ahora', cmd: 'login'},
                    {text: '❓ Ayuda general', cmd: 'ayuda'}
                ]);
            }

            // Nivel 2: Temas y Personalización
            else if (rawText.includes('tema') || rawText.includes('color')) {
                addChatMessage("¡Cambiemos el estilo visual! Elige un tema para personalizar los colores de todo el portafolio:", 'bot');
                addChatOptions([
                    {text: '🔥 Modo Fuego', cmd: 'tema fuego'},
                    {text: '💧 Modo Agua', cmd: 'tema agua'},
                    {text: '🌿 Modo Bosque', cmd: 'tema planta'},
                    {text: '🌑 Modo Sombras', cmd: 'tema oscuro'}
                ]);
            }

            // Nivel 2: Configuración de Avatar
            else if (rawText.includes('avatar') || rawText.includes('gengar')) {
                addChatMessage("Puedes elegir si deseas que Gengar te acompañe visualmente o prefieres un estilo más limpio sin avatar:", 'bot');
                addChatOptions([
                    {text: '🙈 Ocultar Gengar', cmd: 'quitar gengar'},
                    {text: '👁️ Mostrar Gengar', cmd: 'mostrar gengar'},
                    {text: '❓ Ayuda general', cmd: 'ayuda'}
                ]);
            }

            // Menú Principal de Ayuda (Nivel 1)
            else {
                addChatMessage("¿En qué puedo asistirte? Elige una de estas categorías para darte más detalles:", 'bot');
                addChatOptions([
                    {text: '🌐 Contenido de Páginas', cmd: 'ayuda navegacion'},
                    {text: '📂 Localizar Trabajos', cmd: 'ayuda semanas'},
                    {text: '🎨 Estilos y Colores', cmd: 'ayuda tema'},
                    {text: '👤 Avatar Gengar', cmd: 'ayuda avatar'},
                    {text: '🛡️ Panel de Control', cmd: 'ayuda admin'}
                ]);
            }
        } 
        
        // --- 5. COMANDOS DIRECTOS DE AVATAR ---
        else if ((rawText.includes('avatar') || rawText.includes('gengar')) && 
                 (rawText.includes('quitar') || rawText.includes('ocultar') || rawText.includes('sin') || 
                  rawText.includes('poner') || rawText.includes('mostrar') || rawText.includes('con'))) {
            if (rawText.includes('quitar') || rawText.includes('ocultar') || rawText.includes('sin')) {
                toggleAvatarVisibility(false);
                addChatMessage('Hecho. Gengar se ha retirado a las sombras. El chat ahora está en modo minimalista.', 'bot');
            } else {
                toggleAvatarVisibility(true);
                addChatMessage('¡Gengar ha vuelto! Aquí estaré para acompañarte nuevamente.', 'bot');
            }
        }
        
        // Respuesta de respaldo
        else {
            addChatMessage('No logré descifrar esa petición... ¿Deseas ver alguna de estas secciones?', 'bot');
            addChatOptions([
                {text: '👤 Perfil de Dylan', cmd: 'perfil'},
                {text: '📅 Ver Semanas', cmd: 'semanas'},
                {text: '❓ Ver Ayuda', cmd: 'ayuda'}
            ]);
        }
    }, 600);
}

// RECONOCIMIENTO DE VOZ
let recognitionInstance = null; // Variable global para controlar la sesión activa

function startVoiceRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert("Tu navegador no soporta reconocimiento de voz.");
        return;
    }

    const btnVoice = document.getElementById('btn-voice');

    // Lógica de Toggle: Si ya está grabando, lo detenemos manualmente
    if (recognitionInstance) {
        recognitionInstance.stop();
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    // continuous: true evita que se corte al hacer pausas medias
    recognition.continuous = true; 
    recognition.interimResults = false;

    let totalTranscript = ""; // Acumulador de texto

    recognition.onstart = () => {
        recognitionInstance = recognition;
        btnVoice.innerText = '🛑';
        btnVoice.style.borderColor = 'red';
        btnVoice.title = "Terminar de hablar y enviar";
    };

    recognition.onresult = (event) => {
        // Recorremos los resultados para ir armando la frase completa
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                totalTranscript += event.results[i][0].transcript + " ";
            }
        }
    };

    recognition.onend = () => {
        recognitionInstance = null;
        btnVoice.innerText = '🎤';
        btnVoice.style.borderColor = 'var(--accent)';
        btnVoice.title = "Hablar";

        // Solo procesamos si realmente se capturó algo
        const comandoFinal = totalTranscript.trim();
        if (comandoFinal) {
            addChatMessage(comandoFinal, 'user');
            procesarComando(comandoFinal.toLowerCase());
        }
    };

    recognition.onerror = (event) => {
        console.error("Error de voz:", event.error);
        
        let mensajeExplicativo = "";
        switch (event.error) {
            case 'network':
                mensajeExplicativo = "Gengar detectó interferencia: Hay un problema con tu conexión a internet o con el servidor de voz del navegador.";
                break;
            case 'not-allowed':
                mensajeExplicativo = "¡Micrófono bloqueado! Por favor, haz clic en el candado de la barra de direcciones y permite el acceso al micrófono.";
                break;
            case 'no-speech':
                mensajeExplicativo = "No logré escucharte. Asegúrate de que tu micrófono esté bien conectado y habla un poco más fuerte.";
                break;
            case 'audio-capture':
                mensajeExplicativo = "No se detectó ningún micrófono físico. Revisa si está bien conectado.";
                break;
            case 'service-not-allowed':
                mensajeExplicativo = "El servicio de voz no está disponible en este momento. Intenta escribir el comando.";
                break;
            default:
                mensajeExplicativo = "Hubo un error espectral (" + event.error + "). Intenta recargar la página.";
        }

        addChatMessage(mensajeExplicativo, 'bot');
        recognitionInstance = null;
        btnVoice.innerText = '🎤';
        btnVoice.style.borderColor = 'var(--accent)';
    };

    recognition.start();
}
