#!/usr/bin/env python3
"""Turn Semgrep JSON output into GitHub Actions annotations and a job summary.

Usage: report.py semgrep.json [--fail-on-error]

Each finding becomes an ::error / ::warning / ::notice annotation on the
changed line. By default it only reports and always exits 0, so a
maintainer can review the findings without the check blocking anything.
With --fail-on-error it exits 1 if any finding has severity ERROR.
"""
import json
import os
import sys

LEVEL = {"ERROR": "error", "WARNING": "warning", "INFO": "notice"}


def esc_data(text):
    return text.replace("%", "%25").replace("\r", "%0D").replace("\n", "%0A")


def esc_prop(text):
    return esc_data(text).replace(":", "%3A").replace(",", "%2C")


def main(path, fail_on_error=False):
    with open(path, encoding="utf-8") as fh:
        data = json.load(fh)

    rows = []
    failed = False
    for res in data.get("results", []):
        extra = res.get("extra", {})
        severity = extra.get("severity", "INFO")
        failed = failed or severity == "ERROR"
        rule = res.get("check_id", "?").rsplit(".", 1)[-1]
        file = res.get("path", "?")
        start = res.get("start", {}).get("line", 1)
        end = res.get("end", {}).get("line", start)
        message = " ".join(extra.get("message", "").split())
        print(
            f"::{LEVEL.get(severity, 'notice')} file={esc_prop(file)},line={start},"
            f"endLine={end},title={esc_prop(rule)}::{esc_data(message)}"
        )
        rows.append((severity, rule, f"{file}:{start}".replace("|", "\\|")))

    for err in data.get("errors", []):
        message = str(err.get("message", err))[:500]
        print(f"::warning title=semgrep error::{esc_data(message)}")

    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary:
        with open(summary, "a", encoding="utf-8") as fh:
            fh.write("## Semgrep: passage scan\n\n")
            if rows:
                fh.write("| Severity | Rule | Location |\n|---|---|---|\n")
                for severity, rule, where in rows:
                    fh.write(f"| {severity} | `{rule}` | `{where}` |\n")
                fh.write("\nRules and how to handle findings: `.semgrep/README.md`.\n")
            else:
                fh.write("No new findings.\n")

    print(f"{len(rows)} finding(s); ERROR findings: {'yes' if failed else 'no'}")
    return 1 if failed and fail_on_error else 0


if __name__ == "__main__":
    args = sys.argv[1:]
    fail_on_error = "--fail-on-error" in args
    files = [a for a in args if a != "--fail-on-error"]
    if len(files) != 1:
        sys.exit(__doc__)
    sys.exit(main(files[0], fail_on_error))
