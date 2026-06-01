import {
  communicationTypes,
  featureDataProps,
  linkGroupTypes,
  NavLinkType,
  productLinkTypes,
} from "./types";

// integration banner
import integrationsImage from "@/assets/images/desktop-integrations.png";

// product banner
import mirrorpilotProductImage from "@/assets/images/mirrorpilot-product.png";

// product images
import superagentImage from "@/assets/images/superagent.png";
import onememoryImage from "@/assets/images/one-memory.png";
import automationImage from "@/assets/images/automation.png";

// product dark mode images
import darksuperagentImage from "@/assets/images/superagent-dark.png";
import darkonememoryImage from "@/assets/images/onememory-dark.png";
import darkautomationImage from "@/assets/images/workflow-dark.png";

// communication icons
import emailIcon from "@/assets/icons/email.svg";
import messageIcon from "@/assets/icons/message.svg";
import smsIcon from "@/assets/icons/sms.svg";
import phoneIcon from "@/assets/icons/phone.svg";

// communication icons for dark mode
import darkEmailIcon from "@/assets/icons/email-dark.svg";
import darkMessageIcon from "@/assets/icons/chats-dark.svg";
import darkSmsIcon from "@/assets/icons/sms-dark.svg";
import darkPhoneIcon from "@/assets/icons/phone-dark.svg";

// revenue icons

// light
import memoryImage from "@/assets/icons/memory.svg";
import agentImage from "@/assets/icons/superagent.svg";
import workflowImage from "@/assets/icons/workflow.svg";
import monitoringImage from "@/assets/icons/monitoring.svg";
import experimentationImage from "@/assets/icons/testing.svg";
import multichannelImage from "@/assets/icons/multichannel.svg";
import multiuserImage from "@/assets/icons/multiusers.svg";
import marketplaceImage from "@/assets/icons/store.svg";

// dark
import darkmemoryImage from "@/assets/icons/memory-dark.svg";
import darkagentImage from "@/assets/icons/superagent-dark.svg";
import darkworkflowImage from "@/assets/icons/workflow-dark.svg";
import darkmonitoringImage from "@/assets/icons/monitoring-dark.svg";
import darkexperimentationImage from "@/assets/icons/testing-dark.svg";
import darkmultichannelImage from "@/assets/icons/multichannel-dark.svg";
import darkmultiuserImage from "@/assets/icons/multiusers-dark.svg";
import darkmarketplaceImage from "@/assets/icons/store-dark.svg";

