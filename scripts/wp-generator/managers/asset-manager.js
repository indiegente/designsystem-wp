const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * AssetManager - Simplified, delegating optimization to Vite
 * 
 * Philosophy: Don't reinvent the wheel
 * - Vite handles: minification, tree-shaking, code-splitting, cache-busting
 * - We handle: WordPress integration only
 */
class AssetManager {
  constructor(config) {
    this.config = config;
    this.viteManifest = null;
  }

  build() {
    console.log('📦 Assets optimizados son requeridos para generación completa');
    
    // FAIL FAST - Delegate ALL optimization to Vite
    this.buildViteAssets();
    
    console.log('⚡ Optimizando assets...');
    // Vite handles: minification, tree-shaking, code-splitting, cache-busting
    this.loadViteManifest();           // Use Vite's built-in manifest
    this.copyViteAssets();             // Copy optimized assets  
    this.copyDesignTokens();           // Copy design tokens
    this.generateAssetEnqueueFile();   // Generate WordPress wp_enqueue
    this.generateAvailableAssetsManifest(); // Generate WordPress-compatible manifest
  }

  buildViteAssets() {
    try {
      execSync('npm run build', { stdio: 'inherit' });
    } catch (error) {
      throw new Error(`❌ VITE BUILD ERROR: ${error.message}\n💡 Verificar: nvm use 24\n💡 Verificar: npm run build funciona correctamente`);
    }
  }

  /**
   * Load Vite's auto-generated manifest (with cache-busting hashes)
   */
  loadViteManifest() {
    const manifestPath = './dist/.vite/manifest.json';
    
    if (fs.existsSync(manifestPath)) {
      this.viteManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      console.log('✅ Vite manifest cargado (cache-busting automático)');
    } else {
      // Fallback: scan dist directory
      this.generateFallbackManifest();
    }
  }

  generateFallbackManifest() {
    const distDir = './dist';
    this.viteManifest = {};
    
    if (fs.existsSync(distDir)) {
      const files = fs.readdirSync(distDir, { recursive: true });
      
      files.forEach(file => {
        if (typeof file === 'string') {
          if (file.endsWith('.css') || file.endsWith('.js')) {
            this.viteManifest[file] = { file: file };
          }
        }
      });
    }
  }

  copyViteAssets() {
    const outputDir = `${this.config.outputDir}/${this.config.themeName}/assets`;
    
    // Ensure assets directory exists
    ['css', 'js', 'images'].forEach(dir => {
      const assetDir = path.join(outputDir, dir);
      if (!fs.existsSync(assetDir)) {
        fs.mkdirSync(assetDir, { recursive: true });
      }
    });

    // Copy optimized assets from dist
    this.copyDistFiles('./dist', outputDir);
  }

  copyDistFiles(sourceDir, targetDir) {
    if (!fs.existsSync(sourceDir)) {
      console.warn(`⚠️ Source directory ${sourceDir} not found`);
      return;
    }

    this.copyDistFilesRecursive(sourceDir, targetDir);
  }

