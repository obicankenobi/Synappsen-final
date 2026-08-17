import { saneraMarkdown } from "../utils/sanering";

// Renderar enkel Markdown (rubriker, punktlistor, fetstil, kursiv, länkar) säkert.
// Saneringsregeln bor i utils/sanering.js – se den filen för vad som filtreras bort och
// varför (säkerhetsgranskning 2026-08-17, fynd 4.2).
export default function MarkdownInnehall({ text, className }) {
  return <div className={className} dangerouslySetInnerHTML={{ __html: saneraMarkdown(text) }} />;
}
