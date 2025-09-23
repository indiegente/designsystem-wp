#!/usr/bin/env node

const { ValidationEngine } = require('../core/validation-engine');
const HTMLSource = require('../sources/html-source');
const ConfigSource = require('../sources/config-source');

// Validators
const SEOValidator = require('../validators/seo-validator');
const ComponentValidator = require('../validators/component-validator');
const AssetValidator = require('../validators/asset-validator');

/**
 * WordPress Live Validation CLI
 *
 * Valida WordPress corriendo en vivo con HTML real
 * Requiere que WordPress esté ejecutándose en la URL especificada
 */
class LiveValidationCLI {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || process.argv[2] || 'http://localhost';
    this.config = config;
  }

  /**
   * Ejecuta validación completa de URLs
   */
  async run() {
    console.log('🌐 WordPress Live Validation');
    console.log('═══════════════════════════════════════════');
    console.log(`🔗 WordPress URL: ${this.baseUrl}`);
    console.log('⚠️  Requiere WordPress ejecutándose');
    console.log('');

    try {
      // 1. Cargar configuraciones del proyecto
      const configSource = ConfigSource.create();
      const configs = await configSource.prepare({});

      // 2. Generar URLs de test
      const testUrls = await configSource.getTestUrls(this.baseUrl);
      console.log(`📋 URLs a validar: ${testUrls.length}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // 3. Obtener HTML de todas las URLs
      const htmlSource = HTMLSource.create({
        timeout: 10000,
        retries: 2
      });

      // 4. Configurar validation engine
      const engine = ValidationEngine.builder()
        .source('html', htmlSource)
        .source('config', configSource)
        .validator('seo', new SEOValidator())
        .validator('components', new ComponentValidator())
        .validator('assets', new AssetValidator())
        .middleware({
          before: async (context) => {
            console.log('🔄 Preparando validaciones...');
            // Preparar contexto con URLs
            context.urls = testUrls;
          },
          after: async (report, context) => {
            console.log('✅ Validaciones completadas');
            // Generar archivos de reporte si es necesario
            await this.generateReports(report, context);
          }
        })
        .build();

      // 5. Ejecutar validaciones para cada URL
      const results = [];

      for (const urlConfig of testUrls) {
        console.log(`\n🔍 Validando: ${urlConfig.name} (${urlConfig.url})`);

        try {
          // Preparar contexto específico para esta URL
          const urlContext = {
            url: urlConfig.url,
            page: urlConfig.name,
            type: urlConfig.type,
            expectedComponents: urlConfig.expectedComponents,
            urls: [urlConfig] // Solo esta URL
          };

          // Ejecutar validaciones
          const report = await engine.runAll(urlContext);
          results.push({
            url: urlConfig.url,
            name: urlConfig.name,
            report: report
          });

          // Mostrar resultado inmediato
          this.showURLResult(urlConfig, report);

        } catch (error) {
          console.log(`   ❌ Error validando ${urlConfig.name}: ${error.message}`);
          results.push({
            url: urlConfig.url,
            name: urlConfig.name,
            error: error.message
          });
        }
      }

      // 6. Generar reporte consolidado
      this.generateConsolidatedReport(results);

      // 7. Determinar código de salida
      const hasErrors = results.some(result =>
        result.error || (result.report && result.report.getOverallStatus() === 'FAIL')
      );

      process.exit(hasErrors ? 1 : 0);

    } catch (error) {
      console.error(`❌ Error en validación: ${error.message}`);
      if (this.config.debug) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  }

  /**
   * Muestra resultado inmediato para una URL
   */
  showURLResult(urlConfig, report) {
    const status = report.getOverallStatus();
    const stats = report.getStats();
    const icon = this.getStatusIcon(status);

    console.log(`   ${icon} ${status} - ${stats.totalPassed} passed, ${stats.totalWarnings} warnings, ${stats.totalErrors} errors`);

    // Mostrar errores críticos inmediatamente
    if (stats.totalErrors > 0) {
      Array.from(report.results.values()).forEach(result => {
        if (result.errors.length > 0) {
          result.errors.slice(0, 3).forEach(error => { // Solo primeros 3 errores
            console.log(`     ❌ ${error.message}`);
          });
        }
      });
    }

    // Mostrar warnings importantes si no hay errores
    if (stats.totalErrors === 0 && stats.totalWarnings > 0) {
      Array.from(report.results.values()).forEach(result => {
        if (result.warnings.length > 0) {
          result.warnings.slice(0, 2).forEach(warning => { // Solo primeras 2 warnings
            console.log(`     ⚠️  ${warning.message}`);
          });
        }
      });
    }
  }

  /**
   * Genera reporte consolidado final
   */
  generateConsolidatedReport(results) {
    console.log('\n📊 Reporte Consolidado');
    console.log('═══════════════════════════════════════');

    let totalURLs = results.length;
    let successfulURLs = 0;
    let warningURLs = 0;
    let failedURLs = 0;
    let errorURLs = 0;

    let totalValidations = 0;
    let totalPassed = 0;
    let totalWarnings = 0;
    let totalErrors = 0;

    results.forEach(result => {
      if (result.error) {
        errorURLs++;
        console.log(`❌ ${result.name}: ERROR - ${result.error}`);
      } else if (result.report) {
        const status = result.report.getOverallStatus();
        const stats = result.report.getStats();
        const icon = this.getStatusIcon(status);

        console.log(`${icon} ${result.name}: ${status}`);

        totalValidations += stats.totalTests;
        totalPassed += stats.totalPassed;
        totalWarnings += stats.totalWarnings;
        totalErrors += stats.totalErrors;

        switch (status) {
          case 'PASS':
            successfulURLs++;
            break;
          case 'WARN':
            warningURLs++;
            break;
          case 'FAIL':
            failedURLs++;
            break;
        }
      }
    });

    // Estadísticas finales
    console.log('\n📈 Estadísticas Generales');
    console.log('─────────────────────────────────────────');
    console.log(`🌐 URLs validadas: ${totalURLs}`);
    console.log(`✅ Exitosas: ${successfulURLs}`);
    console.log(`⚠️  Con advertencias: ${warningURLs}`);
    console.log(`❌ Fallidas: ${failedURLs}`);
    console.log(`🚫 Errores de conexión: ${errorURLs}`);
    console.log(`📊 Total validaciones: ${totalValidations}`);
    console.log(`📈 Tasa de éxito: ${totalValidations > 0 ? ((totalPassed / totalValidations) * 100).toFixed(1) : 0}%`);

    // Estado general
    const overallStatus = this.getOverallStatus(results);
    console.log(`\n🎯 Estado general: ${this.getStatusIcon(overallStatus)} ${overallStatus}`);

    if (overallStatus !== 'SUCCESS') {
      console.log('\n💡 Recomendaciones:');
      console.log('   • Revisar errores específicos arriba');
      console.log('   • Verificar que WordPress esté ejecutándose');
      console.log('   • Comprobar que el tema esté activado');
      console.log('   • Ejecutar npm run wp:generate si hay cambios');
    }
  }

  /**
   * Genera reportes adicionales (archivos)
   */
  async generateReports(report, context) {
    // Generar reporte JSON si es necesario
    if (this.config.outputJson) {
      const fs = require('fs');
      const reportPath = this.config.outputJson;

      try {
        fs.writeFileSync(reportPath, JSON.stringify(report.toJSON(), null, 2));
        console.log(`📄 Reporte JSON guardado: ${reportPath}`);
      } catch (error) {
        console.warn(`⚠️ No se pudo guardar reporte JSON: ${error.message}`);
      }
    }
  }

  /**
   * Determina estado general de todas las validaciones
   */
  getOverallStatus(results) {
    const hasErrors = results.some(result => result.error);
    const hasFailures = results.some(result =>
      result.report && result.report.getOverallStatus() === 'FAIL'
    );
    const hasWarnings = results.some(result =>
      result.report && result.report.getOverallStatus() === 'WARN'
    );

    if (hasErrors || hasFailures) return 'FAIL';
    if (hasWarnings) return 'WARN';
    return 'SUCCESS';
  }

  /**
   * Obtiene ícono para status
   */
  getStatusIcon(status) {
    switch (status) {
      case 'SUCCESS':
      case 'PASS':
        return '✅';
      case 'WARN':
        return '⚠️';
      case 'FAIL':
      case 'ERROR':
        return '❌';
      default:
        return '📋';
    }
  }

  /**
   * Método estático para ejecución desde CLI
   */
  static async run() {
    const config = {
      baseUrl: process.argv[2] || 'http://localhost',
      outputJson: process.argv.includes('--json') ? 'live-validation-report.json' : null,
      debug: process.argv.includes('--debug')
    };

    const validator = new LiveValidationCLI(config);
    await validator.run();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  LiveValidationCLI.run();
}

module.exports = LiveValidationCLI;