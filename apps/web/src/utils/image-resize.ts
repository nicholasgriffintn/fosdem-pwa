export const IMAGE_RESIZE_ENDPOINT = "https://images.s3rve.co.uk";

export function getResizedImageUrl({
  imagePath,
  width,
  height,
}: {
  imagePath: string;
  width?: number;
  height?: number;
}): string {
  const params = new URLSearchParams();

  if (width) params.append("width", width.toString());
  if (height) params.append("height", height.toString());

  const encodedImagePath = encodeURIComponent(imagePath);

  const url = `${IMAGE_RESIZE_ENDPOINT}/?${params.toString()}&image=${encodedImagePath}`;

  return url;
}

export function getResizedImageSrc(
  src: string,
  width?: number,
  height?: number
): string {
  if (src.startsWith("http")) {
    return src;
  }

  return getResizedImageUrl({
    imagePath: src,
    width,
    height,
  });
}
