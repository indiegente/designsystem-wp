/**
 * Validation Result Data Structures
 *
 * Estructuras de datos consistentes para resultados de validación
 */

class ValidationResult {
  constructor(validator, status = 'PENDING') {
    this.validator = validator;
    this.status = status; // 'PASS' | 'WARN' | 'FAIL' | 'ERROR' | 'PENDING'
    this.errors = [];
    this.warnings = [];
    this.passed = [];
    this.metadata = {};
    this.timestamp = new Date().toISOString();
    this.duration = 0;
  }

  /**
   * Agrega un error al resultado
   */
  addError(message, metadata = {}) {
    this.errors.push({
      message,
      metadata,
      timestamp: new Date().toISOString()
    });
    this.updateStatus();
  }

  /**
   * Agrega una advertencia al resultado
   */
  addWarning(message, metadata = {}) {
    this.warnings.push({
      message,
      metadata,
      timestamp: new Date().toISOString()
    });
    this.updateStatus();
  }

  /**
   * Agrega un test pasado al resultado
   */
  addPassed(message, metadata = {}) {
    this.passed.push({
      message,
      metadata,
      timestamp: new Date().toISOString()
    });
    this.updateStatus();
  }

  /**
   * Actualiza el status basado en errores/warnings
   */
  updateStatus() {
    if (this.errors.length > 0) {
      this.status = 'FAIL';
    } else if (this.warnings.length > 0) {
      this.status = 'WARN';
    } else if (this.passed.length > 0) {
      this.status = 'PASS';
    }
  }

  /**
   * Obtiene un resumen del resultado
   */
  getSummary() {
    return {
      validator: this.validator,
      status: this.status,
      total: this.errors.length + this.warnings.length + this.passed.length,
      errors: this.errors.length,
      warnings: this.warnings.length,
      passed: this.passed.length,
      duration: this.duration
    };
  }

  /**
   * Convierte el resultado a JSON serializable
   */
  toJSON() {
    return {
      validator: this.validator,
      status: this.status,
      errors: this.errors,
      warnings: this.warnings,
      passed: this.passed,
      metadata: this.metadata,
      timestamp: this.timestamp,
      duration: this.duration,
      summary: this.getSummary()
    };
  }

  /**
   * Combina múltiples resultados en uno
   */
  static combine(results, name = 'combined') {
    const combined = new ValidationResult(name);

    results.forEach(result => {
      combined.errors.push(...result.errors);
      combined.warnings.push(...result.warnings);
      combined.passed.push(...result.passed);

      // Combinar metadata
      Object.assign(combined.metadata, result.metadata);
    });

    combined.updateStatus();
    return combined;
  }

  /**
   * Crea un resultado desde un objeto plano
   */
  static fromObject(obj) {
    const result = new ValidationResult(obj.validator, obj.status);
    result.errors = obj.errors || [];
    result.warnings = obj.warnings || [];
    result.passed = obj.passed || [];
    result.metadata = obj.metadata || {};
    result.timestamp = obj.timestamp || new Date().toISOString();
    result.duration = obj.duration || 0;
    return result;
  }
}

/**
 * Reporte de validación completo
 */
class ValidationReport {
  constructor(name = 'Validation Report') {
    this.name = name;
    this.results = new Map();
    this.startTime = new Date();
    this.endTime = null;
    this.metadata = {};
  }

  /**
   * Agrega un resultado de validator
   */
  addResult(validatorName, result) {
    this.results.set(validatorName, result);
  }

  /**
   * Finaliza el reporte
   */
  finalize() {
    this.endTime = new Date();
    return this;
  }

  /**
   * Obtiene el status general del reporte
   */
  getOverallStatus() {
    const statuses = Array.from(this.results.values()).map(r => r.status);

    if (statuses.includes('FAIL') || statuses.includes('ERROR')) {
      return 'FAIL';
    }
    if (statuses.includes('WARN')) {
      return 'WARN';
    }
    return 'PASS';
  }

  /**
   * Obtiene estadísticas del reporte
   */
  getStats() {
    const results = Array.from(this.results.values());

    return {
      totalValidators: results.length,
      passed: results.filter(r => r.status === 'PASS').length,
      warnings: results.filter(r => r.status === 'WARN').length,
      failed: results.filter(r => r.status === 'FAIL').length,
      errors: results.filter(r => r.status === 'ERROR').length,
      totalTests: results.reduce((sum, r) => sum + r.getSummary().total, 0),
      totalErrors: results.reduce((sum, r) => sum + r.errors.length, 0),
      totalWarnings: results.reduce((sum, r) => sum + r.warnings.length, 0),
      totalPassed: results.reduce((sum, r) => sum + r.passed.length, 0),
      duration: this.endTime ? this.endTime - this.startTime : 0
    };
  }

  /**
   * Genera reporte en formato texto
   */
  generateTextReport() {
    const stats = this.getStats();
    const overallStatus = this.getOverallStatus();

    let report = `\n📊 ${this.name}\n`;
    report += `${'═'.repeat(this.name.length + 4)}\n`;
    report += `🎯 Status: ${this.getStatusIcon(overallStatus)} ${overallStatus}\n`;
    report += `⏱️  Duración: ${(stats.duration / 1000).toFixed(2)}s\n`;
    report += `📋 Validators: ${stats.totalValidators}\n`;
    report += `✅ Passed: ${stats.totalPassed}\n`;
    report += `⚠️  Warnings: ${stats.totalWarnings}\n`;
    report += `❌ Errors: ${stats.totalErrors}\n\n`;

    // Detalles por validator
    this.results.forEach((result, validatorName) => {
      const summary = result.getSummary();
      report += `${this.getStatusIcon(result.status)} ${validatorName}: ${result.status}`;

      // Mostrar contadores si hay issues
      if (result.errors.length > 0 || result.warnings.length > 0) {
        report += ` (${summary.errors} errors, ${summary.warnings} warnings)`;
      }
      report += '\n';

      // Mostrar primeros 5 errores
      if (result.errors.length > 0) {
        result.errors.slice(0, 5).forEach(error => {
          report += `   ❌ ${error.message}\n`;
        });
        if (result.errors.length > 5) {
          report += `   ... y ${result.errors.length - 5} errores más\n`;
        }
      }

      // Mostrar primeras 3 warnings
      if (result.warnings.length > 0) {
        result.warnings.slice(0, 3).forEach(warning => {
          report += `   ⚠️  ${warning.message}\n`;
        });
        if (result.warnings.length > 3) {
          report += `   ... y ${result.warnings.length - 3} advertencias más\n`;
        }
      }

      report += '\n';
    });

    return report;
  }

  /**
   * Obtiene ícono para status
   */
  getStatusIcon(status) {
    switch (status) {
      case 'PASS': return '✅';
      case 'WARN': return '⚠️';
      case 'FAIL': case 'ERROR': return '❌';
      default: return '📋';
    }
  }

  /**
   * Convierte el reporte a JSON
   */
  toJSON() {
    return {
      name: this.name,
      overallStatus: this.getOverallStatus(),
      stats: this.getStats(),
      results: Object.fromEntries(
        Array.from(this.results.entries()).map(([name, result]) => [name, result.toJSON()])
      ),
      metadata: this.metadata,
      startTime: this.startTime.toISOString(),
      endTime: this.endTime ? this.endTime.toISOString() : null
    };
  }
}

module.exports = {
  ValidationResult,
  ValidationReport
};