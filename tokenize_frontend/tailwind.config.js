/**** Tailwind config ****/
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#001A72', 600: '#00258A', 700: '#0A2D96' },
        accent: '#00A19A',
        neutral: { 900: '#0B1220', 700: '#3A4357', 100: '#F4F6FA' }
      }
    }
  },
  plugins: []
}
