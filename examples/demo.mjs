// Purpose: Demonstrate source-linked review without invoking any external model.
import { readFile } from 'node:fs/promises';
import { compare, review, toMarkdown } from '../src/index.mjs';
import { review as reviewer } from './demo-reviewer.mjs';
const before = await readFile(new URL('./before.md', import.meta.url), 'utf8');
const after = await readFile(new URL('./after.md', import.meta.url), 'utf8');
console.log('Synthetic offline reviewer; no model accuracy claim.');
console.log(toMarkdown(await review(compare(before, after), { reviewer })));
