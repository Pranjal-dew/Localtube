/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        yt: {
          dark: '#0f0f0f',
          surface: '#1f1f1f',
          hover: '#272727',
          border: '#3f3f3f',
          red: '#ff0000',
          blue: '#3ea6ff',
          green: '#2ba640',
          yellow: '#fbc02d',
          text: '#f1f1f1',
          muted: '#aaa'
        }
      },
      fontFamily: {
        sans: ['Roboto', 'Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
