# Liquid Glass Unification Plan

Goal: a single, consistent Liquid Glass language used across every surface (cards, sidebars, analysis blocks, controls), with reference-quality hover/active reflections that work in both dark and light modes.

## 1. Shared `GlassCard` component
Create `src/components/ui/glass-card.tsx`:
- Props: `variant` ("default" | "strong" | "subtle"), `interactive` (boolean — adds hover lift + reflection sweep), `glow` ("none" | "gold" | "soft"), `as` (polymorphic element), plus standard `className`/`children`.
- Internally composes `.glass` / `.glass-strong` plus new `.glass-interactive` and `.glass-glow-*` modifier classes (defined in `index.css`).
- Exports `GlassCard`, `GlassCardHeader`, `GlassCardTitle`, `GlassCardContent`, `GlassCardFooter` mirroring shadcn `Card` API so it can be a drop-in replacement.
- Re-export from `src/components/ui/index.ts` (create if missing) for ergonomic imports.

## 2. Enhanced hover & active reflections (`src/index.css`)
- Add `.glass-interactive` modifier: animated diagonal highlight sweep using a `::before` pseudo-element with `linear-gradient(115deg, transparent, rgba(255,255,255,0.18), transparent)` translated on hover (cubic-bezier 0.4,0,0.2,1, 600ms).
- Strengthen existing `.glass:hover` reflection (`::after`) — increase opacity to 0.95, lift bottom highlight, brighten bottom border to `rgba(255,255,255,0.55)`.
- Add `.glass:active` / `[data-pressed]` state: `scale(0.985)`, deeper inset shadow, dimmer outer shadow (tactile press).
- Light-mode parity: hover adds `box-shadow: 0 16px 40px -16px hsl(222 47% 20% / 0.22)` and a subtle gold-tinted top border. Active = inset shadow + scale.
- New `.glass-glow-gold` utility: outer `0 0 24px hsl(43 73% 62% / 0.35)` + animated pulse on hover.

## 3. Liquid progress bars
- Replace `<Progress />` usage in analysis flows with new `LiquidProgress` component at `src/components/ui/liquid-progress.tsx` that wraps the existing `.liquid-progress-track` / `.liquid-progress-fill` CSS, plus an animated shimmer overlay (reuses `neonShimmer` keyframe pattern but in white/gold).
- Update `src/components/ui/progress.tsx` to render the liquid styling by default (keeps Radix API, swaps inner classes) so any existing imports inherit the new look without churn.
- Replace the bespoke bar inside `AnalysisChecklist.tsx` running step (`h-0.5 w-32 ... gold-bg animate-pulse`) with `<LiquidProgress indeterminate />`.
- Audit `NeonProgressBar.tsx`: keep as-is (different intentional neon style) but expose a `variant="liquid"` that renders the liquid version, and switch the analysis pipeline (`Index.tsx`) to use it.
- Verify by running the dev preview and watching the bar animate through a mocked analysis lifecycle.

## 4. Liquid radio + toggle controls
- `src/components/ui/radio-group.tsx`: restyle `RadioGroupItem` to use `.icon-glass`-style base, gold-glow on `data-state="checked"`, recessed inset shadow when unchecked, scale(0.92) on `:active`, `opacity-50` + `cursor-not-allowed` for disabled (already partially handled).
- `src/components/ui/toggle.tsx` & `toggle-group.tsx`: add a new `glass` variant to `toggleVariants` using `.liquid-action` base, with `data-state=on` applying gold-tinted gradient + shadow-gold-glow.
- `src/components/ui/checkbox.tsx`: align with the same liquid look (small icon-glass square, gold check) for visual consistency.
- `src/components/ui/switch.tsx`: already liquid — extend `.liquid-switch` CSS with disabled state (desaturate thumb, dim track) and a stronger checked highlight (brighter top thumb gradient + thin gold rim) to match the reference image.

## 5. Apply Glass to all surfaces
Sweep these files and replace ad-hoc card/panel wrappers with `<GlassCard>` (or add `.glass` / `.glass-strong` classes where a full component swap isn't warranted):
- Report: `src/components/ReportView.tsx` (each section block, contradiction blocks keep `.contradiction-block` but wrap in GlassCard), `src/components/SmartDraftingSidebar.tsx`, `src/components/VersionHistory.tsx`, `src/components/ContradictionModal.tsx`, `src/components/DownloadDialog.tsx` preview panel.
- Analysis: `src/components/AnalysisChecklist.tsx` (already `.glass` — migrate to component), `src/components/AnalysisStepper.tsx`, `src/components/AnalysisSettings.tsx`, `src/components/BentoGrid.tsx` tiles.
- Sidebar/layout: `src/components/AppSidebar.tsx` panels and grouping, `src/components/AppLayout.tsx` header chrome, `src/components/CommandPalette.tsx` shell, `src/components/OfflineBanner.tsx`.
- Pages: cards in `src/pages/Index.tsx`, `Storico.tsx`, `Analytics.tsx`, `Confronta.tsx`, `Modelli.tsx`, `Settings.tsx` (form sections become GlassCards; preserves existing layout, only changes wrapper classes).
- Inputs: `src/components/CaseInfoForm.tsx`, `src/components/FileUploadZone.tsx` containers use `.glass-strong` + `.liquid-pill` for inputs.

No business-logic changes — only wrapper/className swaps and the new component usage.

## Out of scope
- No edge function, DB, auth, routing, or `client.ts`/`types.ts` edits.
- `NeonProgressBar` neon style preserved; only adds an opt-in liquid variant.
- Security findings shown in the current view are not addressed here (separate request).

## Files touched
New: `src/components/ui/glass-card.tsx`, `src/components/ui/liquid-progress.tsx`.
Edited: `src/index.css`, `src/components/ui/{progress,radio-group,toggle,toggle-group,checkbox,switch}.tsx`, `NeonProgressBar.tsx`, `AnalysisChecklist.tsx`, plus the surface files listed in §5.

## Verification
- Visual pass in preview at `/`, `/storico`, `/analytics`, `/confronta`, `/modelli`, `/settings` in both dark and light modes.
- Trigger an analysis to confirm the liquid progress fill animates smoothly and the indeterminate shimmer renders.
- Toggle theme via Settings to confirm hover/active glass states render correctly in light mode (no washed-out white-on-white).
