# Release Process

## Versioning

We use Semantic Versioning:

- **MAJOR:** Incompatible changes
- **MINOR:** New backward-compatible features
- **PATCH:** Bug fixes and documentation/process releases that do not change the API

## Release checklist

Before tagging:

1. Update [CHANGELOG.md](CHANGELOG.md) for the version.
2. Update `version` in `package.json`.
3. Ensure CI is green (`npm ci`, `npm audit`, `npm test`) on a supported Node.js version.
4. Review documentation touched by the change (README, `docs/`, SUPPORT, SECURITY if needed).
5. Confirm license files will ship with the release:
   - [LICENSE.md](LICENSE.md) (MIT — software)
   - [docs/LICENSE.md](docs/LICENSE.md) (CC BY 4.0 — documentation)
   - [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)
6. Name the MIT (and documentation CC BY 4.0) licenses in the GitHub Release notes.

## Create a GitHub Release

1. GitHub → Releases → “Draft a new release”
2. Tag version (e.g. `v0.2.1`)
3. Title and notes summarizing changes (include license names)
4. Attach or confirm the repository license files are in the source archive GitHub generates
5. Publish the release

The next published GitHub Release after v0.2.0 (changelog-only) is **v0.2.1**. Do not backfill v0.2.0.

## After release

- Announce on GitHub Discussions or the website if the change is major
- Update documentation if anything was missed in the checklist

## Who can release?

Only Jon Penneman (Project Lead) or designated maintainers.

## Frequency

Releases will be made as needed (bug fixes promptly, new features on a reasonable cadence).
