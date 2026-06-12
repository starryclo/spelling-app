// 내 단어장 로컬스토리지 관리

export type WordCategory = "맞춤법" | "외래어" | "한단어";

export type WordItem = {
  id: string;
  term: string; // 표제어 / 틀린 표현
  answer: string; // 올바른 표현 / 뜻
  note: string; // 메모 / 설명
  category: WordCategory;
  createdAt: number;
  // 플래시카드 학습 통계
  reviewCount: number;
  correctCount: number;
};

const STORAGE_KEY = "spelling-app:wordbook:v1";

export const CATEGORIES: WordCategory[] = ["맞춤법", "외래어", "한단어"];

function genId(): string {
  return `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

export function loadWords(): WordItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAll(words: WordItem[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
}

export function addWord(
  input: Omit<WordItem, "id" | "createdAt" | "reviewCount" | "correctCount">
): WordItem[] {
  const words = loadWords();
  const item: WordItem = {
    ...input,
    id: genId(),
    createdAt: Date.now(),
    reviewCount: 0,
    correctCount: 0,
  };
  const next = [item, ...words];
  saveAll(next);
  return next;
}

export function removeWord(id: string): WordItem[] {
  const next = loadWords().filter((w) => w.id !== id);
  saveAll(next);
  return next;
}

export function updateWord(id: string, patch: Partial<WordItem>): WordItem[] {
  const next = loadWords().map((w) => (w.id === id ? { ...w, ...patch } : w));
  saveAll(next);
  return next;
}

export function recordReview(id: string, correct: boolean): WordItem[] {
  const next = loadWords().map((w) =>
    w.id === id
      ? {
          ...w,
          reviewCount: w.reviewCount + 1,
          correctCount: w.correctCount + (correct ? 1 : 0),
        }
      : w
  );
  saveAll(next);
  return next;
}

// 중복(같은 표제어 + 분류) 여부 확인
export function isDuplicate(term: string, category: WordCategory): boolean {
  return loadWords().some(
    (w) => w.term.trim() === term.trim() && w.category === category
  );
}
