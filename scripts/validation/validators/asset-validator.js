const ValidatorInterface = require('../core/validator-interface');
const ConfigSingleton = require('../../wp-generator/core/config-singleton');

/**
 * Asset Validator
 *
 * Valida assets y performance:
 * - CSS y JS correctamente enqueued
 * - Design tokens presentes
 * - Lazy loading implementado
 * - Preload de assets críticos
 * - No duplicación de scripts
 */
class AssetValidator extends ValidatorInterface {
  constructor(config = {}) {
    super('Asset Validator', config);
    this.requiredSources = ['html'];
  }

  /**
   * Ejecuta validaciones de assets
   * @param {Object} sources - Fuentes de datos ({ html: string })
   * @param {Object} context - Contexto ({ url?, page?, expectedAssets? })
   */
  async validate(sources, context = {}) {
    // Manejar fuente HTML que puede tener errores
    let html = '';
    if (sources.html) {
      // Si html es un objeto con metadata de error
      if (typeof sources.html === 'object' && sources.html[context.page]) {
        const pageData = sources.html[context.page];
        if (pageData.error) {
          this.assert(false, `No se pudo obtener HTML: ${pageData.error}`, 'error',
            { type: 'html-fetch-error', url: pageData.url });
          return;
        }
        html = pageData.html || '';
      } else if (typeof sources.html === 'string') {
        html = sources.html;
      }
    }

    const { page = 'unknown' } = context;

    console.log(`   📦 Validando assets para ${page}...`);

    // Validaciones básicas de assets
    this.validateBasicAssets(html, context);

    // Validaciones de CSS
    this.validateCSS(html);

    // Validaciones de JavaScript
    this.validateJavaScript(html);

    // Validaciones de design tokens
    this.validateDesignTokens(html);

    // Validaciones de performance
    this.validatePerformance(html);

    // Validaciones de optimización
    this.validateOptimization(html);

    // Validaciones de loading strategies
    this.validateLoadingStrategies(html);
  }

  /**
   * Valida assets básicos
   */
  validateBasicAssets(html, context = {}) {
    const { page = 'unknown', url } = context;
    const location = url ? `${page} (${url})` : page;

    // WordPress debe enqueuear assets correctamente
    this.assert(
      html.includes('wp-content/themes') || html.includes('/assets/'),
      `Assets deben ser enqueued por WordPress o desde directorio assets en ${location}`,
      'error',
      { type: 'asset-enqueue', page, url }
    );

    // Verificar que no hay assets inline innecesarios
    const inlineStyles = (html.match(/<style[^>]*>/g) || []).length;
    this.assert(
      inlineStyles <= 3,
      `Demasiados estilos inline (${inlineStyles}) en ${location}. Considerar consolidar en archivos CSS`,
      'warning',
      { type: 'inline-styles-count', count: inlineStyles, page, url }
    );

    const inlineScripts = (html.match(/<script(?![^>]*src)[^>]*>/g) || []).length;
    this.assert(
      inlineScripts <= 2,
      `Demasiados scripts inline (${inlineScripts}) en ${location}. Considerar archivos externos`,
      'warning',
      { type: 'inline-scripts-count', count: inlineScripts, page, url }
    );
  }

  /**
   * Valida CSS assets
   */
  validateCSS(html) {
    // Design tokens CSS debe estar presente
    this.assert(
      html.includes('design-tokens.css') || html.includes('design-tokens'),
      'Design tokens CSS debe estar cargado',
      'error',
      { type: 'design-tokens-css' }
    );

    // CSS del tema debe estar presente
    const config = ConfigSingleton.getInstance();
    const themeHandle = config.getThemeHandle();
    this.assert(
      html.includes(themeHandle) || html.includes('design-system'),
      'CSS del tema debe estar enqueued',
      'error',
      { type: 'theme-css' }
    );

    // Verificar que CSS esté optimizado
    this.validateCSSOptimization(html);

    // Verificar preload de CSS crítico
    const hasCriticalPreload = html.includes('rel="preload"') && html.includes('as="style"');
    this.assert(
      hasCriticalPreload,
      'CSS crítico debe usar preload para mejor performance',
      'warning',
      { type: 'css-preload' }
    );

    // Verificar que no hay CSS bloqueador innecesario
    this.validateCSSBlocking(html);
  }

