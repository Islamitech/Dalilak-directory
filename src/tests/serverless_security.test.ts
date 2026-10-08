import { describe, expect, it } from 'vitest';
import {
  getAllowedCorsOrigin,
  isPrivateOrLocalIp,
  resolveRequestOrigin,
} from '../server/httpSecurity';
import { isValidGoogleMapsUrl } from '../server/places/mapsUrl';

describe('Host header allowlist (src/server/httpSecurity)', () => {
  it('rejects untrusted and malicious host headers', () => {
    expect(resolveRequestOrigin('evil.com')).toBe('https://www.dalilaak.com');
    expect(resolveRequestOrigin('attacker.vercel.app')).toBe('https://www.dalilaak.com');
    expect(resolveRequestOrigin('my-phishing-dalilaak.com')).toBe('https://www.dalilaak.com');
    expect(resolveRequestOrigin('169.254.169.254')).toBe('https://www.dalilaak.com');
    expect(resolveRequestOrigin('')).toBe('https://www.dalilaak.com');
    expect(resolveRequestOrigin(undefined)).toBe('https://www.dalilaak.com');
  });

  it('accepts legitimate production and local dev hosts', () => {
    expect(resolveRequestOrigin('www.dalilaak.com')).toBe('https://www.dalilaak.com');
    expect(resolveRequestOrigin('dalilaak.com')).toBe('https://dalilaak.com');
    expect(resolveRequestOrigin('dalilak.vercel.app')).toBe('https://dalilak.vercel.app');
    expect(resolveRequestOrigin('localhost:3000', 'http')).toBe('http://localhost:3000');
    expect(resolveRequestOrigin('127.0.0.1:5173', 'http')).toBe('http://127.0.0.1:5173');
  });
});

describe('SSRF & private IP blocking', () => {
  it('blocks private and loopback addresses', () => {
    expect(isPrivateOrLocalIp('localhost')).toBe(true);
    expect(isPrivateOrLocalIp('127.0.0.1')).toBe(true);
    expect(isPrivateOrLocalIp('10.0.0.1')).toBe(true);
    expect(isPrivateOrLocalIp('192.168.1.100')).toBe(true);
    expect(isPrivateOrLocalIp('172.16.0.1')).toBe(true);
    expect(isPrivateOrLocalIp('172.31.255.255')).toBe(true);
    expect(isPrivateOrLocalIp('169.254.169.254')).toBe(true);
  });

  it('allows public addresses and rejects private Google Maps URLs', () => {
    expect(isPrivateOrLocalIp('8.8.8.8')).toBe(false);
    expect(isPrivateOrLocalIp('172.32.0.1')).toBe(false);
    expect(isValidGoogleMapsUrl('https://maps.google.com/maps?q=cairo')).toBe(true);
    expect(isValidGoogleMapsUrl('http://127.0.0.1/maps')).toBe(false);
    expect(isValidGoogleMapsUrl('https://evil.com/maps')).toBe(false);
  });
});

describe('CORS origin restriction', () => {
  it('allows verified Dalilak and local development origins', () => {
    expect(getAllowedCorsOrigin('https://www.dalilaak.com')).toBe('https://www.dalilaak.com');
    expect(getAllowedCorsOrigin('https://dalilaak.com')).toBe('https://dalilaak.com');
    expect(getAllowedCorsOrigin('http://localhost:5173')).toBe('http://localhost:5173');
  });

  it('restricts arbitrary third-party origins to the canonical host', () => {
    expect(getAllowedCorsOrigin('https://evil-hacker.com')).toBe('https://www.dalilaak.com');
    expect(getAllowedCorsOrigin('https://phishing-dalilaak.com')).toBe('https://www.dalilaak.com');
    expect(getAllowedCorsOrigin('javascript:alert(1)')).toBe('https://www.dalilaak.com');
  });
});
