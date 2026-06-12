"use client";

import { useState } from "react";
import { addWord, isDuplicate, WordCategory } from "@/lib/storage";

type Correction = {
  original: string;
  suggestion: string;
  type: "맞춤법" | "띄어쓰기" | "외래어";
  explanation: string;
};

type CheckResult = {
  original: string;
  corrected: string;
  hasErrors: boolean;
  corrections: Correction[];
};

// 검사 결과의 type 을 단어장 분류로 매핑 (띄어쓰기 → 맞춤법)
function toCategory(type: Correction["type"]): WordCategory {
  if (type === "외래어") return "외래어";
  return "맞춤법";
}

export default function SpellChecker() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<CheckResult | null>(null);
  const [saved, setSaved] = useState<Record<number, boolean>>({});

  async function handleCheck() {
    const trimmed = text.trim();
    if (!trimmed) {
      setError("검사할 문장을 입력하세요.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    setSaved({});
    try {
      const res = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "검사에 실패했습니다.");
        return;
      }
      setResult(data);
    } catch {
      setError("네트워크 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  function handleSave(c: Correction, index: number) {
    const category = toCategory(c.type);
    if (isDuplicate(c.original, category)) {
      setSaved((s) => ({ ...s, [index]: true }));
      return;
    }
    addWord({
      term: c.original,
      answer: c.suggestion,
      note: c.explanation,
      category,
    });
    setSaved((s) => ({ ...s, [index]: true }));
  }

  return (
    <div>
      <div className="panel">
        <p className="section-title">맞춤법 · 띄어쓰기 · 외래어 검사</p>
        <p className="hint">
          받아 적은 문장을 붙여 넣고 검사하세요. AI가 어문 규범에 맞게 교정합니다.
        </p>
        <textarea
          className="input-area"
          placeholder="예) 그 회의 내용을 빠짐없이 받아적었읍니다."
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={4000}
        />
        <div className="row" style={{ marginTop: 12, justifyContent: "space-between" }}>
          <span className="muted" style={{ fontSize: "0.82rem" }}>
            {text.length} / 4000자
          </span>
          <div className="row">
            <button
              className="btn ghost small"
              onClick={() => {
                setText("");
                setResult(null);
                setError("");
              }}
              disabled={loading}
            >
              지우기
            </button>
            <button className="btn" onClick={handleCheck} disabled={loading}>
              {loading && <span className="spinner" />}
              {loading ? "검사 중…" : "검사하기"}
            </button>
          </div>
        </div>
        {error && <div className="error-box">{error}</div>}
      </div>

      {result && (
        <div className="panel" style={{ marginTop: 16 }}>
          {!result.hasErrors ? (
            <p style={{ margin: 0, color: "var(--success)", fontWeight: 700 }}>
              ✓ 어문 규범상 고칠 부분을 찾지 못했습니다.
            </p>
          ) : (
            <>
              <p className="section-title">
                교정 제안 {result.corrections.length}건
              </p>
              {result.corrections.map((c, i) => (
                <div className="correction-item" key={i}>
                  <span className={`tag ${c.type}`}>{c.type}</span>
                  <div className="change">
                    <span className="wrong">{c.original}</span>
                    <span className="arrow">→</span>
                    <span className="right">{c.suggestion}</span>
                  </div>
                  <div className="muted" style={{ fontSize: "0.9rem" }}>
                    {c.explanation}
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <button
                      className="btn ghost small"
                      onClick={() => handleSave(c, i)}
                      disabled={saved[i]}
                    >
                      {saved[i] ? "✓ 단어장에 있음" : "＋ 단어장에 추가"}
                    </button>
                  </div>
                </div>
              ))}

              <div className="corrected-sentence">
                <strong>교정된 문장</strong>
                <div style={{ marginTop: 6 }}>{result.corrected}</div>
              </div>
              <button
                className="btn ghost small"
                style={{ marginTop: 10 }}
                onClick={() => navigator.clipboard?.writeText(result.corrected)}
              >
                교정문 복사
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
