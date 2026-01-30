/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'medical': {
                    50: '#F8FAFC', // Clinical White / Background
                    100: '#F1F5F9',
                    900: '#2563EB', // Primary Blue
                },
                'status': {
                    available: '#10B981', // Emerald
                    occupied: '#E11D48',  // Rose
                    cleaning: '#F59E0B',  // Amber
                    reserved: '#6366F1',  // Indigo
                }
            }
        },
    },
    plugins: [],
}
