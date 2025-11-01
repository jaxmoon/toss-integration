# feature-impl: Usage Examples

Detailed scenarios showing how `feature-impl` skill works in practice.

---

## Example 1: Start New Feature (Full Flow)

### Scenario
User wants to start developing a Stripe payment integration feature.

### Initial State
```
docs/
└── features/
    └── (empty)

No techspec exists yet.
```

### Conversation

```
User: "Stripe 결제 연동 시작하고 싶어"

Skill:
  🔍 Running preflight checks...

  ✅ Git repository
  ✅ Git remote configured
     origin  https://github.com/user/project.git (fetch)
  ✅ GitHub CLI (gh) installed
  ✅ GitHub authenticated

  Feature name?
  Suggested: stripe-integration

User: [Enter]  (accept suggestion)

Skill:
  ✅ Feature: stripe-integration

  🔍 Looking for techspec...

  ❌ Techspec not found for feature: stripe-integration

  Please create it first:
    /workflows:tech-spec

User: "/workflows:tech-spec"

# (Techspec generation process...)

User: "Stripe 시작해줘"

Skill:
  ✅ Feature: stripe-integration

  🔍 Looking for techspec...
  ✓ Found in standard location: docs/features/stripe-integration/techspec.md

  ⚠️ Branch Mismatch
    Current: main
    Expected: feature/stripe-integration

  브랜치를 전환할까요?
    [전환하고 계속] [현재 브랜치에서 계속] [취소]

User: "전환하고 계속"

Skill:
  ✅ Created and switched to feature/stripe-integration

  📖 Analyzing techspec...

  Analysis complete:
    Total Tasks: 12
    Phases: 4
    Estimated Time: 5h (parallel) vs 12h (sequential)

  Agent assignments:
    - devops-infrastructure-specialist: 2 tasks
    - database-engineer-specialist: 2 tasks
    - frontend-ui-specialist: 4 tasks
    - backend-api-specialist: 3 tasks
    - security-engineer-specialist: 1 task

  Generating plan.md...
  ✅ Created: docs/features/stripe-integration/plan.md

  Creating GitHub Issues...
    ✅ #201 [stripe-integration][Phase 1] Next.js setup
    ✅ #202 [stripe-integration][Phase 1] Type definitions
    ✅ #203 [stripe-integration][Phase 2] Checkout component
    ... (12 issues total)

  ✅ Created 12 GitHub Issues

  Generating TODO.md...
  ✅ Created: docs/features/stripe-integration/TODO.md

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✅ Feature Ready: stripe-integration
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Created:
    ✓ plan.md (4 phases, 12 tasks)
    ✓ TODO.md (0% progress)
    ✓ 12 GitHub Issues

  📋 Phase 1: Foundation (2 tasks, 25min parallel)
    - #201 Next.js setup (devops-infrastructure-specialist)
    - #202 Type definitions (database-engineer-specialist)

  Start Phase 1? [Y/n]

User: "Y"

Skill:
  🚀 Starting Phase 1 (2 tasks in parallel)

  [Agent 1] Reading issue #201...
  [Agent 2] Reading issue #202...

  [Agent 1] 🔴 RED: Writing tests...
  [Agent 2] 🔴 RED: Writing tests...

  [Agent 1] 🟢 GREEN: Implementing...
  [Agent 2] 🟢 GREEN: Implementing...

  [Agent 1] 🔵 REFACTOR: Improving...
  [Agent 2] 🔵 REFACTOR: Improving...

  [Agent 1] ✅ Complete. Closing #201...
  [Agent 2] ✅ Complete. Closing #202...

  🔍 Validating Phase 1...
    ✅ npm test - 6/6 passing
    ✅ npm run build - success
    ✅ npm run lint - clean

  📝 Committing Phase 1...
  git commit -m "feat: Phase 1 완료 - Foundation

  - Next.js setup (Closes #201)
  - Type definitions (Closes #202)

  Tests: 6/6 passing"

  🔄 Syncing TODO.md with GitHub...
  ✅ TODO.md updated

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✅ Phase 1 Complete!
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  📊 Progress: 17% (2/12 tasks)

  📋 Next: Phase 2 - UI Components (4 tasks, 1.5h parallel)

  Continue? [Y/n]
```

### Result State

