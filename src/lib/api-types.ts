/**
 * Types for the formulation intelligence API, v1.
 * Hand-written to mirror openapi.yaml in this folder. Generating them needs a
 * toolchain the web app does not otherwise have, and this file is small enough
 * to keep honest by review.
 *
 * Four things to know before writing a component against this.
 *
 * 1. A constraint failure is not an HTTP error. `POST /v1/constraints/check`
 *    returns 200 with `status: "fail"`. The prediction succeeded and the
 *    formula is merely not allowed. Show both.
 *
 * 2. `Prediction` is a discriminated union on `kind`. Six shapes cover all
 *    thirteen heads. Narrow on `kind` once, in one switch, rather than writing
 *    a component per head.
 *
 * 3. Optimiser state lives here, in the browser. `ask` returns an opaque
 *    `state` string and you post it back with `tell`. Persist it in
 *    sessionStorage so a page reload does not lose the run. There is no server
 *    session to fall back on.
 *
 * 4. The base URL is a runtime value, not a build-time constant, because the
 *    app must be able to switch from the hosted container to the laptop twin
 *    in one field when the hosted one is cold or blocked.
 */

export const API_VERSION = "v1" as const;

export type HeadId =
  | "H1" | "H2" | "H3" | "H4" | "H5" | "H6" | "H7"
  | "H8" | "H9" | "H10" | "H11" | "H12" | "H13";

export type LicenceClass = "A" | "B" | "C" | "mixed" | "none";
export type GateResult = "pass" | "fail" | "not_measured";
export type Severity = "info" | "warn" | "fail";
export type RuleId = "R1" | "R2" | "R3" | "R4" | "R5" | "R6" | "R7" | "R8";

/* ------------------------------------------------------------------ status */

export interface Health {
  status: "ok" | "degraded";
  endpoint_build: string;
  /** The formulation-core tag this image pinned. A stale pin shows up here. */
  core_tag: string;
  registry_version: string;
  /** Only one head is resident at a time. Null before the first prediction. */
  resident_head: HeadId | null;
  uptime_s: number;
}

export interface HeadStatus {
  head: HeadId;
  name: string;
  available: boolean;
  metric: string | null;
  value: number | null;
  /** A failing head is still listed and still served. Do not filter these out. */
  gate: GateResult;
  threshold: number | null;
  train_rows: number | null;
  split: string | null;
  coverage: number | null;
  licence_class: LicenceClass;
  method_doi: string[];
}

export interface Scoreboard {
  generated_at: string;
  heads: HeadStatus[];
}

/* ------------------------------------------------------------- ingredients */

export type Origin =
  | "plant" | "animal" | "synthetic" | "mineral" | "microbial" | "unknown";

export type HalalStatus =
  | "certified" | "origin_dependent" | "not_permitted" | "unknown";

export interface Ingredient {
  ing_id: string;
  inci_name: string;
  cas: string[];
  function_class: string[];
  origin: Origin;
  halal_status: HalalStatus;
  eu_annex: "II" | "III" | "IV" | "V" | "VI" | "none";
  eu_max_pct: number | null;
  /** Some caps depend on the product type. Homosalate is 7.34 in face products only. */
  eu_conditions: string | null;
  hlb: number | null;
  price_idr_per_kg: number | null;
  price_date: string | null;
}

export interface IngredientPage {
  registry_version: string;
  next_cursor: string | null;
  items: Ingredient[];
}

/* ----------------------------------------------------------------- formula */

export interface FormulaLine {
  /** Supply one of ing_id, inci_name or cas. The server resolves the rest. */
  ing_id?: string | null;
  inci_name?: string | null;
  cas?: string | null;
  wt_pct: number;
}

export interface Formula {
  lines: FormulaLine[];
  /**
   * Strings that matched nothing in the registry. Never dropped and never
   * guessed. While this is non-empty the formula can be scored but not
   * certified, and rule R8 fires.
   */
  unmatched?: string[];
}

export interface Conditions {
  temperature_c?: number;
  times_day?: number[];
  /** H2 only. */
  shear_rate_s?: number;
  /** H3 inverse only. */
  target_spf?: number;
}

/* -------------------------------------------------------------- prediction */

export interface Uncertainty {
  level: number;
  method: "split_conformal" | "cqr" | "jackknife_plus" | "none";
  /** A presentation decision, not a result. Label it as such in the interface. */
  band: "low" | "medium" | "high";
  /** Query sits outside the training distribution. Show it prominently. */
  ood: boolean;
}

