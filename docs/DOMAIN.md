# Plugging in the custom domain

The site is deployed as a GitHub **user site**, so it is served from
`https://eduardotbuss.github.io` and its `base` path is `/`. That stays `/` before and after
a custom domain, which is the reason no link on the site breaks when the domain arrives.

**There is deliberately no `CNAME` file in this repository.** Committing a `CNAME` for a
domain whose DNS does not resolve yet takes the `github.io` address down. The file is added
at the end of the procedure, not at the start.

## Why it is safe to cite the github.io URL today

When a custom domain is later configured, GitHub redirects the old `<user>.github.io`
address to it. Links already printed in a paper, a CV or an email keep working. So
`https://eduardotbuss.github.io` can be used as the permanent address right now, and the
custom domain becomes the pretty face for the places that are editable in ten seconds:
LinkedIn, the README, an email signature.

## Procedure, once the domain is registered

1. **DNS at the registrar.** Four `A` records for the apex, pointing at GitHub Pages:

   ```
   A   @   185.199.108.153
   A   @   185.199.109.153
   A   @   185.199.110.153
   A   @   185.199.111.153
   ```

   And one record for `www`:

   ```
   CNAME   www   eduardotbuss.github.io.
   ```

   (Check the current addresses against GitHub's documentation before applying them; they
   have changed before.)

2. **Wait for propagation.** Confirm with `dig eduardotbuss.me +short` before continuing.
   Do not proceed while it returns nothing.

3. **Tell GitHub.** Repository → Settings → Pages → Custom domain → `eduardotbuss.me` →
   Save. GitHub creates the `CNAME` file in the repository itself; do not create it by hand.

4. **Wait for the certificate.** Let's Encrypt provisioning takes a few minutes. When the
   warning disappears, tick **Enforce HTTPS**. There is no reason to buy a certificate.

5. **Change one line here.** In `astro.config.mjs`:

   ```diff
   - site: 'https://eduardotbuss.github.io',
   + site: 'https://eduardotbuss.me',
   ```

   `base` is not touched. Push, and the deploy workflow regenerates the canonical URLs, the
   sitemap and the Open Graph metadata.

6. **Update `public/robots.txt`** so the `Sitemap:` line points at the new host.

7. **Update the profile README** in the `EduardoTBuss` repository, where the portfolio link
   is written by hand.

## If the domain is ever dropped

Remove the custom domain in Settings → Pages, revert the `site` value, and the
`github.io` address serves the site again. Nothing else in the repository depends on the
domain.
