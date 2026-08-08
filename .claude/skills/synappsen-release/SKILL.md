---
name: synappsen-release
description: Run Synappsen's release checklist after building a delmål/etapp - version bump, changelog, ETAPPLANx.md and CLAUDE_STATUS.md updates, full test sweep, commit, push, and (if asked) trigger and efficiently poll a production deploy. Use when the user asks to release, deploy ("deploya den"), or after a delmål in the active ETAPPLANx.md plan is built and needs to be wrapped up.
---

# Synappsen release checklist

This encodes the release/close-out sequence this project already follows every time a
delmål is built, so it doesn't need to be re-derived from `CLAUDE.md` each time. **`CLAUDE.md`
is still the source of truth for WHY these rules exist and what the underhållsregler require**
— if the two ever disagree, `CLAUDE.md` wins and this file should be updated to match.

Skip any step whose precondition doesn't apply (e.g. no version bump for a pure-docs/test
change — see `CLAUDE.md`'s established precedent).

## 1. Version bump (only if there's an app-visible change)

```
python3 - <<'EOF'
for f in ["package.json", "package-lock.json"]:
    s = open(f).read()
    s2 = s.replace('"version": "OLD"', '"version": "NEW"')
    print(f, s.count('"version": "OLD"'), "->", s2.count('"version": "NEW"'))
    open(f, "w").write(s2)
EOF
```

Then add a new entry at the top of `src/data/andringslogg.js` — short, user-facing, no
filenames/technical details.

## 2. Update the active plan file (`ETAPPLANx.md`)

Mark the delmål done (✅ KLAR, with date). If a premisskontroll narrowed the scope, say so
explicitly and add "Premisskontroll" / "Genomfört" / "Testat" subsections — this project's
established format, not prose in the bullet itself.

If a genuinely new decision point or blocked-on-owner item surfaced, add/update a row in
`OPPNA-PUNKTER.md` in the SAME commit (check first whether it's the same underlying blocker as
an existing row — merge into that row rather than duplicating, see the Etapp 48c/32b example).

## 3. Update `CLAUDE.md`'s document map (only if a plan file's status changed)

E.g. a plan moving from "aktiv" to "helt klar", or a new plan being adopted. Don't touch
`CLAUDE.md` for routine delmål progress within an already-listed active plan.

## 4. Test sweep

Always: `npm run lint`, `npm run build`, `npx vitest run`.
Conditionally, only for what actually changed:
- `functions/index.js` or anything under `tests/functions/` → `npm run test:functions`
  (background it — this chains ~25 files against the emulator and takes 60-120s; use
  `run_in_background: true` and `TaskOutput` to wait rather than a blocking foreground call)
- `firestore.rules`/`storage.rules` or anything under `tests/rules/` → `npm run test:rules`
- `storage.rules` or upload paths → `npm run test:storage`
- UI/route behavior → `npm run test:e2e`

## 5. Update `CLAUDE_STATUS.md`

Two edits, same commit:
- The top "Senast uppdaterad" block — rewrite it, don't just append to it.
- A new `## Uppföljning ÅÅÅÅ-MM-DD (...)` section at the END of the file — short, points to
  the `ETAPPLANx.md` details rather than duplicating them.

## 6. Commit and push

One commit for the code+docs together (this project does not separate them). Commit message:
one-line summary + a short paragraph on the *why*, not a diff description. Standard
Co-Authored-By/Claude-Session trailer (see any prior commit in this repo for the exact format).

```
git add <files>
git commit -m "$(cat <<'EOF'
<summary>

<why, 2-4 sentences>

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: <this session's URL>
EOF
)"
git push -u origin claude/compassionate-euler-rho0q5
```

## 7. Deploy (only if explicitly asked — "deploya den" or similar)

Trigger:

```
mcp__github__actions_run_trigger(method="run_workflow", owner="obicankenobi",
  repo="synappsen-final", workflow_id="deploy.yml", ref="claude/compassionate-euler-rho0q5")
```

**Poll efficiently — this is the part that used to waste tokens and turns:**

- Do NOT call `mcp__github__actions_get` (`get_workflow_run`) repeatedly. It returns a huge
  object (owner/repo/urls-to-urls/actor, several thousand tokens) that does NOT overflow to a
  file, so every call re-spends that cost in-context for real.
- DO call `mcp__github__actions_list` (`list_workflow_runs`) with
  `resource_id="deploy.yml"`, `per_page=1`, and
  `workflow_runs_filter={"branch": "claude/compassionate-euler-rho0q5", "event": "workflow_dispatch"}`.
  This reliably overflows to a file (stays out of context) and the run's `id` from it can be
  used for one single `get_workflow_run` call later if truly needed.
- Extract the compact status instead of reading the raw file yourself:
  `python3 .claude/skills/synappsen-release/scripts/gh_run_status.py --overflow-file <path>`
- **Wait once, not in a loop.** Historical deploys on this repo (`deploy.yml`) take ~5-6
  minutes end to end (queued + build + firebase deploy). Start a single background
  `sleep 330 && echo done` (`run_in_background: true`), wait for it via `TaskOutput`, THEN
  check once. Only do a second, shorter wait (`sleep 90`) if it's still not `completed` —
  don't poll every 30-60s.

After `conclusion: success`, confirm the new asset hash:

```
curl -s https://synappsen-final-build.web.app/ | grep -o 'assets/index-[A-Za-z0-9_-]*\.js'
```

Then repeat step 5 (a short "deploy confirmed" note in `CLAUDE_STATUS.md`, run number, commit,
new hash) and push that as its own small commit — matches this project's established pattern.
