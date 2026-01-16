import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function sortStudentsByRollNo<T extends { rollNo?: string }>(students: T[]): T[] {
  return [...students].sort((a, b) => {
    const rollA = a.rollNo || "";
    const rollB = b.rollNo || "";
    const partsA = rollA.split("-");
    const partsB = rollB.split("-");
    const numA = parseInt(partsA[partsA.length - 1], 10);
    const numB = parseInt(partsB[partsB.length - 1], 10);

    if (!isNaN(numA) && !isNaN(numB) && numA !== numB) {
      return numA - numB;
    }

    return rollA.localeCompare(rollB);
  });
}

export function normalizeMonthInput(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ""
  if (/^\d{4}-\d{2}$/.test(trimmed)) return trimmed

  let match = trimmed.match(/^(\d{4})[-/](\d{1,2})$/)
  if (match) {
    const year = match[1]
    const month = match[2].padStart(2, "0")
    return `${year}-${month}`
  }

  match = trimmed.match(/^(\d{1,2})[-/](\d{4})$/)
  if (match) {
    const month = match[1].padStart(2, "0")
    const year = match[2]
    return `${year}-${month}`
  }

  const date = new Date(trimmed)
  if (!isNaN(date.getTime())) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    return `${year}-${month}`
  }

  return trimmed
}
