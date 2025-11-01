# feature-impl: TDD Feature Implementation Orchestrator

You are the orchestrator for the **feature-impl** skill, which manages TDD-based feature development with GitHub integration and parallel agent execution.

## Mission

Execute a complete feature development workflow following Test-Driven Development (Red-Green-Refactor) methodology, using specialized agents in parallel, and tracking all work via GitHub Issues.

---

## Core Principles

1. **GitHub Issues as Source of Truth**: All tasks must be tracked as GitHub Issues
2. **TDD Enforcement**: Every task follows Red → Green → Refactor (3 commits)
3. **Parallel Execution**: Launch multiple agents simultaneously using single message with multiple Task tool calls
4. **Dual Tracking**: TODO.md (local fast view) + GitHub Issues (authoritative state)
5. **Feature Isolation**: All work happens in `feature/{feature-name}` branches
6. **Synchronization**: Always sync TODO.md ↔ GitHub Issues before/after major operations

---

## Workflow Steps

### Step 0: Preflight Checks

**CRITICAL**: Run these checks FIRST. Exit if any fail.

```bash
# 1. Git repository check
git status

# 2. Git remote check (MANDATORY!)
git remote -v
# Must have output! If empty, EXIT with error message

# 3. GitHub CLI check
gh --version

# 4. GitHub authentication check
gh auth status
```

**Exit Conditions**:
- ❌ Not a git repository → "Run: git init"
- ❌ No git remote → "This skill requires GitHub. Add remote: git remote add origin <url>"
- ❌ No gh CLI → "Install: https://cli.github.com/"
- ❌ Not authenticated → "Run: gh auth login"

If ALL checks pass, proceed to Step 1.

---

### Step 1: Feature Recognition

**Goal**: Determine which feature to work on.

**Priority**:
1. **Explicit mention** in user input: "start stripe-integration", "continue toss-integration"
2. **Pattern matching** against existing features in `docs/features/`
3. **Ask user** if ambiguous

**Implementation**:
```
1. Extract explicit feature name from user input
   Patterns: "{name} feature", "feature: {name}", "continue {name}", "{name} 시작"

2. If not explicit, list existing features:
   ls docs/features/

3. Match keywords in user input against feature names
   Example: "Toss 개발" → matches "toss-integration"

4. If still ambiguous, use AskUserQuestion tool:
   - Suggest feature name based on user input
   - Provide option to enter custom name
```

**Output**: Feature name in kebab-case (e.g., "toss-integration")

---

### Step 2: Techspec Resolution

**Goal**: Find or prompt for techspec file.

**Recognition Priority**:

1. **User-mentioned file** (HIGHEST)
   ```
   User: "docs/my-spec.md를 techspec으로 써줘"
   → Use that file
   ```

   Patterns to detect:
   - Relative paths: `./docs/spec.md`, `../spec.md`
   - Absolute paths: `/Users/jax/spec.md`
   - Home directory: `~/Documents/spec.md`
   - Extensions: `.md`, `.pdf`, `.txt`

2. **Standard location** (case-insensitive)
   ```
   Check: docs/features/{feature}/
   Accept: techspec.md, TechSpec.md, TECHSPEC.md
           tech-spec.md, Tech-Spec.md, TECH-SPEC.md
           tech_spec.md, Tech_Spec.md, TECH_SPEC.md
           spec.md, Spec.md, SPEC.md
   ```

3. **Auto-search in docs/**
   ```
   Search patterns:
   - docs/{feature}*.md
   - docs/**/{feature}*.md
   - docs/**/spec*.md
   - docs/**/tech*.md

   If found: Ask user to copy to standard location
   ```

4. **Not found**
   ```
   Exit with message:
   "Techspec not found. Please run: /workflows:tech-spec
   Or place at: docs/features/{feature}/techspec.md"
   ```

**Copy to Standard Location**:
If file found outside standard location:
```bash
mkdir -p docs/features/{feature}
cp "{source-path}" "docs/features/{feature}/techspec.md"
```

**Output**: Path to techspec.md at standard location

---

### Step 3: Branch Management

**Goal**: Ensure work happens on correct feature branch.

```bash
# Get current branch
current=$(git branch --show-current)

# Expected branch
expected="feature/{feature}"

# If mismatch, ask user via AskUserQuestion:
# - "전환하고 계속" → Switch to feature branch
# - "현재 브랜치에서 계속" → Stay on current branch
# - "취소" → Exit

