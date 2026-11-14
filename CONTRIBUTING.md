# Contributing

Use the Node version in `.node-version`, install from lockfiles, and run the [setup guide validation commands](docs/SETUP.md#validation) before proposing a change. Keep existing tool behavior and limitations truthful. Add meaningful regression tests for observed failures. Never collect real nearby device identifiers or room imagery in tests or CI.

Keep the helper on loopback, use fixed `execFile` arguments, and exercise it through injected fixtures in tests. Model configuration changes require a frozen, comparable generic-object evaluation and explicit runtime tradeoffs. COCO128 is a development check only. No generic-object result establishes hidden-camera or tracker accuracy.

Run `npm run format` after edits. CI enforces formatting, lint, service type checks, tests, build, initial bundle budget, npm advisories and a pinned Gitleaks scan. No local hooks are installed automatically. Keep datasets, model weights, generated native build assets and credentials outside Git. Use a dedicated branch and a draft PR; do not merge or deploy as part of this quality task.

## License

Contributions intended for inclusion are submitted under the project's [MIT license](LICENSE), unless an explicitly applicable file notice states otherwise. Retain existing third-party notices and identify the source and terms of imported material. See [licensing scope](docs/LICENSING.md) and [third-party notices](THIRD_PARTY_NOTICES.md).
