import type { DevicePreference } from "@/lib/product/types";
import type { WorkflowStage } from "@/lib/workflow/state";

const DEVICE_LABELS: Record<DevicePreference, string> = {
  MOBILE: "모바일",
  DESKTOP: "데스크탑",
  BOTH: "모바일 + 데스크탑",
};

const WORKFLOW_STAGE_LABELS: Record<WorkflowStage, string> = {
  HOSPITAL: "병원 선택",
  KEYWORD: "키워드 입력",
  SERP: "SERP 수집",
  BENCHMARK_SELECTION: "Benchmark 선택",
  ARTICLE_ANALYSIS: "Article 분석",
  BLOG_CONTEXT_ANALYSIS: "Blog Context 분석",
  MEDICAL_RESEARCH: "Medical Evidence",
  HOSPITAL_EVIDENCE: "Hospital Evidence",
  INTERVIEW: "Adaptive Interview",
  READY_TO_WRITE: "READY TO WRITE",
  BLUEPRINT: "Content Blueprint",
  DRAFT: "Draft",
  REVISION: "Revision",
  FINAL: "Final",
};

export function getDevicePreferenceLabel(
  value: DevicePreference,
) {
  return DEVICE_LABELS[value];
}

export function getWorkflowStageLabel(stage: WorkflowStage) {
  return WORKFLOW_STAGE_LABELS[stage];
}
