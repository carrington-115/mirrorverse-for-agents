import { updatesInputProps } from "@/lib/types";
import { Button } from "@/components/ui/button";

export default function UpdatesInput({
  inputType,
  placeholder,
  buttonName,
  inputTitle,
  btnSubmitAction,
}: updatesInputProps) {
  return (
    <div className="lg:w-[50vw] md:justify-between lg:justify-between lg:gap-auto md:px-[var(--spacing-12)] md:py-[8px] text-base md:text-xl flex w-full items-center justify-center rounded-full border border-(--colors-black-15) px-(--spacing-10) py-[5px]">
      <form className="md:flex md:justify-between md:gap-5 lg:gap-auto w-[100%]">
        <input
          type={inputType}
          placeholder={placeholder}
          name={inputTitle}
          className="md:w-[50%] w-[50%] outline-none"
        />
        <Button
          className="md:hidden lg:hidden w-[50%]"
          size="sm"
          variant="default"
          onClick={btnSubmitAction}
        >
          {buttonName}
        </Button>
        <Button
          className="md:block lg:block md:w-[50%] lg:w-[40%] hidden"
          variant="default"
          onClick={btnSubmitAction}
        >
          {buttonName}
        </Button>
      </form>
    </div>
  );
}
