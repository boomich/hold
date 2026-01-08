/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#F6F1EA',
        surface: '#FFFBF4',
        card: '#FFF7ED',
        ink: '#1F1A17',
        muted: '#5E5750',
        line: '#E7DDD0',
        accent: '#2C6E63',
        accentSoft: '#D6E9E3',
        warn: '#B55A47',
        success: '#2F7A67',
        haze: '#F0E8DD',
      },
      fontFamily: {
        display: ['Lexend_600SemiBold'],
        body: ['Lexend_400Regular'],
        medium: ['Lexend_500Medium'],
      },
      fontSize: {
        title: ['28px', { lineHeight: '32px' }],
        h2: ['22px', { lineHeight: '28px' }],
        h3: ['18px', { lineHeight: '24px' }],
        body: ['16px', { lineHeight: '22px' }],
        small: ['13px', { lineHeight: '18px' }],
      },
      spacing: {
        screen: '20px',
        card: '16px',
        tight: '12px',
        xs: '8px',
      },
      borderRadius: {
        card: '18px',
        pill: '999px',
      },
    },
  },
  plugins: [],
};
