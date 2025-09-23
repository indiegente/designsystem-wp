const fs = require('fs');
const path = require('path');

class GenerationValidator {
  constructor(config) {
    this.config = config;
    this.errors = [];
    this.warnings = [];
  }

  async validateGeneration() {
    console.log('🔍 Validando generación...');
    
    this.validateDirectoryStructure();
    this.validateComponents();
    this.validateTemplates();
    this.validateAssets();
    this.validateCriticalFiles();
    
    this.reportResults();
    return this.errors.length === 0;
  }

  validateDirectoryStructure() {
    const themeDir = path.join(this.config.outputDir, this.config.themeName);
    const requiredDirs = [
      'assets/css',
      'assets/js',
      'assets/img',
      'components',
      'inc'
    ];

    requiredDirs.forEach(dir => {
      const fullPath = path.join(themeDir, dir);
      if (!fs.existsSync(fullPath)) {
        this.errors.push(`❌ Directorio faltante: ${dir}`);
      }
    });
  }

  validateComponents() {
    const componentsDir = path.join(
      this.config.outputDir,
      this.config.themeName,
      'components'
    );

    // Cargar metadata para saber qué componentes esperar
    const metadata = this.loadMetadata();
    if (!metadata) {
      this.warnings.push('⚠️ No se encontró metadata.json, saltando validación de componentes');
      return;
    }

    if (!fs.existsSync(componentsDir)) {
      this.errors.push('❌ Directorio components no existe');
      return;
    }

    // Validar solo componentes definidos en metadata
    const expectedComponents = Object.keys(metadata).filter(key =>
      metadata[key].phpFunction && !key.includes('postTypes') && !key.includes('componentMapping')
    );

    if (expectedComponents.length === 0) {
      this.warnings.push('⚠️ No se encontraron componentes en metadata.json');
      return;
    }

    expectedComponents.forEach(componentName => {
      const componentPath = path.join(componentsDir, componentName);
      const phpFile = path.join(componentPath, `${componentName}.php`);

      if (!fs.existsSync(phpFile)) {
        this.errors.push(`❌ Componente de metadata faltante: ${componentName}.php`);
        return;
      }

      // Validar sintaxis básica PHP
      const content = fs.readFileSync(phpFile, 'utf8');
      if (!content.includes('<?php')) {
        this.errors.push(`❌ Archivo PHP inválido: ${componentName}.php`);
      }

      const expectedFunction = `render_${componentName.replace('-', '_')}`;
      if (!content.includes(`function ${expectedFunction}`)) {
        this.errors.push(`❌ Función ${expectedFunction} faltante en: ${componentName}.php`);
      }
    });

    console.log(`🔍 Validando ${expectedComponents.length} componentes desde metadata.json`);
  }

  loadMetadata() {
    const metadataPath = path.join(this.config.srcDir, 'metadata.json');
    if (!fs.existsSync(metadataPath)) {
      return null;
    }

    try {
      return JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    } catch (error) {
      console.warn('⚠️ Error cargando metadata.json:', error.message);
      return null;
    }
  }

  validateTemplates() {
    const themeDir = path.join(this.config.outputDir, this.config.themeName);
    
    // Archivos obligatorios para WordPress
    const requiredTemplates = [
      'index.php',
      'header.php',
      'footer.php',
      'style.css',
      'functions.php'
    ];

    // Archivos recomendados para mejor compatibilidad
    const recommendedTemplates = [
      '404.php',
      'search.php',
      'front-page.php'
    ];

    // Validar archivos obligatorios
    requiredTemplates.forEach(template => {
      const templatePath = path.join(themeDir, template);
      if (!fs.existsSync(templatePath)) {
        this.errors.push(`❌ Template obligatorio faltante: ${template}`);
      } else {
        this.validateTemplateContent(template, templatePath);
      }
    });

    // Validar archivos recomendados
    recommendedTemplates.forEach(template => {
      const templatePath = path.join(themeDir, template);
      if (!fs.existsSync(templatePath)) {
        this.warnings.push(`⚠️ Template recomendado faltante: ${template}`);
      } else {
        this.validateTemplateContent(template, templatePath);
      }
    });
  }

