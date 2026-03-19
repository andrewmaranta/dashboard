# TTS Integration Guide

## Overview

Text-to-Speech (TTS) is now enabled for your OpenClaw setup. This document explains how it works and how to integrate it into your web interface.

## How TTS Works in OpenClaw

### Configuration

TTS is configured in `~/.openclaw/openclaw.json` under `messages.tts`:

```json5
{
  messages: {
    tts: {
      auto: "tagged",           // Only generates audio when [[tts]] is included
      provider: "edge",         // Uses Microsoft Edge TTS (free, no API key)
      edge: {
        enabled: true,
        voice: "en-US-MichelleNeural",
        lang: "en-US",
      },
    },
  },
}
```

### Triggering TTS

To get a voice response, include `[[tts]]` anywhere in your message:

```
What's the weather like today? [[tts]]
```

### What Happens Next

1. OpenClaw processes your message and generates a text response
2. The TTS system converts the response to an audio file (MP3)
3. The response includes both text and a reference to the audio file

## Web Interface Integration

### Receiving TTS Audio

When TTS is triggered, the response from OpenClaw will include audio metadata. The exact format depends on how your web UI connects to OpenClaw, but typically:

**Option 1: Gateway WebSocket/API Response**

The response may include a `MEDIA:` directive or audio URL:

```json
{
  "text": "The weather today is sunny with a high of 72°F.",
  "audio": "/tmp/openclaw-tts/response-12345.mp3",
  "audioAsVoice": true
}
```

**Option 2: Audio File Path**

The TTS tool returns a file path that you need to serve or process:

```
MEDIA: /tmp/openclaw-tts/response-12345.mp3
```

### Playing Audio in the Browser

Basic HTML/JS implementation:

```html
<!-- Audio player element -->
<audio id="tts-player" controls autoplay></audio>

<script>
// When you receive a response with audio
function handleResponse(response) {
  if (response.audio) {
    const player = document.getElementById('tts-player');
    player.src = response.audio;  // Or construct URL to your audio endpoint
    player.play();
  }
}
</script>
```

### Serving Audio Files

Since TTS files are generated on the server (Raspberry Pi), your web UI needs access to them:

**Approach 1: Direct File Access**
- Mount the TTS temp directory in your web server
- Serve files via static endpoint (e.g., `/audio/response-12345.mp3`)

**Approach 2: Proxy Through Your API**
- Your backend reads the TTS file and streams it to the client
- More control over access and caching

**Approach 3: Data URIs**
- Read the audio file and encode as base64 data URI
- Embed directly in the response (works for small files)

## TTS Providers

### Current: Edge TTS (Free)
- **Pros**: No API key, free, decent quality
- **Cons**: Requires internet, rate limits unknown, not as natural as paid options
- **Voice**: `en-US-MichelleNeural` (configurable)

### Upgrade Options

**OpenAI TTS** (requires `OPENAI_API_KEY`):
```json5
{
  messages: {
    tts: {
      provider: "openai",
      openai: {
        model: "gpt-4o-mini-tts",
        voice: "alloy",  // alloy, echo, fable, onyx, nova, shimmer
      },
    },
  },
}
```

**ElevenLabs** (requires `ELEVENLABS_API_KEY`):
```json5
{
  messages: {
    tts: {
      provider: "elevenlabs",
      elevenlabs: {
        voiceId: "MClEFoImJXBTgLwdLI5n", // Ivy
        modelId: "eleven_v3",
      },
    },
  },
}
```

### Enhanced Speech Tags (ElevenLabs only)

When using ElevenLabs, you can insert specific tags into the text to control the voice's emotional delivery and natural rhythm. These are processed by the TTS model but are generally not spoken literally:

- **Emotional States & Tone:** `[excited]`, `[nervous]`, `[frustrated]`, `[sorrowful]`, `[calm]`, `[sarcastic]`, `[curious]`, `[joyful]`, `[angry]`, `[content]`, `[playfully]`, `[deadpan]`, `[whispering]`, `[shouting]`.
- **Non-Verbal Reactions:** `[sigh]`, `[laughs]`, `[laughs harder]`, `[giggles]`, `[hysterical laughing]`, `[gulps]`, `[gasps]`, `[clears throat]`, `[snorts]`, `[mumble]`, `[groan]`, `[whispered breath]`.
- **Pacing & Rhythm:** `[pauses]`, `[hesitates]`, `[stammers]`, `[rushed]`, `[slow]`, `[dramatic pause]`, `[trailing off]`.

