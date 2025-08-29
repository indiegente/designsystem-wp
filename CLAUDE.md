# Claude Instructions - Toulouse Design System

## 🚨 REGLAS CRÍTICAS - FAIL FAST

**NUNCA usar fallbacks silenciosos. SIEMPRE fallar rápido con errores claros.**

### ❌ PROHIBIDO:
- Fallbacks que oculten errores
- Continuar generación con errores 
- Generar archivos parciales o incorrectos
- Usar `console.warn()` para errores críticos

### ✅ OBLIGATORIO:
- **Fail fast** con `throw new Error()`
- **Rollback completo** si algo falla
- **Mensajes específicos** con ubicación y solución
- **Validación estricta** de configuración

## 🔧 CONFIGURACIÓN DEL PROYECTO

### Node.js Version - OBLIGATORIO
```bash
nvm use 24  # SIEMPRE ejecutar ANTES de cualquier generación
```

### ⚠️ SECUENCIA OBLIGATORIA:
1. **PRIMERO**: `nvm use 24`
2. **DESPUÉS**: `npm run wp:generate`
3. **VALIDAR**: `npm run wp:test-urls`

### Estructura de Archivos (Post-Reorganización)
```
scripts/wp-generator/
├── core/               # config.js, index.js
├── managers/           # analytics-manager.js, seo-manager.js, asset-manager.js
├── validation/         # php-validator.js, validation-manager.js  
├── templates/          # component-generator.js, template-builder.js
├── extensions/         # Sistema de extensiones
│   └── analytics/      # ga4-data-layer.js, facebook-pixel.js, custom-events.js
└── legacy/             # Archivos deprecados
```

### Analytics vs SEO Separation
- **Analytics Manager**: GA4, eventos, tracking (configurado desde config.js)
- **SEO Manager**: Meta tags, JSON-LD, structured data (puro)

## 📋 COMANDOS IMPORTANTES

```bash
npm run wp:generate      # Generar tema (fail-fast habilitado)
npm run wp:validate-php  # Validar sintaxis PHP (configurado dinámicamente)
npm run wp:test-urls     # Probar URLs en WordPress vivo
```

## 🎯 CUANDO EDITAR ARCHIVOS

**SIEMPRE leer `.rules` antes de modificar el generador WordPress.**

### Orden de prioridad para leer archivos:
1. `.rules` - Reglas críticas del proyecto
2. `scripts/wp-generator/core/config.js` - Configuración central
3. `src/component-metadata.json` - Metadata de componentes
4. Archivos específicos según la tarea

## 🚨 ERROR HANDLING OBLIGATORIO

```javascript
// Template obligatorio para managers
if (!requiredConfig) {
    throw new Error(`❌ CONFIGURACIÓN FALTANTE: ${missingItem} requerido en ${fileLocation}`);
}

// Con rollback si es necesario
try {
    await generateFiles();
} catch (error) {
    await rollbackGeneration();
    throw new Error(`❌ GENERACIÓN FALLÓ: ${error.message}\n💡 Ejecutar: ${suggestedCommand}`);
}
```

---

**🎯 OBJETIVO: 100% funcionalidad o error claro con rollback completo**