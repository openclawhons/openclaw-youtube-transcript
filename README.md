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

# Or via pip
pip install yt-dlp
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

Enable the tool in your agent's tool allowlist:

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

## Examples

- "Get the transcript of this video: https://youtube.com/watch?v=..."
- "Summarize this YouTube video" (paste URL)
- "Pull captions from the latest county commissioners meeting on YouTube"
