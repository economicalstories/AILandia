/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Palette inspired by the AILandia island map: sea, land, sand, slate.
        sea: {
          50: '#eef6f8',
          100: '#d7eaef',
          600: '#3f7e8c',
          700: '#2f6371',
          900: '#1c3b44',
        },
        land: {
          400: '#a7c34f',
          500: '#86a43b',
          600: '#5f7d2b',
        },
        sand: '#e9dcae',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
