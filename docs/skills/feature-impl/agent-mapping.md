# Claude's Agent Mapping Strategy

## Overview

The `feature-impl` skill uses Claude's reasoning to analyze techspec and automatically assign the most appropriate specialized agent to each task.

---

## Available Agents

### Backend Specialists
- **backend-api-specialist**: REST/GraphQL APIs, backend logic, server-side operations
- **database-engineer-specialist**: Schema design, types, data models, migrations

### Frontend Specialists
- **frontend-ui-specialist**: React components, UI/UX implementation, design systems
- **frontend-state-specialist**: State management, data fetching, client-side routing
- **frontend-performance-specialist**: Performance optimization, Core Web Vitals

### Infrastructure Specialists
- **devops-infrastructure-specialist**: Project setup, deployment, CI/CD, Docker
- **test-engineer-specialist**: Testing infrastructure, test suites, QA strategies
- **security-engineer-specialist**: Security audits, authentication, vulnerabilities

---

## Mapping Logic

### Prompt to Claude

```typescript
const prompt = `
Analyze this techspec and create an execution plan with agent assignments.

Available agents:
- backend-api-specialist: REST/GraphQL APIs, backend logic
- frontend-ui-specialist: React components, UI/UX
- frontend-state-specialist: State management, data fetching
- database-engineer-specialist: Schema, types, data models
- devops-infrastructure-specialist: Setup, deployment, CI/CD
- test-engineer-specialist: Testing infrastructure, test suites
- security-engineer-specialist: Security audits, authentication
- frontend-performance-specialist: Performance optimization

Techspec:
${techspecContent}

For each task, assign the most appropriate agent and explain why.

Return JSON:
{
  "phases": [
    {
      "name": "Foundation",
      "parallel": true,
      "tasks": [
        {
          "name": "Next.js 프로젝트 초기화",
          "agent": "devops-infrastructure-specialist",
          "reason": "Infrastructure setup identified in techspec §3.2",
          "duration": "30min",
          "outputs": ["package.json", "tsconfig.json"]
        }
      ]
    }
  ]
}
`;

const response = await callClaude(prompt);
return JSON.parse(response);
```

---

## Mapping Patterns

Claude uses these heuristics when analyzing techspec:

### Pattern 1: File Path Analysis

**Rule**: Determine agent based on output file paths.

```typescript
const pathPatterns = {
  'app/api/**': 'backend-api-specialist',
  'api/**': 'backend-api-specialist',
  'server/**': 'backend-api-specialist',

  'components/**': 'frontend-ui-specialist',
  'pages/**': 'frontend-ui-specialist',
  'app/**/*.tsx': 'frontend-ui-specialist',

  'lib/**': 'frontend-state-specialist',
  'hooks/**': 'frontend-state-specialist',
  'store/**': 'frontend-state-specialist',

  'types/**': 'database-engineer-specialist',
  'models/**': 'database-engineer-specialist',
  'schema/**': 'database-engineer-specialist',

  '__tests__/**': 'test-engineer-specialist',
  'tests/**': 'test-engineer-specialist',

  'docker/**': 'devops-infrastructure-specialist',
  '*.config.js': 'devops-infrastructure-specialist',
  'package.json': 'devops-infrastructure-specialist'
};
```

**Example**:
```
Task: Create OrderSummary component
Output: components/OrderSummary.tsx
→ Agent: frontend-ui-specialist (components/** pattern)
```

---

### Pattern 2: Keyword Detection

**Rule**: Identify keywords in task description.

```typescript
const keywordPatterns = {
  'API endpoint': 'backend-api-specialist',
  'REST API': 'backend-api-specialist',
  'GraphQL': 'backend-api-specialist',
  'server': 'backend-api-specialist',

  'React component': 'frontend-ui-specialist',
  'UI component': 'frontend-ui-specialist',
  'page': 'frontend-ui-specialist',
  'layout': 'frontend-ui-specialist',

  'state management': 'frontend-state-specialist',
  'Redux': 'frontend-state-specialist',
  'Zustand': 'frontend-state-specialist',
  'data fetching': 'frontend-state-specialist',

  'type definition': 'database-engineer-specialist',
  'interface': 'database-engineer-specialist',
  'schema': 'database-engineer-specialist',
  'model': 'database-engineer-specialist',

  'test': 'test-engineer-specialist',
  'testing': 'test-engineer-specialist',
  'Jest': 'test-engineer-specialist',

  'setup': 'devops-infrastructure-specialist',
  'configuration': 'devops-infrastructure-specialist',
  'deployment': 'devops-infrastructure-specialist',

  'security': 'security-engineer-specialist',
  'authentication': 'security-engineer-specialist',
  'authorization': 'security-engineer-specialist'
};
```

