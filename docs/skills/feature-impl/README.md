# Skill: feature-impl

**TDD Feature Implementation Workflow with GitHub Integration**

---

## Overview

`feature-impl` is a comprehensive workflow skill that orchestrates feature development using:
- **TDD (Test-Driven Development)**: Red-Green-Refactor methodology
- **Parallel Agent Execution**: 60% time savings
- **GitHub Issues Integration**: Centralized task tracking
- **Automatic Agent Mapping**: Claude analyzes techspec and assigns optimal agents
- **Context Preservation**: Never lose progress between sessions

---

## Quick Start

```bash
# 1. Ensure requirements are met
git remote -v                    # GitHub remote required
gh auth status                   # GitHub CLI authentication

# 2. Create techspec (or use existing)
/workflows:tech-spec             # Generate techspec

# 3. Start feature development
"Start [feature-name] feature"
```

---

## Requirements

### Essential
- ✅ **Git repository** with remote configured
- ✅ **GitHub CLI** (`gh`) installed and authenticated
- ✅ **GitHub repository** (for Issues)

### Optional but Recommended
- Techspec file (can be generated with `/workflows:tech-spec`)

---

## Features

### 🎯 Feature-Based Workflow
```
docs/
└── features/
    ├── toss-integration/
    │   ├── techspec.md      # INPUT
    │   ├── plan.md          # Generated
    │   └── TODO.md          # Synced with GitHub
    └── stripe-integration/
        └── ...
```

### 📝 Flexible Techspec Recognition
Recognizes techspec files with various names (case-insensitive):
- `techspec.md`, `TechSpec.md`, `TECHSPEC.md`
- `tech-spec.md`, `Tech-Spec.md`
- `tech_spec.md`, `TECH_SPEC.md`
- `spec.md`, `Spec.md`, `SPEC.md`

User-mentioned files take priority:
```
"Use docs/my-spec.md to start payment feature"
"/Users/jax/Desktop/spec.pdf as techspec"
```

### 🤖 Automatic Agent Mapping
Claude analyzes techspec and maps tasks to specialized agents:
- API endpoints → `backend-api-specialist`
- React components → `frontend-ui-specialist`
- Type definitions → `database-engineer-specialist`
- Infrastructure → `devops-infrastructure-specialist`

### 🔄 GitHub Issues Integration
- All tasks tracked as GitHub Issues
- Labels: `feature:{name}`, `branch:{name}`, `phase:{n}`, `tdd`
- Automatic issue creation and closing
- TODO.md ↔ GitHub Issues synchronization

### ⚡ Parallel Execution
Execute multiple tasks simultaneously:
- Phase 1: 3 agents in parallel → 30min (vs 1.5h sequential)
- Phase 2: 3 agents in parallel → 1h (vs 3h sequential)
- **Total: 60% time savings**

### 🔒 Context Preservation
Resume work anytime:
```bash
git log --oneline -10                          # What's done
cat docs/features/{feature}/TODO.md           # What's left
gh issue list --label feature:{feature}       # GitHub status
```

---

## Usage Examples

### Example 1: Start New Feature

```
User: "Start Stripe payment integration"

Skill:
  ✅ Git remote configured
  ✅ GitHub authenticated

  Feature name? → "stripe-integration"
  Techspec not found.

User: "/workflows:tech-spec"  # Generate techspec

User: "Start Stripe feature"

Skill:
  📖 Analyzing techspec...
  ✅ 12 tasks identified, 4 phases planned
  ✅ Agents mapped automatically
  ✅ Created plan.md, TODO.md
  ✅ Created 12 GitHub Issues

  Phase 1 (3 tasks, 30min parallel)?
```

### Example 2: Resume Existing Feature

```
User: "Continue toss-integration"

Skill:
  ✅ Feature: toss-integration
  ✅ Branch: feature/toss-integration
  🔄 Syncing TODO.md ↔ GitHub...

  📊 Progress: 60% (9/15 tasks)
  ✅ Phase 1-2 complete
  🚧 Phase 3 in progress (1/4)

  Continue Phase 3?
```

