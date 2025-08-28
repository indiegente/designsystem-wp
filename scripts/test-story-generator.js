#!/usr/bin/env node

/**
 * Sistema de Testing para el Generador de Stories
 * 
 * Tests automáticos para validar que el generador maneja
 * correctamente todos los casos edge y patrones problemáticos.
 */

const fs = require('fs');
const path = require('path');
const RobustStoryGenerator = require('./generate-stories-robust');

class StoryGeneratorTester {
  constructor() {
    this.testResults = [];
    this.testDir = path.join(process.cwd(), 'test-cases');
    this.tempDir = path.join(process.cwd(), '.temp-test-components');
  }

  async runAllTests() {
    console.log('🧪 Iniciando tests del Generador de Stories...\n');

    try {
      // Preparar entorno de test
      this.setupTestEnvironment();

      // Ejecutar todas las suites de test
      await this.testBasicComponents();
      await this.testEdgeCases();
      await this.testErrorHandling();
      await this.testMetadataIntegration();
      await this.testGeneratedStoriesValidity();

      // Limpiar entorno de test
      this.cleanupTestEnvironment();

      // Mostrar resultados
      this.showTestResults();

    } catch (error) {
      console.error('❌ Error fatal en los tests:', error.message);
      this.cleanupTestEnvironment();
      process.exit(1);
    }
  }

  setupTestEnvironment() {
    if (fs.existsSync(this.tempDir)) {
      fs.rmSync(this.tempDir, { recursive: true, force: true });
    }
    fs.mkdirSync(this.tempDir, { recursive: true });
  }

  cleanupTestEnvironment() {
    if (fs.existsSync(this.tempDir)) {
      fs.rmSync(this.tempDir, { recursive: true, force: true });
    }
  }

  createTestComponent(name, content) {
    const componentDir = path.join(this.tempDir, name);
    fs.mkdirSync(componentDir, { recursive: true });
    fs.writeFileSync(path.join(componentDir, `${name}.js`), content);
  }

  async testBasicComponents() {
    console.log('📋 Testando componentes básicos...');

    // Test 1: Componente simple válido
    this.createTestComponent('simple-component', `
import { LitElement, html } from 'lit';

export class SimpleComponent extends LitElement {
  static properties = {
    title: { type: String },
    count: { type: Number },
    visible: { type: Boolean }
  };

  render() {
    return html\`<div>\${this.title}</div>\`;
  }
}

customElements.define('tl-simple-component', SimpleComponent);
`);

    // Test 2: Componente con arrays y objects
    this.createTestComponent('complex-component', `
import { LitElement, html } from 'lit';

export class ComplexComponent extends LitElement {
  static properties = {
    title: { type: String },
    items: { type: Array },
    config: { type: Object },
    autoPlay: { type: Boolean }
  };

  render() {
    return html\`<div>Complex Component</div>\`;
  }
}

customElements.define('tl-complex-component', ComplexComponent);
`);

    await this.runGeneratorTest('basic-components', [
      'simple-component',
      'complex-component'
    ]);
  }

  async testEdgeCases() {
    console.log('🔥 Testando casos edge...');

    // Test 1: Sin properties
    this.createTestComponent('no-properties', `
import { LitElement, html } from 'lit';

export class NoProperties extends LitElement {
  render() {
    return html\`<div>Static content</div>\`;
  }
}

customElements.define('tl-no-properties', NoProperties);
`);

    // Test 2: Properties sin type
    this.createTestComponent('no-types', `
import { LitElement, html } from 'lit';

export class NoTypes extends LitElement {
  static properties = {
    title: {},
    count: { attribute: 'count' },
    data: { reflect: true }
  };

  render() {
    return html\`<div>No Types</div>\`;
  }
}

customElements.define('tl-no-types', NoTypes);
`);

    // Test 3: Properties con nombres problemáticos
    this.createTestComponent('problematic-names', `
import { LitElement, html } from 'lit';

export class ProblematicNames extends LitElement {
  static properties = {
    className: { type: String },
    'data-value': { type: String },
    __private: { type: String },
    constructor: { type: String }
  };

  render() {
    return html\`<div>Problematic Names</div>\`;
  }
}

customElements.define('tl-problematic-names', ProblematicNames);
`);

    // Test 4: Getter pattern
    this.createTestComponent('getter-pattern', `
import { LitElement, html } from 'lit';

export class GetterPattern extends LitElement {
  static get properties() {
    return {
      title: { type: String },
      count: { type: Number }
    };
  }

  render() {
    return html\`<div>Getter Pattern</div>\`;
  }
}

customElements.define('tl-getter-pattern', GetterPattern);
`);

    await this.runGeneratorTest('edge-cases', [
      'no-properties',
      'no-types',
      'problematic-names',
      'getter-pattern'
    ]);
  }

