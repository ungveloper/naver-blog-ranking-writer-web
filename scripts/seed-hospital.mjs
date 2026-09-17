import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import pg from "pg";

const { Client } = pg;
const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
const seedFile = process.env.SEED_FILE || path.join(process.cwd(), "data", "seed", "cheongmac.local.json");

if (!databaseUrl) { console.error("DIRECT_URL 또는 DATABASE_URL이 없습니다."); process.exit(1); }
const seed = JSON.parse(await fs.readFile(seedFile, "utf8"));
const client = new Client({ connectionString: databaseUrl });

async function resolveUserId() {
  const email = process.env.SEED_USER_EMAIL?.trim();
  if (email) {
    const result = await client.query(`select id,email from "user" where lower(email)=lower($1) limit 1`,[email]);
    if (!result.rows[0]) throw new Error(`SEED_USER_EMAIL user를 찾지 못했습니다: ${email}`);
    return result.rows[0].id;
  }
  const users = await client.query(`select id,email from "user" order by "createdAt" asc`);
  if (users.rowCount === 1) { console.log(`Seed OWNER 자동 선택: ${users.rows[0].email}`); return users.rows[0].id; }
  throw new Error(`Better Auth user가 ${users.rowCount ?? 0}명입니다. SEED_USER_EMAIL="로그인 이메일" npm run seed:cheongmac 로 실행하세요.`);
}

async function upsertSource(hospitalId, source) {
  const result = await client.query(`
    insert into hospital_sources (
      hospital_id,kind,label,url,status,is_primary,source_date,version_label,
      content_text,notes,metadata,captured_at
    ) values ($1,$2::hospital_source_kind,$3,$4,$5::hospital_source_status,$6,$7::date,$8,$9,$10,$11::jsonb,now())
    on conflict (hospital_id,kind,label) do update set
      url=excluded.url,status=excluded.status,is_primary=excluded.is_primary,
      source_date=excluded.source_date,version_label=excluded.version_label,
      content_text=excluded.content_text,notes=excluded.notes,metadata=excluded.metadata,
      captured_at=excluded.captured_at,updated_at=now()
    returning id
  `,[hospitalId,source.kind,source.label,source.url??null,source.status??"CONFIRMED",source.isPrimary??false,source.sourceDate??null,source.versionLabel??null,source.contentText??null,source.notes??null,JSON.stringify(source.metadata??{})]);
  return result.rows[0].id;
}

