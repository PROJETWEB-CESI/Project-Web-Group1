# Commit Message Guidelines for GitHub Copilot

You must generate commit messages that strictly follow Conventional Commits and the project's Git workflow.

## Required Format

<type>(<scope>): <short description>

## Rules

- Always start with one of these types (lowercase):
  - `feat`     → new feature
  - `fix`      → bug fix
  - `chore`    → maintenance, dependencies, config
  - `refactor` → code change that neither fixes a bug nor adds a feature
  - `docs`     → documentation only
  - `test`     → adding or updating tests
  - `perf`     → performance improvement
  - `style`    → formatting, missing semicolons, etc. (no code change)
  - `ci`       → CI/CD configuration changes
  - `build`    → build system or external dependencies

- Always include a **scope** in parentheses when relevant (e.g. `timetable`, `ai-agent`, `auth`, `gateway`, `student-frontend`).

- Keep the subject line **under 72 characters**.

- Use **imperative mood** (e.g. "add", "fix", "update", "implement" — not "added", "fixed", "updated").

- Be concise and descriptive. Focus on **what** and **why**, not how.

- When possible, reference the GitHub issue at the end: `(#42)`

## Examples of good commit messages

- `feat(timetable): add real-time room change notifications`
- `fix(ai-agent): correct tool calling format for Ollama`
- `chore(deps): update express to latest version`
- `refactor(auth): extract JWT verification into middleware`
- `feat(student-frontend): implement grade history page (#67)`
- `docs(readme): update docker compose instructions`

## Bad examples (never generate these)

- `added new feature` (wrong type + not imperative)
- `fix bug` (too vague, no scope)
- `Updated timetable component` (not imperative)
- `feat: big changes` (too vague)

Always follow these rules strictly when suggesting commit messages.