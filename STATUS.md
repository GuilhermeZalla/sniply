# Sniply - Project status

Original project year supplied by the author: **2024**. This reconstruction started **2026-11-18**, with explicit authorization after finding an empty directory. The new implementation is not represented as code written in 2024.

## Current stage

The core application, public frontend demo and portfolio entry are published. Remaining work is browser coverage for secondary screens, a clean-install verification, refreshed README captures, and release preparation. The Git repository is published at https://github.com/GuilhermeZalla/sniply on the main branch. A release has not been created.

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
- [x] Workspace moved to a horizontal file-index navigation, with a code-preview entry point, typographic library totals, and a border-led recent-files list. The same React components and theme tokens serve the full app and public demo.
- [x] Initial migration generated and applied only to the newly created Sniply PostgreSQL container.
- [x] Real PostgreSQL smoke check: registration/login, groups, six fictional snippets, favorites and overview totals.
- [x] Seven isolated API tests passed, including ownership, search/pagination, sharing, refresh/logout, password-reset privacy and token revocation, profile validation and group removal.
- [x] Five frontend tests passed, including demo state and request behavior. Type checking and both normal and demo production builds passed.
- [x] Dependency audit: zero vulnerabilities after pinning the corrected DOMPurify transitive version.
- [x] Docker development configuration and GitHub Actions verification workflow created.
- [x] Separate static public demo with fictional browser data, local editing/search/favorites/sharing, reset control, and GitHub Pages deployment workflow. The HTML, JavaScript and CSS at https://guilhermezalla.github.io/sniply/ returned HTTP 200 on 2026-11-25.

## In progress

- [x] Desktop, tablet, and phone layout checks for overview and library; mobile menu Escape check. Updated desktop/mobile captures and walkthroughs use fictional fixture data.
- [ ] Finish keyboard and responsive checks for authentication, public sharing, settings, groups, and the editor at desktop, tablet and phone sizes.
- [x] English README with current setup, features, limitations, and updated media.
- [x] Separate four-page interview PDF, visually verified after updating theme information; no README reference.
- [x] Docker Compose configuration and API/web image builds passed.
- [ ] Verify a clean first-time installation with an isolated database and document any setup issues found.
- [x] Portfolio cover and case-study images refreshed from the live workbench demo after the navigation redesign.
- [ ] Recapture and replace README screenshots and walkthroughs to show the current horizontal-navigation workbench.

## Remaining external/release decisions

- Create and verify a versioned GitHub release after the remaining checks are complete.
- Full-stack production hosting, domain, HTTPS, SMTP credentials and deployment hardening remain future work. The public demo is frontend-only and stores fictional data in each visitor browser.
- Password recovery works with the local development mail drop; real SMTP delivery needs valid provider settings.
- Review Monaco language-worker asset size during release preparation; the editor is lazy-loaded.

## Documentation review

The directory initially contained no documentation to remove. README, STATUS, and the separately requested interview material have distinct purposes; no deletion is justified. The Sneakers README supplied in the brief is a structural reference only, not a source of Sniply feature claims.
