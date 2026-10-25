# System Design Wiki

This wiki explains how software services receive requests, store data, and
handle traffic and failures. It introduces the main concepts and then applies
them to a URL shortener, a ticket booking system, a notification service, and a
distributed cache.

The pages assume basic familiarity with web applications. Each page explains
what a component does, how it interacts with other components, and why the
design uses it.

The frontend uses **React + JavaScript (JSX) + Vite**, with the existing Markdown
files as its content. There is no backend, database, authentication, or external
search service.

The home workspace includes continue reading, recently updated notes, bookmarks,
and categories. Search opens with Ctrl/Cmd+K. Articles include a generated table of
contents, code copying, reading progress, and an optional focus mode. The original
shopping-app walkthrough is available at `/introduction/`; other document URLs
remain unchanged. Old homepage section links redirect to the walkthrough.

## Learning path

Open [Start here](docs/index.md) for an introduction that follows a shopping
request and explains why a service needs each component. The foundation
chapters explain requirements, requests, storage, scaling,
background work, reliability, and operations. The design chapters show how a
service uses these concepts together.

If you prefer to begin with a service, read the
[URL Shortener](docs/designs/url-shortener/index.md) first. Follow how the service
creates a link, saves its mapping, and redirects a user who opens it. Then use
the foundation chapters to study the underlying concepts.

The [Ticket Booking System](docs/designs/ticket-booking/index.md) follows event
search, temporary seat holds, payment, and ticket confirmation. It includes the
supplied editable Excalidraw board and a local preview of its latest section.

The [E-commerce Checkout & Inventory design](docs/designs/ecommerce/index.md)
covers TTL-backed SKU reservations, PostgreSQL-authoritative sales, and
idempotent Redis stock updates after payment.

The [Uber System Design notes](docs/designs/uber/Uber-System-Design.md) cover
ride booking, location tracking, and real-time communication. The separate
[Driver Matching notes](docs/designs/uber/Uber-Driver-Matching.md) explain Redis
reservations, sequential offers, timeouts, and recovery.

The [Amazon Prime Video-like design](docs/designs/prime-video/index.md) follows
studio asset delivery, direct-to-S3 uploads, media-aware processing, quality
checks, safe publication, authorized playback, and CDN/origin-shield scaling.
It is an interview architecture, not Amazon's internal design.

After reading a chapter, try its exercise before opening the answer guidance.
[Exercises & Reference](docs/10-practice.md) provides additional practice and
links for further reading.

## Documentation standard

Write each page in plain technical English. Start by defining the topic, then
explain how it works. State who performs each action, what data the action uses,
and why the action is needed.

For example, write: "The service saves the mapping in its database so it can
find the original URL later." Do not replace that explanation with a compressed
label such as "persistent lookup mapping."

- Use simple verbs such as submit, generate, check, save, find, and return.
- Explain conditions directly: if an alias is available, save the mapping;
  if it is already in use, reject the request.
- Define technical terms when first used and explain the mechanism before its limits.
- Use user, customer, client, service, or database instead of fictional characters.
- Use paragraphs for connected explanations and lists or tables for separate rules.
- Repeat a technical noun when a pronoun would make the meaning unclear.
- State assumptions and explain what each design choice costs or cannot guarantee.
- Keep advanced details separate and preserve working examples, diagrams, and links.
- Keep each design in one continuous document, with sections for flows, API/data,
  scaling, and exercises instead of separate pages for each topic.
- Label exercises as conceptual or hands-on. Supply the assumptions, required material,
  and completion criteria; a hands-on lab also needs a runnable environment and steps.

The wiki supports learning and reference. Its example targets and designs are
not measured production guarantees.

## Run locally (Windows PowerShell)

Use Node.js 22.12+ or 24 LTS. With Node/npm on your PATH:

```powershell
Set-Location C:\code\SystemDesign-wiki
npm.cmd ci
npm.cmd run dev
```

