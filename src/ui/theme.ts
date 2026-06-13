/**
 * TimeWorks Style Canon — single source of truth for visual consistency.
 *
 * Every page styles elements inline; this file defines the ONE canonical value
 * for each shared element so pages stay cohesive. When adding or editing UI,
 * match these values exactly (import the tokens or copy the literals).
 *
 * Canonical element recipes:
 *
 * Primary button   bg ACCENT, white text, radius 8, padding '8px 16px', 13px/600
 * Secondary button bg #fff, 1px solid #D1D5DB, color #374151, radius 8, padding '8px 14px', 13px/500
 * Status badge     radius 99, padding '3px 10px', 11.5px/600 (count chips are NOT status badges)
 * Card / panel     bg #fff, 1px solid BORDER, radius 10, shadow SHADOW_CARD
 * Table            wrapper card radius 10 + 1px solid BORDER; thead bg #FAFAFA, 11px/700
 *                  uppercase letterSpacing .05em color #9CA3AF; rows divided by BORDER_LIGHT;
 *                  row hover #FAFAFA; cell padding '12px 14px'
 * Input / select   1px solid BORDER, radius 8, padding '8px 10px', 13px
 * Search input     as input + left icon, paddingLeft 32, width 260 on list-page toolbars
 * Toolbar row      search left → filters → primary action right (marginLeft: 'auto')
 * Section title    11px/700 uppercase letterSpacing .05em color #9CA3AF
 * Empty state      centered, 13px, color #9CA3AF
 * Modal            overlay OVERLAY, panel radius 14, shadow SHADOW_MODAL,
 *                  header padding '18px 20px 16px' + 1px solid BORDER bottom
 * Back link        ghost button, ArrowLeft 14px, 13px, #6B7280 → hover #111827, marginBottom 20
 * Avatars          ALWAYS via src/utils/avatar.ts; 2px solid #fff ring when stacked
 * Icons            lucide-react only — no emoji, no one-off inline SVGs
 */

/* ---------- color ---------- */
export const ACCENT = '#6C63FF';        // the ONLY interactive accent (buttons, active states, links)
export const ACCENT_BG = '#EEEDFF';     // tint behind active/selected accent elements
export const ACCENT_DARK = '#5A52E0';   // hover/pressed accent

export const TEXT = '#111827';
export const TEXT_SECONDARY = '#6B7280';
export const TEXT_MUTED = '#9CA3AF';

export const BORDER = '#E8E8E8';        // cards, tables, inputs
export const BORDER_LIGHT = '#F3F4F6';  // row dividers inside tables/lists
export const BORDER_INPUT = '#D1D5DB';  // secondary-button outline

export const PAGE_BG = '#F7F8FA';
export const HOVER_BG = '#FAFAFA';

/* status pairs — bg / text (tailwind *-100 / *-700 depth) */
export const STATUS = {
  success: { bg: '#DCFCE7', text: '#15803D' },   // active, done, approved, paid
  info:    { bg: '#EFF6FF', text: '#1D4ED8' },   // in progress, scheduled
  warning: { bg: '#FEF3C7', text: '#92400E' },   // pending, onboarding, review
  danger:  { bg: '#FEE2E2', text: '#B91C1C' },   // blocked, declined, overdue, urgent
  neutral: { bg: '#F3F4F6', text: '#6B7280' },   // inactive, archived, normal
} as const;

/* ---------- shape ---------- */
export const RADIUS_CARD = 10;
export const RADIUS_MODAL = 14;
export const RADIUS_CONTROL = 8;        // buttons, inputs, selects, view toggles
export const RADIUS_PILL = 99;          // badges, scope toggles, person chips

/* ---------- elevation ---------- */
export const SHADOW_CARD = '0 1px 3px rgba(0,0,0,0.06)';
export const SHADOW_MODAL = '0 24px 64px rgba(0,0,0,0.18)';
export const OVERLAY = 'rgba(17,24,39,0.4)';

/* ---------- layout ---------- */
export const PAGE_PADDING = '24px 32px';
export const SECTION_GAP = 20;          // vertical gap between major page blocks
export const SEARCH_WIDTH = 260;        // toolbar search input width on list pages
