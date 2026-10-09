import { describe, expect, it, beforeEach, afterEach } from "vitest";
import crypto from "crypto";
import { musicTransferClient } from "./client";

describe("MusicTransfer Client", () => {
  const originalEnv = process.env;
  const testSecret = "test_signing_secret_123456";

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      MUSIC_TRANSFER_CLIENT_ID: "mock_client_id",
      MUSIC_TRANSFER_CLIENT_SECRET: "mock_client_secret",
      MUSIC_TRANSFER_API_BASE_URL: "https://api.musicapi.com",
      MUSIC_TRANSFER_WEBHOOK_SIGNING_SECRET: testSecret,
      MUSIC_TRANSFER_ACCOUNT_SLUG: "duo-player",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("getConnectUrl", () => {
    it("generates correct hosted SSO auth URL", () => {
      const url = musicTransferClient.getConnectUrl(
        "spotify",
        "https://example.com/api/transfer/callback",
      );

      expect(url).toContain("https://app.musicapi.com/integrations/duo-player");
      expect(url).toContain("ms=spotify");
      expect(url).toContain("forwardFailures=true");
      expect(url).toContain(
        encodeURIComponent("https://example.com/api/transfer/callback"),
      );
    });

    it("accepts object options format", () => {
      const url = musicTransferClient.getConnectUrl({
        service: "apple",
        returnUrl: "https://example.com/callback",
        uniqueId: "user-abc-123",
      });

      expect(url).toContain("ms=apple");
      expect(url).toContain("uniqueId=user-abc-123");
    });
  });

  describe("verifyWebhookSignature", () => {
    const rawBody = JSON.stringify({
      event: "transfer.progress",
      data: { transferUuid: "uuid-123", pct: 50 },
    });

    it("accepts a valid HMAC-SHA256 signature within the replay window", () => {
      const nowSeconds = Math.floor(Date.now() / 1000);
      const signaturePayload = `${nowSeconds}.${rawBody}`;
      const validHmac = crypto
        .createHmac("sha256", testSecret)
        .update(signaturePayload, "utf8")
        .digest("hex");

      const header = `t=${nowSeconds},v1=${validHmac}`;
      const isValid = musicTransferClient.verifyWebhookSignature(
        header,
        rawBody,
        testSecret,
      );

      expect(isValid).toBe(true);
    });

    it("rejects an invalid signature hash", () => {
      const nowSeconds = Math.floor(Date.now() / 1000);
      const tamperedHmac =
        "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
      const header = `t=${nowSeconds},v1=${tamperedHmac}`;

      const isValid = musicTransferClient.verifyWebhookSignature(
        header,
        rawBody,
        testSecret,
      );
      expect(isValid).toBe(false);
    });

    it("rejects a timestamp older than 300 seconds (replay attack prevention)", () => {
      const oldSeconds = Math.floor(Date.now() / 1000) - 301;
      const signaturePayload = `${oldSeconds}.${rawBody}`;
      const validHmac = crypto
        .createHmac("sha256", testSecret)
        .update(signaturePayload, "utf8")
        .digest("hex");

      const header = `t=${oldSeconds},v1=${validHmac}`;
      const isValid = musicTransferClient.verifyWebhookSignature(
        header,
        rawBody,
        testSecret,
      );

      expect(isValid).toBe(false);
    });

    it("rejects a timestamp too far in the future (>60 seconds)", () => {
      const futureSeconds = Math.floor(Date.now() / 1000) + 70;
      const signaturePayload = `${futureSeconds}.${rawBody}`;
      const validHmac = crypto
        .createHmac("sha256", testSecret)
        .update(signaturePayload, "utf8")
        .digest("hex");

      const header = `t=${futureSeconds},v1=${validHmac}`;
      const isValid = musicTransferClient.verifyWebhookSignature(
        header,
        rawBody,
        testSecret,
      );

      expect(isValid).toBe(false);
    });

    it("verifies webhook with whsec_ prefixed secret and base64 digest", () => {
      const whsecSecret = "whsec_3e264f4933dbf0bb5f7561320eb6fa13";
      const nowSeconds = Math.floor(Date.now() / 1000);
      const signaturePayload = `${nowSeconds}.${rawBody}`;
      const validHmacB64 = crypto
        .createHmac("sha256", whsecSecret)
        .update(signaturePayload, "utf8")
        .digest("base64");

      const header = `t=${nowSeconds},v1=${validHmacB64}`;
      const isValid = musicTransferClient.verifyWebhookSignature(
        header,
        rawBody,
        whsecSecret,
      );
      expect(isValid).toBe(true);
    });

    it("returns false when header or secret is missing", () => {
      expect(
        musicTransferClient.verifyWebhookSignature(null, rawBody, testSecret),
      ).toBe(false);
      expect(
        musicTransferClient.verifyWebhookSignature("t=123,v1=abc", rawBody, ""),
      ).toBe(false);
    });

    it("returns false when signature header format is malformed", () => {
      expect(
        musicTransferClient.verifyWebhookSignature(
          "invalid_header",
          rawBody,
          testSecret,
        ),
      ).toBe(false);
    });
  });
});