Open **http://127.0.0.1:8001**. On subsequent visits, run only `npm.cmd run dev`.
The development server updates the browser when JavaScript, CSS, or Markdown
changes. It listens only on your computer and refuses to replace another process
already using port 8001.

This checkout also has an ignored portable Node installation. If Node is not on
your PATH, add it for the current PowerShell terminal before running npm:

```powershell
$env:PATH = (Resolve-Path '.\.node\node-v24.22.1-win-x64').Path + ';' + $env:PATH
npm.cmd run dev
```

### Build and tests

```powershell
npm.cmd test
npm.cmd run build
```

The production build goes into ignored `dist/`. After stopping the React
development server, `npm.cmd run preview` serves that build on port 8001.
The build creates static entry pages for application routes such as
`/01-thinking/`, so direct links and refreshes work on GitHub Pages.

### GitHub Pages

The site is published at https://svmgarg.github.io/SystemDesign-wiki/.
The workflow in `.github/workflows/pages.yml` runs tests, builds, and deploys
on pushes to `main`, or when run manually from GitHub Actions. Repository
Settings > Pages must use **GitHub Actions** as the build source.
The workflow sets `PAGES_BASE_PATH` to the Pages subpath; local development
continues to use `/`.

### Compare the three reading layouts

Open **http://127.0.0.1:8001/concepts/** and select A, B, or C. Each uses the same
Requirements document. A removes secondary reading controls; B balances reading
with bookmarks, progress, and context; C hides persistent navigation and expands
the article to the full available width, with responsive page padding.
**B is the default recommendation** for daily learning. Focus mode
is also available from any document.

### Archived legacy version

The Python/MkDocs source has been removed from the active wiki and preserved
in `archives\legacy-mkdocs.zip`. The archive contains the final working-tree
copies of `mkdocs.yml`, `requirements.txt`, `overrides\main.html`,
`overrides\partials\header.html`, and `docs\stylesheets\extra.css`, with their
relative paths preserved.

Shared Markdown and diagrams remain in `docs\`; they are not duplicated in
the archive. Installed Python environments and generated MkDocs output are
not source and are not included in the ZIP. The generated `site\` directory
and repository-local `.venv\` and `.python\` environments have been removed.
System-wide Python installations are unaffected.
No Python installation or MkDocs preview is needed for the current wiki.

## Files and workspace structure

### Old and new version directories

The current application lives in `C:\code\SystemDesign-wiki`. Old-version
paths below now refer to entries inside `archives\legacy-mkdocs.zip`, not active
source directories. Shared content remains under `docs\`, including both Uber
documents under `docs\designs\uber\`.

| Area | Old version: MkDocs | New version: React + Vite |
| --- | --- | --- |
| Application source | MkDocs Material with templates in `overrides\` and `overrides\partials\` | `src\`, including `src\components\` and `src\pages\` |
| Styles | `docs\stylesheets\extra.css` | `src\styles\` |
| Entry point and configuration | `mkdocs.yml` | `index.html`, `src\main.jsx`, `vite.config.js`, `site.config.js`, `content.config.js` |
| Dependencies | Archived `requirements.txt` | `package.json`, `package-lock.json`; installed packages in `node_modules\` |
| Build helpers | MkDocs CLI | `scripts\` |
| Generated site, not source | `site\` | `dist\` |
| Local preview | Retired | `http://127.0.0.1:8001` |

