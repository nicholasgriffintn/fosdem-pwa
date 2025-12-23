import { Source, Image as UnpicImage } from "@unpic/react";

import { getResizedImageSrc } from "~/utils/image-resize";

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

	const resizedSrc = getResizedImageSrc(src, width, height);
	const webpSource = canUseWebP ? getResizedImageSrc(src.replace(/\.(jpe?g)$/i, ".webp"), width, height) : null;

	return (
		<div className={className}>
			<picture>
				{webpSource && (
					<Source src={webpSource} type="image/webp" layout="fullWidth" />
				)}
				<UnpicImage
					src={resizedSrc}
					alt={alt}
					layout="fullWidth"
					loading={loading}
					{...props}
				/>
			</picture>
		</div>
	);
}
