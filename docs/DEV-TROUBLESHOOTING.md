# Development troubleshooting

## Chrome DevTools `reportAllChanges` / `startTime`

증상:

```text
VM1306:2 Uncaught TypeError:
Cannot read properties of undefined (reading 'startTime')
at et.reportAllChanges (<anonymous>:2:19429)
...
```

### 현재 판단

`VM*` anonymous script에서 발생하고 application source frame이 없는 동일 stack은
2026년 Chrome DevTools / web-vitals soft-navigation 계열 문제로 공개 보고되어 있다.

이 저장소의 application source에는 `reportAllChanges`나 `startTime` 호출을 두지 않는다.

### 왜 앱 패치로 숨기지 않는가

이 오류를 없애겠다고:
- `window.onerror`
- 전역 exception suppression
- console monkey patch

를 넣으면 실제 앱 오류까지 숨길 수 있으므로 사용하지 않는다.

### 로컬 개발에서 오류를 멈추는 방법

Chrome 주소창:

```text
chrome://flags/#soft-navigation-heuristics
```

1. `Soft Navigation Heuristics`를 `Disabled`
2. Chrome 완전 재시작
3. localhost 다시 열기

Edge:

```text
edge://flags/#soft-navigation-heuristics
```

또는 이 문제가 수정된 Chrome 버전으로 업데이트한다.

### 재확인

- DevTools를 닫은 상태에서 앱 기능이 정상 동작하는지 확인
- 시크릿 창 + 확장 프로그램 비활성 상태로 비교
- `VM*`이 아니라 `/app/...`, `/_next/...` 등 실제 앱 파일 stack이 나타날 때만 앱 오류로 별도 추적
