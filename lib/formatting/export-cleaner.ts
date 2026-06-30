/**
 * lib/formatting/export-cleaner.ts
 *
 * Centralised formatting pipeline for the AI Writing Studio.
 * Every copy / PDF / DOCX / print operation must pass content through
 * cleanDocumentForExport so that no Markdown syntax is ever visible
 * to the end user.
 */

/**
 * Strip all Markdown syntax from AI-generated text so it is ready
 * for copy, PDF, DOCX, or print.
 *
 * Preserves:
 *  - Paragraph spacing & blank lines
 *  - Bullet lists (converted to "• ")
 *  - Numbered lists
 *  - Indentation
 *
 * Removes / converts:
 *  - # headings          → plain text
 *  - **bold** / __bold__ → text
 *  - *italic* / _italic_ → text
 *  - ***bold+italic***   → text
 *  - `inline code`       → text
 *  - ```code blocks```   → removed entirely
 *  - [links](url)        → link text only
 *  - ![images](url)      → alt text only
 *  - --- / *** / ___     → removed (horizontal rules)
 *  - > blockquotes       → plain text
 *  - * / - list items    → • bullets
 *  - | tables |          → removed entirely
 *  - |---|--- table sep  → removed entirely
 */
export function cleanDocumentForExport(content: string): string {
  if (!content) return content;

  let text = content;

  // ── 1. Remove fenced code blocks (``` … ```) entirely ──────────────
  text = text.replace(/```[\s\S]*?```/g, "");

  // ── 2. Inline code ─────────────────────────────────────────────────
  text = text.replace(/`([^`]+)`/g, "$1");

  // ── 3. Images → alt text ──────────────────────────────────────────
  text = text.replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1");

  // ── 4. Markdown tables (pipe-delimited rows & separator rows) ──────
  //     Remove entire lines that look like table rows
  text = text.replace(/^[|\s].*\|.*[\|\s]$/gm, "");

  // ── 5. Links → text only ──────────────────────────────────────────
  text = text.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");

  // ── 6. Line-by-line processing ────────────────────────────────────
  const lines = text.split("\n");
  const result: string[] = [];

  for (let line of lines) {
    // 6a. Strip heading markers (# Title → Title)
    line = line.replace(/^#{1,6}\s+/, "");

    // 6b. Strip blockquote markers (> text → text)
    line = line.replace(/^>\s?/, "");

    // 6c. Horizontal rules (lines that are only --- / *** / ___)
    if (/^[-*_]{3,}\s*$/.test(line.trim())) {
      result.push("");
      continue;
    }

    // 6d. Convert list markers (* item / - item → • item)
    line = line.replace(/^(\s*)[*]\s+/, "$1• ");
    line = line.replace(/^(\s*)[-]\s+/, "$1• ");

    // 6e. Remove bold markers (**text** / __text__ → text)
    line = line.replace(/\*\*(.*?)\*\*/g, "$1");
    line = line.replace(/__(.*?)__/g, "$1");

    // 6f. Remove bold+italic markers (***text*** → text)
    line = line.replace(/\*\*\*(.*?)\*\*\*/g, "$1");

    // 6g. Remove italic markers (*text* → text)
    //     Processed after bold so leftover single-* wraps are italic
    line = line.replace(/\*(.*?)\*/g, "$1");

    // 6h. Remove underscore emphasis (_text_ → text) with word-boundary
    //     awareness to avoid mangling underscores within words (e.g. some_var)
    //     Handles: _word_ at word boundaries, after spaces/punctuation, at line edges
    line = line.replace(/\b_(.*?)_\b/g, "$1");
    line = line.replace(/(?<=^|\s)_(\S.*?\S)_(?=\s|$|[.,!?])/g, "$1");

    // 6i. Any remaining straggler backticks
    line = line.replace(/`/g, "");

    result.push(line);
  }

  text = result.join("\n");

  // ── 7. Normalise multiple blank lines (max 2) ─────────────────────
  text = text.replace(/\n{3,}/g, "\n\n");

  return text.trim();
}

/**
 * Detect whether a block of text looks like a heading for DOCX purposes.
 * A heading in cleaned text is a short line that stands alone between
 * blank lines (or at document edges).
 */
export function isHeadingLine(line: string, prevBlank: boolean, nextBlank: boolean): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  // Short line (< ~80 chars) surrounded by blank space → likely a heading
  if (trimmed.length > 80) return false;
  if (trimmed.endsWith(".")) return false; // ends with period → sentence, not heading
  return prevBlank && nextBlank;
}
