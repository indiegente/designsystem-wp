# Changelog

Todas las mejoras notables de este proyecto estarán documentadas en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v1.3.0] - 2025-01-29

### 🆕 Conversión Avanzada Lit → PHP

#### Added
- **Conversión automática de métodos JavaScript** como `renderStars()` a PHP loops
- **Manejo inteligente de condicionales complejos** con templates anidados (`${item.prop ? html`...` : html`...`}`)
- **Conversión de arrays y map()** a foreach PHP con validaciones automáticas
- **Escape automático según contexto** (esc_html, esc_url, esc_attr) 
- **Detección de métodos como charAt().toUpperCase()** y conversión a PHP nativo
- **Conversión genérica de templates** sin hardcode específico por componente

#### Fixed
- **Templates testimonials** ya no muestran `${this.renderStars(testimonial.rating)}` literal
- **Condicionales complejos con avatars** se convierten correctamente a PHP
- **Métodos JavaScript** se convierten a PHP inline apropiadamente
- **Template strings** de Lit se convierten completamente a PHP válido

### 🆕 SEO Dinámico Completo

#### Added
- **SEO Manager** completamente automático con detección inteligente de templates
- **Meta tags específicos por página** usando configuración desde `seo-config.json`
- **JSON-LD estructurado automático** con Schema.org (Organization, Course, Review)
- **Detección robusta de template** usando `global $template` con múltiples fallbacks
- **Meta tags OpenGraph y Twitter Cards** completamente configurados
- **Canonical URLs y robots meta** automáticos por página

#### Fixed
- **SEO Manager detección de templates** ahora usa `getCurrentTemplateSlug()` correctamente
- **Meta tags específicos por template** se cargan sin errores
- **JSON-LD estructurado** se genera apropiadamente para cada tipo de página
- **Template slug detection** funciona con Template Name y file-based templates

### 🛠️ Configuración Client-Agnostic

#### Added
- **ConfigManager dinámico** que lee configuración del proyecto automáticamente
- **Detección automática de nombre** del proyecto desde package.json
- **Variables de entorno soportadas** para override de configuración
- **Prefijos dinámicos** generados automáticamente sin hardcode
- **Generación completamente adaptable** a cualquier proyecto

#### Enhanced
- **Asset Management mejorado** con ES6 modules preferidos sobre UMD
- **Single script loading** para evitar conflictos de custom elements
- **Asset manifest con hashes únicos** para cache busting eficiente

### 🏗️ Reorganización de Arquitectura

#### Changed
- **Scripts organizados** en subdirectorios por funcionalidad:
  - `scripts/storybook/` - Herramientas de Storybook
  - `scripts/config/` - Configuración y builds
  - `scripts/validation/` - Validación y testing
  - `scripts/wp-generator/` - Generador WordPress
- **Package.json actualizado** con nuevas rutas organizadas
- **Compatibilidad mantenida** con comandos npm existentes

#### Fixed
- **Node.js 24 compatibility** completamente implementada
- **Vite 7 support** con regeneración de node_modules
- **Script paths actualizados** para nueva estructura organizacional

### 🔧 Asset Management

#### Enhanced  
- **ES6 modules preferidos** sobre UMD para mejor compatibilidad con browsers modernos
- **Detección automática de assets** con preferencia por versiones ES6
- **Single script loading** implementado para evitar conflictos de custom elements
- **Type="module" attributes** añadidos automáticamente para ES6 scripts
- **Asset manifest coordination** entre Vite builds y WordPress templates

#### Fixed
- **Duplicate script loading** que causaba errores de custom element registry
- **JavaScript module loading** errors con "Unexpected token 'export'"
- **Asset file name resolution** usando manifest dinámico en lugar de hardcode

## [v1.2.x] - Versiones Anteriores

### 🔒 Sistema de Validación PHP Completo

#### Added
- **Validación automática de sintaxis PHP** durante la generación de temas WordPress
- **PHPValidator class** con validación en tiempo real usando `php -l`  
- **Pre-validación de patrones problemáticos** antes de la validación CLI
- **Rollback automático completo** cuando se detectan errores de validación
- **Reportes detallados de validación** con información específica de errores
- **Detección de null pointers** en variables globales de WordPress
- **Validación de métodos existentes** antes de llamar funciones en objetos
- **Comando de validación interactiva** `npm run wp:validate-php`
- **Limpieza automática de CSS** para componentes Web Components

