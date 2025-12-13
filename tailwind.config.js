/** @type {import('tailwindcss').Config} */
// Base Tailwind pour scanner les dossiers clés du projet modulaire.
// TODO: Ajouter un thème typographique cohérent et des tokens (couleurs, radius, spacing).
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/modules/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {}
  },
  plugins: []
};