export const navLinks: NavLinkType[] = [
  {
    label: "Product",
    product: {
      left: [
        {
          title: "Mirrorpilot",
          description:
            "AI-powered agents that hold real conversations across phone, chat, and email.",
          href: "/product#mirrorpilot",
        },
        {
          title: "Workflows",
          description:
            "No-code canvas to compose automation flows with triggers, conditions, and actions.",
          href: "/product#workflows",
        },
        {
          title: "Knowledge Bases",
          description: "Upload your docs — agents retrieve exactly what they need, every time.",
          href: "/product#knowledge",
        },
      ],
      right: [
        {
          title: "Channels",
          description: "Deploy across phone, WhatsApp, SMS, and email in minutes.",
          href: "/product#channels",
        },
        {
          title: "Integrations",
          description: "Connect 200+ tools — Salesforce, HubSpot, Slack, and more via Composio.",
          href: "/product#integrations",
        },
      ],
      banner: {
        title: "Explore the full platform",
        description:
          "See how Mirrorpilot, Workflows, and Knowledge Bases work together to automate your operations.",
        image: mirrorpilotProductImage,
        href: "/product",
      },
    },
  },
  {
    label: "Use Cases",
    useCases: {
      left: [
        {
          title: "Sales",
          description: "Automate outreach, follow-ups, and pipeline updates with AI agents.",
          href: "/use-cases/sales",
        },
        {
          title: "Customer Support",
          description:
            "Resolve tickets instantly with context-aware agents that know your customers.",
          href: "/use-cases/customer-support",
        },
        {
          title: "HR & Onboarding",
          description: "Automate new hire paperwork, policy Q&A, and feedback collection.",
          href: "/use-cases/hr-onboarding",
        },
      ],
      right: [
        {
          title: "Finance Operations",
          description: "Process expenses, approvals, and reports automatically.",
          href: "/use-cases/finance-operations",
        },
        {
          title: "E-commerce",
          description:
            "Recover carts, answer product questions, and personalize promotions at scale.",
          href: "/use-cases/e-commerce",
        },
        {
          title: "Healthcare",
          description:
            "Schedule appointments, send reminders, and follow up on care plans compliantly.",
          href: "/use-cases/healthcare",
        },
      ],
      banner: {
        title: "Works with your existing stack",
        description:
          "Connect Mirrorverse to your CRM, helpdesk, and communication tools — no migration required.",
        image: integrationsImage,
        href: "/product",
      },
    },
  },
  {
    label: "Resources",
    children: [
      { label: "Blog", href: "/blog" },
      { label: "Terms & Conditions", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
    ],
    featured: {
      label: "User Guide",
      href: "/user-guide",
      description: "Step-by-step guides to help you get the most out of Mirrorverse.",
    },
  },
  { label: "Pricing", href: "/pricing" },
];

export const productData: productLinkTypes[] = [
  {
    image: superagentImage,
    productLink: "#",
    title: "Superagent",
    description:
      "Central supervisor with shared memory across sales, marketing, and support for seamless, consistent RevOps workflows.",
  },
  {
    image: onememoryImage,
    productLink: "#",
    title: "One memory",
    description:
      "Ensure every interaction, data point, and action is instantly accessible to sales, support, and marketing agents",
  },
  {
    image: automationImage,
    productLink: "#",
    title: "Automation",
    description:
      "AI-driven routing, personalization, and actions to eliminate silos, boost efficiency, and scale revenue.",
  },
];

export const productDarkModeData: productLinkTypes[] = [
  {
    image: darksuperagentImage,
    productLink: "#",
    title: "Superagent",
    description:
      "Central supervisor with shared memory across sales, marketing, and support for seamless, consistent RevOps workflows.",
  },
  {
    image: darkonememoryImage,
    productLink: "#",
    title: "One memory",
    description:
      "Ensure every interaction, data point, and action is instantly accessible to sales, support, and marketing agents",
  },
  {
    image: darkautomationImage,
    productLink: "#",
    title: "Automation",
    description:
      "AI-driven routing, personalization, and actions to eliminate silos, boost efficiency, and scale revenue.",
  },
];

export const communicationChannelsData: communicationTypes = {
  light: [
    { icon: phoneIcon, title: "AI-powered Phone calls" },
    { icon: messageIcon, title: "AI-powered Chats" },
    { icon: smsIcon, title: "AI-powered Sms" },
    { icon: emailIcon, title: "AI-powered Emails" },
  ],
  dark: [
    { icon: darkPhoneIcon, title: "AI-powered Phone calls" },
    { icon: darkMessageIcon, title: "AI-powered Chats" },
    { icon: darkSmsIcon, title: "AI-powered Sms" },
    { icon: darkEmailIcon, title: "AI-powered Emails" },
  ],
};

export const featureData: featureDataProps[] = [
  {
    icon: memoryImage,
    title: "One memory",
    description:
      "One Memory provides every agent with a single, unified view of all customer interactions",
  },
  {
    icon: agentImage,
    title: "Superagent",
    description:
      "The Super Agent acts as the central supervisor, orchestrating sales, support, and marketing agents",
  },
  {
    icon: workflowImage,
    title: "Workflows",
    description:
      "No-code drag-and-drop builder for custom processes — fast RevOps alignment and scalable automation without developers.",
  },
  {
    icon: monitoringImage,
    title: "Monitoring",
    description: "Realtime Monitoring delivers full visibility into agent actions and performance",
  },

  {
    icon: experimentationImage,
    title: "Testing and simulations",
    description:
      "A/B Testing and Simulations let you safely test agent variants and workflows, refining performance with data-driven insights before deployment.",
  },
  {
    icon: multichannelImage,
    title: "Multichannel support",
    description:
      "Multichannel Support unifies automated calls, SMS, chats (WhatsApp, Telegram, Messenger), and email",
  },
  {
    icon: multiuserImage,
    title: "Multi-user support",
    description: "Multi-User Support enables realtime collaboration with role-based access",
  },
  {
    icon: marketplaceImage,
    title: "Workflow marketplace",
    description:
      "The Workflow Marketplace offers pre-built, shareable templates to jumpstart RevOps automation",
  },
];

export const darkFeatureData: featureDataProps[] = [
  {
    icon: darkmemoryImage,
    title: "One memory",
    description:
      "One Memory provides every agent with a single, unified view of all customer interactions",
  },
  {
    icon: darkagentImage,
    title: "Superagent",
    description:
      "The Super Agent acts as the central supervisor, orchestrating sales, support, and marketing agents",
  },
  {
    icon: darkworkflowImage,
    title: "Workflows",
    description:
      "No-code drag-and-drop builder for custom processes — fast RevOps alignment and scalable automation without developers.",
  },
  {
    icon: darkmonitoringImage,
    title: "Monitoring",
    description: "Realtime Monitoring delivers full visibility into agent actions and performance",
  },

  {
    icon: darkexperimentationImage,
    title: "Testing and simulations",
    description:
      "A/B Testing and Simulations let you safely test agent variants and workflows, refining performance with data-driven insights before deployment.",
  },
  {
    icon: darkmultichannelImage,
    title: "Multichannel support",
    description:
      "Multichannel Support unifies automated calls, SMS, chats (WhatsApp, Telegram, Messenger), and email",
  },
  {
    icon: darkmultiuserImage,
    title: "Multi-user support",
    description: "Multi-User Support enables realtime collaboration with role-based access",
  },
  {
    icon: darkmarketplaceImage,
    title: "Workflow marketplace",
    description:
      "The Workflow Marketplace offers pre-built, shareable templates to jumpstart RevOps automation",
  },
];

export const linkGroups: linkGroupTypes = {
  productGroup: [
    { title: "Product", link: "/product" },
    { title: "Pricing", link: "/pricing" },
    { title: "Use Cases", link: "/use-cases" },
    { title: "Login", link: "#" },
  ],
  resourcesGroup: [
    { title: "Blog", link: "/blog" },
    { title: "Changelog", link: "/changelog" },
    { title: "User Guide", link: "/user-guide" },
  ],
  legalGroup: [
    { title: "Terms & Conditions", link: "/terms" },
    { title: "Privacy Policy", link: "/privacy" },
  ],
  useCasesGroup: [
    { title: "Sales", link: "/use-cases/sales" },
    { title: "Customer Support", link: "/use-cases/customer-support" },
    { title: "HR & Onboarding", link: "/use-cases/hr-onboarding" },
    { title: "Finance Operations", link: "/use-cases/finance-operations" },
    { title: "E-commerce", link: "/use-cases/e-commerce" },
    { title: "Healthcare", link: "/use-cases/healthcare" },
  ],
};
