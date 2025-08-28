const fs = require('fs');
const path = require('path');
const ComponentGenerator = require('./component-generator');
const TemplateBuilder = require('./template-builder');
const AssetManager = require('./asset-manager');
const ThemeStructure = require('./theme-structure');
const GenerationValidator = require('./validator');
const SEOManager = require('./seo-manager');
const ValidationManager = require('./validation-manager');
const PHPValidator = require('./php-validator');

class WordPressGenerator {
  constructor(config) {
    this.config = {
      srcDir: './src',
      outputDir: './wordpress-output',
      themeName: 'toulouse-lautrec',
      ...config
    };
    
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
    const themeDir = path.join(this.config.outputDir, this.config.themeName);
    
    if (fs.existsSync(themeDir)) {
      console.log('🧹 Limpiando directorio de salida anterior...');
      fs.rmSync(themeDir, { recursive: true, force: true });
    }
  }

  async generate() {
    console.log('🚀 Iniciando generación de tema WordPress avanzado...');
    
    let generationStarted = false;
    
    try {
      // 0. Limpiar directorio de salida anterior
      this.cleanOutputDirectory();
      
      // 1. Crear estructura del tema
      this.themeStructure.create();
      generationStarted = true;
      
      // 2. Convertir componentes Lit a PHP
      await this.componentGenerator.convertAllComponents();
      
      // 3. Generar assets CSS/JS optimizados
      this.assetManager.build();
      
      // 4. Crear plantillas WordPress (puede fallar en validación)
      await this.templateBuilder.generateAll();
      
      // 5. Generar sistema SEO dinámico
      this.seoManager.generate();
      
      // 6. Ejecutar validación y generar fallbacks
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
        console.log('✅ Tema WordPress avanzado generado y validado exitosamente!');
        console.log('🎯 Características incluidas:');
        console.log('   - ✅ Assets optimizados con lazy loading');
        console.log('   - ✅ SEO dinámico con JSON-LD');
        console.log('   - ✅ Sistema de validación y fallbacks');
        console.log('   - ✅ Extensiones y hooks personalizables');
        console.log('   - ✅ Manejo de errores robusto');
        console.log('   - ✅ Validación automática de sintaxis PHP');
      } else {
        console.log('❌ Validación falló. Haciendo rollback...');
        this.rollbackGeneration();
        return false;
      }
      
      return allValidationsPass;
      
    } catch (error) {
      console.error('❌ Error crítico durante la generación:', error.message);
      
      // Hacer rollback si la generación había comenzado
      if (generationStarted) {
        console.log('🔄 Haciendo rollback de archivos generados...');
        this.rollbackGeneration();
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