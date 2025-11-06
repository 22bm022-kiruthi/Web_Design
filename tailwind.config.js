/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0f62fe',
          50: '#e8f0ff',
          100: '#d7e6ff',
          200: '#b6d1ff',
          300: '#8ab2ff',
          400: '#5c93ff',
          500: '#0f62fe',
          600: '#0b4de0',
          700: '#083bb5',
          800: '#062c85',
          900: '#041c55',
        },
        accent: {
          DEFAULT: '#00b4ff',
        },
        muted: {
          DEFAULT: '#6b7280',
        },
      },
      boxShadow: {
        card: '0 6px 20px rgba(2,6,23,0.08)',
        soft: '0 4px 14px rgba(15,98,254,0.08)'
      },
      borderRadius: {
        xl: '12px',
      }
    },
  },
  plugins: [],
};
