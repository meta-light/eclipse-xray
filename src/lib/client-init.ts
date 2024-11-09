import { Buffer } from 'buffer';
import { browser } from '$app/environment';

if (browser) {
    // Make Buffer available in all contexts
    globalThis.Buffer = Buffer;
    window.Buffer = Buffer;
} 