import type { BuildSnapshot, Rule, RuleResult } from "./types";
import { evaluateRule } from "./evaluate";

export function computeProgress(build: BuildSnapshot, rules: Rule[]): RuleResult[] {
  return rules.map((r) => evaluateRule(build, r));
}

