"use client";

import { useState } from "react";
import clsx from "clsx";

import { fosdemImageDetails } from "~/data/fosdem-image-details";
import { Image } from "~/components/shared/Image";
import type { TypeIds } from "~/types/fosdem";

type FeaturedFosdemImageProps = {
	type: TypeIds;
	size: string;
	showCaptionOnHover?: boolean;
	displayCaption?: boolean;
	loading?: "lazy" | "eager";
	className?: string;
} & Omit<
	React.ComponentProps<typeof Image>,
	"src" | "alt" | "width" | "height" | "loading" | "className"
>;

export function FeaturedFosdemImage({
	type,
	size,
	showCaptionOnHover = false,
	displayCaption = true,
	loading = "lazy",
	className,
	...props
}: FeaturedFosdemImageProps) {
	const [isHovered, setIsHovered] = useState(false);
	const imageDetails = fosdemImageDetails[type];

	const getDimensions = (size: string) => {
		switch (size) {
			case "full":
				return { width: 1920, height: 1080 };
			case "featured":
				return { width: 400, height: 225 };
			default:
				return { width: 800, height: 600 };
		}
	};

	const dimensions = getDimensions(size);

	if (!imageDetails) {
		return null;
	}

	if (!displayCaption) {
		return (
			<Image
				src={`/fosdem/images/fosdem/${size}/${type}.png`}
				alt={imageDetails.alt}
				loading={loading}
				width={dimensions.width}
				height={dimensions.height}
				className={className}
				{...props}
			/>
		);
	}

	return (
		<figure
			className={clsx("relative group", className)}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			<Image
				src={`/fosdem/images/fosdem/${size}/${type}.png`}
				alt={imageDetails.alt}
				loading={loading}
				width={dimensions.width}
				height={dimensions.height}
				className="w-full h-full"
				{...props}
			/>
			<figcaption
				className={`
          mt-2 text-sm text-gray-600 dark:text-gray-400
          ${showCaptionOnHover ? "absolute bottom-0 left-0 right-0 bg-black/75 p-2 text-white dark:text-white transition-opacity duration-200" : ""}
          ${showCaptionOnHover && !isHovered ? "opacity-0" : "opacity-100"}
        `}
			>
				<span className="block mb-2">Image details: {imageDetails.alt}</span>
				<span className="text-xs block">
					Licensed under {imageDetails.license} •{" "}
					<a
						href={imageDetails.original}
						target="_blank"
						rel="noopener noreferrer"
						className={`${showCaptionOnHover ? "text-blue-300 hover:text-blue-200" : "text-blue-500 hover:underline"}`}
					>
						View original
					</a>
				</span>
				{imageDetails.changes && (
					<span className="text-xs block mt-1">
						Changes: {imageDetails.changes}
					</span>
				)}
			</figcaption>
		</figure>
	);
}
