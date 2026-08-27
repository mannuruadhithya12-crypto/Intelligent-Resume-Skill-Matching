/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Human-Centric Recruitment Color System
        'page': '#FBF9F4',
        'surface-primary': '#FFFFFF',
        'surface-low': '#FBF2ED',
        'surface-container': '#F5ECE7',
        'surface-high': '#EFE6E2',
        'surface-highest': '#E9E1DC',
        
        'primary-sage': '#334F2B',
        'primary-container': '#4A6741',
        'light-sage': '#CAECBC',
        
        'text-primary': '#1E1B18',
        'text-secondary': '#434840',
        
        'outline': '#73796F',
        'outline-variant': '#C3C8BD',
        
        'terracotta': '#974725',
        'terracotta-light': '#FE9970',
        
        'error': '#BA1A1A',

        // Legacy compat (Will be phased out, but keeps app from breaking immediately)
        'primary': '#334F2B',
        'background-light': '#FBF9F4',
        'background-dark': '#FBF9F4', // Dark mode is dropped per design instructions, but we keep the key for now.
      },
      fontFamily: {
        serif: ['"Source Serif 4"', 'serif'],
        sans: ['Manrope', 'sans-serif'],
        display: ['"Source Serif 4"', 'serif'],
      },
      boxShadow: {
        'paper': '0 4px 20px rgba(30, 27, 24, 0.04)',
        'paper-hover': '0 8px 24px rgba(30, 27, 24, 0.08)',
      },
      borderRadius: {
        'card': '16px',
        'card-lg': '20px',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
        'slide-in-right': 'slideInRight 0.4s ease-out forwards',
      },
    },
  },
  plugins: [],
}
