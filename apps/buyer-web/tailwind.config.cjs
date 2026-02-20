/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('../../docs/design-system/tailwind-preset.js')],
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './app.vue',
  ],
  theme: {
    extend: {
      colors: {
        // Background
        'black': '#000000',
        'dark': '#0A0A0A',
        'charcoal': '#141414',

        // Neon Colors
        'neon-cyan': '#00F0FF',
        'neon-magenta': '#FF00FF',
        'neon-purple': '#A855F7',
        'neon-lime': '#84FF00',
        'neon-orange': '#FF6B00',

        // Semantic
        'success': '#84FF00',
        'warning': '#FBBF24',
        'error': '#FF0055',
        'info': '#00F0FF',

        // Text
        'text-neon': '#00F0FF',
        'text-primary': '#FFFFFF',
        'text-secondary': '#94A3B8',
        'text-muted': '#475569',
      },

      fontFamily: {
        sans: ['Noto Sans TC', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['Orbitron', 'Exo 2', 'sans-serif'],
        mono: ['JetBrains Mono', 'Roboto Mono', 'monospace'],
      },

      backgroundImage: {
        'gradient-cyber': 'linear-gradient(135deg, #00F0FF 0%, #FF00FF 100%)',
        'gradient-triple': 'linear-gradient(135deg, #00F0FF 0%, #A855F7 50%, #FF00FF 100%)',
        'gradient-energy': 'linear-gradient(135deg, #84FF00 0%, #00F0FF 100%)',
        'gradient-rare': 'linear-gradient(135deg, #A855F7 0%, #EC4899 100%)',
        'gradient-epic': 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)',
        'gradient-legendary': 'linear-gradient(135deg, #FF6B00 0%, #FF00FF 100%)',
        'grid-pattern': 'linear-gradient(rgba(0, 240, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 240, 255, 0.05) 1px, transparent 1px)',
      },

      boxShadow: {
        'neon-cyan': '0 0 20px rgba(0, 240, 255, 0.5)',
        'neon-cyan-strong': '0 0 40px rgba(0, 240, 255, 0.8)',
        'neon-magenta': '0 0 20px rgba(255, 0, 255, 0.5)',
        'neon-lime': '0 0 20px rgba(132, 255, 0, 0.5)',
        'glow': '0 0 30px rgba(0, 240, 255, 0.3)',
      },

      animation: {
        'neon-flicker': 'neon-flicker 3s infinite alternate',
        'pulse-danger': 'pulse-danger 2s infinite',
        'blink': 'blink 1s infinite',
        'glitch': 'glitch-animation 5s infinite',
        'grid-scroll': 'grid-scroll 20s linear infinite',
        'float': 'float 8s ease-in-out infinite',
      },

      keyframes: {
        'neon-flicker': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.9' },
        },
        'pulse-danger': {
          '0%, 100%': { boxShadow: '0 0 30px rgba(255, 0, 85, 0.3)' },
          '50%': { boxShadow: '0 0 50px rgba(255, 0, 85, 0.5)' },
        },
        'blink': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
        'glitch-animation': {
          '0%, 90%, 100%': { transform: 'translate(0)' },
          '92%': { transform: 'translate(-2px, 2px)' },
          '94%': { transform: 'translate(2px, -2px)' },
          '96%': { transform: 'translate(-2px, -2px)' },
          '98%': { transform: 'translate(2px, 2px)' },
        },
        'grid-scroll': {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(40px)' },
        },
        'float': {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(50px, 50px)' },
        },
      },
    },
  },
  plugins: [],
}
