export const shortenName = (name = ""): string => {
  const words = name.split(" ");
  if (words.length === 1) {
    return (words[0][0] || "").toUpperCase();
  }
  return (words[0][0] || "").toUpperCase() + (words[words.length - 1][0] || "").toUpperCase();
};
