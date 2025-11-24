export function normalizeVi(input: string): string {
  if (!input) return '';
  return input
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

export function includesSearch(haystack: string, needle: string): boolean {
  return normalizeVi(haystack).includes(normalizeVi(needle));
}




