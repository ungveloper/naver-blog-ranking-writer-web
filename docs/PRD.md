# PRD — Naver Blog Ranking Writer v0.1

## 1. Product Objective

사용자가 병원과 포스팅 주제를 선택하면, 현재 네이버 검색 상위에 노출되는 네이버 블로그 글과 해당 블로그의 컨텍스트를 분석하고, 신뢰 가능한 의료 근거 및 병원 고유 정보를 결합해 **네이버 블로그 에디터에 바로 옮길 수 있는 게시용 원고 패키지**를 생성한다.

최상위 목표는 검색 상위 노출 경쟁력을 높이는 것이다. 단, 네이버의 실제 랭킹 알고리즘을 안다고 가정하거나 상위 노출을 보장하지 않는다.

## 2. Target User

- 초기: 개발자이자 마케터인 단일 사용자
- 근미래: 3곳 안팎의 병원 마케팅 운영
- 확장: 마케팅 회사 내부 도구
- 장기: 충분히 검증되면 SaaS 가능

## 3. Initial Vertical

- 의료/병원 마케팅
- 첫 테스트 대상: 청맥병원
- 예시 키워드: 부산하지정맥류, 부산하지정맥류병원, 골반정맥류 등
- Hospital과 Keyword Project는 분리한다. Hospital은 재사용 가능한 Profile이고, 매 포스팅마다 Primary Keyword를 새로 입력한다.

## 4. Main User Flow

1. Better Auth 로그인 (Google/Naver 예정)
2. Hospital 생성/선택
3. Hospital 공식 채널 자동 조사 및 Profile Draft 생성
4. 사용자 검토 후 VERIFIED/미확인 상태 저장
5. 새 콘텐츠 Project 생성
6. Primary Keyword 입력
7. 필요하면 Secondary Keywords 입력
8. 검색 환경 선택 (기본 모바일, PC 선택 가능)
9. 네이버 블로그 후보 자동 수집
10. 사용자가 관련 없는 결과 제외
11. 최종 Benchmark 5~10개 확정 (기본 7)
12. Article Deep Analysis
13. Blog Context Analysis
14. Search Intent / Content Archetype 자동 추천 후 사용자 확인
15. 연관검색/자동완성은 낮은 가중치로 참고
16. Medical Evidence 조사
17. Hospital Evidence 매칭
18. Missing Information 탐지
19. Adaptive Interview 진행
20. READY TO WRITE Gate 통과
21. Content Blueprint 생성
22. ChatGPT Pro Draft 생성
23. Draft JSON/본문 Import
24. Benchmark Revision
25. Medical/Evidence Review
26. Content Fit Score와 근거 리포트 확인
27. 네이버 블로그 게시용 Plain Text Package 복사

## 5. SERP Rules

- Primary: 모바일 네이버 통합검색, 로그아웃/쿠키 없는 환경을 지향
- Reference: PC 통합검색 (사용자 선택 가능)
- Deep Analysis 대상: 네이버 블로그 포스트
- 자동 수집 실패 시 수동 URL 입력 fallback 필수
- CAPTCHA/IP 회피 등 기술적 우회는 제품 로직에 포함하지 않는다.
- 특정 CSS 클래스에 과도하게 의존하지 않고 링크 의미 기반 필터링을 우선한다.

## 6. Benchmark Rules

- 기본 7개
- 최소 5개
- 최대 10개
- 시스템이 후보를 수집하지만 사용자가 의도 불일치 문서를 제외할 수 있어야 한다.
- 5개 미만일 경우 분석 신뢰도 경고
- 최신 상위 문서에 상대적으로 더 높은 가중치

## 7. Blog Context

상위 문서 하나당 다음을 수집/분석할 수 있도록 설계한다.

- 최근 글 최대 20개
- Primary Keyword 관련 글 최대 10개
- 게시 빈도
- 주제 집중도
- 관련 주제 글 수
- 최근 활동성
- 글 평균 분량
- 이미지 패턴
- 공개 공감/댓글 등 반응
- 관련 글 일부 Deep Parse

네이버 공식 수치가 아닌 내부 `Source Context Score`로만 표시한다.

## 8. Hospital Profile

Hospital은 재사용 가능한 독립 Entity다.

저장 대상 예시:

- 병원명/주소/연락처/진료시간
- 진료과목/주요 치료 영역
- 의료진
- 공식 홈페이지
- 공식 네이버 블로그
- 공식 YouTube/Instagram
- 병원 제공 PDF/브로슈어
- VERIFIED 병원 고유 사실
- 반복 사용 문구
- 브랜드 톤
- CTA 기본값
- 금지 표현/주의사항

확인되지 않은 병원 고유 정보는 추정 금지.

## 9. Medical Evidence Priority

1. 병원 공식자료 (병원 고유 사실에 한함)
2. 국내 정부/공공기관
3. 국내 전문학회/진료지침
4. 국제 학회/가이드라인
5. peer-reviewed 논문

국내 자료 우선, 필요 시 영어 자료 허용. 출처 충돌 시 자동 선택하지 않고 `CONFLICT` 상태로 보낸다.

## 10. Adaptive Interview

- 한 라운드 3~5개 핵심 질문
- 답변에 따라 다음 라운드를 동적으로 생성
- 이미 Medical Evidence로 해결 가능한 일반 의학 지식은 병원에 다시 묻지 않음
- 병원 고유 정보가 비어 있을 때만 질문
- 답변 상태: 직접 입력 / 모름 / 병원 확인 필요 / 제외 / 해당 없음
- 근거 출처를 붙일 수 있어야 함

## 11. READY TO WRITE Gate

기본 조건:

- 필수 정보 충족
- 중요 Hospital Fact 미확인 0개 또는 명시적 제외
- 필요한 Medical Evidence 확보
- 중요 Content Gap 충족
- 예상 Content Fit Score >= 85
- 사용자가 강제 진행 시 미확인 내용은 원고에서 제외

## 12. Output Package

네이버 블로그 에디터에 바로 옮기기 쉬운 Plain Text 중심.

- 제목 후보 5개
- 추천 제목 1개
- 도입
- 소제목 구조
- 본문
- 이미지 슬롯 및 추천 위치
- CTA
- 참고자료
- 필요 시 해시태그

Tone은 원고마다 시스템 추천 + 사용자 Override.

Commercial Intensity 기본값은 정보/핵심 메시지 80%, 병원 소개 20% 수준.

## 13. Scoring

상단: Content Fit Score 0~100

세부 예시:

- Search Intent Fit
- Information Completeness
- Benchmark Pattern Coverage
- Unique / Hospital Evidence
- Evidence Strength
- Readability
- CTA Fit

의료광고/근거 위험은 종합점수에 섞지 않고 별도 상태로 관리.

## 14. Excluded from v0.1

- 자동 순위 추적
- 블로그 유입/문의/예약/신환/매출 Attribution
- 이미지 의미 분류 (v0.2 이후)
- Chrome Extension 자동 입력
- OpenAI API 기반 완전 자동화

단, 데이터 모델은 미래 확장을 고려한다.
