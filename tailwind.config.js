/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./public/**/*.{html,js}",
    "./src/**/*.{html,js}",
    "./views/**/*.html"
  ],
  theme: {
    extend: {
      colors: {
        'reddit-orange': '#FF4500',
        'reddit-blue': '#0079D3',
        'dark-bg': '#1A1A1B',
        'card-bg': '#272729',
        'text-primary': '#D7DADC',
        'text-secondary': '#818384'
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s infinite'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        }
      }
    },
  },
  plugins: [],
} 