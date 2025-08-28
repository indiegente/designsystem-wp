const fs = require('fs');
const path = require('path');
const ComponentGenerator = require('./component-generator');
const TemplateBuilder = require('./template-builder');
const AssetManager = require('./asset-manager');
const ThemeStructure = require('./theme-structure');
const GenerationValidator = require('./validator');
const SEOManager = require('./seo-manager');
const ValidationManager = require('./validation-manager');

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
    
    try {
      // 0. Limpiar directorio de salida anterior
      this.cleanOutputDirectory();
      
      // 1. Crear estructura del tema
      this.themeStructure.create();
      
      // 2. Convertir componentes Lit a PHP
      await this.componentGenerator.convertAllComponents();
      
      // 3. Generar assets CSS/JS optimizados
      this.assetManager.build();
      
      // 4. Crear plantillas WordPress
      await this.templateBuilder.generateAll();
      
      // 5. Generar sistema SEO dinámico
      this.seoManager.generate();
      
      // 6. Ejecutar validación y generar fallbacks
      const isValid = this.validationManager.validateGeneration();
      
      // 7. Validar generación final
      const finalValidation = await this.validator.validateGeneration();
      
      if (isValid && finalValidation) {
        console.log('✅ Tema WordPress avanzado generado y validado exitosamente!');
        console.log('🎯 Características incluidas:');
        console.log('   - ✅ Assets optimizados con lazy loading');
        console.log('   - ✅ SEO dinámico con JSON-LD');
        console.log('   - ✅ Sistema de validación y fallbacks');
        console.log('   - ✅ Extensiones y hooks personalizables');
        console.log('   - ✅ Manejo de errores robusto');
      } else {
        console.log('⚠️ Tema generado con errores. Revisar reporte de validación.');
      }
      
      return isValid && finalValidation;
      
    } catch (error) {
      console.error('❌ Error durante la generación:', error.message);
      throw error;
    }
  }
}

module.exports = WordPressGenerator;