  /**
   * Valida JavaScript assets
   */
  validateJavaScript(html) {
    // Detectar si hay JavaScript del tema
    const config = ConfigSingleton.getInstance();
    const themeHandle = config.getThemeHandle();
    const hasThemeJS = html.includes('design-system') || html.includes(themeHandle);

    if (hasThemeJS) {
      // Preferir ES6 modules sobre UMD
      const hasES6 = html.includes('type="module"');
      const hasUMD = html.includes('.umd.js');

      this.assert(
        hasES6 || hasUMD,
        'JavaScript modules (ES6 o UMD) deben estar presentes',
        'error',
        { type: 'js-modules' }
      );

      if (hasES6 && hasUMD) {
        this.assert(
          false,
          'No cargar ES6 y UMD simultáneamente - puede causar conflictos',
          'warning',
          { type: 'dual-js-loading' }
        );
      }

      // ES6 modules preferidos para browsers modernos
      this.assert(
        hasES6,
        'ES6 modules recomendados para mejor performance en browsers modernos',
        'warning',
        { type: 'es6-preferred' }
      );
    }

    // Validar que no hay scripts duplicados
    this.validateScriptDuplication(html);

    // Validar async/defer appropriado
    this.validateScriptLoading(html);
  }

  /**
   * Valida design tokens
   */
  validateDesignTokens(html) {
    // CSS custom properties deben estar definidas
    const hasCustomProps = html.includes('--tl-') || html.includes('var(--');
    this.assert(
      hasCustomProps,
      'Design tokens (CSS custom properties) deben estar en uso',
      'error',
      { type: 'design-tokens-usage' }
    );

    // Verificar tokens específicos importantes
    const importantTokens = [
      '--tl-primary',
      '--tl-font-primary',
      '--tl-spacing',
      '--tl-color'
    ];

    importantTokens.forEach(token => {
      this.assert(
        html.includes(token),
        `Token importante '${token}' debe estar en uso`,
        'warning',
        { type: 'important-token', token }
      );
    });

    // Verificar que no hay valores hardcoded comunes
    this.validateHardcodedValues(html);
  }

  /**
   * Valida performance de assets
   */
  validatePerformance(html) {
    // Lazy loading para imágenes
    const images = html.match(/<img[^>]*>/g) || [];
    const lazyImages = images.filter(img => img.includes('loading="lazy"'));

    if (images.length > 0) {
      const lazyPercentage = (lazyImages.length / images.length) * 100;
      this.assert(
        lazyPercentage >= 80,
        `Solo ${lazyPercentage.toFixed(1)}% de imágenes usan lazy loading (recomendado: ≥80%)`,
        'warning',
        {
          type: 'lazy-loading-percentage',
          total: images.length,
          lazy: lazyImages.length,
          percentage: lazyPercentage
        }
      );
    }

    // Preload de assets críticos
    this.validateCriticalResourcePreload(html);

    // Compression hints
    this.validateCompressionHints(html);
  }

  /**
   * Valida optimización de assets
   */
  validateOptimization(html) {
    // Verificar que assets tienen hash para cache busting
    this.validateCacheBusting(html);

    // Verificar minificación en producción
    if (this.config.environment === 'production') {
      this.validateMinification(html);
    }

    // Verificar que no hay assets de desarrollo
    this.validateDevAssets(html);

    // Verificar tree shaking efectivo
    this.validateTreeShaking(html);
  }

  /**
   * Valida estrategias de loading
   */
  validateLoadingStrategies(html) {
    // Critical CSS inline para above-the-fold
    this.validateCriticalCSS(html);

    // Non-critical CSS deferred
    this.validateDeferredCSS(html);

    // JavaScript non-blocking
    this.validateNonBlockingJS(html);

    // Resource hints
    this.validateResourceHints(html);
  }

