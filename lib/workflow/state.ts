export const WORKFLOW_STAGES = [
  "HOSPITAL",
  "KEYWORD",
  "SERP",
  "BENCHMARK_SELECTION",
  "ARTICLE_ANALYSIS",
  "BLOG_CONTEXT_ANALYSIS",
  "MEDICAL_RESEARCH",
  "HOSPITAL_EVIDENCE",
  "INTERVIEW",
  "READY_TO_WRITE",
  "BLUEPRINT",
  "DRAFT",
  "REVISION",
  "FINAL",
] as const;

export type WorkflowStage = (typeof WORKFLOW_STAGES)[number];

export function getNextWorkflowStage(stage: WorkflowStage): WorkflowStage | null {
  const index = WORKFLOW_STAGES.indexOf(stage);
  if (index < 0 || index === WORKFLOW_STAGES.length - 1) return null;
  return WORKFLOW_STAGES[index + 1];
}
