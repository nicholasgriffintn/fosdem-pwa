import { describe, expect, it } from "vitest";

import { pickPreferenceFields } from "~/server/repositories/notification-preference-repository";

describe("pickPreferenceFields", () => {
	it("keeps the editable preference fields", () => {
		expect(
			pickPreferenceFields({
				event_reminders: false,
				reminder_minutes_before: 30,
				daily_summary: true,
			}),
		).toEqual({
			event_reminders: false,
			reminder_minutes_before: 30,
			daily_summary: true,
		});
	});

	it("drops a caller-supplied user_id so another user's row cannot be targeted", () => {
		const picked = pickPreferenceFields({
			user_id: 123,
			event_reminders: false,
		} as never);

		expect(picked).not.toHaveProperty("user_id");
		expect(picked).toEqual({ event_reminders: false });
	});

	it("drops a caller-supplied primary key", () => {
		const picked = pickPreferenceFields({ id: 999, daily_summary: false } as never);

		expect(picked).not.toHaveProperty("id");
	});

	it("drops unknown keys entirely", () => {
		expect(pickPreferenceFields({ nonsense: true } as never)).toEqual({});
	});

	it("omits undefined values so they do not clear existing columns", () => {
		const picked = pickPreferenceFields({ event_reminders: undefined, daily_summary: true });

		expect(Object.keys(picked)).toEqual(["daily_summary"]);
	});
});
