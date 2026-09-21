// Purpose: Type the optional Jev adapter and injectable provider.
import type { Provider } from '@gbesse/decisionpacks';
import type { Reviewer } from './index.mjs';
export function createJevReviewer(options?: { provider?: Provider; signal?: AbortSignal }): Reviewer;
