import { dbPool } from "@/lib/db/pool";

export type HospitalMembershipListItem = {
  id: string;
  name: string;
  slug: string;
  websiteUrl: string | null;
  isTest: boolean;
  role: "OWNER" | "EDITOR" | "VIEWER";
};

export async function listHospitalsForUser(
  userId: string,
): Promise<HospitalMembershipListItem[]> {
  const result = await dbPool.query<{
    id: string;
    name: string;
    slug: string;
    website_url: string | null;
    is_test: boolean;
    role: "OWNER" | "EDITOR" | "VIEWER";
  }>(
    `
      select
        h.id,
        h.name,
        h.slug,
        h.website_url,
        h.is_test,
        hm.role
      from hospital_members hm
      join hospitals h on h.id = hm.hospital_id
      where hm.user_id = $1
      order by h.created_at desc
    `,
    [userId],
  );

  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    websiteUrl: row.website_url,
    isTest: row.is_test,
    role: row.role,
  }));
}
