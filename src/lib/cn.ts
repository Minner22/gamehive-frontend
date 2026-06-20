import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Łączy klasy Tailwinda z deduplikacją konfliktów (clsx + tailwind-merge). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
