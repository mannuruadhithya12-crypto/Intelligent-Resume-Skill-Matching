/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Stitch Design System Colors
        'primary': '#137fec',
        'background-light': '#f6f7f8',
        'background-dark': '#101922',

        // Legacy / Existing App Backgrounds
        'bg-deep': '#050B14', 
        'bg-card': '#0f172a', 
        'bg-card-hover': '#1e293b',
        'border-subtle': '#1f2937', 
        'border-highlight': 'rgba(99, 102, 241, 0.5)',

        'primary-glow': '#3b82f6',
        'secondary': '#9333ea',

        'text-main': '#f8fafc',
        'text-muted': '#9ca3af',

        'success': '#10b981',
        'warning': '#f59e0b',
        'error': '#ef4444',
      },
      fontFamily: {
        display: ['Outfit', 'Inter', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'mesh-gradient': 'radial-gradient(at 0% 0%, rgba(37,99,235,0.15) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(147,51,234,0.15) 0px, transparent 50%)',
      },
      boxShadow: {
        'neon': '0 0 20px rgba(37, 99, 235, 0.5)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'card': '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.2)', // shadow-xl equivalent for dark mode
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
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)', boxShadow: '0 0 25px rgba(37, 99, 235, 0.6)' },
        },
        skeletonProgress: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        }
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.4s ease-out forwards',
        'pulse-glow': 'pulseGlow 2s infinite',
        'skeleton': 'skeletonProgress 1.5s infinite linear',
      },
    },
  },
  plugins: [],
}