  /**
   * Valida optimización de CSS
   */
  validateCSSOptimization(html) {
    // CSS debe estar minificado en producción
    if (this.config.environment === 'production') {
      const cssLinks = html.match(/<link[^>]*\.css[^>]*>/g) || [];
      cssLinks.forEach((link, index) => {
        const isMinified = link.includes('.min.css') ||
                          link.includes('?ver=') ||
                          /\-[a-f0-9]{8}\.css/.test(link);

        this.assert(
          isMinified,
          `CSS link ${index + 1} debe estar minificado/versionado en producción`,
          'warning',
          { type: 'css-minification', link }
        );
      });
    }

    // Verificar que no hay CSS no utilizado
    this.validateUnusedCSS(html);
  }

  /**
   * Valida blocking de CSS
   */
  validateCSSBlocking(html) {
    const cssLinks = html.match(/<link[^>]*rel="stylesheet"[^>]*>/g) || [];

    // CSS above-the-fold debe ser inline o preloaded
    if (cssLinks.length > 3) {
      this.assert(
        false,
        `Muchos CSS externos (${cssLinks.length}) pueden bloquear rendering`,
        'warning',
        { type: 'css-blocking', count: cssLinks.length }
      );
    }

    // Verificar media queries para CSS no crítico
    cssLinks.forEach((link, index) => {
      if (!link.includes('media=') && !link.includes('critical')) {
        this.assert(
          false,
          `CSS link ${index + 1} sin media query puede bloquear rendering`,
          'warning',
          { type: 'css-no-media', link }
        );
      }
    });
  }

  /**
   * Valida duplicación de scripts
   */
  validateScriptDuplication(html) {
    const scripts = html.match(/<script[^>]*src="[^"]*"[^>]*>/g) || [];
    const scriptSrcs = scripts.map(script => {
      const match = script.match(/src="([^"]*)"/);
      return match ? match[1] : null;
    }).filter(Boolean);

    // Detectar scripts duplicados
    const duplicates = scriptSrcs.filter((src, index) =>
      scriptSrcs.indexOf(src) !== index
    );

    duplicates.forEach(duplicateSrc => {
      this.assert(
        false,
        `Script duplicado detectado: ${duplicateSrc}`,
        'error',
        { type: 'script-duplication', src: duplicateSrc }
      );
    });

    // Verificar scripts del tema específicamente
    const config = ConfigSingleton.getInstance();
    const themeHandle = config.getThemeHandle();
    const themeScripts = scriptSrcs.filter(src =>
      src.includes('design-system') || src.includes(themeHandle)
    );