**Example**:
```
Task: Implement user authentication with JWT
Keywords: "authentication", "JWT"
→ Agent: security-engineer-specialist
```

---

### Pattern 3: Techspec Section Analysis

**Rule**: Map techspec sections to agents.

```markdown
## Techspec Structure → Agent Mapping

### §3.2 Component Design
- "API Routes" → backend-api-specialist
- "Frontend Components" → frontend-ui-specialist
- "State Management" → frontend-state-specialist

### §3.3 Data Models
- All tasks → database-engineer-specialist

### §4 Implementation Plan
- "Infrastructure" → devops-infrastructure-specialist
- "Security" → security-engineer-specialist

### §5 Testing Strategy
- All tasks → test-engineer-specialist
```

**Example**:
```
Techspec §3.3 Data Models:
  - Payment interface
  - Order interface
  - Customer interface

→ All 3 tasks assigned to database-engineer-specialist
```

---

## Real-World Example

### Input: Toss Payments Techspec

```markdown
## 3. Architecture & Design

### 3.2 Component Design

#### Backend Components
- `/api/payments/confirm` - 결제 검증 API endpoint
- `/api/orders` - 주문 생성 API

#### Frontend Components
- `components/OrderSummary.tsx` - 주문 요약 컴포넌트
- `components/PaymentWidget.tsx` - 결제 위젯

#### Infrastructure
- Next.js 16 프로젝트 초기화
- Jest 테스트 환경 설정

### 3.3 Data Models
- `types/payment.ts` - 결제 관련 타입 정의
```

### Claude's Analysis

```json
{
  "phases": [
    {
      "name": "Foundation",
      "parallel": true,
      "tasks": [
        {
          "name": "Next.js 프로젝트 초기화",
          "agent": "devops-infrastructure-specialist",
          "reason": "Infrastructure setup task from §3.2 Infrastructure section",
          "outputs": ["package.json", "next.config.js"]
        },
        {
          "name": "결제 타입 정의",
          "agent": "database-engineer-specialist",
          "reason": "Type definitions from §3.3 Data Models (types/payment.ts)",
          "outputs": ["types/payment.ts"]
        },
        {
          "name": "Jest 테스트 환경",
          "agent": "test-engineer-specialist",
          "reason": "Testing infrastructure from §3.2 Infrastructure section",
          "outputs": ["jest.config.js"]
        }
      ]
    },
    {
      "name": "UI Components",
      "parallel": true,
      "tasks": [
        {
          "name": "OrderSummary 컴포넌트",
          "agent": "frontend-ui-specialist",
          "reason": "React component from §3.2 Frontend Components (components/OrderSummary.tsx)",
          "outputs": ["components/OrderSummary.tsx"]
        },
        {
          "name": "PaymentWidget 컴포넌트",
          "agent": "frontend-ui-specialist",
          "reason": "React component from §3.2 Frontend Components (components/PaymentWidget.tsx)",
          "outputs": ["components/PaymentWidget.tsx"]
        }
      ]
    },
    {
      "name": "Backend APIs",
      "parallel": true,
      "tasks": [
        {
          "name": "결제 검증 API",
          "agent": "backend-api-specialist",
          "reason": "API endpoint from §3.2 Backend Components (/api/payments/confirm)",
          "outputs": ["app/api/payments/confirm/route.ts"]
        },
        {
          "name": "주문 생성 API",
          "agent": "backend-api-specialist",
          "reason": "API endpoint from §3.2 Backend Components (/api/orders)",
          "outputs": ["app/api/orders/route.ts"]
        }
      ]
    }
  ]
}
```

### Mapping Rationale

| Task | Agent | Reasoning |
|------|-------|-----------|
| Next.js 초기화 | devops-infrastructure-specialist | **Pattern 1**: Output includes `package.json`, `*.config.js`<br>**Pattern 2**: Keywords "초기화", "설정"<br>**Pattern 3**: From "Infrastructure" section |
| 결제 타입 정의 | database-engineer-specialist | **Pattern 1**: Output path `types/payment.ts`<br>**Pattern 2**: Keywords "타입 정의"<br>**Pattern 3**: From "Data Models" section |
| OrderSummary | frontend-ui-specialist | **Pattern 1**: Output path `components/OrderSummary.tsx`<br>**Pattern 2**: Keywords "컴포넌트"<br>**Pattern 3**: From "Frontend Components" section |
| 결제 검증 API | backend-api-specialist | **Pattern 1**: Output path `app/api/payments/`<br>**Pattern 2**: Keywords "API endpoint"<br>**Pattern 3**: From "Backend Components" section |

---

## Phase Grouping Strategy

Claude also groups tasks into logical phases based on dependencies and parallel execution potential.

### Grouping Rules

1. **Foundation First**: Infrastructure, types, test setup
2. **UI Components**: Can run in parallel after Foundation
3. **Backend APIs**: Can run in parallel with UI or after
4. **Integration**: After all components exist
5. **Review**: Final phase, sequential

