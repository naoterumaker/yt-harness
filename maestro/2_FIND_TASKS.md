# 2. Find Tasks — Identify Implementation Items

## Context
- **Playbook:** YouTube Harness Development
- **Agent:** maestro_v1
- **Project:** /Users/naoteru/04_cline/SNS_booster/yt-harness
- **Auto Run Folder:** /Users/naoteru/04_cline/SNS_booster/yt-harness/maestro
- **Loop:** 00001

## Goal
Based on the game plan, drill into the current phase and produce a concrete list of implementation candidates — specific files to create or modify.

## Tasks

- [x] Read `/Users/naoteru/04_cline/SNS_booster/yt-harness/maestro/LOOP_00001_GAME_PLAN.md`
- [x] For the current phase's tactics, identify ALL specific files that need to be created or modified. For each file, note:
  - File path (relative to project root)
  - What it should contain (brief description)
  - Dependencies (which other files it imports from)
- [x] Check if any of these files already exist (partial implementation from a previous loop)
  - **Result:** All 14 shared type files EXISTS. DB schema, migration, queries (17 files) are PENDING. DB index.ts and Worker index.ts need updates.
- [x] Write `/Users/naoteru/04_cline/SNS_booster/yt-harness/maestro/LOOP_00001_CANDIDATES.md` listing all implementation candidates
  - **Result:** Updated existing candidates file with accurate statuses — 14 EXISTS, 15 PENDING, 2 need updates

## Output Format
```markdown
# Candidates — Loop 00001

## Phase: [Current Phase Name]

| # | File | Description | Dependencies | Status |
|---|------|-------------|-------------|--------|
| 1 | packages/shared/src/types/channel.ts | YtChannel type definition | none | PENDING |
| 2 | packages/shared/src/types/video.ts | Video type definition | none | PENDING |
| 3 | packages/db/src/schema.sql | All 15 tables | shared types (reference) | PENDING |
...
```

Status values: `PENDING`, `EXISTS` (already implemented), `PARTIAL` (needs updates)

## How to Know You're Done
- Candidates file exists with at least one PENDING item
- Each candidate has a clear file path and description
- Dependencies are identified so implementation order is clear
