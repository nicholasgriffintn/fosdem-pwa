import { conferenceConfig } from "@roomisfull/conference";

const DEFAULT_YEAR = conferenceConfig.defaultYear;
const MIN_YEAR = 2000;
const MAX_YEAR = 2100;

type ParsedYear = {
	value: number;
	source: "env" | "default";
	clamped: boolean;
};

export const parseYear = (value: string | null | undefined): ParsedYear => {
	const parsed = Number.parseInt(value ?? "", 10);

	if (!Number.isFinite(parsed)) {
		return { value: DEFAULT_YEAR, source: "default", clamped: false };
	}

	const clamped = Math.min(MAX_YEAR, Math.max(MIN_YEAR, parsed));
	return {
		value: clamped,
		source: "env",
		clamped: clamped !== parsed,
	};
};
