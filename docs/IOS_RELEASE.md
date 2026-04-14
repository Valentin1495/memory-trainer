# iOS Release Guide

## 1. Apple 준비

먼저 다음이 준비되어 있어야 합니다.

- Apple Developer Program 가입
- App Store Connect 접근 권한
- 최종 앱 이름, 설명, 스크린샷

## 2. 웹 자산 동기화

```bash
npm run cap:sync
```

iOS만 다시 동기화하려면:

```bash
npx cap sync ios
```

## 3. Xcode 열기

```bash
npm run cap:ios
```

## 4. Signing 설정

Xcode에서:

1. `App` 타깃 선택
2. `Signing & Capabilities` 탭 열기
3. Team 선택
4. Bundle Identifier 확인: `com.memorychallenge.app`
5. Signing을 `Automatically manage signing`으로 유지

## 5. 버전 확인

출시 전 아래 값을 확인합니다.

- Version: `1.0.0`
- Build: `1`

이 값은 현재 프로젝트의 Xcode 설정과 연결되어 있습니다.

## 6. Archive 생성

Xcode 상단에서:

1. 시뮬레이터가 아닌 `Any iOS Device (arm64)` 또는 실제 기기 선택
2. `Product > Archive`

Archive가 성공하면 Organizer가 열립니다.

## 7. App Store Connect 업로드

Organizer에서:

1. 방금 생성한 archive 선택
2. `Distribute App`
3. `App Store Connect`
4. `Upload`
5. 기본 옵션 유지 후 업로드 진행

## 8. App Store Connect 입력 항목

제출 전 아래 항목을 채웁니다.

- 앱 설명
- 키워드
- 카테고리
- 스크린샷
- 개인정보처리방침 URL
- App Privacy
- 연령 등급
- 리뷰 노트

문안 초안은 [`STORE_METADATA.md`](/Users/eunho_xiv/Documents/Memory Challenge/STORE_METADATA.md)를 사용하면 됩니다.

## 9. TestFlight

권장 순서:

1. 내부 테스터 배포
2. 실제 기기 검수
3. 필요 시 외부 테스트
4. App Review 제출

## 10. 출시 전 체크

1. `npm run build`
2. `npm run lint`
3. `npx cap sync ios`
4. 실제 iPhone에서 핵심 흐름 테스트

## 11. 주의 사항

- App Store 업로드마다 Build 번호는 증가해야 합니다.
- Version은 사용자에게 보이는 버전, Build는 내부 업로드 번호입니다.
- 웹 자산이나 설정을 바꾼 뒤에는 반드시 `npx cap sync ios`를 다시 실행해야 합니다.
