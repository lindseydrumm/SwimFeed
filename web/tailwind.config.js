/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          850: '#1e293b', // Custom in-between shade
          900: '#0f172a',
          950: '#020617',
        },
        cyan: {
          400: '#00D4FF', // Electric Blue
          500: '#06b6d4',
          900: '#164e63',
        },
        amber: {
          400: '#FFD700', // Gold
          500: '#f59e0b',
        },
        emerald: {
          400: '#34d399',
          500: '#10b981',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}

