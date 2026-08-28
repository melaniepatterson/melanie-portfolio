import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { LOG_ENTRIES } from "../data/log";
import { TYPE_COLORS } from "../data/logTypeColors";
import { PROJECT_TITLES } from "../data/projectTitles";
import { SplitText } from "../utils";
import styles from "./LogEntry.module.css";

function formatDate(iso) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Markdown links in log entries are all external references (MDN, docs,
// etc.) — open in a new tab rather than navigating the SPA away.
const markdownComponents = {
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className={styles.markdownLink}>
      {children}
    </a>
  ),
  pre: ({ children }) => <pre className={styles.codeBlock}>{children}</pre>,
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

  const color = TYPE_COLORS[entry.type];
  const relatedTitle = entry.relatedProject
    ? PROJECT_TITLES.find((p) => p.slug === entry.relatedProject)?.title
    : null;

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
    </div>
  );
}
