/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      keyframes: {
        'flash-green': {
          '0%': { backgroundColor: '#4ade80' },
          '100%': { backgroundColor: 'transparent' },
        },
      },
      animation: {
        'flash-green': 'flash-green 1s ease-out',
      },
    },
  },
  plugins: [],
}

