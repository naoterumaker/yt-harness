# 3. Evaluate — Prioritize and Plan Implementation

## Context
- **Playbook:** YouTube Harness Development
- **Agent:** maestro_v1
- **Project:** /Users/naoteru/04_cline/SNS_booster/yt-harness
- **Auto Run Folder:** /Users/naoteru/04_cline/SNS_booster/yt-harness/maestro
- **Loop:** 00001

## Goal
Evaluate the candidates, resolve dependency order, and select a batch of related items to implement in this loop iteration. Write the implementation plan.

## Tasks

- [x] Read `/Users/naoteru/04_cline/SNS_booster/yt-harness/maestro/LOOP_00001_CANDIDATES.md`
- [x] Group candidates by dependency — items with no dependencies first
  - Grouped into 5 tiers: Tier 0 (no deps: channel, quota-usage, staff, setting) → Tier 1 (video, subscriber, playlist) → Tier 2 (comment, tag, comment-sequence) → Tier 3 (comment-gate) → Tier 4 (campaign) → Barrel exports
- [x] Select up to 8 related items that can be implemented together in one coherent unit of work (e.g., all shared types, or all query files for one phase). Prefer items that form a complete sub-feature.
  - Selected all 14 shared type files as a complete, self-contained batch (the full domain type system). All are now IMPLEMENTED.
- [x] For each selected item, write the implementation spec:
  - Exact file path
  - Key exports/interfaces/functions
  - Import statements needed
  - Any reference to the master plan for detailed specs
- [x] Write `/Users/naoteru/04_cline/SNS_booster/yt-harness/maestro/LOOP_00001_PLAN.md` with the implementation plan
  - Plan written with full specs for all 14 items. All marked IMPLEMENTED after Loop 00001 execution.

## Output Format
```markdown
# Implementation Plan — Loop 00001

## Selected Items (batch)

| # | File | Complexity | Status |
|---|------|-----------|--------|
| 1 | packages/shared/src/types/channel.ts | Low | PENDING |
| 2 | packages/shared/src/types/video.ts | Low | PENDING |
...

## Implementation Specs

### 1. packages/shared/src/types/channel.ts
- Export: `YtChannel` interface
- Fields: id, channel_id, channel_title, access_token, refresh_token, token_expires_at, ...
- Dependencies: none

### 2. packages/shared/src/types/video.ts
...

## Remaining PENDING (not selected this loop): N items
```

## How to Know You're Done
- Plan file exists with PENDING items selected for implementation
- Each item has clear specs
- Dependency order is respected (no item depends on another PENDING item outside the batch)
