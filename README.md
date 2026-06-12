# 속기사 맞춤법 학습기

속기사를 위한 한국어 어문 규범 학습 웹앱입니다. 사용자는 API 키 입력 없이 바로 사용할 수 있으며, 모든 키는 서버 환경변수로 안전하게 관리됩니다.

## 주요 기능

1. **맞춤법 · 띄어쓰기 · 외래어 검사** — Claude AI가 받아 적은 문장을 어문 규범에 맞게 교정하고 이유를 설명합니다.
2. **국어사전 단어 검색** — 국립국어원 표준국어대사전 + 우리말샘에서 표제어 뜻풀이를 찾습니다.
3. **내 단어장** — 브라우저 로컬스토리지에 저장. `맞춤법 / 외래어 / 한단어` 로 분류 관리합니다.
4. **플래시카드 학습** — 단어장을 카드로 뒤집으며 셀프 채점으로 복습합니다.

## 기술 스택

- Next.js 14 (App Router) — Vercel 배포 최적화
- Claude API (`claude-opus-4-8`, 적응형 사고 + 구조화 출력)
- API 키는 모두 서버 측 API Route(`/api/*`)에서만 사용 — 클라이언트에 노출되지 않습니다.

## 로컬 실행

```bash
npm install
cp .env.local.example .env.local   # 키 입력
npm run dev
```

`.env.local` 에 아래 값을 채우세요.

| 변수 | 용도 | 발급처 |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | 맞춤법 검사 (Claude) | https://console.anthropic.com |
| `KOREAN_API_KEY` | 표준국어대사전 검색 | https://stdict.korean.go.kr/openapi/openApiInfo.do |
| `WOORIMALSAM_API_KEY` | (선택) 우리말샘 검색 | https://opendict.korean.go.kr/service/openApiInfo |

> 표준국어대사전과 우리말샘은 별도의 API 키를 사용합니다. `WOORIMALSAM_API_KEY` 를 비워 두면 우리말샘 검색에도 `KOREAN_API_KEY` 를 사용하지만, 정상 동작을 위해 우리말샘 키를 따로 발급받아 설정하는 것을 권장합니다.

http://localhost:3000 에서 확인합니다.

## Vercel 배포

1. 이 저장소를 GitHub 에 올린 뒤 Vercel 에서 Import 합니다.
2. **Project Settings → Environment Variables** 에 `ANTHROPIC_API_KEY`, `KOREAN_API_KEY`, (선택) `WOORIMALSAM_API_KEY` 를 추가합니다.
3. Deploy 하면 끝입니다. 별도 설정 없이 App Router API Route 가 서버리스 함수로 동작합니다.

## 폴더 구조

```
app/
  api/
    check/route.ts        맞춤법 검사 (Claude)
    dictionary/route.ts   사전 검색 (국립국어원)
  components/
    SpellChecker.tsx
    DictionarySearch.tsx
    WordBook.tsx
    Flashcards.tsx
  layout.tsx / page.tsx / globals.css
lib/
  storage.ts              단어장 로컬스토리지 로직
```

## 참고

- 단어장 데이터는 사용자의 브라우저에만 저장됩니다(서버 저장 없음). 기기·브라우저를 바꾸면 데이터가 공유되지 않습니다.
- 비용/속도가 더 중요하면 `app/api/check/route.ts` 의 모델을 `claude-sonnet-4-6` 또는 `claude-haiku-4-5` 로 바꿀 수 있습니다.
