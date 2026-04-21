// ============================================
// 1. LÓGICA DE ACCESO
// ============================================
const CREDENCIALES = { user: "admin", pass: "123" };

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
// 2. CONFIGURACIÓN SUPABASE
// ============================================
const SUPABASE_URL = 'https://iuemugmiuxzqwwhlbtcn.supabase.co'; 
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1ZW11Z21pdXh6cXd3aGxidGNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3MDk1MzAsImV4cCI6MjA5MjI4NTUzMH0.mONcS-nszajACwOXdnUJotVJBvn69wfVkrEtUtR0Y_s";
let dbClient = null;
const BUCKET_NAME = 'materiales';

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

function esperarLibreria(maxIntentos = 30) {
    return new Promise((resolve) => {
        let intentos = 0;
        const intervalo = setInterval(() => {
            if (window.supabase) { clearInterval(intervalo); resolve(true); }
            else if (intentos >= maxIntentos) { clearInterval(intervalo); resolve(false); }
            intentos++;
        }, 200);
    });
}

async function conectarBaseDeDatos() {
    console.log("🔄 Conectando a Supabase...");
    
    const libreriaCargada = await esperarLibreria();
    if (!libreriaCargada || !window.supabase) {
        console.error("❌ Librería Supabase no cargada");
        mostrarMensajeUI("Error: Librería no cargada", "error");
        return false;
    }
    
    try {
        dbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
            auth: { persistSession: false }
        });
        
        // Probar conexión
        const { error } = await dbClient.from('semanas').select('count').limit(1);
        if (error && !error.message.includes('relation')) throw error;
        
        console.log("✅ Conectado a Supabase");
        mostrarMensajeUI("Conectado a Supabase", "success");
        
        // Verificar bucket
        await verificarOCrearBucket();
        
        // Cargar semanas si hay contenedores
        if (document.getElementById('semanas-u1') || document.getElementById('admin-u1')) {
            await cargarSemanas();
        }
        
        return true;
    } catch (error) {
        console.error("Error conexión:", error);
        mostrarMensajeUI("Error de conexión", "error");
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
async function cargarSemanas() {
    if (!dbClient) { await conectarBaseDeDatos(); if (!dbClient) return; }
    
    try {
        const { data: semanasDB, error } = await dbClient.from('semanas').select('*').order('id', { ascending: true });
        if (error) throw error;
        
        const dbMap = {};
        semanasDB.forEach(item => { dbMap[item.id] = item; });
        
        const DEFAULT_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='120' viewBox='0 0 200 120'%3E%3Crect width='200' height='120' fill='%23333'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' fill='%23666' dy='.3em'%3ESemana%3C/text%3E%3C/svg%3E";
        
        const esAdmin = !!document.getElementById('admin-u1');
        
        const crearTarjeta = (num) => {
            const numeral = num < 10 ? '0' + num : num;
            const data = dbMap[num];
            const imgFinal = data?.img_url || DEFAULT_IMAGE;
            const pdfFinal = data?.pdf_url;
            const tienePDF = !!pdfFinal;
            
            let textoBoton = tienePDF ? "📄 Ver PDF" : "🔒 Sin material";
            
            const inner = `
                <div class="card" style="opacity: ${data ? 1 : 0.7}">
                    <img src="${imgFinal}" class="card-img" alt="Semana ${numeral}" 
                         onerror="this.src='${DEFAULT_IMAGE}'">
                    <div class="card-body">
                        <h3>Semana ${numeral}</h3>
                        ${!esAdmin ? 
                            `<button class="btn-view-pdf" ${tienePDF ? `onclick="window.open('${pdfFinal}','_blank')"` : 'disabled'}>
                                ${textoBoton}
                            </button>` :
                            `<button class="btn-delete" onclick="eliminarRegistro(${num})">
                                🗑️ Borrar
                            </button>`
                        }
                    </div>
                </div>`;
            return `<div class="electric-border-container"><div class="electric-border-inner">${inner}</div></div>`;
        };
        
        for (let u = 1; u <= 4; u++) {
            const contAdm = document.getElementById(`admin-u${u}`);
            const contSem = document.getElementById(`semanas-u${u}`);
            let html = "";
            for (let i = (u - 1) * 4 + 1; i <= u * 4; i++) html += crearTarjeta(i);
            if (contAdm) contAdm.innerHTML = html;
            if (contSem) contSem.innerHTML = html;
        }
        
        console.log("✅ Semanas cargadas");
    } catch (e) { console.error("Error cargando semanas:", e); }
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
        
        // Subir imagen
        if (imgIn && imgIn.files.length > 0) {
            const file = imgIn.files[0];
            const ext = file.name.split('.').pop();
            const nombre = `imagenes/img_${semId}_${Date.now()}.${ext}`;
            const { error } = await dbClient.storage.from(BUCKET_NAME).upload(nombre, file, { upsert: true });
            if (error) throw error;
            const { data: urlData } = dbClient.storage.from(BUCKET_NAME).getPublicUrl(nombre);
            updates.img_url = urlData.publicUrl;
        }
        
        // Subir PDF
        if (pdfIn && pdfIn.files.length > 0) {
            const file = pdfIn.files[0];
            const ext = file.name.split('.').pop();
            const nombre = `pdfs/pdf_${semId}_${Date.now()}.${ext}`;
            const { error } = await dbClient.storage.from(BUCKET_NAME).upload(nombre, file, { upsert: true });
            if (error) throw error;
            const { data: urlData } = dbClient.storage.from(BUCKET_NAME).getPublicUrl(nombre);
            updates.pdf_url = urlData.publicUrl;
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
// 5. ELIMINAR REGISTRO
// ============================================
async function eliminarRegistro(id) {
    if (!dbClient) return;
    if (!confirm(`¿Eliminar TODO el contenido de la semana ${id}?`)) return;
    
    try {
        const { data: semana } = await dbClient.from('semanas').select('img_url, pdf_url').eq('id', id).single();
        
        if (semana?.img_url) {
            const path = semana.img_url.split('/materiales/')[1];
            if (path) await dbClient.storage.from(BUCKET_NAME).remove([path]);
        }
        if (semana?.pdf_url) {
            const path = semana.pdf_url.split('/materiales/')[1];
            if (path) await dbClient.storage.from(BUCKET_NAME).remove([path]);
        }
        
        await dbClient.from('semanas').delete().eq('id', id);
        alert(`✅ Semana ${id} eliminada`);
        location.reload();
    } catch (error) {
        alert("Error al eliminar: " + error.message);
    }
}

// ============================================
// 6. INICIALIZACIÓN
// ============================================
window.onload = () => {
    conectarBaseDeDatos();
};

// Efecto Aura
document.addEventListener('mousemove', (e) => {
    const aura = document.querySelector('.mouse-aura');
    if (aura) {
        aura.style.setProperty('--mouse-x', `${(e.clientX / window.innerWidth) * 100}%`);
        aura.style.setProperty('--mouse-y', `${(e.clientY / window.innerHeight) * 100}%`);
    }
});










