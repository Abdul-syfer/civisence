import potholeImg from "@/assets/issues/pothole.jpg";
import garbageImg from "@/assets/issues/garbage.jpg";
import streetlightImg from "@/assets/issues/streetlight.jpg";
import waterLeakImg from "@/assets/issues/water-leak.jpg";
import drainageImg from "@/assets/issues/drainage.jpg";
import electricImg from "@/assets/issues/electric.jpg";

const categoryImageMap: Record<string, string> = {
  "Pothole": potholeImg,
  "Road Blockage": potholeImg,
  "Garbage Overflow": garbageImg,
  "Streetlight Damage": streetlightImg,
  "Water Leakage": waterLeakImg,
  "Drainage Overflow": drainageImg,
  "Electric Cable Issue": electricImg,
  "Ambulance Blockage": potholeImg,
};

export const getIssueImage = (category: string): string => {
  return categoryImageMap[category] || potholeImg;
};
