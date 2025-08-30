import './test-showcase.js';

export default {
  title: 'Testing/TestShowcase',
  component: 'test-showcase',
  parameters: {
    docs: {
      description: {
        component: 'Componente completo para validar todos los managers del sistema WordPress'
      }
    }
  },
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' },
    enableAnalytics: { control: 'boolean' }
  }
};

const Template = (args) => `
  <test-showcase
    title="${args.title}"
    description="${args.description}"
    .testImages="${args.testImages}"
    .testData="${args.testData}"
    ?enableAnalytics="${args.enableAnalytics}"
  ></test-showcase>
`;

export const Default = Template.bind({});
Default.args = {
  title: 'Test Showcase - Validación Completa',
  description: 'Componente para probar todos los managers: SEO, Assets, Analytics, Templates y Components',
  testImages: [
    { src: 'https://via.placeholder.com/300x200/FF6B35/FFFFFF?text=Test+1', alt: 'Imagen de prueba 1' },
    { src: 'https://via.placeholder.com/300x200/F7931E/FFFFFF?text=Test+2', alt: 'Imagen de prueba 2' },
    { src: 'https://via.placeholder.com/300x200/FFD23F/000000?text=Test+3', alt: 'Imagen de prueba 3' },
    { src: 'https://via.placeholder.com/300x200/06FFA5/000000?text=Test+4', alt: 'Imagen de prueba 4' }
  ],
  testData: {
    analytics: ['page_view', 'component_view', 'interaction', 'form_submit'],
    seo: { schema: 'WebPage', structured: true },
    performance: { lazyLoading: true, preload: true }
  },
  enableAnalytics: true
};

export const WithoutAnalytics = Template.bind({});
WithoutAnalytics.args = {
  ...Default.args,
  title: 'Test Showcase - Sin Analytics',
  enableAnalytics: false
};

export const MinimalTest = Template.bind({});
MinimalTest.args = {
  title: 'Test Mínimo',
  description: 'Prueba básica de conversión Lit → PHP',
  testImages: [
    { src: 'https://via.placeholder.com/200x150/333/FFF?text=Simple', alt: 'Test simple' }
  ],
  enableAnalytics: true
};