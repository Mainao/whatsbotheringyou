# Write Tests Command

Write comprehensive Vitest tests for: $ARGUMENTS

Before writing read:

- CLAUDE.md
- The source file: $ARGUMENTS
- src/test/setup.ts
  ...

---

## If Custom Commands Still Do Not Work

Just paste the prompt directly into Claude Code instead. It works exactly the same way — just replace `$ARGUMENTS` with the actual file path manually:

```markdown
Write comprehensive Vitest tests for:
src/components/add-star/ColourSwatch.tsx

Before writing read:

- CLAUDE.md
- src/components/add-star/ColourSwatch.tsx
- src/test/setup.ts
- src/constants/colours.ts
- .prettierrc.json

Rules:

- Test all exported functions and components
- Mock all browser APIs jsdom does not support
- Use beforeEach for setup
- Use afterEach with vi.restoreAllMocks()
  and vi.unstubAllGlobals()
- 4 spaces indentation
- All imports use @/ aliases
- No any types
- Test names are full descriptive sentences
- Never test className or CSS values
- Test visible behaviour only

After writing:

1. Run pnpm test:run
2. Fix all failing tests
3. Show final test output

Return the complete test file in full.
Do not truncate anything.
```

---

## Why Direct Prompts Are Actually Better

```text
Custom commands  → convenient shortcut
Direct prompts   → more control, always works,
                   can customise per file type
```
