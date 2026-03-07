/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0f0f0f',
          secondary: '#1a1a1a',
          card: '#222222',
          hover: '#2a2a2a',
          border: '#333333',
        },
        relevance: {
          alta: '#c0392b',
          media: '#b8860b',
          baixa: '#2563eb',
        },
        performance: {
          green: '#16a34a',
          yellow: '#d97706',
          red: '#dc2626',
        },
        status: {
          ok: '#16a34a',
          warn: '#d97706',
          late: '#dc2626',
        },
      },
    },
  },
  plugins: [],
};
