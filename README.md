# skatemchenry.org

The site for the McHenry skate homies. This is the short version — if you're an AI agent
or want the full detail, read [CLAUDE.md](CLAUDE.md).

## The 30-second version

You write markdown in `content/`. Hugo turns it into a website in `public/`. Cloudflare
serves that. One small piece of code (`src/index.js`) handles the store checkout and the
`/register` redirect — everything else is just files.

```
content/*.md  →  hugo  →  public/  →  cloudflare
```

## First time on a new computer

```bash
brew install hugo
git clone <this repo> && cd skatemchenry
git submodule update --init --recursive   # grabs the theme — skipping this breaks the build
```

## The usual weekly job: update Skaturday

1. Open [content/skaturday.md](content/skaturday.md) and edit the date, spot, and details.
2. Drop the new poster in `static/images/` and point at it: `![skaturday poster](/images/poster.png)`
3. Preview it: `hugo server -D` → http://localhost:1313
4. Ship it (see Publishing below).

## Editing pages

Every page is one markdown file in `content/`. The filename is the URL —
`content/homies.md` becomes `skatemchenry.org/homies`.

The block at the top between `+++` marks is settings, not content. Leave `title` lowercase
to match the rest of the site. Everything below it is the page.

```
+++
draft = false
title = 'skaturday'
+++

Regular markdown goes here. **bold**, [links](/contact), etc.
```

- **New page:** add `content/whatever.md`, copy the `+++` block from another page.
- **Add it to the menu:** in [hugo.toml](hugo.toml), copy an existing
  `[[languages.en.menu.main]]` block near the bottom. `weight` sets the order.
- **Hide a page:** set `draft = true`.

## Adding images & files

Put the file in `static/images/` (or `static/files/` for PDFs). Then link to it from
markdown **without** the word `static`:

| File on disk | What you write |
| --- | --- |
| `static/images/group.png` | `![the homies](/images/group.png)` |
| `static/files/plan.pdf` | `{{< pdf src="/files/plan.pdf" >}}` |

Match the filename **exactly**, capital letters and all — `Poster.PNG` and `poster.png`
work the same on your Mac but are different files once the site is live.

## Two handy extras

Collapsible section (used all over the homies page):

```
{{< details title="Art" >}}
- [Andrew](https://example.com) - skate edit wizard
{{< /details >}}
```

Embedded PDF: `{{< pdf src="/files/lippold_conceptual_design.pdf" >}}`

## The blog

Posts live in `content/blog/` and show up at
[skatemchenry.org/blog](https://skatemchenry.org/blog). The home page is deliberately
left alone — it still just says "about us".

You can write a post two ways:

**In the browser (easiest).** Go to [skatemchenry.org/admin](https://skatemchenry.org/admin/),
sign in with GitHub, hit *New Post*. Fill in the title, date, a one-line summary, drag in a
cover photo, write the body, Publish. That saves a commit to GitHub, and the site rebuilds
and goes live on its own in a minute or two. This works fine from a phone.

**In a text editor.** Same as any other page:

```bash
hugo new content blog/sep5-recap.md
```

Blog posts use `---` for the settings block instead of `+++` (that's what the browser
editor writes, so both stay consistent):

```
---
title: sep5 recap
date: 2026-09-05T09:00:00-05:00
description: slaybor day sesh, free cold brew, no injuries.
cover: /images/blog/sep5.jpg
draft: false
---
```

Post photos go in `static/images/blog/` and are written as `/images/blog/whatever.jpg` —
the browser editor puts them there for you.

## Publishing

**Pushing to GitHub is the deploy.** A GitHub Action builds the site and ships it to
Cloudflare on every push to `main`, so the normal flow is just:

```bash
git add -A && git commit -m "sep5" && git push
```

Watch it on the repo's **Actions** tab. It takes a minute or two.

If you need to push it live by hand — the Action is broken, or you want to ship something
that isn't committed:

```bash
hugo                          # build
npx wrangler@latest deploy    # push it live
```

Always build before deploying by hand — the built site isn't stored in git, so deploying
without `hugo` first ships the old pages.

## The store

Currently **turned off** (the store/cart links in `hugo.toml` are commented out).

Shirts are listed in the top of [content/store.md](content/store.md) — name, photo, sizes,
and price. **Prices are in cents:** `2500` means $25.00. Photos go in
`static/images/shirts/`.

Checkout goes through Stripe. The secret key lives outside of git — locally in `.dev.vars`,
and on Cloudflare via `npx wrangler@latest secret put STRIPE_SECRET_KEY`. Never paste that
key into a file that gets committed.

⚠️ Before turning the store back on, the checkout code needs a fix: right now the price is
sent from the shopper's browser, so someone technical could pay $0.01 for a shirt. It needs
to look prices up on the server instead.

## Things that will bite you

- **Don't edit anything in `themes/`.** It's someone else's code pulled in from GitHub, and
  your changes will silently disappear. To restyle something, add to `static/style.css` or
  copy the file into `layouts/`.
- **Don't edit `public/`.** It's regenerated from scratch on every build.
- `/register` (the Buss Fest form redirect) only works on the real site, not in
  `hugo server`.

## Setting up the browser editor (one time)

`/admin` is [Sveltia CMS](https://sveltiacms.app/). It's just two files in
`static/admin/` — it edits this repo through GitHub's API, so there's no database and no
extra hosting for the editor itself. It does need a tiny OAuth helper so the "Sign in with
GitHub" button works:

1. Deploy [sveltia/sveltia-cms-auth](https://github.com/sveltia/sveltia-cms-auth) to
   Cloudflare Workers (the repo has a one-click deploy button). You'll end up with a URL
   like `https://sveltia-cms-auth.yourname.workers.dev`.
2. On GitHub, make a new OAuth App at
   [Settings → Developer settings → OAuth Apps](https://github.com/settings/developers).
   Set the **Authorization callback URL** to that Worker URL with `/callback` on the end.
   Copy the Client ID, then generate a Client Secret.
3. Back in the Cloudflare dashboard, on the `sveltia-cms-auth` Worker, under
   Settings → Variables, add `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` (encrypt this one),
   and `ALLOWED_DOMAINS` = `skatemchenry.org`. Redeploy.
4. In [static/admin/config.yml](static/admin/config.yml), replace `SUBDOMAIN` in `base_url`
   with your real workers.dev subdomain. Commit and push.

Anyone you want to let post needs push access to this repo on GitHub.

The auto-deploy Action needs two repo secrets, under Settings → Secrets and variables →
Actions:

- `CLOUDFLARE_API_TOKEN` — a Cloudflare API token with the *Edit Cloudflare Workers* template
- `CLOUDFLARE_ACCOUNT_ID` — from the Cloudflare dashboard sidebar
