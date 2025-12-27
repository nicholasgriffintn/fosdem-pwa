import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { TypesList } from "~/components/Type/TypesList";
import type { Track, TypeIds } from "~/types/fosdem";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, params, ...props }: { children: ReactNode; to: string; params?: Record<string, string> }) => (
    <a href={`${to.replace("$slug", params?.slug || "")}`} data-to={to} data-params={JSON.stringify(params)} {...props}>
      {children}
    </a>
  ),
}));


const createType = (id: TypeIds, name: string, trackCount: number) => ({
  id,
  name,
  trackCount,
});

const createTrack = (id: string, name: string, type: string): Track => ({
  id,
  name,
  description: "",
  room: "H.1302",
  type,
  day: 1,
  eventCount: 5,
});

describe("TypesList", () => {
  describe("getSingleTrackForType behavior", () => {
    it("links to /type/$slug when type has multiple tracks", () => {
      const types = {
        devroom: createType("devroom", "Developer Rooms", 3),
      };
      const tracks: Record<string, Track> = {
        "go-devroom": createTrack("go-devroom", "Go Devroom", "devroom"),
        "rust-devroom": createTrack("rust-devroom", "Rust Devroom", "devroom"),
        "python-devroom": createTrack("python-devroom", "Python Devroom", "devroom"),
      };

      render(<TypesList types={types} tracks={tracks} />);

      const titleLink = screen.getByRole("link", { name: "Developer Rooms" });
      expect(titleLink).toHaveAttribute("data-to", "/type/$slug");
      expect(titleLink).toHaveAttribute("data-params", JSON.stringify({ slug: "devroom" }));

      const viewButton = screen.getByRole("link", { name: /View Developer Rooms/i });
      expect(viewButton).toHaveAttribute("data-to", "/type/$slug");
      expect(viewButton).toHaveAttribute("data-params", JSON.stringify({ slug: "devroom" }));
    });

    it("links to /track/$slug when type has exactly one track", () => {
      const types = {
        keynote: createType("keynote", "Keynotes", 1),
      };
      const tracks: Record<string, Track> = {
        "keynotes": createTrack("keynotes", "Keynotes Track", "keynote"),
      };

      render(<TypesList types={types} tracks={tracks} />);

      const titleLink = screen.getByRole("link", { name: "Keynotes" });
      expect(titleLink).toHaveAttribute("data-to", "/track/$slug");
      expect(titleLink).toHaveAttribute("data-params", JSON.stringify({ slug: "keynotes" }));

      const viewButton = screen.getByRole("link", { name: /View Keynotes/i });
      expect(viewButton).toHaveAttribute("data-to", "/track/$slug");
      expect(viewButton).toHaveAttribute("data-params", JSON.stringify({ slug: "keynotes" }));
    });

    it("links to /type/$slug when tracks prop is not provided", () => {
      const types = {
        maintrack: createType("maintrack", "Main Tracks", 1),
      };

      render(<TypesList types={types} />);

      const titleLink = screen.getByRole("link", { name: "Main Tracks" });
      expect(titleLink).toHaveAttribute("data-to", "/type/$slug");
      expect(titleLink).toHaveAttribute("data-params", JSON.stringify({ slug: "maintrack" }));
    });

    it("links to /type/$slug when type has zero tracks", () => {
      const types = {
        other: createType("other", "Other", 0),
      };
      const tracks: Record<string, Track> = {};

      render(<TypesList types={types} tracks={tracks} />);

      const titleLink = screen.getByRole("link", { name: "Other" });
      expect(titleLink).toHaveAttribute("data-to", "/type/$slug");
    });
  });

  describe("rendering", () => {
    it("renders all types as cards", () => {
      const types = {
        keynote: createType("keynote", "Keynotes", 1),
        devroom: createType("devroom", "Developer Rooms", 50),
        maintrack: createType("maintrack", "Main Tracks", 5),
      };

      render(<TypesList types={types} />);

      expect(screen.getByText("Keynotes")).toBeInTheDocument();
      expect(screen.getByText("Developer Rooms")).toBeInTheDocument();
      expect(screen.getByText("Main Tracks")).toBeInTheDocument();
    });

    it("displays track count for each type", () => {
      const types = {
        devroom: createType("devroom", "Developer Rooms", 42),
      };

      render(<TypesList types={types} />);

      expect(screen.getByText("42 TRACKS")).toBeInTheDocument();
    });

    it("renders featured images for each type", () => {
      const types = {
        keynote: createType("keynote", "Keynotes", 1),
        devroom: createType("devroom", "Developer Rooms", 10),
      };

      render(<TypesList types={types} />);

      const images = screen.getAllByRole("img");
      expect(images).toHaveLength(2);
    });
  });

  describe("mixed types with single and multiple tracks", () => {
    it("correctly routes each type based on its track count", () => {
      const types = {
        keynote: createType("keynote", "Keynotes", 1),
        devroom: createType("devroom", "Developer Rooms", 2),
      };
      const tracks: Record<string, Track> = {
        "keynotes": createTrack("keynotes", "Keynotes Track", "keynote"),
        "go-devroom": createTrack("go-devroom", "Go Devroom", "devroom"),
        "rust-devroom": createTrack("rust-devroom", "Rust Devroom", "devroom"),
      };

      render(<TypesList types={types} tracks={tracks} />);

      const keynoteLink = screen.getByRole("link", { name: "Keynotes" });
      expect(keynoteLink).toHaveAttribute("data-to", "/track/$slug");
      expect(keynoteLink).toHaveAttribute("data-params", JSON.stringify({ slug: "keynotes" }));

      const devroomLink = screen.getByRole("link", { name: "Developer Rooms" });
      expect(devroomLink).toHaveAttribute("data-to", "/type/$slug");
      expect(devroomLink).toHaveAttribute("data-params", JSON.stringify({ slug: "devroom" }));
    });
  });
});
