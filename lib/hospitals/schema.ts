import { z } from "zod";

const optionalUrl = z.string().trim().max(12000).optional().default("");
const optionalText = (max = 20000) =>
  z.string().trim().max(max).optional().default("");

export const createHospitalProfileSchema = z.object({
  name: z.string().trim().min(2, "병원명을 입력하세요.").max(120),
  englishName: optionalText(160),
  websiteUrl: optionalUrl,
  officialBlogUrl: optionalUrl,
  youtubeUrl: optionalUrl,
  instagramUrl: optionalUrl,
  naverBookingUrl: optionalUrl,
  naverTalkUrl: optionalUrl,
  address: optionalText(300),
  phone: optionalText(80),
  fax: optionalText(80),
  openedOn: z
    .string()
    .trim()
    .regex(/^$|^\d{4}-\d{2}-\d{2}$/, "개원일은 YYYY-MM-DD 형식으로 입력하세요.")
    .optional()
    .default(""),
  summary: optionalText(8000),
  philosophy: optionalText(8000),
  prioritySpecialties: optionalText(5000),
  brandClaims: optionalText(12000),
  bookingIntroText: optionalText(40000),
  bookingServiceLines: optionalText(12000),
  internalSourceLabel: optionalText(300),
  internalSourceStatus: z
    .enum(["CONFIRMED", "REVIEW_REQUIRED"])
    .default("REVIEW_REQUIRED"),
});

export type CreateHospitalProfileFormInput = z.infer<
  typeof createHospitalProfileSchema
>;

export function formDataToHospitalProfileInput(formData: FormData) {
  return createHospitalProfileSchema.safeParse({
    name: formData.get("name"),
    englishName: formData.get("englishName"),
    websiteUrl: formData.get("websiteUrl"),
    officialBlogUrl: formData.get("officialBlogUrl"),
    youtubeUrl: formData.get("youtubeUrl"),
    instagramUrl: formData.get("instagramUrl"),
    naverBookingUrl: formData.get("naverBookingUrl"),
    naverTalkUrl: formData.get("naverTalkUrl"),
    address: formData.get("address"),
    phone: formData.get("phone"),
    fax: formData.get("fax"),
    openedOn: formData.get("openedOn"),
    summary: formData.get("summary"),
    philosophy: formData.get("philosophy"),
    prioritySpecialties: formData.get("prioritySpecialties"),
    brandClaims: formData.get("brandClaims"),
    bookingIntroText: formData.get("bookingIntroText"),
    bookingServiceLines: formData.get("bookingServiceLines"),
    internalSourceLabel: formData.get("internalSourceLabel"),
    internalSourceStatus: formData.get("internalSourceStatus"),
  });
}