### Example 3: Use Custom Techspec File

```
User: "docs/payment-spec.md를 techspec으로 써서 결제 기능 만들어줘"

Skill:
  ✓ File found: docs/payment-spec.md

  Feature name? → "payment-feature"

  → Copying to docs/features/payment-feature/techspec.md
  ✅ Ready!

  (proceeds with analysis...)
```

---

## Workflow

### Step 0: Preflight Checks
- ✅ Git repository
- ✅ Git remote (GitHub)
- ✅ GitHub CLI installed
- ✅ GitHub authenticated

### Step 1: Feature Recognition
- Auto-detect from user input
- Match existing features in `docs/features/`
- Suggest feature name if not found

### Step 2: Techspec Resolution
1. User-mentioned file (highest priority)
2. Standard location (`docs/features/{feature}/techspec.md`)
3. Auto-search in `docs/`
4. Prompt to create if not found

### Step 3: Branch Management
- Check current branch
- Switch to `feature/{feature}` (with confirmation)
- Create branch if doesn't exist

### Step 4: Mode Determination
- **INITIALIZE**: No plan.md/TODO.md → New feature
- **RESUME**: Existing plan.md/TODO.md → Continue feature

### INITIALIZE Mode
1. Analyze techspec (Claude)
2. Map agents automatically
3. Generate plan.md
4. Create GitHub Issues
5. Generate TODO.md
6. Start Phase 1

### RESUME Mode
1. Sync TODO.md ↔ GitHub Issues
2. Show progress report
3. Identify next task
4. Continue execution

### Parallel Execution
- Launch multiple agents in single message
- Each agent follows TDD (Red-Green-Refactor)
- Agents close issues upon completion
- Validate → Commit → Sync

### Exit
- Check uncommitted changes
- Force sync TODO.md ↔ GitHub
- Show final progress report

---

## File Structure

### Input
```
docs/features/{feature}/
└── techspec.md         # User provides (various names accepted)
```

### Generated
```
docs/features/{feature}/
├── plan.md            # Execution plan with agent mapping
└── TODO.md            # Progress checklist (synced with GitHub)
```

### GitHub
```
Issues:
  #123 [feature-name][Phase 1] Task Name

Labels:
  - feature:{feature-name}
  - branch:feature/{feature-name}
  - phase:{1-5}
  - tdd
  - status:pending/in-progress/done
```

---

## TDD Enforcement

Every task follows strict TDD:

### 🔴 RED: Write Failing Tests
- Write tests first
- Run tests → Should FAIL
- Commit: `test: Add {component} tests`

### 🟢 GREEN: Minimal Implementation
- Implement just enough to pass tests
- Run tests → Should PASS
- Commit: `feat: Implement {component}`

### 🔵 REFACTOR: Improve Code
- Refactor without changing behavior
- Tests still pass
- Commit: `refactor: Clean up {component}`

**3 commits minimum per task**

---

## Synchronization

### TODO.md ↔ GitHub Issues

TODO.md serves as fast local view, GitHub Issues as source of truth.

**Automatic Sync**:
- After each phase completion
- On skill resume
- On skill exit

**Sync Status**:
```markdown
## Sync Status
Last synced: 2025-11-02T10:00:00Z
Open Issues: 6
Closed Issues: 9
```

**Mismatch Detection**:
```
⚠️ Sync mismatch!
  TODO.md: 8 tasks checked
  GitHub: 6 issues closed

  Auto-fixing...
```

---

## Agent Types

Available specialized agents:
- `backend-api-specialist`: REST/GraphQL APIs
- `frontend-ui-specialist`: React components, UI/UX
- `frontend-state-specialist`: State management, data fetching
- `database-engineer-specialist`: Schema, types, data models
- `devops-infrastructure-specialist`: Setup, deployment, CI/CD
- `test-engineer-specialist`: Testing infrastructure
- `security-engineer-specialist`: Security audits
- `frontend-performance-specialist`: Performance optimization