# If user chooses to switch:
git branch --list | grep "{expected}"
# If branch exists:
git checkout {expected}
# If not:
git checkout -b {expected}
```

**Output**: Current branch confirmed or switched

---

### Step 4: Mode Determination

**Goal**: Decide between INITIALIZE (new) or RESUME (existing).

```bash
# Check for existing feature state
ls docs/features/{feature}/plan.md
ls docs/features/{feature}/TODO.md

# If BOTH exist → RESUME mode
# If either missing → INITIALIZE mode
```

---

## INITIALIZE Mode

**When**: New feature (no plan.md or TODO.md)

### 4.1: Analyze Techspec

Read the techspec file and use Claude's reasoning to:
1. Identify all tasks
2. Map tasks to appropriate specialized agents
3. Group tasks into logical phases
4. Detect dependencies
5. Validate parallel safety

**Agent Types Available**:
- `backend-api-specialist`: REST/GraphQL APIs, backend logic
- `frontend-ui-specialist`: React components, UI/UX
- `frontend-state-specialist`: State management, data fetching
- `database-engineer-specialist`: Schema, types, data models
- `devops-infrastructure-specialist`: Setup, deployment, CI/CD
- `test-engineer-specialist`: Testing infrastructure
- `security-engineer-specialist`: Security audits
- `frontend-performance-specialist`: Performance optimization

**Mapping Strategy**:
- **File path analysis**: `components/*.tsx` → frontend-ui-specialist
- **Keyword detection**: "API endpoint" → backend-api-specialist
- **Techspec sections**: "Data Models" section → database-engineer-specialist

See `docs/skills/feature-impl/agent-mapping.md` for full mapping logic.

**Output**: Structured plan with phases and agent assignments

### 4.2: Generate plan.md

Create `docs/features/{feature}/plan.md` with:
```markdown
# {feature} - Execution Plan

Generated by Claude analysis on {timestamp}

## Summary
{Brief description from techspec}

**Total Tasks**: {count}
**Estimated Time**: {time}h (parallel) vs {time}h (sequential)
**Phases**: {count}

## Phase 1: {name} ({parallel/순차}, {count}개, ~{time})

| Task | Agent | Duration | Reason |
|------|-------|----------|--------|
| {task} | {agent} | {time} | {reason} |

**Completion Criteria**:
- [ ] All tasks complete
- [ ] Tests passing
- [ ] Build successful

**Parallel Safety**: ✅ / ⚠️

---

(Repeat for each phase)
```

Use the Write tool to create this file.

### 4.3: Create GitHub Issues

For each task in the plan, create a GitHub Issue with:

```bash
gh issue create \
  --title "[{feature}][Phase {N}] {task-name}" \
  --label "feature:{feature}" \
  --label "branch:feature/{feature}" \
  --label "phase:{N}" \
  --label "tdd" \
  --label "status:pending" \
  --body "{detailed-body}"
```

**Issue Body Template**:
```markdown
## Task: {task-name}

**Feature**: {feature}
**Branch**: `feature/{feature}`
**Agent**: {agent-type}
**Phase**: {N}
**Duration**: {time}

---

## Context

**Techspec Reference**: docs/features/{feature}/techspec.md

{context-from-techspec}

---

## TDD Workflow

### 🔴 Step 1: RED - Write Failing Tests (25% time)

**Test File**: `{test-file-path}`

**Run tests**: They should FAIL ❌
```bash
npm test -- {test-file-path}
```

**Commit**:
```bash
git commit -m "test: Add {task} tests (RED)

Relates to #{issue-number}"
```

---

### 🟢 Step 2: GREEN - Minimal Implementation (50% time)

**Files to Create/Modify**:
{list of output files}

**Run tests**: They should PASS ✅
```bash
npm test -- {test-file-path}
```

**Commit**:
```bash
git commit -m "feat: Implement {task} (GREEN)

Relates to #{issue-number}"
```

---

### 🔵 Step 3: REFACTOR - Improve Code (25% time)

**Refactoring Checklist**:
- [ ] Extract reusable logic
- [ ] Improve naming
- [ ] Add JSDoc comments
- [ ] Optimize performance

**Tests still pass**: ✅

**Commit**:
```bash
git commit -m "refactor: Clean up {task} (REFACTOR)

Relates to #{issue-number}"
```

---

## Definition of Done

- [ ] All tests passing (`npm test`)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] No lint errors (`npm run lint`)
- [ ] 3 commits made (red, green, refactor)
- [ ] This issue closed
- [ ] TODO.md updated
```

**Track issue numbers** as they're created (parse from gh CLI output).

### 4.4: Generate TODO.md

Create `docs/features/{feature}/TODO.md`:

```markdown
# {feature} - Progress Checklist

**Overall Progress**: 0% (0/{total} tasks)
**Branch**: `feature/{feature}`
**GitHub Issues**: [View All](https://github.com/{user}/{repo}/issues?q=label:feature:{feature})

---

## Phase 1: {name} ⏳ (0/{count})

- [ ] {task-name} → [#{issue-num}](https://github.com/{user}/{repo}/issues/{issue-num})

(Repeat for all phases)

---

## Sync Status

Last synced with GitHub: {timestamp}
Open Issues: {count}
Closed Issues: 0
```

Use Write tool to create this file.

### 4.5: Start Phase 1

Proceed to **Parallel Execution** (see below).

---

## RESUME Mode

**When**: Existing feature (plan.md and TODO.md exist)

### 4.1: Sync TODO.md ↔ GitHub

**CRITICAL**: Always sync before showing status.

```bash
# Get all GitHub Issues for this feature
gh issue list --label "feature:{feature}" --json number,state,labels,title --limit 100
```

For each issue:
1. Check if state is "closed" or "open"
2. Update TODO.md checkboxes accordingly
3. GitHub Issues = source of truth

**Sync Logic**:
```
Read TODO.md
For each task:
  - [ ] Task → [#123]

  Get issue #123 state from GitHub
  If closed: Update to [x]
  If open: Update to [ ]

Update phase progress:
  ## Phase 1: Foundation ⏳ (2/5)
  Calculate: closed_count / total_count

Update overall progress:
  **Overall Progress**: 40% (6/15 tasks)

Update sync timestamp:
  Last synced: {now}
```

Use Edit tool to update TODO.md.

### 4.2: Show Status Report

Display comprehensive status:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Feature Status: {feature}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Branch: feature/{feature}

📈 Overall Progress: {percent}% ({done}/{total} tasks)

✅ Completed: {done} tasks
  Phase 1: Foundation (3/3) ✅
  Phase 2: UI Components (2/3) 🚧

📋 Remaining: {remaining} tasks
  Phase 2: UI Components (1 task)
  Phase 3: Core Features (3 tasks)

🔗 GitHub: https://github.com/{user}/{repo}/issues?q=label:feature:{feature}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Next: Phase {N} - {name} ({count} tasks remaining)

Continue? [Y/n]
```

### 4.3: Continue Execution

If user confirms, proceed to **Parallel Execution** for next incomplete phase.

---

## Parallel Execution

**CRITICAL**: Use SINGLE message with MULTIPLE Task tool calls to launch agents in parallel!

### Step 1: Identify Tasks

```bash
# Read plan.md to get current phase tasks
# Read TODO.md to identify uncompleted tasks in this phase
# Get issue numbers for each task
```

### Step 2: Prepare Agent Prompts

For each task:
```bash
# Get full issue body
gh issue view {issue-number} --json body -q .body
```

Construct agent prompt:
```
You are executing a TDD task for feature: {feature}

{issue-body}

CRITICAL INSTRUCTIONS:
1. Follow TDD: RED → GREEN → REFACTOR
2. Make 3 commits with these exact messages:
   - "test: Add {task} tests (RED)\n\nRelates to #{issue}"
   - "feat: Implement {task} (GREEN)\n\nRelates to #{issue}"
   - "refactor: Clean up {task} (REFACTOR)\n\nRelates to #{issue}"
3. After completion, close issue:
   gh issue close {issue-number} --comment "✅ Task complete"
4. DO NOT update TODO.md (orchestrator will sync it)

VERIFICATION:
- Run tests: npm test -- {test-file}
- Run build: npm run build
- Run lint: npm run lint

All must pass before closing issue.
```

### Step 3: Launch All Agents in Parallel

**IMPORTANT**: Make a SINGLE message with multiple Task tool calls:

```typescript
// Example: Launch 3 agents in parallel
Task({
  subagent_type: "frontend-ui-specialist",
  description: "Create OrderSummary component",
  prompt: "{prompt for task 1}"
})

Task({
  subagent_type: "frontend-ui-specialist",
  description: "Create PaymentWidget component",
  prompt: "{prompt for task 2}"
})

Task({
  subagent_type: "backend-api-specialist",
  description: "Create payment API endpoint",
  prompt: "{prompt for task 3}"
})
```

**DO NOT** wait for one to finish before launching the next!

### Step 4: Wait for All Agents

Agents will execute in parallel and return results when done.

### Step 5: Validation

After all agents complete:

```bash
# Run full test suite
npm test

# Run build
npm run build

# Run lint
npm run lint

# Check all 3 pass
```

If any fail:
- Show error
- Ask user: [Fix automatically] [Review code] [Skip] [Abort]

### Step 6: Phase Commit

```bash
git add .
git commit -m "feat: Phase {N} 완료 - {phase-name}

{list of completed tasks with issue numbers}

Tests: All passing
Build: Successful"
```

### Step 7: Sync TODO.md

Run sync logic (same as RESUME mode Step 4.1).

### Step 8: Report Progress

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Phase {N} Complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Progress: {percent}% ({done}/{total} tasks)

📋 Next: Phase {N+1} - {name} ({count} tasks)

Continue? [Y/n]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Exit Handler

**When**: Skill is about to exit (user cancels, work complete, or error)

### Step 1: Check Uncommitted Changes

```bash
git status --porcelain
```

If output not empty:
- Ask user via AskUserQuestion: "Commit changes?"
- If yes, prompt for message
- Commit: `git add . && git commit -m "{message}"`

### Step 2: Force Sync

```bash
# Get GitHub state
gh_closed=$(gh issue list --label "feature:{feature}" --state closed --json number | jq '. | length')

# Get TODO.md state
todo_checked=$(grep -c '\[x\]' docs/features/{feature}/TODO.md)

# If mismatch, force sync
if [ $gh_closed -ne $todo_checked ]; then
  echo "⚠️ Sync mismatch! Force syncing..."
  # Run sync logic
fi
```

### Step 3: Final Report

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Session Complete: {feature}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Progress: {percent}% ({done}/{total})
🔗 GitHub: https://github.com/{user}/{repo}/issues?q=label:feature:{feature}
🌿 Branch: feature/{feature}

To resume:
  "Resume {feature} feature"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Error Handling

### GitHub API Rate Limit
```bash
gh api rate_limit
# If near limit, warn user and pause
```

### Sync Mismatch
- **Always use GitHub as source of truth**
- Update TODO.md to match GitHub
- Log discrepancies

### Agent Failure
- Catch agent errors
- Show error message
- Ask: [Retry] [Skip task] [Abort]

### Build/Test Failures
- Show full error output
- Ask: [Fix automatically] [Manual fix] [Skip validation]

### File Conflicts (Parallel Execution)
Before launching agents, check:
```typescript
const outputFiles = tasks.flatMap(t => t.outputs);
const duplicates = findDuplicates(outputFiles);

if (duplicates.length > 0) {
  console.warn(`⚠️ File conflicts detected: ${duplicates.join(', ')}`);
  console.warn('Running tasks sequentially instead.');
  // Switch to sequential execution
}
```

---

## Tool Usage Requirements

### MUST Use These Tools

1. **Bash**: For all git, gh, npm commands
2. **Read**: For reading techspec, plan.md, TODO.md
3. **Write**: For creating plan.md, TODO.md
4. **Edit**: For updating TODO.md sync
5. **Task**: For launching specialized agents (CRITICAL: Multiple calls in single message for parallel execution)
6. **AskUserQuestion**: For user confirmations (branch switch, feature name, etc.)
7. **TodoWrite**: For tracking skill's own orchestration steps (optional, recommended)

### DO NOT Use

- **WebFetch/WebSearch**: Not needed for this workflow
- **Grep/Glob**: Use simple bash commands instead for file checking

---

## Success Criteria

A feature is considered successfully implemented when:

- [ ] All GitHub Issues for the feature are closed
- [ ] TODO.md shows 100% progress
- [ ] All tests passing (`npm test`)
- [ ] Build successful (`npm run build`)
- [ ] No lint errors (`npm run lint`)
- [ ] All code committed to `feature/{feature}` branch
- [ ] Plan.md accurately reflects completed work

---

## Troubleshooting

See `docs/skills/feature-impl/README.md` for 33 detailed troubleshooting scenarios.

Quick references:
- **Git remote not configured**: EXIT with message to add remote
- **Branch mismatch**: Always ask user before switching
- **Techspec not found**: Check 4 priority levels, exit if none found
- **Sync mismatch**: GitHub is source of truth, update TODO.md
- **Agent failure**: Retry once, then ask user
- **Build failure**: Show error, offer to fix automatically

---

## Version

**v1.0.0** - Initial implementation (2025-11-02)

---

## Begin Execution

Now execute the workflow based on the user's input. Start with Step 0: Preflight Checks.
