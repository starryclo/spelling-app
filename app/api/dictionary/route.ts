import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DictEntry = {
  source: "표준국어대사전" | "우리말샘";
  word: string;
  pos: string; // 품사
  definition: string;
  link: string;
};

// API 응답에서 item / sense 가 단일 객체일 수도, 배열일 수도 있어 항상 배열로 정규화
function toArray<T>(value: T | T[] | undefined | null): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function stripTags(s: string): string {
  return (s ?? "").replace(/<[^>]+>/g, "").trim();
}

async function searchStdict(query: string, key: string): Promise<DictEntry[]> {
  const url = `https://stdict.korean.go.kr/api/search.do?key=${encodeURIComponent(
    key
  )}&q=${encodeURIComponent(query)}&req_type=json&num=20`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`표준국어대사전 응답 오류 (${res.status})`);

  const text = await res.text();
  if (!text.trim()) return [];
  if (!text.trim().startsWith("{") && !text.trim().startsWith("[")) {
    throw new Error(`표준국어대사전이 JSON이 아닌 응답을 반환했습니다 (키 오류 또는 서버 오류)`);
  }
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`표준국어대사전 JSON 파싱 실패`);
  }
  const items = toArray<any>(data?.channel?.item);
  const entries: DictEntry[] = [];

  for (const item of items) {
    const senses = toArray<any>(item?.sense);
    for (const sense of senses) {
      entries.push({
        source: "표준국어대사전",
        word: stripTags(item?.word ?? sense?.word ?? ""),
        pos: stripTags(sense?.pos ?? ""),
        definition: stripTags(sense?.definition ?? ""),
        link: sense?.link ?? item?.link ?? "",
      });
    }
  }
  return entries;
}

async function searchWoorimalsam(query: string, key: string): Promise<DictEntry[]> {
  const url = `https://opendict.korean.go.kr/api/search?key=${encodeURIComponent(
    key
  )}&q=${encodeURIComponent(query)}&req_type=json&num=20`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`우리말샘 응답 오류 (${res.status})`);

  const text = await res.text();
  if (!text.trim()) return [];
  if (!text.trim().startsWith("{") && !text.trim().startsWith("[")) {
    throw new Error(`우리말샘이 JSON이 아닌 응답을 반환했습니다 (키 오류 또는 서버 오류)`);
  }
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`우리말샘 JSON 파싱 실패`);
  }
  const items = toArray<any>(data?.channel?.item);
  const entries: DictEntry[] = [];

  for (const item of items) {
    const senses = toArray<any>(item?.sense);
    for (const sense of senses) {
      entries.push({
        source: "우리말샘",
        word: stripTags(item?.word ?? sense?.word ?? ""),
        pos: stripTags(sense?.pos ?? ""),
        definition: stripTags(sense?.definition ?? ""),
        link: sense?.link ?? item?.link ?? "",
      });
    }
  }
  return entries;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").trim();
  const source = searchParams.get("source") ?? "both"; // stdict | woorimalsam | both

  if (!query) {
    return NextResponse.json({ error: "검색어를 입력하세요." }, { status: 400 });
  }

  const stdictKey = process.env.KOREAN_API_KEY;
  const woorimalsamKey = process.env.WOORIMALSAM_API_KEY || process.env.KOREAN_API_KEY;

  if (!stdictKey) {
    return NextResponse.json(
      { error: "서버에 KOREAN_API_KEY 가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  const tasks: Promise<DictEntry[]>[] = [];
  const warnings: string[] = [];

  if (source === "stdict" || source === "both") {
    tasks.push(
      searchStdict(query, stdictKey).catch((e) => {
        warnings.push(e instanceof Error ? e.message : "표준국어대사전 검색 실패");
        return [];
      })
    );
  }
  if (source === "woorimalsam" || source === "both") {
    tasks.push(
      searchWoorimalsam(query, woorimalsamKey!).catch((e) => {
        warnings.push(e instanceof Error ? e.message : "우리말샘 검색 실패");
        return [];
      })
    );
  }

  const results = (await Promise.all(tasks)).flat();

  return NextResponse.json({
    query,
    count: results.length,
    entries: results,
    warnings,
  });
}
