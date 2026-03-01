const { fetchTranscript } = require("./transcript.js");

/**
 * Extract a YouTube video ID from various URL formats or a bare ID.
 */
function extractVideoId(input) {
  const trimmed = input.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) return trimmed;

  try {
    const url = new URL(trimmed);
    if (url.hostname === "youtu.be") return url.pathname.slice(1).split("/")[0];
    if (url.searchParams.has("v")) return url.searchParams.get("v");
    const embedMatch = url.pathname.match(
      /\/(embed|v|shorts)\/([A-Za-z0-9_-]{11})/
    );
    if (embedMatch) return embedMatch[2];
  } catch {}

  return null;
}

/**
 * Format seconds as HH:MM:SS or MM:SS.
 */
function formatTime(seconds) {
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

module.exports = function (api) {
  const pluginConfig = api.config ?? {};
  const defaultLang = pluginConfig.lang || "en";

  api.registerTool({
    name: "youtube_transcript",
    description:
      "Fetch the transcript (captions/subtitles) of a YouTube video. " +
      "Accepts a YouTube URL or video ID. Returns timestamped text. " +
      "Requires yt-dlp installed on the system. No API key needed. " +
      "Use for summarizing videos, extracting quotes, analyzing video content, " +
      "or pulling transcripts from public meetings.",
    parameters: {
      type: "object",
      properties: {
        video: {
          type: "string",
          description:
            "YouTube video URL or video ID (e.g. 'https://youtube.com/watch?v=dQw4w9WgXcQ' or 'dQw4w9WgXcQ')",
        },
        lang: {
          type: "string",
          description:
            "Preferred language code for the transcript (e.g. 'en', 'es'). Defaults to 'en'.",
        },
        timestamps: {
          type: "boolean",
          description: "Include timestamps in the output. Defaults to true.",
        },
      },
      required: ["video"],
    },
    async execute(_id, params) {
      const videoId = extractVideoId(params.video);
      if (!videoId) {
        return {
          content: [
            {
              type: "text",
              text: `Error: Could not extract a video ID from "${params.video}". Provide a YouTube URL or 11-character video ID.`,
            },
          ],
          isError: true,
        };
      }

      const lang = params.lang || defaultLang;
      const showTimestamps = params.timestamps !== false;

      try {
        const { segments, lang: actualLang } = await fetchTranscript(
          videoId,
          lang
        );

        const lines = segments.map((seg) => {
          if (showTimestamps) {
            return `[${formatTime(seg.start)}] ${seg.text}`;
          }
          return seg.text;
        });

        const header = `Transcript for https://youtube.com/watch?v=${videoId} (${segments.length} segments, lang: ${actualLang})`;
        const transcript = lines.join("\n");

        // Truncate if very long
        const maxChars = 50000;
        const truncated =
          transcript.length > maxChars
            ? transcript.slice(0, maxChars) +
              "\n\n[... transcript truncated at 50k chars]"
            : transcript;

        return {
          content: [{ type: "text", text: `${header}\n\n${truncated}` }],
        };
      } catch (err) {
        const msg = err?.message || String(err);
        return {
          content: [
            {
              type: "text",
              text: `Error fetching transcript for ${videoId}: ${msg}`,
            },
          ],
          isError: true,
        };
      }
    },
  });
};
