import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LoadingState } from "~/components/shared/LoadingState";

describe("LoadingState", () => {
  describe("spinner type", () => {
    it("renders spinner by default", () => {
      const { container } = render(<LoadingState />);

      expect(container.querySelector(".animate-spin")).toBeInTheDocument();
    });

    it("renders spinner with message", () => {
      render(<LoadingState type="spinner" message="Loading data..." />);

      expect(screen.getByText("Loading data...")).toBeInTheDocument();
    });
  });

  describe("skeleton type", () => {
    it("renders skeleton", () => {
      const { container } = render(<LoadingState type="skeleton" />);

      expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
    });

    it("renders skeleton with message", () => {
      const { container } = render(
        <LoadingState type="skeleton" message="Loading..." />
      );

      const skeletons = container.querySelectorAll(".animate-pulse");
      expect(skeletons.length).toBeGreaterThanOrEqual(1);
    });

    it("renders inline skeleton variant", () => {
      const { container } = render(
        <LoadingState type="skeleton" variant="inline" />
      );

      expect(container.firstChild).toHaveClass("inline-flex");
    });
  });

  describe("shimmer type", () => {
    it("renders shimmer", () => {
      const { container } = render(<LoadingState type="shimmer" />);

      expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
    });

    it("renders shimmer with message", () => {
      const { container } = render(
        <LoadingState type="shimmer" message="Loading..." />
      );

      const pulseElements = container.querySelectorAll(".animate-pulse");
      expect(pulseElements.length).toBe(2);
    });
  });

  describe("sizes", () => {
    it("renders small size", () => {
      const { container } = render(<LoadingState size="sm" />);

      expect(container.querySelector(".h-4.w-4")).toBeInTheDocument();
    });

    it("renders medium size by default", () => {
      const { container } = render(<LoadingState />);

      expect(container.querySelector(".h-6.w-6")).toBeInTheDocument();
    });

    it("renders large size", () => {
      const { container } = render(<LoadingState size="lg" />);

      expect(container.querySelector(".h-8.w-8")).toBeInTheDocument();
    });
  });

  describe("variants", () => {
    it("renders centered variant by default", () => {
      const { container } = render(<LoadingState />);

      expect(container.firstChild).toHaveClass("flex");
      expect(container.firstChild).toHaveClass("justify-center");
    });

    it("renders inline variant", () => {
      const { container } = render(<LoadingState variant="inline" />);

      expect(container.firstChild).toHaveClass("inline-flex");
    });

    it("renders full variant", () => {
      const { container } = render(<LoadingState variant="full" />);

      expect(container.firstChild).toHaveClass("w-full");
      expect(container.firstChild).toHaveClass("h-full");
    });
  });

  it("applies custom className", () => {
    const { container } = render(<LoadingState className="my-custom-class" />);

    expect(container.firstChild).toHaveClass("my-custom-class");
  });
});
