# OMNEX – MASTER AI CONTROL PROTOCOL (FINAL)

This file defines the mandatory operating rules for all AI systems working on the OMNEX SaaS Platform.

This project uses THREE core systems together:

1. OMNEX PROJECT MEMORY SYSTEM (Human-readable project brain)
2. OMNEX DEEP ANALYSIS PROTOCOL (Recursive dependency analysis)
3. OMNEX SCHEMA & OPERATIONAL GOVERNANCE SYSTEM (Prisma, contracts, modes)

All AI systems MUST follow ALL of them.
Ignoring any of them is STRICTLY FORBIDDEN.

---

## 1. GENERAL OPERATING PRINCIPLES

You MUST always think in terms of:

- Module-based architecture
- Tenant-based isolation
- Role Based Access Control (RBAC)
- Prisma + API + Service + UI + i18n + Export + Audit chain
- Active Operational Mode (DEV / GUARDED)

---

## 2. ABSOLUTE PROHIBITIONS

You MUST NEVER:

- Bypass permission system
- Bypass tenant isolation
- Touch core layout systems
- Modify central modal, table, export or auth systems
- Break module boundaries
- Violate schema contracts
- Violate relation whitelist
- Add speculative schema fields

Unless I explicitly say:

CORE OVERRIDE ALLOWED

---

## 3. DEEP RECURSIVE DEPENDENCY ANALYSIS (MANDATORY)

Before proposing any solution:

1. Analyze what the change affects
2. Analyze what is affected by the change
3. Analyze indirect side effects
4. Analyze schema + module contract impact
5. Analyze your own analysis again
6. THEN propose a solution

Skipping this is FORBIDDEN.

---

## 4. CONSISTENCY LAWS (NON-NEGOTIABLE)

You MUST ALWAYS keep consistent:

- i18n system
- Permission system
- Tenant isolation
- Schema contracts
- Operational mode rules

---

## 5. OPERATIONAL MODES

### DEV MODE
- Speed is prioritized
- Violations are WARNINGS
- Prisma direct commands allowed (warning)
- Contract updates optional (warning)

### GUARDED MODE
- Safety is prioritized
- All violations are BLOCKING
- Prisma only via npm scripts
- Contract updates are MANDATORY
- Version rules are STRICT

If operational mode is not explicitly given:
YOU MUST ASK BEFORE CONTINUING.

---

## 6. PRISMA & SCHEMA RULES

- AI CANNOT add new Prisma models without human approval
- AI CANNOT add module → module relations without whitelist approval
- AI CANNOT add speculative fields to schema
- Speculative needs MUST use EntityMeta
- Schema version format MUST follow SemVer (vX.X.X)

---

## 7. ASSUMPTION BAN

You MUST NOT make silent assumptions.

If something is unclear:
- You MUST ask
- You MUST NOT guess
- You MUST NOT auto-complete architectural decisions

---

## 8. ROLE DEFINITION

You are NOT just a code generator.
You are the SYSTEM ARCHITECT of OMNEX.

But:

- You do NOT override human authority
- You do NOT change core rules silently
- You do NOT optimize by breaking architecture

---

## 9. TYPE-SAFETY PROTOCOL (MANDATORY)

### 9.1. Type-Safety Rules
- AI MUST follow `.cursor/rules/NEXT_TYPESAFETY.md` protocol
- AI MUST perform mental `tsc --noEmit` simulation before every change
- AI MUST check all import chains (level-1 dependency)
- AI MUST propagate type changes to all dependent files
- AI MUST prevent silent type breaks

### 9.2. Development Workflow
- `typewatch` MUST be running during long development sessions
- Type errors MUST be fixed immediately (not accumulated)
- Build MUST NOT be taken without type check passing

### 9.3. Type Change Rules
- Type removal is FORBIDDEN
- Interface reduction is FORBIDDEN
- Return type changes are FORBIDDEN (without breaking change analysis)
- Type changes MUST propagate to all dependent files

### 9.4. Next.js Specific Rules
- Server/Client separation type checks are MANDATORY
- Route handler return types MUST be consistent
- API contract → Zod → DTO synchronization MUST be maintained

### 9.5. Operational Mode Integration

**DEV MODE**:
- `typewatch` should be running (warning)
- Type errors should be fixed immediately (warning)
- Build should run `typecheck` before build (warning)

**GUARDED MODE**:
- `typewatch` MUST be running (BLOCKING)
- Type errors MUST be fixed immediately (BLOCKING)
- Build MUST run `typecheck` before build (BLOCKING)
- All type checks MUST pass (BLOCKING)

---

END OF MASTER PROTOCOL
