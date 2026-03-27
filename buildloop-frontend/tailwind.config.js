/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        card: { DEFAULT: "hsl(var(--card) / <alpha-value>)", foreground: "hsl(var(--card-foreground) / <alpha-value>)" },
        popover: { DEFAULT: "hsl(var(--popover) / <alpha-value>)", foreground: "hsl(var(--popover-foreground) / <alpha-value>)" },
        primary: { DEFAULT: "hsl(var(--primary) / <alpha-value>)", foreground: "hsl(var(--primary-foreground) / <alpha-value>)" },
        secondary: { DEFAULT: "hsl(var(--secondary) / <alpha-value>)", foreground: "hsl(var(--secondary-foreground) / <alpha-value>)" },
        muted: { DEFAULT: "hsl(var(--muted) / <alpha-value>)", foreground: "hsl(var(--muted-foreground) / <alpha-value>)" },
        accent: { DEFAULT: "hsl(var(--accent) / <alpha-value>)", foreground: "hsl(var(--accent-foreground) / <alpha-value>)" },
        destructive: { DEFAULT: "hsl(var(--destructive) / <alpha-value>)", foreground: "hsl(var(--destructive-foreground) / <alpha-value>)" },
        ring: "hsl(var(--ring) / <alpha-value>)",
        brand:   { DEFAULT: '#3B5BDB', light: '#5C7CFA', dark: '#364FC7' },
        success: { DEFAULT: '#0CA678', light: '#E6F9F3' },
        warn:    { DEFAULT: '#F59E0B', light: '#FEF9EB' },
        danger:  { DEFAULT: '#EF4444', light: '#FEF2F2' },
        bg:      '#F4F6FB',
        surface: '#FFFFFF',
        border:  '#E2E8F0',
        ink:     { DEFAULT: '#000000', 2: '#2D3748', 3: '#4A5568' },
        sidebar: { DEFAULT: '#1E2130', 2: '#262B3D' },
        base: '#0a0a0f',
        'base-2': '#111116',
        'base-3': '#1a1a1f',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        card:  '12px',
        input: '8px',
        pill:  '9999px',
      },
      boxShadow: {
        'glow-brand': '0 0 40px rgba(59, 91, 219, 0.15)',
        'glow-success': '0 0 20px rgba(16, 185, 129, 0.15)',
      },
    },
  },
  plugins: [],
}
