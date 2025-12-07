import { constants } from "../constants";
import { getCurrentDate } from "../utils/date";
import type { FosdemData } from "../types";

function getDataLink() {
	const year = constants.YEAR;
	return constants.DATA_LINK.replace("${YEAR}", year.toString());
}

export async function getFosdemData(): Promise<FosdemData> {
	const fosdemDataLink = getDataLink();
	const fosdemData = await fetch(fosdemDataLink);

	if (!fosdemData.ok) {
		throw new Error(`Failed to fetch data from ${fosdemDataLink}`);
	}

	return fosdemData.json();
}

export function getCurrentDay(): string | undefined {
	const todayString = getCurrentDate();
	
	return todayString in constants.DAYS_MAP 
		? constants.DAYS_MAP[todayString as keyof typeof constants.DAYS_MAP]
		: undefined;
} 