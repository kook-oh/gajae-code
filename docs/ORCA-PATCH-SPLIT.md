# ORCA Patch Split — P0-FREEZE

Date: 2026-08-13. This is a measurement-only inventory of the frozen ORCA overlay in `/Users/kook/bworx/worx-ide`; no patch was applied.

## Manifest disposition

`patches/materialization.manifest.json:7-23` and `patches/anchors.manifest.json:5-20` both declare 12 active patches and one excluded patch: `05-worx-panels-mount.patch`. The inventory contains 13 `.patch` files; with the two manifest inputs it has 15 patch-ish artifacts.

## Measurement method

Executed in the `worx-ide` checkout for every `patches/*.patch`:

```sh
git apply --numstat --summary < "$patch"
```

The table aggregates numstat rows. “Additive” counts `create mode` records from `--summary`; “in-place” is the remaining changed-file count.

| Patch | Disposition | Files | Added | Deleted | Additive | In-place |
|---|---|---:|---:|---:|---:|---:|
| 01-worx-agent.patch | active | 6 | 13 | 2 | 0 | 6 |
| 04-worx-native-chat.patch | active | 19 | 773 | 27 | 0 | 19 |
| 05-worx-panels-mount.patch | excluded | 8 | 117 | 30 | 0 | 8 |
| 06-worx-agent-catalog.patch | active | 2 | 13 | 1 | 0 | 2 |
| 07-worx-acp-mount.patch | active | 357 | 67,352 | 2,508 | 182 | 175 |
| 08-automations-web-rpc.patch | active | 2 | 314 | 46 | 0 | 2 |
| 08-oci-facade.patch | active | 12 | 3,351 | 2 | 7 | 5 |
| 09-g022-responsive-shell-navigation.patch | active | 23 | 4,087 | 263 | 3 | 20 |
| 10-g022-responsive-chat-terminal.patch | active | 9 | 1,908 | 104 | 4 | 5 |
| 11-g022-responsive-dialogs-palettes.patch | active | 5 | 1,215 | 34 | 2 | 3 |
| 12-g022-responsive-product-pages.patch | active | 11 | 3,019 | 475 | 4 | 7 |
| 13-g022-responsive-landing-onboarding-editor.patch | active | 18 | 2,934 | 217 | 6 | 12 |
| 14-g022-localize-responsive-controls.patch | active | 5 | 55 | 20 | 0 | 5 |

The observed 13 `.patch` files and 15 patch-ish artifacts match the corrected inventory. `05-worx-panels-mount.patch` remains an anchor input only, not an active materialization patch.
