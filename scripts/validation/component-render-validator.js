const fs = require('fs');
const path = require('path');

/**
 * Validador Avanzado de Renderizado de Componentes
 * 
 * Verifica que los componentes definidos en metadata.json y page-templates.json
 * se estén renderizando correctamente en las páginas generadas.
 */
class ComponentRenderValidator {
  constructor(config) {
    this.config = config;
    this.errors = [];
    this.warnings = [];
    this.metadata = this.loadMetadata();
    this.pageTemplates = this.loadPageTemplates();
    this.validatedComponents = new Set();
    this.validatedPages = new Set();
  }

  loadMetadata() {
    try {
      const metadataPath = path.join(this.config.srcDir, 'metadata.json');
      if (!fs.existsSync(metadataPath)) {
        this.errors.push('❌ metadata.json no encontrado');
        return {};
      }
      return JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    } catch (error) {
      this.errors.push(`❌ Error cargando metadata.json: ${error.message}`);
      return {};
    }
  }

  loadPageTemplates() {
    try {
      const templatesPath = path.join(this.config.srcDir, 'page-templates.json');
      if (!fs.existsSync(templatesPath)) {
        this.errors.push('❌ page-templates.json no encontrado');
        return {};
      }
      return JSON.parse(fs.readFileSync(templatesPath, 'utf8'));
    } catch (error) {
      this.errors.push(`❌ Error cargando page-templates.json: ${error.message}`);
      return {};
    }
  }

  async validateComponentRendering() {
    console.log('🔍 Validando renderizado de componentes...');
    
    // Validar que los componentes del metadata.json estén implementados
    this.validateMetadataComponents();
    
    // Validar que las páginas usen los componentes correctos
    this.validatePageComponentIntegration();
    
    // Validar que los parámetros se pasen correctamente
    this.validateComponentParameters();
    
    // Validar que los templates definidos existan
    this.validateTemplateDefinitions();
    
    this.reportResults();
    return this.errors.length === 0;
  }

  validateMetadataComponents() {
    console.log('🧩 Validando componentes del metadata.json...');
    
    Object.keys(this.metadata).forEach(componentName => {
      const component = this.metadata[componentName];
      
      // Saltar objetos que no son componentes (como postTypes, templates)
      if (!component.phpFunction || !component.type) {
        return;
      }
      
      this.validateComponentExists(componentName, component);
      this.validateComponentFunction(componentName, component);
      this.validatedComponents.add(componentName);
    });
  }

  validateComponentExists(componentName, component) {
    const componentPath = path.join(
      this.config.outputDir,
      this.config.themeName,
      'components',
      componentName,
      `${componentName}.php`
    );
    
    if (!fs.existsSync(componentPath)) {
      this.errors.push(`❌ Componente ${componentName} no generado: ${componentName}.php`);
      return false;
    }
    
    const content = fs.readFileSync(componentPath, 'utf8');
    if (!content.includes(component.phpFunction)) {
      this.errors.push(`❌ Función ${component.phpFunction} no encontrada en ${componentName}.php`);
      return false;
    }
    
    console.log(`  ✅ Componente ${componentName} existe y tiene función ${component.phpFunction}`);
    return true;
  }

  validateComponentFunction(componentName, component) {
    const componentPath = path.join(
      this.config.outputDir,
      this.config.themeName,
      'components',
      componentName,
      `${componentName}.php`
    );
    
    if (!fs.existsSync(componentPath)) return;
    
    const content = fs.readFileSync(componentPath, 'utf8');
    
    // Validar que los parámetros esperados estén en la función
    if (component.parameters) {
      component.parameters.forEach(param => {
        if (!content.includes(`$${param.name}`)) {
          this.warnings.push(`⚠️ Parámetro $${param.name} no encontrado en función ${component.phpFunction}`);
        }
      });
    }
    
    // Validar que se escape correctamente el HTML (WordPress best practices)
    const hasEscaping = content.includes('esc_html') || content.includes('esc_attr') || content.includes('esc_url');
    if (!hasEscaping) {
      this.warnings.push(`⚠️ ${componentName} no usa funciones de escape de WordPress`);
    }
  }

  validatePageComponentIntegration() {
    console.log('📄 Validando integración de componentes en páginas...');
    
    Object.keys(this.pageTemplates).forEach(pageName => {
      const pageConfig = this.pageTemplates[pageName];
      this.validatePageComponents(pageName, pageConfig);
      this.validatedPages.add(pageName);
    });
  }

  validatePageComponents(pageName, pageConfig) {
    const pageFile = pageConfig.file;
    const pagePath = path.join(
      this.config.outputDir,
      this.config.themeName,
      pageFile
    );
    
    if (!fs.existsSync(pagePath)) {
      this.errors.push(`❌ Página ${pageFile} no encontrada`);
      return;
    }
    
    const pageContent = fs.readFileSync(pagePath, 'utf8');
    
    // Validar que todos los componentes definidos estén siendo llamados
    if (pageConfig.components) {
      pageConfig.components.forEach(componentConfig => {
        this.validateComponentUsageInPage(pageName, pageFile, pageContent, componentConfig);
      });
    }
    
    console.log(`  ✅ Página ${pageFile} validada`);
  }

