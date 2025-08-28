import { html } from 'lit';
import '../design-system.stories.js';
import { Testimonials } from './testimonials.js';

export default {
  title: 'Components/Testimonials',
  component: 'tl-testimonials',
  parameters: {
    docs: {
      description: {
        component: 'Componente de testimonios que muestra una lista de testimonios de clientes con datos dinámicos.'
      }
    }
  },
  argTypes: {
    title: {
      control: 'text',
      description: 'Título de la sección de testimonios'
    },
    subtitle: {
      control: 'text',
      description: 'Subtítulo de la sección de testimonios'
    },
    testimonials: {
      control: 'object',
      description: 'Array de testimonios con propiedades: name, role, content, rating, avatar, course'
    }
  }
};

const Template = (args) => html`
  <tl-testimonials
    .title=${args.title}
    .subtitle=${args.subtitle}
    .testimonials=${args.testimonials}
  ></tl-testimonials>
`;

export const Default = Template.bind({});
Default.args = {
  title: 'Testimonios de nuestros estudiantes',
  subtitle: 'Descubre lo que dicen sobre nosotros',
  testimonials: [
    {
      name: 'María González',
      role: 'Estudiante de Diseño Gráfico',
      content: 'Toulouse Lautrec me ha dado las herramientas necesarias para desarrollar mi creatividad. Los profesores son excelentes y el ambiente es muy inspirador.',
      rating: 5,
      avatar: '',
      course: 'Diseño Gráfico Digital'
    },
    {
      name: 'Carlos Rodríguez',
      role: 'Desarrollador Web',
      content: 'La formación técnica que recibí aquí es de primer nivel. Ahora trabajo en una empresa importante y estoy muy agradecido por la oportunidad.',
      rating: 5,
      avatar: '',
      course: 'Desarrollo Web Full Stack'
    },
    {
      name: 'Ana Martínez',
      role: 'Diseñadora UX/UI',
      content: 'El enfoque práctico y la metodología de enseñanza me han ayudado a crecer profesionalmente. Recomiendo totalmente esta institución.',
      rating: 4,
      avatar: '',
      course: 'Diseño UX/UI'
    }
  ]
};

export const WithAvatars = Template.bind({});
WithAvatars.args = {
  ...Default.args,
  testimonials: [
    {
      name: 'María González',
      role: 'Estudiante de Diseño Gráfico',
      content: 'Toulouse Lautrec me ha dado las herramientas necesarias para desarrollar mi creatividad. Los profesores son excelentes y el ambiente es muy inspirador.',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      course: 'Diseño Gráfico Digital'
    },
    {
      name: 'Carlos Rodríguez',
      role: 'Desarrollador Web',
      content: 'La formación técnica que recibí aquí es de primer nivel. Ahora trabajo en una empresa importante y estoy muy agradecido por la oportunidad.',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      course: 'Desarrollo Web Full Stack'
    },
    {
      name: 'Ana Martínez',
      role: 'Diseñadora UX/UI',
      content: 'El enfoque práctico y la metodología de enseñanza me han ayudado a crecer profesionalmente. Recomiendo totalmente esta institución.',
      rating: 4,
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      course: 'Diseño UX/UI'
    }
  ]
};

export const Empty = Template.bind({});
Empty.args = {
  title: 'Testimonios',
  subtitle: 'Aún no hay testimonios',
  testimonials: []
};
