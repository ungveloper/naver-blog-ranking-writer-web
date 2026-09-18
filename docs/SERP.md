# Naver SERP Candidate Discovery

## 기본 흐름

사용자가 Naver Blog URL을 복사해 입력하지 않는다.

```text
Content Project
→ Primary Keyword
→ Naver 검색 실행
→ 실제 검색 페이지
→ Naver Blog 포스트 URL만 필터/정규화/중복 제거
→ 후보 목록
→ 사용자가 관련 없는 결과만 제외
→ 최종 5~10개 Benchmark
→ 본문 Parser + Article Features
```

## Provider 순서

현재 Provider는 두 단계다.

1. `NAVER_HTTP_HTML`
   - 서버에서 Naver 검색 HTML을 직접 요청한다.
   - 정상 HTML이고 실제 Blog 후보가 추출되면 그대로 사용한다.

2. `NAVER_LOCAL_BROWSER_DOM`
   - 직접 HTTP 응답이 제한되거나 Blog 후보를 읽지 못했을 때 사용한다.
   - 사용자의 컴퓨터에 설치된 Chrome/Chromium을 `--headless=new --dump-dom`으로 실행한다.
   - 별도 로그인 쿠키를 가져오지 않는 임시 프로필을 사용한다.
   - 실제 Browser DOM에서 Blog 후보를 추출한다.

macOS 기본 탐색 위치:

- Google Chrome
- Google Chrome Beta
- Chromium
- Brave Browser

필요한 경우 `.env.local`에서 직접 지정할 수 있다.

```text
NAVER_BROWSER_EXECUTABLE="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

## 보안 제한 정책

CAPTCHA나 접근 제한을 우회하지 않는다.

기존 구현의 `"보안 확인"` 단순 문자열 판정은 정상 Naver HTML에서도 오탐할 수 있어 제거했다.

현재는 다음처럼 강한 차단 신호가 있고 실제 Blog 후보도 없는 경우에만 Security Page로 본다.

- CAPTCHA
- 자동입력 방지
- 비정상적인 접근
- 비정상적인 요청
- 접근이 일시적으로 제한
- 서비스 이용이 제한

직접 HTTP가 제한되면 정상 Browser 요청으로 한 번 더 시도하지만,
Browser에서도 보안 페이지가 반환되면 그대로 중단한다.

## 검색 기준

- MOBILE이 기본이자 주 기준이다.
- DESKTOP은 선택 또는 BOTH일 때 참고 snapshot으로 저장한다.
- 통합검색 노출 후보가 우선이다.
- 통합검색에서 후보가 부족하면 Naver VIEW 검색을 보완 후보로 가져오며 UI에서 `VIEW_FALLBACK`으로 명확히 구분한다.
- VIEW 보완 후보를 통합검색 순위라고 표현하지 않는다.

## 데이터

### serp_snapshots

- project_id
- keyword
- device
- provider
- search_url
- response_hash
- result_count
- captured_at

### serp_results

- snapshot_id
- rank
- title
- url
- normalized_url
- origin
- included
- exclusion_reason

`rank`는 해당 snapshot에서 추출된 후보의 노출 순서다.

`origin`:
- `INTEGRATED`
- `VIEW_FALLBACK`

## 향후

현재 Local Browser fallback은 로컬 개발/운영에서 유용하다.

Vercel 등 서버리스 배포에서는 실행 가능한 Chrome이 기본 제공되지 않을 수 있으므로,
향후 BrowserCaptureProvider를 별도 실행 환경 또는 허용된 Browser 서비스로 분리할 수 있다.

CAPTCHA 회피, IP rotation, 자동 우회는 추가하지 않는다.