#### Fixed
- **JavaScript keywords en contexto PHP** que causaban errores de IDE
  - Problema: `gtag('config', 'GA_ID', {...})` en templates causaba error "unexpected identifier config"
  - Solución: Encapsular JavaScript en `echo` statements para evitar conflictos de parsing
- **CSS de Web Components en WordPress**:
  - Problema: Selector `:host` y estructura CSS malformada en archivos PHP
  - Solución: Limpieza automática que remueve `:host` y corrige estructura de selectores
- **Variables globales sin validación**:
  - Problema: `$toulouse_seo->generateMetaTags()` causaba null pointer exceptions
  - Solución: Validación automática con `if ($var && method_exists($var, 'method'))`
- **Comillas no balanceadas** en statements echo de PHP
- **Etiquetas PHP incompletas** y estructura incorrecta de bloques PHP
- **Selectores CSS duplicados** y estructura malformada en componentes

#### Enhanced
- **ComponentGenerator** con limpieza mejorada de CSS para WordPress
- **Template generation** con mejor manejo de JavaScript embebido
- **Error reporting** con contexto específico y sugerencias de corrección
- **Validation pipeline** integrado en el proceso de generación principal
- **CSS structure cleanup** que asegura llaves balanceadas y selectores válidos

### 🛠️ Mejoras en Generación de Componentes

#### Added
- **Limpieza automática de CSS** para conversión de Lit Components a WordPress
- **Detección de patrones Web Components** (`:host`, selectores mal formados)
- **Validación de estructura CSS** con corrección automática de llaves
- **Filtrado de selectores inválidos** y líneas CSS vacías

#### Fixed
- **Duplicated CSS selectors** en componentes generados
- **CSS structure issues** con selectores sin llaves de cierre
- **Media queries malformadas** en componentes responsive
- **CSS property formatting** para compatibilidad con WordPress

### 🔧 Mejoras en el Sistema de Templates

#### Added
- **Validación de templates PHP** antes de escribir archivos
- **Error handling mejorado** con rollback automático en fallos
- **Template syntax checking** para prevenir errores de deployment

#### Fixed
- **PHP template generation** con mejor manejo de contenido mixto (HTML + JS + PHP)
- **Functions.php generation** con JavaScript correctamente encapsulado
- **SEO templates** con validación de sintaxis y runtime errors

### 📊 Reportes y Debugging

#### Added
- **Comprehensive validation reports** con estadísticas detalladas
- **Error categorization** con soluciones específicas para cada tipo
- **Success rate tracking** para monitorear calidad del código generado
- **Interactive validation mode** con sugerencias de corrección en tiempo real

#### Enhanced
- **Logging system** con información contextual para debugging
- **Error messages** más descriptivos con números de línea específicos
- **Validation feedback** con explicación de patrones problemáticos detectados

### 🚀 Optimizaciones de Performance

#### Improved
- **Validation pipeline** optimizado para ejecutar en paralelo
- **CSS processing** más eficiente con algoritmos mejorados
- **File writing** con validación previa para evitar rollbacks costosos
- **Memory usage** optimizado para proyectos grandes

### 📚 Documentación

#### Added
- **Comprehensive PHP validation guide** in EXTENSIONS_GUIDE.md
- **Error pattern documentation** con ejemplos antes/después
- **Validation workflow documentation** para desarrolladores
- **Troubleshooting guide** para errores comunes de validación

#### Updated
- **README.md** con información completa del sistema de validación
- **Command documentation** con nuevos comandos de validación
- **Error handling examples** en documentación de extensiones

## [1.0.0] - 2024-01-XX

### Added
- Sistema base de generación WordPress desde Lit Components
- Component metadata system
- Design tokens centralizados
- Storybook integration
- Asset management system
- Extension system básico

### Features
- Conversión automática Lit → PHP
- Generación de Custom Post Types
- SEO automático por template
- Sistema de validación básico

---

## Tipos de Cambios

- `Added` - Nuevas características
- `Changed` - Cambios en funcionalidad existente  
- `Deprecated` - Características que serán removidas
- `Removed` - Características removidas
- `Fixed` - Corrección de bugs
- `Security` - Correcciones de seguridad
- `Enhanced` - Mejoras en características existentes