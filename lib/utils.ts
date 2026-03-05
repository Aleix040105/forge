import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const diffMs = Date.now() - d.getTime();
  const diffHours = diffMs / 3600000;

  if (diffHours < 24) {
    return formatDistanceToNow(d, { addSuffix: false, locale: es })
      .replace('hace ', '')
      .replace('menos de un minuto', 'ahora')
      .replace(' minutos', 'm')
      .replace(' minuto', 'm')
      .replace(' horas', 'h')
      .replace(' hora', 'h');
  }
  if (diffHours < 24 * 7) {
    return format(d, 'EEE', { locale: es });
  }
  return format(d, 'd MMM', { locale: es });
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function getReputationTierLabel(score: number): string {
  if (score >= 81) return 'Forge Verified';
  if (score >= 61) return 'Trusted Founder';
  if (score >= 41) return 'Operator';
  if (score >= 21) return 'Builder';
  return 'Newcomer';
}

export function getReputationColor(tier: string): string {
  switch (tier) {
    case 'Forge Verified':   return 'text-yellow-400';
    case 'Trusted Founder':  return 'text-blue-400';
    case 'Operator':         return 'text-purple-400';
    case 'Builder':          return 'text-green-400';
    default:                 return 'text-muted-foreground';
  }
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen).trimEnd() + '…';
}

export const NEEDS_OPTIONS = [
  'Feedback', 'Inversión', 'Clientes', 'Talento',
  'Co-founder', 'Aprendizaje', 'Red', 'Intro', 'Mentoría', 'Técnico',
] as const;

export const INDUSTRY_OPTIONS = [
  'SaaS B2B', 'SaaS B2C', 'E-commerce', 'Fintech', 'Healthtech',
  'Edtech', 'Proptech', 'Marketplace', 'DeepTech / IA', 'Hardware',
  'Medios / Contenido', 'Agencia / Servicios', 'Otro',
];

export const STAGE_OPTIONS = [
  'Idea', 'Building', 'Beta', 'Live', 'Scaling', 'Exited',
] as const;
