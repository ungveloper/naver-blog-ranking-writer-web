import type { ContentTone, FactStatus } from "@/lib/product/types";

export type InterviewStatus = "NEEDS_MORE_INFO" | "READY";
export type InterviewPriority = "required" | "recommended" | "optional";
export type InterviewAnswerType =
  | "short_text"
  | "long_text"
  | "single_select"
  | "multi_select"
  | "url"
  | "number";

export interface AdaptiveInterviewQuestion {
  id: string;
  fieldKey: string;
  question: string;
  reason: string;
  priority: InterviewPriority;
  answerType: InterviewAnswerType;
  evidenceRequired: boolean;
  choices?: string[];
}

export interface ConfirmedFact {
  fieldKey: string;
  value: unknown;
  status: Extract<FactStatus, "VERIFIED">;
  evidenceIds: string[];
}

export interface InterviewRoundResult {
  status: InterviewStatus;
  round: number;
  questions: AdaptiveInterviewQuestion[];
  confirmedFacts: ConfirmedFact[];
  unknownFacts: Array<{
    fieldKey: string;
    reason: string;
    status: Exclude<FactStatus, "VERIFIED">;
  }>;
  contentRequirements: string[];
  recommendedTone?: {
    id: ContentTone;
    reason: string;
  };
  estimatedContentFitScore?: number;
}

export interface MedicalEvidenceItem {
  claim: string;
  sourceTitle: string;
  institution: string;
  sourceUrl: string;
  publishedAt?: string;
  sourceTier:
    | "KR_GOV_PUBLIC"
    | "KR_GUIDELINE"
    | "INTERNATIONAL_GUIDELINE"
    | "PEER_REVIEWED";
  summary: string;
  status: "SUPPORTED" | "CONFLICT" | "NEEDS_REVIEW";
}
