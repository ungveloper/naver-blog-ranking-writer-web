import type { DevicePreference } from "@/lib/product/types";

export const PRODUCT_DEFAULTS = {
  benchmarkCount: 7,
  benchmarkMin: 5,
  benchmarkMax: 10,
  primaryDevice: "MOBILE" as DevicePreference,
  readyToWriteScore: 85,
  interviewQuestionsPerRound: {
    min: 3,
    max: 5,
  },
  blogContext: {
    recentPosts: 20,
    relatedPosts: 10,
  },
  commercialIntensity: {
    informational: 80,
    hospitalPromotion: 20,
  },
} as const;
