import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { PageHeader } from "~/components/shared/PageHeader";

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    ...props
  }: {
    children: ReactNode;
    to: string;
  }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

describe("PageHeader", () => {
  it("renders heading", () => {
    render(<PageHeader heading="Test Heading" />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Test Heading" })
    ).toBeInTheDocument();
  });

  it("renders subtitle when provided", () => {
    render(<PageHeader heading="Title" subtitle="Subtitle text" />);

    expect(screen.getByText("Subtitle text")).toBeInTheDocument();
  });

  it("renders text when provided", () => {
    render(<PageHeader heading="Title" text="Description text" />);

    expect(screen.getByText("Description text")).toBeInTheDocument();
  });

  it("renders children", () => {
    render(
      <PageHeader heading="Title">
        <button type="button">Action</button>
      </PageHeader>
    );

    expect(screen.getByRole("button", { name: "Action" })).toBeInTheDocument();
  });

  it("hides heading visually when displayHeading is false", () => {
    render(<PageHeader heading="Hidden Heading" displayHeading={false} />);

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveClass("sr-only");
  });

  it("shows heading when displayHeading is true", () => {
    render(<PageHeader heading="Visible Heading" displayHeading={true} />);

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).not.toHaveClass("sr-only");
  });

  it("renders breadcrumbs when provided", () => {
    const breadcrumbs = [
      { title: "Home", href: "/" },
      { title: "Events", href: "/events" },
    ];

    render(<PageHeader heading="Title" breadcrumbs={breadcrumbs} />);

    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Events")).toBeInTheDocument();
  });

  it("renders metadata when provided", () => {
    const metadata = [
      { text: "Room H.1302" },
      { text: "Track", href: "/track/go" },
    ];

    render(<PageHeader heading="Title" metadata={metadata} />);

    expect(screen.getByText(/Room H\.1302/)).toBeInTheDocument();
    expect(screen.getByText("Track")).toBeInTheDocument();
  });

  it("shows year alert when viewing non-default year", () => {
    render(<PageHeader heading="Title" year={2024} />);

    expect(
      screen.getByText(/You are viewing the 2024 edition/)
    ).toBeInTheDocument();
  });

  it("does not show year alert for default year", () => {
    render(<PageHeader heading="Title" year={2026} />);

    expect(
      screen.queryByText(/You are viewing the/)
    ).not.toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <PageHeader heading="Title" className="custom-class" />
    );

    expect(container.querySelector(".custom-class")).toBeInTheDocument();
  });

  it("applies custom additionalHeadingPaddingClass", () => {
    const { container } = render(
      <PageHeader
        heading="Title"
        additionalHeadingPaddingClass="my-8"
        displayHeading={true}
      />
    );

    expect(container.querySelector(".my-8")).toBeInTheDocument();
  });
});
