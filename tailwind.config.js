/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}", "./lib/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        canvas: token("canvas"),
        surface: token("surface"),
        ink: token("ink"),
        soft: token("soft"),
        line: token("line"),
        primary: token("primary"),
        "on-primary": token("on-primary"),
        mark: token("mark"),
        "on-mark": token("on-mark"),
        danger: token("danger"),
        ok: token("ok"),
        warn: token("warn"),
      },
      fontFamily: {
        serif: ["Literata", "Georgia", "Cambria", "Times New Roman", "serif"],
        sans: ["IBM Plex Sans", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Arial", "sans-serif"],
      },
      maxWidth: { prose: "68ch" },
    },
  },
  plugins: [],
};
