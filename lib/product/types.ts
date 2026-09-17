export type DevicePreference = "MOBILE" | "DESKTOP" | "BOTH";
export type HospitalMemberRole = "OWNER" | "EDITOR" | "VIEWER";
export type KeywordType = "PRIMARY" | "SECONDARY";

export type FactStatus =
  | "VERIFIED"
  | "UNVERIFIED"
  | "NEEDS_REVIEW"
  | "UNKNOWN"
  | "NOT_APPLICABLE";

export type SearchIntent =
  | "HOSPITAL_DISCOVERY"
  | "INFORMATION"
  | "COST"
  | "DECISION"
  | "EXPERIENCE"
  | "MIXED";

export type ContentTone =
  | "DOCTOR_FIRST_PERSON"
  | "HOSPITAL_OFFICIAL"
  | "FRIENDLY_INFORMATIONAL"
  | "CUSTOM";

export type EvidenceProvenance =
  | "benchmark"
  | "naver_guideline"
  | "medical_evidence"
  | "hospital_evidence"
  | "own_performance";

export type MedicalSourceTier =
  | "HOSPITAL_OFFICIAL"
  | "KR_GOV_PUBLIC"
  | "KR_GUIDELINE"
  | "INTERNATIONAL_GUIDELINE"
  | "PEER_REVIEWED";

export interface ProvenanceNote {
  source: EvidenceProvenance;
  referenceId?: string;
  note: string;
}
