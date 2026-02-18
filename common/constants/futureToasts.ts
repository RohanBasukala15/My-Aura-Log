export const FUTURE_TOASTS = [
  {
    title: "Gently grounded",
    message: "The future is a secret that unfolds one day at a time. Enjoy the now.",
  },
  {
    title: "Not quite there yet",
    message: "The pages ahead are beautifully blank. Focus on your aura today.",
  },
  {
    title: "Patience, friend",
    message: "Tomorrow will arrive in its own time. Stay here with us for a while.",
  },
  {
    title: "The Present Moment",
    message: "You've reached the edge of today. Your future logs are waiting to be lived.",
  },
  {
    title: "One breath at a time",
    message: "The horizon is bright, but the magic happens right where you are.",
  },
  {
    title: "Still writing today",
    message: "Your story is being written in this moment. The next chapter will come when it's ready.",
  },
  {
    title: "Here, now",
    message: "Time hasn't turned that page yet. What you have is today—tend to it gently.",
  },
  {
    title: "Soft pause",
    message: "The week ahead is still a dream. Wake up to what's already here.",
  },
  {
    title: "Seeds not yet sown",
    message: "Those days are still forming. Water the one you're standing in.",
  },
  {
    title: "No spoilers",
    message: "Life doesn't give away the ending. Sit with the scene you're in.",
  },
] as const;

export type FutureToast = (typeof FUTURE_TOASTS)[number];
