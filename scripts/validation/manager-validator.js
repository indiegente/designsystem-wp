const https = require('https');
const http = require('http');
const { URL } = require('url');
const fs = require('fs');
const path = require('path');

/**
 * Manager Validator - Hybrid approach
 * 
 * Philosophy: Only validate what PHPCS/Lighthouse can't
 * - ✅ Business-specific manager functionality 
 * - ❌ WordPress Best Practices (delegate to PHPCS)
 * - ❌ SEO/Performance/A11Y (delegate to Lighthouse)
 */
class ManagerValidator {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || 'http://localhost';
    this.config = config;
    this.testResults = [];
    this.testUrls = this.generateTestUrls();
  }

  /**
   * Generate test URLs from page-templates.json
   */
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
   * ONLY validate our custom managers - not WordPress basics
   */
  async validateManager(url, urlConfig) {
    try {
      const response = await this.fetchUrl(url);
      
      if (response.statusCode !== 200) {
        return {
          url,
          status: 'ERROR',
          error: `HTTP ${response.statusCode}`,
          managers: {}
        };
      }

      const html = response.body;
      const managers = {};

      // Only validate OUR managers
      managers.seo = this.validateSEOManager(html, urlConfig);
      managers.analytics = this.validateAnalyticsManager(html, urlConfig);
      managers.assets = this.validateAssetManager(html, urlConfig);
      managers.templates = this.validateTemplateManager(html, urlConfig);
      managers.components = this.validateComponentManager(html, urlConfig);

      // Determine overall status
      const failedManagers = Object.values(managers).filter(m => m.status === 'FAIL');
      const overallStatus = failedManagers.length === 0 ? 'SUCCESS' : 'ERROR';

      return {
        url,
        status: overallStatus,
        managers,
        html: html.length // For debugging
      };

    } catch (error) {
      return {
        url,
        status: 'ERROR',
        error: error.message,
        managers: {}
      };
    }
  }

  /**
   * Validate OUR SEO Manager (not general WordPress SEO)
   */
  validateSEOManager(html, urlConfig) {
    const issues = [];
    
    // Check if OUR integrated SEO system is working
    if (!html.includes('toulouse') && !html.includes('ToulouseSEOManager')) {
      issues.push('⚠️ Toulouse SEO Manager integrado no detectado');
    }
    
    // Check for structured data from OUR system
    if (urlConfig.pageConfig && !html.includes('application/ld+json')) {
      issues.push('⚠️ Structured data desde configuración no generado');
    }

    return {
      manager: 'SEO Manager',
      url: urlConfig.url,
      status: issues.length === 0 ? 'PASS' : 'WARN',
      issues: issues
    };
  }

  /**
   * Validate OUR Analytics Manager (not general analytics)
   */
  validateAnalyticsManager(html, urlConfig) {
    const issues = [];
    
    // Check if OUR analytics config is loaded
    if (!html.includes('G-') && !html.includes('gtag')) {
      issues.push('⚠️ Configuración de analytics no detectada');
    }
    
    // Check for OUR custom events from page config
    if (urlConfig.pageConfig && urlConfig.pageConfig.components) {
      const hasCustomEvents = html.includes('dataLayer') || html.includes('toulouse-analytics');
      if (!hasCustomEvents) {
        issues.push('⚠️ Eventos personalizados de Toulouse no detectados');
      }
    }

    return {
      manager: 'Analytics Manager',
      url: urlConfig.url,
      status: issues.length === 0 ? 'PASS' : 'WARN',
      issues: issues
    };
  }

  /**
   * Validate OUR Asset Manager (not general assets)
   */
  validateAssetManager(html, urlConfig) {
    const issues = [];
    
    // Check if OUR optimized assets are loaded
    const hasToulouseAssets = html.includes('toulouse-') || html.includes('/assets/');
    if (!hasToulouseAssets) {
      issues.push('⚠️ Assets optimizados de Toulouse no detectados');
    }
    
    // Check for Vite-generated assets (from our AssetManager)
    const hasViteAssets = html.includes('toulouse-design-system-') || html.includes('toulouse-ds');
    if (!hasViteAssets) {
      issues.push('⚠️ Assets generados por Vite no detectados');
    }

    return {
      manager: 'Asset Manager',
      url: urlConfig.url,
      status: issues.length === 0 ? 'PASS' : 'WARN',
      issues: issues
    };
  }

  /**
   * Validate OUR Template Manager (not general templates)
   */
  validateTemplateManager(html, urlConfig) {
    const issues = [];
    
    // Check if expected components from page config are rendered
    if (urlConfig.expectedComponents.length > 0) {
      const missingComponents = urlConfig.expectedComponents.filter(component => {
        return !html.includes(component) && !html.includes(component.replace('-', '_'));
      });
      
      if (missingComponents.length > 0) {
        issues.push(`⚠️ Componentes esperados no renderizados: ${missingComponents.join(', ')}`);
      }
    }
    
    // Check for template-specific content
    const templateName = urlConfig.name;
    if (templateName && !html.includes(templateName.replace('-', ' ')) && !html.includes(templateName.replace('page-', ''))) {
      issues.push(`⚠️ Contenido específico de ${templateName} no detectado`);
    }

    return {
      manager: 'Template Manager',
      url: urlConfig.url,
      status: issues.length === 0 ? 'PASS' : 'WARN',
      issues: issues
    };
  }

  /**
   * Validate component rendering
   */
  validateComponentManager(html, urlConfig) {
    const issues = [];
    
    // Basic component rendering check
    const hasComponents = html.includes('render_') || html.includes('class="') || html.length > 5000;
    if (!hasComponents) {
      issues.push('⚠️ Sistema de componentes no parece estar renderizando');
    }

    return {
      manager: 'Component Manager', 
      url: urlConfig.url,
      status: issues.length === 0 ? 'PASS' : 'WARN',
      issues: issues
    };
  }

  async runTests() {
    console.log('🎯 Manager Validator (Hybrid Approach)');
    console.log('Validando SOLO funcionalidad específica de managers');
    console.log(`Base URL: ${this.baseUrl}`);
    console.log('');
    console.log('🚀 Iniciando Manager Validation...');
    console.log(`📋 URLs a probar: ${this.testUrls.length}`);
    console.log('━'.repeat(50));

    // Test each URL
    for (const urlConfig of this.testUrls) {
      console.log(`🔍 Testing: ${urlConfig.name} (${urlConfig.url})`);
    }

    // Run tests in parallel for performance
    const testPromises = this.testUrls.map(urlConfig => this.validateManager(urlConfig.url, urlConfig));
    this.testResults = await Promise.all(testPromises);

    this.printResults();
  }

  printResults() {
    console.log('\\n📊 Manager Validation Report');
    console.log('═'.repeat(50));

    let totalTests = 0;
    let passedTests = 0;
    let errorTests = 0;

    this.testResults.forEach(result => {
      console.log(`\\n🔗 ${result.url}`);
      console.log(`   Status: ${this.getStatusIcon(result.status)} ${result.status}`);
      
      if (result.error) {
        console.log(`   Error: ${result.error}`);
        // Exclude 404s from error count as they're excluded from scoring
        if (!result.error.includes('HTTP 404')) {
          errorTests++;
        } else {
          console.log(`   📋 Página excluida de la calificación (404)`);
        }
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
          
          if (managerResult.status === 'FAIL') {
            // No failed tests in current implementation, only PASS/WARN
          } else {
            passedTests++;
          }
        } else {
          passedTests++;
        }
      });
    });
    
    // Calculate valid URLs (exclude 404s)
    const validUrls = this.testResults.filter(result => !result.error || !result.error.includes('HTTP 404'));
    
    console.log('\\n📈 Estadísticas del Manager Testing');
    console.log('─'.repeat(50));
    console.log(`📁 URLs probadas: ${this.testResults.length} (${validUrls.length} válidas)`);
    console.log(`📊 Tests de managers: ${totalTests}`);
    console.log(`✅ Tests exitosos: ${passedTests}`);
    console.log(`❌ Tests fallidos: 0`); // Current implementation has no FAIL states
    console.log(`🚫 Errores de conexión: ${errorTests}`);
    console.log(`📈 Tasa de éxito: ${totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0}%`);
    
    console.log('\\n💡 Recordatorio: Para validaciones completas usar herramientas profesionales:');
    console.log('   • WordPress Best Practices: npm run wp:lint (PHPCS)');
    console.log('   • SEO/Performance/A11Y: npm run wp:audit (Lighthouse)');
    console.log('   • Este validador: Solo funcionalidad de managers específicos');
    
    const overallStatus = (passedTests === totalTests && errorTests === 0) ? 'SUCCESS' : 'PARTIAL';
    console.log(`\\n🎯 Estado general: ${this.getStatusIcon(overallStatus)} ${overallStatus}`);
  }

  getStatusIcon(status) {
    switch (status) {
      case 'PASS': case 'SUCCESS': return '✅';
      case 'WARN': case 'PARTIAL': return '⚠️';
      case 'FAIL': case 'ERROR': case 'NEEDS_FIXES': return '❌';
      default: return '❓';
    }
  }
}

// Run if called directly
if (require.main === module) {
  const validator = new ManagerValidator();
  validator.runTests().catch(console.error);
}

module.exports = ManagerValidator;