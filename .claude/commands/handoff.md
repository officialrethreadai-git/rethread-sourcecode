---
description: Close out the current chat by writing session progress into docs/STATUS.md so a new chat can resume cold.
---

Write a clean handoff before this chat ends. The user manages context by closing chats and starting new ones, and relies entirely on `docs/STATUS.md` for continuity — a new chat will read `CLAUDE.md` → `docs/STATUS.md` → `docs/implementation-plan.md` and nothing else from this conversation.

Do the following now:

1. Review the full conversation since the last handoff (or session start).
2. Rewrite `docs/STATUS.md` in place, preserving its structure (`Last updated`, `Done so far`, `In progress`, `Next steps`, `Decisions log`, `Open questions / blockers`):
   - **Last updated**: today's date and a one-line summary of this session.
   - **Done so far**: append what was actually built/decided this session (concrete: files created/changed, endpoints working, keys confirmed) — don't just restate the plan.
   - **In progress**: anything left mid-way, with enough detail to resume without re-deriving it (e.g. "scan endpoint returns 500 on large images, was about to check fal.ai payload size limit").
   - **Next steps**: the concrete next 1-5 actions, ordered.
   - **Decisions log**: append any new decisions made this session and why (only if non-obvious from the code).
   - **Open questions / blockers**: update — remove resolved ones, add new ones.
3. If any new architecture decisions, scope changes, or API/key changes happened this session that contradict or extend `docs/implementation-plan.md`, update that file too (it should stay accurate, not just STATUS.md).
4. If new `.md` docs were created this session outside `docs/`, move them into `docs/` and fix any references — all project docs live there per `CLAUDE.md`.
5. Do not summarize the session back to the user in chat at length — the doc IS the summary. Reply with a short confirmation: what was updated, and one line telling the user it's safe to start a new chat now.