  validateTemplateContent(template, templatePath) {
    const content = fs.readFileSync(templatePath, 'utf8');
    
    if (template.endsWith('.php') && !content.includes('<?php')) {
      this.errors.push(`❌ Template PHP inválido: ${template}`);
    }
    
    if (template === 'style.css' && !content.includes('Theme Name:')) {
      this.errors.push(`❌ Header de tema faltante en style.css`);
    }

    // Validaciones específicas para compatibilidad WordPress
    if (template === 'header.php') {
      if (!content.includes('wp_head()')) {
        this.errors.push(`❌ wp_head() faltante en header.php`);
      }
      if (!content.includes('body_class()')) {
        this.warnings.push(`⚠️ body_class() recomendado en header.php`);
      }
    }

    if (template === 'footer.php') {
      if (!content.includes('wp_footer()')) {
        this.errors.push(`❌ wp_footer() faltante en footer.php`);
      }
    }
  }

  validateAssets() {
    const assetsDir = path.join(
      this.config.outputDir,
      this.config.themeName,
      'assets'
    );

    if (!fs.existsSync(assetsDir)) {
      this.errors.push('❌ Directorio assets no existe');
      return;
    }

    // Verificar que se copiaron design tokens
    const tokensPath = path.join(assetsDir, 'css', 'design-tokens.css');
    if (!fs.existsSync(tokensPath)) {
      this.warnings.push('⚠️ Design tokens no encontrados');
    }

    // Verificar assets de Vite
    const distFiles = this.findDistFiles(assetsDir);
    if (distFiles.length === 0) {
      this.warnings.push('⚠️ No se encontraron assets de Vite');
    }
  }

  validateCriticalFiles() {
    const themeDir = path.join(this.config.outputDir, this.config.themeName);

    // Verificar functions.php
    const functionsPath = path.join(themeDir, 'functions.php');
    if (fs.existsSync(functionsPath)) {
      const content = fs.readFileSync(functionsPath, 'utf8');

      // Buscar función theme_setup con prefijo dinámico
      const functionPrefix = this.config.phpFunctionPrefix || 'theme';
      const themeSetupFunction = `${functionPrefix}_theme_setup`;
      if (!content.includes(themeSetupFunction)) {
        this.errors.push(`❌ Función ${themeSetupFunction} faltante en functions.php`);
      }

      // Buscar enqueue de estilos (puede ser wp_enqueue_style o función optimizada)
      if (!content.includes('wp_enqueue_style') && !content.includes('optimized_asset_enqueue')) {
        this.warnings.push('⚠️ No se encontró enqueue de estilos');
      }
    }
  }

  findDistFiles(dir) {
    const files = [];
    try {
      const items = fs.readdirSync(dir);
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        if (fs.statSync(fullPath).isDirectory()) {
          files.push(...this.findDistFiles(fullPath));
        } else if (item.endsWith('.css') || item.endsWith('.js')) {
          files.push(fullPath);
        }
      });
    } catch (error) {
      // Directorio no existe o error de lectura
    }
    return files;
  }

  reportResults() {
    console.log('\n📊 Reporte de Validación:');
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('✅ Generación completamente válida!');
      return;
    }

    if (this.errors.length > 0) {
      console.log(`\n❌ Errores encontrados (${this.errors.length}):`);
      this.errors.forEach(error => console.log(`  ${error}`));
    }

    if (this.warnings.length > 0) {
      console.log(`\n⚠️ Advertencias (${this.warnings.length}):`);
      this.warnings.forEach(warning => console.log(`  ${warning}`));
    }

    const status = this.errors.length === 0 ? '✅ VÁLIDO' : '❌ CON ERRORES';
    console.log(`\n🏁 Estado final: ${status}`);
  }
}

module.exports = GenerationValidator;