const PLAYER_STATE_KEY = "fosdem_player_state";

export interface PlayerState {
	eventSlug: string | null;
	year: number | null;
	currentTime: number;
	volume: number;
	isPlaying: boolean;
	isMuted: boolean;
	isMinimized: boolean;
	streamUrl: string | null;
	eventTitle: string | null;
	isLive: boolean;
	updatedAt: string;
}

const DEFAULT_PLAYER_STATE: PlayerState = {
	eventSlug: null,
	year: null,
	currentTime: 0,
	volume: 1,
	isPlaying: false,
	isMuted: false,
	isMinimized: false,
	streamUrl: null,
	eventTitle: null,
	isLive: false,
	updatedAt: new Date().toISOString(),
};

export function getPlayerState(): PlayerState {
	try {
		const stored = localStorage.getItem(PLAYER_STATE_KEY);
		if (!stored) return DEFAULT_PLAYER_STATE;

		const parsed = JSON.parse(stored) as PlayerState;
		return { ...DEFAULT_PLAYER_STATE, ...parsed };
	} catch (error) {
		console.error("Error reading player state:", error);
		return DEFAULT_PLAYER_STATE;
	}
}

export function savePlayerState(
	state: Partial<PlayerState>,
): void {
	try {
		const currentState = getPlayerState();
		const updatedState: PlayerState = {
			...currentState,
			...state,
			updatedAt: new Date().toISOString(),
		};

		localStorage.setItem(PLAYER_STATE_KEY, JSON.stringify(updatedState));
	} catch (error) {
		console.error("Error saving player state:", error);
	}
}

export function clearPlayerState(): void {
	try {
		localStorage.setItem(PLAYER_STATE_KEY, JSON.stringify(DEFAULT_PLAYER_STATE));
	} catch (error) {
		console.error("Error clearing player state:", error);
	}
}
