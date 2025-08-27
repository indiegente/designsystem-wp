import './course-card.js';

export default {
  title: 'Componentes/Course Card',
  component: 'course-card',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Card component para mostrar información de cursos/carreras. Incluye imagen, título, descripción y enlace de acción.'
      }
    }
  },
  argTypes: {
    title: { 
      control: 'text',
      description: 'Título del curso o carrera'
    },
    description: { 
      control: 'text',
      description: 'Descripción breve del contenido'
    },
    image: { 
      control: 'text',
      description: 'URL de la imagen (opcional)'
    },
    link: { 
      control: 'text',
      description: 'URL de destino del enlace'
    },
    linkText: { 
      control: 'text',
      description: 'Texto del botón de acción'
    }
  }
};

const Template = (args) => `
  <course-card
    title="${args.title}"
    description="${args.description}"
    image="${args.image}"
    link="${args.link}"
    link-text="${args.linkText}"
  ></course-card>
`;

export const Default = Template.bind({});
Default.args = {
  title: 'Diseño Gráfico',
  description: 'Carrera técnica en diseño gráfico con enfoque en creatividad digital y branding.',
  image: 'https://images.unsplash.com/photo-1561736778-92e52a7769ef?w=400&h=200&fit=crop',
  link: '/carreras/diseno-grafico',
  linkText: 'Ver carrera'
};

export const WithoutImage = Template.bind({});
WithoutImage.args = {
  title: 'Marketing Digital',
  description: 'Especialízate en estrategias digitales, redes sociales y growth hacking.',
  image: '',
  link: '/carreras/marketing-digital',
  linkText: 'Más información'
};

export const LongContent = Template.bind({});
LongContent.args = {
  title: 'Desarrollo Web Full Stack',
  description: 'Aprende a crear aplicaciones web completas desde frontend hasta backend, incluyendo bases de datos, APIs REST, y frameworks modernos como React y Node.js.',
  image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=200&fit=crop',
  link: '/carreras/desarrollo-web',
  linkText: 'Inscribirse'
};

export const Grid = () => `
  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; padding: 1rem;">
    <course-card
      title="Diseño Gráfico"
      description="Carrera técnica en diseño gráfico con enfoque en creatividad digital."
      image="https://images.unsplash.com/photo-1561736778-92e52a7769ef?w=400&h=200&fit=crop"
      link="/carreras/diseno-grafico"
      link-text="Ver carrera"
    ></course-card>
    
    <course-card
      title="Marketing Digital"
      description="Especialízate en estrategias digitales y redes sociales."
      image="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=200&fit=crop"
      link="/carreras/marketing-digital"
      link-text="Más información"
    ></course-card>
    
    <course-card
      title="Fotografía"
      description="Domina las técnicas de fotografía profesional y edición digital."
      image="https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&h=200&fit=crop"
      link="/carreras/fotografia"
      link-text="Descubrir"
    ></course-card>
  </div>
`;