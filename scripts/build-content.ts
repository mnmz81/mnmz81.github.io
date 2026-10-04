// Placeholder from Task 00; Task 01 replaces this file with the real pipeline.
// Copies fixture JSON into public/content so the app builds before Task 01 lands.
import { cpSync, rmSync } from 'node:fs';

rmSync('public/content', { recursive: true, force: true });
cpSync('src/testing/fixtures/content', 'public/content', { recursive: true });
console.log('[content] placeholder: copied fixtures to public/content');
