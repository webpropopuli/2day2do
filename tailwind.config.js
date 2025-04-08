/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            color: '#fff',
            a: {
              color: '#c084fc',
              '&:hover': {
                color: '#a855f7',
              },
            },
            h1: {
              color: '#fff',
            },
            h2: {
              color: '#fff',
            },
            h3: {
              color: '#fff',
            },
            h4: {
              color: '#fff',
            },
            strong: {
              color: '#fff',
            },
            code: {
              color: '#fff',
            },
            blockquote: {
              color: '#fff',
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};