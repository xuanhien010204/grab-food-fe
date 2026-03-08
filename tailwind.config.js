/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: '#C76E00',
                orange: {
                    50: '#fff7ed',
                    100: '#ffedd5',
                    200: '#fed7aa',
                    300: '#fdba74',
                    400: '#fb923c',
                    500: '#C76E00', // Replacing old orange with brand color
                    600: '#a55b00',
                    700: '#844900',
                    800: '#633700',
                    900: '#422500',
                    950: '#211200',
                },
                primary: "#C76E00",
                "background-light": "#f8f7f5",
                "background-dark": "#23190f",
                "admin-sidebar": "#1d140c",
                "admin-border": "#eadbcd",
            },
            fontFamily: {
                display: ["Be Vietnam Pro", "system-ui", "sans-serif"],
            },
            borderRadius: {
                xl: "1.5rem",
            },
        },
    },
    plugins: [],
}
