const fs = require('fs');
const path = require('path');

/**
 * Config Source
 *
 * Carga y prepara configuraciones del proyecto:
 * - metadata.json
 * - page-templates.json
 * - package.json
 * - Configuraciones del generador
 */
class ConfigSource {
  constructor(config = {}) {
    this.srcDir = config.srcDir || './src';
    this.rootDir = config.rootDir || './';
    this.cache = new Map();
    this.cacheTimeout = config.cacheTimeout || 5 * 60 * 1000; // 5 minutos
  }

  /**
   * Prepara todas las configuraciones necesarias
   * @param {Object} context - Contexto de ejecución
   * @returns {Object} Configuraciones cargadas
   */
  async prepare(context) {
    console.log(`   📋 Cargando configuraciones del proyecto...`);

    const configs = {
      metadata: await this.loadMetadata(),
      pageTemplates: await this.loadPageTemplates(),
      packageJson: await this.loadPackageJson(),
      projectConfig: await this.loadProjectConfig(),
      generatorConfig: await this.loadGeneratorConfig()
    };

    // Validar configuraciones básicas
    this.validateConfigurations(configs);

    return configs;
  }

  /**
   * Carga metadata.json
   * @returns {Object} Metadata de componentes
   */
  async loadMetadata() {
    const filePath = path.join(this.srcDir, 'metadata.json');
    if (!fs.existsSync(filePath)) {
      throw new Error(`❌ FAIL FAST: metadata.json requerido no encontrado: ${filePath}`);
    }

    return this.loadJsonFile(filePath, 'metadata.json', null);
  }

  /**
   * Carga page-templates.json
   * @returns {Object} Configuración de páginas
   */
  async loadPageTemplates() {
    const filePath = path.join(this.srcDir, 'page-templates.json');
    if (!fs.existsSync(filePath)) {
      throw new Error(`❌ FAIL FAST: page-templates.json requerido no encontrado: ${filePath}`);
    }

    return this.loadJsonFile(filePath, 'page-templates.json', null);
  }

  /**
   * Carga package.json
   * @returns {Object} Configuración del proyecto
   */
  async loadPackageJson() {
    const filePath = path.join(this.rootDir, 'package.json');
    if (!fs.existsSync(filePath)) {
      throw new Error(`❌ FAIL FAST: package.json requerido no encontrado: ${filePath}`);
    }

    return this.loadJsonFile(filePath, 'package.json', null);
  }

  /**
   * Carga configuración del proyecto (simplificado)
   * @returns {Object} Configuración específica del proyecto
   */
  async loadProjectConfig() {
    // Solo configuración básica del proyecto - sin archivos adicionales
    return {};
  }

  /**
   * Carga configuración del generador WordPress
   * @returns {Object} Configuración del generador
   */
  async loadGeneratorConfig() {
    try {
      // Usar ConfigSingleton en lugar del archivo config.js eliminado
      const ConfigSingleton = require('../../wp-generator/core/config-singleton');
      const configInstance = new ConfigSingleton();

      // Obtener configuración plana para managers
      const config = configInstance.getManagerConfig();

      // Validar que tiene la estructura mínima requerida
      if (!config.themeName) {
        throw new Error(`❌ FAIL FAST: Config del generador inválido - falta themeName`);
      }

      return config;
    } catch (error) {
      throw new Error(`❌ FAIL FAST: Error cargando config del generador: ${error.message}`);
    }
  }

  /**
   * Carga archivo JSON con cache y manejo de errores
   * @param {string} filePath - Ruta del archivo
   * @param {string} filename - Nombre del archivo para logs
   * @param {Object} defaultValue - Valor por defecto si falla (solo para configs opcionales)
   * @returns {Object} Contenido del archivo JSON
   */
  loadJsonFile(filePath, filename, defaultValue = null) {
    const cacheKey = filePath;
    const cached = this.cache.get(cacheKey);

    // Verificar cache
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached.data;
    }

