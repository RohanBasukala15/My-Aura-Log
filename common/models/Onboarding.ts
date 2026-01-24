export interface OnboardingStep {
  step: number;
  type: "welcome" | "input" | "notification" | "security";
  title: string;
  subtitle: string;
  description: string;
  primaryButton: string;
  secondaryButton?: string;
  input?: {
    placeholder: string;
    key: string;
  };
  toggle?: {
    label: string;
    key: string;
    default: boolean;
  };
  options?: Array<{
    type: "biometric" | "pin";
    label: string;
    key: string;
  }>;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    step: 1,
    type: "welcome",
    title: "Welcome To My Aura Log",
    subtitle: "Your energy. Your story.",
    description: "Check in with yourself, log your daily aura, and discover patterns that matter to you.",
    primaryButton: "Begin your journey",
  },
  {
    step: 2,
    type: "input",
    title: "What should we \ncall you?",
    subtitle: "Your name helps personalise your experience",
    description: "You can change this anytime",
    input: {
      placeholder: "Enter your name",
      key: "user_name",
    },
    primaryButton: "Continue",
  },
  {
    step: 3,
    type: "notification",
    title: "Stay on track",
    subtitle: "Enable reminders to log your day",
    description: "You're always in control",
    toggle: {
      label: "Daily reminders",
      key: "daily_notifications",
      default: false,
    },
    primaryButton: "Enable notifications",
    secondaryButton: "Skip for now",
  },
  {
    step: 4,
    type: "security",
    title: "Secure your Aura Log",
    subtitle: "Use your device’s biometric security",
    description: "Quick, private, and only accessible by you.",
    primaryButton: "Continue your journey ✨",
  },
];

