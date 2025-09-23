// Design System Entry Point
import './main.css'; // Single optimized CSS bundle for WordPress production

// Importar todos los componentes
import './components/hero-section/hero-section.js';
import './components/course-card/course-card.js';
import './components/testimonials/testimonials.js';
import './components/feature-grid/feature-grid.js';
import './components/test-showcase/test-showcase.js';

// Re-exportar componentes para fácil uso
export { HeroSection } from './components/hero-section/hero-section.js';
export { CourseCard } from './components/course-card/course-card.js';
export { Testimonials } from './components/testimonials/testimonials.js';
export { FeatureGrid } from './components/feature-grid/feature-grid.js';

