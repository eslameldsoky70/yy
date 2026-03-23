import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function toArabicDigits(num: number | string): string {
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return num.toString().replace(/[0-9]/g, (w) => arabicDigits[+w]);
}

export function getRevelationTypeArabic(type: string): string {
  if (type.toLowerCase() === 'meccan') return 'مكية';
  if (type.toLowerCase() === 'medinan') return 'مدنية';
  return type;
}
