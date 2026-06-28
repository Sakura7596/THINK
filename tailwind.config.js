/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F7F4EE',
        surface: '#FFFDF8',
        ink: '#1E1E1C',
        muted: '#77736B',
        line: '#E4DED2',
        accent: '#3D4A3A',
      },
      boxShadow: {
        soft: '0 18px 50px rgba(30, 30, 28, 0.08)',
      },
    },
  },
  plugins: [],
}
