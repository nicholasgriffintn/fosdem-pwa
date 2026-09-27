import { useLocation } from "@tanstack/react-router";
import { deployment } from "@roomisfull/conference/deployment";
import { canonicalUrl, shouldNoIndex } from "~/utils/canonical";

export function CanonicalMetadata() {
	const href = useLocation({ select: (location) => location.href });
	const canonical = canonicalUrl(href, deployment);
	return (
		<>
			<link rel="canonical" href={canonical} />
			<meta property="og:url" content={canonical} />
			{shouldNoIndex(href) && <meta name="robots" content="noindex, follow" />}
		</>
	);
}
