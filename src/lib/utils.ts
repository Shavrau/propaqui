import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function maskCPF(cpf: string): string {
  if (!cpf || cpf.length < 4) return '***';
  const cleaned = cpf.replace(/\D/g, '');
  return `***.***.**${cleaned.slice(-2)}`;
}