  async testErrorHandling() {
    console.log('💥 Testando manejo de errores...');

    // Test 1: Syntax error
    this.createTestComponent('syntax-error', `
import { LitElement, html } from 'lit';

export class SyntaxError extends LitElement {
  static properties = {
    title: { type: String },
    // missing comma
    count { type: Number }
  };

  render() {
    return html\`<div>Syntax Error</div>\`;
  }
}

customElements.define('tl-syntax-error', SyntaxError);
`);

    // Test 2: Sin export
    this.createTestComponent('no-export', `
import { LitElement, html } from 'lit';

class NoExport extends LitElement {
  static properties = {
    title: { type: String }
  };

  render() {
    return html\`<div>No Export</div>\`;
  }
}

customElements.define('tl-no-export', NoExport);
`);

    // Test 3: Sin customElements.define
    this.createTestComponent('no-define', `
import { LitElement, html } from 'lit';

export class NoDefine extends LitElement {
  static properties = {
    title: { type: String }
  };

  render() {
    return html\`<div>No Define</div>\`;
  }
}
`);

    await this.runGeneratorTest('error-handling', [
      'syntax-error',
      'no-export', 
      'no-define'
    ]);
  }

  async testMetadataIntegration() {
    console.log('📊 Testando integración con metadata...');

    // Crear metadata de prueba
    const testMetadata = {
      'metadata-component': {
        type: 'static',
        phpFunction: 'render_metadata_component',
        parameters: [
          { name: 'title', type: 'string', default: '' },
          { name: 'description', type: 'string', default: '' }
        ]
      },
      'aggregated-component': {
        type: 'aggregated',
        phpFunction: 'render_aggregated_component',
        parameters: [
          { name: 'title', type: 'string', default: '' },
          { name: 'items', type: 'array', default: '[]' }
        ],
        aggregation: {
          mode: 'collect'
        }
      }
    };

    const tempMetadataPath = path.join(this.tempDir, 'component-metadata.json');
    fs.writeFileSync(tempMetadataPath, JSON.stringify(testMetadata, null, 2));

    // Test 1: Componente con metadata
    this.createTestComponent('metadata-component', `
import { LitElement, html } from 'lit';

export class MetadataComponent extends LitElement {
  static properties = {
    title: { type: String },
    description: { type: String }
  };

  render() {
    return html\`<div>Metadata Component</div>\`;
  }
}

customElements.define('tl-metadata-component', MetadataComponent);
`);

    // Test 2: Componente agregado
    this.createTestComponent('aggregated-component', `
import { LitElement, html } from 'lit';

export class AggregatedComponent extends LitElement {
  static properties = {
    title: { type: String },
    items: { type: Array }
  };

  render() {
    return html\`<div>Aggregated Component</div>\`;
  }
}

customElements.define('tl-aggregated-component', AggregatedComponent);
`);

    await this.runGeneratorTest('metadata-integration', [
      'metadata-component',
      'aggregated-component'
    ]);
  }

  async testGeneratedStoriesValidity() {
    console.log('✅ Validando stories generados...');

    // Aquí validaremos que los stories generados sean válidos JavaScript
    const testCases = fs.readdirSync(this.tempDir);
    
    for (const componentName of testCases) {
      if (componentName.endsWith('.json')) continue;
      
      const storiesPath = path.join(this.tempDir, componentName, `${componentName}.stories.js`);
      
      if (fs.existsSync(storiesPath)) {
        const success = this.validateGeneratedStory(storiesPath, componentName);
        this.addTestResult(`story-validity-${componentName}`, success, 
          success ? 'Story válido' : 'Story inválido');
      }
    }
  }

