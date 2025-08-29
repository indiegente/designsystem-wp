const fs = require('fs');
const path = require('path');

/**
 * Gestor de configuración dinámico que detecta automáticamente 
 * configuraciones desde package.json y variables de entorno
 */
class ConfigManager {
  constructor() {
    this.baseConfig = require('./config');
    this.packageJson = this.loadPackageJson();
    this.envVars = process.env;
  }

  /**
   * Carga el package.json del proyecto
   */
  loadPackageJson() {
    try {
      const packagePath = path.join(process.cwd(), 'package.json');
      if (fs.existsSync(packagePath)) {
        return JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      }
    } catch (error) {
      console.warn('⚠️  No se pudo cargar package.json:', error.message);
    }
    return {};
  }

  /**
   * Genera configuración dinámica basada en detección automática
   */
  generateDynamicConfig() {
    const config = JSON.parse(JSON.stringify(this.baseConfig)); // Deep clone

    // Detectar nombre del proyecto desde package.json
    const projectName = this.envVars.WP_THEME_NAME || 
                       this.packageJson.name || 
                       'design-system-theme';
    
    const projectSlug = projectName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const projectPrefix = this.generatePrefix(projectName);
    const functionPrefix = projectSlug.replace(/-/g, '_');

    // Actualizar configuración del tema (solo si no está configurado explícitamente)
    if (this.baseConfig.theme.name === 'toulouse-lautrec') {
      // Mantener el nombre fijo para WordPress
      config.theme.name = 'toulouse-lautrec';
      config.theme.textDomain = 'toulouse-lautrec';
    } else {
      // Usar detección automática para otros proyectos
      config.theme.name = projectSlug;
      config.theme.textDomain = projectSlug;
    }
    config.theme.prefix = projectPrefix;
    config.theme.displayName = this.envVars.WP_THEME_DISPLAY_NAME || 
                              (this.packageJson.displayName || 
                               this.titleCase(projectName.replace(/[-_]/g, ' ')));
    config.theme.description = this.envVars.WP_THEME_DESCRIPTION ||
                              this.packageJson.description ||
                              'Tema generado automáticamente desde el Design System';
    config.theme.version = this.packageJson.version || '1.0.0';
    config.theme.author = this.packageJson.author || 'Design System Generator';

    // Actualizar prefijos en assets (usar slug base sin repetir)
    config.assets.css.mainPrefix = projectSlug.includes('design-system') ? 
                                  projectSlug : `${projectSlug}-design-system`;
    config.assets.js.mainPrefix = `${projectPrefix}-ds`;

    // Actualizar prefijos PHP
    config.php.functionPrefix = functionPrefix;
    config.php.hookPrefix = functionPrefix;
    config.php.enqueueHandle = projectSlug;
    config.php.textDomain = projectSlug;

    // Actualizar SEO
    config.seo.siteName = config.theme.displayName;
    config.seo.defaultTitle = config.theme.displayName;

    return config;
  }

  /**
   * Genera un prefijo CSS/JS desde el nombre del proyecto
   */
  generatePrefix(projectName) {
    // Si contiene "toulouse", usar "tl"
    if (projectName.toLowerCase().includes('toulouse')) {
      return 'tl';
    }
    
    // Para otros nombres, tomar iniciales de palabras principales
    const words = projectName.toLowerCase().split(/[-_\s]+/);
    const mainWords = words.filter(word => 
      !['design', 'system', 'components', 'ui', 'lib'].includes(word)
    );
    
    if (mainWords.length > 0) {
      return mainWords.slice(0, 2).map(word => word[0]).join('') + 
             (mainWords.length > 2 ? mainWords[2][0] : '');
    }
    
    // Fallback: primeras 3 letras del primer word
    return words[0] ? words[0].slice(0, 3) : 'ds';
  }

  /**
   * Convierte string a Title Case
   */
  titleCase(str) {
    return str.replace(/\w\S*/g, (txt) => {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  }

  /**
   * Obtiene la configuración completa y procesada
   */
  getConfig() {
    if (this.baseConfig.detection.autoDetectFromPackage) {
      return this.generateDynamicConfig();
    }
    return this.baseConfig;
  }

  /**
   * Obtiene rutas de assets procesadas
   */
  getAssetPaths(config = null) {
    const cfg = config || this.getConfig();
    return {
      css: cfg.paths.assets.css,
      js: cfg.paths.assets.js,
      img: cfg.paths.assets.img,
      fonts: cfg.paths.assets.fonts
    };
  }

  /**
   * Valida que la configuración sea correcta
   */
  validateConfig(config) {
    const required = [
      'theme.name',
      'theme.prefix', 
      'php.functionPrefix',
      'paths.src',
      'paths.output'
    ];

    for (const path of required) {
      const value = this.getNestedValue(config, path);
      if (!value) {
        throw new Error(`Configuración requerida faltante: ${path}`);
      }
    }

    return true;
  }

  /**
   * Obtiene valor anidado de objeto usando dot notation
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Imprime configuración actual (para debugging)
   */
  printConfig() {
    const config = this.getConfig();
    console.log('📋 Configuración del generador:');
    console.log(`   • Tema: ${config.theme.name} (${config.theme.displayName})`);
    console.log(`   • Prefijo: ${config.theme.prefix}`);
    console.log(`   • Función PHP: ${config.php.functionPrefix}`);
    console.log(`   • Assets CSS: ${config.assets.css.mainPrefix}`);
    console.log(`   • Assets JS: ${config.assets.js.mainPrefix}`);
  }
}

module.exports = ConfigManager;