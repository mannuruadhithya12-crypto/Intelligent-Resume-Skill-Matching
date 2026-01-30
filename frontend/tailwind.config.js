/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-deep': '#0B0E14',
        'bg-card': '#151A23',
        'border-subtle': '#272E3B',
        'primary': '#4F46E5', // Indigo-600
        'primary-light': '#6366F1', // Indigo-500
        'background-light': '#F8FAFC', // Slate-50
        'background-dark': '#0B0E14', // Same as bg-deep
        'teal-accent': '#2DD4BF', // Teal-400
      },
      fontFamily: {
        display: ['Inter', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
