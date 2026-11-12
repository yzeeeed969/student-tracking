import https from "node:https";
import { Readable } from "node:stream";
import { SURAHS, huthaifiAudio } from "@/lib/surahs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID = new Set(SURAHS.map((s) => s.num));

// يجلب تلاوة الشيخ الحذيفي المرجعية من إسلام واي ويمرّرها عبر تشفير التطبيق.
// نتسامح مع شهادة إسلام واي المنتهية (rejectUnauthorized:false): مصدر صوت عام
// معروف، بلا أي بيانات حساسة، والطلب للقراءة فقط.
function upstream(
  surah: number,
  range?: string
): Promise<import("node:http").IncomingMessage> {
  const u = new URL(huthaifiAudio(surah));
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: u.hostname,
        path: u.pathname,
        method: "GET",
        rejectUnauthorized: false,
        headers: {
          Referer: "https://www.islamway.net/",
          "User-Agent": "Mozilla/5.0",
          ...(range ? { Range: range } : {}),
        },
      },
      (res) => resolve(res)
    );
    req.on("error", reject);
    req.setTimeout(15000, () => req.destroy(new Error("timeout")));
    req.end();
  });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const surah = Math.round(Number(url.searchParams.get("surah")));
  if (!VALID.has(surah)) return new Response("bad surah", { status: 400 });

  const range = req.headers.get("range") || undefined;

  let res: import("node:http").IncomingMessage;
  try {
    res = await upstream(surah, range);
  } catch {
    return new Response("audio unavailable", { status: 502 });
  }

  const status = res.statusCode || 502;
  if (status >= 400) {
    res.resume();
    return new Response("audio unavailable", { status: 502 });
  }

  const headers = new Headers();
  headers.set("content-type", res.headers["content-type"] || "audio/mpeg");
  headers.set("accept-ranges", "bytes");
  if (res.headers["content-range"])
    headers.set("content-range", String(res.headers["content-range"]));
  if (res.headers["content-length"])
    headers.set("content-length", String(res.headers["content-length"]));
  headers.set("cache-control", "public, max-age=86400");

  const body = Readable.toWeb(res) as unknown as ReadableStream;
  return new Response(body, { status, headers });
}
