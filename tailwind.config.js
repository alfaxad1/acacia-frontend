/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Sora', '"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        /* The product's jade brand scale. `blue-*` is aliased onto it so every
           legacy screen picks up the new identity without a rewrite. */
        brand: {
          50: '#eef8f4',
          100: '#d3ede2',
          200: '#a8dbc7',
          300: '#71c3a5',
          400: '#3fa683',
          500: '#1e8a68',
          600: '#0f7053',
          700: '#0c5943',
          800: '#0d4737',
          900: '#0b3a2e',
          950: '#04211a',
        },
        blue: {
          50: '#eef8f4',
          100: '#d3ede2',
          200: '#a8dbc7',
          300: '#71c3a5',
          400: '#3fa683',
          500: '#1e8a68',
          600: '#0f7053',
          700: '#0c5943',
          800: '#0d4737',
          900: '#0b3a2e',
          950: '#04211a',
        },
        sand: {
          50: '#fdf8f1',
          100: '#f8ecd9',
          200: '#efd6ae',
          300: '#e4b978',
          400: '#d99b4a',
          500: '#c9802c',
          600: '#a76322',
          700: '#84491f',
          800: '#6c3b20',
          900: '#5a321e',
        },
        gray: {
          50: '#f8f8f6',
          100: '#f0f0ec',
          200: '#e4e3dd',
          300: '#cfcec5',
          400: '#a3a299',
          500: '#7a7970',
          600: '#5c5b55',
          700: '#464540',
          800: '#302f2c',
          900: '#1c1b19',
          950: '#111110',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(17, 17, 16, 0.04), 0 8px 24px -12px rgba(17, 17, 16, 0.14)',
        lift: '0 18px 40px -20px rgba(12, 89, 67, 0.45)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      keyframes: {
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        // Opacity only: a lingering transform turns the element into a
        // containing block and breaks every `position: fixed` modal inside it.
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.35s ease-out both',
        'fade-in': 'fade-in 0.25s ease-out both',
      },
    },
  },
  plugins: [],
};
