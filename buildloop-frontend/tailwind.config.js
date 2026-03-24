/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        base: '#0a0a0f',
        'base-2': '#111116',
        'base-3': '#1a1a1f',
        brand: '#3B5BDB',
        success: '#10b981',
        warn: '#f59e0b',
        danger: '#ef4444',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        card: '12px',
        input: '8px',
        pill: '9999px',
      },
      boxShadow: {
        'glow-brand': '0 0 40px rgba(59, 91, 219, 0.15)',
        'glow-success': '0 0 20px rgba(16, 185, 129, 0.15)',
      },
    },
  },
  plugins: [],
}