```
docs/features/stripe-integration/
├── techspec.md
├── plan.md
└── TODO.md

.git/branches/
└── feature/stripe-integration  ← Current branch

GitHub Issues:
  #201 ✅ Closed
  #202 ✅ Closed
  #203-#212 ⏳ Open

Commits:
  abc1234 feat: Phase 1 완료 - Foundation
```

---

## Example 2: Resume Existing Feature

### Scenario
User worked on Toss integration yesterday, now wants to continue.

### Initial State
```
docs/features/toss-integration/
├── techspec.md
├── plan.md
└── TODO.md (60% progress)

Branch: main (not on feature branch)

GitHub Issues:
  #123-#128 ✅ Closed (6 tasks)
  #129 ✅ Closed
  #130-#137 ⏳ Open (8 tasks)
```

### Conversation

```
User: "Toss feature 이어서 해줘"

Skill:
  🔍 Running preflight checks...
  ✅ All checks passed

  ✅ Feature detected: toss-integration

  🔍 Looking for techspec...
  ✓ Found in standard location: docs/features/toss-integration/techspec.md

  ⚠️ Branch Mismatch
    Current: main
    Expected: feature/toss-integration

  브랜치 전환?

User: "전환"

Skill:
  ✅ Switched to feature/toss-integration

  🔄 Syncing TODO.md with GitHub Issues...

  Checking sync...
    TODO.md: 7 tasks [x]
    GitHub: 7 issues closed
  ✅ Synced

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📊 Feature Status: toss-integration
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ✅ Branch: feature/toss-integration

  📈 Overall Progress: 47% (7/15 tasks)

  ✅ Completed: 7 tasks
    Phase 1: Foundation (3/3) ✅
    Phase 2: UI Components (3/3) ✅
    Phase 3: Core Features (1/4) 🚧

  📋 Remaining: 8 tasks
    Phase 3: Core Features (3/4)
      ⏳ #130 Toss SDK integration
      ⏳ #131 PaymentWidget component
      ⏳ #132 Pages integration

    Phase 4: Integration (3/3)
      ⏳ #133 Integration tests
      ⏳ #134 Security review
      ⏳ #135 Performance optimization

  🔗 GitHub: https://github.com/user/repo/issues?q=label:feature:toss-integration

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  📋 Next: Continue Phase 3 (3 tasks remaining, ~2h parallel)

  Continue? [Y/n]

User: "Y"

Skill:
  🚀 Starting Phase 3 remaining tasks (3 in parallel)...

  (continues execution...)
```

---

## Example 3: Custom Techspec File Path

### Scenario
User has techspec on desktop, wants to use it.

### Initial State
```
/Users/jax/Desktop/payment-integration-spec.md  ← Techspec here

docs/features/
└── (empty)
```

### Conversation

```
User: "/Users/jax/Desktop/payment-integration-spec.md 이걸로 결제 기능 만들어줘"

Skill:
  ✅ Preflight checks passed

  🔍 Looking for techspec...
  ✓ User mentioned: /Users/jax/Desktop/payment-integration-spec.md
  ✓ File exists

  Feature 이름?
  Suggested: payment-integration

User: [Enter]

Skill:
  ✅ Feature: payment-integration

  📋 Copying to standard location...
    From: /Users/jax/Desktop/payment-integration-spec.md
    To:   docs/features/payment-integration/techspec.md

  ✅ Copied successfully

  ⚠️ Branch Mismatch...
  (asks to switch to feature/payment-integration)

User: "전환"

Skill:
  ✅ Created branch: feature/payment-integration

  📖 Analyzing techspec...

  (continues with INITIALIZE mode...)
```

### Result
- Original file preserved at `/Users/jax/Desktop/payment-integration-spec.md`
- Copy created at `docs/features/payment-integration/techspec.md`
- Skill proceeds with standard workflow

---

## Example 4: Non-Standard Techspec Location

### Scenario
User has techspec in `docs/specifications/` directory.

### Initial State
```
docs/
├── specifications/
│   └── toss-payment.md  ← Techspec here
└── features/
    └── (empty)
```

### Conversation

```
User: "Toss 결제 개발 시작"

Skill:
  ✅ Preflight checks passed

  Feature?
  Suggested: toss-integration

User: [Enter]

Skill:
  ✅ Feature: toss-integration

  🔍 Looking for techspec...

  (checks standard location - not found)
  (auto-searches docs/)

  ⚠️ Found at non-standard location: docs/specifications/toss-payment.md

  표준 위치로 복사하시겠습니까?
    [Yes] [No]

User: "Yes"

Skill:
  📋 Copying to standard location...
    From: docs/specifications/toss-payment.md
    To:   docs/features/toss-integration/techspec.md

  ✅ Copied successfully

  (continues with INITIALIZE mode...)
```

