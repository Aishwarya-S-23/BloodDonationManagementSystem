/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep burgundy / wine
        primary: {
          50: '#fdf3f4',
          100: '#fae5e7',
          200: '#f2c9cd',
          300: '#e59ca3',
          400: '#d06570',
          500: '#BC2F3C', // Base Deep Burgundy
          600: '#A22834',
          700: '#802029',
          800: '#6E1E2A', // Muted Wine - Main Primary as per brief
          900: '#4D151D',
        },
        // Warm off-white / ivory background
        'background-light': {
          50: '#fffefb',
          100: '#fcfbf7',
          200: '#f8f6f2',
          300: '#f2ede4',
          400: '#e9e2d5',
          500: '#ded4c5',
        },
        // Soft rose / muted coral accents
        rose: {
          50: '#fffafa',
          100: '#fef4f4',
          200: '#fce3e3',
          300: '#f7c2c2',
          400: '#f09b9b',
          500: '#e67b7b',
        },
        coral: {
          50: '#fff6f3',
          100: '#ffece6',
          200: '#ffd4c6',
          300: '#ffb59e',
          400: '#ff8f70',
          500: '#ff6a40',
        },
        // Charcoal / slate text - WCAG AA compliant
        slate: {
          50: '#f8f9fa',
          100: '#e9ecef',
          200: '#dee2e6',
          300: '#ced4da',
          400: '#adb5bd',
          500: '#6c757d',
          600: '#495057',
          700: '#343a40',
          800: '#2d3436', // Darker for better contrast
          900: '#1a1d20',
        },
        // Emergency highlights (amber / deep coral for alerts, deep maroon for error)
        emergency: {
          DEFAULT: '#D06570', // Deep Coral for urgency
          light: '#F09B9B', // Lighter shade for banner
          dark: '#6E1E2A', // Deep Maroon for error, matching primary 800
          glow: 'rgba(208, 101, 112, 0.4)',
        },
        // Success (muted green)
        success: {
          50: '#f0fdf4',
          100: '#dcfce6',
          200: '#bcf7cc',
          300: '#8fedac',
          400: '#59e088',
          500: '#31c464', // Base Muted Green
          600: '#28a052',
          700: '#1e7e3d',
          800: '#145b29',
          900: '#0a3715',
        },
        // Warning (amber)
        warning: {
          50: '#fffbeb',
          100: '#fff4c7',
          200: '#ffe89b',
          300: '#ffd660',
          400: '#ffbc20',
          500: '#f59e0b', // Base Amber
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Poppins', 'Inter', 'sans-serif'],
      },
      fontSize: {
        'display-1': ['clamp(2.5rem, 5vw, 3.5rem)', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-2': ['clamp(2rem, 4vw, 2.75rem)', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'display-3': ['clamp(1.5rem, 3vw, 2.25rem)', { lineHeight: '1.3' }],
        'fluid-sm': ['clamp(0.875rem, 2vw, 1rem)', { lineHeight: '1.5' }],
        'fluid-base': ['clamp(1rem, 2.5vw, 1.125rem)', { lineHeight: '1.6' }],
        'fluid-lg': ['clamp(1.125rem, 3vw, 1.25rem)', { lineHeight: '1.5' }],
        'fluid-xl': ['clamp(1.25rem, 3.5vw, 1.5rem)', { lineHeight: '1.4' }],
        'fluid-2xl': ['clamp(1.5rem, 4vw, 2rem)', { lineHeight: '1.3' }],
        'fluid-3xl': ['clamp(1.875rem, 4.5vw, 2.5rem)', { lineHeight: '1.2' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'soft-lg': '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'glow': '0 0 20px rgba(139, 38, 53, 0.3)',
        'glow-sm': '0 0 10px rgba(139, 38, 53, 0.2)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'pulse-soft': 'pulse-soft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fade-in 0.3s ease-in-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
        'lift': 'lift 0.2s ease-out',
      },
      keyframes: {
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'lift': {
          '0%': { transform: 'translateY(0)', boxShadow: '0 2px 15px -3px rgba(0, 0, 0, 0.07)' },
          '100%': { transform: 'translateY(-2px)', boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1)' },
        },
      },
    },
  },
  plugins: [],
}

