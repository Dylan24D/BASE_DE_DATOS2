// ============================================
// SUPABASE.JS - CON REINTENTOS Y URLS CORRECTAS
// ============================================

(function() {
    const urls = [
        "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js",
        "https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.js",
        "https://cdnjs.cloudflare.com/ajax/libs/supabase-js/2.39.7/umd/supabase.js"
    ];
    
    let intento = 0;
    
    function cargarScript() {
        if (intento >= urls.length) {
            console.error("❌ Todas las URLs fallaron");
            mostrarError("No se pudo cargar Supabase. Verifica tu conexión a internet.");
            return;
        }
        
        const url = urls[intento];
        console.log(`🔄 Intento ${intento + 1}: cargando desde ${url}`);
        
        const script = document.createElement('script');
        script.src = url;
        script.async = true;
        
        script.onload = function() {
            setTimeout(() => {
                if (window.supabase) {
                    console.log("🎉 Supabase cargado exitosamente desde:", url);
                    window.dispatchEvent(new Event('supabase-cargado'));
                } else {
                    console.warn(`⚠️ Script cargado pero window.supabase no disponible desde: ${url}`);
                    intento++;
                    cargarScript();
                }
            }, 300);
        };
        
        script.onerror = function() {
            console.warn(`❌ Error cargando desde: ${url}`);
            intento++;
            cargarScript();
        };
        
        document.head.appendChild(script);
    }
    
    function mostrarError(mensaje) {
        const errorDiv = document.createElement('div');
        errorDiv.style.position = 'fixed';
        errorDiv.style.bottom = '10px';
        errorDiv.style.right = '10px';
        errorDiv.style.backgroundColor = '#ff4444';
        errorDiv.style.color = 'white';
        errorDiv.style.padding = '12px 20px';
        errorDiv.style.borderRadius = '8px';
        errorDiv.style.zIndex = '9999';
        errorDiv.style.fontFamily = 'monospace';
        errorDiv.style.fontSize = '13px';
        errorDiv.innerHTML = `⚠️ ${mensaje}`;
        document.body.appendChild(errorDiv);
    }
    
    cargarScript();
})();
