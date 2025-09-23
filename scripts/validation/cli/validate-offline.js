#!/usr/bin/env node

const { ValidationEngine } = require('../core/validation-engine');
const ConfigSource = require('../sources/config-source');

// Validators que NO requieren HTML
const ComponentValidator = require('../validators/component-validator');

/**
 * Offline Validation CLI
 *
 * Validación sin HTML - durante desarrollo y build
 * Solo usa archivos del filesystem y configuraciones
 */
class OfflineValidationCLI {
  constructor(config = {}) {
    this.config = {
      includeStructure: true,
      includeSecurity: true,
      includeComponents: true,
      componentsOnly: false,
      outputJson: null,
      verbose: false,
      ...config
    };
  }

  /**
   * Ejecuta validación offline
   */
  async run() {
    console.log('🔧 WordPress Offline Validation');
    console.log('═══════════════════════════════════════');
    console.log('📁 Validando archivos y configuraciones');
    console.log('');

    try {
      // 1. Cargar configuraciones
      const configSource = ConfigSource.create();
      const configs = await configSource.prepare({});

      console.log('📋 Configuraciones cargadas:');
      console.log(`   • Componentes: ${Object.keys(configs.metadata).length}`);
      console.log(`   • Páginas: ${Object.keys(configs.pageTemplates).length}`);
      console.log(`   • Proyecto: ${configs.packageJson.name || 'sin nombre'}`);
      console.log('');

      // 2. Configurar validation engine (solo validators offline)
      const engine = this.setupValidationEngine();

      // 3. Preparar contexto
      const context = {
        configs,
        projectRoot: process.cwd(),
        environment: process.env.NODE_ENV || 'development',
        mode: 'offline'
      };

      // 4. Ejecutar validaciones
      console.log('🚀 Ejecutando validaciones offline...');
      const report = await engine.runAll(context);

      // 5. Mostrar resultados
      console.log('\n' + report.generateTextReport());

      // 6. Generar archivos de reporte
      await this.generateReports(report);

      // 7. Resumen final
      const stats = report.getStats();
      const overallStatus = report.getOverallStatus();

      console.log(`\n📊 Resumen Offline:`);
      console.log(`   • Validators ejecutados: ${stats.totalValidators}`);
      console.log(`   • Tests realizados: ${stats.totalTests}`);
      console.log(`   • Errores: ${stats.totalErrors}`);
      console.log(`   • Advertencias: ${stats.totalWarnings}`);

      console.log(`\n🏁 Estado: ${this.getStatusIcon(overallStatus)} ${overallStatus}`);

      if (overallStatus !== 'PASS') {
        console.log('\n💡 Próximos pasos:');
        console.log('   • Corregir errores mostrados arriba');
        console.log('   • Ejecutar npm run wp:generate si hay cambios');
        console.log('   • Usar npm run wp:validate:live para validación completa');
      }

      // 8. Código de salida
      const exitCode = overallStatus === 'FAIL' ? 1 : 0;
      process.exit(exitCode);

    } catch (error) {
      console.error(`❌ Error en validación offline: ${error.message}`);
      if (this.config.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  }

  /**
   * Configura el validation engine solo con validators offline
   */
  setupValidationEngine() {
    const builder = ValidationEngine.builder()
      .source('config', ConfigSource.create());

    // Solo validators que funcionan sin HTML
    if (this.config.includeStructure && !this.config.componentsOnly) {
      builder.validator('structure', new FileStructureValidator());
    }

    if (this.config.includeSecurity && !this.config.componentsOnly) {
      builder.validator('security', new WordPressSecurityValidator());
    }

    if (this.config.includeComponents) {
      // ComponentValidator ahora soporta modo offline
      builder.validator('components', new ComponentValidator({ mode: 'offline' }));
    }

    // Middleware para logging
    builder.middleware({
      before: async (context) => {
        console.log('🔄 Preparando validaciones offline...');
      },
      after: async (report, context) => {
        const stats = report.getStats();
        console.log(`✅ Offline completado: ${stats.totalValidators} validators`);
      }
    });

    return builder.build();
  }

  /**
   * Genera reportes adicionales
   */
  async generateReports(report) {
    if (this.config.outputJson) {
      const fs = require('fs');
      try {
        fs.writeFileSync(this.config.outputJson, JSON.stringify(report.toJSON(), null, 2));
        console.log(`📄 Reporte JSON: ${this.config.outputJson}`);
      } catch (error) {
        console.warn(`⚠️ No se pudo guardar reporte JSON: ${error.message}`);
      }
    }
  }

  /**
   * Obtiene ícono para status
   */
  getStatusIcon(status) {
    switch (status) {
      case 'PASS': return '✅';
      case 'WARN': return '⚠️';
      case 'FAIL': return '❌';
      default: return '📋';
    }
  }

  /**
   * Método estático para ejecución desde CLI
   */
  static async run() {
    const args = process.argv.slice(2);

    const config = {
      includeStructure: !args.includes('--no-structure'),
      includeSecurity: !args.includes('--no-security'),
      includeComponents: !args.includes('--no-components'),
      componentsOnly: args.includes('--components-only'),
      outputJson: args.includes('--json') ? 'offline-validation-report.json' : null,
      verbose: args.includes('--verbose') || args.includes('-v')
    };

    const validator = new OfflineValidationCLI(config);
    await validator.run();
  }
}

// Validators básicos para modo offline
class FileStructureValidator extends require('../core/validator-interface') {
  constructor() {
    super('File Structure Validator');
    this.requiredSources = ['config'];
  }

  async validate(sources) {
    const { configs } = sources.config || {};

    console.log('   📁 Validando estructura de archivos...');

    // Validar estructura de archivos
    this.validateFileStructure();

    // Validar configuraciones básicas
    this.validateConfigurations(configs);

    // Validar dependencias
    this.validateDependencies(configs);
  }

  validateFileStructure() {
    const fs = require('fs');
    const requiredFiles = [
      'package.json',
      'src/metadata.json',
      'src/page-templates.json'
    ];

    requiredFiles.forEach(file => {
      this.validateFileExists(file, `Archivo requerido: ${file}`);
    });

    // Validar estructura de directorios
    const requiredDirs = [
      'src',
      'scripts/wp-generator'
    ];

    requiredDirs.forEach(dir => {
      this.assert(
        fs.existsSync(dir),
        `Directorio requerido: ${dir}`,
        'error',
        { type: 'directory', path: dir }
      );
    });

    // Validar que wordpress-output existe si estamos validando generación
    const hasWordPressOutput = fs.existsSync('wordpress-output');
    this.assert(
      hasWordPressOutput,
      'Directorio wordpress-output debe existir (ejecutar npm run wp:generate)',
      'warning',
      { type: 'wordpress-output' }
    );
  }

  validateConfigurations(configs) {
    if (!configs) return;

    const { metadata, pageTemplates, packageJson } = configs;

    // Validar metadata
    this.assert(
      Object.keys(metadata).length > 0,
      'metadata.json debe contener componentes',
      'error',
      { type: 'config-metadata' }
    );

    // Validar page templates
    this.assert(
      Object.keys(pageTemplates).length > 0,
      'page-templates.json debe contener páginas',
      'error',
      { type: 'config-pages' }
    );

    // Validar package.json
    this.assert(
      packageJson.name && packageJson.name.length > 0,
      'package.json debe tener nombre del proyecto',
      'error',
      { type: 'config-package' }
    );
  }

  validateDependencies(configs) {
    const { packageJson } = configs || {};
    if (!packageJson) return;

    // Validar dependencias críticas
    const criticalDeps = ['vite'];
    const devDeps = packageJson.devDependencies || {};
    const deps = packageJson.dependencies || {};

    criticalDeps.forEach(dep => {
      const hasDep = deps[dep] || devDeps[dep];
      this.assert(
        hasDep,
        `Dependencia crítica faltante: ${dep}`,
        'error',
        { type: 'dependency', package: dep }
      );
    });
  }
}

class WordPressSecurityValidator extends require('../core/validator-interface') {
  constructor() {
    super('WordPress Security Validator');
    this.requiredSources = ['config'];
  }

  async validate(sources) {
    console.log('   🔒 Validando seguridad de WordPress...');

    // Validar configuraciones de seguridad
    this.validateSecurityConfigurations();

    // Validar archivos generados
    this.validateGeneratedFiles();
  }

  validateSecurityConfigurations() {
    // Validar que no hay secrets hardcoded
    this.validateNoHardcodedSecrets();
  }

  validateGeneratedFiles() {
    const fs = require('fs');

    // Buscar archivos PHP generados
    const outputDir = 'wordpress-output';
    if (!fs.existsSync(outputDir)) {
      this.assert(
        false,
        'wordpress-output no existe - ejecutar npm run wp:generate primero',
        'warning',
        { type: 'no-wordpress-output' }
      );
      return;
    }

    this.scanDirectoryForSecurityIssues(outputDir);
  }

  validateNoHardcodedSecrets() {
    const sensitivePatterns = [
      /api[_-]?key\s*[:=]\s*['"][^'"]+['"]/i,
      /secret[_-]?key\s*[:=]\s*['"][^'"]+['"]/i,
      /password\s*[:=]\s*['"][^'"]+['"]/i,
      /token\s*[:=]\s*['"][^'"]+['"]/i
    ];

    // Buscar en archivos de configuración
    const configFiles = ['src/metadata.json', 'src/page-templates.json'];

    configFiles.forEach(file => {
      if (require('fs').existsSync(file)) {
        const content = require('fs').readFileSync(file, 'utf8');

        sensitivePatterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) {
            this.assert(
              false,
              `Posible secret hardcoded en ${file}`,
              'error',
              { type: 'hardcoded-secret', file, pattern: pattern.toString() }
            );
          }
        });
      }
    });
  }

  scanDirectoryForSecurityIssues(dir) {
    const fs = require('fs');
    const path = require('path');

    try {
      const files = fs.readdirSync(dir);

      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          this.scanDirectoryForSecurityIssues(filePath);
        } else if (file.endsWith('.php')) {
          this.validatePHPFile(filePath);
        }
      });
    } catch (error) {
      // Ignorar errores de acceso a directorios
    }
  }

  validatePHPFile(filePath) {
    try {
      const content = require('fs').readFileSync(filePath, 'utf8');

      // Validar escape de datos
      const hasOutput = content.includes('echo') || content.includes('<?=');
      const hasEscape = content.includes('esc_') || content.includes('wp_kses');

      if (hasOutput) {
        this.assert(
          hasEscape,
          `Archivo ${filePath} puede tener output sin escape`,
          'warning',
          { type: 'php-escape', file: filePath }
        );
      }

      // Validar que no hay eval() o similar
      const dangerousFunctions = ['eval(', 'exec(', 'system(', 'shell_exec('];
      dangerousFunctions.forEach(func => {
        this.assert(
          !content.includes(func),
          `Función peligrosa ${func} en ${filePath}`,
          'error',
          { type: 'dangerous-function', file: filePath, function: func }
        );
      });

    } catch (error) {
      // Ignorar errores de lectura de archivos
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  OfflineValidationCLI.run();
}

module.exports = OfflineValidationCLI;