/**
 * Base Validator Interface
 *
 * Interfaz común para todos los validators del sistema.
 * Garantiza consistencia y permite composición fácil.
 */
class ValidatorInterface {
  constructor(name, config = {}) {
    this.name = name;
    this.config = config;
    this.errors = [];
    this.warnings = [];
    this.passed = [];
  }

  /**
   * Método principal de validación - debe ser implementado por cada validator
   * @param {Object} source - Fuente de datos (HTML, archivos, config)
   * @param {Object} context - Contexto adicional (URL, página, etc.)
   * @returns {ValidationResult}
   */
  async validate(source, context = {}) {
    throw new Error(`Validator ${this.name} must implement validate() method`);
  }

  /**
   * Valida una condición específica
   * @param {boolean} condition - Condición a validar
   * @param {string} message - Mensaje de error si falla
   * @param {string} type - 'error' | 'warning' | 'passed'
   * @param {Object} metadata - Información adicional
   */
  assert(condition, message, type = 'error', metadata = {}) {
    const result = {
      message,
      metadata,
      validator: this.name,
      timestamp: new Date().toISOString()
    };

    if (condition) {
      this.passed.push({ ...result, type: 'passed' });
    } else {
      if (type === 'warning') {
        this.warnings.push({ ...result, type: 'warning' });
      } else {
        this.errors.push({ ...result, type: 'error' });
      }
    }

    return condition;
  }

  /**
   * Resetea el estado del validator
   */
  reset() {
    this.errors = [];
    this.warnings = [];
    this.passed = [];
  }

  /**
   * Obtiene el resultado de la validación
   * @returns {ValidationResult}
   */
  getResult() {
    const result = {
      validator: this.name,
      status: this.getStatus(),
      errors: this.errors,
      warnings: this.warnings,
      passed: this.passed,
      getSummary: () => ({
        total: this.errors.length + this.warnings.length + this.passed.length,
        errors: this.errors.length,
        warnings: this.warnings.length,
        passed: this.passed.length
      })
    };

    return result;
  }

  /**
   * Determina el status general del validator
   * @returns {'PASS' | 'WARN' | 'FAIL'}
   */
  getStatus() {
    if (this.errors.length > 0) return 'FAIL';
    if (this.warnings.length > 0) return 'WARN';
    return 'PASS';
  }

  /**
   * Helper para validaciones comunes de HTML
   * @param {string} html - Contenido HTML
   * @param {string} pattern - Patrón a buscar
   * @param {string} description - Descripción de qué se está validando
   * @param {string} type - Tipo de validación
   */
  validateHtmlContains(html, pattern, description, type = 'error') {
    const contains = html.includes(pattern);
    this.assert(contains, `${description}: patrón '${pattern}' ${contains ? 'encontrado' : 'no encontrado'}`, type);
    return contains;
  }

  /**
   * Helper para validaciones de archivos
   * @param {string} filePath - Ruta del archivo
   * @param {string} description - Descripción del archivo
   */
  validateFileExists(filePath, description) {
    const fs = require('fs');
    const exists = fs.existsSync(filePath);
    this.assert(exists, `${description}: archivo ${exists ? 'existe' : 'no encontrado'} en ${filePath}`);
    return exists;
  }

  /**
   * Helper para validaciones de regex
   * @param {string} content - Contenido a validar
   * @param {RegExp} regex - Expresión regular
   * @param {string} description - Descripción
   * @param {string} type - Tipo de validación
   */
  validateRegex(content, regex, description, type = 'error') {
    const matches = regex.test(content);
    this.assert(matches, `${description}: patrón ${matches ? 'encontrado' : 'no encontrado'}`, type);
    return matches;
  }
}

module.exports = ValidatorInterface;