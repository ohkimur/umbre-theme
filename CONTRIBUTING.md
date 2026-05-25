# Contributing to Umbre

Thanks for taking the time to improve Umbre. Contributions are welcome, whether they are bug reports, design feedback, documentation updates, or code changes.

## Ways to contribute

- Report bugs with clear steps to reproduce.
- Suggest improvements to theme colors, contrast, commands, or documentation.
- Open pull requests for focused fixes and enhancements.
- Share accessibility or readability feedback from real daily use.

## Development setup

Umbre uses Bun for development.

```bash
bun install
bun run build
bun run typecheck
bun run test
```

Useful local commands:

```bash
bun run dev:code       # build and open a VS Code extension-development window
bun run dev:cursor     # build and open a Cursor extension-development window
bun run package        # create umbre-theme.vsix from the existing dist/
```

## Pull request guidelines

- Keep changes focused and easy to review.
- Use conventional commit-style titles when possible, such as `fix:`, `feat:`, `docs:`, or `chore:`.
- Run the relevant checks before opening a pull request.
- Include a short description of what changed and why.
- For visual theme changes, describe the affected mode, surface, token group, or command flow.

## Publishing secrets

Publishing runs from `.github/workflows/publish-extension.yml` and uses GitHub Actions repository secrets. Use `.env.example` as the checklist for the required token names and where to create them.

Required secrets:

- `VSCE_PAT` — Azure DevOps Personal Access Token with **Marketplace: Manage** scope for the Visual Studio Marketplace.
- `OVSX_PAT` — Open VSX access token for Cursor-compatible distribution through Open VSX.

Add them in GitHub under **Repository → Settings → Secrets and variables → Actions → New repository secret**.

## Project guardrails

- Do not write, rewrite, or clean user/editor settings such as `settings.json`, `workbench.colorCustomizations`, token customizations, or `workbench.colorTheme`.
- Store configuration through Umbre-owned generated theme files and extension global state.
- Source theme colors must come from the project color system; do not add manual hex literals in source files.
- Keep generated artifacts such as `dist/` and `.vsix` packages out of commits.

## Licensing

By contributing, you agree that your contribution will be licensed under the Apache License 2.0.
