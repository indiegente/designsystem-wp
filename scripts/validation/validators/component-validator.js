const ValidatorInterface = require('../core/validator-interface');
const ConfigSingleton = require('../../wp-generator/core/config-singleton');
const fs = require('fs');
const path = require('path');

/**
 * Component Validator
 *
 * Valida que los componentes estén correctamente:
 * - Integrados en las páginas
 * - Renderizando sin errores de conversión Lit → PHP
 * - Con estilos inyectados correctamente
 * - Sin template literals sin convertir
 */
class ComponentValidator extends ValidatorInterface {
  constructor(config = {}) {
    super('Component Validator', config);
    // ✅ SINGLE SOURCE OF TRUTH: No requiere sources externos, usa ConfigSingleton
    this.requiredSources = [];
    this.supportsHTML = true; // Indicar que puede usar HTML si está disponible
  }

  /**
   * Ejecuta validaciones de componentes
   * @param {Object} sources - Fuentes de datos ({ config, html? })
   * @param {Object} context - Contexto ({ url?, page?, expectedComponents? })
   */
  async validate(sources, context = {}) {
    const html = sources.html || '';
    const { page = 'offline', expectedComponents = [] } = context;

    console.log(`   🧩 Validando componentes para ${page}...`);

    // 🎯 SINGLE SOURCE OF TRUTH: Usar ConfigSingleton directamente
    const configSingleton = ConfigSingleton.getInstance();
    const configs = {
      metadata: configSingleton.getMetadata(),
      pageTemplates: configSingleton.getPageTemplates()
    };

    // Si tenemos HTML, hacer validaciones completas
    if (html) {
      this.validateHTMLBased(html, configs, expectedComponents, context);
    } else {
      // Validaciones que no requieren HTML
      this.validateConfigBased(configs, context);
    }
  }

  /**
   * Validaciones basadas en HTML (cuando está disponible)
   */
  validateHTMLBased(html, configs, expectedComponents, context) {
    const pageConfig = configs.pageTemplates || {};

    // Validar que componentes esperados estén presentes
    this.validateExpectedComponents(html, expectedComponents);

    // Validar que no haya errores de conversión Lit → PHP
    this.validateLitConversion(html);

    // Validar estilos de componentes
    this.validateComponentStyles(html);

    // Validar escape de datos
    this.validateDataEscaping(html);

    // Validar estructura de componentes
    this.validateComponentStructure(html, pageConfig);

    // Validar parámetros de componentes
    this.validateComponentParameters(html, pageConfig);
  }

  /**
   * Validaciones basadas en configuración (offline)
   */
  validateConfigBased(configs, context) {
    const { metadata = {}, pageTemplates = {} } = configs;

    // Validar consistencia de metadata
    this.validateMetadataConsistency(metadata);

    // 🔒 NUEVA: Validar escape metadata obligatoria (Babel AST)
    this.validateEscapeMetadata(metadata);

    // 🚨 NUEVA: Validar fail-fast compliance (.rules)
    this.validateFailFastCompliance(metadata);

    // Validar configuración de páginas
    this.validatePageConfiguration(pageTemplates, metadata);

    // Validar componentes PHP generados
    this.validateGeneratedComponents(metadata);
  }

  /**
   * Valida que los componentes esperados estén presentes
   */
  validateExpectedComponents(html, expectedComponents) {
    expectedComponents.forEach(componentName => {
      // Buscar evidencia del componente de múltiples formas
      const variations = [
        componentName,                           // 'hero-section'
        componentName.replace('-', ''),          // 'herosection'
        componentName.replace(/-/g, '_'),        // 'hero_section'
        `render_${componentName.replace(/-/g, '_')}`, // 'render_hero_section'
        `${componentName}-component`,            // 'hero-section-component'
        componentName.split('-').join('')        // 'herosection'
      ];

      const isPresent = variations.some(variation =>
        html.toLowerCase().includes(variation.toLowerCase())
      );

      this.assert(
        isPresent,
        `Componente '${componentName}' no detectado en HTML`,
        'error',
        {
          type: 'component-presence',
          component: componentName,
          searchedVariations: variations
        }
      );

      if (isPresent) {
        // Validaciones adicionales si el componente está presente
        this.validateSpecificComponent(html, componentName);
      }
    });
  }

