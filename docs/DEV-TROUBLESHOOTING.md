# Development troubleshooting

## Chrome DevTools `reportAllChanges` / `startTime`

증상:

```text
Uncaught TypeError: Cannot read properties of undefined (reading 'startTime')
at et.reportAllChanges (<anonymous>:2:19429)
...
at n.timeout (<anonymous>:2:5652)
```

이 stack은 애플리케이션 파일이 아니라 Chrome DevTools가 주입한 anonymous `VM*` script에서 발생하는 Chromium DevTools / web-vitals 이슈로 보고되어 있다.

프로젝트 저장소에는 `reportAllChanges` 또는 `startTime` 호출이 없다.

따라서:
- 앱 기능 오류와 분리해서 판단한다.
- Chrome/Chromium을 최신 버전으로 업데이트한다.
- 확인할 때 DevTools를 닫고 동일 동작을 재현해본다.
- DevTools가 열린 상태에서만 나타나고 앱 동작이 정상이라면 앱 배포 차단 이슈로 취급하지 않는다.

현재 프로젝트 코드에 해당 예외를 숨기는 임의 try/catch나 전역 error suppression을 넣지 않는다.
