# System Design Wiki

This wiki explains how software services receive requests, store data, and
handle traffic and failures. It introduces the main concepts and then applies
them to a URL shortener, a notification service, and a distributed cache.

The pages assume basic familiarity with web applications. Each page explains
what a component does, how it interacts with other components, and why the
design uses it.

MkDocs turns the Markdown files into a local website. The website includes
search, chapter navigation, and light and dark modes. You can read it in a
browser without installing a browser plugin.

## Learning path

Open [Start here](docs/index.md) to see how the chapters fit together. The
foundation chapters explain requirements, requests, storage, scaling,
background work, reliability, and operations. The design chapters show how a
service uses these concepts together.

If you prefer to begin with a service, read the
[URL Shortener](docs/designs/url-shortener.md) first. Follow how the service
creates a link, saves its mapping, and redirects a user who opens it. Then use
the foundation chapters to study the underlying concepts.

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

The wiki supports learning and reference. Its example targets and designs are
not measured production guarantees.

## Run locally (Windows PowerShell)

Install Python 3.10 or newer if needed. Open PowerShell and run the following
commands. They create a local Python environment, install the required packages,
build the wiki, and start the local website. You do not need to activate the
environment because the commands use its Python executable directly.

```powershell
Set-Location C:\code\SystemDesign-wiki
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m mkdocs build --strict
.\.venv\Scripts\python.exe -m mkdocs serve --dev-addr 127.0.0.1:8000
```

Open **http://127.0.0.1:8000** in your browser. Keep the server running while
reading the wiki; press **Ctrl+C** in its terminal to stop it. When you save a
Markdown page, MkDocs rebuilds the page and refreshes the browser.

If `python` opens the Microsoft Store, use an installed Python executable or
`py -3` instead. This checkout also has a working local executable at
`.\.python\runtime\cpython-3.13.16-windows-x86_64-none\python.exe`.
You can use it to recreate `.venv` if needed.

If you change the dependencies or theme, install the requirements again and
restart the MkDocs server so it loads the updated packages and configuration.

## Files and local-only status

| Path | Purpose |
| --- | --- |
| `docs/` | Course Markdown, diagrams, and restrained typography CSS |
| `mkdocs.yml` | Material theme, grouped navigation, extensions |
| `requirements.txt` | MkDocs and Material dependencies |
| `site/` | Ignored, disposable build output |
| `.venv/`, `.python/` | Ignored local environment and bootstrap runtime |

The repository and website remain local. These setup commands do not publish
the wiki, push files to GitHub, or configure a remote repository. The original
diagram files remain unchanged.
