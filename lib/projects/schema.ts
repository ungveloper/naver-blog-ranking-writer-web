import { z } from "zod";

export const createContentProjectSchema = z.object({
  hospitalId: z.string().uuid("병원을 다시 선택하세요."),
  primaryKeyword: z
    .string()
    .trim()
    .min(1, "Primary Keyword를 입력하세요.")
    .max(200, "Primary Keyword가 너무 깁니다."),
  secondaryKeywords: z
    .string()
    .trim()
    .max(3000, "Secondary Keywords가 너무 깁니다.")
    .optional()
    .default(""),
  devicePreference: z
    .enum(["MOBILE", "DESKTOP", "BOTH"])
    .default("MOBILE"),
});

export type CreateContentProjectFormInput = z.infer<
  typeof createContentProjectSchema
>;

export function formDataToContentProjectInput(
  formData: FormData,
) {
  return createContentProjectSchema.safeParse({
    hospitalId: formData.get("hospitalId"),
    primaryKeyword: formData.get("primaryKeyword"),
    secondaryKeywords: formData.get("secondaryKeywords"),
    devicePreference: formData.get("devicePreference"),
  });
}

export function parseSecondaryKeywords(
  raw: string,
  primaryKeyword: string,
) {
  const primary = primaryKeyword.trim();

  return Array.from(
    new Set(
      raw
        .split(/[\n,]+/)
        .map((keyword) => keyword.trim())
        .filter(Boolean)
        .filter((keyword) => keyword !== primary),
    ),
  );
}
