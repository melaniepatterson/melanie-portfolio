import { useEffect, useRef, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { LOG_ENTRIES } from "../data/log";
import { TYPE_COLORS } from "../data/logTypeColors";
import { PROJECT_TITLES } from "../data/projectTitles";
import { SplitText } from "../utils";
import styles from "./LogEntry.module.css";

// Built ahead of having enough entries for it to feel like a real,
// non-thin feature (see PREV_NEXT_ENABLED below) rather than left
// unwritten — flip that flag once there's more than a couple of posts.
const PREV_NEXT_ENABLED = false;

function formatDate(iso) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Same algorithm GitHub uses for its own generated heading ids —
// lowercase, spaces to hyphens, strip anything that isn't a word
// character/hyphen/space first. Doesn't dedupe repeated headings within
// one entry (GitHub's doesn't either, in its simplest form) — not worth
// the bookkeeping for how short these posts are.
function slugifyHeading(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

function headingText(children) {
  return Array.from(
    Array.isArray(children) ? children : [children],
    (child) => (typeof child === "string" ? child : "")
  ).join("");
}

// A permalink icon next to each h2/h3 in an entry's body — hover to
// reveal, click to jump/copy a link straight to that point in a longer
// post. Deliberately NOT a separate "on this page" table-of-contents
// nav (the kind Work.jsx's filters occupy on desktop): these entries
// are short, informal notebook posts, not long structured docs, so a
// whole extra nav element — with its own desktop/mobile placement to
// design — would be more chrome than the content justifies. This is
// the minimal version of the same idea: link TO a point in the page,
// without also building a visible list OF those points.
function makeHeading(level) {
  const Tag = `h${level}`;
  return function Heading({ children }) {
    const id = slugifyHeading(headingText(children));
    return (
      <Tag id={id} className={styles.heading}>
        <a href={`#${id}`} className={styles.anchorLink} aria-label="Link to this section">#</a>
        {children}
      </Tag>
    );
  };
}

function CodeBlock({ children }) {
  const preRef = useRef(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = preRef.current?.textContent ?? "";
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access can fail (permissions, insecure context) —
      // nothing useful to do beyond leaving the button unchanged.
    }
  };

  return (
    <div className={styles.codeBlockWrapper}>
      <button
        type="button"
        className={styles.copyButton}
        onClick={handleCopy}
        aria-label={copied ? "Copied" : "Copy code"}
      >
        {copied ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        )}
      </button>
      <pre ref={preRef} className={styles.codeBlock}>{children}</pre>
    </div>
  );
}

// Markdown links in log entries are all external references (MDN, docs,
// etc.) — open in a new tab rather than navigating the SPA away.
const markdownComponents = {
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className={styles.markdownLink}>
      {children}
    </a>
  ),
  pre: CodeBlock,
  h2: makeHeading(2),
  h3: makeHeading(3),
};

export default function LogEntry() {
  const { slug } = useParams();
  const entry = LOG_ENTRIES.find((e) => e.slug === slug);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!entry) {
    return (
      <div className={styles.page}>
        <p>Entry not found.</p>
        <Link to="/log"><SplitText>← Back to Log</SplitText></Link>
      </div>
    );
  }

  // Not public yet (see log.js's published field) — bounce straight
  // back to the list instead of rendering placeholder content, same
  // gating WorkDetail.jsx uses for a project's own comingSoon flag.
  if (entry.published === false) return <Navigate to="/log" replace />;

  const color = TYPE_COLORS[entry.type];
  const relatedTitle = entry.relatedProject
    ? PROJECT_TITLES.find((p) => p.slug === entry.relatedProject)?.title
    : null;

  // Same reverse-chronological order Log.jsx's list shows, so "next"
  // always means "newer" — computed even while PREV_NEXT_ENABLED is
  // false so the only thing flipping that flag on later has to change.
  const sortedEntries = LOG_ENTRIES
    .filter((e) => e.published !== false)
    .sort((a, b) => b.date.localeCompare(a.date));
  const currentIndex = sortedEntries.findIndex((e) => e.slug === entry.slug);
  const newerEntry = currentIndex > 0 ? sortedEntries[currentIndex - 1] : null;
  const olderEntry = currentIndex < sortedEntries.length - 1 ? sortedEntries[currentIndex + 1] : null;

  return (
    <div className={styles.page}>
      <Link to="/log" className={styles.back}><SplitText>← Log</SplitText></Link>

      <div className={styles.meta}>
        <time dateTime={entry.date} className={styles.date}>{formatDate(entry.date)}</time>
        <span
          className={styles.typeTag}
          style={{ backgroundColor: color.bg, color: color.text }}
        >
          {entry.type}
        </span>
      </div>

      <h1 className={styles.title}>{entry.title}</h1>

      {entry.tags?.length > 0 && (
        <p className={styles.tags}>{entry.tags.join(" · ")}</p>
      )}

      <div className={styles.body}>
        <ReactMarkdown components={markdownComponents}>{entry.content}</ReactMarkdown>
      </div>

      {relatedTitle && (
        <Link to={`/portfolio/${entry.relatedProject}`} className={styles.relatedLink}>
          <SplitText>{`Related project: ${relatedTitle} →`}</SplitText>
        </Link>
      )}

      <p className={styles.feedback}>
        Spot an error?{" "}
        <a href={`mailto:hello@melanie.studio?subject=${encodeURIComponent(`Log: ${entry.title}`)}`}>
          Let me know
        </a>.
      </p>

      {PREV_NEXT_ENABLED && (olderEntry || newerEntry) && (
        <div className={styles.prevNext}>
          {olderEntry && (
            <Link to={`/log/${olderEntry.slug}`} className={styles.prevNextLink}>
              <span className={styles.prevNextLabel}>← Older</span>
              <span className={styles.prevNextTitle}>{olderEntry.title}</span>
            </Link>
          )}
          {newerEntry && (
            <Link to={`/log/${newerEntry.slug}`} className={`${styles.prevNextLink} ${styles.prevNextLinkRight}`}>
              <span className={styles.prevNextLabel}>Newer →</span>
              <span className={styles.prevNextTitle}>{newerEntry.title}</span>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
