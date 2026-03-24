# Litmus Agent Team

6 specialized agents, 10 skills, one project.

## The Team

| Agent | File | Skills | Domain |
|-------|------|--------|--------|
| **Architect** | [architect.md](architect.md) | software-architect, feature-specification | System design, specs, trade-offs |
| **Engineer** | [engineer.md](engineer.md) | software-engineer | Implementation, code quality |
| **Designer** | [designer.md](designer.md) | superdesign | UI/UX, design systems, accessibility |
| **Reviewer** | [reviewer.md](reviewer.md) | critical-code-reviewer, git-workflows | Code review, git operations |
| **QA** | [qa.md](qa.md) | afrexai-qa-engine | Testing, quality gates, release readiness |
| **Docs** | [docs.md](docs.md) | afrexai-technical-docs | Documentation, developer experience |
| **Orchestrator** | [orchestrator.md](orchestrator.md) | agent-autonomy-kit, xiucheng-self-improving-agent | Coordination, task routing, self-improvement |

## Task Routing

| Task | Primary | Supporting |
|------|---------|------------|
| New feature planning | Architect | Designer, QA |
| Implementation | Engineer | Architect |
| UI/UX work | Designer | Engineer |
| Pre-merge review | Reviewer | QA |
| Bug investigation | Engineer | QA, Reviewer |
| Documentation | Docs | Architect |
| Release readiness | QA | Reviewer, Docs |
| Test planning | QA | Engineer |
| Complex/multi-domain | Orchestrator | Routes to specialists |

## How It Works

1. **Single-domain tasks** go directly to the specialist agent
2. **Multi-domain tasks** go through the Orchestrator, which routes to specialists
3. **Independent tasks** run in parallel (e.g., Architect specs + Designer wireframes)
4. **Dependent tasks** run sequentially (e.g., Architect specs → Engineer implements)
5. **Conflicts** between agents are surfaced and resolved, not suppressed

## For Collaborators

These agent definitions and skills are committed to the repo. When you clone/pull:
- Skills are in `skills/` — the domain knowledge and rules each agent follows
- Agents are in `agents/` — the role definitions that reference those skills
- Edit skills to change the rules. Edit agents to change the team structure.
- Any AI tool with file access can be pointed at these files to follow the same playbook.

## For External AI Tools (Anti-Gravity, Cursor, etc.)

To onboard another AI tool to this team structure, tell it:

> Read all files in `agents/TEAM.md` and the `agents/` and `skills/` directories.
> These define your team structure and decision-making guidelines.
> Follow the skill guides as your rules of engagement for each domain.
