---
name: figma-page-to-library
description: Connects an existing Figma page or frame in a TimeWorks product file to the published Design System library — replacing detached layers, local wrappers, and one-off components with library instances or compositions of library primitives. Section-by-section, not all-at-once. Drives the figma-console MCP via Plugin API only; both the source file AND the DS library file (`04x9q7W2Y59baF5MqHAVZR`) must be open in Figma Desktop. Use when the user pastes a Figma URL with intent like "convert this page to the library", "rebuild this in the design system", "swap to library components". Does NOT generate React code — that is the figma-to-code skill.
---

# figma-page-to-library

Adapted from Eden Spiekermann's `apply-design-system` workflow, retargeted at the figma-console MCP (https://github.com/southleft/figma-console-mcp).

Use this skill for an existing Figma page that should reuse the published TimeWorks Design System instead of detached layers, local wrappers, or one-off components.

## Entry modes and prerequisites

**Three entry modes:**

- `review-then-apply` — the user wants a broad pass on a whole page; the offending sections aren't yet identified.
- `apply-known-scope` — the user already knows which section or frame should be brought onto the design system (most common).
- `work-in-DS-file` — the target page has already been duplicated into the DS file; the skill operates locally with no cross-file imports.

If the URL points to a `PAGE` → `review-then-apply`. If it points to a `FRAME` / `SECTION` → `apply-known-scope`. If `fileKey == 04x9q7W2Y59baF5MqHAVZR` and the URL points to a duplicated product page → `work-in-DS-file`.

**Prerequisites for best results:**

Both the source product file AND the DS file (`04x9q7W2Y59baF5MqHAVZR`) must be open in Figma Desktop. **For smoothest workflow, manually duplicate the target page into the DS file first:**

1. In the source file, right-click the page tab
2. Select "Move to file" or "Duplicate to file"
3. Choose the TimeWorks Design System file

This unlocks local component access and avoids cross-file import limitations. If you skip this step, the skill can still work with some constraints (see Step 5).

## CRITICAL: figma_execute payload conventions

The figma-console-mcp Desktop Bridge is a **persistent** plugin held open across calls. **Never** call `figma.closePlugin(...)` or `figma.closePluginWithFailure(...)` inside a `figma_execute` payload — those calls shut down the Desktop Bridge and drop the WebSocket, requiring the user to manually re-launch the plugin.

Correct pattern: `return` the result from the async IIFE; `throw` on error.

```javascript
// ✅ Correct — Desktop Bridge stays alive
(async () => {
  const frame = await figma.getNodeByIdAsync("FRAME_ID");
  // ...do work...
  return { sections };
})()

// ❌ Wrong — closes the Desktop Bridge plugin
(async () => {
  // ...
  figma.closePlugin(JSON.stringify({ sections }));  // ← BRIDGE DIES HERE
})()
```

