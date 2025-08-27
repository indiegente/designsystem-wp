// .storybook/main.js
module.exports = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx|mdx)'],

  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
    '@chromatic-com/storybook'
  ],

  framework: {
    name: '@storybook/html-vite',
    options: {}
  },

  docs: {
    autodocs: true
  }
};
