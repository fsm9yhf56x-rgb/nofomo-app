import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Zen palette
        sage: {
          50: '#f6f7f6',
          100: '#e3e7e3',
          200: '#c7cfc7',
          300: '#a8b5a0',  // Main sage green
          400: '#8a9a82',
          500: '#6d7d67',
          600: '#566352',
          700: '#455043',
        },
        slate: {
          50: '#f8f9fa',
          100: '#e9ecef',
          200: '#dee2e6',
          300: '#6b7b8c',  // Main slate blue
          400: '#5a6a7a',
          500: '#495869',
          600: '#384757',
          700: '#2d3a47',
        },
        beige: {
          50: '#fafaf8',
          100: '#f5f1e8',  // Main beige
          200: '#e8dcc4',
          300: '#d4c5a9',
          400: '#c0ae8e',
          500: '#a89674',
        },
        lavender: {
          50: '#f9f8fa',
          100: '#f0edf3',
          200: '#e0dae6',
          300: '#c5b9cd',  // Main lavender
          400: '#aa98b4',
          500: '#8f779b',
        },
        gold: {
          50: '#faf8f0',
          100: '#f5f0e0',
          200: '#ebe0c0',
          300: '#d4af37',  // Gentle gold
          400: '#c09a2f',
          500: '#a68527',
        }
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'breathe': 'breathe 4s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.02)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;