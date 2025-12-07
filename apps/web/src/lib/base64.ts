function decodeBase64(base64: string) {
	if (typeof atob === "function") {
		return atob(base64);
	}
	if (typeof Buffer !== "undefined") {
		return Buffer.from(base64, "base64").toString("binary");
	}
	throw new Error("Base64 decoding is not supported in this environment.");
}

export function urlBase64ToUint8Array(base64String: string) {
	const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

	const rawData = decodeBase64(base64);
	const outputArray = new Uint8Array(rawData.length);

	for (let i = 0; i < rawData.length; i += 1) {
		outputArray[i] = rawData.charCodeAt(i);
	}

	return outputArray;
}
