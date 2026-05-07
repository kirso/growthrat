function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function safeHref(value: string) {
  if (value.startsWith("/") || value.startsWith("https://") || value.startsWith("http://")) {
    return value;
  }
  return "#";
}

function inlineMarkdown(value: string) {
  let output = escapeHtml(value);
  output = output.replace(/`([^`]+)`/g, "<code>$1</code>");
  output = output.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_match, label: string, href: string) =>
      `<a href="${escapeHtml(safeHref(href))}">${label}</a>`,
  );
  output = output.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  output = output.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  return output;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function isTableSeparator(line: string) {
  return /^\s*\|?[\s:-]+\|[\s|:-]+\|?\s*$/.test(line);
}

function renderTable(lines: string[]) {
  const rows = lines
    .filter((line) => !isTableSeparator(line))
    .map((line) =>
      line
        .trim()
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((cell) => cell.trim()),
    );
  const [head, ...body] = rows;
  if (!head) return "";

  return [
    '<div class="table-wrap"><table>',
    "<thead><tr>",
    ...head.map((cell) => `<th>${inlineMarkdown(cell)}</th>`),
    "</tr></thead>",
    "<tbody>",
    ...body.map(
      (row) =>
        `<tr>${row.map((cell) => `<td>${inlineMarkdown(cell)}</td>`).join("")}</tr>`,
    ),
    "</tbody></table></div>",
  ].join("");
}

export function markdownToHtml(markdown: string) {
  const lines = markdown.replaceAll("\r\n", "\n").split("\n");
  const blocks: string[] = [];
  let paragraph: string[] = [];
  let unorderedList: string[] = [];
  let orderedList: string[] = [];
  let table: string[] = [];
  let codeBlock: { language: string; lines: string[] } | null = null;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push(`<p>${inlineMarkdown(paragraph.join(" "))}</p>`);
    paragraph = [];
  };
  const flushUnorderedList = () => {
    if (!unorderedList.length) return;
    blocks.push(
      `<ul>${unorderedList.map((item) => `<li>${inlineMarkdown(item)}</li>`).join("")}</ul>`,
    );
    unorderedList = [];
  };
  const flushOrderedList = () => {
    if (!orderedList.length) return;
    blocks.push(
      `<ol>${orderedList.map((item) => `<li>${inlineMarkdown(item)}</li>`).join("")}</ol>`,
    );
    orderedList = [];
  };
  const flushLists = () => {
    flushUnorderedList();
    flushOrderedList();
  };
  const flushTable = () => {
    if (!table.length) return;
    blocks.push(renderTable(table));
    table = [];
  };
  const flushCodeBlock = () => {
    if (!codeBlock) return;
    const language = slugify(codeBlock.language);
    const className = language ? ` class="language-${language}"` : "";
    blocks.push(
      `<pre><code${className}>${escapeHtml(codeBlock.lines.join("\n"))}</code></pre>`,
    );
    codeBlock = null;
  };
  const flushAll = () => {
    flushParagraph();
    flushLists();
    flushTable();
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (codeBlock) {
      if (/^```/.test(trimmed)) {
        flushCodeBlock();
      } else {
        codeBlock.lines.push(line);
      }
      continue;
    }

    const fence = /^```([a-zA-Z0-9_-]+)?\s*$/.exec(trimmed);
    if (fence) {
      flushAll();
      codeBlock = { language: fence[1] ?? "", lines: [] };
      continue;
    }

    if (!trimmed) {
      flushAll();
      continue;
    }

    if (trimmed.includes("|") && (trimmed.startsWith("|") || table.length > 0)) {
      flushParagraph();
      flushLists();
      table.push(trimmed);
      continue;
    }

    flushTable();

    if (trimmed === "---") {
      flushAll();
      blocks.push("<hr />");
      continue;
    }

    const heading = /^(#{1,4})\s+(.+)$/.exec(trimmed);
    if (heading) {
      flushParagraph();
      flushLists();
      const level = Math.min(4, heading[1].length);
      const label = heading[2];
      blocks.push(
        `<h${level} id="${slugify(label)}">${inlineMarkdown(label)}</h${level}>`,
      );
      continue;
    }

    const bullet = /^[-*]\s+(.+)$/.exec(trimmed);
    if (bullet) {
      flushParagraph();
      flushOrderedList();
      unorderedList.push(bullet[1]);
      continue;
    }

    const ordered = /^\d+\.\s+(.+)$/.exec(trimmed);
    if (ordered) {
      flushParagraph();
      flushUnorderedList();
      orderedList.push(ordered[1]);
      continue;
    }

    flushLists();
    paragraph.push(trimmed);
  }

  flushAll();
  flushCodeBlock();
  return blocks.join("\n");
}