Edit notes in `docs\`, not generated files in `site\` or `dist\`.
Register new pages only in `content.config.js`. The current React start
commands are listed above.

| Path | Purpose |
| --- | --- |
| `site.config.js` | Shared product name, description, and logo URL |
| `docs/brand.svg` | Single logo asset used in the header and browser tab |
| `content.config.js` | Document/category registry and nested navigation |
| `src/styles/tokens.css` | Fonts, text darkness, light/dark colors, and layout dimensions |
| `src/styles/app.css` | Shared components and responsive styling |
| `src/components/` | Header/sidebar, command search, and reusable controls |
| `src/pages/` | Learning dashboard, library views, and document reader |
| `src/content.js`, `src/markdown.js` | Markdown loading, search, links, code, callouts, and headings |
| `src/workspace.jsx` | Browser-local bookmarks, history, reading position, and preferences |
| `docs/` | Existing learning Markdown and local diagrams |
| `docs/designs/url-shortener/` | Single-page URL Shortener design and local diagrams |
| `docs/designs/ticket-booking/` | Single-page Ticket Booking design and original Excalidraw board with local SVG previews |
| `vite.config.js`, `package.json` | React development/build configuration and dependencies |
| `dist/`, `node_modules/`, `.node/` | Ignored build output, packages, and portable Node |
| `archives/legacy-mkdocs.zip` | Archived MkDocs configuration, templates, requirements, and stylesheet |

### Updating the workspace

#### Add a learning document without editing React

1. Create `docs\designs\chat-system.md` in any text editor:

   ```markdown
   # Chat System

   Your notes go here.

   ## Requirements

   Add your requirements here.
   ```

2. Add one entry inside the `documentEntries` array in `content.config.js`:

   ```js
   { id: 'chat-system', file: 'designs/chat-system.md', title: 'Chat System', category: 'designs' },
   ```

3. Save both files. With `npm.cmd run dev` running, the note appears automatically
   in navigation, the document library, and search at `/designs/chat-system/`.
   Heading links, the table of contents, code copying, reading time, and bookmark
   controls are generated for you.

Use a unique `id` and keep it unchanged after publishing so bookmarks and history
continue to identify the note. Choose an existing category: `foundations`,
`designs`, or `practice`. The registry order determines sidebar and previous/next
order within each category. To revise an existing note, edit only its Markdown.
No React changes, AI, database migration, or package installation is needed for
content updates. Run `npm.cmd run build` before publishing a revised site.

The root `README.md` is ordinary project documentation, not a learning page.
Edit it directly whenever setup or maintenance instructions change. To publish a
README as a learning page, put that Markdown file under `docs` and register it
like any other note.

#### Content conventions and shared settings

Start system-design documents with `## Basic description`, followed by
`## Functional requirements` and `## Non-functional requirements`. Use bullets
for both requirement sections and distinguish design targets from measured
guarantees. Keep detailed flows, contracts, and original diagrams below them.
SQL reference documents can keep their query-focused structure.

Diagrams are separate SVG or PNG files, not image data embedded in Markdown.
A normal linked diagram uses:

```markdown
[![Describe the diagram](assets/overview.svg)](assets/overview.svg)
```

For a horizontal diagram that must remain readable on small screens, use the
shared scroll wrapper. Keep the blank lines around the Markdown image:

```markdown
<div class="diagram-scroll" role="region" aria-label="Architecture diagram; scroll horizontally" tabindex="0" markdown="1">

[![Describe the diagram](assets/overview.svg)](assets/overview.svg)

</div>
```

The inner line is ordinary Markdown: the `!` displays the image and the outer
link opens the original file. Paths are relative to the Markdown source file.
The wrapper adds keyboard-accessible horizontal scrolling without shrinking
diagram labels in the React reader.
Keep original Excalidraw sources and exported boards unchanged; use a separate
overview SVG when a clearer left-to-right explanation is needed.

#### Automatically preview an Excalidraw file

Use a normal Markdown image pointing directly to the local `.excalidraw` file:

```markdown
![My architecture board](assets/my-board.excalidraw)
```

React renders the file as a read-only board with Fit, 100%, zoom controls,
scrolling, and source/SVG downloads. Expand opens a full-screen overlay with its
own zoom controls and downloads; Close or Escape returns to the article without
changing its inline zoom. Use this image line on its own, without an
outer Markdown link or the horizontal SVG wrapper. The rendering library loads
only when a board approaches the viewport; normal articles do not load it.
Loading and invalid-file errors appear inside the board with a retry control.

