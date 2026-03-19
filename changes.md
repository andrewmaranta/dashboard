## 2026-03-17 12:50 — Fixed Audio Restarting/Looping Issue

### Files Modified
- `health_dashboard/server.js` — Excluded `tts-cache` from watcher and increased mute window.
- `health_dashboard/client/src/hooks/useDashboardData.ts` — Improved client-side TTS deduplication.

### Key Changes
1. **Critical Fix: Excluded `tts-cache` from Watcher** — The TTS watcher was incorrectly scanning the dashboard's own audio cache. Every time a message was streamed, the server would write to `tts-cache`, and the watcher would detect this as a "new" file 4 seconds later, triggering a second `ttsPlay` event that restarted the audio.
2. **Increased Mute Window** — Extended the `lastAgentMessageTime` mute duration from 10s to 60s. This ensures the watcher remains silent during long ElevenLabs generations.
3. **Improved Client Deduplication** — Updated the `useDashboardData` hook to ignore ANY "Auto-detected" audio event if ANY other audio (auto or real) started in the last 15 seconds.
4. **Broadcast Protection** — Increased the ignore window for text-less broadcasts to 60s.

### Notes
- Rebuilt frontend and restarted backend services to apply changes.
- This should resolve the issue where Ruby's voice plays for ~5 seconds then restarts from the beginning.

---

## 2026-03-16 13:00 — Fixed Audio Stuttering in Chat

### Files Modified
- `health_dashboard/client/src/hooks/useDashboardData.ts` — Implemented client-side TTS deduplication.
- `health_dashboard/server.js` — Updated `/api/tts/broadcast` to prevent watcher re-broadcasting.

### Key Changes
1. **Client Deduplication** — Added `lastRealTTSStartedAt` tracker to the `useDashboardData` hook. It now ignores "Auto-detected new voice file" events if they arrive within 12 seconds of a "real" (chat-triggered) TTS message.
2. **Server Watcher State** — The `/api/tts/broadcast` endpoint now updates `lastPlayedFile` and `lastPlayedTime` to ensure the automatic TTS watcher doesn't re-broadcast the same file it just sent.

### Notes
- This fix addresses the issue where audio plays a short bit, stops, and restarts. It's caused by the backend process (Ruby) saving a file to disk shortly after the dashboard initiates an immediate stream for the same content.

## 2026-03-16 12:45 — Added Zero-Cost Caching for TTS Replays

### Files Modified
- `health_dashboard/server.js` — Updated `/api/tts/stream` with MD5 file caching.

### Key Changes
1. **TTS Caching** — The server now generates an MD5 hash of the text, engine, and voice ID for every TTS request.
2. **Zero-Cost Replays** — Before calling ElevenLabs or OpenAI, the server checks if the audio already exists in `/tmp/openclaw/tts-cache`. If it does, it streams the local file instantly. If not, it streams from the API and saves it to the cache simultaneously.

### Notes
- Clicking to replay messages in the UI will no longer cost API credits, as the exact text hash will instantly serve the locally cached MP3.
