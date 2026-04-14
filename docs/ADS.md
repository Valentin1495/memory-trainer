---
url: 'https://developers-apps-in-toss.toss.im/ads/intro.md'
description: 인앱 광고 인앱 광고 개괄적인 소개입니다. 인앱 광고에 대해 이해할 수 있습니다.
---

# 이해하기

앱인토스가 제공하는 전면형 광고와 보상형 광고로 바로 수익화를 시작해요.\
서비스 흐름에 광고를 자연스럽게 녹이면 사용자 이탈은 줄이고, ARPDAU와 LTV는 높일 수 있어요.

:::tip **ARPDAU, LTV란**
두 지표 모두 서비스가 얼마나 돈을 잘 벌고 있는지를 판단하는 데 사용해요.

* **ARPDAU** (Average Revenue Per Daily Active User): 하루 동안 활동한 사용자 한 명이 평균적으로 얼마의 수익을 만들어냈는지를 뜻해요.
* **LTV** (Lifetime Value): 한 명의 사용자가 서비스를 처음 사용한 순간부터 떠날 때까지 전체 기간 동안 만들어내는 총 수익을 의미해요.
  :::

***

## 인앱 광고란 무엇인가요

인앱 광고는 앱 안에 노출되는 광고예요.\
사용자가 서비스를 이용하는 과정에서 자연스럽게 광고를 접하도록 구성할 수 있어요.

* **전면형 광고:** 화면 전체를 덮는 형태의 광고예요. 화면 전환 시점처럼 사용 흐름이 끊기는 구간에 노출해요.
* **보상형 광고:** 광고를 시청하면 보상을 제공하는 방식이에요. 사용자가 원할 때 선택해서 광고를 볼 수 있어요.
* **배너 광고:** 미니앱 내 설정한 화면 상단, 하단 또는 중앙에 위치하게 되는 광고예요.

**\[구글 애드몹 광고 예시]**
![](/assets/ads-intro-1.BRVfVZX-.png)

**\[토스 애즈 광고 예시]**\
![](/assets/ads-intro-2.ChPVb-eS.png)

**\[배너 광고 - 상 · 하단 예시]**\
![](/assets/ads-intro-3.ClcV7x0L.png)

**\[배너 광고 - 피드형 예시]**\
![](/assets/ads-intro-4.50Hm-Hj8.png)

***

## 인앱 광고를 사용하면 어떤 점이 좋나요

* 전면형 광고와 보상형 광고를 선택해, 서비스 흐름에 맞는 위치에 노출할 수 있어요.
* 앱을 출시한 첫날부터 광고 수익이 발생해 바로 수익화를 시작할 수 있어요.
* 광고를 계기로 사용자가 서비스를 계속 이용하도록 유도해 리텐션을 높일 수 있어요.
* 게임 서비스에서는 광고를 보고 이어하기 기능으로 사용자가 도전하던 스테이지를 계속 플레이하게 만들어, 자연스럽게 재이용을 유도할 수 있어요.

***

## 참고해 주세요

