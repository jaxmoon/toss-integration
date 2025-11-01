# Techspec File Handling

## Overview

The `feature-impl` skill recognizes techspec files with flexible naming and locations, prioritizing user-specified files.

---

## Recognition Priority

### 1. User-Mentioned Files (Highest Priority)

User can explicitly mention a file path in their input:

```
"docs/my-spec.md를 techspec으로 써줘"
"/Users/jax/Desktop/payment-spec.pdf 사용"
"../specs/toss.md로 시작"
```

**Supported Patterns**:
- Relative paths: `./docs/spec.md`, `../spec.md`
- Absolute paths: `/Users/jax/spec.md`
- Home directory: `~/Documents/spec.md`
- Windows paths: `C:\Users\spec.md`

**File Extensions**:
- `.md` (Markdown)
- `.pdf` (PDF documents)
- `.txt` (Plain text)

**Implementation**:
```typescript
function extractMentionedFile(userInput: string): string | null {
  const patterns = [
    /([\.\/\w\-]+\.(?:md|pdf|txt))/g,              // ./path/file.md
    /(\/[\w\-\/\.]+\.(?:md|pdf|txt))/g,            // /abs/path/file.md
    /([A-Z]:\\[\w\-\\\.]+\.(?:md|pdf|txt))/g,      // C:\path\file.md
    /(~\/[\w\-\/\.]+\.(?:md|pdf|txt))/g,           // ~/path/file.md
    /(\.\.\/[\w\-\/\.]+\.(?:md|pdf|txt))/g         // ../path/file.md
  ];

  for (const pattern of patterns) {
    const matches = userInput.match(pattern);
    if (matches) {
      for (const match of matches) {
        const resolved = path.resolve(match);
        if (exists(resolved)) {
          return resolved;
        }
      }
    }
  }

  return null;
}
```

**Action**: Copy to standard location
```
Source: /Users/jax/Desktop/spec.md
Target: docs/features/{feature}/techspec.md
```

---

### 2. Standard Location (Case-Insensitive)

Search in `docs/features/{feature}/` with flexible naming:

**Accepted Filenames** (case-insensitive):
- `techspec.md`, `TechSpec.md`, `TECHSPEC.md`
- `tech-spec.md`, `Tech-Spec.md`, `TECH-SPEC.md`
- `tech_spec.md`, `Tech_Spec.md`, `TECH_SPEC.md`
- `spec.md`, `Spec.md`, `SPEC.md`

**Implementation**:
```typescript
function findTechspecInStandardLocation(feature: string): string | null {
  const featurePath = `docs/features/${feature}`;

  if (!exists(featurePath)) {
    return null;
  }

  const files = listFiles(featurePath);

  for (const file of files) {
    const lower = file.toLowerCase();

    if (
      lower === 'techspec.md' ||
      lower === 'tech-spec.md' ||
      lower === 'tech_spec.md' ||
      lower === 'spec.md'
    ) {
      return path.join(featurePath, file);
    }
  }

  return null;
}
```

**Action**: Use as-is

---

### 3. Auto-Search in docs/

Search entire `docs/` directory (excluding `docs/features/`):

**Search Patterns**:
- `docs/{feature}*.md`
- `docs/**/{feature}*.md`
- `docs/**/spec*.md`
- `docs/**/tech*.md`

**Implementation**:
```typescript
function searchTechspecInDocs(feature: string): string | null {
  const patterns = [
    `docs/${feature}*.md`,
    `docs/**/${feature}*.md`,
    `docs/**/spec*.md`,
    `docs/**/tech*.md`
  ];

  for (const pattern of patterns) {
    const files = glob(pattern, {
      caseInsensitive: true,
      ignore: ['docs/features/**']  // Exclude standard location
    });

    if (files.length > 0) {
      // Return most relevant match
      return files[0];
    }
  }

  return null;
}
```

**Action**: Ask user to copy to standard location

---

### 4. Not Found

If no techspec found:

```
❌ Techspec not found for feature: {feature}

Please:
  1. Run: /workflows:tech-spec
  2. Or specify file: "Use /path/to/spec.md as techspec"
  3. Or place at: docs/features/{feature}/techspec.md

Accepted filenames (case-insensitive):
  - techspec.md, tech-spec.md, tech_spec.md, spec.md
```

**Action**: Exit skill

---

## Unified Resolution Function

```typescript
function resolveTechspec(userInput: string, feature: string): string {
  console.log('🔍 Looking for techspec...\n');

  // Priority 1: User-mentioned file
  const mentioned = extractMentionedFile(userInput);

  if (mentioned) {
    console.log(`✓ User mentioned: ${mentioned}`);

    if (!exists(mentioned)) {
      throw new Error(`❌ File not found: ${mentioned}`);
    }

    return copyToStandardLocation(mentioned, feature);
  }

  // Priority 2: Standard location
  const standard = findTechspecInStandardLocation(feature);

  if (standard) {
    console.log(`✓ Found in standard location: ${standard}`);
    return standard;
  }

  // Priority 3: Auto-search
  const found = searchTechspecInDocs(feature);

  if (found) {
    console.log(`⚠️ Found at non-standard location: ${found}`);

    const answer = askUser({
      question: '표준 위치로 복사하시겠습니까?',
      options: ['Yes', 'No']
    });

    if (answer === 'Yes') {
      return copyToStandardLocation(found, feature);
    } else {
      return found;
    }
  }

  // Priority 4: Not found
  throw new Error(`
❌ Techspec not found for feature: ${feature}

Please create it first:
  /workflows:tech-spec

Or place it at:
  docs/features/${feature}/techspec.md

Accepted names (case-insensitive):
  techspec.md, tech-spec.md, tech_spec.md, spec.md
  `);
}
```

---

