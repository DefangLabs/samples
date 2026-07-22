#!/bin/bash

# Lists samples created or modified by the commits this push added to the
# branch, so their template repos can be republished.
#
# We diff across the WHOLE push range (github.event.before .. HEAD), not just
# the tip commit: a single push can land several commits at once (rebase-merge,
# or a direct multi-commit push), and every touched sample must sync — not only
# the one in the last commit. Falls back to HEAD~1 for manual runs or an
# unknown/first-push before-SHA (all zeros, or not fetched).

before="${BEFORE_SHA:-}"
zero="0000000000000000000000000000000000000000"
if [ -z "$before" ] || [ "$before" = "$zero" ] || ! git rev-parse --verify --quiet "${before}^{commit}" > /dev/null 2>&1; then
    before="HEAD~1"
fi

for dir in samples/*/; do
    # Print the directory if any file under it changed across the push range
    # (--diff-filter=d excludes pure deletions, which can't be republished).
    if git diff --name-only --diff-filter=d "${before}..HEAD" | grep -q "^${dir}"; then
        echo "$dir"
    fi
done
