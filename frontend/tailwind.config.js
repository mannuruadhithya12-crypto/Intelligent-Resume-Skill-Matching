/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-deep': '#050B14', // Deeper, richer black/blue
        'bg-card': 'rgba(15, 23, 42, 0.6)', // Glassmorphism base
        'bg-card-hover': 'rgba(30, 41, 59, 0.7)',
        'border-subtle': 'rgba(255, 255, 255, 0.08)',
        'border-highlight': 'rgba(99, 102, 241, 0.5)', // Indigo highlight

        'primary': '#6366F1', // Indigo-500
        'primary-glow': '#818cf8', // Indigo-400
        'secondary': '#EC4899', // Pink-500 for accents

        'text-main': '#F8FAFC',
        'text-muted': '#94A3B8',

        'success': '#10B981', // Emerald-500
        'warning': '#F59E0B', // Amber-500
        'error': '#EF4444', // Red-500
      },
      fontFamily: {
        display: ['Outfit', 'Inter', 'sans-serif'], // Premium font stack
        sans: ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'checkered': "linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)",
        'mesh-gradient': 'radial-gradient(at 0% 0%, rgba(99,102,241,0.15) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(236,72,153,0.15) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(16,185,129,0.15) 0px, transparent 50%)',
      },
      boxShadow: {
        'neon': '0 0 20px rgba(99, 102, 241, 0.5)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
      },
      backdropBlur: {
        'xs': '2px',
      }
    },
  },
  plugins: [],
}
