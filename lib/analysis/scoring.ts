export interface ContentFitDimensions {
  searchIntentFit: number;
  informationCompleteness: number;
  benchmarkPatternCoverage: number;
  evidenceStrength: number;
  hospitalUniqueInformation: number;
  readability: number;
  ctaFit: number;
}

export interface SourceContextDimensions {
  topicFocus: number;
  relatedContentAccumulation: number;
  recentActivity: number;
  postingConsistency: number;
  contentDepth: number;
  publicEngagement: number;
}

const clamp = (value: number) => Math.max(0, Math.min(100, value));

export function calculateContentFitScore(input: ContentFitDimensions) {
  const score =
    clamp(input.searchIntentFit) * 0.22 +
    clamp(input.informationCompleteness) * 0.2 +
    clamp(input.benchmarkPatternCoverage) * 0.18 +
    clamp(input.evidenceStrength) * 0.16 +
    clamp(input.hospitalUniqueInformation) * 0.1 +
    clamp(input.readability) * 0.08 +
    clamp(input.ctaFit) * 0.06;

  return Math.round(score);
}

export function calculateSourceContextScore(input: SourceContextDimensions) {
  const score =
    clamp(input.topicFocus) * 0.28 +
    clamp(input.relatedContentAccumulation) * 0.22 +
    clamp(input.recentActivity) * 0.16 +
    clamp(input.postingConsistency) * 0.14 +
    clamp(input.contentDepth) * 0.12 +
    clamp(input.publicEngagement) * 0.08;

  return Math.round(score);
}
