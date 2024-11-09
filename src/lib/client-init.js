import { Buffer as BufferModule } from 'buffer';

if (typeof window !== 'undefined') {
    window.Buffer = window.Buffer || BufferModule;
    globalThis.Buffer = globalThis.Buffer || BufferModule;
} 