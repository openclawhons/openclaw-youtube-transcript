# openclaw-youtube-transcript

OpenClaw plugin that fetches YouTube video transcripts (captions/subtitles) using yt-dlp. No API key required.

## Prerequisites

[yt-dlp](https://github.com/yt-dlp/yt-dlp) must be installed and on PATH:

```bash
# macOS
brew install yt-dlp

# Linux
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
chmod +x /usr/local/bin/yt-dlp
```

## Install

```bash
openclaw plugins install openclaw-youtube-transcript
```

## Configure

Add to your OpenClaw config under `plugins.entries`:

```json
{
  "youtube-transcript": {
    "lang": "en"
  }
}
```

### Cookie Authentication (recommended)

YouTube blocks requests from datacenter/VPS IPs. If you're running OpenClaw on a server, you'll need cookies from a browser where you're logged into YouTube.

**Option A: Auto-extract from browser** (easiest — requires browser on same machine)

```json
{
  "youtube-transcript": {
    "lang": "en",
    "cookiesFrom": "chrome"
  }
}
```

Supported browsers: `chrome`, `firefox`, `brave`, `edge`, `safari`, `opera`, `chromium`

**Option B: Cookies file** (for headless servers / VPS / Docker)

1. Install a browser extension like [Get cookies.txt LOCALLY](https://chromewebstore.google.com/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc)
2. Go to youtube.com while logged in
3. Export cookies as `cookies.txt` (Netscape format)
4. Copy the file to your OpenClaw machine
5. Configure the path:

```json
{
  "youtube-transcript": {
    "lang": "en",
    "cookiesFile": "/home/user/.openclaw/youtube-cookies.txt"
  }
}
```

**When do you need cookies?**
- Running on a VPS/cloud server → **yes, almost always**
- Running on your home machine → **probably not** (residential IPs usually work fine)
- Getting "Sign in to confirm you're not a bot" errors → **yes**

### Enable the tool

Add to your agent's tool allowlist:

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": {
          "allow": ["youtube-transcript"]
        }
      }
    ]
  }
}
```

## Tool: `youtube_transcript`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| video | string | yes | YouTube URL or video ID |
| lang | string | no | Language code (default: `en`) |
| timestamps | boolean | no | Include timestamps (default: `true`) |

Accepts all URL formats: `youtube.com/watch?v=`, `youtu.be/`, `youtube.com/shorts/`, `youtube.com/embed/`, or bare video IDs.

## Troubleshooting

**"Sign in to confirm you're not a bot"** → Add cookie auth (see above)

**"yt-dlp not found"** → Install yt-dlp and make sure it's on PATH

**"No subtitles found"** → The video doesn't have captions (auto-generated or manual). Most English-language videos with speech have auto-generated captions.