  /**
   * Valida conversión correcta de Lit Components a PHP
   */
  validateLitConversion(html) {
    // Template literals no convertidos
    const templateLiterals = [
      '${',
      'this.',
      '`',
      '${this.',
      '`${',
      'lit-html',
      '@property',
      'LitElement'
    ];

    templateLiterals.forEach(pattern => {
      const hasPattern = html.includes(pattern);
      this.assert(
        !hasPattern,
        `Template literal no convertido detectado: '${pattern}'`,
        'error',
        {
          type: 'lit-conversion-error',
          pattern,
          context: this.extractContext(html, pattern)
        }
      );
    });

    // JavaScript methods no convertidos
    const jsMethods = [
      '.map(',
      '.forEach(',
      '.filter(',
      '.reduce(',
      '.find(',
      'Array.from(',
      'Object.keys(',
      'JSON.stringify('
    ];

    jsMethods.forEach(method => {
      const hasMethod = html.includes(method);
      this.assert(
        !hasMethod,
        `Método JavaScript no convertido: '${method}'`,
        'warning',
        {
          type: 'js-method-not-converted',
          method,
          context: this.extractContext(html, method)
        }
      );
    });

    // Event handlers no convertidos
    const eventHandlers = [
      '@click=',
      '@change=',
      '@submit=',
      'addEventListener',
      'onClick',
      'onChange'
    ];

    eventHandlers.forEach(handler => {
      const hasHandler = html.includes(handler);
      this.assert(
        !hasHandler,
        `Event handler no convertido: '${handler}'`,
        'warning',
        {
          type: 'event-handler-not-converted',
          handler,
          context: this.extractContext(html, handler)
        }
      );
    });
  }

  /**
   * Valida que los estilos de componentes estén inyectados
   */
  validateComponentStyles(html) {
    // Estilos deben estar en el head
    this.assert(
      html.includes('component-styles') || html.includes('-component-styles'),
      'Estilos de componentes deben estar inyectados en <head>',
      'warning',
      { type: 'component-styles' }
    );

    // No debe haber :host selectors (específicos de Web Components)
    this.assert(
      !html.includes(':host'),
      'Selectores :host no deben aparecer en HTML final (específicos de Web Components)',
      'error',
      { type: 'host-selector', context: this.extractContext(html, ':host') }
    );

    // Verificar que CSS esté minificado/optimizado en producción
    if (this.config.environment === 'production') {
      const hasDuplicateCSS = this.detectDuplicateCSS(html);
      this.assert(
        !hasDuplicateCSS,
        'CSS duplicado detectado - posible optimización necesaria',
        'warning',
        { type: 'duplicate-css' }
      );
    }
  }

  /**
   * Valida escape correcto de datos
   */
  validateDataEscaping(html) {
    // Patrones inseguros
    const unsafePatterns = [
      {
        pattern: 'echo $',
        message: 'Variables deben usar funciones de escape (esc_html, esc_attr, esc_url)',
        type: 'error'
      },
      {
        pattern: 'echo get_the_content()',
        message: 'get_the_content() debe usar escape apropiado',
        type: 'error'
      },
      {
        pattern: '"<?php echo "',
        message: 'Double escaping detectado',
        type: 'warning'
      },
      {
        pattern: 'document.write(',
        message: 'document.write es inseguro y deprecated',
        type: 'error'
      }
    ];

    unsafePatterns.forEach(({ pattern, message, type }) => {
      const hasPattern = html.includes(pattern);
      this.assert(
        !hasPattern,
        message,
        type,
        {
          type: 'unsafe-pattern',
          pattern,
          context: this.extractContext(html, pattern)
        }
      );
    });

    // Verificar que se usen funciones de escape
    const escapePatterns = ['esc_html(', 'esc_attr(', 'esc_url(', 'wp_kses('];
    const hasEscaping = escapePatterns.some(pattern => html.includes(pattern));

    if (html.includes('echo') || html.includes('<?=')) {
      this.assert(
        hasEscaping,
        'Se detecta output PHP pero no funciones de escape - revisar seguridad',
        'warning',
        { type: 'missing-escape-functions' }
      );
    }
  }

