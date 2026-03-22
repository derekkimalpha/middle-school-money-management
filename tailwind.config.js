/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        sage: {
          DEFAULT: '#7EA58C',
          200: '#C2D8C9',
          300: '#A8C5B0',
          400: '#7EA58C',
          500: '#5E8A6C',
          600: '#4A7058',
          700: '#385644',
          dark: '#5E8A6C',
          light: '#A8C5B0',
          bg: 'rgba(126,165,140,0.08)',
        },
        teal: {
          DEFAULT: '#5BA3A0',
          bg: 'rgba(91,163,160,0.08)',
        },
        plum: {
          DEFAULT: '#8B7BA8',
          bg: 'rgba(139,123,168,0.08)',
        },
        amber: {
          DEFAULT: '#C49A5C',
          bg: 'rgba(196,154,92,0.08)',
        },
        rose: {
          DEFAULT: '#C47070',
          bg: 'rgba(196,112,112,0.08)',
        },
        surface: {
          1: '#FFFFFF',
          2: '#EAEDE5',
          3: '#DDE1D8',
          4: '#C5C9C0',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
      },
      backgroundColor: {
        base: '#F5F5F0',
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
