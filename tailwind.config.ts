module.exports = {
  mode: "jit",
  // These paths are just examples, customize them to match your project structure
  purge: ["./public/**/*.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f0f5ff",
          100: "#e0eaff",
          200: "#c7d7ff",
          300: "#a3baff",
          400: "#7895ff",
          500: "#4f6bff",
          600: "#3a4cfa",
          700: "#3035e7",
          800: "#2a2cc0",
          900: "#282f99",
        },
      },
    },
  },
  // ...
};
