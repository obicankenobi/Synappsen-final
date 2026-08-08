#!/usr/bin/env python3
"""Extract the fields that actually matter from a GitHub Actions workflow-run
JSON blob, instead of re-reading (and re-paying tokens for) the full object.

Two ways to use it:

1. After mcp__github__actions_list (list_workflow_runs) overflows to a file
   (it does this automatically above ~400k chars, even with per_page=1):

     python3 gh_run_status.py --overflow-file /path/to/tool-results/....txt

   The overflow file is a JSON object (list_workflow_runs) or a JSON array
   (some other list calls) - this script handles both, and also handles a
   single get_workflow_run object pasted into a file.

2. After mcp__github__actions_get (get_workflow_run) returns its JSON
   directly in a tool result (it usually does NOT overflow, so you already
   paid for it once) - pipe it in on stdin so at least the SUMMARY is what
   you re-read/log, not the full blob, on any later reference:

     echo '<paste the JSON>' | python3 gh_run_status.py

Prints one compact line per run: number, status, conclusion, sha, created_at,
html_url. Nothing else - no owner/repo/urls-to-urls/actor objects.
"""
import argparse
import json
import sys


FIELDS = ("run_number", "id", "status", "conclusion", "head_sha", "head_branch", "created_at", "updated_at", "html_url")


def summarize(run):
    return {k: run.get(k) for k in FIELDS if k in run}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--overflow-file", help="Path to a saved tool-result overflow file")
    parser.add_argument("--limit", type=int, default=5, help="Max runs to print when the input is a list")
    args = parser.parse_args()

    if args.overflow_file:
        with open(args.overflow_file) as f:
            data = json.load(f)
    else:
        data = json.load(sys.stdin)

    runs = data.get("workflow_runs") if isinstance(data, dict) and "workflow_runs" in data else data
    if isinstance(runs, dict):
        runs = [runs]

    for run in runs[: args.limit]:
        print(json.dumps(summarize(run), ensure_ascii=False))


if __name__ == "__main__":
    main()
