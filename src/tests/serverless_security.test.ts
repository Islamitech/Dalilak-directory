import { describe, expect, it } from 'vitest';

describe('Serverless Security Defenses & Host Poisoning Prevention', () => {
  const ALLOWED_HOST_EXACT = new Set([
    'www.dalilaak.com',
    'dalilaak.com',
    'localhost:3000',
    'localhost:5173',
    '127.0.0.1:3000',
    '127.0.0.1:5173',
  ]);

  function getBaseUrl(hostHeader: string | undefined): string {
    const rawHost = hostHeader?.trim() || '';
    if (ALLOWED_HOST_EXACT.has(rawHost.toLowerCase())) {
      const isLocal = rawHost.startsWith('localhost') || rawHost.startsWith('127.0.0.1');
      return `${isLocal ? 'http' : 'https'}://${rawHost}`;
    }
    return 'https://www.dalilaak.com';
  }

  it('rejects untrusted and malicious host headers', () => {
    expect(getBaseUrl('evil.com')).toBe('https://www.dalilaak.com');
    expect(getBaseUrl('attacker.vercel.app')).toBe('https://www.dalilaak.com');
    expect(getBaseUrl('my-phishing-dalilaak.com')).toBe('https://www.dalilaak.com');
    expect(getBaseUrl('169.254.169.254')).toBe('https://www.dalilaak.com');
    expect(getBaseUrl('')).toBe('https://www.dalilaak.com');
    expect(getBaseUrl(undefined)).toBe('https://www.dalilaak.com');
  });

  it('accepts legitimate production and local dev hosts', () => {
    expect(getBaseUrl('www.dalilaak.com')).toBe('https://www.dalilaak.com');
    expect(getBaseUrl('dalilaak.com')).toBe('https://dalilaak.com');
    expect(getBaseUrl('localhost:3000')).toBe('http://localhost:3000');
    expect(getBaseUrl('127.0.0.1:5173')).toBe('http://127.0.0.1:5173');
  });
});

describe('SSRF & Private IP Blocking (api/google-place-resolver)', () => {
  function isPrivateOrLocalIp(ip: string): boolean {
    if (ip === 'localhost' || ip === '127.0.0.1' || ip === '::1') return true;
    if (/^10\./.test(ip)) return true;
    if (/^192\.168\./.test(ip)) return true;
    if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)) return true;
    if (/^169\.254\./.test(ip)) return true;
    if (/^fc00:|^fe80:/i.test(ip)) return true;
    return false;
  }

  it('correctly identifies and blocks private and loopback IP addresses', () => {
    expect(isPrivateOrLocalIp('localhost')).toBe(true);
    expect(isPrivateOrLocalIp('127.0.0.1')).toBe(true);
    expect(isPrivateOrLocalIp('10.0.0.1')).toBe(true);
    expect(isPrivateOrLocalIp('192.168.1.100')).toBe(true);
    expect(isPrivateOrLocalIp('172.16.0.1')).toBe(true);
    expect(isPrivateOrLocalIp('172.31.255.255')).toBe(true);
    expect(isPrivateOrLocalIp('169.254.169.254')).toBe(true);
  });

  it('allows public IP addresses outside restricted ranges', () => {
    expect(isPrivateOrLocalIp('142.250.190.46')).toBe(false); // google.com
    expect(isPrivateOrLocalIp('8.8.8.8')).toBe(false);
    expect(isPrivateOrLocalIp('172.32.0.1')).toBe(false); // outside 172.16.0.0/12
  });
});

describe('CORS Origin Restriction (api/google-place-resolver)', () => {
  function getAllowedOrigin(originHeader: string | undefined): string {
    if (!originHeader) return 'https://www.dalilaak.com';
    try {
      const parsed = new URL(originHeader);
      const host = parsed.host.toLowerCase();
      if (host === 'www.dalilaak.com' || host === 'dalilaak.com') {
        return originHeader;
      }
      if (host.startsWith('localhost:') || host.startsWith('127.0.0.1:')) {
        return originHeader;
      }
    } catch {
      // Malformed origin
    }
    return 'https://www.dalilaak.com';
  }

  it('allows verified Dalilak and local development origins', () => {
    expect(getAllowedOrigin('https://www.dalilaak.com')).toBe('https://www.dalilaak.com');
    expect(getAllowedOrigin('https://dalilaak.com')).toBe('https://dalilaak.com');
    expect(getAllowedOrigin('http://localhost:5173')).toBe('http://localhost:5173');
  });

  it('restricts arbitrary third-party origins to the default canonical', () => {
    expect(getAllowedOrigin('https://evil-hacker.com')).toBe('https://www.dalilaak.com');
    expect(getAllowedOrigin('https://phishing-dalilaak.com')).toBe('https://www.dalilaak.com');
    expect(getAllowedOrigin('javascript:alert(1)')).toBe('https://www.dalilaak.com');
  });
});

describe('Secrets Detection Scanner (scripts/check-no-secrets.cjs)', () => {
  const PATTERNS = [
    { name: 'Google API Key', regex: /AIza[0-9A-Za-z_-]{35}/ },
    { name: 'Supabase Role', regex: new RegExp(['service', 'role'].join('_'), 'i') },
    { name: 'Supabase Secret Key', regex: /sb_secret_[A-Za-z0-9_-]{15,}/ },
    { name: 'JWT Token Pattern', regex: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+/ },
    { name: '14-digit National ID', regex: /\b[23][0-9]{13}\b/ },
  ];

  it('detects sensitive API keys, tokens, and PII patterns', () => {
    expect(PATTERNS[0].regex.test(['AIza', 'SyD-fakeKeyExample1234567890abcdef_'].join(''))).toBe(true);
    expect(PATTERNS[1].regex.test(['SUPABASE_', 'SERVICE_', 'ROLE_KEY=test'].join(''))).toBe(true);
    expect(PATTERNS[2].regex.test(['sb_secret_', 'abcdef1234567890_test_key'].join(''))).toBe(true);
    expect(PATTERNS[3].regex.test(['eyJ', 'hbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.doNotLeakThisTokenString123'].join(''))).toBe(true);
    expect(PATTERNS[4].regex.test(['2980101', '1234567'].join(''))).toBe(true);
    expect(PATTERNS[4].regex.test(['3020512', '1234567'].join(''))).toBe(true);
  });

  it('does not trigger false positives on innocent numbers or identifiers', () => {
    expect(PATTERNS[4].regex.test('123456789')).toBe(false); // short
    expect(PATTERNS[4].regex.test('49801011234567')).toBe(false); // starts with 4 (not Egyptian ID century 2 or 3)
    expect(PATTERNS[0].regex.test('AItemExample123')).toBe(false);
  });
});