    try {
      if (!fs.existsSync(filePath)) {
        if (defaultValue !== null) {
          // Solo permitir defaults para archivos opcionales
          console.warn(`   ⚠️ ${filename} no encontrado en ${filePath} (opcional)`);
          return defaultValue;
        } else {
          throw new Error(`❌ FAIL FAST: Archivo requerido ${filename} no encontrado: ${filePath}`);
        }
      }

      const content = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(content);

      // Validar que no esté vacío para archivos críticos
      if (defaultValue === null && (!data || Object.keys(data).length === 0)) {
        throw new Error(`❌ FAIL FAST: Archivo ${filename} está vacío o es inválido`);
      }

      // Guardar en cache
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      if (defaultValue !== null) {
        console.warn(`   ⚠️ Error cargando ${filename}: ${error.message}`);
        return defaultValue;
      } else {
        throw new Error(`❌ FAIL FAST: Error cargando ${filename}: ${error.message}`);
      }
    }
  }

  /**
   * Valida que las configuraciones básicas estén disponibles
   * @param {Object} configs - Configuraciones cargadas
   */
  validateConfigurations(configs) {
    const { metadata, pageTemplates, packageJson } = configs;

    // Validar que metadata tenga componentes
    if (Object.keys(metadata).length === 0) {
      console.warn('   ⚠️ metadata.json está vacío o no se pudo cargar');
    }

    // Validar que page-templates tenga páginas
    if (Object.keys(pageTemplates).length === 0) {
      console.warn('   ⚠️ page-templates.json está vacío o no se pudo cargar');
    }

    // Validar package.json básico
    if (!packageJson.name) {
      console.warn('   ⚠️ package.json no tiene nombre del proyecto');
    }

    // Validar coherencia entre metadata y page-templates
    this.validateCoherence(metadata, pageTemplates);
  }

  /**
   * Valida coherencia entre configuraciones
   * @param {Object} metadata - Metadata de componentes
   * @param {Object} pageTemplates - Configuración de páginas
   */
  validateCoherence(metadata, pageTemplates) {
    // Verificar que componentes usados en páginas estén definidos en metadata
    Object.entries(pageTemplates).forEach(([pageName, pageConfig]) => {
      if (pageConfig.components) {
        pageConfig.components.forEach(componentConfig => {
          const componentName = componentConfig.name;
          if (!metadata[componentName]) {
            console.warn(`   ⚠️ Componente '${componentName}' usado en ${pageName} no está definido en metadata.json`);
          }
        });
      }
    });

    // Verificar que componentes en metadata se usen en alguna página
    const usedComponents = new Set();
    Object.values(pageTemplates).forEach(pageConfig => {
      if (pageConfig.components) {
        pageConfig.components.forEach(comp => usedComponents.add(comp.name));
      }
    });

    Object.keys(metadata).forEach(componentName => {
      const component = metadata[componentName];

      // Solo verificar componentes reales (que tienen type y phpFunction)
      if (component.type && component.phpFunction && !usedComponents.has(componentName)) {
        console.warn(`   ⚠️ Componente '${componentName}' definido en metadata.json pero no usado en ninguna página`);
      }
    });
  }

  /**
   * Obtiene configuración específica por clave
   * @param {string} key - Clave de configuración
   * @param {*} defaultValue - Valor por defecto
   * @returns {*} Valor de configuración
   */
  async getConfig(key, defaultValue = null) {
    const configs = await this.prepare({});

    // Buscar en orden de prioridad
    const sources = [
      configs.projectConfig,
      configs.generatorConfig,
      configs.packageJson,
      configs.metadata,
      configs.pageTemplates
    ];

    for (const source of sources) {
      if (source && source[key] !== undefined) {
        return source[key];
      }
    }

    return defaultValue;
  }

  /**
   * Obtiene información del proyecto
   * @returns {Object} Información del proyecto
   */
  async getProjectInfo() {
    const configs = await this.prepare({});
    const { packageJson, generatorConfig } = configs;

    return {
      name: packageJson.name || 'unnamed-project',
      version: packageJson.version || '1.0.0',
      description: packageJson.description || '',
      themeName: generatorConfig.themeName || 'generated-theme',
      prefix: generatorConfig.cssPrefix || 'tl',
      outputDir: generatorConfig.outputDir || './wordpress-output'
    };
  }

  /**
   * Obtiene URLs de test configuradas
   * @param {string} baseUrl - URL base para testing
   * @returns {Array} Array de configuraciones de URL
   */
  async getTestUrls(baseUrl = 'http://localhost') {
    const configs = await this.prepare({});
    const { pageTemplates } = configs;

    const HTMLSource = require('./html-source');
    return HTMLSource.generateTestUrls({ baseUrl, pageTemplates });
  }

  /**
   * Limpia cache de configuraciones
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Recarga una configuración específica
   * @param {string} configType - Tipo de configuración a recargar
   * @returns {Object} Configuración recargada
   */
  async reloadConfig(configType) {
    const cacheKey = this.getCacheKeyForConfigType(configType);
    if (cacheKey) {
      this.cache.delete(cacheKey);
    }

    switch (configType) {
      case 'metadata':
        return this.loadMetadata();
      case 'pageTemplates':
        return this.loadPageTemplates();
      case 'packageJson':
        return this.loadPackageJson();
      case 'projectConfig':
        return this.loadProjectConfig();
      case 'generatorConfig':
        return this.loadGeneratorConfig();
      default:
        throw new Error(`Tipo de configuración desconocido: ${configType}`);
    }
  }

  /**
   * Obtiene clave de cache para tipo de configuración
   * @param {string} configType - Tipo de configuración
   * @returns {string|null} Clave de cache
   */
  getCacheKeyForConfigType(configType) {
    switch (configType) {
      case 'metadata':
        return path.join(this.srcDir, 'metadata.json');
      case 'pageTemplates':
        return path.join(this.srcDir, 'page-templates.json');
      case 'packageJson':
        return path.join(this.rootDir, 'package.json');
      default:
        return null;
    }
  }

  /**
   * Método estático para crear fuente con configuración rápida
   * @param {Object} config - Configuración
   * @returns {ConfigSource} Instancia configurada
   */
  static create(config = {}) {
    return new ConfigSource(config);
  }
}

module.exports = ConfigSource;