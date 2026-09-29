import assert from 'node:assert/strict';
import { loadLeafletScript } from '../components/map/utils/leafletLoader';

class MockElement {
  tagName: string;
  src = '';
  integrity = '';
  crossOrigin = '';
  rel = '';
  href = '';
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  listeners: Record<string, Function[]> = {};
  parentNode: MockHead | null = null;

  constructor(tagName: string) {
    this.tagName = tagName;
  }

  addEventListener(event: string, fn: Function) {
    this.listeners[event] = this.listeners[event] || [];
    this.listeners[event].push(fn);
  }

  removeEventListener(event: string, fn: Function) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter((f) => f !== fn);
    }
  }

  remove() {
    if (this.parentNode) {
      this.parentNode.removeChild(this);
    }
  }

  trigger(event: 'load' | 'error') {
    if (event === 'load' && this.onload) this.onload();
    if (event === 'error' && this.onerror) this.onerror();
    for (const fn of this.listeners[event] || []) {
      fn();
    }
  }
}

class MockHead {
  children: MockElement[] = [];

  appendChild(el: MockElement) {
    el.parentNode = this;
    this.children.push(el);
    return el;
  }

  removeChild(el: MockElement) {
    const idx = this.children.indexOf(el);
    if (idx !== -1) {
      this.children.splice(idx, 1);
      el.parentNode = null;
    }
  }
}

class MockDocument {
  head = new MockHead();

  createElement(tagName: string) {
    return new MockElement(tagName);
  }

  querySelector(selector: string): MockElement | null {
    if (selector.includes('script[src*="leaflet.js"]')) {
      return this.head.children.find((c) => c.tagName === 'script' && c.src.includes('leaflet.js')) || null;
    }
    if (selector.includes('link[href*="leaflet.css"]')) {
      return this.head.children.find((c) => c.tagName === 'link' && c.href.includes('leaflet.css')) || null;
    }
    return null;
  }
}

console.log('--- Running Leaflet Loader Unit Test (ITEM A: U14) ---');

const doc = new MockDocument();
const win: any = {};
let errorCalls = 0;
let successCalls = 0;

// Attempt 1: initial load
loadLeafletScript({
  doc,
  win,
  onSuccess: () => { successCalls++; },
  onError: () => { errorCalls++; },
});

const firstScript = doc.querySelector('script[src*="leaflet.js"]');
assert.ok(firstScript, 'Initial attempt must create a script element in head');
assert.equal(firstScript.src, 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js');
assert.equal(firstScript.integrity, 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=');
assert.equal(firstScript.crossOrigin, '');

// Simulate script error on attempt 1
firstScript.trigger('error');
assert.equal(errorCalls, 1, 'onError must be called on script failure');

// Requirement: on script error (and before any retry) remove the failed script element
assert.equal(
  doc.head.children.includes(firstScript),
  false,
  'Failed script element must be removed from head on error'
);

// Attempt 2: User clicks Retry
loadLeafletScript({
  doc,
  win,
  onSuccess: () => { successCalls++; },
  onError: () => { errorCalls++; },
});

// Requirement: Retry must produce a NEW network request to the Leaflet URL -> new script element created and old one gone
const secondScript = doc.querySelector('script[src*="leaflet.js"]');
assert.ok(secondScript, 'Retry must create a new script element');
assert.notEqual(secondScript, firstScript, 'Retry must create a fresh script element, not reuse the failed one');
assert.equal(doc.head.children.includes(firstScript), false, 'Old failed script must remain gone from head');
assert.equal(secondScript.integrity, 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=');
assert.equal(secondScript.crossOrigin, '');

// Simulate success on retry
win.L = { version: '1.9.4' };
secondScript.trigger('load');
assert.equal(successCalls, 1, 'onSuccess must be called after retry succeeds');

console.log('✓ Leaflet Loader Unit Test passed');
