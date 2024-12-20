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
    <div className={className}>
      <picture>
        {useWebP && (
          <source srcSet={src.replace('.jpg', '.webp')} type="image/webp" />
        )}
        <source srcSet={src} type="image/jpeg" />
        <img src={src} alt={alt} {...props} />
      </picture>
    </div>
  );
}