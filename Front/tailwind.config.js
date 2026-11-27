/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FBF7F4',
          100: '#F1DDD4',
          200: '#ECDAD2',
          300: '#E2B7A7',
          400: '#D4A392',
          500: '#B87D6B',
          600: '#A86B5A',
          700: '#8C5243',
          800: '#6E3F33',
          900: '#4E3B34',
        },
        mz: {
          cream: '#FBF7F4',
          peach: '#E2B7A7',
          peachLight: '#F1DDD4',
          peachDark: '#D4A392',
          border: '#ECDAD2',
          text: '#2B1E1A',
          heading: '#4E3B34',
          muted: '#53403A',
          emerald: '#0D9B69',
          darkBg: '#1C1513',
          darkCard: '#261D1A',
          darkSurface: '#312521',
          darkBorder: '#3F302B',
        },
      },
    },
  },
  plugins: [],
}