**Note:** These tags work best with ElevenLabs v3 and expressive voices like Ivy. They allow the assistant to convey emotion and pacing without needing to describe it in the text.

## Slash Commands

Users can control TTS behavior with commands:

```
/tts always      # Always generate audio for replies
/tts inbound     # Only audio after voice messages
/tts tagged      # Only audio when [[tts]] is included (current)
/tts off         # Disable TTS
/tts status      # Check current settings
/tts audio Hello # Generate one-off audio without changing settings
```

## Model-Driven Voice Control

The AI can control voice settings per-response using directives:

```
[[tts:voiceId=pMsXgVXv3BLzUgSXRplE speed=1.1]]
[[tts:text]](laughs) This is only in the audio![[/tts:text]]
```

This requires `messages.tts.modelOverrides.enabled: true` (default).

## Automatic Background Playback

The Health Dashboard can now automatically play TTS files when they are generated by OpenClaw. This is useful for "kiosk-style" dashboard displays where you want to hear your assistant's voice without manual interaction.

### 1. Enable Broadcast in OpenClaw

When OpenClaw generates a TTS file, it typically saves it in a subdirectory of `/tmp/openclaw/` (e.g., `/tmp/openclaw/tts-XXXXXX/voice-YYYYYY.mp3`). To play it, you must provide the path relative to `/tmp/openclaw/`.

**Example: cURL command to trigger playback**
```bash
# Note: Ensure you include the subdirectory (e.g. tts-GTIWpg/)
curl -X POST http://localhost:3000/api/tts/broadcast \
  -H "Content-Type: application/json" \
  -d '{ "filename": "tts-GTIWpg/voice-1773611680421.mp3", "text": "Hello, Andrew." }'
```

### 2. How it Works

1.  **Static Serving**: The dashboard server (`server.js`) is configured to serve files from `/tmp/openclaw/` via the `/audio/tts/` path.
2.  **Socket.io Bridge**: When the `/api/tts/broadcast` endpoint is hit, the server emits a `ttsPlay` event to all connected dashboard clients.
3.  **Client Listener**: The dashboard React app (`useDashboardData.ts`) listens for `ttsPlay` and immediately attempts to play the audio URL.

### 3. Autoplay Policies

Modern browsers block audio that is not triggered by a user gesture (like a click). To ensure automatic playback works:

-   **Unmute Interaction**: Ensure you have interacted with the dashboard page (clicked anywhere) at least once after loading it.
-   **Browser Settings**: For dedicated dashboard displays, you can go into your browser settings and "Allow Autoplay" for the dashboard's URL.
-   **Kiosk Mode**: If running in Chrome kiosk mode, use the `--autoplay-policy=no-user-gesture-required` flag.

### 4. Integration with OpenClaw Workflows

You can set up a "Voice Hook" in OpenClaw that calls this endpoint every time a TTS message is generated.

**OpenClaw Workflow Integration Idea:**
```yaml
# Hypothetical OpenClaw hook configuration
hooks:
  on_tts_generated:
    - action: run_script
      command: "curl -X POST http://localhost:3000/api/tts/broadcast -d '{\"filename\":\"$RELATIVE_PATH\"}'"
```

## Testing TTS

1. Send a message with `[[tts]]` included
2. Check the response for audio file path or `MEDIA:` reference
3. Verify the audio file exists on the server
4. Play the file manually to confirm it works:
   ```bash
   ffplay -nodisp -autoexit /path/to/audio.mp3
   ```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No audio generated | Check that `[[tts]]` is in the message |
| Audio file not found | Check file permissions and path |
| Poor audio quality | Consider upgrading to OpenAI or ElevenLabs |
| Long responses cut off | Increase `maxTextLength` or enable summarization |
| Delay in audio | Edge TTS requires internet; consider local TTS |

## File Locations

- **Config**: `~/.openclaw/openclaw.json`
- **TTS temp files**: Typically `/tmp/openclaw-tts/` or similar
- **Preferences**: `~/.openclaw/settings/tts.json` (per-user overrides)

## References

- OpenClaw TTS Docs: https://docs.openclaw.ai/tts
- Edge TTS voices: https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/voices/list.json
- OpenAI TTS: https://platform.openai.com/docs/guides/text-to-speech
- ElevenLabs: https://elevenlabs.io/docs/api-reference/text-to-speech
