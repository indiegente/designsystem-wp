const ComponentConverter = require('./component-converter');
const TemplateBuilder = require('./template-builder');
const AssetManager = require('./asset-manager');
const ThemeStructure = require('./theme-structure');
const GenerationValidator = require('./validator');

class WordPressGenerator {
  constructor(config) {
    this.config = {
      srcDir: './src',
      outputDir: './wordpress-output',
      themeName: 'toulouse-lautrec',
      ...config
    };
    
    this.themeStructure = new ThemeStructure(this.config);
    this.componentConverter = new ComponentConverter(this.config);
    this.templateBuilder = new TemplateBuilder(this.config);
    this.assetManager = new AssetManager(this.config);
    this.validator = new GenerationValidator(this.config);
  }

  async generate() {
    console.log('🚀 Iniciando generación de tema WordPress...');
    
    try {
      // 1. Crear estructura del tema
      this.themeStructure.create();
      
      // 2. Convertir componentes Lit a PHP
      await this.componentConverter.convertAll();
      
      // 3. Generar assets CSS/JS
      this.assetManager.build();
      
      // 4. Crear plantillas WordPress
      this.templateBuilder.generateAll();
      
      // 5. Validar generación
      const isValid = await this.validator.validateGeneration();
      
      if (isValid) {
        console.log('✅ Tema WordPress generado y validado exitosamente!');
      } else {
        console.log('⚠️ Tema generado con errores. Revisar reporte de validación.');
      }
      
      return isValid;
      
    } catch (error) {
      console.error('❌ Error durante la generación:', error.message);
      throw error;
    }
  }
}

module.exports = WordPressGenerator;