import Image from "next/image";
import logoLight from "@/assets/logo-light.svg";
import workflowUI from "@/assets/workflow.svg";
import Link from "next/link";

export default function AuthDetail() {
  return (
    <div className="w-1/2 h-[100vh] relative flex flex-col bg-secondary overflow-y-hidden">
      <div className="flex flex-col gap-[80px] pl-[17px] pt-[26px]">
        <div className="flex w-[95%] items-center justify-between">
          <Link href="https://mirrro-ai-website.vercel.app/">
            <div className="w-[102px] h-auto flex">
              <Image
                src={logoLight}
                alt="Logo light"
                className="w-full h-auto"
              />
            </div>
          </Link>
        </div>

        <h1 className="text-[30px] w-[55%] font-semibold leading-[var(--heading-2-line-height)]">
          The Platform that helps your organization to go on AutoPilot
        </h1>
      </div>
      <Image
        className="absolute w-[1000px] h-auto bottom-[-60px] left-[-62px] rounded-r-2xl border-r-[5px] border-t-[5px] border-border"
        src={workflowUI}
        alt="Workflow UI"
      />
    </div>
  );
}
