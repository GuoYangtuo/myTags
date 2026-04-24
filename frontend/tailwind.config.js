/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      'xs': '480px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
    },
    extend: {
      colors: {
        'bg-primary': '#F5F0EB',
        'bg-secondary': '#EDE7DD',
        'bg-card': '#FFFFFF',
        'text-primary': '#1A1614',
        'text-secondary': '#6B635A',
        'accent-primary': '#FF6B35',
        'accent-secondary': '#4ECDC4',
        'accent-tertiary': '#9B5DE5',
        'accent-warn': '#F7A072',
        'border-strong': '#1A1614',
        'border-light': '#D4CEC6',
        'confidence-high': '#22C55E',
        'confidence-mid': '#EAB308',
        'confidence-low': '#94A3B8',
      },
      fontFamily: {
        heading: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      padding: {
        'safe-bottom': 'env(safe-area-inset-bottom)',
      },
      margin: {
        'safe-bottom': 'env(safe-area-inset-bottom)',
      },
    },
  },
  plugins: [],
}
