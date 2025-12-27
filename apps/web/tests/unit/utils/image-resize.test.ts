import { describe, expect, it } from "vitest";

import {
  IMAGE_RESIZE_ENDPOINT,
  getResizedImageUrl,
  getResizedImageSrc,
} from "~/utils/image-resize";

describe("image-resize", () => {
  describe("IMAGE_RESIZE_ENDPOINT", () => {
    it("exports the correct endpoint", () => {
      expect(IMAGE_RESIZE_ENDPOINT).toBe("https://images.s3rve.co.uk");
    });
  });

  describe("getResizedImageUrl", () => {
    it("builds URL with width parameter", () => {
      const result = getResizedImageUrl({
        imagePath: "/images/photo.jpg",
        width: 300,
      });
      expect(result).toBe(
        "https://images.s3rve.co.uk/?width=300&image=%2Fimages%2Fphoto.jpg"
      );
    });

    it("builds URL with height parameter", () => {
      const result = getResizedImageUrl({
        imagePath: "/images/photo.jpg",
        height: 200,
      });
      expect(result).toBe(
        "https://images.s3rve.co.uk/?height=200&image=%2Fimages%2Fphoto.jpg"
      );
    });

    it("builds URL with both width and height", () => {
      const result = getResizedImageUrl({
        imagePath: "/images/photo.jpg",
        width: 300,
        height: 200,
      });
      expect(result).toBe(
        "https://images.s3rve.co.uk/?width=300&height=200&image=%2Fimages%2Fphoto.jpg"
      );
    });

    it("builds URL without dimensions", () => {
      const result = getResizedImageUrl({
        imagePath: "/images/photo.jpg",
      });
      expect(result).toBe(
        "https://images.s3rve.co.uk/?&image=%2Fimages%2Fphoto.jpg"
      );
    });

    it("encodes special characters in image path", () => {
      const result = getResizedImageUrl({
        imagePath: "/images/my photo (1).jpg",
        width: 100,
      });
      expect(result).toContain(
        encodeURIComponent("/images/my photo (1).jpg")
      );
    });
  });

  describe("getResizedImageSrc", () => {
    it("returns original URL for http URLs", () => {
      const httpUrl = "http://example.com/image.jpg";
      expect(getResizedImageSrc(httpUrl, 300, 200)).toBe(httpUrl);
    });

    it("returns original URL for https URLs", () => {
      const httpsUrl = "https://example.com/image.jpg";
      expect(getResizedImageSrc(httpsUrl, 300, 200)).toBe(httpsUrl);
    });

    it("returns resized URL for relative paths", () => {
      const result = getResizedImageSrc("/images/photo.jpg", 300, 200);
      expect(result).toBe(
        "https://images.s3rve.co.uk/?width=300&height=200&image=%2Fimages%2Fphoto.jpg"
      );
    });

    it("handles relative paths without dimensions", () => {
      const result = getResizedImageSrc("/images/photo.jpg");
      expect(result).toBe(
        "https://images.s3rve.co.uk/?&image=%2Fimages%2Fphoto.jpg"
      );
    });

    it("handles relative paths with only width", () => {
      const result = getResizedImageSrc("/images/photo.jpg", 400);
      expect(result).toBe(
        "https://images.s3rve.co.uk/?width=400&image=%2Fimages%2Fphoto.jpg"
      );
    });
  });
});
