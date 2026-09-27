import { conferenceConfig } from "@roomisfull/conference";
import { Image } from "~/components/shared/Image";

export function ConferenceMap() {
	const map = conferenceConfig.map;
	if (!map)
		return (
			<p className="text-muted-foreground">
				A venue map is not available for this conference.
			</p>
		);
	return (
		<div className="w-full">
			<Image
				src={map.image}
				alt={map.description}
				loading="eager"
				width={1200}
				height={800}
			/>
			{map.directions && (
				<p className="text-sm text-muted-foreground mt-4">
					<a href={map.directions} target="_blank" rel="noreferrer">
						Get directions to the venue
					</a>
				</p>
			)}
		</div>
	);
}
