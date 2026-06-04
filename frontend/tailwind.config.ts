import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Rubik', 'sans-serif'],
      },
      colors: {
        slate: {
          850: '#1a2234',
        },
      },
    },
  },
  plugins: [],
} satisfies Config
