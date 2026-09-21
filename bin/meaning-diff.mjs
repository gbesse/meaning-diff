#!/usr/bin/env node
// Purpose: Compare two local documents, optionally invoking a trusted parser/reviewer or the Jev API.
import { compare, review, toMarkdown } from '../src/index.mjs';
import { readText, writeJSON, loadPlugin, assertNewOutput } from '../src/cli-files.mjs';
async function main() {
  const args = process.argv.slice(2);
  if (!args.length || args[0] === '--help') { console.log('meaning-diff BEFORE AFTER OUTPUT.json [--jev | --reviewer PLUGIN.mjs] [--parser PLUGIN.mjs]\nParsers export parse; reviewers export review. Plugins are trusted executable code.'); return; }
  const [before, after, output, ...flags] = args; if (!output) throw new Error('Expected BEFORE AFTER OUTPUT');
  await assertNewOutput(output);
  let parser, reviewer;
  for (let i = 0; i < flags.length; i++) {
    if (flags[i] === '--jev' && !reviewer) reviewer = (await import('../src/jev.mjs')).createJevReviewer();
    else if (flags[i] === '--reviewer' && flags[i + 1] && !reviewer) { reviewer = (await loadPlugin(flags[++i])).review; if (typeof reviewer !== 'function') throw new Error('Plugin must export review'); }
    else if (flags[i] === '--parser' && flags[i + 1] && !parser) { parser = (await loadPlugin(flags[++i])).parse; if (typeof parser !== 'function') throw new Error('Plugin must export parse'); }
    else throw new Error('Invalid or duplicate flag');
  }
  let result = compare(await readText(before), await readText(after), parser ? { parser } : {});
  if (reviewer) result = await review(result, { reviewer });
  await writeJSON(output, result); console.log(toMarkdown(result));
}
main().catch(error => { console.error(`meaning-diff: ${error.message}`); process.exitCode = 1; });