Edit the original in Excalidraw and save it back to the same file. The local
development preview reloads when it changes; there is no manual SVG export.
For a published site, rebuild and redeploy changed files as usual. Rendering
happens in the browser without an editor, backend, or upload to another service.
Embedded images must be included in the drawing rather than linked externally.

Excalidraw fonts are copied from the npm package into ignored
`docs\excalidraw-assets` automatically before development and production builds.
Keep that generated folder out of Git. Retain existing SVG/PNG exports for
reference alongside the original drawing.

Edit notes in `docs/`. To add a document, register its file, title, category, and
stable ID in `content.config.js`; use `parent` for a nested document. Markdown
links resolve relative to the source file, including diagrams and downloadable
Excalidraw boards. Supported content includes tables, highlighted code fences,
MkDocs-style `!!!` callouts, and `???` expandable answers. Displayed update dates
come from source-file modification times at server startup/build.

Change branding only in `site.config.js` and `docs/brand.svg`. Change fonts,
colors, and text darkness only in `src/styles/tokens.css`; both themes share the
same components. Navigation, search, and article layouts are reusable React
components, not separate per-document templates. Application code is JavaScript
and JSX, not TypeScript.

Bookmarks, recently opened documents, reading position, theme, and navigation
preferences use browser localStorage. They are specific to this browser/origin;
they do not sync across devices. Clearing browser data removes them. Storage
and clipboard failures produce visible messages rather than pretending to save
or copy successfully.

### Presentation

This is a personal learning wiki, not a product or sales site. Prioritize
comfortable reading and straightforward navigation over promotional layouts.

Keep chapters in plain Markdown, with descriptive links and ordinary lists.
Do not add marketing heroes, promotional cards, or call-to-action buttons.
The home workspace should help resume reading, not display artificial metrics.
Use system fonts and the shared React design tokens instead of page-specific
font or color overrides.

Use the available article column between the navigation panels, rather than
setting separate widths on paragraphs. Headings, prose, code blocks, tables, callouts, and diagrams
must use the same content boundaries. Keep wide code and tables scrollable within
their containers instead of stretching the page, including on narrow screens.

When changing presentation, check both color schemes and narrow screens.
Keep links descriptive, preserve visible keyboard focus, and keep diagrams
linked to their full-size local files. Use short chapter introductions to
explain the learning goal without repeating the entire chapter.

Preview Excalidraw boards directly from their local `.excalidraw` files in React.
Keep the originals available for download and retain existing SVG/PNG exports;
no embedded editor or external diagram service is needed.

Use an AWS-documentation-inspired sidebar: a fixed title, independently scrolling
navigation, compact rows, leading disclosure chevrons, and indented child pages.
Categories and document branches expand independently, and their choices persist
in browser storage. Navigating to a document opens its ancestors; users can still
collapse them afterward. Use an accent-colored active link with `aria-current`,
not a large filled card. Preserve keyboard focus and the mobile navigation drawer.
New workspaces default to a dark navy/slate palette with blue links. Existing
saved theme choices and the light-theme toggle remain supported.
Do not show a site footer, previous/next page strip, or theme branding.
Apply the modest font-size increase at the root so body text, navigation, tables,
and code scale together. Use darker text in light mode and high-contrast light
text in dark mode.
Keep the header as a compact, neutral toolbar with inline desktop navigation,
search, a theme toggle, and a small diagram-style logo. Use restrained heading sizes and
rounded code blocks for a document-first reading experience.
On smaller screens, retain the navigation drawer.
The shared components live in `src/components/`; shared styles live in
`src/styles/`.

The source repository is private at
[svmgarg/SystemDesign-wiki](https://github.com/svmgarg/SystemDesign-wiki).
GitHub Pages is not enabled; the website runs locally using the commands above.
Those commands do not push files or publish a website. The original diagram
files remain unchanged.
