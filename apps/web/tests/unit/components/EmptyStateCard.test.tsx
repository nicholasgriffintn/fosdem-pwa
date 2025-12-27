import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EmptyStateCard } from "~/components/shared/EmptyStateCard";

describe("EmptyStateCard", () => {
  it("renders title", () => {
    render(<EmptyStateCard title="No results found" />);

    expect(screen.getByText("No results found")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "No results found"
    );
  });

  it("renders description when provided", () => {
    render(
      <EmptyStateCard
        title="No results"
        description="Try adjusting your search"
      />
    );

    expect(screen.getByText("Try adjusting your search")).toBeInTheDocument();
  });

  it("renders description as ReactNode", () => {
    render(
      <EmptyStateCard
        title="No results"
        description={<span data-testid="custom-desc">Custom content</span>}
      />
    );

    expect(screen.getByTestId("custom-desc")).toBeInTheDocument();
  });

  it("does not render description when not provided", () => {
    const { container } = render(<EmptyStateCard title="Empty" />);

    const descriptionDiv = container.querySelector(
      ".text-sm.text-muted-foreground"
    );
    expect(descriptionDiv).not.toBeInTheDocument();
  });

  it("renders actions when provided", () => {
    render(
      <EmptyStateCard
        title="No results"
        actions={<button type="button">Retry</button>}
      />
    );

    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("does not render actions container when not provided", () => {
    const { container } = render(<EmptyStateCard title="Empty" />);

    const actionsDiv = container.querySelector(
      ".flex.flex-wrap.items-center.justify-center.gap-2"
    );
    expect(actionsDiv).not.toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <EmptyStateCard title="Test" className="my-custom-class" />
    );

    expect(container.firstChild).toHaveClass("my-custom-class");
  });

  it("renders full component with all props", () => {
    render(
      <EmptyStateCard
        title="No bookmarks"
        description="You haven't bookmarked any events yet"
        actions={
          <>
            <button type="button">Browse events</button>
            <button type="button">View schedule</button>
          </>
        }
      />
    );

    expect(screen.getByText("No bookmarks")).toBeInTheDocument();
    expect(
      screen.getByText("You haven't bookmarked any events yet")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Browse events" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "View schedule" })
    ).toBeInTheDocument();
  });
});
