"use client";

import { useState } from "react";
import SpellChecker from "./components/SpellChecker";
import DictionarySearch from "./components/DictionarySearch";
import WordBook from "./components/WordBook";
import Flashcards from "./components/Flashcards";

type Tab = "check" | "dictionary" | "wordbook" | "flashcards";

const TABS: { key: Tab; label: string }[] = [
  { key: "check", label: "맞춤법 검사" },
  { key: "dictionary", label: "단어 검색" },
  { key: "wordbook", label: "내 단어장" },
  { key: "flashcards", label: "플래시카드" },
];

export default function Home() {
  const [tab, setTab] = useState<Tab>("check");

  return (
    <div className="container">
      <header className="app-header">
        <h1>속기사 맞춤법 학습기</h1>
        <p>검사 · 검색 · 단어장 · 플래시카드로 어문 규범을 익히세요</p>
      </header>

      <nav className="tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={tab === t.key ? "active" : ""}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* 탭 전환 시 컴포넌트를 새로 마운트해 localStorage 변경을 즉시 반영 */}
      {tab === "check" && <SpellChecker />}
      {tab === "dictionary" && <DictionarySearch />}
      {tab === "wordbook" && <WordBook />}
      {tab === "flashcards" && <Flashcards />}
    </div>
  );
}
