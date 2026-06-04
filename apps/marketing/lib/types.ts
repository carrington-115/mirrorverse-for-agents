import { StaticImageData } from "next/image";
import { HTMLAttributes } from "react";

export interface NavChildLink {
  label: string;
  href: string;
  description?: string;
}

export interface NavFeaturedItem {
  label: string;
  href: string;
  description?: string;
}

export interface UseCaseItem {
  title: string;
  description: string;
  href: string;
}

export interface UseCasesBanner {
  title: string;
  description: string;
  image: StaticImageData;
  href: string;
}

export interface ProductItem {
  title: string;
  description: string;
  href: string;
}

export interface NavLinkType {
  label: string;
  href: string;
}

export interface productLinkTypes {
  productLink: string;
  image: StaticImageData;
  title: string;
  description: string;
}

export interface simpleComType {
  icon: string;
  title: string;
}

export interface communicationTypes {
  light: simpleComType[];
  dark: simpleComType[];
}

export interface featureDataProps {
  icon?: string;
  title: string;
  description: string;
}

export interface updatesInputProps {
  inputType: string;
  placeholder: string;
  buttonName: string;
  inputTitle: string;
  btnSubmitAction: () => void;
}

type footerLink = {
  title: string;
  link: string;
};

export interface linkGroupTypes {
  productGroup: footerLink[];
  useCasesGroup: footerLink[];
  legalGroup: footerLink[];
}

export interface mobileLinksTypes {
  isOpen: boolean;
  triggerCloseAction: () => void;
}

export interface buttonProps extends HTMLAttributes<HTMLButtonElement> {
  variant?: "filled" | "outlined";
  round?: "full" | "corner";
  size?: "normal" | "medium" | "sm";
}

export interface iconButtonProps {
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

export interface menuIconProps {
  isOpen: boolean;
  action: () => void;
}
