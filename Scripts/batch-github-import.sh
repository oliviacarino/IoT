#!/bin/bash

GITEA_URL="YOUR_GITEA_IP:PORT"
GITEA_TOKEN="PASTE_GITEA_TOKEN_HERE"
GITHUB_TOKEN="PASTE_GITHUB_TOKEN_HERE"
GITHUB_USER="YOUR_GITHUB_USERNAME"

echo "Fetching GitHub repositories..."

repos=$(curl -s -H "Authorization: Bearer $GITHUB_TOKEN" \
  https://api.github.com/user/repos?per_page=200 | jq -r '.[].clone_url')

for repo in $repos; do

  name=$(basename -s .git $repo)

  echo "Creating mirror for $name..."

  curl -s -X POST "$GITEA_URL/api/v1/repos/migrate" \
    -H "Authorization: token $GITEA_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"clone_addr\": \"$repo\",
      \"repo_name\": \"$name\",
      \"mirror\": true,
      \"private\": true,
      \"auth_token\": \"$GITHUB_TOKEN\"
    }"

  echo ""
done

echo "Done."
