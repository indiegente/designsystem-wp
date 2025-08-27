export default {
  title: 'Design System/Introducción',
  parameters: {
    docs: {
      description: {
        component: 'Design System de Toulouse Lautrec - Sistema de componentes y tokens de diseño'
      }
    }
  }
};

export const Overview = () => `
<div style="max-width: 800px; padding: 2rem; font-family: var(--tl-font-primary);">
  <h1 style="color: var(--tl-primary-600); margin-bottom: 1.5rem;">
    Toulouse Lautrec Design System
  </h1>
  
  <p style="font-size: var(--tl-font-size-lg); color: var(--tl-neutral-900); margin-bottom: 2rem;">
    Sistema de diseño modular basado en <strong>Lit Components</strong> y <strong>Design Tokens</strong>, 
    con generación automática de temas WordPress.
  </p>
  
  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
    <div style="background: var(--tl-neutral-100); padding: 1.5rem; border-radius: 8px; border-left: 4px solid var(--tl-primary-500);">
      <h3 style="color: var(--tl-primary-600); margin-bottom: 0.5rem;">🎨 Design Tokens</h3>
      <p style="margin: 0; color: var(--tl-neutral-900);">
        Colores, tipografías, espaciados y efectos centralizados
      </p>
    </div>
    
    <div style="background: var(--tl-neutral-100); padding: 1.5rem; border-radius: 8px; border-left: 4px solid var(--tl-secondary-500);">
      <h3 style="color: var(--tl-secondary-500); margin-bottom: 0.5rem;">🧩 Componentes</h3>
      <p style="margin: 0; color: var(--tl-neutral-900);">
        Componentes Lit reutilizables y modulares
      </p>
    </div>
    
    <div style="background: var(--tl-neutral-100); padding: 1.5rem; border-radius: 8px; border-left: 4px solid var(--tl-accent-500);">
      <h3 style="color: var(--tl-accent-500); margin-bottom: 0.5rem;">🚀 WordPress</h3>
      <p style="margin: 0; color: var(--tl-neutral-900);">
        Generación automática de temas WordPress
      </p>
    </div>
  </div>
  
  <div style="background: var(--tl-primary-500); color: white; padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem;">
    <h3 style="margin-bottom: 1rem;">📚 Navegación</h3>
    <ul style="margin: 0; padding-left: 1.5rem;">
      <li><strong>Design Tokens</strong> - Colores, tipografías y spacing</li>
      <li><strong>Componentes</strong> - Hero Section, Course Card, etc.</li>
      <li><strong>Documentación</strong> - Guías de uso y implementación</li>
    </ul>
  </div>
  
  <div style="border: 2px dashed var(--tl-neutral-900); padding: 1.5rem; border-radius: 8px;">
    <h4 style="margin-bottom: 0.5rem; color: var(--tl-neutral-900);">💡 Comandos Disponibles</h4>
    <code style="background: var(--tl-neutral-100); padding: 0.5rem; border-radius: 4px; display: block; margin-bottom: 0.5rem;">
      npm run dev        # Desarrollo con Vite
    </code>
    <code style="background: var(--tl-neutral-100); padding: 0.5rem; border-radius: 4px; display: block; margin-bottom: 0.5rem;">
      npm run storybook  # Documentación Storybook
    </code>
    <code style="background: var(--tl-neutral-100); padding: 0.5rem; border-radius: 4px; display: block;">
      npm run wp:generate # Generar tema WordPress
    </code>
  </div>
</div>
`;

export const Architecture = () => `
<div style="max-width: 800px; padding: 2rem; font-family: var(--tl-font-primary);">
  <h2 style="color: var(--tl-primary-600); margin-bottom: 1.5rem;">🏗️ Arquitectura del Sistema</h2>
  
  <div style="background: var(--tl-neutral-100); padding: 2rem; border-radius: 8px; margin-bottom: 2rem;">
    <pre style="margin: 0; overflow-x: auto; font-size: 0.875rem;">
src/
├── tokens/
│   └── design-tokens.css          # Sistema de tokens
├── components/
│   ├── hero-section/
│   │   ├── hero-section.js        # Componente Lit
│   │   └── hero-section.stories.js # Documentación
│   └── course-card/
│       ├── course-card.js
│       └── course-card.stories.js
└── index.js                       # Entry point

scripts/
├── generate-wp-templates.js       # Generador principal  
└── wp-generator/                  # Módulos del generador
    ├── index.js
    ├── component-converter.js     # Lit → PHP
    ├── template-builder.js        # Templates WP
    ├── asset-manager.js           # Assets y build
    ├── validator.js               # Validación
    └── templates/                 # Plantillas
    </pre>
  </div>
  
  <h3 style="color: var(--tl-secondary-500); margin-bottom: 1rem;">🔄 Flujo de Trabajo</h3>
  
  <div style="display: flex; flex-direction: column; gap: 1rem;">
    <div style="display: flex; align-items: center; gap: 1rem;">
      <div style="background: var(--tl-primary-500); color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 0.875rem; font-weight: bold;">1</div>
      <div>Desarrollar componentes Lit + Design Tokens</div>
    </div>
    
    <div style="display: flex; align-items: center; gap: 1rem;">
      <div style="background: var(--tl-secondary-500); color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 0.875rem; font-weight: bold;">2</div>
      <div>Documentar en Storybook</div>
    </div>
    
    <div style="display: flex; align-items: center; gap: 1rem;">
      <div style="background: var(--tl-accent-500); color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 0.875rem; font-weight: bold;">3</div>
      <div>Generar tema WordPress automáticamente</div>
    </div>
    
    <div style="display: flex; align-items: center; gap: 1rem;">
      <div style="background: var(--tl-neutral-900); color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 0.875rem; font-weight: bold;">4</div>
      <div>Deploy con symlink a WordPress</div>
    </div>
  </div>
</div>
`;