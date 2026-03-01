/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                orange: {
                    50: '#fff7ed',
                    100: '#ffedd5',
                    200: '#fed7aa',
                    300: '#fdba74',
                    400: '#fb923c',
                    500: '#FF7F00',
                    600: '#e06c00',
                    700: '#c2410c',
                    800: '#9a3412',
                    900: '#7c2d12',
                    950: '#431407',
                },
                admin: {
                    primary: '#F06500',
                },
                manager: {
                    primary: '#FF5C28',
                },
            },
        },
    },
    plugins: [],

    extend: {
  colors: {
    primary: "#ff8000",
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
}

}