### Dependency Detection

```typescript
// Example: PaymentWidget depends on types
{
  "name": "PaymentWidget 컴포넌트",
  "agent": "frontend-ui-specialist",
  "dependencies": ["결제 타입 정의"],  // ← Detected from techspec
  "outputs": ["components/PaymentWidget.tsx"]
}

// Claude ensures PaymentWidget is in a later phase than types
```

### Parallel Safety Check

```typescript
function validateParallelSafety(tasks: Task[]): boolean {
  const outputFiles = tasks.flatMap(t => t.outputs);
  const duplicates = findDuplicates(outputFiles);

  if (duplicates.length > 0) {
    console.warn(`
⚠️ Parallel execution unsafe: File conflicts detected
  ${duplicates.join(', ')}

  Tasks will run sequentially instead.
    `);
    return false;
  }

  return true;
}
```

---

## User Overrides

Users can modify agent assignments in `plan.md` before starting:

### Before Execution

```markdown
# plan.md (Generated)

| Task | Agent | Duration |
|------|-------|----------|
| OrderSummary | frontend-ui-specialist | 45min |
```

**User edits**:
```markdown
| Task | Agent | Duration |
|------|-------|----------|
| OrderSummary | frontend-state-specialist | 45min |  ← Changed
```

Skill reads updated plan and uses the modified assignment.

---

## Agent Selection Quality

### Good Indicators

- ✅ **Reason includes techspec reference**: `"from §3.2 Backend Components"`
- ✅ **Clear file path mapping**: `components/*.tsx → frontend-ui-specialist`
- ✅ **Logical phase grouping**: Foundation → UI → Integration
- ✅ **No circular dependencies**: Each phase builds on previous
- ✅ **Parallel safety**: No file conflicts within phases

### Red Flags

- ⚠️ **Generic reasons**: `"Seems appropriate"` (not specific)
- ⚠️ **Wrong agent for file type**: `types/*.ts → frontend-ui-specialist`
- ⚠️ **Dependency violations**: UI phase before types phase
- ⚠️ **File conflicts**: Two tasks outputting same file

---

## Testing Agent Mapping

### Test Cases

```typescript
// Test 1: API endpoint → backend-api-specialist
const task1 = {
  name: "Create payment endpoint",
  outputs: ["app/api/payments/route.ts"]
};
expect(mapAgent(task1)).toBe('backend-api-specialist');

// Test 2: React component → frontend-ui-specialist
const task2 = {
  name: "Build OrderSummary component",
  outputs: ["components/OrderSummary.tsx"]
};
expect(mapAgent(task2)).toBe('frontend-ui-specialist');

// Test 3: Type definitions → database-engineer-specialist
const task3 = {
  name: "Define payment types",
  outputs: ["types/payment.ts"]
};
expect(mapAgent(task3)).toBe('database-engineer-specialist');

// Test 4: Infrastructure → devops-infrastructure-specialist
const task4 = {
  name: "Setup Next.js project",
  outputs: ["package.json", "next.config.js"]
};
expect(mapAgent(task4)).toBe('devops-infrastructure-specialist');
```

---

## Future Enhancements

### 1. Learning from User Overrides

Track user modifications to improve future mappings:
```typescript
// If user frequently changes:
//   "State hook" from frontend-ui-specialist
//                  to frontend-state-specialist
// → Update mapping rules
```

### 2. Multi-Agent Tasks

Some tasks may benefit from multiple agents:
```typescript
{
  "name": "Authentication system",
  "agents": [
    { type: "backend-api-specialist", focus: "API endpoints" },
    { type: "security-engineer-specialist", focus: "Security review" }
  ]
}
```

### 3. Agent Specialization Profiles

Create agent profiles based on project history:
```typescript
{
  "backend-api-specialist": {
    "preferredFor": ["express", "fastify", "next-api"],
    "avoidFor": ["pure-ui", "styling"]
  }
}
```

---

## Best Practices

### For Techspec Authors

1. **Be explicit about file paths**
   ```markdown
   Good: "Create component at components/OrderSummary.tsx"
   Bad:  "Create order summary"
   ```

2. **Use clear section headers**
   ```markdown
   ## Backend Components
   ## Frontend Components
   ## Infrastructure
   ```

3. **Specify dependencies**
   ```markdown
   PaymentWidget requires types/payment.ts
   ```

### For Skill Developers

1. **Trust Claude's reasoning**: The AI model is good at pattern matching
2. **Provide clear agent descriptions**: Help Claude choose correctly
3. **Allow user overrides**: Users know their project best
4. **Validate parallel safety**: Prevent file conflicts

---

## Version

**v1.0.0** - Initial documentation (2025-11-02)
