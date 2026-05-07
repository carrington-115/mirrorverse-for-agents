import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "lg:px-[var(--spacing-32)] md:px-[var(--spacing-20)] font-medium flex-inline no-wrap cursor-pointer px-(--spacing-16) py-(--spacing-12)",

  {
    variants: {
      variant: {
        filled:
          "cursor-pointer bg-[var(--colors-black-70)] text-[var(--base-white)] hover:bg-[var(--colors-black-100)] dark:bg-[var(--colors-black-10)] dark:text-[var(--base-black)] dark:hover:bg-[var(--base-white)]",
        outlined:
          "bg-[var(--colors-on-primary)] text-[var(--colors-primary)] outline outline-1 outline-offset-[-1px] outline-[var(--colors-primary)] hover:bg-[var(--colors-black-10)]/15 dark:bg-[var(--colors-black-80)] dark:text-[var(--colors-black-10)] dark:outline-[var(--colors-black-10)] dark:hover:bg-[var(--colors-black-50)] hover:dark:text-[var(--colors-black-0)]",
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
  },
);
