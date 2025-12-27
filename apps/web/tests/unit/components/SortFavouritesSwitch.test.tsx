import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SortFavouritesSwitch } from "~/components/shared/SortFavouritesSwitch";

describe("SortFavouritesSwitch", () => {
  it("renders with label", () => {
    render(<SortFavouritesSwitch sortSwitchId="test-switch" />);

    expect(screen.getByText("Favourites first")).toBeInTheDocument();
  });

  it("renders unchecked by default", () => {
    render(<SortFavouritesSwitch sortSwitchId="test-switch" />);

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).not.toBeChecked();
  });

  it("renders checked when sortByFavourites is true", () => {
    render(
      <SortFavouritesSwitch sortSwitchId="test-switch" sortByFavourites={true} />
    );

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeChecked();
  });

  it("calls onToggle when clicked", () => {
    const onToggle = vi.fn();
    render(
      <SortFavouritesSwitch sortSwitchId="test-switch" onToggle={onToggle} />
    );

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it("calls onToggle with false when unchecking", () => {
    const onToggle = vi.fn();
    render(
      <SortFavouritesSwitch
        sortSwitchId="test-switch"
        sortByFavourites={true}
        onToggle={onToggle}
      />
    );

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    expect(onToggle).toHaveBeenCalledWith(false);
  });

  it("uses provided sortSwitchId for checkbox id", () => {
    render(<SortFavouritesSwitch sortSwitchId="my-unique-id" />);

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toHaveAttribute("id", "my-unique-id");
  });

  it("label is associated with checkbox via htmlFor", () => {
    render(<SortFavouritesSwitch sortSwitchId="test-id" />);

    const label = screen.getByText("Favourites first");
    expect(label).toHaveAttribute("for", "test-id");
  });
});
