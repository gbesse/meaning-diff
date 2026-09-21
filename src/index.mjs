// Purpose: Compare versioned document sections with exact source provenance and optional semantic review.
import { fingerprint } from '@gbesse/decisionpacks';
import { ensure, nonempty, snapshot, bounded } from './contracts.mjs';
export const CATEGORIES = ['editorial', 'strengthened', 'weakened', 'contradiction', 'behavior_changed', 'uncertain'];
export function parseMarkdown(text) {
  ensure(typeof text === 'string', 'Document must be text');
  const lines = text.replaceAll('\r\n', '\n').split('\n'), blocks = [], counts = new Map();
  let current = { id: 'preamble', title: 'Preamble', startLine: 1, text: '' }, fence = null;
  const flush = () => { if (current.text.trim()) blocks.push({ ...current, text: current.text.replace(/\n$/, '') }); };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i], marker = line.match(/^\s{0,3}(`{3,}|~{3,})/);
    if (marker) { if (!fence) fence = marker[1]; else if (marker[1][0] === fence[0] && marker[1].length >= fence.length) fence = null; }
    const heading = !fence && line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (heading) {
      flush(); const base = `${heading[1].length}:${heading[2]}`, n = (counts.get(base) ?? 0) + 1; counts.set(base, n);
      current = { id: `heading:${base}:${n}`, title: heading[2], startLine: i + 1, text: '' };
    }
    current.text += line + '\n';
  }
  flush(); return blocks;
}
export function parseText(text) { ensure(typeof text === 'string', 'Document must be text'); return text ? [{ id: 'document', title: 'Document', startLine: 1, text }] : []; }
function sections(value) {
  ensure(Array.isArray(value) && value.length <= 10_000, 'Parser must return at most 10000 sections');
  const ids = new Set();
  for (const s of value) { ensure(nonempty(s.id) && !ids.has(s.id) && nonempty(s.title) && typeof s.text === 'string' && Number.isSafeInteger(s.startLine) && s.startLine > 0, 'Invalid or duplicate section'); ids.add(s.id); }
  return snapshot(value);
}
export function compare(before, after, { parser = parseMarkdown } = {}) {
  ensure(typeof before === 'string' && typeof after === 'string', 'Both documents must be strings');
  const old = sections(parser(before)), next = sections(parser(after));
  const previous = new Map(old.map(s => [s.id, s])), current = new Map(next.map(s => [s.id, s]));
  const changes = [];
  for (const id of new Set([...previous.keys(), ...current.keys()])) {
    const a = previous.get(id) ?? null, b = current.get(id) ?? null;
    if (a?.text === b?.text) continue;
    changes.push({ id, kind: !a ? 'added' : !b ? 'removed' : 'modified', before: a, after: b, fingerprint: fingerprint({ before: a, after: b }) });
  }
  return { schemaVersion: 1, beforeFingerprint: fingerprint(before), afterFingerprint: fingerprint(after), changes };
}
export async function review(diff, { reviewer, minProbability = 0.8, maxChanges = 100, timeoutMs = 30_000, signal } = {}) {
  const result = snapshot(diff);
  ensure(result.schemaVersion === 1 && Array.isArray(result.changes), 'Invalid diff');
  ensure(typeof reviewer === 'function', 'Provide an explicit reviewer plugin');
  ensure(Number.isFinite(minProbability) && minProbability >= 0 && minProbability <= 1, 'Invalid probability threshold');
  ensure(Number.isSafeInteger(maxChanges) && maxChanges >= 0 && maxChanges <= 1000, 'Invalid change budget');
  ensure(result.changes.length <= maxChanges, 'Diff exceeds review budget');
  const reviewed = [];
  for (const change of result.changes) {
    ensure(change.fingerprint === fingerprint({ before: change.before, after: change.after }), 'Change provenance mismatch');
    const judgment = snapshot(await bounded(s => reviewer(snapshot(change), { signal: s }), { timeoutMs, signal }));
    ensure(CATEGORIES.includes(judgment.category) && Number.isFinite(judgment.probability) && judgment.probability >= 0 && judgment.probability <= 1, 'Invalid reviewer result');
    reviewed.push({ ...change, judgment: { ...judgment, category: judgment.probability >= minProbability ? judgment.category : 'uncertain' }, requiresReview: true });
  }
  return { ...result, changes: reviewed };
}
export function toMarkdown(diff) {
  // Escape Markdown metacharacters in source headings; raw documents stay in the JSON artifact.
  const escape = value => String(value).replace(/[\\`*_{}\[\]<>#|]/g, '\\$&').replaceAll('\n', ' ');
  return ['# Meaning review', '', ...diff.changes.map(c => `- **${escape(c.judgment?.category ?? 'unreviewed')}** — ${escape(c.kind)}: ${escape(c.after?.title ?? c.before.title)} (old line ${c.before?.startLine ?? '—'}, new line ${c.after?.startLine ?? '—'})`), '', 'Model judgments require review. Source fingerprints are retained in the JSON report.', ''].join('\n');
}