Claude automatically selects the best agent for each task.

---

## Troubleshooting

### Setup Issues

#### "Git remote not configured"
```bash
git remote add origin https://github.com/user/repo.git
# or
git remote add origin git@github.com:user/repo.git

# Verify
git remote -v
```

#### "GitHub not authenticated"
```bash
gh auth login

# If token expired
gh auth refresh

# Check status
gh auth status
```

#### "GitHub CLI not found"
```bash
# macOS
brew install gh

# Ubuntu/Debian
sudo apt install gh

# Windows
winget install GitHub.cli

# Verify
gh --version
```

---

### GitHub Issues Problems

#### "Failed to create issue"

**Cause**: API rate limit exceeded
```bash
# Check rate limit
gh api rate_limit

# Wait or use different token
gh auth login --with-token < new_token.txt
```

**Cause**: Insufficient permissions
```bash
# Check repository permissions
gh repo view --json permissions

# Need "Issues: Write" permission
# Ask repository admin to grant access
```

**Cause**: Network error
```bash
# Check connection
curl -I https://api.github.com

# Retry with timeout
gh issue create ... --retry 3
```

#### "Issue creation partially failed"

Some issues created, some failed:
```
✅ Created: #123, #124, #125
❌ Failed: #126, #127

Options:
  [Retry failed] [Continue anyway] [Abort]
```

**Solution**: Retry failed issues
```bash
# Skill will automatically retry failed issues
# Or manually create:
gh issue create --title "[feature][Phase N] Task" ...
```

---

### Branch Issues

#### "Cannot switch branch: uncommitted changes"
```
⚠️ Uncommitted changes:
  M components/PaymentWidget.tsx
  M lib/tossPayments.ts

Options:
  [Commit changes] [Stash changes] [Discard changes] [Cancel]
```

**Recommended**: Commit or stash
```bash
# Commit
git add .
git commit -m "wip: Work in progress"

# Or stash
git stash push -m "WIP: feature work"

# Resume later
git stash pop
```

#### "Branch already exists with conflicts"
```bash
# View conflict
git status

# Resolve manually
git merge --abort  # Cancel merge
git checkout main
git branch -D feature/old-branch  # Delete old branch
git checkout -b feature/new-branch  # Create fresh branch
```

#### "Detached HEAD state"
```bash
# Check current state
git status

# Create branch from current commit
git checkout -b feature/rescue-branch

# Or return to main
git checkout main
```

---

### Techspec Issues

#### "Techspec not found"
```bash
# Option 1: Generate with workflow
/workflows:tech-spec

# Option 2: Specify file path
"Use /path/to/spec.md as techspec"

# Option 3: Place at standard location
mkdir -p docs/features/{feature}
mv your-spec.md docs/features/{feature}/techspec.md
```

#### "Invalid techspec format"
```
❌ Failed to parse techspec.md

Error: Missing required section "Component Design"
```

**Solution**: Ensure techspec has required sections
```markdown
# Required sections:
## 1. Overview
## 2. Requirements
## 3. Architecture & Design
## 4. Implementation Plan
```

#### "File permission denied"
```bash
# Check permissions
ls -l /path/to/techspec.md

# Fix permissions
chmod 644 /path/to/techspec.md
```

---

### Execution Issues

#### "Agent execution failed"
```
[Agent 1] ❌ Error: npm test failed

Error details:
  FAIL __tests__/component.test.tsx
    TypeError: Cannot read property 'x' of undefined
```

**Options**:
- **Retry**: Re-run the same agent
- **Fix manually**: Edit code and mark task complete
- **Skip task**: Continue with other tasks (not recommended)

**Debugging**:
```bash
# Run tests locally
npm test -- __tests__/component.test.tsx

# Check agent logs
cat .claude/logs/agent-{id}.log

# Review issue description
gh issue view {number}
```

