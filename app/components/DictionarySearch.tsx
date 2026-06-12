"use client";

import { useState } from "react";
import { addWord, isDuplicate } from "@/lib/storage";

type DictEntry = {
  source: "표준국어대사전" | "우리말샘";
  word: string;
  pos: string;
  definition: string;
  link: string;
};

export default function DictionarySearch() {
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("both");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [entries, setEntries] = useState<DictEntry[] | null>(null);
  const [saved, setSaved] = useState<Record<number, boolean>>({});

  async function handleSearch() {
    const trimmed = query.trim();
    if (!trimmed) {
      setError("검색어를 입력하세요.");
      return;
    }
    setLoading(true);
    setError("");
    setWarnings([]);
    setEntries(null);
    setSaved({});
    try {
      const res = await fetch(
        `/api/dictionary?q=${encodeURIComponent(trimmed)}&source=${source}`
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "검색에 실패했습니다.");
        return;
      }
      setEntries(data.entries);
      setWarnings(data.warnings || []);
    } catch {
      setError("네트워크 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  function handleSave(e: DictEntry, index: number) {
    if (isDuplicate(e.word, "한단어")) {
      setSaved((s) => ({ ...s, [index]: true }));
      return;
    }
    addWord({
      term: e.word,
      answer: e.definition,
      note: `${e.source}${e.pos ? ` · ${e.pos}` : ""}`,
      category: "한단어",
    });
    setSaved((s) => ({ ...s, [index]: true }));
  }

  return (
    <div>
      <div className="panel">
        <p className="section-title">국어사전 단어 검색</p>
        <p className="hint">
          국립국어원 표준국어대사전과 우리말샘에서 표제어 뜻풀이를 찾습니다.
        </p>
        <div className="row">
          <input
            className="text-input"
            style={{ flex: 1, minWidth: 180 }}
            placeholder="검색할 단어"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <select
            className="select-input"
            value={source}
            onChange={(e) => setSource(e.target.value)}
          >
            <option value="both">전체</option>
            <option value="stdict">표준국어대사전</option>
            <option value="woorimalsam">우리말샘</option>
          </select>
          <button className="btn" onClick={handleSearch} disabled={loading}>
            {loading && <span className="spinner" />}
            {loading ? "검색 중…" : "검색"}
          </button>
        </div>
        {error && <div className="error-box">{error}</div>}
        {warnings.length > 0 && (
          <div className="error-box" style={{ background: "#fff7ed", color: "#9a3412", borderColor: "#fed7aa" }}>
            {warnings.join(" / ")}
          </div>
        )}
      </div>

      {entries && (
        <div style={{ marginTop: 16 }}>
          {entries.length === 0 ? (
            <div className="panel empty">검색 결과가 없습니다.</div>
          ) : (
            <div className="list">
              {entries.map((e, i) => (
                <div className="list-item" key={i}>
                  <div className="row" style={{ justifyContent: "space-between" }}>
                    <div className="term">
                      {e.word}
                      {e.pos && (
                        <span className="muted" style={{ fontSize: "0.85rem", fontWeight: 400 }}>
                          {" "}
                          「{e.pos}」
                        </span>
                      )}
                    </div>
                    <span className="muted" style={{ fontSize: "0.78rem" }}>
                      {e.source}
                    </span>
                  </div>
                  <div className="def">{e.definition}</div>
                  <div className="row" style={{ marginTop: 8 }}>
                    <button
                      className="btn ghost small"
                      onClick={() => handleSave(e, i)}
                      disabled={saved[i]}
                    >
                      {saved[i] ? "✓ 단어장에 있음" : "＋ 단어장에 추가"}
                    </button>
                    {e.link && (
                      <a
                        className="btn ghost small"
                        href={e.link}
                        target="_blank"
                        rel="noreferrer"
                        style={{ textDecoration: "none" }}
                      >
                        원문 보기 ↗
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
