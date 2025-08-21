import React from "react";
import Prose from "./Prose";

type Props = { text: string; className?: string };

export default function MarkdownRenderer({ text, className }: Props) {
  // Splits in paragrafen op lege regel
  const blocks = text.trim().split(/\n{2,}/);

  const renderInline = (s: string) => {
    // **bold**, *italic*
    const withBold = s.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith("**") && part.endsWith("**")
        ? <strong key={i} className="font-semibold text-amber-200">{part.slice(2,-2)}</strong>
        : part
    );
    return withBold.map((part: any, i: number) =>
      typeof part === "string"
        ? part.split(/(\*[^*]+\*)/g).map((p, j) =>
            p.startsWith("*") && p.endsWith("*")
              ? <em key={`${i}-${j}`} className="italic text-stone-300">{p.slice(1,-1)}</em>
              : <React.Fragment key={`${i}-${j}`}>{p}</React.Fragment>
          )
        : <React.Fragment key={i}>{part}</React.Fragment>
    );
  };

  const renderBlock = (b: string, i: number) => {
    // koppen
    if (/^###\s+/.test(b)) return <h3 key={i}>{renderInline(b.replace(/^###\s+/, ""))}</h3>;
    if (/^##\s+/.test(b))  return <h2 key={i}>{renderInline(b.replace(/^##\s+/, ""))}</h2>;
    // blockquote
    if (/^>\s+/.test(b))   return <blockquote key={i}>{renderInline(b.replace(/^>\s+/, ""))}</blockquote>;
    // horizontale lijn
    if (/^(-{3,}|\*{3,})$/.test(b.trim())) return <hr key={i} />;

    // (on)genummerde lijsten
    if (b.split("\n").every(l => /^(\-|\*|\d+\.)\s+/.test(l))) {
      const items = b.split("\n").map(l => l.replace(/^(\-|\*|\d+\.)\s+/, ""));
      const ordered = /^\d+\.\s+/.test(b.split("\n")[0]);
      return ordered ? (
        <ol key={i}>{items.map((it, j) => <li key={j}>{renderInline(it)}</li>)}</ol>
      ) : (
        <ul key={i}>{items.map((it, j) => <li key={j}>{renderInline(it)}</li>)}</ul>
      );
    }

    // standaard paragraaf
    return <p key={i}>{renderInline(b)}</p>;
  };

  return <Prose className={className}>{blocks.map(renderBlock)}</Prose>;
}