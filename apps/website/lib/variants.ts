import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "px-[var(--spacing-16)] lg:px-[var(--spacing-32)] md:px-[var(--spacing-20)] cursor-pointer py-[var(--spacing-12)] font-medium flex-inline no-wrap",

  {
    variants: {
      variant: {
        filled:
          "bg-[var(--colors-black-70)] dark:bg-[var(--colors-black-10)] text-[var(--base-white)] dark:text-[var(--base-black)] cursor-pointer hover:bg-[var(--colors-black-100)] dark:hover:bg-[var(--base-white)]",
        outlined:
          "bg-[var(--colors-on-primary)] dark:bg-[var(--colors-black-80)] outline outline-1 outline-[var(--colors-primary)] dark:outline-[var(--colors-black-10)] hover:bg-[var(--colors-black-10)]/15 outline-offset-[-1px] text-[var(--colors-primary)] dark:text-[var(--colors-black-10)] hover:dark:text-[var(--colors-black-0)] dark:hover:bg-[var(--colors-black-50)]",
      },
      round: {
        full: "rounded-full",
        corner: "rounded-[var(--radius-sm)]",
      },
      size: {
        normal: "font-medium",
        medium: "text-base",
        sm: "text-xs",
      },
    },
    defaultVariants: {
      variant: "filled",
      round: "full",
    },
  }
);
