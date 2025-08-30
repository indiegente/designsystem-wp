#!/usr/bin/env node

const GenerationValidator = require('../wp-generator/validation/validator');

// Script independiente para validar tema WordPress generado
const wpConfig = require('../wp-generator/core/config');
const config = {
  srcDir: wpConfig.paths.src,
  outputDir: wpConfig.paths.output,
  themeName: wpConfig.theme.name,
  phpFunctionPrefix: 'toulouse_design_system'
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