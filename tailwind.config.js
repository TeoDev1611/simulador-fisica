/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './index.html',
        './src/**/*.{vue,js,ts,jsx,tsx}'
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                espe: {
                    green: '#065f46',
                    accent: '#10b981'
                }
            }
        }
    },
    plugins: []
}