  copyDistFilesRecursive(sourceDir, targetDir) {
    const items = fs.readdirSync(sourceDir);
    
    items.forEach(item => {
      const sourcePath = path.join(sourceDir, item);
      const stat = fs.statSync(sourcePath);
      
      if (stat.isDirectory()) {
        // Recursively copy from subdirectories
        this.copyDistFilesRecursive(sourcePath, targetDir);
      } else if (stat.isFile()) {
        let targetPath;
        
        if (item.endsWith('.css')) {
          targetPath = path.join(targetDir, 'css', item);
        } else if (item.endsWith('.js') && !item.endsWith('.map')) {
          targetPath = path.join(targetDir, 'js', item);
        } else if (item.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i)) {
          targetPath = path.join(targetDir, 'images', item);
        } else {
          return; // Skip other files
        }
        
        console.log(`📋 Copiando: ${item} → ${path.relative(targetDir, targetPath)}`);
        fs.copyFileSync(sourcePath, targetPath);
      }
    });
  }

  copyDesignTokens() {
    const tokensSource = './src/tokens/design-tokens.css';
    const tokensTarget = `${this.config.outputDir}/${this.config.themeName}/assets/css/design-tokens.css`;
    
    if (fs.existsSync(tokensSource)) {
      fs.copyFileSync(tokensSource, tokensTarget);
      console.log('✅ Design tokens copiados');
    } else {
      console.warn(`⚠️ Design tokens no encontrados en: ${tokensSource}`);
    }
  }

  /**
   * Generate WordPress wp_enqueue integration using Vite's optimized assets
   */
  generateAssetEnqueueFile() {
    const incDir = `${this.config.outputDir}/${this.config.themeName}/inc`;
    if (!fs.existsSync(incDir)) {
      fs.mkdirSync(incDir, { recursive: true });
    }

    const enqueuePath = `${this.config.outputDir}/${this.config.themeName}/inc/asset-enqueue.php`;
    const functionPrefix = this.config.phpFunctionPrefix || 'theme';

    const enqueueContent = `<?php
/**
 * Asset Enqueue - Auto-generated (optimized by Vite)
 * Agnóstico al cliente - configuración basada en manifest
 */

function ${functionPrefix}_optimized_asset_enqueue() {
    // Load available assets manifest (generated by Vite)
    $manifest_file = get_template_directory() . '/assets/available-assets.json';

    if (!file_exists($manifest_file)) {
        return; // No manifest, no assets to enqueue
    }

    $manifest_content = file_get_contents($manifest_file);
    $manifest_data = json_decode($manifest_content, true);

    if (!isset($manifest_data['enqueue_order'])) {
        return; // Invalid manifest format
    }

    $js_loaded = false;

    // Enqueue assets in priority order (already sorted in manifest)
    foreach ($manifest_data['enqueue_order'] as $asset) {
        if ($asset['type'] === 'style') {
            wp_enqueue_style(
                $asset['handle'],
                get_template_directory_uri() . '/assets/' . $asset['file'],
                $asset['dependencies'],
                wp_get_theme()->get('Version')
            );
        } elseif ($asset['type'] === 'script' && !$js_loaded) {
            // Solo cargar un JS: preferir UMD para compatibilidad
            if (strpos($asset['file'], '.umd.js') !== false) {
                wp_enqueue_script(
                    $asset['handle'],
                    get_template_directory_uri() . '/assets/' . $asset['file'],
                    $asset['dependencies'],
                    wp_get_theme()->get('Version'),
                    isset($asset['in_footer']) ? $asset['in_footer'] : false
                );
                $js_loaded = true;
            }
        }
    }

    // Si no se cargó UMD, cargar ES6 como fallback con type="module"
    if (!$js_loaded) {
        foreach ($manifest_data['enqueue_order'] as $asset) {
            if ($asset['type'] === 'script' && strpos($asset['file'], '.es.js') !== false) {
                wp_enqueue_script(
                    $asset['handle'],
                    get_template_directory_uri() . '/assets/' . $asset['file'],
                    $asset['dependencies'],
                    wp_get_theme()->get('Version'),
                    isset($asset['in_footer']) ? $asset['in_footer'] : false
                );

                // Agregar type="module" para ES6
                add_filter('script_loader_tag', function($tag, $handle_filter, $src) use ($asset) {
                    if ($handle_filter === $asset['handle']) {
                        return str_replace('<script', '<script type="module"', $tag);
                    }
                    return $tag;
                }, 10, 3);

                break;
            }
        }
    }
}

add_action('wp_enqueue_scripts', '${functionPrefix}_optimized_asset_enqueue');
?>`;

    fs.writeFileSync(enqueuePath, enqueueContent);
    console.log(`✅ Asset enqueue agnóstico generado (función: ${functionPrefix}_optimized_asset_enqueue)`);
  }

  /**
   * Generate WordPress-compatible manifest from Vite's optimized assets
   */
  generateAvailableAssetsManifest() {
    // Usar configuración agnóstica desde singleton
    const enqueueHandle = this.config.enqueueHandle || 'theme';
    const designTokensFile = this.config.designTokensFile || 'design-tokens.css';

    const availableAssets = {
      enqueue_order: [],
      config: {
        enqueue_handle: enqueueHandle,
        design_tokens_handle: `${enqueueHandle}-design-tokens`
      },
      generated_by: 'Vite (delegated optimization)',
      timestamp: new Date().toISOString()
    };

    const assetsDir = `${this.config.outputDir}/${this.config.themeName}/assets`;
    const mainTokensHandle = `${enqueueHandle}-design-tokens`;

    // 1. Design tokens (priority 1 - always first)
    const designTokensPath = path.join(assetsDir, 'css', designTokensFile);
    if (fs.existsSync(designTokensPath)) {
      availableAssets.enqueue_order.push({
        handle: mainTokensHandle,
        type: 'style',
        file: `css/${designTokensFile}`,
        dependencies: [],
        priority: 1
      });
    }

    // 2. Main Vite CSS (priority 2)
    const cssDir = path.join(assetsDir, 'css');
    if (fs.existsSync(cssDir)) {
      const files = fs.readdirSync(cssDir);
      files.forEach(file => {
        if (file.endsWith('.css') && file !== designTokensFile) {
          const handle = file
            .replace(/\.css$/, '')
            .replace(/-[a-f0-9]{8,}$/, '') // Remove Vite hash
            .replace(/[^a-zA-Z0-9]/g, '-');

          availableAssets.enqueue_order.push({
            handle: `${enqueueHandle}-${handle}`,
            type: 'style',
            file: `css/${file}`,
            dependencies: [mainTokensHandle],
            priority: 2
          });
        }
      });
    }

    // 3. Component CSS (priority 10+)
    const componentsDir = path.join(assetsDir, 'css', 'components');
    if (fs.existsSync(componentsDir)) {
      const componentFiles = fs.readdirSync(componentsDir);
      componentFiles.forEach(file => {
        if (file.endsWith('.css')) {
          const componentName = file.replace('.css', '');
          availableAssets.enqueue_order.push({
            handle: `${enqueueHandle}-component-${componentName}`,
            type: 'style',
            file: `css/components/${file}`,
            dependencies: [mainTokensHandle],
            priority: 10
          });
        }
      });
    }

    // 4. JavaScript files (priority 20)
    const jsDir = path.join(assetsDir, 'js');
    if (fs.existsSync(jsDir)) {
      const files = fs.readdirSync(jsDir);
      files.forEach(file => {
        if (file.endsWith('.js')) {
          const handle = file
            .replace(/\.js$/, '')
            .replace(/-[a-f0-9]{8,}$/, '') // Remove Vite hash
            .replace(/[^a-zA-Z0-9]/g, '-');

          availableAssets.enqueue_order.push({
            handle: `${enqueueHandle}-${handle}`,
            type: 'script',
            file: `js/${file}`,
            dependencies: [],
            priority: 20,
            in_footer: true
          });
        }
      });
    }

    // Sort by priority
    availableAssets.enqueue_order.sort((a, b) => a.priority - b.priority);

    const manifestPath = `${this.config.outputDir}/${this.config.themeName}/assets/available-assets.json`;
    fs.writeFileSync(manifestPath, JSON.stringify(availableAssets, null, 2));

    console.log(`✅ Manifest agnóstico generado (prefijo: ${enqueueHandle})`);
  }
}

module.exports = AssetManager;