/**
 * ConfigSingleton - Configuración agnóstica centralizada
 * Un solo lugar para toda la configuración del generador
 */

// Cargar variables de entorno UNA sola vez
require('dotenv').config();

class ConfigSingleton {
  constructor() {
    if (ConfigSingleton.instance) {
      return ConfigSingleton.instance;
    }

    this.config = this.loadConfig();
    ConfigSingleton.instance = this;
  }

  /**
   * Carga configuración completamente agnóstica desde variables de entorno
   */
  loadConfig() {
    return {
      // Configuración del tema - 100% desde env vars
      theme: {
        name: process.env.THEME_NAME || 'design-system-theme',
        textDomain: process.env.TEXT_DOMAIN || 'design-system-theme',
        prefix: process.env.THEME_PREFIX || 'ds',
        displayName: process.env.THEME_DISPLAY_NAME || 'Design System Theme',
        description: process.env.THEME_DESCRIPTION || 'Tema generado automáticamente desde Design System',
        version: process.env.THEME_VERSION || '1.0.0',
        author: process.env.THEME_AUTHOR || 'Design System Generator'
      },

      // Rutas del proyecto
      paths: {
        src: './src',
        output: './wordpress-output',
        components: './src/components',
        assets: {
          css: 'assets/css',
          js: 'assets/js',
          img: 'assets/img',
          fonts: 'assets/fonts'
        }
      },

      // Configuración de assets - 100% desde env vars
      assets: {
        css: {
          designTokens: 'design-tokens.css',
          mainPrefix: process.env.CSS_PREFIX || 'design-system'
        },
        js: {
          mainPrefix: process.env.JS_PREFIX || 'ds',
          formats: ['es', 'umd']
        }
      },

      // Configuración PHP - 100% desde env vars
      php: {
        functionPrefix: process.env.PHP_FUNCTION_PREFIX || 'theme',
        hookPrefix: process.env.PHP_HOOK_PREFIX || 'theme',
        enqueueHandle: process.env.ENQUEUE_HANDLE || 'theme',
        textDomain: process.env.TEXT_DOMAIN || 'design-system-theme'
      },

      // Configuración SEO - 100% desde env vars
      seo: {
        enabled: true,
        siteName: process.env.SITE_NAME || 'Design System Site',
        defaultTitle: process.env.DEFAULT_TITLE || 'Design System Site',
        defaultDescription: process.env.DEFAULT_DESCRIPTION || 'Sitio web generado automáticamente desde Design System'
      },

      // Configuraciones adicionales
      postTypes: {
        enabled: true,
        metadataSource: 'src/metadata.json'
      },

      analytics: {
        enabled: true,
        configFile: 'analytics-config.json'
      },

      acf: {
        enabled: true,
        autoGenerate: true
      }
    };
  }

  /**
   * Obtener configuración para managers (estructura aplanada compatible)
   */
  getManagerConfig() {
    return {
      // Rutas básicas
      srcDir: this.config.paths.src,
      outputDir: this.config.paths.output,

      // Tema (aplanado para compatibilidad)
      themeName: this.config.theme.name,
      themeDisplayName: this.config.theme.displayName,
      themePrefix: this.config.theme.prefix,

      // PHP (aplanado)
      phpFunctionPrefix: this.config.php.functionPrefix,
      enqueueHandle: this.config.php.enqueueHandle,
      functionPrefix: this.config.php.functionPrefix,

      // Assets (aplanado)
      designTokensFile: this.config.assets.css.designTokens,
      assetPaths: this.config.paths.assets,

      // SEO
      siteName: this.config.seo.siteName,
      defaultTitle: this.config.seo.defaultTitle,
      defaultDescription: this.config.seo.defaultDescription,

      // Acceso a configuración completa
      fullConfig: this.config
    };
  }

  /**
   * Obtener configuración jerárquica completa
   */
  getFullConfig() {
    return this.config;
  }

  /**
   * Método estático para obtener instancia
   */
  static getInstance() {
    if (!ConfigSingleton.instance) {
      new ConfigSingleton();
    }
    return ConfigSingleton.instance;
  }

  /**
   * Generadores de nombres dinámicos para eliminar hardcoding
   */
  getThemeHandle() {
    // toulouse-lautrec -> toulouse-lautrec (para IDs HTML/CSS)
    return this.config.theme.name;
  }

  getThemePrefix() {
    // toulouse-lautrec -> toulouse_lautrec (prefijo básico)
    return this.config.theme.name.replace(/-/g, '_');
  }

  getThemeNamespace() {
    // toulouse-lautrec -> toulouse_lautrec_design_system
    return `${this.getThemePrefix()}_design_system`;
  }

  /**
   * 🎯 SINGLE SOURCE OF TRUTH: Leer metadata.json
   */
  getMetadata() {
    const fs = require('fs');
    const path = require('path');

    const filePath = path.join(this.config.paths.src, 'metadata.json');
    if (!fs.existsSync(filePath)) {
      throw new Error(`❌ FAIL FAST: metadata.json no encontrado: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  }

  /**
   * 🎯 SINGLE SOURCE OF TRUTH: Leer page-templates.json
   */
  getPageTemplates() {
    const fs = require('fs');
    const path = require('path');

    const filePath = path.join(this.config.paths.src, 'page-templates.json');
    if (!fs.existsSync(filePath)) {
      throw new Error(`❌ FAIL FAST: page-templates.json no encontrado: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  }

  /**
   * Debug de configuración
   */
  printDebug() {
    console.log('🔧 Configuración agnóstica cargada:');
    console.log(`   • Tema: ${this.config.theme.name} (${this.config.theme.displayName})`);
    console.log(`   • Prefijo: ${this.config.theme.prefix}`);
    console.log(`   • Función PHP: ${this.config.php.functionPrefix}`);
    console.log(`   • Assets CSS: ${this.config.assets.css.mainPrefix}`);
    console.log(`   • Assets JS: ${this.config.assets.js.mainPrefix}`);
  }
}

// Export del singleton
module.exports = ConfigSingleton;