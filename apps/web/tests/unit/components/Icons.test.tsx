import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Icons } from "~/components/shared/Icons";

describe("brand icons", () => {
	it.each([
		["twitter", Icons.twitter],
		["gitlab", Icons.gitlab],
	])("renders the %s icon without relying on Lucide brand exports", (name, Icon) => {
		const { container } = render(<Icon data-icon={name} />);

		expect(container.querySelector(`svg[data-icon="${name}"]`)).toBeInTheDocument();
	});
});
