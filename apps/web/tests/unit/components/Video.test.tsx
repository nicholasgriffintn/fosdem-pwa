import { render } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { Video } from "~/components/VideoPlayer/Video";

describe("Video", () => {
	it("updates available captions without replacing the playing video", () => {
		const ref = createRef<HTMLVideoElement>();
		const { container, rerender } = render(
			<Video ref={ref} controls subtitleUrl="/captions/first.vtt">
				<source src="/recording.mp4" type="video/mp4" />
			</Video>,
		);
		const video = ref.current;
		expect(video).toHaveAttribute("controls");
		expect(container.querySelector("track")).toHaveAttribute(
			"kind",
			"captions",
		);
		expect(container.querySelector("track")).toHaveAttribute(
			"src",
			"/captions/first.vtt",
		);

		rerender(<Video ref={ref} subtitleUrl="/captions/next.vtt" />);
		expect(ref.current).toBe(video);
		expect(container.querySelector("track")).toHaveAttribute(
			"src",
			"/captions/next.vtt",
		);

		rerender(<Video ref={ref} />);
		expect(ref.current).toBe(video);
		expect(container.querySelector("track")).toBeNull();
	});
});
