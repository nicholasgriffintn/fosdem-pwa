export function Image({
  src,
  alt,
  className,
  useWebP = true,
  ...props
}: {
  src: string;
  alt: string;
  className?: string;
  useWebP?: boolean;
  loading?: 'lazy' | 'eager';
}) {
  return (
    <picture className={className}>
      {useWebP && (
        <source srcSet={src.replace('.png', '.webp')} type="image/webp" />
      )}
      <source srcSet={src} type="image/png" />
      <img src={src} alt={alt} {...props} />
    </picture>
  );
}