export interface ProvenanceDataset {
  name: string;
  licence: string;
  class: "A" | "B" | "C";
}

export interface Provenance {
  model_version: string;
  git_commit?: string;
  registry_version?: string;
  train_rows?: number;
  split?: string;
  gate?: GateResult;
  method_doi?: string[];
  data?: ProvenanceDataset[];
  /** Render verbatim when present. It is a licence obligation, not a credit. */
  attribution?: string | null;
}

export interface TrajectoryPoint {
  t_day: number;
  value: number;
  lo: number;
  hi: number;
}

export interface TrajectoryPrediction {
  kind: "trajectory";
  unit: string;
  points: TrajectoryPoint[];
  /** TSI(t) = m1 * t / (m2 + t). */
  curve?: { m1: number; m2: number; fit_r2: number | null };
  /** Beyond this the head refuses to answer rather than extrapolating. */
  horizon_day: number;
  failure_modes?: {
    creaming: number;
    coalescence: number;
    phase_separation: number;
    syneresis: number;
  };
}

export interface ScalarPrediction {
  kind: "scalar";
  unit: string;
  name?: string;
  value: number;
  lo: number;
  hi: number;
  extras?: Record<string, number>;
}

export interface CompositionPrediction {
  kind: "composition";
  lines: FormulaLine[];
  objective_value?: number | null;
}

export interface MultilabelPrediction {
  kind: "multilabel";
  labels: Array<{ name: string; p: number; lo?: number | null; hi?: number | null }>;
  /** H9 only. Max minus min F1 across skin-tone groups. Above 0.10 is a failing head. */
  tone_gap?: number | null;
}

export interface DistributionPrediction {
  kind: "distribution";
  unit: string;
  bins: Array<{ edge_lo: number; edge_hi: number; count: number }>;
  summary?: {
    d32: number;
    d50: number;
    span: number;
    creaming_index_pct: number | null;
  };
  /** False when no scale bar was found. Sizes are then relative. Say so on screen. */
  scale_known: boolean;
}

export interface ClassPrediction {
  kind: "class";
  label: string;
  p: number;
  alternatives?: Array<{ label: string; p: number }>;
  extras?: Record<string, number>;
}

export type Prediction =
  | TrajectoryPrediction
  | ScalarPrediction
  | CompositionPrediction
  | MultilabelPrediction
  | DistributionPrediction
  | ClassPrediction;

/* ------------------------------------------------------------- constraints */

export interface Finding {
  rule: RuleId;
  severity: Severity;
  ing_id?: string | null;
  inci_name?: string | null;
  observed?: number | null;
  limit?: number | null;
  condition?: string | null;
  message: string;
  /** Always present. Render it. A finding without a citation is an opinion. */
  source: string;
  suggestion?: string | null;
}

export interface Verdict {
  status: "pass" | "warn" | "fail";
  findings: Finding[];
  halal_claimable?: boolean;
  /** CPOB governs a site, not a composition, so this explains rather than audits. */
  manufacturing_note?: string;
}

export interface ClaimVerdict {
  allowed: boolean;
  matched_forbidden_item: number | null;
  permitted_rewording: string[];
  evidence_required: string[];
  findings: Finding[];
}

/* ------------------------------------------------------------------- cost */

export interface CostLine {
  ing_id: string;
  inci_name: string;
  wt_pct: number;
  price_idr_per_kg: number | null;
  duty_rate: number | null;
  contribution_idr: number | null;
  price_source: string | null;
  price_date: string | null;
}

export interface CostResponse {
  cost_idr_per_kg: number;
  currency: "IDR";
  lines: CostLine[];
  /** 12 percent on a base of eleven twelfths of import value, PMK 131/2024. */
  vat_effective: 0.11;
  /** While non-empty the total is a lower bound. Say so next to the number. */
  unpriced: string[];
}

/* ----------------------------------------------------------------- predict */

export interface PredictRequest {
  formula: Formula;
  conditions?: Conditions;
  product_type?: string;
  /** H9, H10, H11 only. PNG or JPEG, at most 4 MB decoded. */
  image_b64?: string | null;
}

export interface PredictResponse {
  head: HeadId;
  target?: { name: string; unit: string; condition?: string };
  prediction: Prediction;
  uncertainty: Uncertainty;
  provenance: Provenance;
  verdict?: Verdict | null;
  /** Set when the router sent the input to a different head. Show this on screen. */
  routed_from?: HeadId | null;
  warnings: string[];
}