#### "Tests passing locally but failing in agent"
```bash
# Check Node version
node --version

# Check dependencies
npm list

# Clean install
rm -rf node_modules package-lock.json
npm install

# Clear cache
npm cache clean --force
```

#### "Build fails during validation"
```
🔍 Validating Phase 2...
  ✅ npm test - passing
  ❌ npm run build - FAILED

Error: Type error in components/OrderSummary.tsx:42
```

**Auto-fix option**:
```
Options:
  [Fix automatically] [Review code] [Skip validation] [Abort]
```

**Manual fix**:
```bash
# Fix the error
vim components/OrderSummary.tsx

# Re-run build
npm run build

# Resume skill
"Continue {feature}"
```

---

### Synchronization Issues

#### "TODO.md ↔ GitHub sync failed"
```
❌ Sync failed: Cannot write to TODO.md

Error: EACCES: permission denied
```

**Solution**:
```bash
# Check file permissions
ls -l docs/features/{feature}/TODO.md

# Fix permissions
chmod 644 docs/features/{feature}/TODO.md

# Retry sync
"Sync {feature} TODO"
```

#### "GitHub API unreachable during sync"
```
⚠️ Cannot reach GitHub API

Continuing with local TODO.md only.
Sync will retry on next operation.
```

**No action needed** - Skill will retry automatically

#### "Conflicting states"
```
⚠️ Conflict detected:
  TODO.md: Task #125 is [x] complete
  GitHub: Issue #125 is open
  Git log: No commit mentioning #125

Source of truth?
  [GitHub] [TODO.md] [Manual review]
```

**Recommended**: Choose GitHub (always source of truth)

---

### Parallel Execution Issues

#### "File conflict detected"
```
❌ Cannot run tasks in parallel: File conflicts

Conflicts:
  Task A outputs: components/Payment.tsx
  Task B outputs: components/Payment.tsx

These tasks will run sequentially instead.
```

**Solution**: Edit `plan.md` to separate conflicting tasks into different phases

#### "One agent succeeded, others failed"
```
Phase 2 execution:
  ✅ Agent 1: Complete
  ✅ Agent 2: Complete
  ❌ Agent 3: Failed

Options:
  [Retry failed agent] [Continue with 2/3] [Abort phase]
```

**Recommended**: Retry failed agent

---

### Git Issues

#### "Push rejected by remote"
```bash
# Error
! [rejected] feature/toss -> feature/toss (non-fast-forward)

# Solution 1: Pull first
git pull origin feature/toss --rebase
git push

# Solution 2: Force push (dangerous!)
git push --force-with-lease  # Safer than --force
```

#### "Commit failed: pre-commit hook"
```
❌ Commit failed

Error: Lint errors detected by pre-commit hook
  components/Payment.tsx: Line 42: Missing semicolon
```

**Solution**: Fix lint errors
```bash
# Auto-fix
npm run lint:fix

# Or fix manually
vim components/Payment.tsx

# Retry commit
git commit -m "feat: Add Payment component"
```

---

### Performance Issues

#### "Agent taking too long"
```
[Agent 1] ⏳ Running for 15 minutes...

Expected: 30min
Elapsed: 15min
Status: In progress (GREEN phase)
```

**Options**:
- **Wait**: Normal for complex tasks
- **Check logs**: View agent progress
- **Interrupt**: Cancel if stuck

**Check progress**:
```bash
# View agent output
tail -f .claude/logs/agent-{id}.log

# Check running processes
ps aux | grep claude
```

#### "Out of memory during build"
```
❌ npm run build failed

Error: JavaScript heap out of memory
```

**Solution**:
```bash
# Increase memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run build

# Or add to package.json
{
  "scripts": {
    "build": "NODE_OPTIONS='--max-old-space-size=4096' next build"
  }
}
```

---

### Feature State Issues

#### "Cannot find feature"
```
User: "Continue toss"

❌ Feature not found: toss

Did you mean?
  - toss-integration
  - toss-payment
```

