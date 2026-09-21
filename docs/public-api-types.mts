// Purpose: Compile representative public API usage without producing build output.
import { compare, review, toMarkdown } from '../src/index.mjs';
import { createJevReviewer } from '../src/jev.mjs';
const diff = compare('# A\nold', '# A\nnew');
const reviewer = createJevReviewer();
const output: string = toMarkdown(await review(diff, { reviewer }));
void output;
