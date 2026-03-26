# GEMINI.md — Health Dashboard Specifics

> Dashboard-specific notes for the Life RPG / Health Dashboard app.

## Location
`health_dashboard/` — Primary dashboard (Port 3000 API / 5173 client)

## ⚠️ SERVER RESTART REQUIRED — Node.js Caching & Frontend Build

**What happened (2026-02-18 & 2026-02-24):** 
1. Server-side: Implemented new APIs but server was running cached old version.
2. Client-side: Made React UI changes, but the user couldn't see them because the `client/dist` directory was not rebuilt, and the Express server was stubbornly holding onto Port 3000 despite `fuser -k` commands.
3. Client-side: Running `rm -rf dist` caused the `http-server` on port 5173 to crash, resulting in a "Not Found" error.

**The Rule for BACKEND changes:**
After ANY server-side code changes in `health_dashboard/`, restart the systemd service (or force-kill the PID listening on port 3000 if not using systemd):
```bash
# Best practice (Systemd):
sudo systemctl restart health-dashboard.service

# Fallback (Manual):
kill -9 $(ss -tlnp | grep 3000 | grep -oP 'pid=\K\d+') || true
sleep 2
cd health_dashboard && nohup node server.js > output.log 2>&1 &
```

**The Rule for FRONTEND changes:**
⚠️ **SUPER ESSENTIAL:** You MUST follow these exact steps sequentially. DO NOT chain them all with `&&` or run the backend restart before `npm run build` completely finishes, otherwise the backend will crash looking for the missing `dist` folder.

After ANY client-side code changes in `health_dashboard/client/src/`, rebuild the production bundle and THEN restart both the static file server (port 5173) and the backend server (port 3000):
```bash
# 1. Clean and rebuild the React app (WAIT FOR THIS TO FINISH COMPLETELY)
cd health_dashboard/client
rm -rf dist
npm run build

# 2. Restart the static http-server (Port 5173)
kill -9 $(ss -tlnp | grep 5173 | grep -oP 'pid=\K\d+') || true
sleep 1
nohup npx http-server dist -p 5173 --host 0.0.0.0 > http-server.log 2>&1 &

# 3. Restart the backend service (Port 3000) - ONLY after the dist folder exists
sudo systemctl restart health-dashboard.service || (kill -9 $(ss -tlnp | grep 3000 | grep -oP 'pid=\K\d+') || true && cd .. && nohup node server.js > output.log 2>&1 &)
```

**Signs of cached code:**
- Backend: New features silently fail (no errors, just wrong behavior), Console logs don't match expected code path.
- Frontend: UI changes (colors, logic, layout) are completely invisible upon page refresh.

---

## ⚠️ REFACTORING SAFETY — Lessons Learned

### NEVER Delete Functions Without Checking Callers

**What happened (2026-02-17):** During a UI refactor, `renderStreaks()` and `renderRadarChart()` functions were deleted from `client.js`, but their callers were left intact. This broke the entire dashboard.

**The Rule:**
1. Before deleting ANY function, search for all references: `grep -n "functionName" file.js`
2. If the function is called anywhere, either keep it or remove ALL callers first
3. Test after refactoring — blank pages = JavaScript errors

**Common gotchas:**
- Functions called in `loadData()` or `init()`
- Functions referenced in HTML `onclick="functionName()"`
- Functions triggered by Socket.io events

---

## Task/Attribute System

**Location:** `health_dashboard/src/routes/tasks.js`, `taskService.js`, `attributeService.js`

**How it works:**
- Tasks can have an optional attribute tag (PWR, DSC, VIT, KNW, WEL, SOC)
- Completing a task awards +20 XP to that attribute
- Attributes level up when XP exceeds xp_max (10% increase each level)

**Database tables:**
- `tasks`: id, text, completed, attribute, created_at
- `attributes`: code, name, score (level), xp, xp_max

**API endpoints:**
- GET `/api/tasks` — list all tasks
- POST `/api/tasks` — create task with `{text, attribute}`
- POST `/api/tasks/toggle` — toggle completion, awards XP
- DELETE `/api/tasks/:id` — delete task

---

## Emoji Rendering — Monochrome Style

**Font:** Noto Emoji (Google Fonts) — `family=Noto+Emoji:wght@300..700`

