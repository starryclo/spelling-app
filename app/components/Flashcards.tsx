"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CATEGORIES,
  loadWords,
  recordReview,
  WordCategory,
  WordItem,
} from "@/lib/storage";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Flashcards() {
  const [allWords, setAllWords] = useState<WordItem[]>([]);
  const [filter, setFilter] = useState<"전체" | WordCategory>("전체");
  const [deck, setDeck] = useState<WordItem[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [stats, setStats] = useState({ correct: 0, wrong: 0 });
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    setAllWords(loadWords());
  }, []);

  const available = useMemo(
    () =>
      filter === "전체" ? allWords : allWords.filter((w) => w.category === filter),
    [allWords, filter]
  );

  function startStudy() {
    if (available.length === 0) return;
    setDeck(shuffle(available));
    setIndex(0);
    setFlipped(false);
    setStats({ correct: 0, wrong: 0 });
    setFinished(false);
  }

  function answer(correct: boolean) {
    const card = deck[index];
    if (card) {
      recordReview(card.id, correct);
    }
    setStats((s) => ({
      correct: s.correct + (correct ? 1 : 0),
      wrong: s.wrong + (correct ? 0 : 1),
    }));
    if (index + 1 >= deck.length) {
      setFinished(true);
      setAllWords(loadWords()); // 통계 갱신
    } else {
      setIndex(index + 1);
      setFlipped(false);
    }
  }

  // 학습 시작 전 화면
  if (deck.length === 0 || finished) {
    return (
      <div className="panel">
        <p className="section-title">플래시카드 학습</p>
        <p className="hint">
          분류를 선택하고 학습을 시작하세요. 카드를 눌러 정답을 확인한 뒤 스스로
          채점합니다.
        </p>

        {finished && (
          <div
            className="corrected-sentence"
            style={{ background: "#eff6ff", borderColor: "#bfdbfe" }}
          >
            <strong>학습 완료!</strong> 총 {stats.correct + stats.wrong}장 중{" "}
            <span style={{ color: "var(--success)" }}>정답 {stats.correct}</span> ·{" "}
            <span style={{ color: "var(--danger)" }}>오답 {stats.wrong}</span>
          </div>
        )}

        <div className="tabs" style={{ position: "static", boxShadow: "none", marginTop: 14 }}>
          {(["전체", ...CATEGORIES] as const).map((c) => {
            const n =
              c === "전체"
                ? allWords.length
                : allWords.filter((w) => w.category === c).length;
            return (
              <button
                key={c}
                className={filter === c ? "active" : ""}
                onClick={() => setFilter(c)}
              >
                {c} {n}
              </button>
            );
          })}
        </div>

        {available.length === 0 ? (
          <div className="empty">
            학습할 단어가 없습니다. 단어장에 단어를 먼저 추가하세요.
          </div>
        ) : (
          <button
            className="btn"
            style={{ width: "100%", marginTop: 16 }}
            onClick={startStudy}
          >
            {finished ? "다시 학습하기" : `학습 시작 (${available.length}장)`}
          </button>
        )}
      </div>
    );
  }

  // 학습 중 화면
  const card = deck[index];
  return (
    <div>
      <div className="progress">
        {index + 1} / {deck.length} · 정답 {stats.correct} · 오답 {stats.wrong}
      </div>

      <div className="flashcard">
        <div className="flashcard-inner" onClick={() => setFlipped((f) => !f)}>
          <span className={`tag ${card.category}`}>{card.category}</span>
          {!flipped ? (
            <>
              <div className="front-label" style={{ marginTop: 14 }}>
                {card.category === "한단어" ? "단어" : "이 표현, 맞을까요?"}
              </div>
              <div className="big">{card.term}</div>
              <div className="note">카드를 눌러 정답 확인</div>
            </>
          ) : (
            <>
              <div className="front-label" style={{ marginTop: 14 }}>
                {card.term}
              </div>
              <div className="answer">{card.answer || "(정답 미입력)"}</div>
              {card.note && <div className="note">{card.note}</div>}
            </>
          )}
        </div>
      </div>

      {flipped ? (
        <div className="row" style={{ gap: 10 }}>
          <button
            className="btn danger"
            style={{ flex: 1 }}
            onClick={() => answer(false)}
          >
            ✗ 틀렸어요
          </button>
          <button
            className="btn"
            style={{ flex: 1, background: "var(--success)" }}
            onClick={() => answer(true)}
          >
            ✓ 맞혔어요
          </button>
        </div>
      ) : (
        <button
          className="btn ghost"
          style={{ width: "100%" }}
          onClick={() => setFlipped(true)}
        >
          정답 보기
        </button>
      )}

      <button
        className="btn ghost small"
        style={{ width: "100%", marginTop: 10 }}
        onClick={() => {
          setDeck([]);
          setFinished(false);
        }}
      >
        그만두기
      </button>
    </div>
  );
}
