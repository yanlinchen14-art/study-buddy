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
        cream: {
          50: '#FFFAF5',
          100: '#FEF5E8',
          200: '#FDE9D5',
          300: '#FCD4AF',
          400: '#F5B573',
          500: '#E89B3C',
          600: '#D98530',
          700: '#C26D2A',
        },
        mint: {
          50: '#F0F9F7',
          100: '#D4F0E8',
          200: '#A8E0D1',
          300: '#7CCFBB',
          400: '#5DBD9F',
          500: '#3DAB83',
          600: '#2D8B6A',
          700: '#1F6B51',
        },
        lavender: {
          50: '#F8F5FC',
          100: '#EFE9F9',
          200: '#DFD2F3',
          300: '#CFBBED',
          400: '#B8A3E5',
          500: '#9F85D1',
          600: '#8B6BBC',
          700: '#7451A7',
        },
        sky: {
          50: '#F0F8FF',
          100: '#E0F2FE',
          200: '#B9E3FE',
          300: '#7FD0FA',
          400: '#37BFEC',
          500: '#0EA5E9',
          600: '#0284C7',
          700: '#0369A1',
        },
      },
      borderRadius: {
        '3xl': '1.5rem',
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0,0,0,0.08)',
        'soft-md': '0 4px 12px rgba(0,0,0,0.1)',
        'soft-lg': '0 8px 16px rgba(0,0,0,0.12)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
}
export default config
