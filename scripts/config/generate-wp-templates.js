const WordPressGenerator = require('../wp-generator/index.js');

// Ejecutar el generador
const generator = new WordPressGenerator({
  outputDir: process.argv[2] || './wordpress-output'
});

generator.generate().catch(console.error);
