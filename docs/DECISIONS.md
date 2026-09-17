# Product Decisions

인터뷰를 통해 확정한 주요 결정 로그.

## Product

- repo: `naver-blog-ranking-writer-web`
- 내부도구 우선, SaaS는 장기 옵션
- 첫 vertical: 병원/의료
- 최상위 목표: 네이버 검색 상위 노출 경쟁력 향상

## Search / Benchmark

- 모바일 우선
- PC 선택/참고 가능
- 로그아웃/쿠키 없는 환경 지향
- 네이버 블로그 글에 집중
- 기본 7개 / 최소 5 / 최대 10
- 사용자가 의도 불일치 결과 제외 가능
- Primary Keyword 중심
- Secondary/연관검색은 낮은 가중치
- 한 번의 현재 SERP로 즉시 작성, 여러 날 기다리지 않음

## Blog Context

- 최근 글 20개
- 키워드 관련 글 최대 10개
- 일부 관련 글 Deep Parse
- Source Context Score는 내부 점수

## Hospital

- Hospital Entity 재사용
- 여러 사용자가 여러 Hospital 담당 가능
- OWNER/EDITOR/VIEWER
- 공식 홈페이지/블로그/YouTube/Instagram/PDF/브로슈어 활용
- 병원 고유 정보 추정 금지

## Medical

- 국내 자료 우선
- 정부/공공기관 → 국내 학회 → 국제 가이드라인 → peer-reviewed 논문
- 영어 자료 허용
- Evidence conflict는 수동 검토
- 최종 글 맨 아래 참고자료 섹션

## AI

- ChatGPT Pro 수동 Copy/Paste 허용
- Structured JSON Import
- 필요하면 키워드별 인터뷰 라운드를 더 진행
- READY TO WRITE 기본 기준 85

## Output

- 네이버 블로그용 Plain Text
- 제목 후보 5 + 추천 1
- 소제목/이미지 슬롯/CTA/참고자료
- Tone 추천 + 사용자 Override
- Commercial Intensity 기본 80/20
- 글자 수는 추천 범위, 억지 분량 채우기 금지

## Future

- 순위 자동 추적
- Top 3/5/10 이탈 알림
- 여러 키워드별 순위 기록
- 성과 데이터 기반 자체 가중치 개선