## Copy to Standard Location

```typescript
function copyToStandardLocation(sourcePath: string, feature: string): string {
  const targetDir = `docs/features/${feature}`;
  const targetPath = `${targetDir}/techspec.md`;

  console.log(`\n📋 Copying to standard location...`);
  console.log(`  From: ${sourcePath}`);
  console.log(`  To:   ${targetPath}\n`);

  // Create directory if doesn't exist
  execSync(`mkdir -p ${targetDir}`);

  // Copy file
  execSync(`cp "${sourcePath}" "${targetPath}"`);

  console.log(`✅ Copied successfully\n`);

  return targetPath;
}
```

---

## Examples

### Example 1: User Mentions File

**Input**:
```
User: "docs/toss-payment-spec.md 이걸로 Toss 개발 시작해줘"
```

**Processing**:
```typescript
1. extractMentionedFile("docs/toss-payment-spec.md 이걸로...")
   → "docs/toss-payment-spec.md"

2. exists("docs/toss-payment-spec.md")
   → true

3. Feature name detection
   → "toss-integration" (from "Toss 개발")

4. copyToStandardLocation(
     "docs/toss-payment-spec.md",
     "toss-integration"
   )
   → "docs/features/toss-integration/techspec.md"
```

**Output**:
```
🔍 Looking for techspec...

✓ User mentioned: docs/toss-payment-spec.md

📋 Copying to standard location...
  From: docs/toss-payment-spec.md
  To:   docs/features/toss-integration/techspec.md

✅ Copied successfully
```

---

### Example 2: Standard Location with Variant Name

**Input**:
```
User: "Toss feature 이어서 해줘"
```

**Files**:
```
docs/features/toss-integration/
├── TechSpec.md       ← Found!
├── plan.md
└── TODO.md
```

**Processing**:
```typescript
1. Feature detection
   → "toss-integration"

2. extractMentionedFile(userInput)
   → null (no file mentioned)

3. findTechspecInStandardLocation("toss-integration")
   → "docs/features/toss-integration/TechSpec.md"
```

**Output**:
```
🔍 Looking for techspec...

✓ Found in standard location: docs/features/toss-integration/TechSpec.md
```

---

### Example 3: Auto-Search Finds File

**Input**:
```
User: "Stripe 결제 시작"
```

**Files**:
```
docs/
├── stripe-spec.md      ← Found by auto-search!
└── features/
    └── (empty)
```

**Processing**:
```typescript
1. Feature name
   → "stripe-integration"

2. extractMentionedFile(userInput)
   → null

3. findTechspecInStandardLocation("stripe-integration")
   → null (no standard location yet)

4. searchTechspecInDocs("stripe-integration")
   → "docs/stripe-spec.md"

5. Ask user to copy
   → "Yes"

6. copyToStandardLocation(...)
   → "docs/features/stripe-integration/techspec.md"
```

**Output**:
```
🔍 Looking for techspec...

⚠️ Found at non-standard location: docs/stripe-spec.md

표준 위치로 복사하시겠습니까?
  [Yes] [No]

> Yes

📋 Copying to standard location...
  From: docs/stripe-spec.md
  To:   docs/features/stripe-integration/techspec.md

✅ Copied successfully
```

---

### Example 4: Not Found

**Input**:
```
User: "Payment feature 시작"
```

**Files**:
```
docs/
└── features/
    └── (empty, no techspec anywhere)
```

**Processing**:
```typescript
1. Feature name
   → "payment-feature"

2-4. All searches return null

5. Throw error
```

**Output**:
```
🔍 Looking for techspec...

❌ Techspec not found for feature: payment-feature

Please create it first:
  /workflows:tech-spec

Or place it at:
  docs/features/payment-feature/techspec.md

Accepted names (case-insensitive):
  techspec.md, tech-spec.md, tech_spec.md, spec.md
```

---

## Best Practices

### For Users

1. **Explicit is better**: Mention file path for clarity
   ```
   "Use docs/my-spec.md for toss feature"
   ```

2. **Use standard location**: Place techspec at standard location
   ```
   docs/features/{feature}/techspec.md
   ```

3. **Consistent naming**: Stick to one naming convention
   ```
   Recommended: techspec.md
   ```

### For Skill Implementation

1. **Always resolve to standard location**: Even if found elsewhere, copy to standard location for consistency

2. **Preserve original**: Never delete the source file, only copy

3. **Clear feedback**: Always show source and destination paths

4. **Fail gracefully**: Provide actionable error messages

---

## Edge Cases

### Multiple Matches in Auto-Search

If multiple files match the pattern:
```typescript
const files = glob(pattern);  // → ['docs/spec1.md', 'docs/spec2.md']

// Strategy: Return first match (most relevant)
return files[0];

// Future: Could ask user to choose
```

### Permission Errors

```typescript
try {
  execSync(`cp "${source}" "${target}"`);
} catch (error) {
  throw new Error(`
❌ Failed to copy file

Error: ${error.message}

Check permissions:
  ls -l "${source}"
  ls -ld "${path.dirname(target)}"
  `);
}
```

### Symlinks

Resolve symlinks before copying:
```typescript
const realPath = fs.realpathSync(sourcePath);
execSync(`cp "${realPath}" "${targetPath}"`);
```

---

## Testing Checklist

- [ ] User mentions relative path
- [ ] User mentions absolute path
- [ ] User mentions home directory path
- [ ] File at standard location (lowercase)
- [ ] File at standard location (uppercase)
- [ ] File at standard location (mixed case)
- [ ] File in non-standard location (auto-search)
- [ ] Multiple matches in auto-search
- [ ] File not found anywhere
- [ ] Permission errors
- [ ] Symlink handling

---

## Version

**v1.0.0** - Initial documentation (2025-11-02)
