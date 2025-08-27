import './hero-section.js';

export default {
  title: 'Componentes/Hero Section',
  component: 'tl-hero-section',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'A hero section component with customizable title, subtitle, CTA button, and background image.'
      }
    }
  },
  argTypes: {
    title: { 
      control: 'text',
      description: 'The main heading text'
    },
    subtitle: { 
      control: 'text',
      description: 'The subtitle text below the main heading'
    },
    ctaText: { 
      control: 'text',
      description: 'The call-to-action button text'
    },
    backgroundImage: { 
      control: 'text',
      description: 'URL of the background image (optional)'
    }
  }
};

const Template = (args) => `
  <div style="width: 100%;">
    <tl-hero-section
      title="${args.title}"
      subtitle="${args.subtitle}"
      ctaText="${args.ctaText}"
      backgroundImage="${args.backgroundImage}">
    </tl-hero-section>
  </div>
`;

export const Default = Template.bind({});
Default.args = {
  title: 'Transforma tu futuro con Toulouse Lautrec',
  subtitle: 'Carreras técnicas que te preparan para el mundo laboral',
  ctaText: 'Ver Carreras',
  backgroundImage: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200'
};

export const WithoutImage = Template.bind({});
WithoutImage.args = {
  title: 'Solo con gradiente',
  subtitle: 'Sin imagen de fondo',
  ctaText: 'Explorar',
  backgroundImage: ''
};
