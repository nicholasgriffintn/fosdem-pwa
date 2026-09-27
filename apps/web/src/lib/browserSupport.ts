export const shareSupported = () => {
	try {
		return "share" in navigator && "canShare" in navigator;
	} catch {
		return false;
	}
};

export const clipboardSupported = () => {
	try {
		return "clipboard" in navigator;
	} catch {
		return false;
	}
};
