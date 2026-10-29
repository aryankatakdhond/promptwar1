import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ivory: {
          DEFAULT: '#FDFAF4',
          50: '#FEFCF8',
          100: '#FDFAF4',
          200: '#FAF4E6',
        },
        midnight: {
          DEFAULT: '#1A1F2E',
          50: '#F0F1F4',
          100: '#D0D3DC',
          200: '#8A90A4',
          300: '#5A6178',
          400: '#3D4459',
          700: '#141827',
          800: '#0E1020',
          900: '#080A13',
        },
        terracotta: {
          DEFAULT: '#C4613A',
          50: '#FAF0EB',
          100: '#F2D5C8',
          200: '#E5AB91',
          300: '#D8815A',
          400: '#CE6E45',
          600: '#A8522F',
          700: '#8C4326',
          800: '#703520',
          900: '#542618',
        },
        sage: {
          DEFAULT: '#7A9E7E',
          50: '#EFF5F0',
          100: '#D5E6D7',
          200: '#ABCDB0',
          300: '#81B488',
          400: '#7EA983',
          600: '#638268',
          700: '#4D6651',
          800: '#374A3B',
          900: '#212E24',
        },
        gold: {
          DEFAULT: '#C9A84C',
          50: '#FBF6E8',
          100: '#F4E8C4',
          200: '#EAD389',
          300: '#DFBE4D',
          400: '#D4AD4A',
          600: '#A88A3E',
          700: '#876B30',
          800: '#664D22',
          900: '#452E14',
        },
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', 'serif'],
      },
      borderRadius: {
        brand: '0.375rem',
      },
    },
  },
  plugins: [],
}

export default config
