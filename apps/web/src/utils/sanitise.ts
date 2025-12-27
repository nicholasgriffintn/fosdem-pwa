export function removeHTMLTags(input: string) {
  const withoutTags = input.replace(/<[^>]*>/g, "");
  return withoutTags.replace(/[<>]/g, "");
}

export function sanitiseString(input: string) {
  if (!input) return "";
  return removeHTMLTags(input);
}