import { Link } from "react-router-dom";
import { LOG_ENTRIES } from "../data/log";
import { TYPE_COLORS } from "../data/logTypeColors";
import styles from "./Log.module.css";

function formatDate(iso) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function Log() {
  // Not assumed to already be in order in the data file — sorting here
  // means entries can be added to log.js in whatever order is easiest
  // (usually just appended) without breaking the reverse-chronological
  // display. published: false (see log.js) hides drafts here — !== false
  // rather than === true so a new entry defaults to visible unless
  // explicitly marked otherwise.
  const entries = LOG_ENTRIES
    .filter((entry) => entry.published !== false)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className={styles.page}>
      <div className={styles.intro}>
        <h1 className={styles.title}>Log</h1>
        <p className={styles.subtitle}>
          Small builds, debugging notes, and short opinions — rougher and faster than the case studies in{" "}
          <Link to="/portfolio" className={styles.inlineLink}>Work</Link>.
        </p>
      </div>

      <ul className={styles.list}>
        {entries.map((entry) => {
          const color = TYPE_COLORS[entry.type];
          return (
            <li key={entry.slug} className={styles.row}>
              <Link to={`/log/${entry.slug}`} className={styles.rowLink}>
                <div className={styles.rowMeta}>
                  <time dateTime={entry.date} className={styles.date}>{formatDate(entry.date)}</time>
                  <span
                    className={styles.typeTag}
                    style={{ backgroundColor: color.bg, color: color.text }}
                  >
                    {entry.type}
                  </span>
                </div>
                <h2 className={styles.rowTitle}>{entry.title}</h2>
                <p className={styles.excerpt}>{entry.excerpt}</p>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
