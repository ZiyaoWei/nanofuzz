# Notes for Claude

## Explaining

- Explain plainly and concretely, with a small example. Define terms on first
  use; avoid jargon and terse parentheticals. Don't assume Python expertise.
- Answer the question first. Back claims with evidence (run it, read the
  source) rather than memory, and say what was and wasn't checked.

## Design

- NaNofuzz is a research prototype: prefer simplicity over backwards
  compatibility. Ask whether compatibility code actually buys anything, and
  remove it if not.
- Prefer what can be inferred from the code itself (e.g., `__init__.py` files)
  over outside context (e.g., the workspace folder or current directory).
- Structure for future reuse (a small module, computed once, passed explicitly,
  one source of truth), but don't extract shared helpers before a second user
  exists. Keep language-specific helpers next to their only user; `Util.ts` is
  for language-neutral helpers.

## Code comments and docs

- Describe the code as it is; never refer to earlier versions or to branch/PR
  history.
- Avoid ambiguous pronouns: "the file's", not "its".
- Mention an external tool (e.g., pytest) once, in the top-level docstring, not
  throughout. Say "similar to X" unless the behavior is identical to X.
- Illustrate with the docstring's own example, listing concrete values for each
  case. Drop examples and comments that add nothing.
- Explain motivation: what something is for, then why it is done that way.
- No magic constants: name values (e.g., positional arguments) where parsed.

## Tests

- One regression test per distinct case, and split a test that checks several
  rules into one test per rule.
- Each test must fail without its fix: prove it by running it against the old
  code, or by breaking the rule and seeing exactly that test fail.
- Build test fixtures from one file list or map; it needs no tree comment.

## Commits and PRs

- Author commits as the user (their name and email), with Claude as
  co-author. Keep Claude (`noreply@anthropic.com`) as the committer: signed
  commits only show as Verified when the committer matches the signing key.
- One semantically meaningful commit per change; a separate, valid fix gets its
  own commit rather than being dropped. Check that each commit builds and
  passes on its own.
- While a PR is a draft, fold review fixes into the commit they belong to and
  force-push with lease; once review starts, add follow-up commits instead.
- Don't open PRs unless asked.

## NaNofuzz in cloud sessions

- Setup: `python -m venv .venv`, `. .venv/bin/activate`, then
  `pip install -r requirements.txt`. The `nanofuzz-study` git dependency is
  blocked by the network proxy: install with it temporarily removed from
  `package.json` (`yarn install --pure-lockfile`), then restore
  `package.json`. Tests that need it can't run.
- Build: `yarn build`. Tests: `node test.cjs <file name filters>`. Lint:
  `yarn -s eslint src`. Type-check: `node ./node_modules/ts7/bin/tsc -noEmit`.
- Python runner tests use the built host in `build/extension`: rebuild after
  editing `PythonRunnerHost.py`.
- Upstream is `nanofuzz/nanofuzz`. A session can't attach both it and a fork
  named `nanofuzz`, so upstream PR checks can't be read from a fork session.
