# Hospital Profile

Hospital Profile은 병원 고유 사실, 공식 근거, 예약 진료 항목, Brand Claim, CTA와 작성 정책을 저장한다.

## Hospital Evidence

- 공식 홈페이지
- Primary 공식 Naver Blog
- 병원이 직접 작성한 Naver Booking 소개/진료 항목
- 공식 YouTube / Instagram
- 병원 제공 브랜드북/PDF
- 원장/병원 담당자가 직접 제공한 확정 자료

## Naver Booking

공식 예약 소개 원문은 `hospital_sources.content_text`에 보존한다.

예약 화면의 실제 선택 항목은 `hospital_service_offerings`에 구조화한다.

이렇게 해야 Writer가 긴 소개문을 무조건 재사용하지 않고, 현재 Primary Keyword와 관련된 공식 진료 항목과 Fact만 선택할 수 있다.

## Brand Claim

병원이 실제 사용 중인 표현도:
- `fact_status`
- `compliance_status`

를 분리한다.

기본은 `CONFIRMED + UNCHECKED`.
UNCHECKED Claim은 Writer에 자동 전달하지 않는다.

## 공식 블로그

Hospital당 Primary Naver Blog는 1개.
콘텐츠 Tone은 블로그별로 고정하지 않고 프로젝트별 상위노출 글 분석 후 ADAPTIVE 추천한다.

## 보안

실병원 Seed와 PDF 원본은 공개 Git 저장소에 커밋하지 않는다.
`data/seed/*.local.json`은 `.gitignore` 처리한다.
