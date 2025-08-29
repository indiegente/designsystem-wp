// vite.config.js  
const { defineConfig } = require('vite');

module.exports = defineConfig({
  build: {
    lib: {
      entry: 'src/index.js',
      name: 'ToulouseDS',
      fileName: (format) => `js/toulouse-ds.${format}.js`
    },
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name.endsWith('.css')) {
            return 'css/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    },
    sourcemap: true,
    minify: 'terser'
  },
  // Add this to ensure proper module resolution
  resolve: {
    alias: {
      '@': '/src'
    }
  }
});