# DESIGN — {{PROJECT_NAME}}

Owner: `ui-ux-designer` role. This file is the **design authority** for {{SURFACES}}. The incumbent source is {{BRAND_SOURCE}}. The tokens below are **copied from it, not invented**. Recommendations from `ui-ux-pro-max` go in `design-system/`; Stitch output goes in `DESIGN.stitch.md`. Neither overwrites this file without authorization.

## Surface mode

{{MODE}}: Operate (tools/apps) · Read (docs) · Persuade (marketing) · Experience (showcase). Record the variance, motion and density values.

## Tokens (incumbent)

| Token | Light | Dark |
|---|---|---|
| `--canvas` | {{}} | {{}} |
| `--chrome` | {{}} | {{}} |
| `--surface` | {{}} | {{}} |
| `--raised` | {{}} | {{}} |
| `--fg` / `--fg-sub` / `--fg-faint` | {{}} | {{}} |
| accent | {{}} | {{}} |
| status (success / warning / error) | {{}} | {{}} |

- **Type:** {{DISPLAY}} (display), {{UI}} (UI), {{PROSE}} (prose), {{MONO}} (mono).
- **Radius:** {{RADIUS}}.
- **Visual language:** {{e.g. Flat 2.0: no borders, rules or decorative shadows}}.

## Semantic mapping

- Map each domain state to a color, **plus a text label and an icon**. Color is never the only signal.
- The brand accent never stands in for a status.

## Platform constraints

<!-- For MCP Apps: host theme and variables first, tokens as fallback · single-file bundle ·
     empty CSP when the app shows sensitive data · inline and fullscreen modes · text fallback for hosts
     without MCP App support · actions through tools only the app can see · WCAG 2.2 AA. -->

## Open questions (resolve with `/teach-impeccable` and an ADR)

1. {{QUESTION}}
