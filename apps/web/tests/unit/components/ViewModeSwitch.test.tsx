import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { ViewModeSwitch } from "~/components/shared/ViewModeSwitch";

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    className,
    ...props
  }: {
    children: ReactNode;
    to: string;
    className?: string;
  }) => (
    <a href={to} className={className} {...props}>
      {children}
    </a>
  ),
}));

describe("ViewModeSwitch", () => {
  it("renders all view mode options", () => {
    render(<ViewModeSwitch viewMode="list" />);

    expect(screen.getByText("List")).toBeInTheDocument();
    expect(screen.getByText("Calendar")).toBeInTheDocument();
    expect(screen.getByText("Schedule")).toBeInTheDocument();
  });

  it("highlights active view mode", () => {
    render(<ViewModeSwitch viewMode="calendar" />);

    const calendarLink = screen.getByText("Calendar").closest("a");
    expect(calendarLink?.className).toContain("bg-primary");
  });

  it("does not highlight inactive view modes", () => {
    render(<ViewModeSwitch viewMode="list" />);

    const calendarLink = screen.getByText("Calendar").closest("a");
    const scheduleLink = screen.getByText("Schedule").closest("a");

    expect(calendarLink?.className).not.toContain("bg-primary");
    expect(scheduleLink?.className).not.toContain("bg-primary");
  });

  it("renders icons for each view mode", () => {
    const { container } = render(<ViewModeSwitch viewMode="list" />);

    const svgs = container.querySelectorAll("svg");
    expect(svgs.length).toBe(3);
  });

  it("applies correct classes to active and inactive buttons", () => {
    render(<ViewModeSwitch viewMode="schedule" />);

    const listLink = screen.getByText("List").closest("a");
    const scheduleLink = screen.getByText("Schedule").closest("a");

    expect(listLink?.className).toContain("hover:bg-accent");
    expect(scheduleLink?.className).toContain("bg-primary");
    expect(scheduleLink?.className).toContain("text-primary-foreground");
  });
});
