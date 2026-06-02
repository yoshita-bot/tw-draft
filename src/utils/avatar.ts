export const PASTEL_COLORS = [
  { bg: '#DBEAFE', color: '#1E40AF' },
  { bg: '#DCF5E9', color: '#065F46' },
  { bg: '#EDE9FE', color: '#5B21B6' },
  { bg: '#FEF3C7', color: '#92400E' },
  { bg: '#FCE7F3', color: '#9D174D' },
  { bg: '#E0F2FE', color: '#075985' },
]

export function avatarStyle(name: string) {
  const idx = name.charCodeAt(0) % PASTEL_COLORS.length
  return PASTEL_COLORS[idx]
}

export function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}
