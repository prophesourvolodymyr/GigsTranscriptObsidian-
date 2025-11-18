# Project Initialization Guide (New Repo)

Use this checklist to spin up a fresh repository that mirrors the current GigaTrasscript workflow.

## 1. Collect & Normalize Ideas
1. Open the `NOTES/` folder and copy every idea/feature note into a temporary workspace.
2. Consolidate overlapping ideas, remove duplicates, and convert them into clear feature statements.
3. Assign each feature an ID starting with `F1`, `F2`, … following impact/priority order.

## 2. Build the Feature Spec Folder
1. Create `FEATURES/` and add one Markdown file per feature using the `F#-Name.md` convention (e.g., `F1-Enhanced-Video-Support.md`).
2. Inside each file include: Problem, Goals, Implementation Plan, Acceptance Criteria, Risks.
3. Duplicate the existing repo’s structure if helpful (F1–F12) but tailor the content to the new project.

## 3. Author `WORK/PROGRESS.md`
1. Copy the structure from the current repo’s `WORK/PROGRESS.md` (feature-based TODO tracker).
2. Replace the feature entries with the new F1+ roadmap created above.
3. Ensure every feature has actionable checklist items; leave space for DONE logs.

## 4. Rebrand the AI Guide
1. Duplicate `WORK/CODEBASE- GENERAL-AI-GUIDE.md` from this repo into the new project.
2. Update product name, architecture notes, folder descriptions, and any workflow steps that differ.
3. Keep the same sections (Product Snapshot, Folder Overview, High-Touch Markdown, etc.) so future agents can onboard quickly.

## 5. Add Licensing (if open source)
1. Decide on the license (MIT, Apache-2.0, GPL, etc.) based on the project’s distribution needs.
2. Drop the full text into a `LICENSE` file at the repo root.
3. Mention the license in `README.md` so contributors know the terms.
4. If you have multiple packages, ensure each includes the correct header or LICENSE copy.

## 6. Initialize Git & Connect Remote
1. From the new project root:
   ```bash
   git init
   git add .
   git commit -m "chore: bootstrap project structure"
   git branch -M main
   git remote add origin <NEW_REPO_URL>
   git push -u origin main
   ```
2. Replace `<NEW_REPO_URL>` with the link you’ll provide.
3. Confirm `git status` is clean afterward.

## 7. Final Review
- Verify `NOTES/` now only contains raw input, while `FEATURES/` holds the cleaned roadmap.
- Double-check that `WORK/PROGRESS.md` references each F-numbered spec.
- Confirm the rebranded guide reflects the new repo name and any unique tooling.
- If anything else is needed (CI setup, README refresh, etc.), add it before the first push.

Did I miss anything you want in this kickoff guide? Let me know and I’ll expand it before you transfer it over.
