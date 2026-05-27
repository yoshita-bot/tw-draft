# Figma Page-to-Library Conversion — Insights / Work tracking - Year View

**Date:** 2026-04-30  
**Source file:** TimeWorks Dashboard (Manager)  
**Source page:** Admin/Manager View - UI  
**Source frame:** Insights / Work tracking - Year View (3448:16140)  
**Granularity:** Frame-level conversion  
**Status:** ⛔ **HALTED AT STEP 3** — Missing tokens  

---

## Summary

Conversion attempted for the "Insights / Work tracking - Year View" frame (1920×2494px, 389-node tree depth 8). The frame contains complex nested auto-layouts with tables, cards, and controls. Full inventory of all 389 nodes (FRAMEs, GROUPs, INSTANCEs) was completed.

**Token reconciliation found 19 unmapped design values:**
- **8 fill colors** not in the DS library
- **11 spacing values** (px gaps) not in the DS spacing scale
- **8 corner radius values** not in the DS radius scale

Per the skill's **HARD GATE at Step 3**, conversion halted. The original frame remains untouched. A Figma annotation has been added flagging the unmapped tokens.

---

## Unmapped Values Requiring Token Addition

### Unmapped Colors (8)

| Color | Usage count | Hex | Likely semantic role | Recommended token |
|-------|-------------|-----|----------------------|------------------|
| Dark text | 27× | `#1F1E31` | Primary text, labels | `--color-text-primary` or `--color-text-foreground` |
| Bright blue | 8× | `#0863C9` | CTA buttons, interactive states | `--color-action-primary` (or variant of primary) |
| Light grayish-blue | 12× | `#CED9ED` | Card backgrounds, mild contrast | `--color-background-secondary` |
| Teal accent | 3× | `#31ADAC` | Success state, accents | `--color-status-success` or `--color-accent-teal` |
| Light teal bg | 3× | `#DFF4F4` | Success background | `--color-background-success` |
| Off-white | 1× | `#EEF1F6` | Very light background | `--color-background-elevated` |
| Red accent | 2× | `#D62839`, `#FF606F` | Destructive/alert states | `--color-status-error` or `--color-status-alert` |

### Unmapped Spacing (11)

| Value | Usage count | Likely context | Recommended action |
|-------|-------------|-----------------|------------------|
| **2px** | 24× | Dividers, subtle borders, hairline spacing | Add `--space-2` or round to `--space-4` |
| 14px | 2× | Micro gap between elements | Round to `--space-12` or `--space-16` |
| 23px | 1× | Irregular gap | Round to `--space-24` |
| 28px | 1× | Irregular gap | Round to `--space-24` or `--space-32` |
| 30px | 3× | Inter-section spacing | Round to `--space-32` |
| 35px | 4× | Irregular gap | Round to `--space-32` or `--space-40` |
| 187px, 226px, 229px, 265px, 756px | 38× combined | Layout constraints, column/section widths | **Not spacing tokens** — these are bounds-driven, not margin/gap |

**Spacing note:** Most irregular gaps (187–756px) represent computed layout dimensions, not authored spacing tokens. They may be byproducts of fixed container widths or aspect-ratio locks. Before adding these as tokens, check if they're layout artifacts or genuinely repeated spacing values.

### Unmapped Corner Radii (8)

| Value | Usage count | Likely context | Recommended action |
|-------|-------------|-----------------|------------------|
| **5px** | 48× | Small button corners, input focus rings, chip radii | Add `--radius-5` or round to `--radius-4` or `--radius-8` |
| 3px | 2× | Micro corner | Round to `--radius-4` |
| 7px | 2× | Irregular micro corner | Round to `--radius-8` |
| 10px, 20px, 28px, 36px, 99px | 11× combined | Various | Review in context; likely rounding artifacts |

**Radii note:** The 5px radius appears 48 times and is the single most-used unmapped value. Adding it as a dedicated `--radius-5` token is recommended if it's intentional; otherwise round to the nearest DS scale value (4 or 8).

---

## What Halted the Conversion

The **figma-page-to-library skill Step 3 (Reconcile tokens)** is a **HARD GATE**:

> "For every raw fill / stroke / radius / spacing / typography / shadow value found in step 2, look up its match in the DS library's variables. If **any** value has no matching DS variable → halt the run."

This is intentional: converting a page to use non-existent tokens would break architecture rule #1 ("Components never use raw values") and would fail dark/black theme previews. The gate forces tokens to be added first, ensuring the rebuild is valid.

---

## How to Resume

1. **Audit the unmapped values** in Figma (the frame is annotated in red).
2. **For each value:**
   - Decide whether it's a new DS token or should map to an existing one.
   - For layout-driven spacing (187–756px), determine if it's a bounds constraint or an authored gap.
   - For 5px radius (48×), decide: add to DS scale, or round to 4/8?
3. **Add tokens in Figma:**
   - Open **Tokens Studio** plugin in Figma.
   - Add entries to the appropriate collections:
     - **Color Tokens / Light** (and Dark, Black) for new colors.
     - **Spacing Tokens / Mode 1** for spacing.
     - **Global.json** for new radius values (under the existing scale).
4. **Push the export:**
   - In Tokens Studio, click **Sync to file** or **Export**. The JSON files land in `src/tokens/source/`.
5. **Rebuild tokens:**
   - Run `npm run tokens:build` in the repo.
   - This regenerates `src/tokens/dist/css/variables.css` with the new values.
6. **Re-run the skill:**
   - Once tokens are live, re-invoke `/figma-page-to-library` with the same URL.
   - The run will proceed through steps 4–7 (component mapping, rebuild, verification, log).

---

## Node Inventory Summary

**Frame structure:**
- **Total non-leaf nodes:** 389
- **Frame nodes:** 220
- **Group nodes:** 77
- **Component instances:** 92
- **Max tree depth:** 8

**Sample top-level children:**
1. Frame 1707484834 (vertical auto-layout)
   - Frame 1707484858 (horizontal header)
   - Frame 1707502456 (year selector)
   - Frame 1707502466 (table/grid container)
   - ... (378 additional nodes in the tree)

The frame is a complex dashboard view with nested tables, cards, and interactive controls. Once tokens are in place, component mapping will follow (Step 4 of the skill).

---

## References

- Skill spec: `.claude/skills/figma-page-to-library/README.md`
- CLAUDE.md architecture rules: `CLAUDE.md` (rule #1: components never use raw values)
- DS file: `04x9q7W2Y59baF5MqHAVZR` (the source design system library)
- Current token counts: ~165 colors per mode, 8 spacing tiers, 7 radius values, 4 shadows

---

## Next Steps

1. Audit unmapped values with designers.
2. Add missing tokens to Figma Tokens Studio.
3. Export via Tokens Studio → `src/tokens/source/`.
4. Run `npm run tokens:build`.
5. Re-run `/figma-page-to-library` with the same URL.

**Estimated time to token addition:** 15–30 min (depends on decision granularity).  
**Estimated time to full conversion (after tokens):** 30–45 min (steps 4–7).

