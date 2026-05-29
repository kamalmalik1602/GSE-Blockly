#!/usr/bin/env python3
"""
Run Vitest, parse JSON results, and write report.md.
Outputs 'points=X/Y' to $GITHUB_OUTPUT when running in GitHub Actions.
Git operations are handled by the workflow.
Exit code: 1 if any test failed, 0 if all passed.
"""

import json
import os
import subprocess
import sys
from datetime import datetime, timezone

REPORT_PATH = "report.md"


def run_tests() -> dict:
    result = subprocess.run(
        ["npm", "test", "--", "--reporter=json", "--run"],
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    # Vitest --reporter=json writes JSON to stdout; stderr has human-readable output
    raw = result.stdout
    start = raw.find("{")
    if start == -1:
        print("ERROR: no JSON output from vitest", file=sys.stderr)
        print(result.stderr, file=sys.stderr)
        sys.exit(1)
    return json.loads(raw[start:])


def build_report(data: dict) -> str:
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    total = data.get("numTotalTests", 0)
    passed = data.get("numPassedTests", 0)
    failed = data.get("numFailedTests", 0)
    overall = "✅ All tests passed" if failed == 0 else f"❌ {failed} test(s) failed"

    lines = [
        "# Test Report",
        "",
        f"**{overall}** &nbsp;·&nbsp; {passed}/{total} passing &nbsp;·&nbsp; {now}",
        "",
    ]

    for suite in data.get("testResults", []):
        suite_path = os.path.relpath(suite["name"]).replace("\\", "/")
        lines.append(f"## `{suite_path}`")
        lines.append("")

        current_group: list[str] = []

        for test in suite.get("assertionResults", []):
            ancestors = test.get("ancestorTitles", [])
            title = test.get("title", "")
            status = test.get("status", "unknown")
            icon = "✅" if status == "passed" else "❌"

            # Emit group header when it changes
            if ancestors != current_group:
                current_group = ancestors
                if ancestors:
                    level = "#" * min(len(ancestors) + 2, 6)
                    lines.append(f"{level} {' > '.join(ancestors)}")
                    lines.append("")

            lines.append(f"- {icon} {title}")

            if status == "failed":
                for msg in test.get("failureMessages", []):
                    hint = next(
                        (ln.strip() for ln in msg.splitlines() if ln.strip()),
                        "",
                    )
                    lines.append(f"  > 💬 {hint}")

        lines.append("")

    if failed > 0:
        lines += [
            "---",
            "",
            "> ⚠️ Read the messages above — each one tells you exactly what to implement next.",
            "",
        ]
    else:
        lines += [
            "---",
            "",
            "> 🎉 All tests pass! Your implementation is complete.",
            "",
        ]

    return "\n".join(lines)


if __name__ == "__main__":
    data = run_tests()
    passed = data.get("numPassedTests", 0)
    total = data.get("numTotalTests", 0)

    report = build_report(data)
    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        f.write(report)
    print(f"report.md written.")

    # Emit points to GitHub Actions output for the points-bar action
    github_output = os.environ.get("GITHUB_OUTPUT")
    if github_output:
        with open(github_output, "a", encoding="utf-8") as f:
            f.write(f"points={passed}/{total}\n")

    sys.exit(1 if data.get("numFailedTests", 0) > 0 else 0)


def build_report(data: dict) -> str:
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    total = data.get("numTotalTests", 0)
    passed = data.get("numPassedTests", 0)
    failed = data.get("numFailedTests", 0)
    overall = "✅ All tests passed" if failed == 0 else f"❌ {failed} test(s) failed"

    lines = [
        "# Test Report",
        "",
        f"**{overall}** &nbsp;·&nbsp; {passed}/{total} passing &nbsp;·&nbsp; {now}",
        "",
    ]

    for suite in data.get("testResults", []):
        suite_path = os.path.relpath(suite["name"]).replace("\\", "/")
        lines.append(f"## `{suite_path}`")
        lines.append("")

        current_group: list[str] = []

        for test in suite.get("assertionResults", []):
            ancestors = test.get("ancestorTitles", [])
            title = test.get("title", "")
            status = test.get("status", "unknown")
            icon = "✅" if status == "passed" else "❌"

            # Emit group header when it changes
            if ancestors != current_group:
                current_group = ancestors
                if ancestors:
                    level = "#" * min(len(ancestors) + 2, 6)
                    lines.append(f"{level} {' > '.join(ancestors)}")
                    lines.append("")

            lines.append(f"- {icon} {title}")

            if status == "failed":
                for msg in test.get("failureMessages", []):
                    # First meaningful line is the assertion hint
                    hint = next(
                        (ln.strip() for ln in msg.splitlines() if ln.strip()),
                        "",
                    )
                    lines.append(f"  > 💬 {hint}")

        lines.append("")

    if failed > 0:
        lines += [
            "---",
            "",
            "> ⚠️ Read the messages above — each one tells you exactly what to implement next.",
            "",
        ]
    else:
        lines += [
            "---",
            "",
            "> 🎉 All tests pass! Your implementation is complete.",
            "",
        ]

    return "\n".join(lines)


if __name__ == "__main__":
    data = run_tests()
    report = build_report(data)
