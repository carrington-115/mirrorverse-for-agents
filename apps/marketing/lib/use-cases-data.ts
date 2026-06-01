export interface UseCaseStep {
  title: string;
  description: string;
}

export interface UseCaseDetail {
  slug: string;
  category: string;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
  image: string;
  steps: UseCaseStep[];
  outcomes: string[];
}

export const useCaseDetails: UseCaseDetail[] = [
  {
    slug: "customer-support",
    category: "Customer Support",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    title: "Be there for every customer, around the clock",
    subtitle:
      "AI agents that resolve tickets, answer FAQs, and escalate complex cases — automatically, across every channel.",
    image:
      "https://plus.unsplash.com/premium_photo-1661443770772-1eda978e1ff7?w=1280&q=80&auto=format&fit=crop",
    steps: [
      {
        title: "Customer reaches out",
        description:
          "A customer contacts you via phone, chat, email, or SMS. Mirrorverse instantly receives the message and identifies the customer from your CRM.",
      },
      {
        title: "Agent understands the issue",
        description:
          "The AI agent reads the inquiry, searches your knowledge base, and retrieves the customer's full interaction history to form a complete picture.",
      },
      {
        title: "Instant, accurate response",
        description:
          "The agent responds in seconds with a personalized, accurate answer. Returns, FAQs, and order issues are resolved without human involvement.",
      },
      {
        title: "Smart escalation",
        description:
          "If the issue requires a human, the agent summarizes context, routes to the right team member, and hands off seamlessly — no repetition for the customer.",
      },
    ],
    outcomes: [
      "40% reduction in ticket volume",
      "24/7 coverage without added headcount",
      "< 30s first response time",
    ],
  },
  {
    slug: "sales",
    category: "Sales",
    iconBg: "bg-green-50",
    iconColor: "text-green-600",
    title: "Never let a warm lead go cold",
    subtitle:
      "Qualify inbound leads, send personalized follow-ups, book discovery calls, and update your CRM — without lifting a finger.",
    image:
      "https://images.unsplash.com/photo-1590649942161-2e7eb2032934?w=1280&q=80&auto=format&fit=crop",
    steps: [
      {
        title: "Lead comes in",
        description:
          "A new lead submits a form, calls your number, or sends an email. Mirrorverse captures the inquiry immediately from any channel.",
      },
      {
        title: "Instant qualification",
        description:
          "The AI agent engages the lead in a natural conversation, asking qualifying questions to score fit, intent, and budget.",
      },
      {
        title: "Personalized follow-up",
        description:
          "Based on the lead's responses, the agent sends tailored follow-up messages with relevant case studies, pricing, or meeting links.",
      },
      {
        title: "CRM updated automatically",
        description:
          "Every interaction is logged to your CRM with enriched data — deal stage, notes, and next steps — no manual data entry.",
      },
    ],
    outcomes: [
      "3× faster lead qualification",
      "60% more booked meetings",
      "Automatic CRM enrichment",
    ],
  },
  {
    slug: "hr-onboarding",
    category: "HR & Onboarding",
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
    title: "Onboard faster, retain better",
    subtitle:
      "Automate new hire paperwork, answer policy questions, schedule orientations, and collect feedback — all through familiar channels.",
    image:
      "https://plus.unsplash.com/premium_photo-1683121736029-06c892c9ad17?w=1280&q=80&auto=format&fit=crop",
    steps: [
      {
        title: "New hire joins",
        description:
          "The moment a new hire is added to your HRIS, Mirrorverse kicks off the onboarding workflow — sending a welcome message via Slack or email.",
      },
      {
        title: "Guided paperwork collection",
        description:
          "The agent walks the new hire through forms, document uploads, and policy acknowledgements — step by step, at their own pace.",
      },
      {
        title: "Questions answered instantly",
        description:
          "New hires can ask policy questions 24/7 and get accurate answers from your HR knowledge base — no waiting for HR to reply.",
      },
      {
        title: "Feedback collected automatically",
        description:
          "At 30, 60, and 90 days, the agent checks in with the employee and surfaces sentiment data to HR leaders in real time.",
      },
    ],
    outcomes: [
      "50% faster onboarding",
      "90% policy Q&A deflection",
      "Consistent employee experience",
    ],
  },
  {
    slug: "finance-operations",
    category: "Finance Operations",
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    title: "Close your books, not your weekends",
    subtitle:
      "Process expense requests, chase invoice approvals, send payment reminders, and generate reports — automatically.",
    image:
      "https://plus.unsplash.com/premium_photo-1664478214295-5da1fd750c29?w=1280&q=80&auto=format&fit=crop",
    steps: [
      {
        title: "Request comes in",
        description:
          "An expense report, invoice, or approval request is submitted. Mirrorverse captures it from email, Slack, or your finance tool automatically.",
      },
      {
        title: "Routing and verification",
        description:
          "The agent validates the request against your approval policies, routes it to the right approver, and sends a notification instantly.",
      },
      {
        title: "Automated reminders",
        description:
          "If an approval is overdue, the agent sends polite follow-ups on the right channel until it's resolved — no manual chasing.",
      },
      {
        title: "Reports and visibility",
        description:
          "Finance leaders get real-time spend dashboards and summary reports generated automatically at the end of each period.",
      },
    ],
    outcomes: [
      "2× faster invoice processing",
      "80% fewer missed approvals",
      "Real-time spend visibility",
    ],
  },
  {
    slug: "e-commerce",
    category: "E-commerce",
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
    title: "Turn browsers into buyers",
    subtitle:
      "Answer product questions, track orders, process returns, send promotional messages, and recover abandoned carts at scale.",
    image:
      "https://images.unsplash.com/photo-1758273705998-05655eea4635?w=1280&q=80&auto=format&fit=crop",
    steps: [
      {
        title: "Shopper shows intent",
        description:
          "A visitor browses your store, adds to cart, or asks a product question. Mirrorverse detects the signal and engages in real time.",
      },
      {
        title: "Personalized assistance",
        description:
          "The AI agent answers product questions, recommends complementary items, and surfaces promotions tailored to the shopper's history.",
      },
      {
        title: "Cart recovery",
        description:
          "When a cart is abandoned, the agent reaches out via SMS or email within minutes with a personalized message and incentive.",
      },
      {
        title: "Post-purchase support",
        description:
          "Order tracking, returns, and feedback collection are handled automatically — keeping customers happy and reducing support load.",
      },
    ],
    outcomes: [
      "35% cart recovery rate",
      "Instant order status updates",
      "Personalized promotions at scale",
    ],
  },
  {
    slug: "healthcare",
    category: "Healthcare",
    iconBg: "bg-red-50",
    iconColor: "text-red-500",
    title: "Patient experience, reimagined",
    subtitle:
      "Schedule appointments, send reminders, answer eligibility questions, and follow up on care plans — securely and compliantly.",
    image:
      "https://images.unsplash.com/photo-1758691462863-9e1b8a863140?w=1280&q=80&auto=format&fit=crop",
    steps: [
      {
        title: "Patient reaches out",
        description:
          "A patient calls, texts, or messages to book an appointment, ask about coverage, or request information about their care plan.",
      },
      {
        title: "Intelligent scheduling",
        description:
          "The agent checks provider availability, confirms patient details, and books the appointment — syncing with your scheduling system automatically.",
      },
      {
        title: "Reminders and preparation",
        description:
          "Automated reminders are sent before appointments with instructions, forms, and eligibility information — reducing no-shows dramatically.",
      },
      {
        title: "Care plan follow-up",
        description:
          "After visits, the agent checks in on adherence, answers follow-up questions, and flags concerns to the care team — all within HIPAA-aligned workflows.",
      },
    ],
    outcomes: [
      "55% fewer missed appointments",
      "HIPAA-aligned workflows",
      "24/7 patient availability",
    ],
  },
];

export function getUseCaseBySlug(slug: string): UseCaseDetail | undefined {
  return useCaseDetails.find((uc) => uc.slug === slug);
}
