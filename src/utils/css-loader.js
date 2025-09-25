/**
 * CSS Hybrid Architecture - Solución Completa y Robusta
 *
 * Arquitectura híbrida optimizada para:
 * - WordPress: main.css unificado (Core Web Vitals óptimo)
 * - Storybook: Shadow DOM + Global styles (aislamiento perfecto)
 * - Desarrollo: CSS files separados (DX óptimo)
 *
 * 🏆 PATRÓN IMPLEMENTADO EN TODOS LOS COMPONENTES:
 *
 * ```javascript
 * import { LitElement, html, css, unsafeCSS } from 'lit';
 * import './component.css'; // Para global Storybook/WordPress styles
 * import componentStyles from './component.css?inline'; // Para Shadow DOM
 *
 * export class MyComponent extends LitElement {
 *   // ✅ CRÍTICO: unsafeCSS() es OBLIGATORIO para ?inline imports
 *   static styles = css`${unsafeCSS(componentStyles)}`;
 * }
 * ```
 *
 * ⚠️ IMPORTANTE:
 * - SIEMPRE usar unsafeCSS() con Vite ?inline imports
 * - css`${componentStyles}` SIN unsafeCSS() FALLARÁ
 * - Doble import asegura funcionalidad en ambos entornos
 */

import { css, unsafeCSS } from 'lit';

/**
 * Función helper para crear CSS inline desde archivos externos
 * @param {string} cssContent - CSS content from Vite ?inline import
 * @returns {CSSResult} - Lit CSS result ready for Shadow DOM
 */
export function createComponentStyles(cssContent) {
  return css`${unsafeCSS(cssContent)}`;
}

/**
 * 🎯 FLUJO COMPLETO:
 *
 * 1. DESARROLLO:
 *    - Editas component.css → Hot reload inmediato en Storybook
 *    - Vite procesa ?inline → Shadow DOM actualizado
 *    - Global import → Estilos globales disponibles
 *
 * 2. STORYBOOK BUILD:
 *    - main.css unificado → Todos los estilos globales
 *    - ?inline → Shadow DOM aislado por componente
 *    - Zero conflicts, performance óptimo
 *
 * 3. WORDPRESS GENERATION:
 *    - Vite build → CSS bundle optimizado (18.94 kB gzipped)
 *    - PHP conversion → Usa CSS clases, no Shadow DOM
 *    - Asset Manager → Enqueue optimizado para Core Web Vitals
 */