import { Source, Image as UnpicImage } from "@unpic/react";

type ImageProps = {
	src: string;
	alt: string;
	className?: string;
	useWebP?: boolean;
	loading?: "lazy" | "eager";
	width?: number;
	height?: number;
};

export function Image({
	src,
	alt,
	className,
	useWebP = true,
	loading = "lazy",
	width,
	height,
	...props
}: ImageProps) {
	const canUseWebP = useWebP && /\.(jpe?g)$/i.test(src);

	const webpSource = canUseWebP ? src.replace(/\.(jpe?g)$/i, ".webp") : null;

	return (
		<div className={className}>
			<picture>
				{webpSource && (
					<Source src={webpSource} type="image/webp" layout="fullWidth" />
				)}
				<UnpicImage
					src={src}
					alt={alt}
					layout="fullWidth"
					loading={loading}
					{...props}
				/>
			</picture>
		</div>
	);
}
