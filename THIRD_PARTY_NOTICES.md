# Third-Party Software

This project uses the following third-party software for development and build
purposes. The distributed rater has no npm runtime dependencies; these packages
are used to compile TypeScript and type the Node.js APIs.

| Component | Version | Purpose | License |
|---|---:|---|---|
| @types/node | 22.20.0 | Node.js TypeScript definitions | MIT |
| TypeScript | 5.9.3 | TypeScript compiler | Apache-2.0 |
| undici-types | 6.21.0 | Transitive dependency of @types/node | MIT |

Dependency versions and licensing information are also recorded in
`package-lock.json`.

## Development infrastructure

The project additionally uses:

- Microsoft Dev Containers TypeScript/Node image (`mcr.microsoft.com/devcontainers/typescript-node`)
- ESLint VS Code extension (`dbaeumer.vscode-eslint`)
- Prettier VS Code extension (`esbenp.prettier-vscode`)
- [contributor-assistant/github-action](https://github.com/contributor-assistant/github-action) (CLA Assistant workflow, pinned to commit `ca4a40a`)

These tools are used in the development environment and CI/contribution
workflow and are not runtime dependencies of the distributed library.