**CSS Class:**
```css
.noto-emoji {
  font-family: 'Noto Emoji', sans-serif;
  font-weight: 400;
  font-variant-emoji: text;
  -webkit-text-fill-color: currentColor;
  color: currentColor;
}
```

**Helper Function:**
```typescript
const M = (emoji: string) => `${emoji}\uFE0E`;
```

**⚠️ CRITICAL: Use Base Text Variants**

The `\uFE0E` variation selector only works reliably on **base Unicode characters**.

| ❌ Color (broken) | ✅ Monochrome (works) |
|-------------------|-----------------------|
| 🏔️ | ⛰ |
| ⚔️ | ⚔ |
| ▶️ | ▶ |
| ⏸️ | ⏸ |
| ⚙️ | ⚙ |
| ⚖️ | ⚖ |
| 🛡️ | 🛡 |

**Rule:** If an emoji shows color, try the base character without the emoji suffix.

**Fallback:** Add `filter: grayscale(100%)` if needed.

---

## Production Build — Static File Serving

**⚠️ DO NOT use `npm run dev` on Raspberry Pi**

The Vite dev server crashes repeatedly due to memory leaks in HMR.

### Build & Serve

```bash
cd health_dashboard/client

# Build for production
npm run build

# Serve static files (stable, low memory)
npx http-server dist -p 5173 --host 0.0.0.0
```

### URLs After Build
- `http://100.75.38.93:5173` — Tailscale
- `http://192.168.1.206:5173` — Local network
- `http://localhost:5173` — Localhost

### Why Dev Server Fails
- HMR keeps files in memory for fast reloading
- Each edit adds to memory footprint
- After ~20-30 edits, Node.js hits heap limit → SIGKILL
- **Pi has 8GB RAM but Node default heap is ~2GB**

### Static Server Benefits
- ✅ No memory leaks
- ✅ Stays up indefinitely
- ✅ 613KB total vs dev server overhead
- ✅ Same performance, zero crashes

## OpenClaw AI Integration

**Role of Ruby (OpenClaw):**
OpenClaw is the autonomous intelligence layer for this dashboard. While Gemini CLI handles the code and UI development, OpenClaw operates via background processes (cron jobs, scheduled workflows) to analyze the user's data and provide personalized psychological coaching.

**Current Capabilities:**
1. **Enactive Mastery (Savoring Insights):** OpenClaw runs a weekly analysis on `data/life.db`. It queries cross-domain data (`habits`, `tasks`, `focus_sessions`, `beliefs`, `finance`, etc.) to find patterns of success. It formulates these into psychologically motivating insights and inserts them into the `savoring_insights` table. These are then surfaced in the dashboard's "Savor" view to help the user re-weight negative priors.
*See `OPENCLAW_SAVORING_INSTRUCTIONS.md` for the exact AI prompt/schema used.*

**Future Potential & Expandability:**
The architecture of this dashboard is specifically designed for deeper AI intervention. In the future, OpenClaw could:
- **Dynamic Quest Generation:** Analyze gaps in the user's attribute densities and automatically insert new, tailored "Daily Quests" directly into the database.
- **JITAI (Just-In-Time Adaptive Interventions):** Trigger webhooks or notifications based on real-time data (e.g., locking out certain apps or suggesting a Pomodoro break if burnout patterns are detected).
- **Belief Revision Prompts:** Detect when a user logs a failure and automatically push a prompt asking them to re-evaluate their "precision weighting" of that failure.
- **Protocol Optimization:** Analyze `protocols` (If-Then rules) that have low success rates and automatically suggest alternative triggers or actions.

This design shifts the app from being a passive tracker to an active "synthetic prefrontal cortex."

---

## Change Log Workflow

**Purpose:** Efficient handoff between Gemini CLI (coding) and Ruby (review/integration)

**Rolling log:** Keep last 5 entries, delete older ones.

**After completing coding work:**

1. **Prepend new entry to TOP of `changes.md`:**

```markdown
## YYYY-MM-DD HH:MM — Brief description

### Files Modified
- `path/to/file` — What changed

### Key Changes
1. [Function/Component] — Description
   ```javascript
   // Relevant new/updated code
   ```

### Notes
- Important context, breaking changes, TODOs
```

2. **Tell user:** "Changes logged to changes.md for Ruby"

**Why this works:**
- Ruby reads 1-2KB summary instead of 12KB+ full files
- Rolling log shows recent evolution
- Max 5 entries keeps file small (<10KB)

---

Last updated: 2026-02-23
