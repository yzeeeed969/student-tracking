// سور الحفظ بالترتيب المطلوب: من الناس (114) إلى الزلزلة (99)
export const SURAHS: { num: number; name: string }[] = [
  { num: 114, name: "الناس" },
  { num: 113, name: "الفلق" },
  { num: 112, name: "الإخلاص" },
  { num: 111, name: "المسد" },
  { num: 110, name: "النصر" },
  { num: 109, name: "الكافرون" },
  { num: 108, name: "الكوثر" },
  { num: 107, name: "الماعون" },
  { num: 106, name: "قريش" },
  { num: 105, name: "الفيل" },
  { num: 104, name: "الهمزة" },
  { num: 103, name: "العصر" },
  { num: 102, name: "التكاثر" },
  { num: 101, name: "القارعة" },
  { num: 100, name: "العاديات" },
  { num: 99, name: "الزلزلة" },
];

// النقاط → القيمة من 1 لكل سورة
export const LEVELS: { label: string; points: number }[] = [
  { label: "ممتاز", points: 3 }, // = 1
  { label: "جيد جدًا", points: 2 }, // = 0.67
  { label: "جيد", points: 1 }, // = 0.33
];

export function pointsToScore(points: number): number {
  return points / 3;
}