try {
  await client.connect(); const userId=await resolveUserId(); await client.query("begin");
  const h=seed.hospital;
  const hospitalResult=await client.query(`
    insert into hospitals (
      name,english_name,slug,website_url,address,phone,fax,opened_on,summary,
      philosophy,profile_status,profile_version,is_test,created_by
    ) values ($1,$2,$3,$4,$5,$6,$7,$8::date,$9,$10,$11::hospital_profile_status,1,true,$12)
    on conflict (slug) do update set
      name=excluded.name,english_name=excluded.english_name,website_url=excluded.website_url,
      address=excluded.address,phone=excluded.phone,fax=excluded.fax,opened_on=excluded.opened_on,
      summary=excluded.summary,philosophy=excluded.philosophy,profile_status=excluded.profile_status,
      is_test=excluded.is_test,updated_at=now()
    returning id
  `,[h.name,h.englishName??null,h.slug,h.websiteUrl??null,h.address??null,h.phone??null,h.fax??null,h.openedOn??null,h.summary??null,h.philosophy??null,h.profileStatus??"ACTIVE",userId]);
  const hospitalId=hospitalResult.rows[0].id;

  await client.query(`insert into hospital_members (hospital_id,user_id,role) values ($1,$2,'OWNER') on conflict (hospital_id,user_id) do update set role='OWNER'`,[hospitalId,userId]);

  const sourceIds=new Map();
  for(const source of seed.sources??[]) sourceIds.set(source.key,await upsertSource(hospitalId,source));

  for(const s of seed.specialties??[]) {
    await client.query(`
      insert into hospital_specialties (hospital_id,name,priority,is_marketing_priority,status,notes)
      values ($1,$2,$3,$4,$5::hospital_fact_status,$6)
      on conflict (hospital_id,name) do update set priority=excluded.priority,
        is_marketing_priority=excluded.is_marketing_priority,status=excluded.status,
        notes=excluded.notes,updated_at=now()
    `,[hospitalId,s.name,s.priority??null,s.isMarketingPriority??false,s.status??"CONFIRMED",s.notes??null]);
  }

  for(const s of seed.serviceOfferings??[]) {
    await client.query(`
      insert into hospital_service_offerings (
        hospital_id,source_id,channel,title,detail,booking_label,sort_order,status,metadata
      ) values ($1,$2,$3,$4,$5,$6,$7,$8::hospital_fact_status,$9::jsonb)
      on conflict (hospital_id,channel,title) do update set source_id=excluded.source_id,
        detail=excluded.detail,booking_label=excluded.booking_label,sort_order=excluded.sort_order,
        status=excluded.status,metadata=excluded.metadata,updated_at=now()
    `,[hospitalId,s.sourceKey?sourceIds.get(s.sourceKey)??null:null,s.channel??"NAVER_BOOKING",s.title,s.detail,s.bookingLabel??null,s.sortOrder??100,s.status??"CONFIRMED",JSON.stringify(s.metadata??{})]);
  }

  for(const f of seed.facts??[]) {
    await client.query(`
      insert into hospital_facts (
        hospital_id,fact_key,category,value,status,evidence_source_id,version,is_current,notes
      ) values ($1,$2,$3,$4,$5::hospital_fact_status,$6,$7,true,$8)
      on conflict (hospital_id,fact_key,version) do update set category=excluded.category,
        value=excluded.value,status=excluded.status,evidence_source_id=excluded.evidence_source_id,
        is_current=true,notes=excluded.notes,updated_at=now()
    `,[hospitalId,f.factKey,f.category,f.value,f.status??"CONFIRMED",f.sourceKey?sourceIds.get(f.sourceKey)??null:null,f.version??1,f.notes??null]);
  }

  for(const c of seed.brandClaims??[]) {
    await client.query(`
      insert into hospital_brand_claims (
        hospital_id,claim,fact_status,compliance_status,evidence_source_id,notes
      ) values ($1,$2,$3::hospital_fact_status,$4::hospital_claim_compliance_status,$5,$6)
      on conflict (hospital_id,claim) do update set fact_status=excluded.fact_status,
        compliance_status=excluded.compliance_status,evidence_source_id=excluded.evidence_source_id,
        notes=excluded.notes,updated_at=now()
    `,[hospitalId,c.claim,c.factStatus??"CONFIRMED",c.complianceStatus??"UNCHECKED",c.sourceKey?sourceIds.get(c.sourceKey)??null:null,c.notes??null]);
  }

  for(const c of seed.ctas??[]) {
    await client.query(`
      insert into hospital_ctas (hospital_id,kind,label,url,value,priority,is_active,notes)
      values ($1,$2,$3,$4,$5,$6,$7,$8)
      on conflict (hospital_id,kind,label) do update set url=excluded.url,value=excluded.value,
        priority=excluded.priority,is_active=excluded.is_active,notes=excluded.notes,updated_at=now()
    `,[hospitalId,c.kind,c.label,c.url??null,c.value??null,c.priority??100,c.isActive??true,c.notes??null]);
  }

  const w=seed.writingPreferences??{};
  await client.query(`
    insert into hospital_writing_preferences (
      hospital_id,tone_strategy,default_tone,preferred_phrases,avoid_phrases,notes
    ) values ($1,$2,$3,$4::text[],$5::text[],$6)
    on conflict (hospital_id) do update set tone_strategy=excluded.tone_strategy,
      default_tone=excluded.default_tone,preferred_phrases=excluded.preferred_phrases,
      avoid_phrases=excluded.avoid_phrases,notes=excluded.notes,updated_at=now()
  `,[hospitalId,w.toneStrategy??"ADAPTIVE",w.defaultTone??null,w.preferredPhrases??[],w.avoidPhrases??[],w.notes??null]);

  await client.query("commit");
  console.log("✅ 청맥병원 Hospital Seed 완료");
  console.log(`hospital_id: ${hospitalId}`);
  console.log(`확인: http://localhost:3000/hospitals/${hospitalId}`);
} catch(error) {
  await client.query("rollback").catch(()=>undefined);
  console.error("❌ Hospital Seed 실패"); console.error(error); process.exitCode=1;
} finally { await client.end().catch(()=>undefined); }
