import Image from "next/image";
import Link from "next/link";
import logoLight from "@/assets/logo-light.svg";
import logoDark from "@/assets/logo-dark.svg";
import workflowUI from "@/assets/workflow.svg";

export function AuthDetail() {
  return (
    <div className="lg:flex relative hidden h-screen w-1/2 flex-col overflow-y-hidden bg-secondary">
      <div className="flex flex-col gap-[80px] pt-[26px] pl-[17px]">
        <div className="flex w-[95%] items-center justify-between">
          <Link href="https://mirrro-ai-website.vercel.app/">
            <div className="flex h-auto w-[102px]">
              <Image src={logoLight} alt="Mirrro" className="block h-auto w-full dark:hidden" />
              <Image src={logoDark} alt="Mirrro" className="hidden h-auto w-full dark:block" />
            </div>
          </Link>
        </div>

        <h1 className="font-semibold w-[55%] text-[30px] leading-(--heading-2-line-height)">
          The Platform that helps your organization to go on AutoPilot
        </h1>
      </div>
      <Image
        className="absolute bottom-[-60px] left-[-62px] h-auto w-[1000px] rounded-r-2xl border-t-[5px] border-r-[5px] border-border"
        src={workflowUI}
        alt="Workflow UI"
      />
    </div>
  );
}
