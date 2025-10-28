export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      container: { center: true, padding: "1rem" },
      colors: { brand: { DEFAULT: "#2563eb" } },
      boxShadow: { soft: "0 8px 30px rgba(0,0,0,0.06)" },
      borderRadius: { xl: "1rem", "2xl": "1.25rem" },
      keyframes: {
    fadeIn: {
      '0%': { opacity: 0, transform: 'scale(0.95)' },
      '100%': { opacity: 1, transform: 'scale(1)' },
    },
  },
  animation: {
    fadeIn: 'fadeIn 0.3s ease-out forwards',
  },
    },
  },
  plugins: [],
};
