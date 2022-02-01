# action-dev-tagger

This GitHub Action helps easily manipulate tags, used explicitly for pre-release tags that should move and follow the progress.

## Example

This example demonstrates using this action to "update" and "move" the `v0.0.1-dev.NNN` tags.

```yaml
- name: 🏷 dev tags
  uses: endaft/action-dev-tagger@v1.0.0
  with:
    token: ${{ secrets.GITHUB_TOKEN }}
    prefix: v0.0.1-dev.
    tag: ${{ format('v0.0.1-dev.{0}', github.run_number) }}
```

## Inputs

| name       | required | description                                                   | default |
| ---------- | -------- | ------------------------------------------------------------- | ------- |
| **token**  | `true`   | The GitHub Token to use for reference management in the repo. |         |
| **prefix** | `true`   | The prefix to match against existing tags for deletion.       |         |
| **tag**    | `true`   | The value of the new tag to be created.                       |         |

## Outputs

None
