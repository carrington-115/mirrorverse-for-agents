import Link from "next/link";

export default function NavLink(props: {
  href: string;
  children: React.ReactNode;
}) {
  const { href, children } = props;

  return (
    <Link
      href={href}
      className="px-[8px] py-[4px] text-[var(--foreground-alt)] text-center font-medium leading-[20px] text-[14px] whitespace-nowrap hover:text-[var(--colors-primary)] dark:text-[var(--colors-black-20)] dark:hover:text-[var(--base-white)]"
    >
      {children}
    </Link>
  );
}
