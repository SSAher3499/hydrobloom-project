/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        neon: {
          cyan: '#00ffff',
          green: '#39ff14',
          pink: '#ff073a',
          blue: '#1b03a3',
          yellow: '#ffff00',
        },
      },
      backgroundImage: {
        'gradient-neon': 'linear-gradient(135deg, #00ffff 0%, #39ff14 100%)',
        'gradient-dark': 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      },
      boxShadow: {
        'neon': '0 0 20px rgba(0, 255, 255, 0.5)',
        'neon-green': '0 0 20px rgba(57, 255, 20, 0.5)',
        'neon-pink': '0 0 20px rgba(255, 7, 58, 0.5)',
      },
      animation: {
        'pulse-neon': 'pulse-neon 2s infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        'pulse-neon': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(0, 255, 255, 0.5)' },
          '50%': { boxShadow: '0 0 20px rgba(0, 255, 255, 0.8), 0 0 30px rgba(0, 255, 255, 0.3)' },
        },
        'glow': {
          'from': { textShadow: '0 0 10px rgba(0, 255, 255, 0.8)' },
          'to': { textShadow: '0 0 20px rgba(0, 255, 255, 1), 0 0 30px rgba(0, 255, 255, 1)' },
        },
      },
    },
  },
  plugins: [],
}