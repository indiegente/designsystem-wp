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
    
    const enqueueContent = `<?php
/**
 * Asset Enqueue - Auto-generated (optimized by Vite)
 * Vite handles: minification, tree-shaking, code-splitting, cache-busting
 */

function toulouse_optimized_asset_enqueue() {
    // Load available assets manifest (generated by Vite)
    $manifest_file = get_template_directory() . '/assets/available-assets.json';
    $assets_available = array();
    
    if (file_exists($manifest_file)) {
        $manifest_content = file_get_contents($manifest_file);
        $assets_available = json_decode($manifest_content, true);
    }
    
    // CSS - Enqueue Vite-optimized styles
    if (isset($assets_available['css'])) {
        foreach ($assets_available['css'] as $handle => $filename) {
            wp_enqueue_style(
                "toulouse-{$handle}",
                get_template_directory_uri() . "/assets/css/{$filename}",
                array(),
                null // Vite handles cache-busting via filename hashes
            );
        }
    }
    
    // JS - Enqueue Vite-optimized scripts  
    if (isset($assets_available['js'])) {
        foreach ($assets_available['js'] as $handle => $filename) {
            wp_enqueue_script(
                "toulouse-{$handle}",
                get_template_directory_uri() . "/assets/js/{$filename}",
                array(),
                null, // Vite handles cache-busting via filename hashes
                true  // Load in footer
            );
        }
    }
}

add_action('wp_enqueue_scripts', 'toulouse_optimized_asset_enqueue');
?>`;

    fs.writeFileSync(enqueuePath, enqueueContent);
    console.log('✅ WordPress asset enqueue generado (integra assets optimizados por Vite)');
  }

  /**
   * Generate WordPress-compatible manifest from Vite's optimized assets
   */
  generateAvailableAssetsManifest() {
    const availableAssets = {
      css: {},
      js: {},
      generated_by: 'Vite (delegated optimization)',
      timestamp: new Date().toISOString()
    };

    // Scan copied assets
    const assetsDir = `${this.config.outputDir}/${this.config.themeName}/assets`;
    
    ['css', 'js'].forEach(type => {
      const typeDir = path.join(assetsDir, type);
      
      if (fs.existsSync(typeDir)) {
        const files = fs.readdirSync(typeDir);
        
        files.forEach(file => {
          if (file.endsWith(`.${type}`)) {
            // Generate WordPress-friendly handle
            const handle = file
              .replace(new RegExp(`\.${type}$`), '')
              .replace(/-[a-f0-9]{8,}$/, '') // Remove Vite hash
              .replace(/[^a-zA-Z0-9]/g, '-');
            
            availableAssets[type][handle] = file;
          }
        });
      }
    });

    const manifestPath = `${this.config.outputDir}/${this.config.themeName}/assets/available-assets.json`;
    fs.writeFileSync(manifestPath, JSON.stringify(availableAssets, null, 2));
    
    console.log('✅ Manifest de assets disponibles generado (basado en optimización de Vite)');
  }
}

module.exports = AssetManager;