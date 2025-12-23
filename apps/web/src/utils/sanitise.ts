export function removeHTMLTags(input: string) {
  return input.replace(/<[^>]*>/g, "");
}

export function sanitiseString(input: string) {
  if (!input) return "";
  return removeHTMLTags(input);
}