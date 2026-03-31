/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2563EB',
        'primary-600': '#1D4ED8',
        secondary: '#22C55E',
        bg: '#F8FAFC',
        surface: '#FFFFFF',
        muted: '#6B7280',
        text: '#0F172A',
        success: '#16A34A',
        danger: '#DC2626'
      },
      spacing: {
        'xs': '8px',
        'sm': '12px',
        'md': '24px'
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '10px',
        lg: '16px'
      },
      boxShadow: {
        sm: '0 1px 2px rgba(16,24,40,0.04)',
        md: '0 6px 18px rgba(16,24,40,0.08)'
      },
      fontSize: {
        '2xl': ['32px', { lineHeight: '1.1' }],
        xl: ['24px', { lineHeight: '1.15' }],
        lg: ['20px', { lineHeight: '1.2' }],
        base: ['16px', { lineHeight: '1.5' }],
        sm: ['13px', { lineHeight: '1.4' }]
      }
    }
  },
  plugins: []
}