export interface Attribution {
  ing_id: string | null;
  inci_name: string;
  /** Signed. Positive means this ingredient pushes the target up. */
  effect: number;
  rank: number;
}

export interface Substitution {
  replace_ing_id: string;
  with_ing_id: string;
  with_inci_name: string;
  predicted_delta: number;
  rationale: string;
}

export interface ExplainResponse {
  head: HeadId;
  method: "permutation_importance";
  attributions: Attribution[];
  substitutions?: Substitution[];
}

/* ---------------------------------------------------------------- optimise */

export interface Objective {
  head: HeadId;
  target_name?: string;
  direction: "minimise" | "maximise";
  at_time_day?: number | null;
}

export interface DesignDimension {
  ing_id: string;
  lo_pct: number;
  hi_pct: number;
}

export interface AskRequest {
  /** Two objectives switch the acquisition to expected hypervolume improvement. */
  objectives: Objective[];
  design_space: DesignDimension[];
  batch_size?: number;
  product_type?: string;
  /** Null starts a run. Otherwise the state from the previous response. */
  state: string | null;
}

export interface Candidate {
  formula: Formula;
  /** Zero for infeasible. Infeasible candidates are returned, not hidden. */
  acquisition: number;
  predicted?: Record<string, { value: number; lo: number; hi: number }>;
  verdict: Verdict;
  /** Exactly one candidate is highlighted. The rest are alternatives. */
  highlighted?: boolean;
}

export interface AskResponse {
  candidates: Candidate[];
  /** Opaque, signed, at most 64 KB. Put it in sessionStorage. */
  state: string;
  n_observations: number;
  /** Present once the run reaches its target. The gate is 3.24. */
  acceleration_factor?: number | null;
}

export interface Observation {
  formula: Formula;
  values: Record<string, number>;
}

export interface TellRequest {
  state: string;
  observations: Observation[];
}

/* ------------------------------------------------------------------ ingest */

export type ColumnRole =
  | "ingredient_name" | "cas" | "wt_pct" | "time" | "temperature"
  | "target" | "sample_id" | "ignore" | "unknown";

export interface ColumnGuess {
  column: string;
  role: ColumnRole;
  /** Above 0.8 show as settled. At or below, show as a question with one click to fix. */
  score: number;
  evidence?: string;
  unit_guess?: string | null;
}

export interface SchemaGuess {
  n_rows: number;
  columns: ColumnGuess[];
  suggested_head: HeadId;
  suggested_head_score: number;
  fallback_head: "H13";
  needs_confirmation: string[];
}

export interface TrainResponse {
  /** In memory for 30 minutes. Nothing is persisted server-side. */
  model_token: string;
  expires_at: string;
  n_rows: number;
  chosen_model: "tabpfn_v2" | "lightgbm" | "autogluon";
  metric: {
    name: string;
    value: number;
    baseline_value: number;
    beats_baseline: boolean;
  };
  attribution: string | null;
}

/* ------------------------------------------------------------------ errors */

/** RFC 9457. Every non-2xx response has this shape. */
export interface Problem {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
}

export function isProblem(x: unknown): x is Problem {
  return (
    typeof x === "object" && x !== null &&
    "title" in x && "status" in x
  );
}

/* ------------------------------------------------------------------ client */

export interface ClientConfig {
  /** Runtime value. Switch this to the laptop twin when the hosted one is cold. */
  baseUrl: string;
  timeoutMs?: number;
}

const STATE_KEY = "optimiser-run-state";

/** Persist the optimiser state so a page reload does not lose the run. */
export function saveRunState(state: string): void {
  try {
    sessionStorage.setItem(STATE_KEY, state);
  } catch {
    /* private browsing, or storage disabled. The run continues in memory. */
  }
}

export function loadRunState(): string | null {
  try {
    return sessionStorage.getItem(STATE_KEY);
  } catch {
    return null;
  }
}

/**
 * Narrow a Prediction once, here, rather than in every component.
 * Six cases cover all thirteen heads.
 */
export function renderKind(p: Prediction): ColumnRole extends never ? never : string {
  switch (p.kind) {
    case "trajectory":   return "chart-line";
    case "scalar":       return "big-number";
    case "composition":  return "formula-table";
    case "multilabel":   return "bar-list";
    case "distribution": return "histogram";
    case "class":        return "badge";
  }
}
