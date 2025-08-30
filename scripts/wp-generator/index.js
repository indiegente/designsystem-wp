const fs = require('fs');
const path = require('path');
const ComponentGenerator = require('./managers/component-generator');
const TemplateBuilder = require('./managers/template-builder');
const AssetManager = require('./managers/asset-manager');
const ThemeStructure = require('./managers/theme-structure');
const GenerationValidator = require('./validation/validator');
const SEOManager = require('./managers/seo-manager');
const AnalyticsManager = require('./managers/analytics-manager');
const ValidationManager = require('./validation/validation-manager');
const PHPValidator = require('./validation/php-validator');
const ConfigManager = require('./core/config-manager');

class WordPressGenerator {
  constructor(customConfig = {}) {
    // Usar el gestor de configuración dinámico
    this.configManager = new ConfigManager();
    const dynamicConfig = this.configManager.getConfig();
    
    // Mapear configuración dinámica al formato esperado por los generadores
    this.config = {
      srcDir: dynamicConfig.paths.src,
      outputDir: dynamicConfig.paths.output,
      themeName: dynamicConfig.theme.name,
      themeDisplayName: dynamicConfig.theme.displayName,
      themePrefix: dynamicConfig.theme.prefix,
      phpFunctionPrefix: dynamicConfig.php.functionPrefix,
      assetPaths: dynamicConfig.paths.assets,
      ...customConfig // Override con configuración personalizada
    };
    
    // Validar configuración
    this.configManager.validateConfig(dynamicConfig);
    
    // Mostrar configuración en debug
    this.configManager.printConfig();
    
    this.themeStructure = new ThemeStructure(this.config);
    this.componentGenerator = new ComponentGenerator(this.config);
    this.templateBuilder = new TemplateBuilder(this.config);
    this.assetManager = new AssetManager(this.config);
    this.validator = new GenerationValidator(this.config);
    this.seoManager = new SEOManager(this.config);
    this.validationManager = new ValidationManager(this.config);
    this.phpValidator = new PHPValidator(this.config);
  }

  cleanOutputDirectory() {
    const outputDir = this.config.outputDir;
    
    if (fs.existsSync(outputDir)) {
      console.log('🧹 Limpiando directorio de salida anterior...');
      // Limpiar todo el directorio wordpress-output
      const items = fs.readdirSync(outputDir);
      for (const item of items) {
        const itemPath = path.join(outputDir, item);
        const stat = fs.lstatSync(itemPath);
        
        if (stat.isDirectory()) {
          // Remover todos los directorios (temas antiguos, residuales, etc.)
          fs.rmSync(itemPath, { recursive: true, force: true });
          console.log(`   🗑️ Removido directorio: ${item}`);
        } else {
          // Remover archivos residuales (manifests, reportes, etc.)
          fs.unlinkSync(itemPath);
          console.log(`   🗑️ Removido archivo: ${item}`);
        }
      }
    }
  }

  async generate() {
    console.log('🚀 Iniciando generación de tema WordPress avanzado...');
    
    // 0. Validar Node.js version (FAIL FAST)
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    if (majorVersion < 20) {
      throw new Error(`❌ NODE.js VERSION: Requerido Node.js 20+. Actual: ${nodeVersion}\n💡 Ejecutar: nvm use 24`);
    }
    if (majorVersion < 24) {
      console.log(`⚠️ ADVERTENCIA: Node.js ${nodeVersion} detectado. Recomendado: Node.js 24+`);
      console.log('💡 Para óptimo rendimiento: nvm use 24');
    }
    
    let generationStarted = false;
    
    try {
      // 1. Limpiar directorio de salida anterior
      this.cleanOutputDirectory();
      
      // 1. Crear estructura del tema
      this.themeStructure.create();
      generationStarted = true;
      
      // 2. Convertir componentes Lit a PHP
      await this.componentGenerator.convertAllComponents();
      
      // 3. Generar assets CSS/JS optimizados (REQUERIDO)
      console.log('📦 Assets optimizados son requeridos para generación completa');
      this.assetManager.build(); // Si falla, se propaga el error y hace rollback
      
      // 4. Crear plantillas WordPress (puede fallar en validación)
      await this.templateBuilder.generateAll();
      
      // 5. Generar sistema SEO dinámico
      this.seoManager.generate();
      
      // 6. Generar sistema de Analytics (GA4, eventos, data layer)
      const dynamicConfig = this.configManager.getConfig();
      const fullConfig = { ...this.config, analytics: dynamicConfig.analytics };
      const analyticsManager = new AnalyticsManager(fullConfig);
      analyticsManager.generateAnalyticsFile();
      
      // 7. Ejecutar validación y generar fallbacks
      const isValid = this.validationManager.validateGeneration();
      
      // 7. Validar generación final
      const finalValidation = await this.validator.validateGeneration();
      
      // 8. Validar sintaxis PHP de todos los archivos generados
      console.log('🔍 Validando sintaxis PHP...');
      const phpValidation = this.phpValidator.validateWordPressTheme();
      this.phpValidator.printValidationReport();
      
      if (phpValidation) {
        console.log('✅ Sintaxis PHP validada correctamente');
      } else {
        console.log('❌ Errores de sintaxis PHP detectados');
        this.phpValidator.saveValidationReport();
        // Si hay errores PHP restantes, hacer rollback
        this.rollbackGeneration();
        return false;
      }
      
      const allValidationsPass = isValid && finalValidation && phpValidation;
      
      if (allValidationsPass) {
        console.log('✅ Tema WordPress completo generado y validado exitosamente!');
        console.log('🎯 Características incluidas:');
        console.log('   - ✅ Assets optimizados con lazy loading');
        console.log('   - ✅ SEO dinámico con JSON-LD');
        console.log('   - ✅ Sistema de validación y fallbacks');
        console.log('   - ✅ Extensiones y hooks personalizables');
        console.log('   - ✅ Manejo de errores robusto');
        console.log('   - ✅ Validación automática de sintaxis PHP');
        console.log('   - ✅ Generación dinámica desde componentes Lit');
        console.log('\n🚀 Tema listo para producción');
      } else {
        console.log('❌ Validación falló. Haciendo rollback...');
        this.rollbackGeneration();
        return false;
      }
      
      return allValidationsPass;
      
    } catch (error) {
      console.error('❌ Error crítico durante la generación:', error.message);
      
      // Mostrar instrucciones para solución
      if (error.message.includes('Assets build failed')) {
        console.log('🔧 Para solución:');
        console.log('   1. Actualiza Node.js a versión 20.19+ o 22.12+');
        console.log('   2. Ejecuta: npm run build manualmente');
        console.log('   3. Vuelve a ejecutar la generación');
      }
      
      // Hacer rollback completo SIEMPRE
      if (generationStarted) {
        console.log('🔄 Haciendo rollback completo...');
        this.rollbackGeneration();
        console.log('📋 wordpress-output limpiado. No se generó tema parcial.');
      }
      
      return false;
    }
  }
  
  /**
   * Elimina archivos parcialmente generados cuando hay errores
   */
  rollbackGeneration() {
    const themeDir = path.join(this.config.outputDir, this.config.themeName);
    
    if (fs.existsSync(themeDir)) {
      console.log('🧹 Limpiando archivos con errores...');
      fs.rmSync(themeDir, { recursive: true, force: true });
      console.log('✅ Rollback completado. No se dejaron archivos con errores.');
    }
  }
}

module.exports = WordPressGenerator;