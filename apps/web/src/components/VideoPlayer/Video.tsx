import type { ComponentProps } from "react";

type VideoProps = ComponentProps<"video"> & {
	subtitleUrl?: string | null;
};

export function Video({ subtitleUrl, children, ...props }: VideoProps) {
	return (
		<video {...props}>
			{children}
			{subtitleUrl && (
				<track
					kind="captions"
					src={subtitleUrl}
					srcLang="en"
					label="English"
					default
				/>
			)}
		</video>
	);
}
