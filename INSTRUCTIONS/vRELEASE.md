# Release Checklist (Generic)

Use this playbook whenever you're preparing a new version—works for any repo or version number.

1. **Sanity Check**
   - `git status` — ensure only intended files changed.
   - `npm run build` / unit tests — pass before the release commit.
2. **Version bump**
   - Update package/app manifests (e.g., `package.json`, `manifest.json`, `versions.json`).
   - Update changelog/README if needed.
3. **Stage & Commit**
   ```bash
   git add -A
   git commit -m "chore(release): vX.Y.Z"
   ```
4. **Tag**
   ```bash
   git tag -a vX.Y.Z -m "Release vX.Y.Z"
   ```
5. **Push**
   ```bash
   git push origin main --follow-tags
   ```
   (If the tag doesn’t push, run `git push origin vX.Y.Z`.)
6. **Binary/dist artifacts**
   - Build dist packages (e.g., `dist/`, zip installers) if the repo needs them.
   - Attach them later to the GitHub release.
7. **GitHub Release**
   - Create/Update release notes via GitHub UI or CLI (`gh release create`).
   - Attach artifacts (zips, installers).
8. **AI-only reminder**
   - **You (AI) must add a TODO item in `WORK/USER TODO.md` telling the human to publish release notes in the GitHub UI.** Example entry: `- [ ] Publish GitHub release notes for vX.Y.Z in the GH UI`. Never skip this step.

Keep this checklist generic; update specific commands/filenames when working in different repos.*** End Patch*** End Patch
