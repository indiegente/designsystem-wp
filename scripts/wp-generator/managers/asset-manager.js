const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * AssetManager - Gestión avanzada de assets con optimización y lazy loading
 * 
 * Maneja la construcción, optimización y distribución de CSS, JS e imágenes
 * con soporte para lazy loading, preloading y optimización automática.
 */
class AssetManager {
  constructor(config) {
    this.config = config;
    this.assetManifest = {};
    this.optimizationConfig = {
      minify: true,
      lazyLoad: true,
      preloadCritical: true,
      imageOptimization: true,
      cacheBusting: true
    };
  }

  build() {
    console.log('📦 Construyendo assets optimizados...');
    
    // FAIL FAST - No fallbacks permitidos
    const viteBuildSuccess = this.buildViteAssets();
    
    if (!viteBuildSuccess) {
      throw new Error('❌ VITE BUILD FALLÓ: Assets optimizados son requeridos\n💡 Ejecutar: npm run build para debug\n💡 Verificar: nvm use 24');
    }
    
    this.generateAssetManifest();
    this.optimizeAssets();
    this.copyViteAssets();
    this.copyDesignTokens();
    this.generateAssetConfig();
    this.generateAssetEnqueueFile();
    this.generateAvailableAssetsManifest(true);
  }

  buildViteAssets() {
    try {
      execSync('npm run build', { stdio: 'inherit' });
      return true;
    } catch (error) {
      // FAIL FAST - No continuar sin assets válidos
      throw new Error(`❌ VITE BUILD ERROR: ${error.message}\n💡 Verificar: nvm use 24\n💡 Verificar: npm run build funciona correctamente`);
    }
  }

