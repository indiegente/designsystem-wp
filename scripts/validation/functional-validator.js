/**
 * Validador Funcional para WordPress
 * 
 * Valida que el código generado realmente funcione en WordPress:
 * - Hooks correctos (wp_head, wp_footer)
 * - Funciones PHP existentes
 * - Output HTML válido
 * - Configuración vs resultado final
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

class FunctionalValidator {
  constructor(config) {
    this.config = config;
    this.outputDir = path.join(config.outputDir, config.themeName);
    this.errors = [];
    this.warnings = [];
  }

  async validateAll() {
    console.log('🧪 Iniciando Validación Funcional completa...');
    
    await this.validateWordPressHooks();
    await this.validatePHPFunctions();
    await this.validateComponentCalls();
    await this.validateConfigurationFidelity();
    
    return this.generateReport();
  }

  async validateWordPressHooks() {
    console.log('🔍 Validando hooks de WordPress...');
    
    const headerFile = path.join(this.outputDir, 'header.php');
    const footerFile = path.join(this.outputDir, 'footer.php');
    
    if (fs.existsSync(headerFile)) {
      const headerContent = fs.readFileSync(headerFile, 'utf8');
      if (!headerContent.includes('wp_head()')) {
        this.errors.push('❌ header.php falta wp_head() - Meta tags no se cargarán');
      }
    }
    
    if (fs.existsSync(footerFile)) {
      const footerContent = fs.readFileSync(footerFile, 'utf8');
      if (!footerContent.includes('wp_footer()')) {
        this.errors.push('❌ footer.php falta wp_footer() - Scripts no se cargarán');
      }
    }
  }

  async validatePHPFunctions() {
    console.log('🔍 Validando funciones PHP generadas...');
    
    const componentsDir = path.join(this.outputDir, 'components');
    if (!fs.existsSync(componentsDir)) {
      this.errors.push('❌ Directorio components no existe');
      return;
    }

    const componentDirs = fs.readdirSync(componentsDir);
    
    for (const componentDir of componentDirs) {
      const phpFile = path.join(componentsDir, componentDir, `${componentDir}.php`);
      
      if (fs.existsSync(phpFile)) {
        const phpContent = fs.readFileSync(phpFile, 'utf8');
        const functionName = `render_${componentDir.replace('-', '_')}`;
        
        if (!phpContent.includes(`function ${functionName}`)) {
          this.errors.push(`❌ Función ${functionName} no definida en ${componentDir}.php`);
        }
      }
    }
  }

  async validateComponentCalls() {
    console.log('🔍 Validando llamadas a componentes...');
    
    const templateFiles = fs.readdirSync(this.outputDir)
      .filter(file => file.endsWith('.php'))
      .filter(file => file.startsWith('page-'));

    for (const templateFile of templateFiles) {
      const templatePath = path.join(this.outputDir, templateFile);
      const content = fs.readFileSync(templatePath, 'utf8');
      
      // Buscar llamadas a funciones render_*
      const renderCalls = content.match(/render_[\w_]+\s*\(/g);
      
      if (renderCalls) {
        for (const call of renderCalls) {
          const functionName = call.replace('(', '').trim();
          
          // Verificar si está envuelta en PHP tags (buscar en contexto más amplio)
          const callIndex = content.indexOf(call);
          
          // Buscar la última apertura <?php antes de la llamada
          const beforeContent = content.substring(0, callIndex);
          const lastPhpOpen = beforeContent.lastIndexOf('<?php');
          const lastPhpClose = beforeContent.lastIndexOf('?>');
          
          // Buscar el próximo cierre ?> después de la llamada
          const afterContent = content.substring(callIndex);
          const nextPhpClose = afterContent.indexOf('?>');
          
          // Si hay un <?php más reciente que un ?> antes de la llamada, y hay un ?> después, está envuelto correctamente
          const isInPhpBlock = (lastPhpOpen > lastPhpClose) && nextPhpClose !== -1;
          
          if (!isInPhpBlock) {
            this.errors.push(`❌ ${templateFile}: ${functionName} sin tags PHP - no se ejecutará`);
          }
        }
      }
    }
  }

  async validateConfigurationFidelity() {
    console.log('🔍 Validando fidelidad configuración → generación...');
    
    // Cargar configuraciones
    const metadataPath = path.join(this.config.srcDir, 'metadata.json');
    const pageTemplatesPath = path.join(this.config.srcDir, 'page-templates.json');
    
    if (!fs.existsSync(metadataPath)) {
      this.errors.push('❌ metadata.json no encontrado');
      return;
    }
    
    if (!fs.existsSync(pageTemplatesPath)) {
      this.errors.push('❌ page-templates.json no encontrado');
      return;
    }

    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    const pageTemplates = JSON.parse(fs.readFileSync(pageTemplatesPath, 'utf8'));

    // Validar que cada página configurada tenga su archivo
    for (const [pageName, pageConfig] of Object.entries(pageTemplates)) {
      const expectedFile = pageConfig.file || `${pageName}.php`;
      const templatePath = path.join(this.outputDir, expectedFile);
      
      if (!fs.existsSync(templatePath)) {
        this.errors.push(`❌ ${pageName}: archivo ${expectedFile} no generado`);
        continue;
      }

      const templateContent = fs.readFileSync(templatePath, 'utf8');
      
      // Validar que los componentes configurados estén presentes
      if (pageConfig.components) {
        for (const component of pageConfig.components) {
          const functionName = `render_${component.name.replace('-', '_')}`;
          
          if (!templateContent.includes(functionName)) {
            this.errors.push(`❌ ${pageName}: componente ${component.name} configurado pero no presente`);
          }
        }
      }
    }
  }

  generateReport() {
    const totalIssues = this.errors.length + this.warnings.length;
    const isValid = this.errors.length === 0;

    console.log('\n📊 Reporte de Validación Funcional');
    console.log('═'.repeat(50));
    
    if (isValid) {
      console.log('✅ Validación funcional EXITOSA');
    } else {
      console.log('❌ Validación funcional FALLÓ');
    }

    console.log(`📈 Errores críticos: ${this.errors.length}`);
    console.log(`⚠️ Advertencias: ${this.warnings.length}`);

    if (this.errors.length > 0) {
      console.log('\n🚨 ERRORES CRÍTICOS:');
      this.errors.forEach(error => console.log(`   ${error}`));
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️ ADVERTENCIAS:');
      this.warnings.forEach(warning => console.log(`   ${warning}`));
    }

    return {
      isValid,
      errors: this.errors,
      warnings: this.warnings,
      totalIssues
    };
  }
}

module.exports = FunctionalValidator;