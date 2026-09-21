// Purpose: Type the document parser, advisory reviewer and portable diff contracts.
import type { DecisionRecord } from '@gbesse/decisionpacks';
export type Category = 'editorial' | 'strengthened' | 'weakened' | 'contradiction' | 'behavior_changed' | 'uncertain';
export interface Section { id: string; title: string; startLine: number; text: string }
export interface Judgment { category: Category; probability: number; record?: DecisionRecord }
export interface Change { id: string; kind: 'added' | 'removed' | 'modified'; before: Section | null; after: Section | null; fingerprint: string; judgment?: Judgment; requiresReview?: boolean }
export interface Diff { schemaVersion: 1; beforeFingerprint: string; afterFingerprint: string; changes: Change[] }
export type Parser = (text: string) => Section[];
export type Reviewer = (change: Change, options: { signal: AbortSignal }) => Promise<Judgment>;
export const CATEGORIES: Category[];
export function parseMarkdown(text: string): Section[];
export function parseText(text: string): Section[];
export function compare(before: string, after: string, options?: { parser?: Parser }): Diff;
export function review(diff: Diff, options: { reviewer: Reviewer; minProbability?: number; maxChanges?: number; timeoutMs?: number; signal?: AbortSignal }): Promise<Diff>;
export function toMarkdown(diff: Diff): string;
