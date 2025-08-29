const PhpComponentTemplate = require('./templates/php-components.js');

const config = { srcDir: '../../src' };
const template = new PhpComponentTemplate(config);

console.log('=== HERO-SECTION DINÁMICO ===');
console.log(template.generatePhpTemplate('hero-section'));
console.log('\n=== PARÁMETROS HERO-SECTION ===');
console.log(template.generatePhpParameters('hero-section'));