type LogLevel = "info" | "warn" | "error" | "debug";

type LoggerContext = {
	service?: string;
	scope?: string;
	requestId?: string;
	year?: string;
};

const log =
	(level: LogLevel, context: LoggerContext) =>
		(message: string, extra?: Record<string, unknown>) => {
			const payload = {
				level,
				message,
				...context,
				...extra,
			};

			// eslint-disable-next-line no-console
			(level === "debug" ? console.log : console[level])(JSON.stringify(payload));
		};

export const createLogger = (context: LoggerContext = {}) => {
	const base = { service: "build-data", ...context };

	return {
		info: log("info", base),
		warn: log("warn", base),
		error: log("error", base),
		debug: log("debug", base),
	};
};