---

## Example 5: Sync Mismatch Recovery

### Scenario
Agent forgot to close an issue, causing sync mismatch.

### Initial State
```
GitHub Issues:
  #123-#126 ✅ Closed
  #127 ⏳ Open (should be closed but agent forgot)
  #128 ⏳ Open

TODO.md:
  - [x] Task 1 → [#123]
  - [x] Task 2 → [#124]
  - [x] Task 3 → [#125]
  - [x] Task 4 → [#126]
  - [x] Task 5 → [#127]  ← Checked but issue still open!
  - [ ] Task 6 → [#128]
```

### Conversation

```
User: "Toss status check"

Skill:
  ✅ Feature: toss-integration

  🔄 Syncing TODO.md with GitHub...

  ⚠️ Sync Mismatch Detected!
    TODO.md: 5 tasks checked [x]
    GitHub: 4 issues closed

  Analyzing...
    Issue #127 is open but marked complete in TODO.md

  Auto-fixing...
    Using GitHub as source of truth
    Updating TODO.md...

  ✅ Sync complete

  📊 Corrected Status:
    Progress: 67% (4/6 tasks)
    - [x] Task 1-4
    - [ ] Task 5 (was incorrectly marked)
    - [ ] Task 6

  Issue #127 is still open. Would you like to:
    [Close it manually] [Review the task] [Leave as-is]

User: "Review the task"

Skill:
  📋 Issue #127: Toss SDK Integration

  Last activity: 2 hours ago
  Status: Open
  Assignee: None
  Comments: 1

  Agent reported completion but didn't close issue.

  View on GitHub? [Y/n]

User: "Y"

# (Opens browser to GitHub issue)

User: (after reviewing) "Close it"

Skill:
  gh issue close 127 --comment "Manually closed after review"

  ✅ Issue #127 closed

  🔄 Re-syncing...
  ✅ TODO.md updated (5/6 complete)
```

---

## Example 6: Partial Phase Completion

### Scenario
User wants to complete only some tasks from a phase.

### Conversation

```
User: "Toss feature, just do the PaymentWidget task"

Skill:
  ✅ Feature: toss-integration

  🔍 Looking for task "PaymentWidget"...

  Found: #131 PaymentWidget component (Phase 3)

  ⚠️ This is a parallel phase with other tasks:
    - #130 Toss SDK integration
    - #131 PaymentWidget component  ← You selected
    - #132 Pages integration

  Running single task from parallel phase may cause dependency issues.

  Proceed with just #131? [Y/n]

User: "Y"

Skill:
  🚀 Executing single task: #131

  Launching frontend-ui-specialist...

  (task executes...)

  ✅ Task #131 complete

  ⚠️ Phase 3 partially complete (2/3 tasks)
  Remaining:
    - #130 Toss SDK integration
    - #132 Pages integration

  Continue with remaining tasks? [Y/n]
```

---

## Example 7: Error Recovery

### Scenario
Build fails during phase validation.

### Conversation

```
(During Phase 2 execution...)

Skill:
  [Agent 1] ✅ Complete
  [Agent 2] ✅ Complete
  [Agent 3] ✅ Complete

  🔍 Validating Phase 2...
    ✅ npm test - 12/12 passing
    ❌ npm run build - FAILED

  Build Errors:
    Type error in components/OrderSummary.tsx:42
      Property 'totalAmount' does not exist on type 'Order'

  ⚠️ Phase 2 validation failed!

  Options:
    [Fix automatically] [Review code] [Skip validation] [Abort]

User: "Fix automatically"

Skill:
  Analyzing error...

  Issue: OrderSummary uses 'totalAmount' but Order type defines 'amount'

  Launching debugger agent...

  🔧 Fixing...
    Updated components/OrderSummary.tsx:42
      - order.totalAmount
      + order.amount

  ✅ Fixed

  Re-running validation...
    ✅ npm test - 12/12 passing
    ✅ npm run build - success

  Committing fix...
  git commit -m "fix: Correct property name in OrderSummary"

  ✅ Phase 2 validation passed

  (continues...)
```

---

## Example 8: Switching Features Mid-Session

### Scenario
User working on Toss, wants to quickly check Stripe feature.

