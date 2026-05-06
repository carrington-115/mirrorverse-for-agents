import DashboardLogo from "../../assets/logo-light.svg";
import Image from "next/image";
import Link from "next/link";

export default function AccountSetupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-screen h-[100vh] flex flex-col items-center justify-between">
      <div className="w-full flex justify-left">
        <div className="w-[102px] h-auto pl-[16px] pt-[26px]">
          <Link href="https://mirrro-ai-website.vercel.app/">
            <Image src={DashboardLogo} alt="Logo" className="w-full h-full" />
          </Link>
        </div>
      </div>
      <div className="w-full flex justify-center items-center">{children}</div>
      <div className="w-full flex justify-center items-center mb-[60px]">
        <p className="text-center max-w-[350px] text-sm text-muted-foreground font-normal leading-[var(--body-1-line-height)]">
          By clicking continue, you agree to our&nbsp;
          <Link
            href="https://www.notion.so/Mirrroverse-Privacy-Policy-05cef81cb4c944a5ab6cb13d034dd873?source=copy_link"
            className="text-primary underline"
            target="_blank"
          >
            Terms of Service
          </Link>
          &nbsp;and&nbsp;
          <Link
            href="https://www.notion.so/Mirrroverse-Privacy-Policy-05cef81cb4c944a5ab6cb13d034dd873?source=copy_link"
            className="text-primary underline"
            target="_blank"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