**Solution**: Use exact feature name
```
"Continue toss-integration"
```

#### "plan.md corrupted"
```
❌ Cannot parse plan.md

Error: Invalid JSON in phase definition
```

**Solution 1**: Restore from git
```bash
git checkout HEAD -- docs/features/{feature}/plan.md
```

**Solution 2**: Regenerate
```bash
# Delete corrupted file
rm docs/features/{feature}/plan.md

# Skill will regenerate
"Reinitialize {feature}"
```

---

### Common Error Messages

#### "TypeError: Cannot read property 'X' of undefined"
- **Agent error**: Check agent logs
- **Test error**: Fix test setup
- **Build error**: Check TypeScript types

#### "ENOENT: no such file or directory"
- **Missing file**: Check file path
- **Permission issue**: Check directory permissions
- **Wrong directory**: Check `pwd`

#### "EACCES: permission denied"
- **File permissions**: `chmod 644 file`
- **Directory permissions**: `chmod 755 dir`
- **Ownership**: `chown user:group file`

---

### Getting Help

#### Enable Debug Mode
```bash
# Set environment variable
export CLAUDE_DEBUG=1

# Run skill with verbose output
"Start {feature} in debug mode"
```

#### Check Logs
```bash
# Skill logs
cat .claude/logs/feature-impl.log

# Agent logs
cat .claude/logs/agent-*.log

# Git history
git log --oneline -20
```

#### Manual Recovery

If skill is completely stuck:

```bash
# 1. Check current state
git status
cat docs/features/{feature}/TODO.md
gh issue list --label feature:{feature}

# 2. Manually fix issues
# (edit code, close issues, etc.)

# 3. Force sync
"Force sync {feature}"

# 4. Resume
"Resume {feature}"
```

---

### Emergency Reset

**Last resort** - Resets feature to clean state:

```bash
# Backup first!
cp -r docs/features/{feature} docs/features/{feature}.backup

# Delete feature files
rm -rf docs/features/{feature}

# Close all GitHub issues
gh issue list --label feature:{feature} --json number -q '.[].number' | \
  xargs -I {} gh issue close {}

# Delete branch
git branch -D feature/{feature}

# Start fresh
"Start {feature} from scratch"
```

---

### Preventive Measures

1. **Commit frequently**: Don't lose work
2. **Sync regularly**: Keep TODO.md ↔ GitHub in sync
3. **Read error messages**: They usually tell you what's wrong
4. **Check logs**: Agent logs contain detailed error info
5. **Test locally**: Run `npm test` and `npm run build` before resuming
6. **Backup plan.md**: Copy before manual edits
7. **Use git stash**: For quick context switching

---

## Best Practices

### 1. Commit Frequently
Let agents handle commits. Each task = 3 commits (red/green/refactor).

### 2. Keep Phases Small
Ideal phase: 2-4 tasks that can run in parallel.

### 3. Review Plan Before Starting
Check `plan.md` after generation. Modify agent assignments if needed.

### 4. Use Descriptive Feature Names
Good: `stripe-payment-integration`, `user-authentication`
Bad: `feature1`, `new-stuff`

### 5. Resume Regularly
Check progress: `"Check {feature} status"`

---

## Advanced Usage

### Custom Agent Assignment
Edit `plan.md` before starting:
```markdown
| Task | Agent | ...
| Checkout flow | frontend-ui-specialist | ... # Change if needed
```

### Skip Phases
```
"Skip to Phase 4 for toss-integration"
```

### Retry Failed Tasks
```
"Retry task #126"
```

### View GitHub Issues
```bash
gh issue list --label feature:{feature-name}
```

---

## Related Documentation

- [Full Design](./design.md) - Complete technical specification
- [Techspec Handling](./techspec-handling.md) - File recognition logic
- [Agent Mapping](./agent-mapping.md) - Claude's agent selection
- [Examples](./examples.md) - Detailed usage scenarios

---

## Version

**v1.0.0** - Initial Design (2025-11-02)