### Conversation

```
(Currently on toss-integration)

User: "Stripe status"

Skill:
  Switching to feature: stripe-integration

  ⚠️ Current feature (toss-integration) has uncommitted changes:
    M components/PaymentWidget.tsx
    M lib/tossPayments.ts

  Options:
    [Commit changes] [Stash changes] [Discard changes] [Cancel]

User: "Stash changes"

Skill:
  git stash push -m "WIP: toss-integration"

  Switching branches...
  git checkout feature/stripe-integration

  📊 Feature Status: stripe-integration
  (shows status...)

User: "Back to Toss"

Skill:
  Switching to feature: toss-integration

  git checkout feature/toss-integration

  Unstashing previous work...
  git stash pop

  ✅ Resumed toss-integration
```

---

## Example 9: Manual Agent Override

### Scenario
User disagrees with Claude's agent assignment.

### Initial State
```
plan.md (generated):
  | Task | Agent | Duration |
  | Checkout flow | frontend-ui-specialist | 1h |
```

### Action

User edits `plan.md`:
```markdown
| Task | Agent | Duration |
| Checkout flow | frontend-state-specialist | 1h |
  ← Changed from frontend-ui to frontend-state
```

### Conversation

```
User: "Start Phase 3"

Skill:
  Reading plan.md...

  ⚠️ Detected manual changes to agent assignments:
    Task "Checkout flow"
      Original: frontend-ui-specialist
      Updated:  frontend-state-specialist

  Use updated assignment? [Y/n]

User: "Y"

Skill:
  ✅ Using frontend-state-specialist for Checkout flow

  🚀 Starting Phase 3...

  Launching frontend-state-specialist for task #130...

  (continues...)
```

---

## Example 10: Skill Exit and Resume

### Scenario
User needs to stop work, resume next day.

### Day 1: Exit

```
(During Phase 3 execution...)

User: (Ctrl+C or closes terminal)

Skill:
  ⚠️ Interruption detected

  🔄 Final sync before exit...

  Uncommitted changes:
    M app/checkout/page.tsx
    ?? components/CheckoutForm.tsx

  Commit changes? [Y/n]

User: "Y"

  Commit message?

User: "wip: Checkout page implementation"

Skill:
  git commit -m "wip: Checkout page implementation"

  🔄 Syncing TODO.md with GitHub...
  ✅ Synced

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✅ Session Complete: toss-integration
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  📊 Progress: 73% (11/15 tasks)
  🔗 GitHub: https://github.com/user/repo/issues?q=label:feature:toss-integration
  🌿 Branch: feature/toss-integration

  To resume:
    "Resume toss-integration"

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Day 2: Resume

```
User: "Resume toss-integration"

Skill:
  ✅ Feature: toss-integration

  🔄 Syncing...
  ✅ Synced (11/15 complete)

  📊 Status: 73% complete

  Last commit: wip: Checkout page implementation (23 hours ago)

  📋 Next: Phase 4 - Integration (3 tasks)

  Continue? [Y/n]
```

---

## Tips & Tricks

### Tip 1: Quick Status Check
```
"Check toss status"
"Toss progress"
"Show toss feature"
```

### Tip 2: View GitHub Issues
```
"Show toss issues"
→ Opens browser to GitHub issues with feature label
```

### Tip 3: Force Sync
```
"Sync toss TODO"
→ Manually trigger TODO.md ↔ GitHub sync
```

### Tip 4: Skip to Specific Phase
```
"Start Phase 4 for toss"
→ Skips to Phase 4 (useful if earlier phases done manually)
```

### Tip 5: Retry Failed Task
```
"Retry task #126"
→ Re-executes specific task
```

---

## Common Patterns

### Pattern 1: Start → Complete → Review
```
1. "Start {feature}"
2. Let skill run through all phases
3. "Check {feature} status"
4. Review code on GitHub
5. Merge PR
```

### Pattern 2: Incremental Development
```
1. "Start {feature}"
2. Complete Phase 1
3. (Test manually)
4. "Continue {feature}" for Phase 2
5. (Test again)
6. Repeat
```

### Pattern 3: Parallel Features
```
1. "Start toss feature"
2. (Work on Phase 1)
3. "Switch to stripe feature"
4. (Work on Stripe Phase 1)
5. "Back to toss"
6. (Continue Toss Phase 2)
```

---

## Version

**v1.0.0** - Initial examples (2025-11-02)
