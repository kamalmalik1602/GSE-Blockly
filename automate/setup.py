#!/usr/bin/env python3
"""
Customize template files for a student's assigned domain.

Reads automate/options.csv, selects a row based on the GitHub repository name
(stable hash → row index), and replaces {{placeholder}} tokens in all template
files.  Commits the result once; subsequent runs are no-ops.

Supported placeholder tokens (case-sensitive):
  {{domain}}     {{role1}} {{role2}} {{role3}}
  {{action1}} {{action2}} {{action3}}
  {{resource1}} {{resource2}} {{resource3}}
  {{policy_name}}          – PascalCase version of {{domain}}

  UPPER variants of every key above (e.g. {{ROLE1}}) expand to the
  uppercased value of the corresponding lower-key (e.g. CLOUDARCHITECT).
"""

import csv
import hashlib
import os
import re
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
OPTIONS_CSV = Path(__file__).resolve().parent / "options.csv"

# Files that contain {{placeholders}} and must be customized
TEMPLATE_FILES = [
    "src/blocks.ts",
    "index.html",
    "README.md",
    "tests/fixtures/data-viewer.workspace.json",
    "tests/generator.test.ts",
]

PLACEHOLDER_RE = re.compile(r"\{\{[a-zA-Z0-9_]+\}\}")


# ── Helpers ───────────────────────────────────────────────────────────────────


def to_policy_name(domain: str) -> str:
    """'Cloud Infrastructure Access' → 'CloudInfrastructureAccess'."""
    return "".join(
        word.capitalize() for word in re.split(r"[\s\-_]+", domain) if word
    )


def select_row(rows: list[dict]) -> dict:
    """Pick a row deterministically from the GitHub repository name."""
    repo = os.environ.get("GITHUB_REPOSITORY", "")
    repo_name = repo.split("/")[-1] if "/" in repo else repo
    if not repo_name:
        return rows[0]
    index = int(hashlib.sha256(repo_name.encode()).hexdigest(), 16) % len(rows)
    return rows[index]


def build_replacements(row: dict) -> dict:
    """Return a flat {placeholder: value} dict for all keys + UPPER variants."""
    replacements: dict[str, str] = {}
    for key, value in row.items():
        replacements[f"{{{{{key}}}}}"] = value                      # {{role1}}
        replacements[f"{{{{{key.upper()}}}}}"] = value.upper()      # {{ROLE1}}

    policy_name = to_policy_name(row["domain"])
    replacements["{{policy_name}}"] = policy_name
    replacements["{{POLICY_NAME}}"] = policy_name.upper()
    return replacements


def needs_customization() -> bool:
    """Return True if any template file still contains {{...}} tokens."""
    for rel in TEMPLATE_FILES:
        path = REPO_ROOT / rel
        if path.exists() and PLACEHOLDER_RE.search(path.read_text(encoding="utf-8")):
            return True
    return False


def apply_replacements(replacements: dict[str, str]) -> None:
    for rel in TEMPLATE_FILES:
        path = REPO_ROOT / rel
        if not path.exists():
            print(f"  [skip] {rel} — file not found", file=sys.stderr)
            continue
        content = path.read_text(encoding="utf-8")
        for placeholder, value in replacements.items():
            content = content.replace(placeholder, value)
        path.write_text(content, encoding="utf-8")
        print(f"  [done] {rel}")


def commit_customized(domain: str) -> None:
    subprocess.run(
        ["git", "config", "user.name", "github-actions[bot]"], check=True
    )
    subprocess.run(
        [
            "git",
            "config",
            "user.email",
            "github-actions[bot]@users.noreply.github.com",
        ],
        check=True,
    )
    for rel in TEMPLATE_FILES:
        subprocess.run(["git", "add", rel], cwd=REPO_ROOT, check=True)

    diff = subprocess.run(
        ["git", "diff", "--cached", "--quiet"], cwd=REPO_ROOT
    )
    if diff.returncode == 0:
        print("Nothing to commit — files were already customized.")
        return

    subprocess.run(
        [
            "git",
            "commit",
            "-m",
            f"chore: customize for domain '{domain}' [skip ci]",
        ],
        cwd=REPO_ROOT,
        check=True,
    )
    subprocess.run(["git", "push"], cwd=REPO_ROOT, check=True)
    print(f"Committed customization for domain: {domain}")


# ── Entry point ───────────────────────────────────────────────────────────────


def main() -> None:
    if not needs_customization():
        print("Repository already customized — nothing to do.")
        return

    with open(OPTIONS_CSV, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    if not rows:
        print("ERROR: options.csv is empty", file=sys.stderr)
        sys.exit(1)

    row = select_row(rows)
    print(f"Selected domain: {row['domain']}")
    print(f"  policy_name : {to_policy_name(row['domain'])}")
    for key in ("role1", "role2", "role3", "action1", "action2", "action3",
                "resource1", "resource2", "resource3"):
        print(f"  {key:12s}: {row[key]}")

    replacements = build_replacements(row)
    apply_replacements(replacements)
    commit_customized(row["domain"])


if __name__ == "__main__":
    main()