  validateComponentUsageInPage(pageName, pageFile, pageContent, componentConfig) {
    const componentName = componentConfig.name;
    const expectedComponent = this.metadata[componentName];
    
    if (!expectedComponent) {
      this.errors.push(`❌ Componente ${componentName} usado en ${pageFile} no está definido en metadata.json`);
      return;
    }
    
    const phpFunction = expectedComponent.phpFunction;
    
    // Verificar que la función del componente se esté llamando
    if (!pageContent.includes(phpFunction)) {
      this.errors.push(`❌ Función ${phpFunction} no se llama en ${pageFile} (componente: ${componentName})`);
      return;
    }
    
    // Verificar que se incluya el archivo del componente
    const includePattern = `require_once.*${componentName}.*php`;
    const includeRegex = new RegExp(includePattern);
    if (!includeRegex.test(pageContent)) {
      this.warnings.push(`⚠️ ${pageFile} no incluye explícitamente ${componentName}.php`);
    }
    
    console.log(`    ✅ Componente ${componentName} usado correctamente en ${pageFile}`);
  }

  validateComponentParameters() {
    console.log('🔧 Validando parámetros de componentes...');
    
    Object.keys(this.pageTemplates).forEach(pageName => {
      const pageConfig = this.pageTemplates[pageName];
      const pageFile = pageConfig.file;
      const pagePath = path.join(
        this.config.outputDir,
        this.config.themeName,
        pageFile
      );
      
      if (!fs.existsSync(pagePath)) return;
      
      const pageContent = fs.readFileSync(pagePath, 'utf8');
      
      if (pageConfig.components) {
        pageConfig.components.forEach(componentConfig => {
          this.validateComponentParametersInPage(pageName, pageFile, pageContent, componentConfig);
        });
      }
    });
  }

  validateComponentParametersInPage(pageName, pageFile, pageContent, componentConfig) {
    const componentName = componentConfig.name;
    const expectedComponent = this.metadata[componentName];
    
    if (!expectedComponent || !expectedComponent.phpFunction) return;
    
    const phpFunction = expectedComponent.phpFunction;
    
    // Buscar llamadas a la función en el contenido
    const functionCallRegex = new RegExp(`${phpFunction}\\s*\\([^)]*\\)`, 'g');
    const functionCalls = pageContent.match(functionCallRegex);
    
    if (!functionCalls) {
      this.warnings.push(`⚠️ No se encontraron llamadas a ${phpFunction} en ${pageFile}`);
      return;
    }
    
    // Validar que se pasen los parámetros esperados según metadata.json
    if (expectedComponent.parameters && componentConfig.props) {
      const expectedParams = expectedComponent.parameters.map(p => p.name);
      const providedProps = Object.keys(componentConfig.props);
      
      expectedParams.forEach(paramName => {
        if (!providedProps.includes(paramName)) {
          // Excepciones para parámetros que se construyen dinámicamente
          const dynamicParams = ['testimonials', 'features', 'images'];
          if (dynamicParams.includes(paramName)) {
            this.warnings.push(`⚠️ Parámetro ${paramName} se construye dinámicamente en ${componentName} (${pageFile})`);
          } else {
            this.errors.push(`❌ INCONSISTENCIA DE CONFIGURACIÓN: Parámetro ${paramName} esperado en metadata.json pero no proporcionado en page-templates.json para ${componentName} (${pageFile})`);
          }
        }
      });
    }
    
    console.log(`    ✅ Parámetros de ${componentName} validados en ${pageFile}`);
  }

  validateTemplateDefinitions() {
    console.log('📋 Validando definiciones de templates...');
    
    // Verificar que los templates definidos en metadata.json existan en page-templates.json
    if (this.metadata.templates) {
      Object.keys(this.metadata.templates).forEach(templateName => {
        const templateDef = this.metadata.templates[templateName];
        this.validateTemplateDefinition(templateName, templateDef);
      });
    }
  }

  validateTemplateDefinition(templateName, templateDef) {
    // Buscar páginas que usen este template
    const pagesUsingTemplate = Object.keys(this.pageTemplates).filter(pageName => {
      return this.pageTemplates[pageName].template === templateName;
    });
    
    if (pagesUsingTemplate.length === 0) {
      this.warnings.push(`⚠️ Template ${templateName} definido pero no usado en ninguna página`);
      return;
    }
    
    // Validar que los componentes del template estén definidos
    if (templateDef.components) {
      templateDef.components.forEach(componentName => {
        if (!this.metadata[componentName]) {
          this.errors.push(`❌ Componente ${componentName} requerido por template ${templateName} no está definido en metadata.json`);
        }
      });
    }
    
    console.log(`  ✅ Template ${templateName} usado en: ${pagesUsingTemplate.join(', ')}`);
  }

  reportResults() {
    console.log('\n📊 Reporte de Validación de Renderizado:');
    console.log(`✅ Componentes validados: ${this.validatedComponents.size}`);
    console.log(`✅ Páginas validadas: ${this.validatedPages.size}`);
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('✅ Todos los componentes se renderizan correctamente!');
      return;
    }

    if (this.errors.length > 0) {
      console.log(`\n❌ Errores de renderizado encontrados (${this.errors.length}):`);
      this.errors.forEach(error => console.log(`  ${error}`));
    }

    if (this.warnings.length > 0) {
      console.log(`\n⚠️ Advertencias de renderizado (${this.warnings.length}):`);
      this.warnings.forEach(warning => console.log(`  ${warning}`));
    }

    const status = this.errors.length === 0 ? '✅ RENDERIZADO VÁLIDO' : '❌ ERRORES DE RENDERIZADO';
    console.log(`\n🏁 Estado del renderizado: ${status}`);
  }
}

module.exports = ComponentRenderValidator;