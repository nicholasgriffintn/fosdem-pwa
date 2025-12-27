import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { DaySwitcher } from "~/components/shared/DaySwitcher";

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    disabled,
    className,
    ...props
  }: {
    children: ReactNode;
    to: string;
    disabled?: boolean;
    className?: string;
  }) => (
    <a
      href={to}
      data-disabled={disabled}
      className={className}
      {...props}
    >
      {children}
    </a>
  ),
}));

describe("DaySwitcher", () => {
  const days = [
    { id: "saturday", name: "Saturday" },
    { id: "sunday", name: "Sunday" },
  ];

  it("renders all day buttons", () => {
    render(
      <DaySwitcher
        days={days}
        dataSplitByDay={{ saturday: [{}], sunday: [{}] }}
      />
    );

    expect(screen.getByText("Saturday")).toBeInTheDocument();
    expect(screen.getByText("Sunday")).toBeInTheDocument();
  });

  it("marks active day with aria-current", () => {
    render(
      <DaySwitcher
        days={days}
        dayId="saturday"
        dataSplitByDay={{ saturday: [{}], sunday: [{}] }}
      />
    );

    const saturdayLink = screen.getByText("Saturday");
    const sundayLink = screen.getByText("Sunday");

    expect(saturdayLink).toHaveAttribute("aria-current", "page");
    expect(sundayLink).not.toHaveAttribute("aria-current");
  });

  it("disables days without events", () => {
    render(
      <DaySwitcher
        days={days}
        dataSplitByDay={{ saturday: [{}], sunday: [] }}
      />
    );

    const saturdayLink = screen.getByText("Saturday");
    const sundayLink = screen.getByText("Sunday");

    expect(saturdayLink).toHaveAttribute("data-disabled", "false");
    expect(sundayLink).toHaveAttribute("data-disabled", "true");
  });

  it("applies active class to selected day", () => {
    render(
      <DaySwitcher
        days={days}
        dayId="sunday"
        dataSplitByDay={{ saturday: [{}], sunday: [{}] }}
      />
    );

    const sundayLink = screen.getByText("Sunday");
    expect(sundayLink.className).toContain("bg-primary");
  });

  it("applies disabled class to days without events", () => {
    render(
      <DaySwitcher
        days={days}
        dataSplitByDay={{ saturday: [], sunday: [{}] }}
      />
    );

    const saturdayLink = screen.getByText("Saturday");
    expect(saturdayLink.className).toContain("opacity-50");
  });

  it("handles empty dataSplitByDay", () => {
    render(<DaySwitcher days={days} dataSplitByDay={{}} />);

    const saturdayLink = screen.getByText("Saturday");
    const sundayLink = screen.getByText("Sunday");

    expect(saturdayLink).toHaveAttribute("data-disabled", "true");
    expect(sundayLink).toHaveAttribute("data-disabled", "true");
  });

  it("handles single day", () => {
    render(
      <DaySwitcher
        days={[{ id: "saturday", name: "Saturday" }]}
        dataSplitByDay={{ saturday: [{}] }}
      />
    );

    expect(screen.getByText("Saturday")).toBeInTheDocument();
    expect(screen.queryByText("Sunday")).not.toBeInTheDocument();
  });
});
