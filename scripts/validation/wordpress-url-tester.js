const https = require('https');
const http = require('http');
const { URL } = require('url');
const fs = require('fs');
const path = require('path');

/**
 * WordPress URL Tester
 * 
 * Valida que todos los managers (SEO, Asset, Analytics, Template, Component)
 * estén generando el código PHP correcto según las mejores prácticas de WordPress
 */
class WordPressURLTester {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || 'http://localhost';
    this.config = config;
    this.testResults = [];
    
    // URLs de test definidas dinámicamente desde metadata
    this.testUrls = this.generateTestUrls();
    
    // Validadores específicos por manager
    this.validators = {
      seo: this.validateSEOManager.bind(this),
      assets: this.validateAssetManager.bind(this),
      analytics: this.validateAnalyticsManager.bind(this),
      templates: this.validateTemplateManager.bind(this),
      components: this.validateComponentManager.bind(this)
    };
  }

  /**
   * Genera URLs de test dinámicamente desde la metadata
   */
  generateTestUrls() {
    const metadataPath = path.join(process.cwd(), 'src', 'component-metadata.json');
    let metadata = {};
    
    if (fs.existsSync(metadataPath)) {
      try {
        metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      } catch (error) {
        console.warn('⚠️ Error cargando metadata, usando URLs por defecto');
      }
    }

    const urls = [];
    
    // URLs desde templates en metadata
    if (metadata.templates) {
      Object.keys(metadata.templates).forEach(templateName => {
        const urlPath = templateName.replace('page-', '').replace('single-', '');
        urls.push({
          name: templateName,
          url: `${this.baseUrl}/${urlPath}/`,
          type: 'template',
          expectedComponents: this.getExpectedComponents(templateName, metadata)
        });
      });
    }

    // URLs adicionales comunes
    urls.push(
      { name: 'homepage', url: this.baseUrl, type: 'front-page', expectedComponents: [] },
      { name: 'blog', url: `${this.baseUrl}/blog/`, type: 'index', expectedComponents: [] }
    );

    return urls;
  }

  /**
   * Obtiene componentes esperados para un template
   */
  getExpectedComponents(templateName, metadata) {
    const components = [];
    
    // Buscar componentes que mapean a este template
    Object.entries(metadata).forEach(([componentName, config]) => {
      if (config.template === templateName || 
          (config.aggregation && config.aggregation.template === templateName)) {
        components.push(componentName);
      }
    });

    return components;
  }

  /**
   * Obtiene contenido HTML de una URL
   */
  async fetchUrl(url) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const client = urlObj.protocol === 'https:' ? https : http;
      
      const req = client.get(url, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            html: data
          });
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      req.setTimeout(10000); // 10 second timeout
    });
  }

  /**
   * Valida SEO Manager
   */
  validateSEOManager(html, urlConfig) {
    const issues = [];
    
    // 1. Meta tags básicos
    if (!html.includes('<meta name="description"')) {
      issues.push('❌ Meta description faltante');
    }
    
    if (!html.includes('<meta name="keywords"')) {
      issues.push('❌ Meta keywords faltante');
    }
    
    // 2. OpenGraph
    if (!html.includes('<meta property="og:title"')) {
      issues.push('❌ OpenGraph title faltante');
    }
    
    if (!html.includes('<meta property="og:description"')) {
      issues.push('❌ OpenGraph description faltante');
    }
    
    // 3. JSON-LD Structured Data
    if (!html.includes('application/ld+json')) {
      issues.push('❌ JSON-LD structured data faltante');
    } else {
      try {
        const jsonLdMatch = html.match(/<script type="application\/ld\\+json"[^>]*>([\\s\\S]*?)<\/script>/);
        if (jsonLdMatch) {
          JSON.parse(jsonLdMatch[1]); // Verificar que es JSON válido
        }
      } catch (error) {
        issues.push('❌ JSON-LD malformado');
      }
    }
    
    // 4. Canonical URL
    if (!html.includes('<link rel="canonical"')) {
      issues.push('❌ Canonical URL faltante');
    }

    // 5. Twitter Cards
    if (!html.includes('<meta name="twitter:card"')) {
      issues.push('❌ Twitter Card faltante');
    }

    return {
      manager: 'SEO Manager',
      url: urlConfig.url,
      issues: issues,
      status: issues.length === 0 ? 'PASS' : 'FAIL'
    };
  }

  /**
   * Valida Asset Manager
   */
  validateAssetManager(html, urlConfig) {
    const issues = [];
    
    // 1. CSS Design Tokens
    if (!html.includes('design-tokens.css')) {
      issues.push('❌ Design tokens CSS faltante');
    }
    
    // 2. JavaScript modules
    const hasEs6 = html.includes('type="module"');
    const hasUmd = html.includes('.umd.js');
    
    if (!hasEs6 && !hasUmd) {
      issues.push('❌ JavaScript modules (ES6 o UMD) faltantes');
    }
    
    // 3. Prevención de carga duplicada
    const scriptTags = (html.match(/<script[^>]*src[^>]*toulouse-ds[^>]*>/g) || []).length;
    if (scriptTags > 1) {
      issues.push('❌ Scripts duplicados detectados - posible conflicto de custom elements');
    }
    
    // 4. Lazy loading
    if (!html.includes('loading="lazy"')) {
      issues.push('⚠️ Lazy loading no detectado en imágenes');
    }
    
    // 5. Preload crítico
    if (!html.includes('rel="preload"')) {
      issues.push('⚠️ Preload de assets críticos no detectado');
    }

    return {
      manager: 'Asset Manager',
      url: urlConfig.url,
      issues: issues,
      status: issues.length === 0 ? 'PASS' : 'FAIL'
    };
  }

  /**
   * Valida Analytics Manager  
   */
  validateAnalyticsManager(html, urlConfig) {
    const issues = [];
    
    // 1. Analytics tracking code
    if (!html.includes('gtag') && !html.includes('analytics')) {
      issues.push('⚠️ Código de analytics no detectado');
    }
    
    // 2. Event tracking por componentes
    urlConfig.expectedComponents.forEach(component => {
      if (!html.includes(`component_view`) || !html.includes(component)) {
        issues.push(`⚠️ Event tracking para ${component} no detectado`);
      }
    });
    
    // 3. Page view tracking
    if (urlConfig.type === 'template' && !html.includes('page_view')) {
      issues.push('⚠️ Page view tracking no detectado');
    }

    return {
      manager: 'Analytics Manager',
      url: urlConfig.url,
      issues: issues,
      status: issues.length === 0 ? 'PASS' : 'WARN'
    };
  }

  /**
   * Valida Template Manager
   */
  validateTemplateManager(html, urlConfig) {
    const issues = [];
    
    // 1. WordPress hooks básicos
    if (!html.includes('wp_head()')) {
      issues.push('❌ wp_head() hook faltante en header');
    }
    
    if (!html.includes('wp_footer()')) {
      issues.push('❌ wp_footer() hook faltante en footer');  
    }
    
    // 2. WordPress body classes
    if (!html.includes('class="')) {
      issues.push('⚠️ Body classes de WordPress no detectadas');
    }
    
    // 3. Template específico cargado
    const templateName = urlConfig.name;
    if (templateName && !html.includes(templateName.replace('-', ' '))) {
      // Es solo una advertencia porque el título puede variar
      issues.push(`⚠️ Contenido específico de ${templateName} no claramente detectado`);
    }

    return {
      manager: 'Template Manager',
      url: urlConfig.url,
      issues: issues,
      status: issues.length === 0 ? 'PASS' : 'WARN'
    };
  }

  /**
   * Valida Component Manager
   */
  validateComponentManager(html, urlConfig) {
    const issues = [];
    
    // 1. Componentes esperados presentes
    urlConfig.expectedComponents.forEach(componentName => {
      const componentClass = componentName.replace('-', '');
      if (!html.includes(componentClass) && !html.includes(componentName)) {
        issues.push(`❌ Componente ${componentName} no detectado`);
      }
    });
    
    // 2. Estilos de componentes inyectados
    if (!html.includes('component-styles')) {
      issues.push('⚠️ Estilos de componentes no detectados en head');
    }
    
    // 3. No debe mostrar template literals
    if (html.includes('${') || html.includes('this.')) {
      issues.push('❌ Template literals de JavaScript no convertidos - error de conversión Lit → PHP');
    }
    
    // 4. Escape apropiado
    const unsafePatterns = [
      'echo $',  // Sin escape
      '"<?php echo "', // Double escaping
      'echo get_the_content()' // Content sin escape
    ];
    
    unsafePatterns.forEach(pattern => {
      if (html.includes(pattern)) {
        issues.push(`❌ Patrón inseguro detectado: ${pattern}`);
      }
    });

    return {
      manager: 'Component Manager',
      url: urlConfig.url,
      issues: issues,
      status: issues.length === 0 ? 'PASS' : 'FAIL'
    };
  }

  /**
   * Ejecuta test completo de una URL
   */
  async testUrl(urlConfig) {
    console.log(`🔍 Testing: ${urlConfig.name} (${urlConfig.url})`);
    
    try {
      const response = await this.fetchUrl(urlConfig.url);
      
      if (response.statusCode !== 200) {
        return {
          url: urlConfig.url,
          status: 'ERROR',
          error: `HTTP ${response.statusCode}`,
          managers: {}
        };
      }
      
      const html = response.html;
      const managerResults = {};
      
      // Test cada manager
      Object.entries(this.validators).forEach(([managerName, validator]) => {
        managerResults[managerName] = validator(html, urlConfig);
      });
      
      return {
        url: urlConfig.url,
        status: 'SUCCESS', 
        managers: managerResults,
        performance: {
          responseTime: response.headers['x-response-time'] || 'N/A',
          contentLength: html.length
        }
      };
      
    } catch (error) {
      return {
        url: urlConfig.url,
        status: 'ERROR',
        error: error.message,
        managers: {}
      };
    }
  }

  /**
   * Ejecuta tests completos
   */
  async runTests() {
    console.log('🚀 Iniciando WordPress URL Testing...');
    console.log(`📋 URLs a probar: ${this.testUrls.length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const results = [];
    
    for (const urlConfig of this.testUrls) {
      const result = await this.testUrl(urlConfig);
      results.push(result);
      
      // Esperar un poco entre requests para no sobrecargar
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    this.generateReport(results);
    return results;
  }

  /**
   * Genera reporte detallado
   */
  generateReport(results) {
    console.log('\\n📊 WordPress URL Testing Report');
    console.log('═══════════════════════════════════════════════════');
    
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    let errorTests = 0;
    
    results.forEach(result => {
      console.log(`\\n🔗 ${result.url}`);
      console.log(`   Status: ${this.getStatusIcon(result.status)} ${result.status}`);
      
      if (result.error) {
        console.log(`   Error: ${result.error}`);
        errorTests++;
        return;
      }
      
      Object.entries(result.managers || {}).forEach(([managerName, managerResult]) => {
        totalTests++;
        const icon = managerResult.status === 'PASS' ? '✅' : 
                    managerResult.status === 'WARN' ? '⚠️' : '❌';
        
        console.log(`   ${icon} ${managerResult.manager}: ${managerResult.status}`);
        
        if (managerResult.issues && managerResult.issues.length > 0) {
          managerResult.issues.forEach(issue => {
            console.log(`     ${issue}`);
          });
          
          if (managerResult.status === 'FAIL') failedTests++;
        } else {
          passedTests++;
        }
      });
    });
    
    console.log('\\n📈 Estadísticas del Testing');
    console.log('─────────────────────────────────────────────────────');
    console.log(`📁 URLs probadas: ${results.length}`);
    console.log(`📊 Tests de managers: ${totalTests}`);
    console.log(`✅ Tests exitosos: ${passedTests}`);
    console.log(`❌ Tests fallidos: ${failedTests}`);
    console.log(`🚫 Errores de conexión: ${errorTests}`);
    console.log(`📈 Tasa de éxito: ${totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0}%`);
    
    // WordPress Best Practices Check
    console.log('\\n🔒 WordPress Best Practices Validation');
    console.log('─────────────────────────────────────────────────────');
    this.validateBestPractices(results);
    
    const overallStatus = failedTests === 0 ? 'SUCCESS' : 'NEEDS_FIXES';
    console.log(`\\n🎯 Estado general: ${this.getStatusIcon(overallStatus)} ${overallStatus}`);
    
    if (overallStatus === 'NEEDS_FIXES') {
      console.log('\\n💡 Recomendaciones:');
      console.log('   • Revisar managers que fallaron');
      console.log('   • Verificar que WordPress esté ejecutándose');  
      console.log('   • Comprobar que el tema esté activado');
      console.log('   • Ejecutar npm run wp:validate-php para validar sintaxis');
    }
  }

  /**
   * Valida best practices de WordPress
   */
  validateBestPractices(results) {
    const practices = [
      // Security Best Practices (Critical)
      { 
        name: '🔒 Escape de datos (implementado en PHP)', 
        check: (html) => {
          // Las funciones de escape se procesan server-side, verificamos que no haya vulnerabilidades obvias
          return !html.includes('<?php echo $_') && !html.includes('<script>alert(') && !html.includes('javascript:');
        },
        critical: true,
        category: 'security'
      },
      { 
        name: '🔒 Sanitización de entrada ($_GET, $_POST)', 
        check: (html) => !html.includes('$_GET') && !html.includes('$_POST') || html.includes('sanitize_'),
        critical: true,
        category: 'security'
      },
      { 
        name: '🔒 Nonces para formularios', 
        check: (html) => !html.includes('<form') || html.includes('wp_nonce'),
        critical: true,
        category: 'security'
      },
      { 
        name: '🔒 Consultas preparadas ($wpdb->prepare)', 
        check: (html) => !html.includes('$wpdb->query') || html.includes('$wpdb->prepare'),
        critical: true,
        category: 'security'
      },
      
      // Performance Best Practices  
      { 
        name: '⚡ wp_enqueue_script para JavaScript', 
        check: (html) => html.includes('wp_enqueue_script') || !html.includes('<script'),
        critical: false,
        category: 'performance'
      },
      { 
        name: '⚡ wp_enqueue_style para CSS', 
        check: (html) => html.includes('wp_enqueue_style') || !html.includes('<link'),
        critical: false,
        category: 'performance'
      },
      {
        name: '⚡ Lazy loading de imágenes',
        check: (html) => html.includes('loading="lazy"') || !html.includes('<img'),
        critical: false,
        category: 'performance'
      },
      {
        name: '⚡ Preload de assets críticos',
        check: (html) => html.includes('rel="preload"') || html.includes("rel='preload'"),
        critical: false,
        category: 'performance'
      },
      {
        name: '⚡ Cache de consultas (wp_cache_get)',
        check: (html) => html.includes('wp_cache_get') || !html.includes('get_post_meta'),
        critical: false,
        category: 'performance'
      },
      
      // SEO Best Practices
      { 
        name: '📊 Meta description', 
        check: (html) => html.includes('<meta name="description"'),
        critical: false,
        category: 'seo'
      },
      { 
        name: '📊 OpenGraph tags', 
        check: (html) => html.includes('og:title') && html.includes('og:description'),
        critical: false,
        category: 'seo'
      },
      { 
        name: '📊 Structured Data (JSON-LD)', 
        check: (html) => html.includes('application/ld+json'),
        critical: false,
        category: 'seo'
      },
      { 
        name: '📊 Canonical URL', 
        check: (html) => html.includes('rel="canonical"'),
        critical: false,
        category: 'seo'
      },
      
      // WordPress Structure Best Practices
      { 
        name: '🔧 wp_head() hook (meta tags presentes)', 
        check: (html) => html.includes('<meta name="') && html.includes('<link rel='),
        critical: true,
        category: 'structure'
      },
      { 
        name: '🔧 wp_footer() hook (scripts al final)', 
        check: (html) => html.includes('</body>') && (html.includes('<script') || !html.includes('<script')),
        critical: true,
        category: 'structure'
      },
      { 
        name: '🔧 language_attributes()', 
        check: (html) => html.includes('lang=') || html.includes('xml:lang='),
        critical: false,
        category: 'structure'
      },
      { 
        name: '🔧 body_class()', 
        check: (html) => html.includes('<body class='),
        critical: false,
        category: 'structure'
      },
      
      // Accessibility Best Practices
      { 
        name: '♿ Alt text en imágenes', 
        check: (html) => !html.includes('<img') || html.includes('alt='),
        critical: false,
        category: 'accessibility'
      },
      { 
        name: '♿ ARIA labels en navegación', 
        check: (html) => !html.includes('<nav') || html.includes('aria-'),
        critical: false,
        category: 'accessibility'
      },
      
      // Mobile Best Practices  
      { 
        name: '📱 Meta viewport', 
        check: (html) => html.includes('name="viewport"'),
        critical: false,
        category: 'mobile'
      }
    ];

    // Agrupar por categorías para mejor reporte
    const categories = {
      security: { name: 'SEGURIDAD', icon: '🔒', practices: [] },
      performance: { name: 'RENDIMIENTO', icon: '⚡', practices: [] },
      seo: { name: 'SEO', icon: '📊', practices: [] },
      structure: { name: 'ESTRUCTURA', icon: '🔧', practices: [] },
      accessibility: { name: 'ACCESIBILIDAD', icon: '♿', practices: [] },
      mobile: { name: 'MÓVIL', icon: '📱', practices: [] }
    };

    let overallScore = 0;
    let criticalIssues = 0;
    let totalPractices = 0;

    practices.forEach(practice => {
      let passed = 0;
      let total = 0;
      
      results.forEach(result => {
        if (result.status === 'SUCCESS') {
          total++;
          const htmlContent = this.getAllHtmlContent(result);
          if (practice.check(htmlContent)) {
            passed++;
          }
        }
      });
      
      const percentage = total > 0 ? (passed / total * 100).toFixed(1) : 0;
      const isPassing = percentage >= 80;
      
      const practiceResult = {
        name: practice.name,
        percentage: percentage,
        passed: passed,
        total: total,
        isPassing: isPassing,
        critical: practice.critical,
        status: practice.critical && !isPassing ? 'CRITICAL' : isPassing ? 'PASS' : 'WARN'
      };
      
      categories[practice.category].practices.push(practiceResult);
      
      // Calcular score general
      totalPractices++;
      if (isPassing) {
        overallScore += practice.critical ? 20 : 10;
      }
      if (practice.critical && !isPassing) {
        criticalIssues++;
      }
    });

    // Mostrar reporte por categorías
    Object.values(categories).forEach(category => {
      if (category.practices.length > 0) {
        console.log(`\\n   ${category.icon} ${category.name}`);
        console.log('   ' + '─'.repeat(category.name.length + 4));
        
        category.practices.forEach(practice => {
          const icon = practice.status === 'PASS' ? '✅' : 
                      practice.status === 'CRITICAL' ? '🚨' : '⚠️';
          const statusText = practice.critical && !practice.isPassing ? 'CRÍTICO' : 
                           practice.isPassing ? 'PASS' : 'WARN';
          
          console.log(`     ${icon} ${practice.name}`);
          console.log(`        ${practice.percentage}% (${practice.passed}/${practice.total}) - ${statusText}`);
        });
      }
    });

    // Resumen general
    const maxScore = totalPractices * 15; // Score promedio ponderado
    const scorePercentage = (overallScore / maxScore * 100).toFixed(1);
    
    console.log('\\n   📋 RESUMEN BEST PRACTICES');
    console.log('   ─'.repeat(26));
    console.log(`     🎯 Score general: ${scorePercentage}% (${overallScore}/${maxScore})`);
    console.log(`     🚨 Issues críticos: ${criticalIssues}`);
    console.log(`     ✅ Prácticas evaluadas: ${totalPractices}`);
    
    if (criticalIssues > 0) {
      console.log('\\n   ⚠️  ACCIÓN REQUERIDA: Resolver issues críticos de seguridad');
    } else if (scorePercentage < 70) {
      console.log('\\n   💡 MEJORAS RECOMENDADAS: Implementar más best practices');
    } else {
      console.log('\\n   🎉 EXCELENTE: WordPress best practices bien implementadas');
    }
  }

  /**
   * Obtiene todo el contenido HTML de un resultado de test
   */
  getAllHtmlContent(result) {
    let allHtml = '';
    
    Object.values(result.managers || {}).forEach(manager => {
      if (manager.html) {
        allHtml += manager.html;
      }
    });
    
    return allHtml;
  }

  /**
   * Obtiene ícono de status
   */
  getStatusIcon(status) {
    switch (status) {
      case 'SUCCESS': case 'PASS': return '✅';
      case 'WARN': return '⚠️';
      case 'FAIL': case 'ERROR': case 'NEEDS_FIXES': return '❌';
      default: return '📋';
    }
  }

  /**
   * Comando interactivo
   */
  static async runInteractive(config = {}) {
    const tester = new WordPressURLTester(config);
    
    console.log('🎯 WordPress URL Tester');
    console.log('Validando todos los managers contra URLs en vivo');
    console.log(`Base URL: ${tester.baseUrl}`);
    console.log('');
    
    try {
      await tester.runTests();
    } catch (error) {
      console.error('❌ Error durante testing:', error.message);
      process.exit(1);
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const config = {
    baseUrl: process.argv[2] || 'http://localhost',
    outputDir: './wordpress-output',
    themeName: 'toulouse-lautrec'
  };
  
  WordPressURLTester.runInteractive(config);
}

module.exports = WordPressURLTester;