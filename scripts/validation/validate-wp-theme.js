#!/usr/bin/env node

const GenerationValidator = require('./wp-generator/validator');

// Script independiente para validar tema WordPress generado
const config = {
  srcDir: './src',
  outputDir: process.argv[2] || './wordpress-output',
  themeName: 'toulouse-lautrec'
};

const validator = new GenerationValidator(config);

validator.validateGeneration()
  .then(isValid => {
    process.exit(isValid ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Error durante la validación:', error.message);
    process.exit(1);
  });