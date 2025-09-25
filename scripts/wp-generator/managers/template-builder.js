const fs = require('fs');
const path = require('path');
const WpTemplates = require('../templates/wp-templates');
const FunctionsTemplate = require('../templates/functions-template');
const PHPValidator = require('../../validation/validators/php-validator');

class TemplateBuilder {
  constructor(config) {
    this.config = config;
    this.wpTemplates = new WpTemplates(config);
    this.functionsTemplate = new FunctionsTemplate(config);
    // PHPValidator modernizado - usar método estático
    this.metadata = this.loadMetadata();
  }

  loadMetadata() {
    const metadataPath = path.join(this.config.srcDir, 'metadata.json');
    if (fs.existsSync(metadataPath)) {
      return JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    }
    return {};
  }

  /**
   * Escribe archivo PHP con validación automática de sintaxis
   */
  writeValidatedPHPFile(filePath, content) {
    const filename = path.basename(filePath);
    
    try {
      // Validar contenido usando método estático modernizado
      if (!PHPValidator.validateContent(content, filename)) {
        console.error(`❌ Error de sintaxis PHP en ${filename}. No se escribió el archivo.`);
        return false;
      }
      
      // Escribir archivo si la validación pasó
      fs.writeFileSync(filePath, content);
      console.log(`✅ ${filename} generado y validado`);
      return true;
      
    } catch (error) {
      console.error(`❌ Error escribiendo ${filename}: ${error.message}`);
      return false;
    }
  }

  async generateAll() {
    try {
      await this.generateWordPressTemplates();
      this.generateStyleHeader();
      this.generateFunctionsFile(); // Este puede lanzar error crítico
      console.log('✅ Todos los templates generados correctamente');
    } catch (error) {
      console.error('❌ Error crítico en generación de templates:', error.message);
      throw error; // Re-lanzar para que el generador principal lo maneje
    }
  }

  async generateWordPressTemplates() {
    // Templates básicos obligatorios de WordPress
    const baseTemplates = [
      { name: 'header', file: 'header.php' },
      { name: 'footer', file: 'footer.php' },
      { name: '404', file: '404.php' },
      { name: 'search', file: 'search.php' },
      { name: 'index', file: 'index.php' },
      { name: 'front-page', file: 'front-page.php' }
    ];

    // Templates desde page-templates.json (no desde metadata)
    const pageTemplatesPath = path.join(this.config.srcDir, 'page-templates.json');
    let pageTemplates = {};
    if (fs.existsSync(pageTemplatesPath)) {
      pageTemplates = JSON.parse(fs.readFileSync(pageTemplatesPath, 'utf8'));
    }
    
    const metadataTemplates = Object.entries(pageTemplates).map(([pageName, pageConfig]) => ({
      name: pageName,
      file: pageConfig.file || `${pageName}.php`
    }));

    const templates = [...baseTemplates, ...metadataTemplates];

    // Generar templates de forma asíncrona
    const templatePromises = templates.map(async template => {
      const templateContent = await this.wpTemplates.generate(template.name);
      const templatePath = path.join(
        this.config.outputDir, 
        this.config.themeName, 
        template.file
      );
      
      this.writeValidatedPHPFile(templatePath, templateContent);
    });

    await Promise.all(templatePromises);
  }

  generateStyleHeader() {
    const themeConfig = this.config.theme || {};
    const styleContent = `/*
Theme Name: ${themeConfig.displayName || 'Generated Theme'}
Description: ${themeConfig.description || 'Tema personalizado generado automáticamente desde Design System'}
Version: ${themeConfig.version || '1.0.0'}
Author: ${themeConfig.author || 'Design System Generator'}
Text Domain: ${themeConfig.textDomain || 'generated-theme'}
*/

@import url('assets/css/design-tokens.css');
`;

    const stylePath = path.join(
      this.config.outputDir, 
      this.config.themeName, 
      'style.css'
    );
    
    fs.writeFileSync(stylePath, styleContent);
  }

  generateFunctionsFile() {
    const functionsContent = this.functionsTemplate.generate();
    const functionsPath = path.join(
      this.config.outputDir, 
      this.config.themeName, 
      'functions.php'
    );
    
    const success = this.writeValidatedPHPFile(functionsPath, functionsContent);
    if (!success) {
      throw new Error('❌ CRÍTICO: functions.php falló validación PHP. Generación detenida.');
    }
  }
}

module.exports = TemplateBuilder;