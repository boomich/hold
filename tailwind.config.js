/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,tsx}', './components/**/*.{js,ts,tsx}', './src/**/*.{js,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        ink: '#1F2A24',
        inkMuted: '#3D4A42',
        mist: '#F4F1EA',
        sand: '#E7E1D6',
        clay: '#D7CFC1',
        moss: '#4E6C5A',
        mossDark: '#2E4A3C',
        sun: '#F0C972',
        rose: '#C96B5A',
        surface: '#FBFAF7',
        border: '#D8D1C6',
      },
      borderRadius: {
        xl: '20px',
        '2xl': '28px',
      },
      fontFamily: {
        display: ['AvenirNext-DemiBold', 'Avenir Next', 'serif'],
        body: ['AvenirNext-Regular', 'Avenir Next', 'serif'],
      },
      boxShadow: {
        soft: '0 8px 24px rgba(31, 42, 36, 0.08)',
      },
    },
  },
  plugins: [],
};
