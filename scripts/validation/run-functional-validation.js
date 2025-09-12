#!/usr/bin/env node

/**
 * Script para ejecutar validación funcional
 * Integra el nuevo validador funcional con el sistema existente
 */

const path = require('path');
const FunctionalValidator = require('./functional-validator');

async function runFunctionalValidation() {
  console.log('🧪 Iniciando Validación Funcional de WordPress...');
  console.log('━'.repeat(50));

  // Configuración desde config del generador
  const config = {
    srcDir: './src',
    outputDir: './wordpress-output',
    themeName: 'toulouse-lautrec'
  };

  const validator = new FunctionalValidator(config);
  const results = await validator.validateAll();

  console.log('━'.repeat(50));

  if (results.isValid) {
    console.log('🎉 Validación funcional COMPLETAMENTE EXITOSA');
    console.log('💯 El tema WordPress generado funcionará correctamente');
    process.exit(0);
  } else {
    console.log('🚨 Validación funcional FALLÓ');
    console.log('❌ El tema WordPress tiene problemas funcionales');
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  runFunctionalValidation().catch(error => {
    console.error('💥 Error en validación funcional:', error);
    process.exit(1);
  });
}

module.exports = runFunctionalValidation;