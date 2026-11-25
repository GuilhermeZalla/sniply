# Sniply - Project status

Original project year supplied by the author: **2024**. This reconstruction started **2026-11-18**, with explicit authorization after finding an empty directory. The new implementation is not represented as code written in 2024.

## Current stage

Core implementation and local documentation are complete. Final browser coverage and a clean-install run remain open. The Git repository is published at https://github.com/GuilhermeZalla/sniply on the main branch. A release has not been created.

## Completed

- [x] React/TypeScript/Vite, Tailwind, Lucide and the editorial clay palette (default) and four optional workspace palettes.
- [x] ASP.NET Core/.NET 10, Identity/JWT, EF Core and PostgreSQL.
- [x] Register/login, rotating hashed refresh sessions, logout and password recovery/reset.
- [x] Owner-scoped snippet CRUD, search across title/description/code/language/tags, filters, sorting and pagination.
- [x] Monaco editing/viewing with local workers and fonts; copy feedback.
- [x] Favorites, collections, tags, categories and custom languages.
- [x] Explicit, revocable public links without exposing account information.
- [x] Profile and editor preferences, responsive navigation and accessible confirmation dialogs.
- [x] Five browser-persisted appearance themes (A default, B-E optional), with Monaco light/dark mode and matching brand/favicon colors.
- [x] Authentication redesigned as a focused access panel over a subdued snippet library preview; login, registration and recovery form logic retained.
- [x] Workspace refreshed with a dark code-library navigation, compact dashboard totals, a recent-snippet entry point, search-first library and restrained list styling. Removed repeated overview content and duplicate library toolbar actions.
- [x] Initial migration generated and applied only to the newly created Sniply PostgreSQL container.
- [x] Real PostgreSQL smoke check: registration/login, groups, six fictional snippets, favorites and overview totals.
- [x] Seven isolated API tests passed, including ownership, search/pagination, sharing, refresh/logout, password-reset privacy and token revocation, profile validation and group removal.
- [x] Three frontend helper tests passed. Type checking and production build passed.
- [x] Dependency audit: zero vulnerabilities after pinning the corrected DOMPurify transitive version.
- [x] Docker development configuration and GitHub Actions verification workflow created.
- [x] Separate static public demo with fictional browser data, local editing/search/favorites/sharing, reset control, and GitHub Pages deployment workflow.

## In progress

- [x] Desktop, tablet, and phone layout checks for overview and library; mobile menu Escape check. Updated desktop/mobile captures and walkthroughs use fictional fixture data.
- [ ] Complete keyboard and responsive checks for authentication, public sharing, settings, groups, and the editor. Existing captures and responsive CSS were reviewed statically; live browser verification was interrupted by the computer-use approval limit.
- [x] English README with current setup, features, limitations, and updated media.
- [x] Separate four-page interview PDF, visually verified after updating theme information; no README reference.
- [x] Docker Compose configuration and API/web image builds passed.
- [ ] Complete a fresh installation with an isolated database. The Docker engine was unavailable after the session interruption.

## Remaining external/release decisions

- The origin remote is https://github.com/GuilhermeZalla/sniply.git, and main has been pushed. A tagged release remains pending.
- Production hosting, domain, HTTPS, SMTP credentials and deployment hardening are not configured.
- Password recovery is tested through the local development mail drop; real SMTP delivery needs valid provider settings.
- Monaco is lazy-loaded; its language workers still produce large build assets.

## Documentation review

The directory initially contained no documentation to remove. README, STATUS, and the separately requested interview material have distinct purposes; no deletion is justified. The Sneakers README supplied in the brief is a structural reference only, not a source of Sniply feature claims.
