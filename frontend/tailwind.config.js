/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        shopPurple: "#7c3aed",
        shopPink: "#ec4899",
      },
      boxShadow: {
        neon: "0 0 30px rgba(129, 140, 248, 0.55)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        spinSlow: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      animation: {
        float: "float 8s ease-in-out infinite",
        "spin-slow": "spinSlow 18s linear infinite",
      },
    },
  },
  plugins: [],
};
