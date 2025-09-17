# Claude Instructions - Toulouse Design System

## 🚨 REGLAS CRÍTICAS - FAIL FAST CON CALIDAD PROFESIONAL

**NUNCA usar fallbacks silenciosos. SIEMPRE fallar rápido con errores claros. SOLO generar código que pase TODAS las validaciones profesionales.**

### ❌ PROHIBIDO:
- Fallbacks que oculten errores
- Continuar generación con errores 
- Generar archivos parciales o incorrectos
- Reportar éxito si falta alguna dependencia
- Usar `console.warn()` para errores críticos
- Generar tema sin pasar PHPCS + Lighthouse + validaciones

### ✅ OBLIGATORIO:
- **Fail fast** con `throw new Error()`
- **Rollback completo** si algo falla
- **Mensajes específicos** con ubicación y solución
- **Validación estricta** de todas las dependencias
- **Calidad profesional garantizada** antes de reportar éxito

## 🔧 CONFIGURACIÓN DEL PROYECTO MODERNIZADA

### Node.js Version - OBLIGATORIO
```bash
nvm use 24  # SIEMPRE ejecutar ANTES de cualquier generación
```

### ⚠️ SECUENCIA ACTUALIZADA - UN SOLO COMANDO:
```bash
npm run wp:generate  # Todo incluido: generación + PHPCS + validación híbrida
```

### Dependencias Auto-Gestionadas
- **Lighthouse**: Incluido en `package.json` devDependencies
- **Composer**: Auto-instalación con `npm run setup:composer`
- **PHPCS**: Auto-instalación con `npm run setup:phpcs`

### Estructura Actual (Post-Modernización)
```
scripts/wp-generator/
├── core/               # config.js (con fail-fast), config-manager.js
├── managers/           # analytics-manager.js, seo-editable-manager.js, asset-manager.js (modernizado)
├── validation/         # validator.js, validation-manager.js, php-validator.js
├── templates/          # php-components.js, functions-template.js, dynamic-page-templates.js
├── extensions/         # Sistema de extensiones
│   └── analytics/      # ga4-data-layer.js, facebook-pixel.js, custom-events.js
└── index.js           # Con validaciones profesionales integradas
```

### Asset Manager Modernizado
- **Delegación a Vite**: Minificación, tree-shaking, cache-busting
- **Sin reinvención**: Solo integración WordPress
- **Rutas corregidas**: Assets en `wordpress-output/toulouse-lautrec/assets/`

## 📋 COMANDOS ACTUALIZADOS

```bash
# 🚀 COMANDO PRINCIPAL - Full workflow con calidad profesional
npm run wp:generate     # Genera + PHPCS + validación híbrida

# 🔧 Setup para nuevos desarrolladores  
npm install             # Instala Lighthouse automáticamente
npm run setup           # Instala Composer + PHPCS si es necesario

# 🧪 Validaciones específicas
npm run wp:validate     # Validación híbrida (managers + professional tools)
npm run wp:test-urls    # Test de URLs en WordPress vivo
npm run wp:lint         # Solo PHPCS
npm run wp:lint:fix     # Solo auto-fix PHPCS
```

## 🎯 VALIDACIONES PROFESIONALES INTEGRADAS

### Criterios de Éxito Estrictos (TODOS obligatorios)
1. ✅ **Sintaxis PHP 100% válida** (`php -l`)
2. ✅ **PHPCS auto-fix exitoso** (14,000+ errores corregidos)
3. ✅ **Validación híbrida EXCELLENT** (100% managers funcionando)
4. ✅ **Assets optimizados funcionando** (CSS, JS, Design Tokens)
5. ✅ **Dependencias verificadas** (Composer, Lighthouse disponibles)

### Flujo de Validación en `npm run wp:generate`
```javascript
// En scripts/wp-generator/index.js
if (allValidationsPass) {
  // 9. PHPCS auto-fix (14,000+ errores corregidos)
  await this.runPHPCSAutoFix();
  
  // 10. Validación híbrida (managers + professional tools)
  await this.runHybridValidation();
  
  // Solo reportar éxito si TODO funciona
  if (qualityValidationsPassed) {
    console.log('🚀 Tema listo para producción con calidad profesional');
  } else {
    throw new Error('❌ VALIDACIONES DE CALIDAD FALLARON');
  }
}
```

## 🔍 SISTEMA DE VALIDACIÓN HÍBRIDA

