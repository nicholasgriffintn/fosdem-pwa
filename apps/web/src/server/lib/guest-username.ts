import { randomBase32, randomInt } from "~/server/lib/random";

const ADJECTIVES = [
	"happy",
	"quick",
	"clever",
	"bright",
	"swift",
	"bold",
	"calm",
	"eager",
	"fair",
	"gentle",
	"kind",
	"lively",
	"nice",
	"proud",
	"wise",
] as const;

const NOUNS = [
	"penguin",
	"dolphin",
	"eagle",
	"lion",
	"fox",
	"tiger",
	"bear",
	"wolf",
	"owl",
	"falcon",
	"deer",
	"panda",
	"hawk",
	"raven",
	"otter",
] as const;

export function generateGuestUsername(): string {
	return `${ADJECTIVES[randomInt(ADJECTIVES.length)]}-${NOUNS[randomInt(NOUNS.length)]}-${randomBase32(6)}`;
}
