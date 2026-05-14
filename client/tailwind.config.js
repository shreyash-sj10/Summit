/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
    theme: {
        extend: {
            colors: {
                'saffron': '#0d9488',
                'india-green': '#475569',
                'ashoka-blue': '#312e81',
                'accent': '#f59e0b',
                'alert-red': '#dc2626',
                'neutral-dark': '#0f172a',
                'background-light': '#f1f5f9',
            },
            fontFamily: {
                display: ['Inter', 'Plus Jakarta Sans', 'sans-serif'],
            },
            animation: {
                'spin-slow': 'spin-slow 8s linear infinite',
                'wave-gradient': 'wave-gradient 3s linear infinite',
            },
            keyframes: {
                'spin-slow': {
                    from: { transform: 'rotate(0deg)' },
                    to: { transform: 'rotate(360deg)' },
                },
                'wave-gradient': {
                    '0%': { backgroundPosition: '0% 50%' },
                    '50%': { backgroundPosition: '100% 50%' },
                    '100%': { backgroundPosition: '0% 50%' },
                },
            },
            boxShadow: {
                soft: '0 4px 20px -2px rgba(0,0,0,0.05)',
            },
        },
    },
    plugins: [],
};
