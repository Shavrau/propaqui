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

export function maskIPTU(iptu: string): string {
  if (!iptu || iptu.length < 4) return '***';
  const cleaned = iptu.replace(/\D/g, '');
  // Mostra apenas os últimos 4 dígitos
  const maskedPart = '*'.repeat(Math.max(0, cleaned.length - 4));
  return `${maskedPart}${cleaned.slice(-4)}`;
}