* 인앱 광고 테스트는 반드시 [테스트용 ID](https://developers-apps-in-toss.toss.im/ads/develop.html#%E1%84%90%E1%85%A6%E1%84%89%E1%85%B3%E1%84%90%E1%85%B3%E1%84%92%E1%85%A1%E1%84%80%E1%85%B5)를 사용해야 해요. 운영 ID를 사용하면 제재를 받을 수 있어요.
* 테스트용 광고 ID는 아래 값을 사용해 주세요.
  * 전면형 광고 테스트 ID: `ait-ad-test-interstitial-id`
  * 보상형 광고 테스트 ID: `ait-ad-test-rewarded-id`
  * 배너 리스트형 광고 테스트 ID: `ait-ad-test-banner-id`
  * 배너 피드형 광고 테스트 ID: `ait-ad-test-native-image-id`
* 사용자에게 광고가 과도하게 노출되지 않도록 주의해 주세요.
* 광고가 재생되는 동안 앱 사운드는 잠시 멈추고, 광고가 끝나면 자동으로 다시 재생되도록 처리해 주세요.

---
url: 'https://developers-apps-in-toss.toss.im/ads/develop.md'
description: 인앱 광고 개발 방법입니다. 앱인토스에서 인앱광고를 개발할 때 참고해주세요.
---

# 개발하기

광고는 수익을 만드는 수단이에요.\
하지만 사용자 경험을 해치면 오히려 이탈이 늘어날 수 있어요.\
정책을 지키면서 자연스럽게 노출하는 것이 가장 중요해요.

***

## 인앱 광고 2.0 ver2 (통합 SDK)

인앱 광고 2.0 ver2는 **토스 애즈(Toss Ads)** 와 **구글 애드몹(Google AdMob)** 을 통합한 광고 솔루션이에요.\
파트너사는 하나의 SDK만 연동하면 되고, 어떤 네트워크를 사용할지는 환경에 맞춰 SDK가 자동으로 선택해요.\
광고 노출 성공률을 높여 보다 안정적인 수익을 기대할 수 있어요.

***

## 광고 정책

### 토스 애즈 SSP 정책

아래 정책을 반드시 지켜주세요. 위반할 경우 광고 노출이 제한될 수 있어요.

| **유형**                  | **금지 행위**                                                 | **구체적 예시**                                                                                         |                                                                            |
| ------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| **UI 조작**               | 광고·콘텐츠 구분이 불명확하거나 사용자를 오인시키는 배너 변경 | “추천 서비스”, “금융 팁” 등으로 광고를 위장, CTA 문구 임의 변경                                         | 광고는 반드시 “ad” 표기 유지, 광고 타이틀·라벨 임의 수정 금지              |
| **광고 로직 변조**        | SDK 기본 클릭·노출 로직 수정, 자동 리프레시·리디렉션 추가     | web-public에서 광고 클릭 시 별도 페이지로 강제 이동 , Back 버튼 차단 / Dead-end 구조 / ATF 첫 화면 광고 | SDK 기본 이벤트(Click / Impression) 구조 변조 금지. SDK 외부 API 호출 불가 |
| **자동화 트래픽**         | 자동 클릭·자동 새로고침 등 비정상 노출 유도                   | 광고 영역을 주기적 refresh 처리, Back 버튼 차단 / Dead-end 구조 / ATF 첫 화면 광고                      | 트래픽 조작 감지 시 SSP 로그 차단 + 정산 보류                              |
| **광고 디자인 임의 수정** | 광고 색상, 배치, CTA, 크기 등 임의 변경                       | Toss Ads 가이드 외 광고 단위의 색상·글꼴 변경                                                           | 모든 광고 UI는 **web-base 표준 컴포넌트** 사용 필수                        |
| **보상·참여형 클릭**      | 클릭 시 리워드·이벤트 제공 문구 추가                          | “광고 클릭 시 포인트 지급” / “참여하면 혜택”                                                            | 클릭 보상성 문구·이벤트 연동 금지                                          |
| **광고 은닉 또는 겹침**   | 다른 요소 위에 배너를 덮거나 숨김                             | 다른 카드 UI 뒤에 광고 DOM 삽입                                                                         | 광고는 노출 상태가 명확히 확인 가능해야 함                                 |

### UX / Product Principle 운영 원칙

광고도 토스의 UX 원칙을 따라야 해요.

| **Toss Principle**             | **적용 기준**                                                   | **예시**                                  |
| ------------------------------ | --------------------------------------------------------------- | ----------------------------------------- |
| **Simplicity**                 | 광고는 명료해야 하며, 추가 설명 없이 의미를 이해할 수 있어야 함 | “지금 보기”, “광고 보기” 등 명확 CTA 사용 |
| **Clear Action**               | 광고 클릭 후 어떤 행동이 발생할지 사용자가 예측 가능해야 함     | 리디렉션·새창 이동 시 고지 문구 노출      |
| **No Deception (UX Red Rule)** | 광고가 예상치 못한 순간, 형태, 위치에서 등장하지 않아야 함      | 서비스 진입 직후 전면 배너 금지           |
| **Value First**                | 광고는 고객의 서비스 목표를 방해하지 않아야 함                  | 결제/계좌 개설 흐름 중 광고 삽입 금지     |

***

## 광고 유형

서비스 구조와 사용자 흐름에 맞는 광고 유형을 선택해 주세요.

### 1. 전면형 광고와 리워드 광고

미리 광고를 로드해 두었다가 필요한 시점에 바로 노출해요.

* 특정 행동 이후 전환 지점에서 노출하기 좋아요.
* 리워드 광고는 사용자가 자발적으로 선택할 때 사용해요.

자세한 연동 방법은 [인앱 광고 2.0 ver2 (전면형/리워드 광고)](/bedrock/reference/framework/광고/IntegratedAd.html) 문서를 참고하세요.

### 2. 배너 광고

화면 일부 영역에 고정으로 노출해요.

* 콘텐츠 하단이나 리스트 중간에 자연스럽게 배치해요.
* 스크롤을 방해하지 않도록 높이를 충분히 고려해요.

플랫폼에 따라 문서를 참고하세요.

* WebView 개발 방법은 [인앱 광고 2.0 ver2 (배너 광고 - WebView)](/bedrock/reference/framework/광고/BannerAd.html) 문서를 참고하세요.
* React Native 개발 방법은 [인앱 광고 2.0 ver2 (배너 광고 - React Native)](/bedrock/reference/framework/광고/RN-BannerAd.html) 문서를 참고하세요.

## 배너 광고 UI 가이드

### 리스트형 배너

![](/assets/banner_list_1.4dkEYHzm.png)

리스트형 배너 광고는 두 가지 방식으로 사용할 수 있어요.

| 방식                                        | 설명                                  | 컨테이너 높이 |
| ------------------------------------------- | ------------------------------------- | ------------- |
| **고정형**                                  | 컨테이너 높이를 고정하여 사용         |
| (ex: 화면 하단 고정 배너 광고)              | `96px` 권장                           |
| **인라인**                                  | 광고 콘텐츠에 따라 높이가 자동 조절됨 |
| (ex: 게시판의 게시물 목록 사이의 배너 광고) | 지정하지 않음                         |

#### 스타일 옵션

`attachBanner`의 옵션을 통해 배너의 스타일을 커스터마이즈할 수 있어요.

#### theme (테마)

![](/assets/banner_list_2.BBrOdl_O.png)

| 값              | 설명                                  |
| --------------- | ------------------------------------- |
| `auto` (기본값) | 시스템 다크모드 설정에 따라 자동 전환 |
| `light`         | 밝은 테마 고정                        |
| `dark`          | 어두운 테마 고정                      |

#### tone (배경 색상)

![](/assets/banner_list_3.Jx09FKI7.png)

| 값                       | 설명                                                                                      |
| ------------------------ | ----------------------------------------------------------------------------------------- |
| `blackAndWhite` (기본값) | • 흰색(light) 또는 검정색(dark) 광고 배경  • SDK가 서빙되는 화면의 색이 있을 때 추천 |
| `grey`                   | • 회색 계열 광고 배경  • SDK가 서빙되는 화면의 색이 없을 때 추천                     |

#### variant (배너 형태)

![](/assets/banner_list_4.Ct2H_Q_E.png)

| 값                  | 설명                    |
| ------------------- | ----------------------- |
| `expanded` (기본값) | 전체 너비로 확장된 형태 |
| `card`              | 둥근 모서리의 카드 형태 |

#### 광고 영역 크기 가이드

* `width`는 항상 화면 너비와 동일해야 해요 (`100%` 또는 뷰포트 전체 너비)
* 고정형으로 사용할 경우 `height: 96px`를 권장해요
* 인라인으로 사용할 경우 `height`를 고정하지 않아야 콘텐츠에 맞게 자동 조절돼요

#### 광고 적용 화면 & 삽입 위치

* 메인 화면, 상세 화면 등 원하는 화면 어디든 붙일 수 있어요
* 튜토리얼/로딩/컷신/시스템팝업/권한요청 모달 같이 일시적으로 뜨는 화면에는 지양해주세요

#### 광고 삽입 위치

**게임형 서비스**

* 상단 / 하단 중 골라서 붙일 수 있어요
* 화면 중앙에는 붙일 수 없어요
* 상호작용이 가능한 UI 컴포넌트가 없는 빈 영역만 가능해요.(게임의 주요 UI와 겹치는 영역은 광고를 붙일 수 없어요)

**이 외**

* 상단 / 중앙 / 하단 중 골라서 붙일 수 있어요
* 상호작용이 가능한 UI 컴포넌트가 없는 빈 영역만 가능해요(서비스의 주요 UI와 겹치는 영역은 광고를 붙일 수 없어요)
* 위 아래의 ui 영역을 충분히 확보해주세요

#### 광고 주변 최소 여백

**게임형 서비스**

* 상단 : 네비게이션(status) bar 아래, 패딩 4px
* 하단 : 인디게이터(네비게이션) bar 바로 위, 패딩 4px

**이 외**

* 없음

***

### 피드형 배너

![](/assets/banner_feed_1.CydX1zVe.png)

피드형 광고는 두 가지 방식으로 사용할 수 있어요.

| 방식                                        | 설명                                  | 컨테이너 높이 |
| ------------------------------------------- | ------------------------------------- | ------------- |
| **고정형**                                  | 컨테이너 높이를 고정하여 사용         |
| (ex: 화면 하단 고정 배너 광고)              | `410px` 권장                          |
| **인라인**                                  | 광고 콘텐츠에 따라 높이가 자동 조절됨 |
| (ex: 게시판의 게시물 목록 사이의 배너 광고) | 지정하지 않음                         |

#### 스타일 옵션

* WEB에서는 `attachBanner`의 옵션을 통해 배너의 스타일을 커스터마이즈할 수 있어요.
* RN에서는 `InlineAd`의 prop을 통해 배너의 스타일을 커스터마이즈할 수 있어요.

#### theme (테마)

![](/assets/banner_feed_2.B3LfBbTt.png)

| 값              | 설명                                  |
| --------------- | ------------------------------------- |
| `auto` (기본값) | 시스템 다크모드 설정에 따라 자동 전환 |
| `light`         | 밝은 테마 고정                        |
| `dark`          | 어두운 테마 고정                      |

#### tone (배경 색상)

![](/assets/banner_feed_3.Benkd-LH.png)

| 값                                        | 설명                                      |
| ----------------------------------------- | ----------------------------------------- |
| `blackAndWhite` (기본값)                  | • 흰색(light) 또는 검정색(dark) 광고 배경 |
| • SDK가 서빙되는 화면의 색이 있을 때 추천 |
| `grey`                                    | • 회색 계열 광고 배경                     |
| • SDK가 서빙되는 화면의 색이 없을 때 추천 |

#### variant (배너 형태)

![](/assets/banner_feed_4.CAyLC1v3.png)

| 값                  | 설명                    |
| ------------------- | ----------------------- |
| `expanded` (기본값) | 전체 너비로 확장된 형태 |
| `card`              | 둥근 모서리의 카드 형태 |

#### 광고 영역 크기 가이드

* `width`는 항상 화면 너비와 동일해야 해요 (`100%` 또는 뷰포트 전체 너비)
* 고정형으로 사용할 경우 `height: 410px`를 권장해요
* 인라인으로 사용할 경우 `height`를 고정하지 않아야 콘텐츠에 맞게 자동 조절돼요

#### 광고 적용 화면 & 삽입 위치

* 메인 화면, 상세 화면 등 원하는 화면 어디든 붙일 수 있어요
* 튜토리얼/로딩/컷신/시스템팝업/권한요청 모달 같이 일시적으로 뜨는 화면에는 지양해주세요

#### 광고 삽입 위치

* 상단/ 중앙/ 하단 어디든 붙일 수 있어요
* 스크롤이 안되는 화면에는 권장하지 않아요
* 스크롤을 할 수 없는 서비스라면, 팝업으로 붙이는 걸 추천드려요
* 상호작용이 가능한 UI 컴포넌트가 없는 빈 영역만 가능해요.
* 위 아래의 ui 영역을 충분히 확보해주세요

#### 광고 주변 최소 여백

* 위아래로 8px 이상을 추천해요.

***

## 인앱 광고 2.0 (AdMob 단독 SDK)

신규 연동은 통합 SDK 사용을 권장해요.\
AdMob 단독 SDK는 추후 지원을 종료할 수 있어요.

이 SDK는 Google AdMob 기반이며, 전면형 광고와 리워드 광고만 제공해요.\
자세한 내용은 [인앱 광고 2.0](/bedrock/reference/framework/광고/loadAppsInTossAdMob.md) 문서를 참고하세요.

***

## 테스트하기

개발 단계에서는 반드시 테스트용 광고 ID를 사용해요.\
실제 광고 ID로 테스트하면 정책 위반으로 간주해 불이익을 받을 수 있어요.

* 전면형 광고 : `ait-ad-test-interstitial-id`
* 리워드 광고 : `ait-ad-test-rewarded-id`
* 배너 광고 - 리스트형 : `ait-ad-test-banner-id`
* 배너 광고 - 피드형 : `ait-ad-test-native-image-id`

출시 전에 아래 항목을 꼭 확인해 주세요.

* 광고가 정상적으로 로드되는지 확인해요.
* 클릭 시 의도한 화면으로 이동하는지 확인해요.
* 뒤로 가기 동작이 정상적으로 작동하는지 확인해요.
* 결제나 인증 흐름을 방해하지 않는지 확인해요.

자세한 내용은 [QA 진행하기](/ads/qa.html) 문서를 참고하세요.

***

## 자주 묻는 질문

\<FaqAccordion :items='\[
{
q: "샌드박스에서 인앱 광고 기능이 되지 않아요",
a: \`샌드박스에서는 인앱 광고 기능을 지원하지 않아요.

---
url: >-
  https://developers-apps-in-toss.toss.im/bedrock/reference/framework/광고/IntegratedAd.md
---

# 인앱 광고 2.0 ver2 (전면형/보상형 광고)

인앱 광고 2.0 ver2는 **토스 애즈(Toss Ads)** 와 **구글 애드몹(Google AdMob)** 을 통합해 환경에 따라 **가장 적합한 광고를 자동으로 선택·노출하는 통합 광고 솔루션**이에요.\
파트너사는 하나의 SDK만 연동하면 되고, 어떤 네트워크를 사용할지는 환경에 맞춰 SDK가 자동으로 선택해요.\
광고 노출 성공률을 높여 보다 안정적인 수익을 기대할 수 있어요.

**전면형(Interstitial)** 과 **보상형(Rewarded)** 광고 모두 동일 API(`loadFullScreenAd`, `showFullScreenAd`)를 사용하며, 광고 타입은 **광고 그룹 ID(`adGroupId`)** 를 기준으로 자동 결정돼요.

## 지원 버전

통합 광고 API는 토스 앱 버전에 따라 다르게 동작해요 :

| 토스 앱 버전               | 지원 기능          | 설명                         |
| -------------------------- | ------------------ | ---------------------------- |
| **5.244.1 이상**           | 인앱 광고 2.0 ver2 | 토스 애즈 + AdMob            |
| **5.227.0 ~ 5.244.1 미만** | 인앱 광고 2.0      | AdMob 단독 지원              |
| **5.227.0 미만**           | 미지원             | 인앱 광고 2.0 ver2 사용 불가 |

> `isSupported()` 메서드로 현재 환경에서 인앱 광고 2.0 ver2를 사용할 수 있는지 확인할 수 있어요.

***

## API 개요

* `loadFullScreenAd(params: LoadFullScreenAdParams): () => void` — 광고를 미리 로드해요. 반환값으로 콜백 등록 해제 함수(noop 형태)를 제공해요.
* `showFullScreenAd(params: ShowFullScreenAdParams): () => void` — 로드된 광고를 화면에 표시해요. 마찬가지로 해제 함수를 반환해요.

각 API는 `isSupported()` 프로퍼티를 통해 현재 환경에서 해당 기능 사용 가능 여부를 확인할 수 있어요.

***

## 광고 불러오기 (`loadFullScreenAd`)

```typescript
function loadFullScreenAd(params: LoadFullScreenAdParams): () => void;
```

광고를 미리 로드해요. 광고를 표시하기 전에 반드시 호출해야 해요.

::: tip 안정적으로 운영하려면 이렇게 구현해 주세요

* 페이지(또는 화면) 단위로 광고를 미리 로드해 주세요.
* 광고는 반드시 **`load → show → (다음 load)`** 순서로 호출해 주세요.
* `loadFullScreenAd` 호출 후 **이벤트를 받은 뒤** `showFullScreenAd`를 호출해야 해요.
* 같은 `adGroupId` 기준으로는 한 번에 하나의 광고만 미리 로드할 수 있어요.
* 여러 `adGroupId`를 사용할 때는 각 `adGroupId`별로 하나씩 미리 로드해 둘 수 있어요.
* 광고를 표시한 뒤에는 다음 광고를 미리 로드해 두는 패턴(`load → show → load → show`)을 권장해요.
  :::

::: tip iOS에서 로드되지 않나요?
iOS에서 광고가 로드되지 않는 경우 **앱 추적 모드(App Tracking Transparency)** 설정을 확인해 주세요.\
앱 추적이 허용되지 않은 상태에서는 일부 광고 로드가 정상 동작하지 않을 수 있어요.
:::

### 파라미터

### 프로퍼티

#### `isSupported`

```typescript
loadFullScreenAd.isSupported(): boolean
```

현재 환경에서 인앱 광고 2.0 ver2 광고를 사용할 수 있는지 확인해요.

### 예제

:::code-group

```tsx[React]
import { loadFullScreenAd } from '@apps-in-toss/web-framework';
import { useState, useEffect } from 'react';

function AdComponent() {
  const [isAdLoaded, setIsAdLoaded] = useState(false);

  useEffect(() => {
    // 지원 여부 확인
    if (!loadFullScreenAd.isSupported()) {
      console.warn('광고 기능을 사용할 수 없습니다.');
      return;
    }

    // 광고 로드
    const unregister = loadFullScreenAd({
      options: {
        adGroupId: 'ait.dev.43daa14da3ae487b',
      },
      onEvent: (event) => {
        if (event.type === 'loaded') {
          console.log('광고 로드 완료');
          setIsAdLoaded(true);
        }
      },
      onError: (error) => {
        console.error('광고 로드 실패:', error);
      },
    });

    // 클린업
    return () => unregister();
  }, []);

  return (
    <button disabled={!isAdLoaded}>
      {isAdLoaded ? '광고 보기' : '광고 로딩 중...'}
    </button>
  );
}
```

```tsx[React Native]
import { loadFullScreenAd } from '@apps-in-toss/framework';
import { useEffect, useState } from 'react';
import { Alert, Button, View } from 'react-native';

function AdComponent() {
  const [isAdLoaded, setIsAdLoaded] = useState(false);

  useEffect(() => {
    // 지원 여부 확인
    if (!loadFullScreenAd.isSupported()) {
      Alert.alert('광고 기능을 사용할 수 없습니다.');
      return;
    }

    // 광고 로드
    const unregister = loadFullScreenAd({
      options: {
        adGroupId: 'ait.dev.43daa14da3ae487b',
      },
      onEvent: (event) => {
        if (event.type === 'loaded') {
          Alert.alert('광고 로드 완료');
          setIsAdLoaded(true);
        }
      },
      onError: (error) => {
        Alert.alert('광고 로드 실패', String(error));
      },
    });

    // 클린업
    return () => unregister();
  }, []);

  return (
    <View>
      <Button
        title={isAdLoaded ? '광고 보기' : '광고 로딩 중...'}
        disabled={!isAdLoaded}
      />
    </View>
  );
}
```

:::

### `LoadFullScreenAdParams`

```typescript
interface LoadFullScreenAdParams {
  options: LoadFullScreenAdOptions;
  onEvent: (data: LoadFullScreenAdEvent) => void;
  onError: (err: unknown) => void;
}
```

`loadFullScreenAd`의 파라미터 타입이에요.

### `LoadFullScreenAdOptions`

```typescript
interface LoadFullScreenAdOptions {
  adGroupId: string;
}
```

광고 로드 옵션이에요.

### `LoadFullScreenAdEvent`

```typescript
interface LoadFullScreenAdEvent {
  type: 'loaded';
}
```

광고 로드 이벤트예요. 광고가 성공적으로 로드되면 `loaded` 타입 이벤트가 발생해요.

***

## 광고 보여주기 (`showFullScreenAd`)

```typescript
function showFullScreenAd(params: ShowFullScreenAdParams): () => void;
```

로드된 광고를 화면에 표시해요. `loadFullScreenAd`로 미리 로드한 광고를 사용해주세요.

### 파라미터

### 프로퍼티

#### `isSupported`

```typescript
showFullScreenAd.isSupported(): boolean
```

현재 환경에서 통합 광고를 사용할 수 있는지 확인해요.

### 예제

:::code-group

```tsx[React]
import { loadFullScreenAd, showFullScreenAd } from '@apps-in-toss/web-framework';
import { useState, useEffect } from 'react';

function AdComponent() {
  const AD_GROUP_ID = 'ait.dev.43daa14da3ae487b';
  const [isAdLoaded, setIsAdLoaded] = useState(false);

  useEffect(() => {
    // 컴포넌트 마운트 시 광고 로드
    const unregister = loadFullScreenAd({
      options: { adGroupId: AD_GROUP_ID },
      onEvent: (event) => {
        if (event.type === 'loaded') {
          setIsAdLoaded(true);
        }
      },
      onError: (error) => {
        console.error('광고 로드 실패:', error);
      },
    });

    return () => unregister();
  }, []);

  const handleShowAd = () => {
    showFullScreenAd({
      options: { adGroupId: AD_GROUP_ID },
      onEvent: (event) => {
        switch (event.type) {
          case 'requested':
            console.log('광고 표시 요청됨');
            break;
          case 'show':
            console.log('광고 화면 표시됨');
            break;
          case 'impression':
            console.log('광고 노출 기록됨 (수익 발생)');
            break;
          case 'clicked':
            console.log('광고 클릭됨');
            break;
          case 'dismissed':
            console.log('광고가 닫힘');
            setIsAdLoaded(false);
            // 다음 광고 로드
            loadNextAd();
            break;
          case 'failedToShow':
            console.error('광고 표시 실패');
            break;
          case 'userEarnedReward':
            console.log('리워드 획득:', event.data);
            // 사용자에게 리워드 지급
            grantReward(event.data.unitType, event.data.unitAmount);
            break;
        }
      },
      onError: (error) => {
        console.error('광고 표시 실패:', error);
      },
    });
  };

  const loadNextAd = () => {
    loadFullScreenAd({
      options: { adGroupId: AD_GROUP_ID },
      onEvent: (event) => {
        if (event.type === 'loaded') setIsAdLoaded(true);
      },
      onError: console.error,
    });
  };

  const grantReward = (unitType: string, unitAmount: number) => {
    // 리워드 지급 로직
    console.log(`${unitType} ${unitAmount}개 지급`);
  };

  return (
    <button onClick={handleShowAd} disabled={!isAdLoaded}>
      광고 보기
    </button>
  );
}
```

```tsx[React Native]
import { loadFullScreenAd, showFullScreenAd } from '@apps-in-toss/framework';
import { useEffect, useState } from 'react';
import { Alert, Button, View } from 'react-native';

function AdComponent() {
  const AD_GROUP_ID = 'ait.dev.43daa14da3ae487b';
  const [isAdLoaded, setIsAdLoaded] = useState(false);

  useEffect(() => {
    // 컴포넌트 마운트 시 광고 로드
    const unregister = loadFullScreenAd({
      options: { adGroupId: AD_GROUP_ID },
      onEvent: (event) => {
        if (event.type === 'loaded') {
          setIsAdLoaded(true);
        }
      },
      onError: (error) => {
        Alert.alert('광고 로드 실패', String(error));
      },
    });

    return () => unregister();
  }, []);

  const handleShowAd = () => {
    showFullScreenAd({
      options: { adGroupId: AD_GROUP_ID },
      onEvent: (event) => {
        switch (event.type) {
          case 'requested':
            console.log('광고 표시 요청됨');
            break;
          case 'show':
            console.log('광고 화면 표시됨');
            break;
          case 'impression':
            console.log('광고 노출 기록됨 (수익 발생)');
            break;
          case 'clicked':
            console.log('광고 클릭됨');
            break;
          case 'dismissed':
            setIsAdLoaded(false);
            loadNextAd();
            break;
          case 'failedToShow':
            Alert.alert('광고 표시 실패');
            break;
          case 'userEarnedReward':
            console.log('리워드 획득:', event.data);
            grantReward(event.data.unitType, event.data.unitAmount);
            break;
        }
      },
      onError: (error) => {
        Alert.alert('광고 표시 실패', String(error));
      },
    });
  };

  const loadNextAd = () => {
    loadFullScreenAd({
      options: { adGroupId: AD_GROUP_ID },
      onEvent: (event) => {
        if (event.type === 'loaded') setIsAdLoaded(true);
      },
      onError: (error) => Alert.alert('오류', String(error)),
    });
  };

  const grantReward = (unitType: string, unitAmount: number) => {
    Alert.alert('리워드 획득', `${unitType} ${unitAmount}개가 지급되었습니다.`);
  };

  return (
    <View>
      <Button title="광고 보기" onPress={handleShowAd} disabled={!isAdLoaded} />
    </View>
  );
}
```

:::

### `ShowFullScreenAdParams`

```typescript
interface ShowFullScreenAdParams {
  options: ShowFullScreenAdOptions;
  onEvent: (data: ShowFullScreenAdEvent) => void;
  onError: (err: unknown) => void;
}
```

`showFullScreenAd`의 파라미터 타입이에요.

### `ShowFullScreenAdOptions`

```typescript
interface ShowFullScreenAdOptions {
  adGroupId: string;
}
```

광고 보여주기 옵션이에요.

### `ShowFullScreenAdEvent`

```typescript
type ShowFullScreenAdEvent =
  | { type: 'requested' }
  | { type: 'show' }
  | { type: 'impression' }
  | { type: 'clicked' }
  | { type: 'dismissed' }
  | { type: 'failedToShow' }
  | { type: 'userEarnedReward'; data: { unitType: string; unitAmount: number } };
```

광고 보여주기 이벤트예요.

#### 이벤트 설명

| 이벤트 타입        | 설명                                                                                                                                |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `requested`        | 광고 표시 요청이 성공했어요.                                                                                                        |
| `show`             | 광고가 화면에 표시되었어요.                                                                                                         |
| `impression`       | 광고 노출이 기록되었어요. (수익 발생 시점)                                                                                          |
| `clicked`          | 사용자가 광고를 클릭했어요.                                                                                                         |
| `dismissed`        | 사용자가 광고를 닫았어요.                                                                                                           |
| `failedToShow`     | 광고 표시에 실패했어요.                                                                                                             |
| `userEarnedReward` | 리워드 광고에서 사용자가 보상을 획득했어요.• `data.unitType`: 리워드 타입 (예: coin, point)• `data.unitAmount`: 리워드 수량 |

***

## 사용 가이드

### 광고 로드 타이밍

광고는 표시하기 전에 미리 로드하는 것을 권장합니다.

* 로드 타이밍 권장 목록
  * 컴포넌트 마운트 시
  * 이전 광고가 닫힌 직후
  * 광고를 표시할 화면으로 전환되기 전

```tsx
// ✅ 좋은 예: 화면 진입 시 미리 로드
useEffect(() => {
  loadFullScreenAd({
    /* ... */
  });
}, []);

// ❌ 나쁜 예: 버튼 클릭 시 로드 (사용자 대기 시간 발생)
const handleClick = () => {
  loadFullScreenAd({
    /* ... */
  }); // 로딩 시간 발생
  showFullScreenAd({
    /* ... */
  });
};
```

### 리워드 광고 처리

`userEarnedReward` 이벤트가 발생했을 때만 리워드를 지급하세요. `dismissed`만으로는 지급하면 안돼요.

```tsx
showFullScreenAd({
  options: { adGroupId: REWARDED_AD_ID },
  onEvent: (event) => {
    if (event.type === 'userEarnedReward') {
      // ✅ 리워드 지급
      grantReward(event.data);
    }

    if (event.type === 'dismissed') {
      // ❌ dismissed만으로는 리워드 지급하지 않음
    }
  },
  onError: console.error,
});
```

### 메모리 관리

컴포넌트 언마운트 시 콜백 등록을 해제하여 메모리 누수를 방지하세요.

```tsx
useEffect(() => {
  const unregister = loadFullScreenAd({
    /* ... */
  });

  return () => {
    unregister(); // 클린업
  };
}, []);
```

### 에러 처리

항상 `onError` 콜백을 제공하여 광고 로드/표시 실패에 대비하세요.

```tsx
loadFullScreenAd({
  options: { adGroupId: AD_GROUP_ID },
  onEvent: (event) => {
    /* ... */
  },
  onError: (error) => {
    console.error('광고 로드 실패:', error);
    // 사용자에게 적절한 피드백 제공 또는 재시도
  },
});
```

***

## 이벤트 플로우

:::code-group

```[전면 광고 (Interstitial)]
loadFullScreenAd 호출
  ↓
loaded 이벤트 발생
  ↓
showFullScreenAd 호출
  ↓
requested 이벤트 발생
  ↓
show 이벤트 발생 (광고 화면 표시)
  ↓
impression 이벤트 발생 (수익 발생)
  ↓
clicked 이벤트 (클릭 시) 또는 dismissed 이벤트 (닫기 시)
```

```[리워드 광고 (Rewarded)]
loadFullScreenAd 호출
  ↓
loaded 이벤트 발생
  ↓
showFullScreenAd 호출
  ↓
requested 이벤트 발생
  ↓
show 이벤트 발생 (광고 화면 표시)
  ↓
impression 이벤트 발생 (수익 발생)
  ↓
[사용자가 광고 시청 완료]
  ↓
userEarnedReward 이벤트 발생 (리워드 지급)
  ↓
dismissed 이벤트 발생 (광고 닫기)
```

:::

## 자주 묻는 질문

\<FaqAccordion :items='\[
{
q: ""This feature is not supported in the current environment" 에러가 발생해요",
a: \`1. 토스 앱 환경에서 실행 중인지 확인해주세요.

---
url: 'https://developers-apps-in-toss.toss.im/ads/qa.md'
description: 인앱 광고 자주 묻는 질문과 답변입니다. 주요 이슈 해결 방법을 확인하세요.
---

# QA 진행하기

인앱 광고 연동을 마쳤다면 아래 항목을 **꼼꼼히 점검**해 주세요.

::: tip 실기기 권장
**실단말**에서 네트워크/오디오/백그라운드 전환 동작을 확인하세요.
:::

| 항목 | 내용 |
| --- | --- |
| 사전 체크 | 화면 진입 시 사전 로드가 수행되는지 확인해주세요.   |
| 기본 연동 | 광고 로드 완료 후 지연 없이 재생되는지 확인해주세요. |
|  | 광고 종료 시 미니앱 화면으로 정상 복귀하는지 확인해주세요. |
|  | 광고 재생 시 미니앱 배경음/효과음이 일시 정지되는지 확인해주세요. |
|  | 복귀 후 배경음/효과음이 정상 재개되는지 확인해주세요. |
|  | 광고 재생 도중 닫았을 때 예외 없이 복귀되는지 확인해주세요. |
| 보상형 광고 | 시청 완료 이벤트에서만 보상이 지급되는지 확인해주세요. |
|  | 중복 보상 방지 로직이 동작하는지(재요청·새로고침 등) 확인해주세요. |
| 안정성/정책 | 광고 빈도 제한·쿨다운이 적용되어 남용을 방지하는지 확인해주세요. |
|  | 핵심 플로우 차단(결제/가입/로그인 중) 노출이 없는지 확인해주세요. |
|  | 가로/세로 전환, 백그라운드 복귀 시 정상 동작하는지 확인해주세요. |
|  | 네트워크 실패 시 재시도/대체 흐름이 준비되어 있는지 확인해주세요. |
|  | 메모리/CPU 사용량 급증이나 앱 크래시가 없는지 확인해주세요. |
| 로그/정산 | 광고 노출/완료/보상 지급 이벤트 로그가 수집되고, 대시보드/정산과 식별자가 일치하는지 확인해주세요. |
