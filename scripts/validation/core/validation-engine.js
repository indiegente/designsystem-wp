const { ValidationReport } = require('./validation-result');

/**
 * Validation Engine
 *
 * Orchestrador principal que ejecuta múltiples validators
 * y genera reportes consolidados.
 */
class ValidationEngine {
  constructor(config = {}) {
    this.config = config;
    this.validators = new Map();
    this.sources = new Map();
    this.middleware = [];
  }

  /**
   * Registra un validator
   * @param {string} name - Nombre del validator
   * @param {ValidatorInterface} validator - Instancia del validator
   */
  registerValidator(name, validator) {
    this.validators.set(name, validator);
    return this;
  }

  /**
   * Registra una fuente de datos
   * @param {string} name - Nombre de la fuente
   * @param {Object} source - Fuente de datos
   */
  registerSource(name, source) {
    this.sources.set(name, source);
    return this;
  }

  /**
   * Agrega middleware que se ejecuta antes/después de validaciones
   * @param {Function} middleware - Función middleware
   */
  use(middleware) {
    this.middleware.push(middleware);
    return this;
  }

  /**
   * Ejecuta validaciones específicas
   * @param {Array<string>} validatorNames - Nombres de validators a ejecutar
   * @param {Object} context - Contexto de ejecución
   * @returns {ValidationReport}
   */
  async runValidators(validatorNames, context = {}) {
    const report = new ValidationReport(`Validation: ${validatorNames.join(', ')}`);

    // Ejecutar middleware pre-validación
    for (const middleware of this.middleware) {
      if (middleware.before) {
        await middleware.before(context);
      }
    }

    // Ejecutar validators en paralelo cuando sea posible
    const validationPromises = validatorNames.map(async (name) => {
      const validator = this.validators.get(name);
      if (!validator) {
        throw new Error(`Validator '${name}' not registered`);
      }

      console.log(`🔍 Ejecutando ${name}...`);
      const startTime = Date.now();

      try {
        // Preparar fuentes de datos para el validator
        const sources = await this.prepareSources(validator, context);

        // Resetear estado del validator
        validator.reset();

        // Ejecutar validación
        await validator.validate(sources, context);

        // Obtener resultado
        const result = validator.getResult();
        result.duration = Date.now() - startTime;

        report.addResult(name, result);

        const status = result.status;
        const summary = result.getSummary();
        const icon = status === 'PASS' ? '✅' : status === 'WARN' ? '⚠️' : '❌';
        console.log(`   ${icon} ${name}: ${status} (${summary.total} tests)`);

        return result;
      } catch (error) {
        const result = {
          validator: name,
          status: 'ERROR',
          errors: [{ message: `Error ejecutando validator: ${error.message}` }],
          warnings: [],
          passed: [],
          duration: Date.now() - startTime,
          getSummary: () => ({ total: 1, errors: 1, warnings: 0, passed: 0 })
        };

        report.addResult(name, result);
        console.log(`   ❌ ${name}: ERROR - ${error.message}`);
        return result;
      }
    });

    // Esperar a que terminen todos los validators
    await Promise.all(validationPromises);

    // Ejecutar middleware post-validación
    for (const middleware of this.middleware) {
      if (middleware.after) {
        await middleware.after(report, context);
      }
    }

    return report.finalize();
  }

  /**
   * Ejecuta todos los validators registrados
   * @param {Object} context - Contexto de ejecución
   * @returns {ValidationReport}
   */
  async runAll(context = {}) {
    const validatorNames = Array.from(this.validators.keys());
    return this.runValidators(validatorNames, context);
  }

  /**
   * Prepara las fuentes de datos necesarias para un validator
   * @param {ValidatorInterface} validator - Validator que necesita las fuentes
   * @param {Object} context - Contexto de ejecución
   * @returns {Object} Fuentes de datos preparadas
   */
  async prepareSources(validator, context) {
    const sources = {};

    // Si el validator especifica qué fuentes necesita
    if (validator.requiredSources) {
      for (const sourceName of validator.requiredSources) {
        const source = this.sources.get(sourceName);
        if (!source) {
          throw new Error(`Source '${sourceName}' required by ${validator.name} not available`);
        }

        // Si la fuente tiene método de preparación, ejecutarlo
        if (source.prepare) {
          sources[sourceName] = await source.prepare(context);
        } else {
          sources[sourceName] = source;
        }
      }
    }

    return sources;
  }

  /**
   * Crea un builder fluido para configurar validaciones
   * @returns {ValidationBuilder}
   */
  static builder() {
    return new ValidationBuilder();
  }

  /**
   * Ejecuta validación rápida con configuración mínima
   * @param {Array} validators - Array de [name, validator]
   * @param {Object} context - Contexto
   * @returns {ValidationReport}
   */
  static async quickRun(validators, context = {}) {
    const engine = new ValidationEngine();

    validators.forEach(([name, validator]) => {
      engine.registerValidator(name, validator);
    });

    return engine.runAll(context);
  }
}

/**
 * Builder para configuración fluida
 */
class ValidationBuilder {
  constructor() {
    this.engine = new ValidationEngine();
  }

  /**
   * Agrega un validator
   */
  validator(name, validator) {
    this.engine.registerValidator(name, validator);
    return this;
  }

  /**
   * Agrega una fuente de datos
   */
  source(name, source) {
    this.engine.registerSource(name, source);
    return this;
  }

  /**
   * Agrega middleware
   */
  middleware(middleware) {
    this.engine.use(middleware);
    return this;
  }

  /**
   * Configura desde un objeto
   */
  config(config) {
    this.engine.config = { ...this.engine.config, ...config };
    return this;
  }

  /**
   * Construye el engine configurado
   */
  build() {
    return this.engine;
  }

  /**
   * Ejecuta inmediatamente
   */
  async run(context = {}) {
    return this.engine.runAll(context);
  }
}

module.exports = {
  ValidationEngine,
  ValidationBuilder
};