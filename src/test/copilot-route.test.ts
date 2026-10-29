// Runtime validation coverage for: Copilot request validation and local fallback
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/copilot/route';

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/copilot', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

const validRequest = {
  eventState: {
    profile: {
      id: 'event-1',
      name: 'Test Event',
      type: 'wedding',
      date: '2026-12-01',
      guestCount: 100,
      totalBudget: 500000,
      currency: 'INR',
      city: 'Mumbai',
    },
    conversationHistory: [],
  },
  userMessage: 'Suggest a safer timeline.',
  conversationHistory: [],
};

describe('POST /api/copilot', () => {
  const originalApiKey = process.env.GEMINI_API_KEY;

  beforeEach(() => {
    delete process.env.GEMINI_API_KEY;
  });

  afterEach(() => {
    if (originalApiKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalApiKey;
  });

  it('rejects structurally invalid requests', async () => {
    const response = await POST(makeRequest({ userMessage: 'hello' }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: 'Invalid request',
      isLocalFallback: false,
    });
  });

  it('returns an honest local fallback when no API key is configured', async () => {
    const response = await POST(makeRequest(validRequest));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      isLocalFallback: true,
      changeSet: null,
    });
  });

  it('rejects malformed JSON without presenting it as an AI outage', async () => {
    const request = new NextRequest('http://localhost/api/copilot', {
      method: 'POST',
      body: '{invalid',
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: 'Request body must be valid JSON',
      isLocalFallback: false,
    });
  });

  it('rejects unsafe numeric values before they reach the model', async () => {
    const response = await POST(makeRequest({
      ...validRequest,
      eventState: {
        ...validRequest.eventState,
        profile: {
          ...validRequest.eventState.profile,
          guestCount: -1,
        },
      },
    }));

    expect(response.status).toBe(400);
  });

  it('rejects oversized request bodies', async () => {
    const request = new NextRequest('http://localhost/api/copilot', {
      method: 'POST',
      body: JSON.stringify(validRequest),
      headers: {
        'content-type': 'application/json',
        'content-length': '256001',
      },
    });

    const response = await POST(request);

    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toMatchObject({
      error: 'Request body is too large',
    });
  });
});
