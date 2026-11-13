import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-brand text-white hover:bg-brand-700",
        dark: "bg-ink text-white hover:bg-black",
        secondary: "bg-soft text-ink hover:bg-line",
        outline: "border border-line bg-white text-ink hover:border-brand/50 hover:text-brand",
        ghost: "text-ink hover:bg-soft",
        danger: "bg-red-600 text-white hover:bg-red-700",
        "danger-outline": "border border-red-200 bg-white text-red-700 hover:bg-red-50",
        link: "h-auto p-0 text-brand underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 px-3 text-[13px]",
        md: "h-10 px-4",
        lg: "h-12 px-6 text-[15px]",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  },
);
