"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addWord,
  CATEGORIES,
  isDuplicate,
  loadWords,
  removeWord,
  WordCategory,
  WordItem,
} from "@/lib/storage";

export default function WordBook() {
  const [words, setWords] = useState<WordItem[]>([]);
  const [filter, setFilter] = useState<"전체" | WordCategory>("전체");

  // 수동 추가 폼
  const [answer, setAnswer] = useState("");
  const [note, setNote] = useState("");
  const [category, setCategory] = useState<WordCategory>("맞춤법");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    setWords(loadWords());
  }, []);

  const filtered = useMemo(
    () => (filter === "전체" ? words : words.filter((w) => w.category === filter)),
    [words, filter]
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { 전체: words.length };
    for (const cat of CATEGORIES) c[cat] = words.filter((w) => w.category === cat).length;
    return c;
  }, [words]);

  function handleAdd() {
    const a = answer.trim();
    if (!a) {
      setFormError("올바른 표현/뜻을 입력하세요.");
      return;
    }
    if (isDuplicate(a, category)) {
      setFormError("이미 같은 분류에 등록된 단어입니다.");
      return;
    }
    setWords(addWord({ term: a, answer: "", note: note.trim(), category }));
    setAnswer("");
    setNote("");
    setFormError("");
  }

  function handleRemove(id: string) {
    setWords(removeWord(id));
  }

  return (
    <div>
      <div className="panel">
        <p className="section-title">단어 직접 추가</p>
        <p className="hint">검사·검색 결과 외에 직접 외우고 싶은 단어를 등록하세요.</p>
        <div className="row" style={{ marginBottom: 10 }}>
          <input
            className="text-input"
            style={{ flex: 1, minWidth: 140 }}
            placeholder="올바른 표현 / 뜻"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
        </div>
        <div className="row">
          <input
            className="text-input"
            style={{ flex: 1, minWidth: 180 }}
            placeholder="메모 / 설명 (선택)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <select
            className="select-input"
            value={category}
            onChange={(e) => setCategory(e.target.value as WordCategory)}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button className="btn" onClick={handleAdd}>
            추가
          </button>
        </div>
        {formError && <div className="error-box">{formError}</div>}
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <p className="section-title" style={{ margin: 0 }}>
            내 단어장 ({counts["전체"]})
          </p>
        </div>
        <div className="tabs" style={{ position: "static", margin: "14px 0 0", boxShadow: "none" }}>
          {(["전체", ...CATEGORIES] as const).map((c) => (
            <button
              key={c}
              className={filter === c ? "active" : ""}
              onClick={() => setFilter(c)}
            >
              {c} {counts[c] ?? 0}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="empty">
            {words.length === 0
              ? "아직 저장된 단어가 없습니다. 검사·검색 결과나 위 양식으로 추가해 보세요."
              : "이 분류에는 단어가 없습니다."}
          </div>
        ) : (
          <div className="list">
            {filtered.map((w) => (
              <div className="list-item" key={w.id}>
                <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <span className={`tag ${w.category}`}>{w.category}</span>{" "}
                    <span className="term">{w.term}</span>
                    {w.answer && (
                      <span style={{ color: "var(--primary)" }}> → {w.answer}</span>
                    )}
                    {w.note && <div className="def muted">{w.note}</div>}
                    {w.reviewCount > 0 && (
                      <div className="meta">
                        학습 {w.reviewCount}회 · 정답 {w.correctCount}회
                      </div>
                    )}
                  </div>
                  <button
                    className="btn danger small"
                    onClick={() => handleRemove(w.id)}
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
