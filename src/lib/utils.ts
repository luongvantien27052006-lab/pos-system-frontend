import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Gộp class Tailwind, tự xử lý xung đột (vd: p-2 + p-4 -> p-4). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}