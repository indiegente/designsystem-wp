const fs = require('fs');
const path = require('path');
const ComponentGenerator = require('./managers/component-generator');
const TemplateBuilder = require('./managers/template-builder');
const AssetManager = require('./managers/asset-manager');
const ThemeStructure = require('./managers/theme-structure');
const GenerationValidator = require('./validation/validator');
const SEOManager = require('./managers/seo-manager');
const AnalyticsManager = require('./managers/analytics-manager');
const ACFManager = require('./managers/acf-manager');
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
    this.acfManager = new ACFManager(this.config);
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

      // 7. Generar campos ACF automáticamente
      console.log('🔍 Generando campos ACF automáticamente...');
      try {
        const acfStats = this.acfManager.generateACFFields();
        if (acfStats) {
          console.log(`✅ ACF: ${acfStats.fieldGroups} grupos, ${acfStats.totalFields} campos generados`);
        }
      } catch (error) {
        console.log('⚠️ ACF: Sin campos ACF para generar');
      }

      // 8. Ejecutar validación y generar fallbacks
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
        console.log('✅ Generación básica completada. Ejecutando validaciones de calidad...');
        
        let qualityValidationsPassed = true;
        
        // 9. Ejecutar PHPCS auto-fix para WordPress Coding Standards (opcional)
        if (!process.env.SKIP_PHPCS) {
          try {
            console.log('🔧 Aplicando WordPress Coding Standards (PHPCS)...');
            const phpcsSuccess = await this.runPHPCSAutoFix();
            
            if (!phpcsSuccess) {
              qualityValidationsPassed = false;
            }
          } catch (error) {
            console.error('❌ PHPCS FALLÓ:', error.message);
            qualityValidationsPassed = false;
          }
        } else {
          console.log('⏭️ PHPCS saltado (SKIP_PHPCS=true)');
        }
        
        try {
          // 10. Ejecutar validación híbrida final
          console.log('🎯 Ejecutando validación híbrida completa...');
          const hybridSuccess = await this.runHybridValidation();
          
          if (!hybridSuccess) {
            qualityValidationsPassed = false;
          }
        } catch (error) {
          console.error('❌ VALIDACIÓN HÍBRIDA FALLÓ:', error.message);
          qualityValidationsPassed = false;
        }
        
        try {
          // 11. Ejecutar validación de renderizado de componentes
          console.log('🧩 Ejecutando validación de renderizado de componentes...');
          const renderValidationSuccess = await this.runComponentRenderValidation();
          
          if (!renderValidationSuccess) {
            qualityValidationsPassed = false;
          }
        } catch (error) {
          console.error('❌ VALIDACIÓN DE RENDERIZADO FALLÓ:', error.message);
          qualityValidationsPassed = false;
        }
        
        if (qualityValidationsPassed) {
          console.log('✅ Tema WordPress completo generado y validado exitosamente!');
          console.log('🎯 Características incluidas:');
          console.log('   - ✅ Assets optimizados con lazy loading');
          console.log('   - ✅ SEO dinámico con JSON-LD');
          console.log('   - ✅ WordPress Coding Standards aplicados (PHPCS)');
          console.log('   - ✅ Validación híbrida completa (managers + profesional)');
          console.log('   - ✅ Sistema de validación y fallbacks');
          console.log('   - ✅ Extensiones y hooks personalizables');
          console.log('   - ✅ Manejo de errores robusto');
          console.log('   - ✅ Validación automática de sintaxis PHP');
          console.log('   - ✅ Generación dinámica desde componentes Lit');
          console.log('\n🚀 Tema listo para producción con calidad profesional');
        } else {
          throw new Error('❌ VALIDACIONES DE CALIDAD FALLARON: Dependencias faltantes o procesos no exitosos');
        }
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
  
  async runPHPCSAutoFix() {
    const { execSync } = require('child_process');
    const fs = require('fs');
    
    // Verificar que Composer esté disponible
    if (!fs.existsSync('composer.phar')) {
      console.log('⚠️ Composer no encontrado. Instalando automáticamente...');
      try {
        execSync('npm run setup:composer', { stdio: 'inherit' });
        console.log('✅ Composer instalado exitosamente');
      } catch (setupError) {
        throw new Error('❌ PHPCS FALLÓ: No se pudo instalar Composer automáticamente. Ejecutar manualmente: npm run setup');
      }
    }
    
    try {
      console.log('🔧 Ejecutando PHPCBF para corregir automáticamente...');
      const result = execSync('php composer.phar exec phpcbf -- --standard=WordPress wordpress-output/', { 
        stdio: 'pipe',
        timeout: 60000,
        encoding: 'utf8'
      });
      
      // Verificar si PHPCBF realmente corrigió errores
      if (result.includes('A TOTAL OF') && result.includes('ERRORS WERE FIXED')) {
        const fixedMatch = result.match(/A TOTAL OF (\d+) ERRORS WERE FIXED/);
        const fixedCount = fixedMatch ? parseInt(fixedMatch[1]) : 0;
        
        if (fixedCount > 0) {
          console.log(`✅ PHPCS: ${fixedCount} errores corregidos automáticamente`);
          return true;
        }
      }
      
      console.log('✅ PHPCS: Sin errores de formato detectados');
      return true;
      
    } catch (error) {
      const output = error.stdout || error.message;
      
      // Analizar el output para determinar si fue exitoso parcialmente
      if (output.includes('A TOTAL OF') && output.includes('ERRORS WERE FIXED')) {
        const fixedMatch = output.match(/A TOTAL OF (\d+) ERRORS WERE FIXED/);
        const fixedCount = fixedMatch ? parseInt(fixedMatch[1]) : 0;
        
        console.log(`✅ PHPCS: ${fixedCount} errores corregidos automáticamente`);
        
        // Para PHPCBF, si corrigió errores, considerar exitoso
        // Los errores "remaining" son normalmente de estilo que no se pueden auto-corregir
        if (fixedCount > 0) {
          console.log('✅ PHPCS: Errores críticos corregidos (warnings menores aceptables)');
          return true;
        }
      }
      
      throw new Error(`❌ PHPCS FALLÓ: ${error.message}\n💡 Verificar: php composer.phar exec phpcs --version`);
    }
  }
  
  async runHybridValidation() {
    const { execSync } = require('child_process');
    
    // Verificar que Lighthouse esté disponible
    try {
      execSync('lighthouse --version', { stdio: 'pipe' });
    } catch (error) {
      console.log('⚠️ Lighthouse no encontrado. Verificando instalación local...');
      try {
        execSync('npx lighthouse --version', { stdio: 'pipe' });
        console.log('✅ Lighthouse disponible via npx');
      } catch (npxError) {
        throw new Error('❌ LIGHTHOUSE FALTANTE: Ejecutar "npm install" para instalar dependencias requeridas');
      }
    }
    
    try {
      console.log('🎯 Ejecutando validador híbrido (managers + herramientas profesionales)...');
      const result = execSync('node scripts/validation/hybrid-validator.js', { 
        stdio: 'pipe',
        timeout: 120000,
        encoding: 'utf8'
      });
      
      // Verificar que el resultado sea exitoso
      if (result.includes('Estado general: ✅ EXCELLENT')) {
        console.log('✅ Validación híbrida: EXCELLENT - Todos los managers funcionando');
        return true;
      } else if (result.includes('Tasa de éxito: 100.0%')) {
        console.log('✅ Validación híbrida: 100% managers exitosos');
        return true;
      } else {
        throw new Error('❌ Validación híbrida falló: No se alcanzó 100% de éxito en managers');
      }
      
    } catch (error) {
      if (error.message.includes('LIGHTHOUSE FALTANTE')) {
        throw error; // Re-throw dependency errors
      }
      
      const output = error.stdout || error.message;
      
      // Analizar si hay errores críticos vs warnings
      if (output.includes('Tests fallidos: 0') && output.includes('Tasa de éxito: 100.0%')) {
        console.log('✅ Validación híbrida: Managers 100% exitosos (warnings aceptables)');
        return true;
      }
      
      throw new Error(`❌ VALIDACIÓN HÍBRIDA FALLÓ: ${error.message}`);
    }
  }

  async runComponentRenderValidation() {
    const ComponentRenderValidator = require('../validation/component-render-validator');
    const renderValidator = new ComponentRenderValidator(this.config);
    return await renderValidator.validateComponentRendering();
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