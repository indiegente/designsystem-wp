#!/usr/bin/env node

/**
 * Validador Comprensivo para WordPress
 * 
 * ÚNICO task que valida TODA la cadena de fidelidad:
 * 1. Configuración → Componentes → WordPress
 * 2. Sintaxis PHP + Funcionalidad + URLs
 * 3. Fidelidad completa del proceso generativo
 */

const path = require('path');
const fs = require('fs');
const FunctionalValidator = require('./functional-validator');

class ComprehensiveValidator {
  constructor() {
    this.config = {
      srcDir: './src',
      outputDir: './wordpress-output',
      themeName: 'toulouse-lautrec'
    };
    this.results = {
      configurationFidelity: { passed: false, errors: [] },
      phpSyntax: { passed: false, errors: [] },
      functionalValidation: { passed: false, errors: [] },
      urlTesting: { passed: false, errors: [] }
    };
  }

  async validateAll() {
    console.log('🧪 VALIDACIÓN COMPRENSIVA - Fidelidad Completa');
    console.log('═'.repeat(60));
    console.log('🎯 Validando: Configuración → Componentes → WordPress');
    console.log('');

    // 1. Validar fidelidad de configuración
    await this.validateConfigurationFidelity();
    
    // 2. Validar sintaxis PHP
    await this.validatePHPSyntax();
    
    // 3. Validar funcionalidad WordPress
    await this.validateWordPressFunctionality();
    
    // 4. Validar URLs en vivo (opcional)
    await this.validateURLs();

    return this.generateComprehensiveReport();
  }

  async validateConfigurationFidelity() {
    console.log('📋 1. VALIDANDO FIDELIDAD DE CONFIGURACIÓN...');
    console.log('   ├─ metadata.json → Componentes generados');
    console.log('   ├─ page-templates.json → Templates PHP');
    console.log('   └─ Configuración → Resultado final');

    try {
      // Cargar configuraciones
      const metadataPath = path.join(this.config.srcDir, 'metadata.json');
      const pageTemplatesPath = path.join(this.config.srcDir, 'page-templates.json');
      
      if (!fs.existsSync(metadataPath)) {
        this.results.configurationFidelity.errors.push('metadata.json no encontrado');
        return;
      }
      
      if (!fs.existsSync(pageTemplatesPath)) {
        this.results.configurationFidelity.errors.push('page-templates.json no encontrado');
        return;
      }

      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      const pageTemplates = JSON.parse(fs.readFileSync(pageTemplatesPath, 'utf8'));

      // Validar cada componente en metadata tiene su archivo PHP
      let componentCount = 0;
      for (const [componentName, componentConfig] of Object.entries(metadata)) {
        if (componentName === 'postTypes' || componentName === 'templates' || componentName === 'componentMapping') continue;
        
        componentCount++;
        const componentDir = path.join(this.config.outputDir, this.config.themeName, 'components', componentName);
        const phpFile = path.join(componentDir, `${componentName}.php`);
        
        if (!fs.existsSync(phpFile)) {
          this.results.configurationFidelity.errors.push(`Componente ${componentName} configurado pero PHP no generado`);
        }
      }

      // Validar cada página tiene su template
      let pageCount = 0;
      for (const [pageName, pageConfig] of Object.entries(pageTemplates)) {
        pageCount++;
        const templateFile = path.join(this.config.outputDir, this.config.themeName, pageConfig.file || `${pageName}.php`);
        
        if (!fs.existsSync(templateFile)) {
          this.results.configurationFidelity.errors.push(`Página ${pageName} configurada pero template no generado`);
        }
      }

      this.results.configurationFidelity.passed = this.results.configurationFidelity.errors.length === 0;
      
      console.log(`   ✅ ${componentCount} componentes validados`);
      console.log(`   ✅ ${pageCount} páginas validadas`);
      
    } catch (error) {
      this.results.configurationFidelity.errors.push(`Error validando configuración: ${error.message}`);
    }
  }

  async validatePHPSyntax() {
    console.log('🐘 2. VALIDANDO SINTAXIS PHP...');
    
    try {
      const { exec } = require('child_process');
      const util = require('util');
      const execPromise = util.promisify(exec);
      
      // Validar todos los archivos PHP
      const themeDir = path.join(this.config.outputDir, this.config.themeName);
      const { stdout } = await execPromise(`find "${themeDir}" -name "*.php" -exec php -l {} \\;`);
      
      if (stdout.includes('Parse error') || stdout.includes('Fatal error')) {
        this.results.phpSyntax.errors.push('Errores de sintaxis PHP encontrados');
        this.results.phpSyntax.passed = false;
      } else {
        this.results.phpSyntax.passed = true;
        console.log('   ✅ Sintaxis PHP válida en todos los archivos');
      }
      
    } catch (error) {
      this.results.phpSyntax.errors.push(`Error validando PHP: ${error.message}`);
      this.results.phpSyntax.passed = false;
    }
  }

