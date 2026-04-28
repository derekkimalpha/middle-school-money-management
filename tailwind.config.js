/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        sage: {
          DEFAULT: '#7c8c78',
          200: '#c4ccc2',
          300: '#a3ada0',
          400: '#7c8c78',
          500: '#5f6d5b',
          600: '#4b5648',
          700: '#3a4337',
          dark: '#5f6d5b',
          light: '#a3ada0',
          bg: 'rgba(124,140,120,0.07)',
        },
        teal: {
          DEFAULT: '#6b8a87',
          bg: 'rgba(107,138,135,0.07)',
        },
        plum: {
          DEFAULT: '#8B7BA8',
          bg: 'rgba(139,123,168,0.08)',
        },
        amber: {
          DEFAULT: '#a68b5b',
          bg: 'rgba(166,139,91,0.07)',
        },
        rose: {
          DEFAULT: '#a67272',
          bg: 'rgba(166,114,114,0.07)',
        },
        // Notebook palette
        paper: {
          DEFAULT: '#faf8f4',
          warm: '#f3efe8',
          cream: '#f7f3ec',
          dark: '#1e2a1e',
          sidebar: '#243024',
        },
        pencil: {
          DEFAULT: '#e8c840',
          light: '#f5e17a',
          dark: '#c9a520',
          muted: '#d4b84c',
        },
        chalk: {
          DEFAULT: '#f0ece4',
          white: '#f8f5ef',
        },
        margin: '#d94040',
        ruled: '#bfd4e8',
        surface: {
          1: '#FFFFFF',
          2: '#f0eeeb',
          3: '#e5e2de',
          4: '#d4d0cb',
        },
        ink: {
          DEFAULT: '#2c2a27',
          light: '#6b6862',
          muted: '#9c9890',
          faint: '#c7c3bc',
        },
        // ── Gumroad-style design system (blue palette) ──
        cobalt: {
          50:  '#EAF1FF',
          100: '#C9DBFF',
          200: '#9DBCFF',
          400: '#1F6FEB',
          500: '#1856B7',
          600: '#114290',
          700: '#0B3068',
        },
        cream: {
          DEFAULT: '#FAF7F0',
          dark:    '#F2EDE0',
        },
      },
      boxShadow: {
        'gum':     '4px 4px 0 0 #000',
        'gum-sm':  '2px 2px 0 0 #000',
        'gum-lg':  '6px 6px 0 0 #000',
        'gum-pressed': '0px 0px 0 0 #000',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        hand: ['Caveat', 'cursive'],
      },
      backgroundColor: {
        base: '#faf8f4',
      },
      animation: {
        slideUp: 'slideUp 0.5s ease-out forwards',
        fadeIn: 'fadeIn 0.4s ease-in-out forwards',
        scaleIn: 'scaleIn 0.3s ease-out forwards',
        pop: 'pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        shake: 'shake 0.5s ease-in-out',
        float: 'float 3s ease-in-out infinite',
        shimmer: 'shimmer 2s infinite',
        confettiFall: 'confettiFall 2.5s ease-out forwards',
        ringDraw: 'ringDraw 0.8s ease-out forwards',
        countUp: 'countUp 0.3s ease-out forwards',
        badgeUnlock: 'badgeUnlock 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
        streakFire: 'streakFire 0.6s ease-out forwards',
        levelUp: 'levelUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        slideUp: {
          'from': { opacity: '0', transform: 'translateY(20px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
        scaleIn: {
          'from': { opacity: '0', transform: 'scale(0.95)' },
          'to': { opacity: '1', transform: 'scale(1)' },
        },
        pop: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '50%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        confettiFall: {
          'from': { transform: 'translateY(-100%) rotate(0deg)', opacity: '1' },
          'to': { transform: 'translateY(100vh) rotate(360deg)', opacity: '0' },
        },
        ringDraw: {
          'from': { strokeDashoffset: '565.48' },
          'to': { strokeDashoffset: '0' },
        },
        countUp: {
          'from': { opacity: '0', transform: 'translateY(10px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        badgeUnlock: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        streakFire: {
          '0%': { transform: 'scale(0) rotate(-45deg)', opacity: '0' },
          '70%': { transform: 'scale(1.1) rotate(0deg)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        levelUp: {
          '0%': { transform: 'scale(0.5) translateY(20px)', opacity: '0' },
          '50%': { transform: 'scale(1.15)' },
          '100%': { transform: 'scale(1) translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
