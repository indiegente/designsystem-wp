#!/usr/bin/env node

/**
 * CLI para el Validador de Renderizado de Componentes
 */

const ComponentRenderValidator = require('./component-render-validator');
const path = require('path');

// Configuración similar al generador principal
const defaultConfig = {
  srcDir: './src',
  outputDir: './wordpress-output',
  themeName: 'toulouse-lautrec',
  themeDisplayName: 'Toulouse Design System',
  themeDescription: 'Sistema de diseño modular basado en componentes Lit',
  prefix: 'tl',
  phpFunctionPrefix: 'toulouse_design_system',
  cssHandle: 'toulouse-design-system',
  jsHandle: 'tl-ds'
};

async function main() {
  try {
    const config = defaultConfig;
    
    console.log('🧩 Iniciando validación de renderizado de componentes...');
    console.log(`📂 Directorio de salida: ${config.outputDir}/${config.themeName}`);
    console.log(`📄 Metadata: ${config.srcDir}/metadata.json`);
    console.log(`📋 Templates: ${config.srcDir}/page-templates.json`);
    console.log('');
    
    const validator = new ComponentRenderValidator(config);
    const isValid = await validator.validateComponentRendering();
    
    if (isValid) {
      console.log('\n🎉 ¡Validación de renderizado exitosa!');
      process.exit(0);
    } else {
      console.log('\n❌ Validación de renderizado falló');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Error ejecutando validación de renderizado:', error.message);
    
    if (error.message.includes('metadata.json')) {
      console.log('💡 Solución: Asegúrate de que metadata.json exista en el directorio src/');
    } else if (error.message.includes('page-templates.json')) {
      console.log('💡 Solución: Asegúrate de que page-templates.json exista en el directorio src/');
    } else if (error.message.includes('not found') || error.message.includes('No such file')) {
      console.log('💡 Solución: Ejecuta "npm run wp:generate" primero para generar el tema');
    }
    
    process.exit(1);
  }
}

main();