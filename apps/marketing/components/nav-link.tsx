import Link from "next/link";

export default function NavLink(props: { href: string; children: React.ReactNode }) {
  const { href, children } = props;

  return (
    <Link
      href={href}
      className="font-medium px-[8px] py-[4px] text-center text-[14px] leading-[20px] whitespace-nowrap text-(--foreground-alt) hover:text-(--colors-primary) dark:text-(--colors-black-20) dark:hover:text-(--base-white)"
    >
      {children}
    </Link>
  );
}
