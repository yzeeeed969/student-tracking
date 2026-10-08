"use client";
import { useState } from "react";

export default function YoutubeEmbed({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  const [play, setPlay] = useState(false);

  if (play) {
    return (
      <div className="aspect-video w-full">
        <iframe
          className="w-full h-full rounded-lg"
          src={`https://www.youtube.com/embed/${id}?autoplay=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlay(true)}
      className="relative block w-full aspect-video rounded-lg overflow-hidden group bg-black/20"
    >
      {/* صورة مصغّرة من يوتيوب */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://img.youtube.com/vi/${id}/hqdefault.jpg`}
        alt={title}
        className="w-full h-full object-cover"
      />
      <span className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition">
        <span className="text-white text-4xl">▶</span>
      </span>
    </button>
  );
}
