import { describe, expect, it } from "vitest";

import { fosdemImageDetails } from "~/data/fosdem-image-details";
import { fosdemTypeDescriptions } from "~/data/fosdem-type-descriptions";

describe("fosdem-image-details", () => {
  const expectedTypes = ["keynote", "maintrack", "devroom", "lightningtalk", "other"];

  it("contains all expected type keys", () => {
    for (const type of expectedTypes) {
      expect(fosdemImageDetails).toHaveProperty(type);
    }
  });

  it("each type has required image properties", () => {
    for (const type of expectedTypes) {
      const details = fosdemImageDetails[type as keyof typeof fosdemImageDetails];
      expect(details).toHaveProperty("alt");
      expect(details).toHaveProperty("license");
      expect(details).toHaveProperty("original");
      expect(details).toHaveProperty("changes");
    }
  });

  it("all images have CC BY-SA 4.0 license", () => {
    for (const type of expectedTypes) {
      const details = fosdemImageDetails[type as keyof typeof fosdemImageDetails];
      expect(details.license).toBe("CC BY-SA 4.0");
    }
  });

  it("all original links point to Wikimedia Commons", () => {
    for (const type of expectedTypes) {
      const details = fosdemImageDetails[type as keyof typeof fosdemImageDetails];
      expect(details.original).toContain("commons.wikimedia.org");
    }
  });

  it("all alt texts are non-empty strings", () => {
    for (const type of expectedTypes) {
      const details = fosdemImageDetails[type as keyof typeof fosdemImageDetails];
      expect(typeof details.alt).toBe("string");
      expect(details.alt.length).toBeGreaterThan(0);
    }
  });
});

describe("fosdem-type-descriptions", () => {
  const expectedTypes = ["keynote", "maintrack", "devroom", "lightningtalk", "other"];

  it("contains all expected type keys", () => {
    for (const type of expectedTypes) {
      expect(fosdemTypeDescriptions).toHaveProperty(type);
    }
  });

  it("all descriptions are non-empty strings", () => {
    for (const type of expectedTypes) {
      const description = fosdemTypeDescriptions[type as keyof typeof fosdemTypeDescriptions];
      expect(typeof description).toBe("string");
      expect(description.length).toBeGreaterThan(0);
    }
  });

  it("devroom description mentions developer rooms", () => {
    expect(fosdemTypeDescriptions.devroom.toLowerCase()).toContain("developer room");
  });

  it("keynote description mentions FOSDEM", () => {
    expect(fosdemTypeDescriptions.keynote).toContain("FOSDEM");
  });

  it("lightningtalk description mentions 15 minutes", () => {
    expect(fosdemTypeDescriptions.lightningtalk).toContain("15 minutes");
  });

  it("maintrack description mentions program committee", () => {
    expect(fosdemTypeDescriptions.maintrack.toLowerCase()).toContain("program committee");
  });

  it("other description mentions Birds of a Feather", () => {
    expect(fosdemTypeDescriptions.other).toContain("Birds of a Feather");
  });
});
