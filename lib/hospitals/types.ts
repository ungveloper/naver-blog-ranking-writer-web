import type { FactStatus, HospitalMemberRole } from "@/lib/product/types";

export interface HospitalMember {
  userId: string;
  role: HospitalMemberRole;
}

export interface HospitalSource {
  id: string;
  type:
    | "OFFICIAL_WEBSITE"
    | "OFFICIAL_NAVER_BLOG"
    | "YOUTUBE"
    | "INSTAGRAM"
    | "PDF"
    | "BROCHURE"
    | "MANUAL";
  title: string;
  url?: string;
}

export interface HospitalFact {
  key: string;
  value: unknown;
  status: FactStatus;
  evidenceSourceIds: string[];
}

export interface HospitalProfile {
  id: string;
  name: string;
  websiteUrl?: string;
  members: HospitalMember[];
  sources: HospitalSource[];
  facts: HospitalFact[];
  repeatedPhrases: string[];
  defaultCtas: string[];
}
