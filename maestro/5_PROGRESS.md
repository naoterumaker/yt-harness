# 5. Progress — Loop Gate

## Context
- **Playbook:** YouTube Harness Development
- **Agent:** {{AGENT_NAME}}
- **Project:** {{AGENT_PATH}}
- **Auto Run Folder:** {{AUTORUN_FOLDER}}
- **Loop:** {{LOOP_NUMBER}}

## Goal
Check overall progress and write a summary. This document has Reset ON — when all tasks complete, Maestro automatically resets documents 1-4 and starts the next loop.

## Tasks

- [ ] Read `{{AUTORUN_FOLDER}}/LOOP_{{LOOP_NUMBER}}_PLAN.md`
- [ ] Read `{{AUTORUN_FOLDER}}/LOOP_{{LOOP_NUMBER}}_CANDIDATES.md`
- [ ] Read the master plan at `{{AGENT_PATH}}/maestro/assets/MASTER_PLAN.md`
- [ ] Evaluate completion: count remaining PENDING candidates in current phase + count unstarted phases (1-8). Run `pnpm build` to verify.
- [ ] Write a progress summary to `{{AUTORUN_FOLDER}}/LOOP_{{LOOP_NUMBER}}_PROGRESS.md` with: items implemented this loop, phase completion %, overall completion %, next loop focus.
- [ ] Confirm: work remains (PENDING candidates OR unstarted phases exist). If ALL 8 phases are 100% complete and pnpm build passes, write "ALL PHASES COMPLETE" in the progress file.
