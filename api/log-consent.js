// Vercel Serverless Function — auto-detected from this file's location
// under /api at the project root (see .vercel/project.json). Replaces
// the old Supabase consent_logs insert: no database, just a structured
// line in this project's Vercel Runtime Logs. That's a shorter-lived
// record than a real table (Vercel's logs are a rolling recent window,
// not permanent storage), but it's enough to show a choice was made
// without paying for a database this site only used for one insert.
export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { choice, visitorId, pagePath } = req.body || {};
  if (choice !== 'granted' && choice !== 'denied') {
    res.status(400).json({ error: 'Invalid choice' });
    return;
  }

  console.log(JSON.stringify({
    event: 'consent_choice',
    choice,
    visitorId: typeof visitorId === 'string' ? visitorId.slice(0, 100) : null,
    pagePath: typeof pagePath === 'string' ? pagePath.slice(0, 200) : null,
    timestamp: new Date().toISOString(),
  }));

  res.status(204).end();
}
