// Runs in a child process with a forced TZ so we can prove getBusinessOpenStatus
// evaluates *Cairo* local time rather than the machine's timezone, and that the
// Egypt summer offset (EEST, UTC+3) is honoured rather than a hardcoded UTC+2.
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = process.env.TZPROBE_ROOT!;
const mod: any = await import(pathToFileURL(path.join(ROOT, 'src/utils/directoryEnhancements.ts')).href);
const fn = mod.getBusinessOpenStatus;

// Business open ٩ ص إلى ٢ م == 09:00-14:00 Cairo.
const CASES: Array<{ iso: string; expected: boolean; why: string }> = [
  { iso: '2026-07-06T06:30:00Z', expected: true, why: 'summer 06:30Z == 09:30 Cairo (UTC+3) -> open; a fixed UTC+2 impl computes 08:30 -> closed' },
  { iso: '2026-07-06T10:00:00Z', expected: true, why: 'summer 10:00Z == 13:00 Cairo -> open' },
  { iso: '2026-07-06T11:30:00Z', expected: false, why: 'summer 11:30Z == 14:30 Cairo -> closed; a fixed UTC+2 impl computes 13:30 -> open' },
  { iso: '2026-01-05T06:30:00Z', expected: false, why: 'winter 06:30Z == 08:30 Cairo (UTC+2) -> closed' },
  { iso: '2026-01-05T10:00:00Z', expected: true, why: 'winter 10:00Z == 12:00 Cairo -> open' },
  { iso: '2026-01-05T12:30:00Z', expected: false, why: 'winter 12:30Z == 14:30 Cairo -> closed' },
];

const HOURS = '٩ ص إلى ٢ م';
const results = CASES.map((c) => ({ iso: c.iso, expected: c.expected, actual: !!fn(HOURS, new Date(c.iso))?.isOpen }));

process.stdout.write(
  JSON.stringify({
    envTZ: process.env.TZ ?? '(unset)',
    iana: Intl.DateTimeFormat().resolvedOptions().timeZone,
    results,
  }),
);