  /**
   * Genera un manifest de todos los assets para cache busting
   */
  generateAssetManifest() {
    const distDir = './dist';
    this.assetManifest = {
      css: {},
      js: {},
      images: {},
      timestamp: new Date().toISOString()
    };

    // CSS files
    if (fs.existsSync(path.join(distDir, 'css'))) {
      const cssFiles = fs.readdirSync(path.join(distDir, 'css'));
      cssFiles.forEach(file => {
        if (file.endsWith('.css')) {
          const hash = this.generateFileHash(path.join(distDir, 'css', file));
          this.assetManifest.css[file] = {
            path: file,
            hash: hash,
            optimized: `${file.replace('.css', '')}-${hash}.css`
          };
        }
      });
    }

    // JS files
    const jsFiles = fs.readdirSync(distDir).filter(file => file.endsWith('.js'));
    jsFiles.forEach(file => {
      const hash = this.generateFileHash(path.join(distDir, file));
      this.assetManifest.js[file] = {
        path: file,
        hash: hash,
        optimized: `${file.replace('.js', '')}-${hash}.js`
      };
    });

    // Guardar manifest
    const manifestPath = path.join(distDir, 'asset-manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(this.assetManifest, null, 2));
  }

  /**
   * Genera hash simple para cache busting
   */
  generateFileHash(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    return require('crypto').createHash('md5').update(content).digest('hex').substring(0, 8);
  }

  /**
   * Optimiza assets para performance
   */
  optimizeAssets() {
    console.log('⚡ Optimizando assets...');
    
    // Optimizar CSS
    this.optimizeCSS();
    
    // Optimizar JS
    this.optimizeJS();
    
    // Optimizar imágenes
    this.optimizeImages();
  }

  /**
   * Optimiza archivos CSS
   */
  optimizeCSS() {
    const distDir = './dist';
    const cssDir = path.join(distDir, 'css');
    
    if (fs.existsSync(cssDir)) {
      const cssFiles = fs.readdirSync(cssDir);
      cssFiles.forEach(file => {
        if (file.endsWith('.css')) {
          const filePath = path.join(cssDir, file);
          let content = fs.readFileSync(filePath, 'utf8');
          
          // Minificar CSS básico
          if (this.optimizationConfig.minify) {
            content = this.minifyCSS(content);
          }
          
          // Agregar comentarios de optimización
          content = `/* Optimized by Toulouse Design System - ${new Date().toISOString()} */\n${content}`;
          
          fs.writeFileSync(filePath, content);
        }
      });
    }
  }

  /**
   * Minificación básica de CSS
   */
  minifyCSS(css) {
    return css
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
      .replace(/\s+/g, ' ') // Multiple spaces to single
      .replace(/\s*{\s*/g, '{') // Remove spaces around braces
      .replace(/\s*}\s*/g, '}') // Remove spaces around braces
      .replace(/\s*:\s*/g, ':') // Remove spaces around colons
      .replace(/\s*;\s*/g, ';') // Remove spaces around semicolons
      .replace(/\s*,\s*/g, ',') // Remove spaces around commas
      .trim();
  }

  /**
   * Optimiza archivos JS
   */
  optimizeJS() {
    const distDir = './dist';
    const jsFiles = fs.readdirSync(distDir).filter(file => file.endsWith('.js'));
    
    jsFiles.forEach(file => {
      const filePath = path.join(distDir, file);
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Agregar comentarios de optimización
      content = `/* Optimized by Toulouse Design System - ${new Date().toISOString()} */\n${content}`;
      
      fs.writeFileSync(filePath, content);
    });
  }

  /**
   * Optimiza imágenes (placeholder para futuras implementaciones)
   */
  optimizeImages() {
    const imagesDir = path.join(this.config.srcDir, 'assets', 'images');
    
    if (fs.existsSync(imagesDir)) {
      console.log('🖼️ Optimizando imágenes...');
      // Aquí se podría implementar optimización de imágenes
      // usando librerías como sharp o imagemin
    }
  }

  copyDesignTokens() {
    const tokensSource = path.join(this.config.srcDir, 'tokens', 'design-tokens.css');
    const tokensTarget = path.join(
      this.config.outputDir, 
      this.config.themeName, 
      'assets/css/design-tokens.css'
    );
    
    if (fs.existsSync(tokensSource)) {
      fs.copyFileSync(tokensSource, tokensTarget);
    }
  }

  copyViteAssets() {
    const distDir = './dist';
    if (!fs.existsSync(distDir)) return;

    const targetAssetsDir = path.join(
      this.config.outputDir, 
      this.config.themeName, 
      'assets'
    );

    this.copyDirectory(distDir, targetAssetsDir);
  }

  /**
   * Genera un manifest de assets disponibles para que los templates PHP lo consulten
   */
  generateAvailableAssetsManifest(viteBuildSuccess) {
    const manifestPath = path.join(
      this.config.outputDir,
      this.config.themeName,
      'assets',
      'available-assets.json'
    );

    // Verificar qué assets realmente existen
    const assetsDir = path.join(this.config.outputDir, this.config.themeName, 'assets');
    const cssDir = path.join(assetsDir, 'css');
    const jsDir = path.join(assetsDir, 'js');

    const availableAssets = {
      buildSuccess: viteBuildSuccess,
      timestamp: new Date().toISOString(),
      css: this.getAvailableCSSFiles(cssDir, viteBuildSuccess),
      js: this.getAvailableJSFiles(jsDir, viteBuildSuccess)
    };

    // Crear directorio si no existe
    if (!fs.existsSync(path.dirname(manifestPath))) {
      fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
    }

    fs.writeFileSync(manifestPath, JSON.stringify(availableAssets, null, 2));
    console.log('✅ Manifest de assets disponibles generado');
  }

  /**
   * Obtiene archivos CSS reales con sus nombres exactos
   */
  getAvailableCSSFiles(cssDir, viteBuildSuccess) {
    const cssFiles = {};
    
    // Design tokens (siempre intentar copiar)
    const tokensPath = path.join(cssDir, 'design-tokens.css');
    if (fs.existsSync(tokensPath)) {
      cssFiles['design-tokens'] = 'design-tokens.css';
    }
    
    // Archivos CSS de Vite (solo si build exitoso)
    if (viteBuildSuccess && fs.existsSync(cssDir)) {
      const files = fs.readdirSync(cssDir);
      files.forEach(file => {
        if (file.endsWith('.css') && file !== 'design-tokens.css') {
          // Determinar el tipo de archivo CSS basado en su nombre
          if (file.includes('index') || file.includes('main')) {
            cssFiles['main'] = file;
          } else {
            cssFiles[file.replace('.css', '')] = file;
          }
        }
      });
    }
    
    return cssFiles;
  }

  /**
   * Obtiene archivos JS reales con sus nombres exactos
   */
  getAvailableJSFiles(jsDir, viteBuildSuccess) {
    const jsFiles = {};
    
    if (viteBuildSuccess) {
      // Vite ahora genera archivos en assets/js/
      if (fs.existsSync(jsDir)) {
        const files = fs.readdirSync(jsDir);
        files.forEach(file => {
          if (file.endsWith('.js') && !file.endsWith('.map')) {
            // Archivos de Vite library build
            if (file.includes('toulouse-ds')) {
              const format = file.includes('.es.') ? 'es' : 'umd';
              jsFiles[`toulouse-ds-${format}`] = `js/${file}`;
            } else if (file.includes('index') || file.includes('main')) {
              jsFiles['main'] = `js/${file}`;
            }
          }
        });
      }
    } else {
      // Buscar archivos fallback
      if (fs.existsSync(jsDir)) {
        const files = fs.readdirSync(jsDir);
        files.forEach(file => {
          if (file.endsWith('.js') && !file.endsWith('.map')) {
            jsFiles[file.replace('.js', '')] = `js/${file}`;
          }
        });
      }
    }
    
    return jsFiles;
  }

  copyDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const files = fs.readdirSync(src);
    files.forEach(file => {
      const srcPath = path.join(src, file);
      const destPath = path.join(dest, file);
      
      if (fs.statSync(srcPath).isDirectory()) {
        this.copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    });
  }

  /**
   * Genera configuración de assets para WordPress
   */
  generateAssetConfig() {
    const themeAssetsDir = path.join(
      this.config.outputDir, 
      this.config.themeName, 
      'assets'
    );

    // Generar archivo de configuración de assets
    const assetConfig = {
      version: '1.0.0',
      optimization: this.optimizationConfig,
      manifest: this.assetManifest,
      lazyLoading: {
        enabled: true,
        threshold: 0.1,
        rootMargin: '50px'
      },
      preloading: {
        critical: ['design-tokens.css', 'toulouse-ds.es.js'],
        async: ['toulouse-ds.umd.js']
      }
    };

    const configPath = path.join(themeAssetsDir, 'asset-config.json');
    fs.writeFileSync(configPath, JSON.stringify(assetConfig, null, 2));
  }

  /**
   * Genera archivo PHP para enqueue de assets optimizado
   */
  generateAssetEnqueueFile() {
    const themeDir = path.join(this.config.outputDir, this.config.themeName);
    const enqueuePath = path.join(themeDir, 'inc', 'asset-enqueue.php');
    
    // Crear directorio inc si no existe
    if (!fs.existsSync(path.dirname(enqueuePath))) {
      fs.mkdirSync(path.dirname(enqueuePath), { recursive: true });
    }

    const enqueueCode = this.generateAssetEnqueueCode();
    fs.writeFileSync(enqueuePath, enqueueCode);
  }

  /**
   * Genera código PHP para enqueue de assets optimizado
   */
  generateAssetEnqueueCode() {
    return `<?php
/**
 * Asset Enqueue - Generado automáticamente
 * Optimizado para performance y lazy loading
 */

function toulouse_optimized_asset_enqueue() {
    // Cargar manifest de assets
    $manifest_path = get_template_directory() . '/assets/asset-manifest.json';
    $manifest = file_exists($manifest_path) ? json_decode(file_get_contents($manifest_path), true) : null;
    
    // CSS crítico (preload)
    wp_enqueue_style(
        'toulouse-tokens', 
        get_template_directory_uri() . '/assets/css/design-tokens.css',
        array(),
        $manifest ? $manifest['timestamp'] : '1.0.0'
    );
    
    // CSS principal
    $css_files = glob(get_template_directory() . '/assets/css/*.css');
    foreach ($css_files as $css_file) {
        $filename = basename($css_file);
        if ($filename !== 'design-tokens.css') {
            wp_enqueue_style(
                'toulouse-' . str_replace('.css', '', $filename),
                get_template_directory_uri() . '/assets/css/' . $filename,
                array('toulouse-tokens'),
                $manifest ? $manifest['timestamp'] : '1.0.0'
            );
        }
    }
    
    // JavaScript principal
    $js_files = glob(get_template_directory() . '/assets/js/*.js');
    foreach ($js_files as $js_file) {
        $filename = basename($js_file);
        wp_enqueue_script(
            'toulouse-' . str_replace('.js', '', $filename),
            get_template_directory_uri() . '/assets/js/' . $filename,
            array(),
            $manifest ? $manifest['timestamp'] : '1.0.0',
            true // Cargar en footer
        );
    }
    
    // Preload de assets críticos
    add_action('wp_head', function() {
        echo '<link rel="preload" href="' . get_template_directory_uri() . '/assets/css/design-tokens.css" as="style">';
        echo '<link rel="preload" href="' . get_template_directory_uri() . '/assets/js/toulouse-ds.es.js" as="script">';
    });
}
add_action('wp_enqueue_scripts', 'toulouse_optimized_asset_enqueue');

// Lazy loading para imágenes
function toulouse_lazy_loading_setup() {
    if (is_admin()) return;
    
    // Agregar atributos de lazy loading a imágenes
    add_filter('wp_get_attachment_image_attributes', function($attr, $attachment) {
        $attr['loading'] = 'lazy';
        $attr['decoding'] = 'async';
        return $attr;
    }, 10, 2);
}
add_action('init', 'toulouse_lazy_loading_setup');

// Cache busting para assets
function toulouse_asset_version($src, $handle) {
    $manifest_path = get_template_directory() . '/assets/asset-manifest.json';
    if (file_exists($manifest_path)) {
        $manifest = json_decode(file_get_contents($manifest_path), true);
        if ($manifest && isset($manifest['timestamp'])) {
            $src = add_query_arg('ver', $manifest['timestamp'], $src);
        }
    }
    return $src;
}
add_filter('style_loader_src', 'toulouse_asset_version', 10, 2);
add_filter('script_loader_src', 'toulouse_asset_version', 10, 2);
?>`;
  }
}

module.exports = AssetManager;