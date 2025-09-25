#!/usr/bin/env node

const { ValidationEngine } = require('../core/validation-engine');

// Validators que NO requieren HTML (single source of truth)
const ComponentValidator = require('../validators/component-validator');
const MetadataValidator = require('../validators/metadata-validator');
const PHPValidator = require('../validators/php-validator');
const StructureValidator = require('../validators/structure-validator');

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
      // 1. Configurar validation engine (single source of truth)
      const engine = this.setupValidationEngine();

      // 2. Preparar contexto básico
      const context = {
        projectRoot: process.cwd(),
        environment: process.env.NODE_ENV || 'development',
        mode: 'offline'
      };

      console.log('📋 Usando ConfigSingleton como source of truth');
      console.log('🚀 Ejecutando validaciones offline...');

      // 3. Ejecutar validaciones
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
    const builder = ValidationEngine.builder();

    // Solo validators que funcionan sin HTML
    if (this.config.includeStructure && !this.config.componentsOnly) {
      builder.validator('structure', new StructureValidator({ mode: 'offline' }));
    }

    if (this.config.includeComponents) {
      // 📋 NUEVO: MetadataValidator para validaciones Babel AST
      builder.validator('metadata', new MetadataValidator({ mode: 'offline' }));

      // ComponentValidator ahora soporta modo offline
      builder.validator('components', new ComponentValidator({ mode: 'offline' }));

      // 🐘 NUEVO: PHPValidator migrado y modernizado
      builder.validator('php', new PHPValidator({ mode: 'offline' }));
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

// Validators inline eliminados - usar validators modulares existentes

// Ejecutar si se llama directamente
if (require.main === module) {
  OfflineValidationCLI.run();
}

module.exports = OfflineValidationCLI;