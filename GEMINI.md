# Workspace Context — OpenClaw Safety Rules

> **READ THIS FIRST** before making any changes.

## What This Workspace Is

This is an **OpenClaw** workspace — a personal AI assistant platform running on a Raspberry Pi.
- **Host:** Raspberry Pi (ARM64, limited RAM)
- **Location:** `/home/maranta/.openclaw/workspace/`
- **User:** Andrew (owner)
- **AI Assistant:** Ruby (runs via OpenClaw, not Gemini CLI)

## ⚠️ CRITICAL: Do NOT Modify

These are managed by OpenClaw. Modifying them will break the platform:

```
~/.openclaw/           # OpenClaw installation (NEVER touch)
~/.openclaw/config/    # Gateway config files
~/.openclaw/sessions/  # Active session state
~/.openclaw/logs/      # System logs

memory/                # Memory files (unless explicitly asked)
MEMORY.md              # Long-term memory
AGENTS.md              # Agent behavior rules
SOUL.md                # Assistant personality
USER.md                # User profile
TOOLS.md               # Tool configuration
BOOTSTRAP.md           # If exists, do not delete
```

## ⚠️ CRITICAL: Do NOT Delete

These contain irreplaceable data:

```
memory/*.md             # Daily logs
nutrition/              # Weight log, nutrition data
life-rpg/               # Life RPG app data
**/session_history.csv  # App session logs
**/*.log                # Check before deleting
**/.git/                # Git repositories
```

## Safe to Work In

These areas are for active development:

```
pomodoro_pro/           # Pomodoro timer app
*/                      # Other project directories
temp/                   # Temporary files (create if needed)
research/               # Research notes
review/                 # Code reviews
```

## Safety Rules

1. **Never run `rm -rf`** without explicit confirmation
2. **Never delete `.git/` directories** — these are version control
3. **Never modify files outside the project you're working on**
4. **Check `git status`** before making changes — if it's tracked, be extra careful
5. **Ask before deleting** anything in `memory/`, `nutrition/`, or `life-rpg/`

## Platform Constraints

- **Limited RAM:** ~4GB available — avoid memory-heavy operations
- **ARM64:** Some binaries won't work without emulation
- **SD Card Storage:** I/O is slower than SSD — don't churn logs excessively

## Coding Preferences

- Prefer simple, working solutions over clever ones
- Keep comments minimal but meaningful
- Always run `git status` before major changes
- Commit early, commit often

## If Unsure

**STOP and ask.** Better to confirm than accidentally delete personal data or break the OpenClaw installation.

---

## ⚠️ REFACTORING SAFETY — Lessons Learned

### NEVER Delete Functions Without Checking Callers

**What happened (2026-02-17):** During a UI refactor, `renderStreaks()` and `renderRadarChart()` functions were deleted from `client.js`, but their callers were left intact. This broke the entire dashboard — JavaScript errors stopped all rendering.

**The Rule:**
1. Before deleting ANY function, search for all references: `grep -n "functionName" file.js`
2. If the function is called anywhere, either:
   - Keep the function, OR
   - Remove ALL callers first
3. Test the app after refstructing — blank pages = JavaScript errors

**Common gotchas:**
- Functions called in `loadData()` or `init()` 
- Functions referenced in HTML `onclick="functionName()"`
- Functions triggered by Socket.io events
- Chart/render helper functions

**Test after refactoring:** Open browser dev tools (F12) → Console tab. Red errors = broken.

---

To verify this context loaded, type `/memory show` in the CLI.

## ⚠️ SERVER RESTART REQUIRED — Node.js Caching

**What happened (2026-02-18):** Implemented task/tag system for attributes. Code was correct, but server was running cached old version. Tasks saved with `attribute: null` despite correct API calls.

**The Rule:**
After ANY server-side code changes in `health_dashboard/`:
```bash
# Kill and restart
fuser -k 3000/tcp
sleep 2
cd health_dashboard && nohup node server.js > output.log 2>&1 &
```

**Signs of cached code:**
- New features silently fail (no errors, just wrong behavior)
- Console logs don't match expected code path
- Database shows `null` for new columns

---

## Task/Attribute System (New)

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

The `\uFE0E` variation selector only works reliably on **base Unicode characters** (without the emoji presentation). Many emojis don't have monochrome variants.

| ❌ Color (broken) | ✅ Monochrome (works) |
|-------------------|-----------------------|
| 🏔️ | ⛰ |
| ⚔️ | ⚔ |
| ▶️ | ▶ |
| ⏸️ | ⏸ |
| ⚙️ | ⚙ |
| ⚖️ | ⚖ |
| 🛡️ | 🛡 |

**Rule:** If an emoji shows color, try the base character without the emoji suffix (remove the `️` U+FE0F).

**Fallback:** Add `filter: grayscale(100%)` if needed:
```css
.noto-emoji {
  filter: grayscale(100%);
}
```

---

## Production Build — Static File Serving

**⚠️ DO NOT use `npm run dev` on Raspberry Pi**

The Vite dev server crashes repeatedly due to memory leaks in HMR (Hot Module Replacement). Use production build instead.

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

---

Last updated: 2026-02-18