Any code pattern copied from skills written for the official Figma MCP (Eden Spiekermann's `apply-design-system`, etc.) must be retargeted to use `return` / `throw`. `figma.notify(...)` is fine for visible debug output and does not affect the bridge.

## Required tools

All Figma I/O goes through `mcp__figma-console__*`. **Plugin API only — no REST, no Team Library indexing.** Both the source file and the DS library file must be open in Figma Desktop.

- `figma_get_status` — connection check.
- `figma_get_file_data` — metadata for a page/frame.
- `figma_navigate` — switch the active file.
- `figma_execute` — run Plugin API code (the main verb for both reads and writes).
- `figma_take_screenshot` — visual validation per section.
- `figma_set_annotations` — informational stickers on rebuilt nodes.

`figma_search_components` is **only** a fallback for Step 4 component discovery; prefer direct inspection of the DS file via `figma_execute`.

## Core rule

Do not treat a section as "connected" just because it contains a few design-system buttons or icons. Classify each section into exactly one bucket:

- `already-connected` — the section is a library instance or a composition the user accepts as canonical.
- `exact-swap` — a published library component or variant can replace the section directly.
- `compose-from-primitives` — no single library component matches, but the section can be rebuilt from library primitives (Button, Avatar, Tag, Text, etc.).
- `blocked` — the library doesn't expose the needed components, imports fail, or the section is intentionally bespoke.

## Workflow

### 1. Verify connection and file state

**Call:** `mcp__figma-console__figma_get_status`. Confirm:

1. A Figma Desktop instance is connected.
2. Source `fileKey` (parsed from the URL) is open.
3. DS `fileKey` `04x9q7W2Y59baF5MqHAVZR` is open.

If anything is missing, halt with a specific message naming what to fix.

### 2. Determine scope

Parse the URL into `fileKey` + `nodeId`.

**If `fileKey == 04x9q7W2Y59baF5MqHAVZR`:** This is a `work-in-DS-file` run. The DS file contains both the library components AND the duplicated product page. Proceed normally; skip the cross-file import steps below.

**If `fileKey != 04x9q7W2Y59baF5MqHAVZR`:** This is a source-file run. Navigate to that file.

**Call:** `mcp__figma-console__figma_navigate` to the target URL (source file or DS file).

**Call:** `mcp__figma-console__figma_get_file_data` for metadata. Determine entry mode (page vs frame, and whether this is a work-in-DS-file run).

If `review-then-apply` and the page has many sections, list the top-level sections to the user before proceeding section-by-section. The user may narrow the scope.

### 3. Capture current state and back up the target

**Call:** `mcp__figma-console__figma_take_screenshot` of the source target. Save URI for the deliverable.

**Call:** `mcp__figma-console__figma_execute` with code that:
- Duplicates the target page or frame.
- Names the duplicate `Backup - <original name>` and places it to the right of the original.
- Returns the backup node id.

The skill works on the **original** target. The backup is the safety net.

### 4. Inventory the existing screen

**Call:** `mcp__figma-console__figma_execute` with a Plugin API walker that, for the target frame, returns each section's:

- instance id, name
- `mainComponent` name + `key`
- whether `mainComponent` is local, remote (library), or missing
- nested published-component instances inside any local wrapper
- exposed text + variant properties

Read-only inventory pattern (figma-console-mcp safe — uses `return`, NOT `figma.closePlugin`):

```javascript
(async () => {
  const frame = await figma.getNodeByIdAsync("FRAME_ID");
  if (!frame) {
    throw new Error("Frame FRAME_ID not found on the active page");
  }
  const sections = frame.findAll(n => n.type === "INSTANCE").map(inst => {
    const mc = inst.mainComponent;
    const cs = mc?.parent?.type === "COMPONENT_SET" ? mc.parent : null;
    return {
      instanceId: inst.id,
      instanceName: inst.name,
      componentName: mc?.name ?? null,
      componentKey: mc?.key ?? null,
      componentSetName: cs?.name ?? null,
      componentSetKey: cs?.key ?? null,
      isRemote: mc?.remote ?? false,
    };
  });
  return { sections };
})()
```

**Do not** wrap this in a `try { ... figma.closePlugin(...) } catch { figma.closePluginWithFailure(...) }` — that pattern is for one-shot plugins. The Desktop Bridge is persistent.

Prefer **exact keys over names**. Names are only hints.

If the target frame has many nodes, walk in chunks (~200 per `figma_execute` call) to avoid the ~7s WebSocket timeout. Use a cursor pattern — return unvisited child ids when the budget is hit, then call again with each child id.

### 5. Build a component map from the DS

**For `work-in-DS-file` mode:** All DS components are already local; skip navigation and go directly to local discovery.

**For source-file mode:** Components are remote; use this order.

Authoritative sources, in this order:

1. **Existing components already in the target file.** If any instance in the target frame or page already points to a DS component, harvest its key and variant properties.
2. **Local discovery (if working in DS file).** `figma_execute` with local component lookup:

```javascript
// ✅ Local discovery — works when operating inside the DS file
(async () => {
  const allComponents = figma.root.findAllWithCriteria({ types: ['COMPONENT_SET', 'COMPONENT'] });
  return allComponents.map(c => ({
    id: c.id,
    key: c.key,
    name: c.name,
    type: c.type,
    variantProperties: c.type === 'COMPONENT_SET' ? Object.keys(c.variantGroupProperties || {}) : null,
  }));
})()
```

3. **Direct inspection from source file.** If not in DS file, `figma_navigate` to `https://www.figma.com/design/04x9q7W2Y59baF5MqHAVZR`, then `figma_execute` with the local discovery pattern above. Capture name, key, variant property definitions.
4. **`figma_search_components` as last resort only.** Results may include unrelated libraries; verify any hit by direct inspection before trusting it. Node IDs expire per-session; always re-query.

For each section in the inventory, capture the candidate(s):

- component or component-set key (preferred) or name
- exact variant name
- one-to-one swap vs composition
- text/instance property keys needed for overrides

**Variant matching — never default blindly.** Before choosing a variant, inspect the source section for:

- semantic cues from name, copy, usage
- visual cues — fills, strokes, effects, radius, typography
- existing variant-like traits in the screen (primary vs secondary buttons, etc.)

Compare against available component-set variants and pick the closest. If the family is right but the variant is ambiguous, call it out instead of silently using the default.

`figma_navigate` back to the source file before any writes (only if you navigated to DS; skip if already in DS file).

### 6. Decide section strategy (per section)

Apply the four buckets:

- `exact-swap` — library component matches the section's job and structure closely enough that swapping preserves intent.
- `compose-from-primitives` — section is a container around library pieces (avatar + badge + text + buttons).
- `already-connected` — leave alone.
- `blocked` — library lacks it, import fails, or it's intentionally bespoke.

TimeWorks-specific patterns to expect:

- Header summary blocks → usually `compose-from-primitives` (Avatar + Text + Button, etc.).
- Banners and Tags → strong `exact-swap` candidates.
- Stat cards / metric cards → usually `compose-from-primitives` unless the DS adds a Stat component.
- Tables → `exact-swap` to the existing Table family (Cell, Column, Header, Row).
- Bottom nav / sidebars → custom containers built from primitives.

### 7. Update one section at a time

**Never rewrite the entire screen in one `figma_execute` call.** For each section:

1. Read the current node ids.
2. Locate the library component (local lookup via key; use the component map from Step 5).
3. Match the closest variant before swapping/rebuilding.
4. Detect whether the parent uses auto-layout.
5. Create or swap only that section.
6. Return all mutated node ids.
7. **Validate per section** — `figma_take_screenshot` of the section after the change, before moving on.

**Local component instantiation pattern:**

```javascript
// ✅ Local instantiation — works when component is in the same file (work-in-DS-file mode)
(async () => {
  // For a COMPONENT or leaf of a COMPONENT_SET
  const component = figma.root.findOne(n => n.key === TARGET_KEY && n.type === 'COMPONENT');
  if (!component) {
    throw new Error(`Component with key ${TARGET_KEY} not found`);
  }
  const instance = component.createInstance();
  // Apply text overrides, position, size here
  return { instanceId: instance.id };
})()

// For a variant selection from a COMPONENT_SET
(async () => {
  const set = figma.root.findOne(n => n.key === SET_KEY && n.type === 'COMPONENT_SET');
  if (!set) throw new Error(`Component set with key ${SET_KEY} not found`);
  // Find the variant matching the desired properties
  const variant = set.children.find(c =>
    c.type === 'COMPONENT' &&
    c.variantProperties?.Size === 'md' &&
    c.variantProperties?.Variant === 'primary'
  );
  if (!variant) throw new Error(`No matching variant found in set ${SET_KEY}`);
  const instance = variant.createInstance();
  return { instanceId: instance.id };
})()
```

Prefer `swapComponent()` when the existing node is already an instance of a compatible family and you want to preserve overrides:

```javascript
(async () => {
  const oldInstance = await figma.getNodeByIdAsync(INSTANCE_ID);
  const newComponent = figma.root.findOne(n => n.key === NEW_COMPONENT_KEY);
  oldInstance.swapComponent(newComponent);
  return { success: true };
})()
```

Prefer **rebuilding beside the original** when:

- the old section is a local wrapper around mixed content
- you need to compare visually before replacing
- you're composing from multiple primitives

**Auto-layout vs absolute parents.** When the parent is not auto-layout, treat replacement as a layout-risk operation:

- Preserve `x` and `y` explicitly.
- Preserve width/height explicitly when the replacement should occupy the same footprint.
- Do not assume the new instance will inherit position or size.
- Warn the user that absolute or grouped parents can drift after swaps or rebuilds.
- Suggest converting the parent to auto-layout only when the user wants structural cleanup, not as the default move.

**Post-swap: apply properties in order**

After creating or swapping to a DS component, apply the old design's properties so the new instance reflects the original intent. Execute these steps in sequence; on any failure, catch and log but **continue**—never abort the whole section because one property failed.

**1. Capture old state before any changes:**

```javascript
// Read the old section's state (text, fills, icon hints)
(async () => {
  const oldNode = await figma.getNodeByIdAsync(OLD_SECTION_ID);
  const textMap = {};
  const fillMap = {};
  const instanceHints = {};

  // Capture text content and sizing
  oldNode.findAll(n => n.type === 'TEXT').forEach(t => {
    textMap[t.name] = {
      characters: t.characters,
      fontSize: t.fontSize,
      lineHeight: t.lineHeight?.value ?? null,
    };
  });

  // Capture fill colors for rebinding to DS tokens
  oldNode.findAll(n => n.fills?.length > 0).forEach(n => {
    fillMap[n.name] = n.fills.map(f => ({
      type: f.type,
      color: f.type === 'SOLID' ? { ...f.color } : null,
    }));
  });

  // Capture icon instance hints for matching to DS icons
  oldNode.findAll(n => n.type === 'INSTANCE').forEach(inst => {
    instanceHints[inst.name] = inst.mainComponent?.name ?? null;
  });

  return { textMap, fillMap, instanceHints };
})()
```

**2. Apply text content and bind to DS text styles:**

```javascript
(async () => {
  const textNodes = newInstance.findAll(n => n.type === 'TEXT');
  const textStyles = await figma.getLocalTextStylesAsync();

  textNodes.forEach(node => {
    try {
      // Restore text content (name-matched)
      const oldText = textMap[node.name];
      if (oldText?.characters) {
        node.characters = oldText.characters;
      }

      // Bind to DS text style by matching font size
      const matchingStyle = textStyles.find(s => s.fontSize === node.fontSize);
      if (matchingStyle) {
        node.textStyleId = matchingStyle.id;
      }
    } catch (err) {
      // Log but continue to next node
      console.warn(`Text style binding failed for ${node.name}: ${err.message}`);
    }
  });
})()
```

**3. Bind fill colors to DS color variables:**

```javascript
(async () => {
  const allVariables = figma.variables.getLocalVariables()
    .filter(v => v.resolvedType === 'COLOR');

  function findNearestColorVariable(fill) {
    if (fill.type !== 'SOLID') return null;
    const { r, g, b } = fill.color;
    let best = null;
    let bestDist = Infinity;

    allVariables.forEach(v => {
      const modeId = Object.keys(v.valuesByMode)[0];
      const val = v.valuesByMode[modeId];
      if (!val || typeof val !== 'object') return;

      // Skip variable aliases; only match raw color values
      if (val.type === 'VARIABLE_ALIAS') return;

      const dist = Math.abs((val.r ?? 0) - r) + Math.abs((val.g ?? 0) - g) + Math.abs((val.b ?? 0) - b);
      if (dist < bestDist) { bestDist = dist; best = v; }
    });

    // Only bind if a close match exists (distance < 0.1)
    return bestDist < 0.1 ? best : null;
  }

  const fillableNodes = newInstance.findAll(n => n.fills?.length > 0);
  fillableNodes.forEach(node => {
    try {
      const newFills = node.fills.map(fill => {
        const colorVar = findNearestColorVariable(fill);
        if (!colorVar) return fill;
        return figma.variables.setBoundVariableForPaint(fill, 'color', colorVar);
      });
      node.fills = newFills;
    } catch (err) {
      console.warn(`Color binding failed for ${node.name}: ${err.message}`);
    }
  });
})()
```

**4. Set icon override on button/icon components:**

```javascript
(async () => {
  try {
    const props = newInstance.componentProperties;
    // Find icon property (e.g., 'Icon', 'LeftIcon', etc.)
    const iconPropKey = Object.keys(props ?? {}).find(k =>
      k.toLowerCase().includes('icon') && props[k].type === 'INSTANCE_SWAP'
    );

    if (!iconPropKey || !instanceHints) return;

    // Extract icon name from old component (e.g., "Icons/ChevronDown")
    const oldIconName = instanceHints[iconPropKey] ?? '';
    const iconNameHint = oldIconName.split('/').pop(); // "ChevronDown"

    // Find matching DS icon component
    const dsIcon = figma.root.findOne(n =>
      n.type === 'COMPONENT' &&
      n.name.toLowerCase().includes(iconNameHint.toLowerCase())
    );

    if (dsIcon) {
      newInstance.setProperties({ [iconPropKey]: dsIcon.id });
    }
  } catch (err) {
    console.warn(`Icon override failed: ${err.message}`);
  }
})()
```

**On any failure:** Catch and log, but continue to the next property step. Partial success (text applied but colors failed) is better than no success.

**On any failure:** Catch the error, record it with the verbatim message, and move to the next section. **Never halt the run.** Implement the fallback chain (see Step 8).

### 8. Implement the four-tier fallback chain

When a section cannot be handled at Tier 1 (exact match), implement this chain. **Complete all sections; never halt.**

| Tier | Strategy | Action | Report As |
|------|----------|--------|-----------|
| 1 | **exact-swap** | Find a single DS component that matches the section's job exactly. Swap or rebuild with a single instance. | `🔄 swapped` |
| 2 | **compose-from-primitives** | If no single component fits, rebuild the section using 2+ DS primitives (e.g., Avatar + Text + Button). | `🔄 composed` |
| 3 | **annotate-and-preserve** | If the library has no suitable components, keep the node as-is and attach an annotation explaining why. | `✓ annotated as-is` |
| 4 | **flag-and-skip** | For truly bespoke or blocked nodes, leave untouched and flag in the report. | `❌ blocked: <reason>` |

**Error handling rule:** When Tier 1 fails, catch the error and attempt Tier 2. When Tier 2 fails or doesn't apply, fall through to Tier 3. When Tier 3 is not applicable (bespoke node), use Tier 4. Never re-throw; always record the error and proceed to the next section.

Example:

```javascript
// Tier 1: Exact match?
const exactComponent = dsComponentMap.find(c => c.name === NEEDED_COMPONENT);
if (exactComponent) {
  // Tier 1 succeeded
  return { tier: 1, componentKey: exactComponent.key };
}

// Tier 2: Compose from primitives?
const Icon = dsComponentMap.find(c => c.name === 'Icon');
const Text = dsComponentMap.find(c => c.name === 'Text');
if (Icon && Text) {
  // Tier 2 succeeded
  return { tier: 2, primitives: ['Icon', 'Text'] };
}

// Tier 3: Preserve as-is
return { tier: 3, reason: 'No DS equivalent; preserved with annotation' };
```

### 9. Validate what actually changed

After **each section**:

- `figma_take_screenshot` of the changed section, not only the full frame.
- Confirm placeholder text is gone.
- Confirm the instance is really linked to a library component (`mainComponent.remote === true` or similar check).
- Confirm spacing did not regress.

After **the full pass**:

- `figma_take_screenshot` of the full target.
- `figma_set_annotations` on each section with its bucket: `🔄 swapped`, `🔄 composed`, `✓ already-connected`, or `❌ blocked: <reason>`.

### 10. Deliverable

Write a markdown report at:

```
docs/superpowers/runs/YYYY-MM-DD-<source-file-slug>-<page-name>-conversion.md
```

**Report accuracy rules:**
- Only list a section under "Swapped" if the node is now a library instance (`mainComponent.remote === true`) OR was created fresh from a local DS component with `mainComponent.key` matching a known DS key.
- Only list a section under "Composed" if at least one of the component instances is newly created from a DS primitive or swapped.
- If a section has NO changes, it must appear in "Already connected" (if it was already a DS instance) or "Blocked" (if unconverted), NOT in "Swapped" or "Composed".
- If ALL sections are blocked, open the report with `❌ No substitutions made — see Blocked section for details` before any other content.

Format:

```markdown
# <source page name> — design-system reconciliation

## Swapped

- <section name> → <DS component> (variant: <variant>) — node `<id>`
- ...

## Composed

- <section name> → <Primitive A> + <Primitive B> + ... — node `<id>`
- ...

## Already connected

- <section name> — node `<id>` (already an instance of <DS component>)

## Blocked

- <section name> — reason: <verbatim error or library-not-enabled> — node `<id>`
- ...

## Screenshots

| Stage | Source | Result |
|---|---|---|
| Full target | <URI> | <URI> |
| <section name> | <URI> | <URI> |

## Backup

Backup frame: `Backup - <original name>` (node `<id>`)
```

If nothing was actually substituted, be explicit: `❌ No substitutions made — the target was cloned but no components were upgraded. See Blocked section for details.`

## Writing rules

- Work incrementally. Preserve the backup.
- Prefer direct DS inspection over `figma_search_components`.
- Prefer exact component keys over names.
- Match the variant to the original visual treatment, not just the correct family.
- Preserve position and size explicitly when replacing inside non-auto-layout parents.
- Use imperative evidence in the report — node names, keys, component families, and whether the final node is local or library-backed.
- Do not claim full reconnection when the result is still a local shell around shared children.
- If a section must remain bespoke, say so and explain why.

## Failure modes

| Symptom | Likely cause | Fix |
|---|---|---|
| `figma_get_status` reports either file not open | DS or source not loaded in Figma Desktop | Open both in Figma Desktop and re-run |
| "Swap component" fails with "component not found" | Component key doesn't match the target component's main component family | Verify the component key from Step 5; try a different component family |
| `figma_execute` times out | Single call walked too many nodes | Reduce per-call budget below 200 nodes; use chunking for large frames |
| 403 / "Invalid token" anywhere | A REST call slipped into a `figma_execute` payload | Bug — the skill should only use Plugin API (no MCP REST calls). Surface the call site and stop. |
| `figma_search_components` returns empty | DS library isn't published as a Team Library | Expected. Rely on direct DS inspection (local discovery in Step 5) instead. |
| Desktop Bridge plugin closes after one `figma_execute`; subsequent calls fail with "no active Figma instance" | A payload called `figma.closePlugin(...)` or `figma.closePluginWithFailure(...)` | Bug — payloads must `return` results and `throw` errors; never `closePlugin`. Fix the payload, restart Desktop Bridge plugin, re-run. |
| Backup frame missing after run | Step 3 (backup creation) failed silently | Bug; check the backup creation `figma_execute` call, fix it, and re-run. |
| All sections land in "Blocked" (no swaps or composes) | Tier 1 and 2 failed for every section; library doesn't have matching components | Expected in rare cases. Review the library composition; either add missing components or document the sections as intentionally custom. |
| Page duplicated into DS file but skill refuses to run on it | Skill treating DS file as library-only (Step 2 check) | Ensure the page is actually copied into the DS file (fileKey should be `04x9q7W2Y59baF5MqHAVZR`). Retry. If this is a new page, re-run with `figma_navigate` to the DS file URL first. |

## When NOT to use this skill

- Single targeted finding from a design audit → use a narrower fix workflow instead.
- Brand-new component design → `figma-design`.
- Generating React code from a Figma component → `figma-to-code`.

## References

- Inspired by Eden Spiekermann's `apply-design-system` skill: https://github.com/edenspiekermann/Skills/blob/main/skills/apply-design-system/SKILL.md
- figma-console MCP: https://github.com/southleft/figma-console-mcp
- Spec: `docs/superpowers/specs/2026-04-30-figma-page-to-library-design.md`
- Related skills: `figma-design` (upstream component authoring), `figma-to-code` (downstream code generation)
