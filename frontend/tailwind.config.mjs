/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background, 0 0% 100%))',
        foreground: 'hsl(var(--foreground, 0 0% 0%))',

        card: 'hsl(var(--card, 0 0% 100%))',
        'card-foreground': 'hsl(var(--card-foreground, 0 0% 0%))',

        popover: 'hsl(var(--popover, 0 0% 100%))',
        'popover-foreground': 'hsl(var(--popover-foreground, 0 0% 0%))',

        primary: 'hsl(var(--primary, 240 100% 50%))',
        'primary-foreground': 'hsl(var(--primary-foreground, 0 0% 100%))',

        secondary: 'hsl(var(--secondary, 210 100% 50%))',
        'secondary-foreground': 'hsl(var(--secondary-foreground, 0 0% 100%))',

        muted: 'hsl(var(--muted, 210 15% 85%))',
        'muted-foreground': 'hsl(var(--muted-foreground, 210 10% 25%))',

        accent: 'hsl(var(--accent, 30 100% 50%))',
        'accent-foreground': 'hsl(var(--accent-foreground, 0 0% 100%))',

        destructive: 'hsl(var(--destructive, 0 85% 60%))',
        'destructive-foreground': 'hsl(var(--destructive-foreground, 0 0% 100%))',

        border: 'hsl(var(--border, 0 0% 80%))',
        input: 'hsl(var(--input, 0 0% 90%))',
        ring: 'hsl(var(--ring, 240 100% 50%))',
      },
      borderRadius: {
        lg: 'var(--radius, 12px)',
        md: 'calc(var(--radius, 12px) - 2px)',
        sm: 'calc(var(--radius, 12px) - 4px)',
      },
    },
  },
  plugins: [],
};
