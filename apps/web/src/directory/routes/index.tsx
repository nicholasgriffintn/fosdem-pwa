import { createFileRoute } from "@tanstack/react-router";

import { ConferenceDirectory } from "../components/ConferenceDirectory";

export const Route = createFileRoute("/")({
	component: ConferenceDirectory,
});
