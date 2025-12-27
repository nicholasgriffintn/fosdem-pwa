import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { BottomTabNav } from "~/components/BottomTabNav";

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
  useRouterState: () => "/",
}));

describe("BottomTabNav", () => {
  const mockItems = [
    {
      title: "Home",
      href: "/",
      icon: <span data-testid="home-icon">🏠</span>,
      mobile: true,
    },
    {
      title: "Search",
      href: "/search",
      icon: <span data-testid="search-icon">🔍</span>,
      mobile: true,
    },
    {
      title: "Bookmarks",
      href: "/bookmarks",
      icon: <span data-testid="bookmarks-icon">📚</span>,
      mobile: true,
    },
    {
      title: "Desktop Only",
      href: "/desktop",
      icon: <span data-testid="desktop-icon">💻</span>,
      mobile: false,
    },
  ];

  it("renders mobile navigation", () => {
    render(<BottomTabNav items={mockItems} />);

    expect(screen.getByRole("navigation")).toBeInTheDocument();
    expect(screen.getByRole("navigation")).toHaveAttribute(
      "aria-label",
      "Mobile navigation"
    );
  });

  it("only renders items with mobile: true", () => {
    render(<BottomTabNav items={mockItems} />);

    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Search")).toBeInTheDocument();
    expect(screen.getByText("Bookmarks")).toBeInTheDocument();
    expect(screen.queryByText("Desktop Only")).not.toBeInTheDocument();
  });

  it("renders icons for each item", () => {
    render(<BottomTabNav items={mockItems} />);

    expect(screen.getByTestId("home-icon")).toBeInTheDocument();
    expect(screen.getByTestId("search-icon")).toBeInTheDocument();
    expect(screen.getByTestId("bookmarks-icon")).toBeInTheDocument();
  });

  it("renders links with correct hrefs", () => {
    render(<BottomTabNav items={mockItems} />);

    expect(screen.getByText("Home").closest("a")).toHaveAttribute("href", "/");
    expect(screen.getByText("Search").closest("a")).toHaveAttribute(
      "href",
      "/search"
    );
    expect(screen.getByText("Bookmarks").closest("a")).toHaveAttribute(
      "href",
      "/bookmarks"
    );
  });

  it("handles disabled items", () => {
    const itemsWithDisabled = [
      {
        title: "Disabled",
        href: "/disabled",
        icon: <span>X</span>,
        mobile: true,
        disabled: true,
      },
    ];

    render(<BottomTabNav items={itemsWithDisabled} />);

    const link = screen.getByText("Disabled").closest("a");
    expect(link).toHaveAttribute("href", "#");
  });

  it("sets grid columns based on mobile items count", () => {
    render(<BottomTabNav items={mockItems} />);

    const grid = screen.getByRole("navigation").querySelector(".grid");
    expect(grid).toHaveStyle({ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" });
  });

  it("handles empty items array", () => {
    render(<BottomTabNav items={[]} />);

    const grid = screen.getByRole("navigation").querySelector(".grid");
    expect(grid).toHaveStyle({ gridTemplateColumns: "repeat(1, minmax(0, 1fr))" });
  });
});
