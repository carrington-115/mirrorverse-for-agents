import type { CostBreakdown } from "@mirrorverse/types";

export const ZERO_COST: CostBreakdown = {
  tokensIn: 0,
  tokensInCached: 0,
  tokensOut: 0,
  costCents: 0,
};

// Per-run hard cap: $2.00 (200 cents). Prevents runaway LLM loops.
export const RUN_COST_CAP_CENTS = 200;

export class CostCapExceededError extends Error {
  constructor(
    public readonly totalCents: number,
    public readonly capCents: number,
  ) {
    super(`Run cost cap exceeded: ${totalCents} cents (cap: ${capCents})`);
    this.name = "CostCapExceededError";
  }
}

export function addCosts(a: CostBreakdown, b: CostBreakdown): CostBreakdown {
  return {
    tokensIn: a.tokensIn + b.tokensIn,
    tokensInCached: a.tokensInCached + b.tokensInCached,
    tokensOut: a.tokensOut + b.tokensOut,
    costCents: a.costCents + b.costCents,
  };
}

/** Mutable accumulator for per-step costs within a single run. */
export class CostTracker {
  private total: CostBreakdown = { ...ZERO_COST };

  add(step: CostBreakdown): void {
    this.total = addCosts(this.total, step);
  }

  getTotal(): CostBreakdown {
    return this.total;
  }

  checkCap(capCents = RUN_COST_CAP_CENTS): void {
    if (this.total.costCents > capCents) {
      throw new CostCapExceededError(this.total.costCents, capCents);
    }
  }
}
