import { describe, expect, it, vi, beforeEach } from "vitest";
import crypto from "crypto";
import { NextRequest } from "next/server";
import { POST } from "./route";

const TEST_SECRET = "webhook_secret_key_987654";

function makeSignedRequest(body: unknown, headers: Record<string, string> = {}): NextRequest {
  const rawBody = typeof body === "string" ? body : JSON.stringify(body);
  const nowSeconds = Math.floor(Date.now() / 1000);
  const signature = crypto
    .createHmac("sha256", TEST_SECRET)
    .update(`${nowSeconds}.${rawBody}`, "utf8")
    .digest("hex");

  const reqHeaders = new Headers({
    "Content-Type": "application/json",
    "x-musicapi-signature": `t=${nowSeconds},v1=${signature}`,
    ...headers,
  });

  return new NextRequest("http://localhost:3000/api/webhooks/music-transfer", {
    method: "POST",
    headers: reqHeaders,
    body: rawBody,
  });
}

describe("MusicTransfer Webhook Receiver Route", () => {
  beforeEach(() => {
    vi.stubEnv("MUSIC_TRANSFER_WEBHOOK_SIGNING_SECRET", TEST_SECRET);
    vi.stubEnv("MUSIC_TRANSFER_CLIENT_ID", "mock_id");
    vi.stubEnv("MUSIC_TRANSFER_CLIENT_SECRET", "mock_secret");
  });

  it("returns 401 when signature header is missing", async () => {
    const req = new NextRequest("http://localhost:3000/api/webhooks/music-transfer", {
      method: "POST",
      headers: new Headers({ "Content-Type": "application/json" }),
      body: JSON.stringify({ event: "transfer.progress" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("Invalid signature");
  });

  it("returns 401 when signature hash is tampered", async () => {
    const rawBody = JSON.stringify({ event: "transfer.progress" });
    const nowSeconds = Math.floor(Date.now() / 1000);
    const req = new NextRequest("http://localhost:3000/api/webhooks/music-transfer", {
      method: "POST",
      headers: new Headers({
        "Content-Type": "application/json",
        "x-musicapi-signature": `t=${nowSeconds},v1=bad_hash_value_1234567890abcdef`,
      }),
      body: rawBody,
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 200 on valid signature for transfer.progress event", async () => {
    const req = makeSignedRequest({
      event: "transfer.progress",
      createdAt: new Date().toISOString(),
      data: {
        transferUuid: "unknown-uuid-for-test",
        pct: 45,
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.received).toBe(true);
  });

  it("returns 200 on transfer.completed event", async () => {
    const req = makeSignedRequest({
      event: "transfer.completed",
      createdAt: new Date().toISOString(),
      data: {
        transferUuid: "unknown-uuid-for-test",
        totalItems: 10,
        importedItems: 10,
        failedItems: 0,
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.received).toBe(true);
  });

  it("returns 400 when body is malformed JSON", async () => {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const malformedBody = "{ invalid json string ";
    const signature = crypto
      .createHmac("sha256", TEST_SECRET)
      .update(`${nowSeconds}.${malformedBody}`, "utf8")
      .digest("hex");

    const req = new NextRequest("http://localhost:3000/api/webhooks/music-transfer", {
      method: "POST",
      headers: new Headers({
        "Content-Type": "application/json",
        "x-musicapi-signature": `t=${nowSeconds},v1=${signature}`,
      }),
      body: malformedBody,
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Malformed JSON payload");
  });
});