  /**
   * Valida estructura general de componentes
   */
  validateComponentStructure(html, pageConfig) {
    // Headers básicos de WordPress
    this.assert(
      html.includes('wp-content') || html.includes('wp_head'),
      'Estructura básica de WordPress debe estar presente',
      'error',
      { type: 'wordpress-structure' }
    );

    // Body classes de WordPress
    this.assert(
      html.includes('<body class=') || html.includes('body_class'),
      'Body classes de WordPress recomendadas',
      'warning',
      { type: 'body-class' }
    );

    // Verificar que no haya comentarios de debug
    const debugComments = [
      '<!-- DEBUG',
      '<!-- TODO',
      '<!-- FIXME',
      '<!-- HACK',
      '<!-- XXX'
    ];

    debugComments.forEach(comment => {
      this.assert(
        !html.includes(comment),
        `Comentario de debug encontrado: ${comment}`,
        'warning',
        { type: 'debug-comment', comment }
      );
    });
  }

  /**
   * Valida parámetros de componentes específicos
   */
  validateComponentParameters(html, pageConfig) {
    if (!pageConfig.components) return;

    pageConfig.components.forEach(componentConfig => {
      const { name: componentName, props = {} } = componentConfig;

      // Validar que props no estén hardcoded en HTML si vienen de config
      Object.entries(props).forEach(([propName, propValue]) => {
        if (typeof propValue === 'string' && propValue.length > 0) {
          // Si el prop tiene valor, debería aparecer en el HTML
          const hasValue = html.includes(propValue);
          this.assert(
            hasValue,
            `Valor de prop '${propName}' (${propValue}) no encontrado en componente '${componentName}'`,
            'warning',
            {
              type: 'prop-value-missing',
              component: componentName,
              prop: propName,
              value: propValue
            }
          );
        }
      });

      // Validar que componentes con dataSource tengan contenido dinámico
      if (componentConfig.dataSource) {
        this.validateDataSourceComponent(html, componentConfig);
      }
    });
  }

  /**
   * Valida componentes que usan dataSource
   */
  validateDataSourceComponent(html, componentConfig) {
    const { name: componentName, dataSource } = componentConfig;

    // Para componentes iterativos, debe haber evidencia de loops
    if (dataSource.type === 'post') {
      const hasLoop = html.includes('foreach') || html.includes('while') ||
                     html.includes('get_posts') || html.includes('WP_Query');

      this.assert(
        hasLoop,
        `Componente '${componentName}' usa dataSource pero no se detecta loop PHP`,
        'warning',
        {
          type: 'datasource-no-loop',
          component: componentName,
          dataSource: dataSource.type
        }
      );

      // Verificar que use el postType correcto
      if (dataSource.postType) {
        const hasPostType = html.includes(`'${dataSource.postType}'`) ||
                           html.includes(`"${dataSource.postType}"`);

        this.assert(
          hasPostType,
          `Post type '${dataSource.postType}' debe estar especificado en query`,
          'warning',
          {
            type: 'posttype-missing',
            component: componentName,
            postType: dataSource.postType
          }
        );
      }
    }
  }

  /**
   * Validación genérica basada en metadata - sin hardcodeos por componente
   */
  validateSpecificComponent(html, componentName) {
    // Validación genérica aplicada a todos los componentes
    // Las validaciones específicas deben venir de metadata.json, no hardcodeadas
    this.validateGenericComponentStructure(html, componentName);
  }

  /**
   * Validación genérica de estructura de componente basada en metadata
   */
  validateGenericComponentStructure(html, componentName) {
    // Validación genérica que se aplica a todos los componentes
    // Las validaciones específicas deben configurarse en metadata.json

    // Lazy loading para imágenes (regla universal)
    if (html.includes('<img')) {
      this.assert(
        html.includes('loading="lazy"'),
        `Componente ${componentName} debe usar lazy loading para imágenes`,
        'warning',
        { type: 'generic-lazy-loading', component: componentName }
      );
    }

    // Validación de escape de datos (regla universal)
    this.assert(
      !html.includes('<?php echo $') || html.includes('esc_html(') || html.includes('esc_url('),
      `Componente ${componentName} debe usar escapado de datos (esc_html, esc_url)`,
      'error',
      { type: 'generic-data-escaping', component: componentName }
    );
  }





