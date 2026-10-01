import { describe, expect, it } from "vitest";
import {
  decodeHtml,
  normalizeAlbum,
  normalizeArtist,
  normalizePlaylist,
  normalizeTrack,
  parseLicense,
  upgradeImageUrl,
} from "./jamendo.normalize";

describe("Jamendo Normalizers", () => {
  describe("decodeHtml", () => {
    it("decodes standard HTML entities", () => {
      expect(decodeHtml("Rock &amp; Roll")).toBe("Rock & Roll");
      expect(decodeHtml("&quot;Hello&quot;")).toBe('"Hello"');
      expect(decodeHtml("&#039;World&#039;")).toBe("'World'");
      expect(decodeHtml("&lt;tag&gt;")).toBe("<tag>");
      expect(decodeHtml("Caf&eacute; &agrave; Paris")).toBe("Café à Paris");
    });

    it("decodes decimal and hex entities", () => {
      expect(decodeHtml("&#65;&#66;&#67;")).toBe("ABC");
      expect(decodeHtml("&#x41;&#x42;&#x43;")).toBe("ABC");
    });

    it("handles empty or missing strings safely", () => {
      expect(decodeHtml("")).toBe("");
      expect(decodeHtml(undefined)).toBe("");
      expect(decodeHtml(null)).toBe("");
    });
  });

  describe("upgradeImageUrl", () => {
    it("replaces width=300 with width=500", () => {
      const input =
        "https://usercontent.jamendo.com?type=album&id=33&width=300&trackid=241";
      expect(upgradeImageUrl(input)).toBe(
        "https://usercontent.jamendo.com?type=album&id=33&width=500&trackid=241",
      );
    });

    it("returns fallback for empty inputs", () => {
      expect(upgradeImageUrl("")).toBe("/images/fallback-cover.svg");
      expect(upgradeImageUrl(null)).toBe("/images/fallback-cover.svg");
      expect(upgradeImageUrl(undefined)).toBe("/images/fallback-cover.svg");
    });
  });

  describe("parseLicense", () => {
    it("identifies various Creative Commons variants", () => {
      const byNcNd = parseLicense(
        "http://creativecommons.org/licenses/by-nc-nd/3.0/",
      );
      expect(byNcNd.code).toBe("cc-by-nc-nd");
      expect(byNcNd.label).toContain("CC BY-NC-ND 3.0");

      const bySa = parseLicense(
        "http://creativecommons.org/licenses/by-sa/2.0/",
      );
      expect(bySa.code).toBe("cc-by-sa");
      expect(bySa.label).toContain("CC BY-SA 2.0");

      const by = parseLicense("http://creativecommons.org/licenses/by/4.0/");
      expect(by.code).toBe("cc-by");
      expect(by.label).toContain("CC BY 4.0");

      const cc0 = parseLicense(
        "https://creativecommons.org/publicdomain/zero/1.0/",
      );
      expect(cc0.code).toBe("cc0");
      expect(cc0.label).toContain("CC0");
    });

    it("falls back safely when license URL is missing", () => {
      const fallback = parseLicense("");
      expect(fallback.code).toBe("cc-by-sa");
      expect(fallback.url).toBe("https://creativecommons.org/licenses/");
    });
  });

  describe("normalizeTrack", () => {
    it("normalizes a raw Jamendo track fixture correctly", () => {
      const raw = {
        id: "241",
        name: "Simple &amp; Exercice",
        duration: "340",
        artist_id: "5",
        artist_name: "Both &amp; Co",
        album_id: "33",
        album_name: "Simple Exercice",
        license_ccurl: "http://creativecommons.org/licenses/by-nc-sa/2.0/",
        album_image:
          "https://usercontent.jamendo.com?type=album&id=33&width=300&trackid=241",
        audio: "https://prod-1.storage.jamendo.com/?trackid=241&format=mp32",
        musicinfo: {
          tags: {
            genres: ["rock", "alternative"],
          },
        },
      };

      const track = normalizeTrack(raw);
      expect(track.id).toBe("241");
      expect(track.title).toBe("Simple & Exercice");
      expect(track.artistName).toBe("Both & Co");
      expect(track.duration).toBe(340);
      expect(track.genre).toBe("rock");
      expect(track.coverUrl).toContain("width=500");
      expect(track.license).toBe("cc-by-nc-sa");
      expect(track.provider).toBe("jamendo");
      expect(track.providerTrackId).toBe("241");
    });
  });

  describe("normalizeAlbum", () => {
    it("normalizes a raw Jamendo album fixture correctly", () => {
      const raw = {
        id: "24",
        name: "Premiers &amp; Jets",
        releasedate: "2004-12-17",
        artist_id: "7",
        artist_name: "TriFace",
        image: "https://usercontent.jamendo.com?type=album&id=24&width=300",
      };

      const album = normalizeAlbum(raw);
      expect(album.id).toBe("24");
      expect(album.title).toBe("Premiers & Jets");
      expect(album.artistName).toBe("TriFace");
      expect(album.year).toBe(2004);
      expect(album.coverUrl).toContain("width=500");
      expect(album.provider).toBe("jamendo");
    });
  });

  describe("normalizeArtist", () => {
    it("normalizes a raw Jamendo artist fixture correctly", () => {
      const raw = {
        id: "7",
        name: "TriFace &amp; Band",
        image: "https://usercontent.jamendo.com?type=artist&id=7&width=300",
      };

      const artist = normalizeArtist(raw);
      expect(artist.id).toBe("7");
      expect(artist.name).toBe("TriFace & Band");
      expect(artist.imageUrl).toContain("width=500");
      expect(artist.provider).toBe("jamendo");
    });
  });

  describe("normalizePlaylist", () => {
    it("normalizes a raw Jamendo playlist fixture correctly", () => {
      const raw = {
        id: "500716829",
        name: "Halloween &amp; Spooks",
        user_name: "creator_1",
        image: "",
      };

      const playlist = normalizePlaylist(raw);
      expect(playlist.id).toBe("500716829");
      expect(playlist.name).toBe("Halloween & Spooks");
      expect(playlist.ownerName).toBe("creator_1");
      expect(playlist.coverUrl).toBe("/images/fallback-cover.svg");
    });
  });
});
