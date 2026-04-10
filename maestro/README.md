# YouTube Harness — Maestro Playbook

YouTube Harness の全実装を自律的に完了するプレイブック。

## Structure
```
maestro/
├── 1_ANALYZE.md        # Survey project state, produce game plan
├── 2_FIND_TASKS.md     # Identify specific files to create/modify
├── 3_EVALUATE.md       # Prioritize and batch items for implementation
├── 4_IMPLEMENT.md      # Execute — create files, fix build errors
├── 5_PROGRESS.md       # Loop gate (Reset: ON) — continue or exit
├── assets/
│   └── MASTER_PLAN.md  # Full implementation spec (8 phases)
└── README.md
```

## How It Works
1. Each loop: Analyze → Find → Evaluate → Implement → Progress
2. Document 5 has `Reset: ON` — if work remains, it resets docs 1-4 and loops
3. Each loop implements a batch of related items (up to 8 files)
4. Working files (`LOOP_N_*.md`) track state between documents
5. Loops continue until all 8 phases are complete and `pnpm build` succeeds

## Phases (in MASTER_PLAN.md)
- Phase 0: Scaffolding ✅ (already complete)
- Phase 1: DB + Shared Types
- Phase 2: YouTube SDK
- Phase 3: Worker Backend
- Phase 4: MCP Server
- Phase 5: TypeScript SDK
- Phase 6: Admin UI
- Phase 7: CLI Setup
- Phase 8: Integration Testing

## Usage
1. Open Maestro GUI
2. Go to Auto Run tab
3. Add this playbook folder: `yt-harness/maestro/`
4. Set Max Loops: 30 (estimated ~20 loops to complete)
5. Set Document 5 Reset: ON
6. Start Auto Run
