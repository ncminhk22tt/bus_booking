/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0E1726",
        mist: "#F3F7FF",
        sand: "#FFFFFF",
        brand: {
          50: "#EEF5FF",
          100: "#DCEBFF",
          200: "#BCD8FF",
          300: "#8CBBFF",
          400: "#5B9CFF",
          500: "#2F80ED",
          600: "#216DD6",
          700: "#1B58AF",
          800: "#184A8F",
          900: "#173F75"
        },
        accent: {
          100: "#EAF3FF",
          200: "#C9E0FF",
          300: "#9DC5FF",
          400: "#6AA4F8"
        }
      },
      fontFamily: {
        display: ["Be Vietnam Pro", "Manrope", "system-ui", "sans-serif"],
        body: ["Manrope", "system-ui", "sans-serif"]
      },
      boxShadow: {
        soft: "0 18px 45px rgba(15, 23, 38, 0.12)",
        card: "0 10px 30px rgba(9, 23, 39, 0.08)"
      },
      backgroundImage: {
        hero: "radial-gradient(circle at 10% 10%, rgba(255,255,255,.18), transparent 35%), radial-gradient(circle at 80% 20%, rgba(150,200,255,.22), transparent 35%), linear-gradient(135deg, #1f6fde 0%, #2f80ed 45%, #3c91ff 100%)"
      }
    }
  },
  plugins: []
}
