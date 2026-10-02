# Meaning Diff

Review changes in meaning between two document versions, with exact source sections and optional Jev classification.

[![Tests](https://github.com/gbesse/meaning-diff/actions/workflows/test.yml/badge.svg)](https://github.com/gbesse/meaning-diff/actions/workflows/test.yml)

**Alpha · MIT · Node.js 22+ · no build required.** The structural diff works offline. Semantic judgments require a reviewer plugin or an explicit Jev call. Model judgments are advisory, never a proof of equivalence.

## Try it

```sh
git clone https://github.com/gbesse/meaning-diff.git
cd meaning-diff
npm ci --ignore-scripts
npm run demo
node bin/meaning-diff.mjs examples/before.md examples/after.md /tmp/meaning-review.json --reviewer examples/demo-reviewer.mjs
```

The demo changes “may retry” to “must retry once”; its reviewer is a named synthetic fixture. It is not a model benchmark.

With `TYPESAFE_API_KEY` set in your environment, replace the reviewer flag with `--jev` to send changed sections to `jev-1.13.0`. Unchanged sections are skipped. Without either flag, output contains structural changes only. Output files must be new.

## API

```js
import { compare, review, toMarkdown } from '@gbesse/meaning-diff';
import { createJevReviewer } from '@gbesse/meaning-diff/jev';
const diff = compare(beforeMarkdown, afterMarkdown);
const result = await review(diff, {
  reviewer: createJevReviewer(), maxChanges: 50, minProbability: 0.8,
});
console.log(toMarkdown(result));
```

Install the released package from GitHub with `npm install github:gbesse/meaning-diff#v0.1.1`. No npm registry release is implied.

JSON reports retain before/after text, source line numbers and SHA-256 fingerprints. Classification categories are editorial, strengthened, weakened, contradiction, behavior_changed and uncertain. Low-probability judgments become uncertain. Every classified change remains marked for review. Review budgets fail before model calls; provider errors fail the operation.

## Extension surface

[Parser and reviewer contracts](docs/plugins.md) allow domain-specific section alignment and independent classifiers. Parsers run synchronously; reviewers receive a cancellation signal and a deadline. This release includes Markdown headings and whole-text parsing. PDF, AST, GitHub bot, semantic move detection and automatic blocking of pull requests are not implemented.

The default parser matches heading level, title and occurrence count. Renames appear as removal/addition; reordering unique headings is ignored. Duplicate heading insertion can misalign subsequent occurrences. Markdown setext headings and full CommonMark parsing are outside this parser's scope. Choose a custom parser when these distinctions matter.

## Development

```sh
npm run typecheck
npm run check
npm test
npm run demo
```

Tests cover provenance tampering, budgets, parser edge cases, CLI artifacts and the HTTP adapter using loopback fixtures. Live model quality has not been evaluated. The Jev adapter uses the pinned [DecisionPacks](https://github.com/gbesse/decisionpacks) contract and a default 30-second deadline.

Source text can contain confidential data. `--jev` sends changed sections to Typesafe; custom modules are trusted executable code. See [SECURITY.md](SECURITY.md).

## Shareable demo report

Run `npm run demo:report` to capture this repository’s bundled example as one JSON object with the project purpose, version and complete demo output. The command fails if the demo fails, so the report is useful when sharing a reproducible first look or reporting unexpected behavior. The bundled demo’s data and safety boundaries still apply.

## Where this can grow

The useful shared asset is a corpus of reviewed semantic changes plus parsers for real document formats. Contributions should add small, licensed before/after cases and expected human judgments. A reusable corpus and integrations can create an ecosystem advantage; publishing this alpha alone does not establish one.
