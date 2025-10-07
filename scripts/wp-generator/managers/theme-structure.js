const fs = require('fs');
const path = require('path');

/**
 * ThemeStructure - Crea estructura de tema WordPress
 *
 * RESPONSABILIDAD ÚNICA:
 * - Crear directorios del tema
 * - Generar style.css OBLIGATORIO (solo metadata + estilos mínimos)
 * - NO maneja assets (eso es responsabilidad de AssetManager)
 *
 * ARQUITECTURA ROBUSTA:
 * - NO duplica responsabilidades de AssetManager
 * - Fail-fast si falta configuración crítica
 * - Usa templates externos (NO hardcodea CSS)
 */
class ThemeStructure {
  constructor(config) {
    this.config = config;
  }

  create() {
    const themeDir = path.join(this.config.outputDir, this.config.themeName);

    const directories = [
      '',
      'assets/css',
      'assets/js',
      'assets/img',
      'components',
      'inc'
    ];

    directories.forEach(dir => {
      const fullPath = path.join(themeDir, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    });

    // 🚨 OBLIGATORIO: Generar style.css para WordPress
    this.generateWordPressStyleCSS(themeDir);

    console.log('📁 Estructura del tema creada');
  }

  /**
   * 🚨 CRÍTICO: Genera style.css OBLIGATORIO para WordPress
   *
   * WordPress NO reconoce el tema sin este archivo en la raíz.
   * Este archivo es SOLO metadata + estilos mínimos.
   * Los CSS reales son responsabilidad de AssetManager.
   *
   * @see https://developer.wordpress.org/themes/basics/main-stylesheet-style-css/
   */
  generateWordPressStyleCSS(themeDir) {
    const styleCSSPath = path.join(themeDir, 'style.css');

    // Validar configuración crítica - Fail Fast
    if (!this.config.themeName) {
      throw new Error(`❌ STYLE.CSS ERROR: themeName es OBLIGATORIO
📍 Ubicación: scripts/wp-generator/core/config-singleton.js
💡 Solución: Definir themeName en configuración
🚨 SIN FALLBACKS: Configuración completa es OBLIGATORIA`);
    }

    // Generar style.css con metadata de WordPress
    const styleCSS = this.buildWordPressStyleCSS();

    fs.writeFileSync(styleCSSPath, styleCSS, 'utf8');
    console.log('✅ style.css generado (WordPress metadata)');
  }

  /**
   * Construye contenido de style.css
   * SOLO metadata de WordPress + estilos mínimos obligatorios
   * NO incluye CSS de componentes (eso lo maneja AssetManager)
   */
  buildWordPressStyleCSS() {

    // 1. Metadata de WordPress (OBLIGATORIA)
    const header = `/*
Theme Name: ${this.config.themeDisplayName || this.config.themeName}
Theme URI: ${this.config.themeURI || ''}
Author: ${this.config.themeAuthor || 'Auto-generated'}
Author URI: ${this.config.authorURI || ''}
Description: ${this.config.themeDescription || 'Tema generado automáticamente desde componentes Lit'}
Version: ${this.config.themeVersion || '1.0.0'}
Requires at least: 5.9
Tested up to: 6.4
Requires PHP: 8.0
License: ${this.config.themeLicense || 'GNU General Public License v2 or later'}
License URI: ${this.config.licenseURI || 'http://www.gnu.org/licenses/gpl-2.0.html'}
Text Domain: ${this.config.textDomain || this.config.themeName}
Tags: ${this.config.themeTags || 'custom-theme, lit-components, design-system'}
*/`;

    // 2. Documentación del sistema
    const documentation = `

/**
 * ⚠️ IMPORTANTE: Este archivo es SOLO para metadata de WordPress
 *
 * Los estilos reales del tema son manejados por AssetManager:
 * - Componentes Lit → import './component.css'
 * - Vite build → dist/css/*.css (optimizado + cache-busting)
 * - AssetManager → copia a wordpress-output/assets/css/
 * - asset-enqueue.php → wp_enqueue_style()
 *
 * ❌ NO AGREGAR ESTILOS AQUÍ
 * ✅ Modificar: src/components/[component]/[component].css
 * ✅ Regenerar: npm run build && npm run wp:generate
 */`;

    // 3. Estilos mínimos de WordPress (OBLIGATORIOS)
    // TODO: Mover a template externo si crece (actualmente mínimo necesario)
    const minimalStyles = `

/* WordPress Reset Mínimo - OBLIGATORIO */
*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  line-height: 1.6;
}

/* WordPress Alignment - OBLIGATORIO para editor */
.alignleft { float: left; margin-right: 1.5em; }
.alignright { float: right; margin-left: 1.5em; }
.aligncenter { display: block; margin: 0 auto; }

/* Screen Reader - OBLIGATORIO para accesibilidad (WCAG) */
.screen-reader-text {
  clip: rect(1px, 1px, 1px, 1px);
  position: absolute !important;
  height: 1px;
  width: 1px;
  overflow: hidden;
}

.screen-reader-text:focus {
  clip: auto !important;
  display: block;
  height: auto;
  width: auto;
  z-index: 100000;
}
`;

    return header + documentation + minimalStyles;
  }
}

module.exports = ThemeStructure;