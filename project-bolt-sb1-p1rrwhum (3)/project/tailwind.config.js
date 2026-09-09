/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        neon: {
          50: '#e6f4ff',
          100: '#b3dbff',
          200: '#80c3ff',
          300: '#4daaff',
          400: '#1e90ff',
          500: '#0078e6',
          600: '#0060b8',
          700: '#004880',
          800: '#00304d',
          900: '#001826',
        },
        surface: {
          900: '#0a0a0a',
          800: '#0f0f0f',
          700: '#161616',
          600: '#1e1e1e',
          500: '#2a2a2a',
        },
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'neon-sm': '0 0 8px rgba(30, 144, 255, 0.3)',
        'neon-md': '0 0 16px rgba(30, 144, 255, 0.4)',
        'neon-lg': '0 0 24px rgba(30, 144, 255, 0.5)',
        'neon-xl': '0 0 40px rgba(30, 144, 255, 0.6)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        glow: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(30, 144, 255, 0.3)' },
          '50%': { boxShadow: '0 0 24px rgba(30, 144, 255, 0.6)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