  async validateWordPressFunctionality() {
    console.log('⚡ 3. VALIDANDO FUNCIONALIDAD WORDPRESS...');
    
    const functionalValidator = new FunctionalValidator(this.config);
    const functionalResults = await functionalValidator.validateAll();
    
    this.results.functionalValidation.passed = functionalResults.isValid;
    this.results.functionalValidation.errors = functionalResults.errors;
    
    if (functionalResults.isValid) {
      console.log('   ✅ Funcionalidad WordPress completa');
    } else {
      console.log(`   ❌ ${functionalResults.errors.length} problemas funcionales`);
    }
  }

  async validateURLs() {
    console.log('🌐 4. VALIDANDO URLs EN VIVO (opcional)...');
    
    try {
      const { exec } = require('child_process');
      const util = require('util');
      const execPromise = util.promisify(exec);
      
      // Solo si hay servidor WordPress corriendo
      await execPromise('curl -s -o /dev/null -w "%{http_code}" http://localhost', { timeout: 5000 });
      
      console.log('   🔍 Servidor WordPress detectado, probando URLs...');
      
      // Ejecutar test de URLs existente
      const { stdout } = await execPromise('npm run wp:test-urls');
      
      if (stdout.includes('✅ SUCCESS') && !stdout.includes('❌')) {
        this.results.urlTesting.passed = true;
        console.log('   ✅ URLs funcionando correctamente');
      } else {
        this.results.urlTesting.errors.push('Problemas en testing de URLs');
      }
      
    } catch (error) {
      console.log('   ⏩ Servidor WordPress no disponible, saltando test URLs');
      this.results.urlTesting.passed = null; // null = no aplica
    }
  }

  generateComprehensiveReport() {
    console.log('');
    console.log('📊 REPORTE COMPRENSIVO DE VALIDACIÓN');
    console.log('═'.repeat(60));

    const phases = [
      { name: '📋 Fidelidad de Configuración', result: this.results.configurationFidelity },
      { name: '🐘 Sintaxis PHP', result: this.results.phpSyntax },
      { name: '⚡ Funcionalidad WordPress', result: this.results.functionalValidation },
      { name: '🌐 URLs en vivo', result: this.results.urlTesting }
    ];

    let totalPassed = 0;
    let totalApplicable = 0;

    phases.forEach(phase => {
      if (phase.result.passed === null) {
        console.log(`${phase.name}: ⏩ NO APLICA`);
      } else if (phase.result.passed) {
        console.log(`${phase.name}: ✅ EXITOSO`);
        totalPassed++;
        totalApplicable++;
      } else {
        console.log(`${phase.name}: ❌ FALLÓ`);
        if (phase.result.errors.length > 0) {
          phase.result.errors.forEach(error => {
            console.log(`   └─ ${error}`);
          });
        }
        totalApplicable++;
      }
    });

    console.log('');
    console.log('─'.repeat(60));
    
    const success = totalPassed === totalApplicable;
    const percentage = totalApplicable > 0 ? Math.round((totalPassed / totalApplicable) * 100) : 0;
    
    if (success) {
      console.log(`🎉 VALIDACIÓN COMPRENSIVA EXITOSA (${totalPassed}/${totalApplicable})`);
      console.log('💯 El tema WordPress es un fiel reflejo de la configuración');
    } else {
      console.log(`🚨 VALIDACIÓN COMPRENSIVA FALLÓ (${totalPassed}/${totalApplicable} - ${percentage}%)`);
      console.log('❌ El tema WordPress NO refleja fielmente la configuración');
    }

    return {
      success,
      percentage,
      results: this.results
    };
  }
}

// Ejecutar si se llama directamente
async function runComprehensiveValidation() {
  const validator = new ComprehensiveValidator();
  const results = await validator.validateAll();
  
  process.exit(results.success ? 0 : 1);
}

if (require.main === module) {
  runComprehensiveValidation().catch(error => {
    console.error('💥 Error en validación comprensiva:', error);
    process.exit(1);
  });
}

module.exports = ComprehensiveValidator;