/**
 * Fetch YouTube transcript using yt-dlp.
 * Requires yt-dlp to be installed and accessible on PATH.
 */

const { execFile } = require("child_process");
const { readFile, unlink } = require("fs/promises");
const { tmpdir } = require("os");
const { join } = require("path");
const crypto = require("crypto");

/**
 * Parse timed text XML (srv1 format) into segments.
 */
function parseTimedText(xml) {
  const segments = [];
  const re = /<text\s+start="([^"]+)"\s+dur="([^"]+)"[^>]*>([\s\S]*?)<\/text>/g;
  let match;
  while ((match = re.exec(xml)) !== null) {
    const start = parseFloat(match[1]);
    const dur = parseFloat(match[2]);
    const text = match[3]
      .replace(/<[^>]+>/g, "")
      .replace(/&#39;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
      .replace(/\n/g, " ")
      .trim();
    if (text) {
      segments.push({ start, dur, text });
    }
  }
  return segments;
}

function runYtDlp(args, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    // Try common locations for yt-dlp
    const candidates = ["yt-dlp", `${process.env.HOME}/bin/yt-dlp`, "/usr/local/bin/yt-dlp"];
    
    function tryNext(i) {
      if (i >= candidates.length) {
        return reject(new Error("yt-dlp not found. Install it: https://github.com/yt-dlp/yt-dlp#installation"));
      }
      const proc = execFile(candidates[i], args, { timeout: timeoutMs, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
        if (err) {
          if (err.code === "ENOENT") return tryNext(i + 1);
          return reject(new Error(stderr || err.message));
        }
        resolve({ stdout, stderr });
      });
    }
    tryNext(0);
  });
}

/**
 * Fetch transcript for a YouTube video ID.
 * @param {string} videoId - 11-character YouTube video ID
 * @param {string} [lang='en'] - Preferred language code
 * @returns {Promise<{segments: Array<{start: number, dur: number, text: string}>, lang: string}>}
 */
async function fetchTranscript(videoId, lang = "en") {
  const tmpBase = join(tmpdir(), `yt-transcript-${crypto.randomBytes(6).toString("hex")}`);
  const url = `https://www.youtube.com/watch?v=${videoId}`;

  try {
    // First try manual subs, then auto subs
    await runYtDlp([
      "--write-sub",
      "--write-auto-sub",
      "--sub-lang", lang,
      "--sub-format", "srv1",
      "--skip-download",
      "-o", tmpBase,
      url,
    ]);

    // yt-dlp writes to <tmpBase>.<lang>.srv1
    const subFile = `${tmpBase}.${lang}.srv1`;
    let xml;
    try {
      xml = await readFile(subFile, "utf-8");
    } catch {
      // Try to find any subtitle file that was written
      const { stdout } = await runYtDlp([
        "--list-subs",
        "--skip-download",
        url,
      ]);
      throw new Error(
        `No ${lang} subtitles found. Available subtitles:\n${stdout.slice(-500)}`
      );
    }

    const segments = parseTimedText(xml);
    // Cleanup
    try { await unlink(subFile); } catch {}

    if (segments.length === 0) {
      throw new Error("Transcript file was empty or unparseable.");
    }

    return { segments, lang };
  } catch (err) {
    // Cleanup on error
    try { await unlink(`${tmpBase}.${lang}.srv1`); } catch {}
    throw err;
  }
}

module.exports = { fetchTranscript, parseTimedText };
