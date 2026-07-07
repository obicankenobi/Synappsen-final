import { marked } from "marked";
import DOMPurify from "dompurify";

// Renderar enkel Markdown (rubriker, punktlistor, fetstil, kursiv, länkar) säkert.
export default function MarkdownInnehall({ text, className }) {
  const html = DOMPurify.sanitize(marked.parse(text ?? ""));
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
