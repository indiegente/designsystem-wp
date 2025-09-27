const ValidatorInterface = require('../core/validator-interface');
const ConfigSingleton = require('../../wp-generator/core/config-singleton');

/**
 * Metadata Validator
 *
 * Validator específico para metadata.json que valida:
 * - Escape metadata obligatoria para Babel AST
 * - Fail-fast compliance según .rules
 * - Estructura completa de components y arrayFields
 * - Consistency entre metadata y page-templates
 */
class MetadataValidator extends ValidatorInterface {
  constructor(config = {}) {
    super('Metadata Validator', config);
    // ✅ SINGLE SOURCE OF TRUTH: No requiere sources externos, usa ConfigSingleton
    this.requiredSources = [];
  }

  /**
   * Ejecuta validaciones de metadata
   * @param {Object} sources - Fuentes de datos (IGNORADO - usa ConfigSingleton)
   * @param {Object} context - Contexto de validación
   */
  async validate(sources, context = {}) {
    console.log(`   📋 Validando metadata.json con criterios Babel AST...`);

    // 🎯 SINGLE SOURCE OF TRUTH: Usar ConfigSingleton directamente
    const configSingleton = ConfigSingleton.getInstance();
    const metadata = configSingleton.getMetadata();
    const pageTemplates = configSingleton.getPageTemplates();

    // 1. Validar estructura básica
    this.validateBasicStructure(metadata);

    // 2. 🔒 Validar escape metadata (CRÍTICO para Babel AST)
    this.validateEscapeMetadata(metadata);

    // 3. 🚨 Validar fail-fast compliance (.rules)
    this.validateFailFastCompliance(metadata);

    // 4. 🧩 Validar arrayFields completitud
    this.validateArrayFieldsCompleteness(metadata);

    // 5. 🔄 Validar consistency con page-templates
    this.validatePageTemplateConsistency(metadata, pageTemplates);

    // 6. 📊 Generar estadísticas de cobertura
    this.generateCoverageReport(metadata);
  }

  /**
   * Validar estructura básica de metadata.json
   */
  validateBasicStructure(metadata) {
    this.assert(
      typeof metadata === 'object' && metadata !== null,
      'metadata.json debe ser un objeto válido',
      'error',
      { type: 'invalid-structure' }
    );

    // Validar que hay al menos un componente
    const components = Object.keys(metadata).filter(key => {
      const item = metadata[key];
      return item && item.type && item.parameters;
    });

    this.assert(
      components.length > 0,
      'metadata.json debe contener al menos un componente válido',
      'error',
      { type: 'no-components', totalKeys: Object.keys(metadata).length }
    );

    console.log(`      📊 ${components.length} componentes encontrados`);
  }

  /**
   * 🔒 Validar escape metadata obligatoria para Babel AST
   */
  validateEscapeMetadata(metadata) {
    let totalParameters = 0;
    let parametersWithEscape = 0;
    let totalArrayFields = 0;
    let arrayFieldsWithEscape = 0;

    Object.entries(metadata).forEach(([componentName, componentMeta]) => {
      // Skip non-component entries
      if (!componentMeta.parameters) return;

      // Validar parameters
      componentMeta.parameters.forEach(param => {
        totalParameters++;

        this.assert(
          param.escape !== undefined,
          `❌ ESCAPE FALTANTE: Parámetro '${param.name}' en componente '${componentName}' necesita campo 'escape'`,
          'error',
          {
            type: 'missing-escape-metadata',
            component: componentName,
            parameter: param.name,
            fix: `Agregar "escape": "html|url|attr|js|none" en metadata.json`
          }
        );

        if (param.escape !== undefined) {
          parametersWithEscape++;

          // Validar valores válidos
          const validEscapeTypes = ['html', 'url', 'attr', 'js', 'none'];
          this.assert(
            validEscapeTypes.includes(param.escape),
            `❌ ESCAPE INVÁLIDO: '${param.escape}' para '${param.name}' en '${componentName}'`,
            'error',
            {
              type: 'invalid-escape-type',
              component: componentName,
              parameter: param.name,
              provided: param.escape,
              validTypes: validEscapeTypes,
              fix: `Usar uno de: ${validEscapeTypes.join(', ')}`
            }
          );
        }
      });

      // Validar arrayFields
      if (componentMeta.arrayFields) {
        Object.entries(componentMeta.arrayFields).forEach(([arrayName, fields]) => {
          fields.forEach(field => {
            totalArrayFields++;

            this.assert(
              field.escape !== undefined,
              `❌ ARRAY ESCAPE FALTANTE: Campo '${field.name}' en array '${arrayName}' de '${componentName}' necesita campo 'escape'`,
              'error',
              {
                type: 'missing-array-escape-metadata',
                component: componentName,
                arrayName,
                fieldName: field.name,
                fix: `Agregar "escape": "html|url|attr|js|none" en arrayFields.${arrayName}`
              }
            );

            if (field.escape !== undefined) {
              arrayFieldsWithEscape++;

              // Validar escape válido
              const validEscapeTypes = ['html', 'url', 'attr', 'js', 'none'];
              this.assert(
                validEscapeTypes.includes(field.escape),
                `❌ ARRAY ESCAPE INVÁLIDO: '${field.escape}' para '${field.name}' en array '${arrayName}'`,
                'error',
                {
                  type: 'invalid-array-escape-type',
                  component: componentName,
                  arrayName,
                  fieldName: field.name,
                  provided: field.escape,
                  validTypes: validEscapeTypes
                }
              );
            }
          });
        });
      }
    });

    // Reportar estadísticas de cobertura
    console.log(`      🔒 Escape metadata: ${parametersWithEscape}/${totalParameters} parameters, ${arrayFieldsWithEscape}/${totalArrayFields} array fields`);

    // Asegurar 100% coverage
    this.assert(
      parametersWithEscape === totalParameters,
      `❌ ESCAPE INCOMPLETO: ${totalParameters - parametersWithEscape} parámetros sin escape metadata`,
      'error',
      {
        type: 'incomplete-escape-coverage',
        missing: totalParameters - parametersWithEscape,
        total: totalParameters
      }
    );

    if (totalArrayFields > 0) {
      this.assert(
        arrayFieldsWithEscape === totalArrayFields,
        `❌ ARRAY ESCAPE INCOMPLETO: ${totalArrayFields - arrayFieldsWithEscape} array fields sin escape metadata`,
        'error',
        {
          type: 'incomplete-array-escape-coverage',
          missing: totalArrayFields - arrayFieldsWithEscape,
          total: totalArrayFields
        }
      );
    }
  }

