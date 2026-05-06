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
    <div className="w-full lg:w-[50vw] flex justify-center md:justify-between lg:justify-between lg:gap-auto items-center px-[var(--spacing-10)] md:px-[var(--spacing-12)] py-[5px] border md:py-[8px] border-[var(--colors-black-15)] text-base md:text-xl rounded-full">
      <form className="w-[100%] md:flex md:justify-between md:gap-5 lg:gap-auto">
        <input
          type={inputType}
          placeholder={placeholder}
          name={inputTitle}
          className="w-[50%] md:w-[50%] outline-none"
        />
        <Button
          className="w-[50%] md:hidden lg:hidden"
          size="sm"
          variant="default"
          onClick={btnSubmitAction}
        >
          {buttonName}
        </Button>
        <Button
          className="hidden md:block lg:block md:w-[50%] lg:w-[40%] hidden"
          variant="default"
          onClick={btnSubmitAction}
        >
          {buttonName}
        </Button>
      </form>
    </div>
  );
}
