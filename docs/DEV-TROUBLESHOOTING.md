# Development troubleshooting

## Chrome DevTools `reportAllChanges` / `startTime`

증상:

```text
Uncaught TypeError: Cannot read properties of undefined (reading 'startTime')
at et.reportAllChanges (<anonymous>:2:19429)
...
at n.timeout (<anonymous>:2:5652)
```

`VM123:2`, `VM844:2`처럼 `VM*` anonymous script에서 나오고 application source frame이 없는 경우,
현재 알려진 Chrome DevTools / web-vitals soft-navigation 계열 문제와 동일한 패턴이다.

프로젝트 애플리케이션 코드에는 `reportAllChanges` 호출이 없다.

### 대응

1. Chrome을 최신 버전으로 업데이트한다.
2. DevTools를 닫고 앱 기능 자체가 정상인지 별도로 확인한다.
3. 영향을 받는 Chrome 버전에서 개발 중 임시 대응이 필요하면 아래 flag를 Disabled로 변경한 뒤 Chrome을 재시작한다.

```text
chrome://flags/#soft-navigation-heuristics
```

Edge:

```text
edge://flags/#soft-navigation-heuristics
```

공개 보고 기준으로 이 문제는 Chrome 153에서 수정된 것으로 안내되고 있다.

### 앱 코드 정책

이 DevTools 오류를 숨기기 위한 전역 error suppression은 앱에 추가하지 않는다.
DevTools VM 오류와 실제 Next.js/server action 오류를 분리해 진단한다.
