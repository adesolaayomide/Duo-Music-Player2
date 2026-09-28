import { describe, it, expect } from 'vitest';
import { formatDuration, clamp, buildUrl } from '@/lib/utils/helpers';

describe('formatDuration', () => {
  it('formats 0 seconds', () => expect(formatDuration(0)).toBe('0:00'));
  it('formats 65 seconds to 1:05', () => expect(formatDuration(65)).toBe('1:05'));
  it('formats 187 seconds to 3:07', () => expect(formatDuration(187)).toBe('3:07'));
  it('formats 3600 seconds to 60:00', () => expect(formatDuration(3600)).toBe('60:00'));
  it('handles NaN gracefully', () => expect(formatDuration(NaN)).toBe('0:00'));
  it('handles negative gracefully', () => expect(formatDuration(-1)).toBe('0:00'));
});

describe('clamp', () => {
  it('clamps below min', () => expect(clamp(-5, 0, 1)).toBe(0));
  it('clamps above max', () => expect(clamp(5, 0, 1)).toBe(1));
  it('passes through in-range value', () => expect(clamp(0.5, 0, 1)).toBe(0.5));
});

describe('buildUrl', () => {
  it('builds a URL with params', () => {
    const url = buildUrl('https://example.com/api', { foo: 'bar', count: 10 });
    expect(url).toContain('foo=bar');
    expect(url).toContain('count=10');
  });
  it('omits undefined params', () => {
    const url = buildUrl('https://example.com/api', { foo: undefined });
    expect(url).not.toContain('foo');
  });
});