  validateGeneratedStory(storiesPath, componentName) {
    try {
      const content = fs.readFileSync(storiesPath, 'utf8');
      
      // Validaciones básicas
      const checks = [
        { test: () => content.includes('export default'), name: 'tiene export default' },
        { test: () => content.includes('export const Default'), name: 'tiene story Default' },
        { test: () => content.includes('Template.bind'), name: 'usa Template.bind()' },
        { test: () => content.includes('argTypes'), name: 'tiene argTypes' },
        { test: () => content.includes('import'), name: 'tiene imports' },
        { test: () => !content.includes('undefined'), name: 'no tiene undefined' },
        { test: () => !content.includes('null'), name: 'no tiene null explícito' }
      ];
      
      for (const check of checks) {
        if (!check.test()) {
          this.addTestResult(`${componentName}-${check.name}`, false, 
            `Fallo validación: ${check.name}`);
          return false;
        }
      }
      
      // Intentar parsear como JavaScript (básico)
      // En un entorno real, usaríamos un parser de AST
      const hasValidStructure = content.match(/export default \{[\s\S]*\}/);
      if (!hasValidStructure) {
        this.addTestResult(`${componentName}-structure`, false, 'Estructura inválida');
        return false;
      }
      
      return true;
      
    } catch (error) {
      this.addTestResult(`${componentName}-parse`, false, `Error parseando: ${error.message}`);
      return false;
    }
  }

  async runGeneratorTest(testSuite, componentNames) {
    try {
      // Crear generador con directorio temporal
      const generator = new RobustStoryGenerator();
      generator.componentsDir = this.tempDir;
      
      // Ejecutar generación
      const result = await generator.generateStories();
      
      // Validar resultados
      const success = result.generated === componentNames.length;
      const description = `${result.generated}/${componentNames.length} componentes procesados`;
      
      this.addTestResult(testSuite, success, description);
      
      // Agregar detalles de errores y warnings
      if (result.errors.length > 0) {
        this.addTestResult(`${testSuite}-errors`, false, 
          `${result.errors.length} errores: ${result.errors.map(e => e.message).join('; ')}`);
      }
      
      if (result.warnings.length > 0) {
        this.addTestResult(`${testSuite}-warnings`, true, 
          `${result.warnings.length} warnings (esperado)`);
      }
      
    } catch (error) {
      this.addTestResult(testSuite, false, `Error ejecutando test: ${error.message}`);
    }
  }

  addTestResult(testName, passed, description) {
    this.testResults.push({
      name: testName,
      passed,
      description,
      timestamp: new Date()
    });
  }

  showTestResults() {
    const passed = this.testResults.filter(r => r.passed).length;
    const failed = this.testResults.filter(r => !r.passed).length;
    const total = this.testResults.length;
    
    console.log('\n📊 Resultados de los Tests:');
    console.log(`   ✅ Pasaron: ${passed}/${total}`);
    console.log(`   ❌ Fallaron: ${failed}/${total}`);
    console.log(`   📈 Porcentaje de éxito: ${Math.round((passed / total) * 100)}%`);
    
    if (failed > 0) {
      console.log('\n❌ Tests que fallaron:');
      this.testResults
        .filter(r => !r.passed)
        .forEach(r => console.log(`   - ${r.name}: ${r.description}`));
    }
    
    console.log('\n✅ Tests que pasaron:');
    this.testResults
      .filter(r => r.passed)
      .forEach(r => console.log(`   - ${r.name}: ${r.description}`));
      
    // Generar reporte
    this.generateTestReport();
  }

  generateTestReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.testResults.length,
        passed: this.testResults.filter(r => r.passed).length,
        failed: this.testResults.filter(r => !r.passed).length
      },
      results: this.testResults
    };
    
    const reportPath = path.join(process.cwd(), 'story-generator-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Reporte guardado en: ${reportPath}`);
  }
}

// Ejecutar tests si se llama directamente
if (require.main === module) {
  const tester = new StoryGeneratorTester();
  tester.runAllTests()
    .then(() => {
      const failed = tester.testResults.filter(r => !r.passed).length;
      process.exit(failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('❌ Error en tests:', error);
      process.exit(1);
    });
}

module.exports = StoryGeneratorTester;