  /**
   * 🚨 Validar fail-fast compliance (.rules)
   */
  validateFailFastCompliance(metadata) {
    Object.entries(metadata).forEach(([componentName, componentMeta]) => {
      if (!componentMeta.parameters) return;

      componentMeta.parameters.forEach(param => {
        // Detectar posibles fallbacks en defaults
        if (param.default && typeof param.default === 'string') {
          const fallbackPatterns = [
            { pattern: '||', name: 'OR operator' },
            { pattern: '??', name: 'Nullish coalescing' },
            { pattern: 'fallback', name: 'Fallback keyword' },
            { pattern: '? ' + param.name + ' : ', name: 'Ternary fallback' }
          ];

          fallbackPatterns.forEach(({ pattern, name }) => {
            if (param.default.includes(pattern)) {
              this.assert(
                false,
                `🚨 FALLBACK DETECTADO: Parámetro '${param.name}' en '${componentName}' usa ${name} - viola .rules`,
                'error',
                {
                  type: 'fallback-violation',
                  component: componentName,
                  parameter: param.name,
                  pattern: name,
                  value: param.default,
                  fix: 'Eliminar fallback y usar fail-fast approach'
                }
              );
            }
          });
        }

        // Validar que no haya "or" statements en fieldType
        if (param.fieldType && typeof param.fieldType === 'string') {
          if (param.fieldType.includes('||') || param.fieldType.includes('or')) {
            this.assert(
              false,
              `🚨 FIELDTYPE FALLBACK: '${param.name}' en '${componentName}' usa fallback en fieldType`,
              'error',
              {
                type: 'fieldtype-fallback',
                component: componentName,
                parameter: param.name,
                fieldType: param.fieldType
              }
            );
          }
        }
      });
    });
  }

  /**
   * 🧩 Validar arrayFields completitud
   */
  validateArrayFieldsCompleteness(metadata) {
    Object.entries(metadata).forEach(([componentName, componentMeta]) => {
      if (!componentMeta || !componentMeta.type) return;
      if (componentMeta.type === 'aggregated' || componentMeta.type === 'comprehensive') {
        // Componentes aggregated DEBEN tener arrayFields
        this.assert(
          componentMeta.arrayFields && Object.keys(componentMeta.arrayFields).length > 0,
          `🧩 ARRAYFIELDS FALTANTE: Componente '${componentName}' tipo '${componentMeta.type}' debe tener arrayFields`,
          'warning',
          {
            type: 'missing-array-fields',
            component: componentName,
            componentType: componentMeta.type,
            fix: 'Agregar arrayFields o cambiar tipo a static/iterative'
          }
        );
      }

      // Si tiene arrayFields, validar estructura completa
      if (componentMeta.arrayFields) {
        Object.entries(componentMeta.arrayFields).forEach(([arrayName, fields]) => {
          this.assert(
            Array.isArray(fields) && fields.length > 0,
            `🧩 ARRAYFIELDS VACÍO: Array '${arrayName}' en '${componentName}' no puede estar vacío`,
            'error',
            {
              type: 'empty-array-fields',
              component: componentName,
              arrayName
            }
          );

          // Validar estructura de cada field
          fields.forEach((field, index) => {
            const requiredProps = ['name', 'type', 'fieldType', 'escape'];
            requiredProps.forEach(prop => {
              this.assert(
                field[prop] !== undefined,
                `🧩 CAMPO INCOMPLETO: Field ${index} en array '${arrayName}' de '${componentName}' falta '${prop}'`,
                'error',
                {
                  type: 'incomplete-array-field',
                  component: componentName,
                  arrayName,
                  fieldIndex: index,
                  missingProp: prop,
                  currentField: field
                }
              );
            });
          });
        });
      }
    });
  }