    this.assert(
      themeScripts.length <= 1,
      `Múltiples scripts del tema detectados (${themeScripts.length}) - puede causar conflictos`,
      'warning',
      { type: 'theme-script-multiple', scripts: themeScripts }
    );
  }

  /**
   * Valida loading de scripts
   */
  validateScriptLoading(html) {
    const scripts = html.match(/<script[^>]*>/g) || [];

    scripts.forEach((script, index) => {
      const hasAsync = script.includes('async');
      const hasDefer = script.includes('defer');
      const hasModule = script.includes('type="module"');
      const isInline = !script.includes('src=');

      if (!isInline && !hasAsync && !hasDefer && !hasModule) {
        this.assert(
          false,
          `Script ${index + 1} debe usar async, defer, o type="module" para no bloquear`,
          'warning',
          { type: 'script-blocking', script }
        );
      }
    });
  }

  /**
   * Valida valores hardcoded
   */
  validateHardcodedValues(html) {
    const hardcodedPatterns = [
      { pattern: /#[0-9a-f]{6}/gi, type: 'color', message: 'Colores hardcoded - usar design tokens' },
      { pattern: /font-family:\s*["'][^"']*["']/gi, type: 'font', message: 'Fonts hardcoded - usar design tokens' },
      { pattern: /\d+px(?!\s*;?\s*\/\*)/g, type: 'spacing', message: 'Spacing hardcoded - usar design tokens' },
      { pattern: /border-radius:\s*\d+px/gi, type: 'radius', message: 'Border radius hardcoded - usar design tokens' }
    ];

    hardcodedPatterns.forEach(({ pattern, type, message }) => {
      const matches = html.match(pattern);
      if (matches && matches.length > 5) { // Tolerancia para algunos casos
        this.assert(
          false,
          `${message} (${matches.length} ocurrencias)`,
          'warning',
          { type: 'hardcoded-values', valueType: type, count: matches.length }
        );
      }
    });
  }

  /**
   * Valida preload de recursos críticos
   */
  validateCriticalResourcePreload(html) {
    // Fonts deben usar preload
    const hasFontPreload = html.includes('rel="preload"') && html.includes('as="font"');
    this.assert(
      hasFontPreload,
      'Fonts críticas deben usar preload para evitar FOIT/FOUT',
      'warning',
      { type: 'font-preload' }
    );

    // CSS crítico debe usar preload
    const hasCSSPreload = html.includes('rel="preload"') && html.includes('as="style"');
    this.assert(
      hasCSSPreload,
      'CSS crítico debe usar preload',
      'warning',
      { type: 'css-preload' }
    );
  }

  /**
   * Valida hints de compresión
   */
  validateCompressionHints(html) {
    // Verificar que assets pueden ser comprimidos
    const largeAssets = html.match(/\.(js|css)[^"]*"/g) || [];

    if (largeAssets.length > 0) {
      this.assert(
        html.includes('Accept-Encoding') || html.includes('gzip') || html.includes('br'),
        'Assets grandes deben usar compresión (gzip/brotli)',
        'warning',
        { type: 'compression-hint' }
      );
    }
  }

  /**
   * Valida cache busting
   */
  validateCacheBusting(html) {
    const assets = html.match(/<(?:link|script)[^>]*(?:href|src)="[^"]*\.(css|js)[^"]*"/g) || [];

    assets.forEach((asset, index) => {
      const hasVersion = asset.includes('?ver=') ||
                        asset.includes('?v=') ||
                        /\-[a-f0-9]{8,}\.(css|js)/.test(asset);

      this.assert(
        hasVersion,
        `Asset ${index + 1} debe tener versioning para cache busting`,
        'warning',
        { type: 'cache-busting', asset }
      );
    });
  }

  /**
   * Valida minificación
   */
  validateMinification(html) {
    // Verificar que HTML está minificado
    const hasExcessWhitespace = /\n\s+\n/.test(html);
    this.assert(
      !hasExcessWhitespace,
      'HTML debe estar minificado en producción',
      'warning',
      { type: 'html-minification' }
    );

    // Verificar assets minificados
    const assets = html.match(/\.(css|js)[^"']*/g) || [];
    const minifiedAssets = assets.filter(asset =>
      asset.includes('.min.') || /\-[a-f0-9]{8}\.(css|js)/.test(asset)
    );

    const minificationRate = assets.length > 0 ? (minifiedAssets.length / assets.length) * 100 : 100;
    this.assert(
      minificationRate >= 80,
      `Solo ${minificationRate.toFixed(1)}% de assets están minificados (recomendado: ≥80%)`,
      'warning',
      { type: 'asset-minification', rate: minificationRate }
    );
  }

  /**
   * Valida que no hay assets de desarrollo
   */
  validateDevAssets(html) {
    const devPatterns = [
      { pattern: 'localhost', level: 'warning', message: 'URL localhost detectada - normal en desarrollo' },
      { pattern: '.dev.', level: 'error', message: 'Asset .dev. detectado' },
      { pattern: 'development', level: 'error', message: 'Asset development detectado' },
      { pattern: 'debug', level: 'warning', message: 'Asset debug detectado - eliminar en producción' },
      { pattern: 'unminified', level: 'error', message: 'Asset unminified detectado' },
      { pattern: 'source-map', level: 'warning', message: 'Source maps detectados - eliminar en producción' }
    ];

    devPatterns.forEach(({ pattern, level, message }) => {
      if (html.includes(pattern)) {
        this.assert(
          false,
          message,
          level,
          { type: 'dev-asset', pattern }
        );
      }
    });
  }

  /**
   * Valida tree shaking efectivo
   */
  validateTreeShaking(html) {
    // Verificar que no hay imports no utilizados evidentes
    const unusedImports = [
      'lodash',
      'jquery', // Si no se usa
      'bootstrap', // Si no se usa
      'moment' // Si se puede usar date-fns
    ];

    unusedImports.forEach(lib => {
      if (html.includes(lib)) {
        this.assert(
          false,
          `Librería ${lib} detectada - verificar si es necesaria (tree shaking)`,
          'warning',
          { type: 'potential-unused-import', library: lib }
        );
      }
    });
  }

  /**
   * Valida CSS crítico
   */
  validateCriticalCSS(html) {
    // Debe haber algo de CSS inline para above-the-fold
    const hasInlineCSS = html.includes('<style');

    if (hasInlineCSS) {
      this.assert(
        true,
        'CSS crítico inline presente para above-the-fold',
        'passed',
        { type: 'critical-css' }
      );
    } else {
      this.assert(
        false,
        'Considerar CSS crítico inline para above-the-fold',
        'warning',
        { type: 'missing-critical-css' }
      );
    }
  }

  /**
   * Valida CSS diferido
   */
  validateDeferredCSS(html) {
    // CSS no crítico debe cargarse diferido
    const cssLinks = html.match(/<link[^>]*rel="stylesheet"[^>]*>/g) || [];
    const deferredCSS = cssLinks.filter(link =>
      link.includes('media="print"') ||
      link.includes('onload=') ||
      link.includes('rel="preload"')
    );

    if (cssLinks.length > 2) {
      this.assert(
        deferredCSS.length > 0,
        'CSS no crítico debe cargarse diferido para mejor performance',
        'warning',
        { type: 'deferred-css' }
      );
    }
  }

  /**
   * Valida JavaScript no bloqueante
   */
  validateNonBlockingJS(html) {
    const scriptTags = html.match(/<script[^>]*>/g) || [];
    const blockingScripts = scriptTags.filter(script =>
      script.includes('src=') &&
      !script.includes('async') &&
      !script.includes('defer') &&
      !script.includes('type="module"')
    );

    this.assert(
      blockingScripts.length === 0,
      `${blockingScripts.length} scripts bloqueantes detectados`,
      'warning',
      { type: 'blocking-scripts', count: blockingScripts.length }
    );
  }

  /**
   * Valida resource hints
   */
  validateResourceHints(html) {
    // DNS prefetch para dominios externos
    const externalDomains = this.extractExternalDomains(html);
    const hasDNSPrefetch = html.includes('rel="dns-prefetch"');

    if (externalDomains.length > 0) {
      this.assert(
        hasDNSPrefetch,
        'DNS prefetch recomendado para dominios externos',
        'warning',
        { type: 'dns-prefetch', domains: externalDomains }
      );
    }

    // Preconnect para recursos críticos externos
    const hasPreconnect = html.includes('rel="preconnect"');
    if (externalDomains.length > 0) {
      this.assert(
        hasPreconnect,
        'Preconnect recomendado para recursos críticos externos',
        'warning',
        { type: 'preconnect' }
      );
    }
  }

  /**
   * Valida CSS no utilizado
   */
  validateUnusedCSS(html) {
    // Esta es una validación básica - en producción se usaría PurgeCSS
    const inlineStyles = html.match(/<style[^>]*>([\s\S]*?)<\/style>/g) || [];

    inlineStyles.forEach((styleBlock, index) => {
      const css = styleBlock.replace(/<\/?style[^>]*>/g, '');
      const selectors = css.match(/\.[a-zA-Z][a-zA-Z0-9_-]*(?=\s*[{,])/g) || [];

      const unusedSelectors = selectors.filter(selector => {
        const className = selector.substring(1); // Remove the dot
        return !html.includes(`class="${className}"`) &&
               !html.includes(`class='${className}'`) &&
               !html.includes(`class="*${className}*"`);
      });

      if (unusedSelectors.length > 0) {
        this.assert(
          false,
          `Style block ${index + 1} tiene selectores posiblemente no utilizados: ${unusedSelectors.join(', ')}`,
          'warning',
          { type: 'unused-css', selectors: unusedSelectors, block: index + 1 }
        );
      }
    });
  }

  /**
   * Extrae dominios externos del HTML
   */
  extractExternalDomains(html) {
    const urlPattern = /https?:\/\/([^\/\s"']+)/g;
    const matches = html.match(urlPattern) || [];
    const domains = new Set();

    matches.forEach(url => {
      try {
        const domain = new URL(url).hostname;
        if (!domain.includes('localhost') && !domain.includes('127.0.0.1')) {
          domains.add(domain);
        }
      } catch (error) {
        // Ignorar URLs malformadas
      }
    });

    return Array.from(domains);
  }
}

module.exports = AssetValidator;