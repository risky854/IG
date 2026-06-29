# CLAUDE.md

Guidance for Claude Code (and other AI assistants) working in this repository.

## Current State

This repository is an **empty scaffold**. As of now it contains only:

- `README.md` — a single line: `# IG`
- This `CLAUDE.md` file

There is no source code, package manifest, language runtime, framework,
build tooling, test suite, or CI configuration yet. Do not assume any of
these exist — verify with `ls`/`Glob` before relying on this file's
description of structure, since the structure below is a *starting plan*,
not yet-built reality.

## Inferred Project Intent

The repo is named "IG", which strongly suggests an **Instagram-related**
project (e.g. automation tool, bot, API client, analytics dashboard, or
content scheduler). This is an inference from the name alone — it has not
been confirmed by the repo owner and no functionality has been built yet.

When picking up work here:

1. **Confirm scope with the user before architecting anything large.** In
   particular, clarify which of these directions applies, since they imply
   very different stacks and legal/ToS considerations:
   - A client for the official **Instagram Graph API / Instagram API with
     Instagram Login** (Business/Creator accounts, requires Meta app review).
   - An **unofficial automation/scraping tool** (private API or browser
     automation) — flag that this risks violating Instagram's Terms of
     Service and can lead to account suspension; only build this for
     accounts/data the user owns or has explicit authorization to access.
   - A **clone/learning project** (a from-scratch Instagram-like app: feed,
     posts, follows, likes) with no real Instagram integration at all.
2. Once a direction is chosen, pick conventional, modern defaults for that
   stack rather than inventing bespoke patterns.

## Working Conventions

- **Don't fabricate structure.** Never describe files, scripts, or
  conventions in this document that don't actually exist in the repo.
- **Keep this file in sync with reality.** Every time you add a meaningful
  piece of structure (a package manifest, a framework choice, a test
  runner, a CI workflow, a directory layout), update the relevant section
  below in the same change.
- **No premature abstraction.** This project has no users or production
  history yet — start with the simplest structure that satisfies the
  current request; don't pre-build for hypothetical future features.

## Sections to Fill In As the Project Grows

Replace this section with real content as soon as it becomes true:

- **Tech stack**: language, runtime version, package manager.
- **Directory layout**: what lives where and why.
- **Build / run / test commands**: the actual commands, verified to work.
- **Lint / format / type-check commands**.
- **External services / credentials**: how API keys (e.g. Instagram/Meta
  app credentials) are configured locally — never commit secrets; use
  `.env` + `.gitignore` once any are introduced.
- **Deployment**: how and where the project is deployed, if applicable.

## Git Workflow

- Default branch: `main`.
- Feature work happens on topic branches (e.g. the
  `claude/claude-md-docs-on0u4s` branch used for this documentation change).
- Commit messages should be clear and describe *why*, not just *what*.
