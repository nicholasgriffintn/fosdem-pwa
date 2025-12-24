import { Source, Image as UnpicImage } from "@unpic/react";

import { getResizedImageSrc } from "~/utils/image-resize";

type ImageProps = {
	src: string;
	alt: string;
	className?: string;
	useWebP?: boolean;
	loading?: "lazy" | "eager";
	fetchPriority?: "high" | "low" | "auto";
	decoding?: "async" | "sync" | "auto";
	width?: number;
	height?: number;
};

export function Image({
	src,
	alt,
	className,
	useWebP = true,
	loading = "lazy",
	fetchPriority,
	decoding,
	width,
	height,
	...props
}: ImageProps) {
	const canUseWebP = useWebP && /\.(jpe?g)$/i.test(src);

	const resizedSrc = getResizedImageSrc(src, width, height);
	const webpSource = canUseWebP ? getResizedImageSrc(src.replace(/\.(jpe?g)$/i, ".webp"), width, height) : null;

	return (
		<div className={className} style={{ aspectRatio: width && height ? `${width}/${height}` : undefined }}>
			<picture className="w-full h-full">
				{webpSource && (
					<Source src={webpSource} type="image/webp" layout="fullWidth" />
				)}
				<UnpicImage
					src={resizedSrc}
					alt={alt}
					layout="fullWidth"
					loading={loading}
					fetchPriority={fetchPriority}
					decoding={decoding}
					className="w-full h-full object-cover"
					{...props}
				/>
			</picture>
		</div>
	);
}
