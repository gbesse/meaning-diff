# Plugin contracts

This document defines the version 0.1 extension interfaces and their trust boundaries.

## Parser

CLI: `--parser ./my-parser.mjs`, exporting `parse(text)`. Return an array of `{ id, title, startLine, text }`. Ids must be unique and stable across versions, line numbers positive integers. Parsers run synchronously and must return at most 10,000 sections. They are not preempted by the asynchronous timeout.

## Reviewer

CLI: `--reviewer ./my-reviewer.mjs`, exporting async `review(change, { signal })`. Return `{ category, probability }`; probability must be finite in [0,1]. Category must belong to exported `CATEGORIES`. Optional `record` can carry a DecisionPacks decision record. API: `review(diff, { reviewer, maxChanges, minProbability, timeoutMs, signal })`.

Use a named synthetic reviewer only for tests. Production reviewers should be calibrated against a domain-specific reviewed corpus. A reviewer cannot remove the advisory `requiresReview` marker.

## Shared rules

Modules loaded by path are trusted executable code, not data or sandboxed extensions. All portable values must be finite acyclic JSON. Async hooks default to a 30-second deadline and receive an AbortSignal. Deadlines stop waiting; synchronous loops or effects that ignore cancellation cannot be forcibly stopped in-process. External requests need explicit network timeouts. Errors propagate to the caller; the embedding application owns administrator alerting and must not silently fabricate a successful result.

Provider injection uses `createJevProvider` from the pinned DecisionPacks dependency. Use loopback HTTP fixtures for integration tests. Do not commit provider keys, production records or personal data in contributed examples.
