export default {
  title: 'Design System/Design Tokens',
  parameters: {
    docs: {
      description: {
        component: 'Sistema de tokens de diseño de Toulouse Lautrec'
      }
    }
  }
};

export const Colors = () => `
<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; padding: 1rem;">
  <div style="background: var(--tl-primary-500); color: white; padding: 1rem; border-radius: 8px;">
    <h3>Primary 500</h3>
    <code>--tl-primary-500</code>
    <div style="margin-top: 0.5rem;">#0ea5e9</div>
  </div>
  
  <div style="background: var(--tl-primary-600); color: white; padding: 1rem; border-radius: 8px;">
    <h3>Primary 600</h3>
    <code>--tl-primary-600</code>
    <div style="margin-top: 0.5rem;">#0284c7</div>
  </div>
  
  <div style="background: var(--tl-secondary-500); color: white; padding: 1rem; border-radius: 8px;">
    <h3>Secondary 500</h3>
    <code>--tl-secondary-500</code>
    <div style="margin-top: 0.5rem;">#eab308</div>
  </div>
  
  <div style="background: var(--tl-accent-500); color: white; padding: 1rem; border-radius: 8px;">
    <h3>Accent 500</h3>
    <code>--tl-accent-500</code>
    <div style="margin-top: 0.5rem;">#ec4899</div>
  </div>
  
  <div style="background: var(--tl-neutral-900); color: white; padding: 1rem; border-radius: 8px;">
    <h3>Neutral 900</h3>
    <code>--tl-neutral-900</code>
    <div style="margin-top: 0.5rem;">#171717</div>
  </div>
  
  <div style="background: var(--tl-neutral-100); color: var(--tl-neutral-900); padding: 1rem; border-radius: 8px; border: 1px solid #ccc;">
    <h3>Neutral 100</h3>
    <code>--tl-neutral-100</code>
    <div style="margin-top: 0.5rem;">#f5f5f5</div>
  </div>
</div>
`;

export const Typography = () => `
<div style="padding: 1rem;">
  <div style="margin-bottom: 2rem;">
    <h3>Font Family</h3>
    <div style="font-family: var(--tl-font-primary); font-size: 1.5rem; margin-bottom: 0.5rem;">
      Inter Font Family
    </div>
    <code>--tl-font-primary: ${getComputedStyle(document.documentElement).getPropertyValue('--tl-font-primary')}</code>
  </div>
  
  <div style="margin-bottom: 2rem;">
    <h3>Font Sizes</h3>
    <div style="font-size: var(--tl-font-size-3xl); margin-bottom: 0.5rem;">
      Large Title (3xl)
    </div>
    <code>--tl-font-size-3xl: 1.875rem</code>
    
    <div style="font-size: var(--tl-font-size-lg); margin: 1rem 0 0.5rem 0;">
      Regular Text (lg)
    </div>
    <code>--tl-font-size-lg: 1.125rem</code>
  </div>
  
  <div>
    <h3>Font Weights</h3>
    <div style="font-weight: var(--tl-font-weight-semibold); margin-bottom: 0.5rem;">
      Semibold Text
    </div>
    <code>--tl-font-weight-semibold: 600</code>
  </div>
</div>
`;

export const Spacing = () => `
<div style="padding: 1rem;">
  <h3 style="margin-bottom: 1rem;">Spacing Tokens</h3>
  
  <div style="display: flex; flex-direction: column; gap: 1rem;">
    <div>
      <div style="background: var(--tl-primary-500); height: 2px; width: var(--tl-spacing-4);"></div>
      <code>--tl-spacing-4: 1rem</code>
    </div>
    
    <div>
      <div style="background: var(--tl-secondary-500); height: 2px; width: var(--tl-spacing-6);"></div>
      <code>--tl-spacing-6: 1.5rem</code>
    </div>
    
    <div>
      <div style="background: var(--tl-accent-500); height: 2px; width: var(--tl-spacing-8);"></div>
      <code>--tl-spacing-8: 2rem</code>
    </div>
  </div>
</div>
`;

export const Effects = () => `
<div style="padding: 2rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 2rem;">
  <div style="background: white; padding: 1.5rem; border-radius: 8px; box-shadow: var(--tl-shadow-lg);">
    <h4>Shadow Large</h4>
    <code>--tl-shadow-lg</code>
    <div style="margin-top: 0.5rem; font-size: 0.875rem; color: #666;">
      0 10px 15px -3px rgb(0 0 0 / 0.1)
    </div>
  </div>
  
  <div 
    style="
      background: var(--tl-primary-500); 
      color: white; 
      padding: 1.5rem; 
      border-radius: 8px; 
      transition: var(--tl-transition-normal);
      cursor: pointer;
    "
    onmouseover="this.style.transform = 'scale(1.05)'"
    onmouseout="this.style.transform = 'scale(1)'"
  >
    <h4>Transition</h4>
    <code>--tl-transition-normal</code>
    <div style="margin-top: 0.5rem; font-size: 0.875rem;">
      250ms ease-in-out<br>
      <small>(Hover para ver el efecto)</small>
    </div>
  </div>
</div>
`;