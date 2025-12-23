export function removeHTMLTags(input: string) {
  return input.replace(/<[^>]*>/g, "");
}

export function sanitiseString(input: string) {
  return removeHTMLTags(input);
}