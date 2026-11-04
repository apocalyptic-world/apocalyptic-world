# Semgrep scan for injected code in passages

[Semgrep Community Edition](https://github.com/semgrep/semgrep) rules that look through the Twine/SugarCube passages (`*.tw`, `*.twee`) for code that is unusual in this game and typical of malicious changes: code loaded from outside, strings run as code, obfuscation, data sent to unknown servers, and so on.

Passages mix prose, HTML, macros and JavaScript, which no Semgrep parser understands, so every rule is a regular expression (`languages: [regex]`). Treat a finding as "a human should look at this", not as proof of malice.

| File | Purpose |
|---|---|
| `rules/passages.yml` | The rules |
| `report.py` | Turns Semgrep's JSON into GitHub annotations and a job summary (CI only) |
| `../.github/workflows/semgrep.yml` | GitHub Actions workflow |

None of these files are part of the game build: Tweego only bundles `.tw`, `.twee`, `.js`, `.css` and media files.

## Rules

| Rule | Severity | Looks for |
|---|---|---|
| `tw-dynamic-code-execution` | ERROR | `eval`, `Function(...)`, `setTimeout`/`setInterval` with a string |
| `tw-remote-code-loading` | ERROR | `importScripts`, `$.getScript`, dynamic `import()`, `<script src>`, created `<script>` elements, JS/HTML `data:` URLs, workers |
| `tw-obfuscated-code` | ERROR | `atob`, `String.fromCharCode`, `unescape`, runs of `\x`/`\u` escapes, JSFuck-style symbol runs |
| `tw-crypto-miner` | ERROR | Known browser miners and mining protocols |
| `tw-external-url` | WARNING | URLs to domains not on the allow list |
| `tw-network-request` | WARNING | `fetch`, `XMLHttpRequest`, jQuery AJAX, WebSocket, EventSource, `sendBeacon`, WebRTC, `new Image()` beacons |
| `tw-sensitive-browser-data` | WARNING | Cookies, local/session storage, IndexedDB, clipboard, location, camera, credentials, other windows |
| `tw-navigation-redirect` | WARNING | Assigning `location`, `location.assign/replace`, `window.open`, meta refresh |
| `tw-html-injection-sink` | WARNING | `innerHTML`/`outerHTML`, `insertAdjacentHTML`, `document.write` |
| `tw-embedded-frame` | WARNING | `<iframe>`, `<frame>`, `<object>`, `<embed>`, `<applet>` |
| `tw-script-passage` | WARNING | Passages tagged `[script]` (run at game start) |
| `tw-long-base64-blob` | WARNING | Base64-like strings of 200+ characters outside `data:` URLs |
| `tw-minified-code` | INFO | Lines of 1000+ characters with 30+ statements |
| `tw-raw-script-tag` | INFO | HTML `<script>` elements (not the `<<script>>` macro) |
| `tw-inline-event-handler` | INFO | `onclick=`-style attributes and `javascript:` URLs |

Code that exists today and these rules flag (all known and legitimate):

- ERROR: `importScripts` in `core/StoryInit.tw` and `core/PassageReady.tw` (runtime scripts, packs, analytics), and `eval(_onClickScript)` in `widgets/Widget - player.tw`.
- WARNING: the version check (`$.get`) in `views/game/Welcome intro.tw`, `new Image()` in the portrait customizer, `innerHTML` in the shooter mini-game, and the three `[script]` passages.
- INFO: the vendored, minified macros in `core/Story JavaScript.tw`, six `<script>` elements and a dozen inline handlers.

In CI this doesn't matter, because pull requests and pushes only report findings that are **new** compared with the base commit (see below). A full scan reports them all.

## Installing Semgrep locally

Pick one:

```sh
# Python (recommended: isolated install)
pipx install semgrep

# or plain pip
python3 -m pip install --user semgrep

# or Homebrew (macOS/Linux)
brew install semgrep

# or no install at all: Docker (see "Running with Docker")
```

Check it works: `semgrep --version`. No account or login is needed for local rules.

## Running locally

From the repository root:

```sh
# Scan every passage
semgrep scan --config .semgrep/rules/ --metrics=off

# Only findings your branch introduces compared with master
semgrep scan --config .semgrep/rules/ --metrics=off \
  --baseline-commit "$(git merge-base master HEAD)"

# Only one severity
semgrep scan --config .semgrep/rules/ --metrics=off --severity ERROR

# Scan specific files
semgrep scan --config .semgrep/rules/ --metrics=off "views/game/Welcome intro.tw"
```

`--metrics=off` stops Semgrep from sending anonymous usage data. `--baseline-commit` scans the working tree, so commit or stash unfinished changes first if Semgrep complains about them. Add `--error` to get a non-zero exit code when there is any finding (useful in a pre-push hook).

### Running with Docker

```sh
docker run --rm -v "$PWD:/src" -w /src semgrep/semgrep \
  semgrep scan --config .semgrep/rules/ --metrics=off
```

### Trying a rule on a sample

To see what a rule catches without touching the game, scan a throwaway passage outside the repository:

```sh
cat > /tmp/sample.tw <<'EOF'
:: Sample
<<run eval(atob("YWxlcnQoMSk="))>>
<a href="https://example.net/x">link</a>
EOF
semgrep scan --config .semgrep/rules/ --metrics=off /tmp/sample.tw
```

## GitHub Actions

`.github/workflows/semgrep.yml` runs on every pull request, on pushes to `master`, and by hand (Actions tab → Semgrep → Run workflow).

There is no maintained official Semgrep action (`returntocorp/semgrep-action` is deprecated), so the job runs inside the official `semgrep/semgrep` container image, as Semgrep's docs recommend. It needs no token or Semgrep account and only read access to the repository.

What it does:

1. **Pull requests** compare against the PR's base commit, and **pushes** against the previous `master` commit, so only new findings are reported. **Manual runs** scan everything.
2. Each finding becomes an annotation on the changed line (error / warning / notice), and the job summary lists them all.
3. The check is **report-only**: it stays green whatever it finds, so a maintainer can review the findings and decide which are false alarms. To make it fail on ERROR findings, add `--fail-on-error` to the `report.py` step.
   - A failing check only blocks merging if a branch protection rule or ruleset requires it ("Require status checks to pass"). Even then, admins can bypass it unless the rule says otherwise.
   - GitHub shows at most 10 annotations of each level per step (50 per job) on the pull request. The job summary always lists every finding.
4. A last step adds a warning for every new or changed **binary file** (images, videos, archives), since text rules can't look inside them.

The workflow uses `pull_request`, not `pull_request_target`, so pull requests from forks run without access to secrets or write permissions.

**Pinning:** `actions/checkout` is pinned to a commit hash. The container uses `semgrep/semgrep:latest`; for reproducible and tamper-proof runs, pin it to a digest (`docker pull semgrep/semgrep && docker inspect --format '{{index .RepoDigests 0}}' semgrep/semgrep`) and update it from time to time.

## Handling findings

- **Malicious or unexplained:** don't merge; ask the contributor to explain it, or revert.
- **Legitimate new external domain:** add it to the allow list in the `tw-external-url` rule (`rules/passages.yml`), in the same pull request so reviewers see it.
- **Legitimate one-off:** add `nosemgrep: <rule-id>` on the first line of the match. In a passage, use a SugarCube comment so it doesn't show in the game:

  ```
  <<run eval(_onClickScript)>> /* nosemgrep: tw-dynamic-code-execution */
  ```

  Inside `<<script>>` blocks or `[script]` passages, use `// nosemgrep: <rule-id>`.

## Changing the rules

Each rule has an `id`, `severity`, `message`, `paths.include` and one `pattern-regex` (PCRE2). Some tips:

- Single-quoted YAML strings need `''` for a literal `'`.
- `(?m)` makes `^`/`$` match at line starts/ends; `.` never crosses lines.
- Check that a rule loads with `semgrep scan --validate --config .semgrep/rules/`, then run it on a sample file as shown above.
- To cover the JavaScript files in `js/` too, add `'js/*.js'` to a rule's `paths.include`.
