export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FFF9F5",
        ivory: "#FDF6F0",
        powder: "#A8C5E8",
        blue: "#7FA8D9",
        blush: "#F4B8C1",
        pink: "#E89BA8",
        gold: "#E8C77E",
        slate: "#3D3D3D",
      },
      fontFamily: {
        display: ["Quicksand", "sans-serif"],
        sans: ["DM Sans", "sans-serif"],
      },
      boxShadow: { soft: "0 12px 40px -15px rgb(94 67 50 / 15%)" },
      borderRadius: { "4xl": "2rem" },
    },
  },
  plugins: [],
};
