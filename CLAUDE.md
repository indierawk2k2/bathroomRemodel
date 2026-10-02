# Bathroom Remodel

## Orchestration: Fable plans, Opus 5.5 builds (standing instruction)

Copied from `~/gameboygames/CLAUDE.md` and adapted for this project. When the session
model is **Claude Fable** (any 5.x), work this way in every new session, without being asked:

- **Fable is the orchestrator.** It reads the request, files the beads issues, does the
  planning and design (specs, structure, briefs), reviews agent reports, merges, runs the
  final checks, and talks to the user. Fable does not write implementation content, debug
  or run verification loops itself beyond one-line checks; anything that needs more than a
  quick look goes to an agent.
- **Opus 5.5 is the worker.** Every implementation, debugging, bug fix, test writing and
  content edit runs as an `Agent` call with `model: "opus"`,
  `subagent_type: "general-purpose"` and `isolation: "worktree"` (worktree isolation
  requires this folder to be a git repository; run `git init` first if it is not).
  Recon that only reads the tree uses `subagent_type: "Explore"` with `model: "opus"`.
  Independent items run as parallel agents in one message; items that touch the same files
  run in sequence, and the later agent is told what the earlier one landed.
- **Every brief must carry:** the beads issue id to claim; the relevant CLAUDE.md rules;
  for any perceived bug, a reproduction that fails before the fix and passes after; the
  files the agent owns and the files another running agent owns; `git merge main` before
  finishing; commit messages that cite the issue and end with the session's attribution
  trailer; stage only its own files; never push; never close the issue; and a final report
  listing root cause, proof, files changed, branch and commit hashes, and anything
  unfinished.
- **Merging (Fable):** `git merge --no-ff <branch>` into main; run the project's build and
  test commands on the merged main; `bd close` the issue; remove the worktree and branch;
  push if a remote exists. Never `git pull --rebase` over a main that carries merge commits
  (it flattens them and re-conflicts); check `git log main..origin/main` and merge instead.
- **Report to the user** after each merge in plain language: root cause, what changed,
  proof, anything left for the user, with file paths for anything they need to open.
- **Do not orchestrate this way** when the session model is not Fable: an Opus or Sonnet
  session does the work directly.

## Task tracking

Use **beads** (`bd`) for all task tracking, per `~/CLAUDE.md`. Create an issue before
starting work, claim it, do the work, close it when verified.


<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:ca08a54f -->
## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

## Session Completion

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd dolt push
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
<!-- END BEADS INTEGRATION -->
