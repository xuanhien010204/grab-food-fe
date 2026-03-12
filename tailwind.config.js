/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: '#ff8000', // Original vibrant orange
                'dark-orange': '#C76E00',
                cream: '#FFFBF0',
                charcoal: '#1B1C1E',
                orange: {
                    50: '#fff7ed',
                    100: '#ffedd5',
                    200: '#fed7aa',
                    300: '#fdba74',
                    400: '#fb923c',
                    500: '#FF7F00', // Restored original vibrant orange
                    600: '#e06c00',
                    700: '#c2410c',
                    800: '#9a3412',
                    900: '#7c2d12',
                    950: '#431407',
                },
                primary: "#ff8000", // Restored original primary orange
                "background-light": "#f8f7f5", // Restored original off-white
                "background-dark": "#23190f", // Restored original dark theme
                "admin-sidebar": "#1B1C1E",
                "admin-border": "#eadbcd",
            },
            fontFamily: {
                sans: ["Inter", "system-ui", "sans-serif"],
                display: ["Inter", "system-ui", "sans-serif"],
            },
            borderRadius: {
                xl: "1.5rem",
            },
        },
    },
    plugins: [],
}