  /**
   * Detecta CSS duplicado
   */
  detectDuplicateCSS(html) {
    const styleBlocks = html.match(/<style[^>]*>[\s\S]*?<\/style>/gi);
    if (!styleBlocks || styleBlocks.length < 2) return false;

    const styleContents = styleBlocks.map(block =>
      block.replace(/<\/?style[^>]*>/gi, '').trim()
    );

    // Buscar contenido CSS duplicado
    for (let i = 0; i < styleContents.length; i++) {
      for (let j = i + 1; j < styleContents.length; j++) {
        if (styleContents[i] === styleContents[j] && styleContents[i].length > 50) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Extrae contexto alrededor de un patrón encontrado
   */
  extractContext(html, pattern, contextLength = 100) {
    const index = html.indexOf(pattern);
    if (index === -1) return null;

    const start = Math.max(0, index - contextLength);
    const end = Math.min(html.length, index + pattern.length + contextLength);

    return html.substring(start, end);
  }

  /**
   * Valida consistencia de metadata
   */
  validateMetadataConsistency(metadata) {
    const components = Object.keys(metadata).filter(key => {
      const item = metadata[key];
      return item.type && item.phpFunction;
    });

    this.assert(
      components.length > 0,
      'metadata.json debe contener al menos un componente válido',
      'error',
      { type: 'metadata-components', count: components.length }
    );

    // Validar que cada componente tenga propiedades requeridas
    components.forEach(componentName => {
      const component = metadata[componentName];

      this.assert(
        component.type,
        `Componente '${componentName}' debe tener tipo definido`,
        'error',
        { type: 'component-type', component: componentName }
      );

      this.assert(
        component.phpFunction,
        `Componente '${componentName}' debe tener phpFunction definida`,
        'error',
        { type: 'component-function', component: componentName }
      );
    });
  }

  /**
   * Valida configuración de páginas
   */
  validatePageConfiguration(pageTemplates, metadata) {
    const pages = Object.keys(pageTemplates);

    this.assert(
      pages.length > 0,
      'page-templates.json debe contener al menos una página',
      'error',
      { type: 'page-templates', count: pages.length }
    );

    // Validar que componentes usados en páginas estén definidos
    pages.forEach(pageName => {
      const pageConfig = pageTemplates[pageName];

      if (pageConfig.components) {
        pageConfig.components.forEach(componentConfig => {
          const componentName = componentConfig.name;

          this.assert(
            metadata[componentName],
            `Componente '${componentName}' usado en ${pageName} no está definido en metadata.json`,
            'error',
            { type: 'component-not-defined', component: componentName, page: pageName }
          );
        });
      }
    });
  }

  /**
   * Valida que componentes PHP estén generados
   */
  validateGeneratedComponents(metadata) {
    const fs = require('fs');
    const path = require('path');

    const components = Object.keys(metadata).filter(key => {
      const item = metadata[key];
      return item.type && item.phpFunction;
    });

    components.forEach(componentName => {
      const config = ConfigSingleton.getInstance();
      const themeHandle = config.getThemeHandle();
      const componentPath = path.join(
        process.cwd(),
        'wordpress-output',
        themeHandle,
        'components',
        componentName,
        `${componentName}.php`
      );

      this.assert(
        fs.existsSync(componentPath),
        `Componente PHP '${componentName}' debe estar generado`,
        'warning',
        { type: 'component-generated', component: componentName, path: componentPath }
      );

      // 🔧 NUEVA: Validar contenido PHP sin fallbacks
      if (fs.existsSync(componentPath)) {
        const phpContent = fs.readFileSync(componentPath, 'utf8');
        this.validateGeneratedPHPFailFast(componentName, phpContent);
      }
    });
  }

  /**
   * 🔒 NUEVA: Validar escape metadata obligatoria para Babel AST
   */
  validateEscapeMetadata(metadata) {
    Object.entries(metadata).forEach(([componentName, componentMeta]) => {
      // Skip non-component entries
      if (!componentMeta.parameters) return;

      // Validar que todos los parameters tengan escape
      componentMeta.parameters.forEach(param => {
        this.assert(
          param.escape !== undefined,
          `Parámetro '${param.name}' en componente '${componentName}' debe tener campo 'escape'`,
          'error',
          {
            type: 'missing-escape-metadata',
            component: componentName,
            parameter: param.name,
            fix: `Agregar "escape": "html|url|attr" en metadata.json`
          }
        );

        // Validar valores de escape válidos
        const validEscapeTypes = ['html', 'url', 'attr', 'js', 'none'];
        if (param.escape) {
          this.assert(
            validEscapeTypes.includes(param.escape),
            `Escape type '${param.escape}' inválido para '${param.name}' en '${componentName}'`,
            'error',
            {
              type: 'invalid-escape-type',
              component: componentName,
              parameter: param.name,
              validTypes: validEscapeTypes
            }
          );
        }
      });

      // Validar arrayFields si existen
      if (componentMeta.arrayFields) {
        Object.entries(componentMeta.arrayFields).forEach(([arrayName, fields]) => {
          fields.forEach(field => {
            this.assert(
              field.escape !== undefined,
              `Array field '${field.name}' en '${arrayName}' de componente '${componentName}' debe tener campo 'escape'`,
              'error',
              {
                type: 'missing-array-escape-metadata',
                component: componentName,
                arrayName,
                fieldName: field.name,
                fix: `Agregar "escape": "html|url|attr" en arrayFields.${arrayName}`
              }
            );
          });
        });
      }
    });
  }

  /**
   * 🚨 NUEVA: Validar fail-fast compliance (.rules)
   */
  validateFailFastCompliance(metadata) {
    // Verificar que no haya estructuras que sugieran fallbacks
    Object.entries(metadata).forEach(([componentName, componentMeta]) => {
      // Validar que no haya parámetros con valores "or" o fallbacks evidentes
      if (componentMeta.parameters) {
        componentMeta.parameters.forEach(param => {
          // Detectar posibles fallbacks en defaults
          if (param.default && typeof param.default === 'string') {
            const hasFallbackPattern = param.default.includes('||') ||
                                     param.default.includes('??') ||
                                     param.default.includes('fallback');

            this.assert(
              !hasFallbackPattern,
              `Parámetro '${param.name}' en '${componentName}' no debe tener fallbacks silenciosos`,
              'warning',
              {
                type: 'potential-fallback',
                component: componentName,
                parameter: param.name,
                value: param.default
              }
            );
          }
        });
      }
    });
  }

  /**
   * 🔧 NUEVA: Validar PHP generado sin fallbacks
   */
  validateGeneratedPHPFailFast(componentName, phpContent) {
    // Buscar patterns que indican fallbacks DE LÓGICA PHP (no visuales)
    const fallbackPatterns = [
      { pattern: /\$\w+\s*\|\|\s*['"]/g, name: 'Variable OR fallback operator' },
      { pattern: /\?\?/g, name: 'Nullish coalescing' },
      { pattern: /fallback/gi, name: 'Fallback keyword' },
      { pattern: /default.*value/gi, name: 'Default value fallback' },
      { pattern: /\?.+:.*esc_html/g, name: 'Conditional escape fallback' }
    ];

    fallbackPatterns.forEach(({ pattern, name }) => {
      const matches = phpContent.match(pattern);
      if (matches) {
        this.assert(
          false,
          `PHP generado para '${componentName}' contiene ${name} que viola .rules`,
          'error',
          {
            type: 'php-fallback-detected',
            component: componentName,
            pattern: name,
            count: matches.length,
            fix: 'Eliminar fallbacks y usar fail-fast en lugar de fallbacks silenciosos'
          }
        );
      }
    });

    // Verificar que todos los escapes sean explícitos
    const escapePattern = /esc_(?:html|url|attr|js)\s*\(/g;
    const variablePattern = /\$\w+/g;

    const escapes = phpContent.match(escapePattern) || [];
    const variables = phpContent.match(variablePattern) || [];

    // Aproximación: debe haber al menos tantos escapes como variables
    if (variables.length > 0 && escapes.length === 0) {
      this.assert(
        false,
        `PHP generado para '${componentName}' no usa funciones de escape`,
        'error',
        {
          type: 'no-escape-functions',
          component: componentName,
          variables: variables.length,
          escapes: escapes.length
        }
      );
    }
  }
}

module.exports = ComponentValidator;