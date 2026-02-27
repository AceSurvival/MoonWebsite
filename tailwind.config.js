/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Moon Beauty Alchemy – deep space & gold palette
        purple: {
          // Repurposed as warm gold accents across the site
          400: '#facc6b',
          500: '#fbbf24',
          600: '#eab308',
          700: '#ca8a04',
        },
        brand: {
          DEFAULT: '#eab308', // primary gold
          light: '#facc6b',
          dark: '#854d0e',
        },
        neon: {
          // Subtle teal kept for calculator accents, etc.
          purple: '#facc6b',
          teal: '#14B8A6',
        },
      },
      fontFamily: {
        sans: ['var(--font-poppins)', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}


