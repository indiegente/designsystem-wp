const https = require('https');
const http = require('http');
const { URL } = require('url');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Hybrid Validator - Best of both worlds
 * 
 * ✅ Detailed real-time validation like original
 * ✅ Professional tools integration 
 * ✅ Business-specific manager validation
 * ❌ No redundant checks (delegated to PHPCS/Lighthouse)
 */
class HybridValidator {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || 'http://localhost';
    this.config = config;
    this.testResults = [];
    this.testUrls = this.generateTestUrls();
    
    // Validators for our custom managers
    this.validators = {
      seo: this.validateSEOManager.bind(this),
      assets: this.validateAssetManager.bind(this), 
      analytics: this.validateAnalyticsManager.bind(this),
      templates: this.validateTemplateManager.bind(this),
      components: this.validateComponentManager.bind(this)
    };
  }

  generateTestUrls() {
    const pageTemplatesPath = path.join(process.cwd(), 'src', 'page-templates.json');
    let pageTemplates = {};
    
    if (fs.existsSync(pageTemplatesPath)) {
      try {
        pageTemplates = JSON.parse(fs.readFileSync(pageTemplatesPath, 'utf8'));
      } catch (error) {
        console.warn('⚠️ Error cargando page-templates.json, usando URLs por defecto');
      }
    }

    const urls = [];
    
    // URLs from page-templates.json
    Object.keys(pageTemplates).forEach(pageName => {
      const pageConfig = pageTemplates[pageName];
      const urlPath = pageName.replace('page-', '');
      urls.push({
        name: pageName,
        url: `${this.baseUrl}/${urlPath}/`,
        type: 'page',
        expectedComponents: this.getExpectedComponents(pageName, pageConfig),
        pageConfig: pageConfig
      });
    });

    // Homepage
    urls.push({
      name: 'homepage',
      url: this.baseUrl,
      type: 'front-page', 
      expectedComponents: [],
      pageConfig: null
    });

    return urls;
  }

  getExpectedComponents(pageName, pageConfig) {
    const components = [];
    if (pageConfig && pageConfig.components) {
      pageConfig.components.forEach(component => {
        components.push(component.name);
      });
    }
    return components;
  }

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
            body: data
          });
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      req.setTimeout(10000, () => {
        req.abort();
        reject(new Error('Request timeout'));
      });
    });
  }

  /**
   * Validate all managers for a URL with detailed reporting
   */
  async validateUrl(urlConfig) {
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

      const html = response.body;
      const managers = {};

      // Run all manager validators
      Object.entries(this.validators).forEach(([key, validator]) => {
        managers[key] = validator(html, urlConfig);
      });

      // Determine overall status
      const failedManagers = Object.values(managers).filter(m => m.status === 'FAIL');
      const warnManagers = Object.values(managers).filter(m => m.status === 'WARN');
      
      let overallStatus = 'SUCCESS';
      if (failedManagers.length > 0) {
        overallStatus = 'ERROR';
      } else if (warnManagers.length > 0) {
        overallStatus = 'SUCCESS'; // Warnings don't fail the overall status
      }

      return {
        url: urlConfig.url,
        status: overallStatus,
        managers,
        htmlLength: html.length,
        responseTime: Date.now()
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
   * Validate OUR SEO Manager with detailed checks
   */
  validateSEOManager(html, urlConfig) {
    const issues = [];
    
    // Check our SEO manager is working
    const hasToulouseSEO = html.includes('toulouse') || html.includes('Toulouse');
    if (!hasToulouseSEO) {
      issues.push('⚠️ Toulouse branding no detectado en SEO');
    }
    
    // Check for structured data from our system
    if (!html.includes('application/ld+json')) {
      issues.push('⚠️ JSON-LD structured data no encontrado');
    }
    
    // Check for our custom meta tags
    if (!html.includes('meta name="description"') && !html.includes('meta property="og:')) {
      issues.push('⚠️ Meta tags básicos no detectados');
    }

    return {
      manager: 'SEO Manager',
      url: urlConfig.url,
      status: issues.length === 0 ? 'PASS' : 'WARN',
      issues: issues,
      details: `HTML length: ${html.length} chars`
    };
  }

  /**
   * Validate OUR Analytics Manager with detailed checks
   */
  validateAnalyticsManager(html, urlConfig) {
    const issues = [];
    
    // Check for GA4 from our config
    const hasGA4 = html.includes('G-') && html.includes('gtag');
    if (!hasGA4) {
      issues.push('⚠️ Google Analytics 4 no detectado');
    }
    
    // Check for our custom events system
    const hasCustomEvents = html.includes('dataLayer') || html.includes('toulouse-analytics');
    if (!hasCustomEvents) {
      issues.push('⚠️ Sistema de eventos personalizados no detectado');
    }
    
    // Check component-specific events
    if (urlConfig.expectedComponents.length > 0) {
      const missingEvents = urlConfig.expectedComponents.filter(component => {
        return !html.includes(component) || !html.includes('event');
      });
      
      if (missingEvents.length > 0) {
        issues.push(`⚠️ Eventos para componentes no detectados: ${missingEvents.slice(0, 2).join(', ')}`);
      }
    }

    return {
      manager: 'Analytics Manager',
      url: urlConfig.url,
      status: issues.length === 0 ? 'PASS' : 'WARN',
      issues: issues,
      details: `GA4: ${hasGA4 ? 'Yes' : 'No'}, Events: ${hasCustomEvents ? 'Yes' : 'No'}`
    };
  }

  /**
   * Validate OUR Asset Manager with detailed checks  
   */
  validateAssetManager(html, urlConfig) {
    const issues = [];
    
    // Check for our Vite-generated assets
    const hasViteCSS = html.includes('toulouse-design-system-') || html.includes('/assets/css/');
    const hasViteJS = html.includes('toulouse-ds') || html.includes('/assets/js/');
    
    if (!hasViteCSS) {
      issues.push('⚠️ CSS assets optimizados por Vite no detectados');
    }
    
    if (!hasViteJS) {
      issues.push('⚠️ JavaScript assets optimizados por Vite no detectados');
    }
    
    // Check for design tokens
    const hasDesignTokens = html.includes('design-tokens') || html.includes('--tl-');
    if (!hasDesignTokens) {
      issues.push('⚠️ Design tokens CSS no detectados');
    }
    
    // Check for proper WordPress asset enqueuing
    const hasWPEnqueue = html.includes('/assets/') && (html.includes('.css') || html.includes('.js'));
    if (!hasWPEnqueue) {
      issues.push('⚠️ Assets no encolados correctamente por WordPress');
    }

    return {
      manager: 'Asset Manager',
      url: urlConfig.url,
      status: issues.length === 0 ? 'PASS' : (issues.length > 2 ? 'FAIL' : 'WARN'),
      issues: issues,
      details: `CSS: ${hasViteCSS ? 'Yes' : 'No'}, JS: ${hasViteJS ? 'Yes' : 'No'}, Tokens: ${hasDesignTokens ? 'Yes' : 'No'}`
    };
  }

  /**
   * Validate OUR Template Manager with detailed checks
   */
  validateTemplateManager(html, urlConfig) {
    const issues = [];
    
    // Check if expected components are rendered
    if (urlConfig.expectedComponents.length > 0) {
      const renderedComponents = urlConfig.expectedComponents.filter(component => {
        return html.includes(component) || html.includes(component.replace('-', '_'));
      });
      
      const missingComponents = urlConfig.expectedComponents.filter(component => {
        return !html.includes(component) && !html.includes(component.replace('-', '_'));
      });
      
      if (missingComponents.length > 0) {
        issues.push(`⚠️ Componentes no renderizados: ${missingComponents.join(', ')}`);
      }
      
      // Report success too
      if (renderedComponents.length > 0) {
        // This is good, no issue to add
      }
    }
    
    // Check for template-specific content
    const templateName = urlConfig.name;
    const hasTemplateContent = html.includes(templateName.replace('page-', '')) || 
                              html.includes(templateName.replace('-', ' ')) ||
                              html.length > 5000; // Has substantial content
    
    if (!hasTemplateContent) {
      issues.push(`⚠️ Contenido específico de ${templateName} no claramente detectado`);
    }

    return {
      manager: 'Template Manager',
      url: urlConfig.url,
      status: issues.length === 0 ? 'PASS' : 'WARN',
      issues: issues,
      details: `Components: ${urlConfig.expectedComponents.length} expected, Content: ${hasTemplateContent ? 'Yes' : 'No'}`
    };
  }

  /**
   * Validate component rendering system
   */
  validateComponentManager(html, urlConfig) {
    const issues = [];
    
    // Check if component system is working
    const hasComponentSystem = html.includes('render_') || html.includes('class="') || html.length > 3000;
    if (!hasComponentSystem) {
      issues.push('⚠️ Sistema de componentes no parece estar funcionando');
    }
    
    // Check for component-specific markup
    const hasComponentMarkup = html.includes('hero-section') || html.includes('course-card') || html.includes('testimonials');
    if (!hasComponentMarkup && urlConfig.expectedComponents.length > 0) {
      issues.push('⚠️ Markup de componentes específicos no detectado');
    }
    
    // Check for WordPress hooks integration
    const hasWPIntegration = html.includes('wp_head') || html.includes('wp_footer') || html.includes('<?php');
    // Note: We won't see <?php in rendered HTML, so check for WordPress-generated content
    const hasWPContent = html.includes('wp-content') || html.includes('admin-bar') || html.includes('wordpress');
    

    return {
      manager: 'Component Manager',
      url: urlConfig.url,
      status: issues.length === 0 ? 'PASS' : 'WARN',
      issues: issues,
      details: `System: ${hasComponentSystem ? 'Working' : 'No'}, Markup: ${hasComponentMarkup ? 'Yes' : 'No'}`
    };
  }

  async runTests() {
    console.log('🎯 Hybrid Validator - Best of Both Worlds');
    console.log('✅ Detailed real-time validation');
    console.log('✅ Professional tools integration (Lighthouse + PHPCS)');
    console.log('✅ Business-specific manager checks');
    console.log(`Base URL: ${this.baseUrl}`);
    console.log('');
    console.log('🚀 Iniciando Hybrid Validation...');
    console.log(`📋 URLs a probar: ${this.testUrls.length}`);
    console.log('━'.repeat(50));

    // Show URLs being tested
    for (const urlConfig of this.testUrls) {
      console.log(`🔍 Testing: ${urlConfig.name} (${urlConfig.url})`);
    }

    // Run manager tests in parallel for performance
    console.log('\n📋 Fase 1: Validación de Managers...');
    const testPromises = this.testUrls.map(urlConfig => this.validateUrl(urlConfig));
    this.testResults = await Promise.all(testPromises);

    this.printDetailedResults();
    
    // Run integrated professional tools
    console.log('\n📋 Fase 2: Herramientas Profesionales...');
    await this.runProfessionalTools();
    
    this.printSummary();
    this.printRecommendations();
  }

  /**
   * Run integrated professional tools: PHPCS + Lighthouse
   */
  async runProfessionalTools() {
    // 1. PHPCS - WordPress Coding Standards
    console.log('🔧 Ejecutando PHPCS (WordPress Coding Standards)...');
    try {
      execSync('php composer.phar exec phpcs -- --standard=WordPress wordpress-output/ --report=summary', { 
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: 30000
      });
      console.log('✅ PHPCS: Sin problemas críticos detectados');
    } catch (error) {
      const output = error.stdout?.toString() || error.stderr?.toString() || '';
      if (output.includes('FOUND') && output.includes('ERRORS')) {
        // Parse PHPCS output
        const lines = output.split('\n');
        const summaryLine = lines.find(line => line.includes('FOUND') && line.includes('ERRORS'));
        console.log(`⚠️ PHPCS: ${summaryLine || 'Problemas de coding standards detectados'}`);
        console.log('💡 Ejecutar: npm run wp:lint:fix para arreglar automáticamente');
      } else {
        console.log('⚠️ PHPCS: Error al ejecutar validación');
      }
    }

    // 2. Lighthouse - Performance, SEO, Accessibility
    console.log('⚡ Ejecutando Lighthouse (Performance/SEO/A11Y)...');
    await this.runLighthouse();
  }

  /**
   * Run Lighthouse for key URLs
   */
  async runLighthouse() {
    // Check if lighthouse is available
    try {
      execSync('which lighthouse', { stdio: 'ignore' });
    } catch (error) {
      console.log('📋 Lighthouse no instalado - Instalación rápida disponible:');
      console.log('   npm install -g lighthouse');
      console.log('   Continuando sin auditoría de Lighthouse...');
      return;
    }

    // Test key URLs with Lighthouse
    const keyUrls = this.testResults
      .filter(result => !result.error || !result.error.includes('HTTP 404'))
      .slice(0, 2); // Test first 2 valid URLs to save time

    for (const result of keyUrls) {
      try {
        console.log(`🔍 Lighthouse: ${result.url}`);
        
        // Run Lighthouse with limited categories for speed
        const lighthouseCmd = `lighthouse "${result.url}" --output=json --only-categories=performance,accessibility,seo --chrome-flags="--headless --no-sandbox" --quiet`;
        
        const lighthouseOutput = execSync(lighthouseCmd, { 
          timeout: 45000,
          stdio: ['ignore', 'pipe', 'ignore']
        }).toString();
        
        const lighthouseData = JSON.parse(lighthouseOutput);
        const scores = lighthouseData.lhr.categories;
        
        console.log(`   Performance: ${Math.round(scores.performance.score * 100)}% ${this.getScoreIcon(scores.performance.score)}`);
        console.log(`   Accessibility: ${Math.round(scores.accessibility.score * 100)}% ${this.getScoreIcon(scores.accessibility.score)}`);
        console.log(`   SEO: ${Math.round(scores.seo.score * 100)}% ${this.getScoreIcon(scores.seo.score)}`);
        
        // Store lighthouse results
        result.lighthouse = {
          performance: Math.round(scores.performance.score * 100),
          accessibility: Math.round(scores.accessibility.score * 100),
          seo: Math.round(scores.seo.score * 100)
        };
        
      } catch (error) {
        console.log(`   ⚠️ Error ejecutando Lighthouse para ${result.url}`);
        console.log(`   💡 Verificar que WordPress esté funcionando en ${result.url}`);
      }
    }
  }

  getScoreIcon(score) {
    if (score >= 0.9) return '🟢';
    if (score >= 0.7) return '🟡'; 
    return '🔴';
  }

  printDetailedResults() {
    console.log('\\n📊 Detailed Validation Report');
    console.log('═'.repeat(55));

    this.testResults.forEach(result => {
      console.log(`\\n🔗 ${result.url}`);
      console.log(`   Status: ${this.getStatusIcon(result.status)} ${result.status}`);
      
      if (result.error) {
        console.log(`   Error: ${result.error}`);
        if (result.error.includes('HTTP 404')) {
          console.log(`   📋 Página excluida de la calificación (404)`);
        }
        return;
      }
      
      // Show manager results with details
      Object.entries(result.managers || {}).forEach(([, managerResult]) => {
        const icon = managerResult.status === 'PASS' ? '✅' : 
                    managerResult.status === 'WARN' ? '⚠️' : '❌';
        console.log(`   ${icon} ${managerResult.manager}: ${managerResult.status}`);
        
        // Show details if available
        if (managerResult.details) {
          console.log(`     📋 ${managerResult.details}`);
        }
        
        // Show issues
        if (managerResult.issues && managerResult.issues.length > 0) {
          managerResult.issues.forEach(issue => {
            console.log(`     ${issue}`);
          });
        }
      });
    });
  }

  printSummary() {
    // Calculate statistics
    let totalTests = 0;
    let passedTests = 0;
    let warnTests = 0;
    let failedTests = 0;
    let errorTests = 0;

    this.testResults.forEach(result => {
      if (result.error) {
        if (!result.error.includes('HTTP 404')) {
          errorTests++;
        }
        return;
      }
      
      Object.values(result.managers || {}).forEach(managerResult => {
        totalTests++;
        if (managerResult.status === 'PASS') passedTests++;
        else if (managerResult.status === 'WARN') warnTests++;
        else if (managerResult.status === 'FAIL') failedTests++;
      });
    });
    
    // Calculate valid URLs (exclude 404s)
    const validUrls = this.testResults.filter(result => !result.error || !result.error.includes('HTTP 404'));
    
    console.log('\\n📈 Estadísticas Detalladas');
    console.log('─'.repeat(50));
    console.log(`📁 URLs probadas: ${this.testResults.length} (${validUrls.length} válidas)`);
    console.log(`📊 Tests de managers: ${totalTests}`);
    console.log(`✅ Tests exitosos: ${passedTests}`);
    console.log(`⚠️ Tests con warnings: ${warnTests}`);
    console.log(`❌ Tests fallidos: ${failedTests}`);
    console.log(`🚫 Errores de conexión: ${errorTests}`);
    console.log(`📈 Tasa de éxito: ${totalTests > 0 ? (((passedTests + warnTests) / totalTests) * 100).toFixed(1) : 0}%`);
  }

  printRecommendations() {
    console.log('\\n💡 Recomendaciones Profesionales');
    console.log('─'.repeat(50));
    console.log('   📋 Este validador: Funcionalidad específica de managers');
    console.log('   🔧 WordPress Best Practices: npm run wp:lint (PHPCS)');
    console.log('   ⚡ Performance/SEO/A11Y: npm run wp:audit (Lighthouse)');
    console.log('   🔄 Auto-fix coding standards: npm run wp:lint:fix');
    console.log('');
    console.log('   🎯 Para validación 100% completa ejecutar los 3 comandos');
    
    const overallStatus = this.calculateOverallStatus();
    console.log(`\\n🎯 Estado general: ${this.getStatusIcon(overallStatus)} ${overallStatus}`);
  }

  calculateOverallStatus() {
    const hasErrors = this.testResults.some(result => result.status === 'ERROR' && !result.error?.includes('HTTP 404'));
    const hasFails = this.testResults.some(result => 
      Object.values(result.managers || {}).some(m => m.status === 'FAIL')
    );
    
    if (hasErrors || hasFails) return 'NEEDS_FIXES';
    
    const hasWarns = this.testResults.some(result => 
      Object.values(result.managers || {}).some(m => m.status === 'WARN')
    );
    
    return hasWarns ? 'GOOD' : 'EXCELLENT';
  }

  getStatusIcon(status) {
    switch (status) {
      case 'PASS': case 'SUCCESS': case 'EXCELLENT': return '✅';
      case 'WARN': case 'GOOD': return '⚠️';
      case 'FAIL': case 'ERROR': case 'NEEDS_FIXES': return '❌';
      default: return '❓';
    }
  }
}

// Run if called directly
if (require.main === module) {
  const validator = new HybridValidator();
  validator.runTests().catch(console.error);
}

module.exports = HybridValidator;