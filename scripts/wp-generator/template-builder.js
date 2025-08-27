const fs = require('fs');
const path = require('path');
const WpTemplates = require('./templates/wp-templates');
const FunctionsTemplate = require('./templates/functions-template');

class TemplateBuilder {
  constructor(config) {
    this.config = config;
    this.wpTemplates = new WpTemplates();
    this.functionsTemplate = new FunctionsTemplate();
  }

  generateAll() {
    this.generateWordPressTemplates();
    this.generateStyleHeader();
    this.generateFunctionsFile();
  }

  generateWordPressTemplates() {
    const templates = [
      // Archivos obligatorios WordPress
      { name: 'header', file: 'header.php' },
      { name: 'footer', file: 'footer.php' },
      { name: '404', file: '404.php' },
      { name: 'search', file: 'search.php' },
      { name: 'index', file: 'index.php' },
      { name: 'front-page', file: 'front-page.php' },
      
      // Templates específicos del proyecto
      { name: 'page-quienes-somos', file: 'page-quienes-somos.php' },
      { name: 'page-carreras', file: 'page-carreras.php' },
      { name: 'single-carrera', file: 'single-carrera.php' },
      { name: 'single-curso', file: 'single-curso.php' },
      { name: 'page-contacto', file: 'page-contacto.php' },
      { name: 'archive-articulos', file: 'archive-articulos.php' },
      { name: 'single-articulo', file: 'single-articulo.php' },
      { name: 'page-logros', file: 'page-logros.php' }
    ];

    templates.forEach(template => {
      const templateContent = this.wpTemplates.generate(template.name);
      const templatePath = path.join(
        this.config.outputDir, 
        this.config.themeName, 
        template.file
      );
      
      fs.writeFileSync(templatePath, templateContent);
    });
  }

  generateStyleHeader() {
    const styleContent = `/*
Theme Name: Toulouse Lautrec
Description: Tema personalizado generado automáticamente desde Design System
Version: 1.0.0
Author: Multiplica
Text Domain: toulouse-lautrec
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
    
    fs.writeFileSync(functionsPath, functionsContent);
  }
}

module.exports = TemplateBuilder;