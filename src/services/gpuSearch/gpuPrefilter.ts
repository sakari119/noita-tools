import { ILogicRules, IRule, IRules, RuleType } from "../SeedInfo/infoHandler/IRule";

export interface IGpuPrefilterPredicate {
  id: string;
  type: string;
  params?: unknown;
  val?: unknown;
  strict?: boolean;
}

export interface IGpuPrefilterRequest {
  from: number;
  to: number;
  predicates: IGpuPrefilterPredicate[];
}

export interface IGpuPrefilterBackend {
  isAvailable(): boolean | Promise<boolean>;
  supportsPredicate(predicate: IGpuPrefilterPredicate): boolean;
  prefilter(request: IGpuPrefilterRequest): Promise<number[]>;
}

declare global {
  interface Window {
    __NOITA_GPU_PREFILTER__?: IGpuPrefilterBackend;
  }

  // Allows tests or Node embedders to install an implementation without making
  // this module depend on browser globals.
  // eslint-disable-next-line no-var
  var __NOITA_GPU_PREFILTER__: IGpuPrefilterBackend | undefined;
}

const isLogicRule = (rule: IRules): rule is ILogicRules => {
  return rule.type === RuleType.AND || rule.type === RuleType.OR || rule.type === RuleType.NOT;
};

const getBackend = (): IGpuPrefilterBackend | undefined => {
  if (typeof window !== "undefined" && window.__NOITA_GPU_PREFILTER__) {
    return window.__NOITA_GPU_PREFILTER__;
  }
  if (typeof globalThis !== "undefined" && globalThis.__NOITA_GPU_PREFILTER__) {
    return globalThis.__NOITA_GPU_PREFILTER__;
  }
  return undefined;
};

/**
 * Extract predicates that are safe to prefilter independently.
 *
 * Only positive rules that are required by an AND chain are eligible. Rules under
 * OR/NOT are intentionally ignored because a false result for one of those rules
 * must not remove a seed that could still satisfy the complete rule tree.
 */
export const getGpuPrefilterPredicates = (rules: ILogicRules): IGpuPrefilterPredicate[] => {
  const predicates: IGpuPrefilterPredicate[] = [];

  const visitRequired = (rule: IRules) => {
    if (isLogicRule(rule)) {
      if (rule.type !== RuleType.AND) {
        return;
      }
      rule.rules.forEach(visitRequired);
      return;
    }

    if (rule.type === RuleType.RULES) {
      rule.rules.forEach(r => {
        predicates.push({
          id: r.id,
          type: r.type,
          params: r.params,
          val: r.val,
          strict: r.strict,
        });
      });
      return;
    }

    const predicate = rule as unknown as IRule;
    predicates.push({
      id: predicate.id,
      type: predicate.type,
      params: predicate.params,
      val: predicate.val,
      strict: predicate.strict,
    });
  };

  visitRequired(rules);
  return predicates;
};

const normalizeCandidates = (from: number, to: number, candidates: number[]) => {
  const [start, end] = from <= to ? [from, to] : [to, from];
  return Array.from(new Set(candidates.filter(seed => Number.isInteger(seed) && seed >= start && seed < end))).sort((a, b) => a - b);
};

/**
 * Runs an optional GPU prefilter and returns candidate seeds only.
 *
 * The returned candidates are never final search results. Callers must verify
 * every candidate with the normal CPU provider test(...) implementations before
 * reporting a match.
 *
 * Returns undefined when no backend is installed, the backend is unavailable, or
 * none of the reduced predicates are supported by the backend.
 */
export const gpuPrefilterSeeds = async (from: number, to: number, rules: ILogicRules): Promise<number[] | undefined> => {
  const backend = getBackend();
  if (!backend || !(await backend.isAvailable())) {
    return undefined;
  }

  const predicates = getGpuPrefilterPredicates(rules).filter(predicate => backend.supportsPredicate(predicate));
  if (!predicates.length) {
    return undefined;
  }

  const candidates = await backend.prefilter({ from, to, predicates });
  return normalizeCandidates(from, to, candidates);
};
