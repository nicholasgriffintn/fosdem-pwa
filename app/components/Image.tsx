import { Source, Image as UnpicImage } from "@unpic/react";

export function Image({
	src,
	alt,
	className,
	useWebP = true,
	width,
	height,
	...props
}: {
	src: string;
	alt: string;
	className?: string;
	useWebP?: boolean;
	loading?: "lazy" | "eager";
	width?: number;
	height?: number;
}) {
	return (
		<div className={className}>
			<picture>
				{useWebP && (
					<Source
						src={src.replace(".jpg", ".webp")}
						type="image/webp"
						layout="fullWidth"
					/>
				)}
				<UnpicImage src={src} alt={alt} layout="fullWidth" {...props} />
			</picture>
		</div>
	);
}