  /**
   * 🔄 Validar consistency entre metadata y page-templates
   */
  validatePageTemplateConsistency(metadata, pageTemplates) {
    const usedComponents = new Set();
    const definedComponents = new Set(Object.keys(metadata).filter(key => {
      const item = metadata[key];
      return item && item.type && item.parameters;
    }));

    // Recopilar componentes usados en page-templates (excluir postTypes)
    Object.entries(pageTemplates).forEach(([pageName, pageConfig]) => {
      // Skip postTypes section
      if (pageName === 'postTypes') return;

      if (pageConfig.components && Array.isArray(pageConfig.components)) {
        pageConfig.components.forEach(component => {
          if (component.name) {
            usedComponents.add(component.name);
          }
        });
      }
    });

    // Verificar que componentes usados estén definidos en metadata
    usedComponents.forEach(componentName => {
      this.assert(
        definedComponents.has(componentName),
        `🔄 COMPONENTE NO DEFINIDO: '${componentName}' usado en page-templates pero no definido en metadata`,
        'error',
        {
          type: 'undefined-component',
          component: componentName,
          usedInPages: true,
          definedInMetadata: false
        }
      );
    });

    // Advertir sobre componentes definidos pero no usados
    definedComponents.forEach(componentName => {
      if (!usedComponents.has(componentName)) {
        this.assert(
          false,
          `⚠️ COMPONENTE NO USADO: '${componentName}' definido en metadata pero no usado en páginas`,
          'warning',
          {
            type: 'unused-component',
            component: componentName,
            definedInMetadata: true,
            usedInPages: false,
            suggestion: 'Considerar eliminar o agregar a una página'
          }
        );
      }
    });
  }

  /**
   * 📊 Generar reporte de cobertura
   */
  generateCoverageReport(metadata) {
    const stats = {
      totalComponents: 0,
      componentsByType: {},
      parametersTotal: 0,
      parametersWithEscape: 0,
      arrayFieldsTotal: 0,
      arrayFieldsWithEscape: 0,
      failFastCompliant: 0,
      totalIssues: this.errors.length
    };

    Object.entries(metadata).forEach(([componentName, componentMeta]) => {
      if (!componentMeta.parameters) return;

      stats.totalComponents++;
      stats.componentsByType[componentMeta.type] = (stats.componentsByType[componentMeta.type] || 0) + 1;

      // Count parameters
      componentMeta.parameters.forEach(param => {
        stats.parametersTotal++;
        if (param.escape) stats.parametersWithEscape++;
      });

      // Count array fields
      if (componentMeta.arrayFields) {
        Object.values(componentMeta.arrayFields).forEach(fields => {
          fields.forEach(field => {
            stats.arrayFieldsTotal++;
            if (field.escape) stats.arrayFieldsWithEscape++;
          });
        });
      }

      // Check fail-fast compliance
      const hasProblems = componentMeta.parameters.some(param =>
        param.default && typeof param.default === 'string' &&
        (param.default.includes('||') || param.default.includes('fallback'))
      );
      if (!hasProblems) stats.failFastCompliant++;
    });

    console.log(`      📊 Estadísticas de cobertura:`);
    console.log(`         • Componentes: ${stats.totalComponents}`);
    console.log(`         • Tipos: ${Object.entries(stats.componentsByType).map(([type, count]) => `${type}:${count}`).join(', ')}`);
    console.log(`         • Escape coverage: ${((stats.parametersWithEscape + stats.arrayFieldsWithEscape) / (stats.parametersTotal + stats.arrayFieldsTotal) * 100).toFixed(1)}%`);
    console.log(`         • Fail-fast compliant: ${stats.failFastCompliant}/${stats.totalComponents}`);

    if (stats.totalIssues === 0) {
      console.log(`         ✅ Sin errores críticos encontrados`);
    } else {
      console.log(`         ❌ ${stats.totalIssues} errores críticos encontrados`);
    }
  }
}

module.exports = MetadataValidator;