### Herramientas Profesionales
- **PHPCS**: WordPress Coding Standards (auto-fix integrado)
- **Lighthouse**: Performance, SEO, Accessibility
- **Validaciones específicas**: Managers de funcionalidad

### Estados Estrictos
- **✅ EXCELLENT**: Solo si todos los managers pasan al 100%
- **❌ ERROR**: Cualquier dependencia faltante o proceso fallido
- **🔄 ROLLBACK**: Limpieza automática completa

## 📁 ESTRUCTURA DE ARCHIVOS CORREGIDA

### Eliminaciones Realizadas
- ❌ **Carpeta `templates/` vacía** en wordpress-output (innecesaria)
- ❌ **Archivos debug*** (temporales de desarrollo)
- ❌ **Carpeta wp:validate/** (obsoleta)

### Ubicaciones Correctas
- ✅ **Templates WordPress**: En raíz del tema (`page-*.php`, `functions.php`)
- ✅ **Assets optimizados**: En `wordpress-output/toulouse-lautrec/assets/`
- ✅ **Design tokens**: Copiados desde `src/tokens/design-tokens.css`

## 🎯 CUANDO EDITAR ARCHIVOS

**SIEMPRE leer `.rules` antes de modificar el generador WordPress.**

### Orden de prioridad para leer archivos:
1. **`.rules`** - Reglas críticas del proyecto
2. **`scripts/wp-generator/core/config.js`** - Configuración central
3. **`src/metadata.json`** - Metadata de componentes (fieldTypes)
4. **`src/page-templates.json`** - Configuración SEO page-level y datos (dataSources)
5. **`package.json`** - Scripts y dependencias actualizadas

### Arquitectura SEO Integrada (Nueva)
- **SEO page-level**: Configuración SEO movida de component-level a page-level en `page-templates.json`
- **SEO Editable Manager**: Sistema unificado que combina gestión de metadatos y campos ACF
- **Configuración declarativa**: Eliminación de hooks complejos en favor de metadata simple
- **Capacidad de edición total**: SEO Manager puede editar títulos, descripciones, H1-H3 y contenido textual via ACF

### WordPress Best Practices Aplicadas
- ✅ **Escapado obligatorio**: `esc_html()`, `esc_url()`, `esc_attr()`
- ✅ **Internacionalización**: `__()`, `_e()` con text-domain
- ✅ **get_template_part()** en lugar de `require_once`
- ✅ **Nonce de seguridad** para scripts inline
- ✅ **wp_head hooks seguros** en lugar de `echo` directo

## 🚨 ERROR HANDLING MODERNIZADO

```javascript
// Template para validaciones profesionales
async runPHPCSAutoFix() {
  // Verificar dependencias
  if (!fs.existsSync('composer.phar')) {
    // Auto-instalación
    execSync('npm run setup:composer');
  }
  
  // Validar resultado estricto
  const fixedCount = parseInt(fixedMatch[1]) || 0;
  if (fixedCount > 0) {
    console.log(`✅ PHPCS: ${fixedCount} errores corregidos`);
    return true;
  }
  
  throw new Error('❌ PHPCS FALLÓ: Sin correcciones aplicadas');
}

// Template para rollback completo
if (error) {
  await this.rollbackGeneration(); // Limpia wordpress-output completo
  throw new Error(`❌ GENERACIÓN FALLÓ: ${error.message}`);
}
```

## 📦 DEPENDENCIAS PARA NUEVOS DESARROLLADORES

### Setup Automático
```bash
# 1. Dependencias principales
npm install  # Incluye Lighthouse automáticamente

# 2. Herramientas WordPress (si es necesario)
npm run setup  # Instala Composer + PHPCS

# 3. Generación con calidad profesional
npm run wp:generate  # Todo incluido
```

### Verificación de Dependencias
- **Node.js 24+**: Requerido (verificado automáticamente)
- **Lighthouse**: Instalado localmente via npm
- **Composer**: Auto-instalado si falta
- **PHPCS**: Auto-configurado con WordPress Standards

---

**🎯 OBJETIVO: CALIDAD PROFESIONAL GARANTIZADA**

- **Un solo comando**: `npm run wp:generate`
- **Calidad real**: Solo éxito si TODO funciona
- **Rollback automático**: Sin archivos parciales
- **Dependencias auto-gestionadas**: Setup transparente

**✅ ESTADO: PRODUCCIÓN-READY CON ESTÁNDARES PROFESIONALES**