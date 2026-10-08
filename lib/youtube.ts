// استخراج معرّف فيديو يوتيوب من مختلف أشكال الروابط
export function youtubeId(url: string): string | null {
  if (!url) return null;
  const m = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/|youtube\.com\/live\/)([A-Za-z0-9_-]{11})/
  );
  if (m) return m[1];
  const m2 = url.match(/[?&]v=([A-Za-z0-9_-]{11})/);
  if (m2) return m2[1];
  const m3 = url.match(/^([A-Za-z0-9_-]{11})$/);
  if (m3) return m3[1];
  return null;
}
