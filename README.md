# otel-action

An action to generate and export export workflow runs as OpenTelemetry traces

> [!CAUTION]
> This action is very experimental.
> While it shouldn't break anything, do set your expectations around stability accordingly.

## How to use

The action is meant to be called after a workflow run has completed.
A workflow that triggers on `workflow_run` is a good starting point.

## Example

```yaml
on:
  workflow_run:
    types:
      - completed
    workflows:
      - list
      - your
      - workflows
      - here
```

You can find an example in this repository at [.github/workflows/export-traces.yml](.github/workflows.export-traces.yml)

## Configuration

The action is using [@opentelemetry/exporter-trace-otlp-proto](https://www.npmjs.com/package/@opentelemetry/exporter-trace-otlp-proto).
As such, you can refer to the [OpenTelemetry Exporter configuration page](https://opentelemetry.io/docs/languages/sdk-configuration/otlp-exporter/) for more information.

alternatively, you can also include an [OpenTelemetry Collector](https://opentelemetry.io/docs/collector/) with Docker in your workflow to cover cases that are not supported out of the box.

### GitHub Permissions

The only permission required is `actions: read`, in order to read your workflow's information.

## inputs

All inputs are required

### `attempt`

The attempt number of the run
Usually `${{ github.event.workflow_run.run_attempt }}`

### `owner`

The owner of the repository where the workflow ran
Usually `${{ github.event.workflow_run.repository.owner.login }}`

### `repo`

The repository where the workflow ran
Usually `${{ github.event.workflow_run.repository.name }}`

### `runId`

The ID of the run to export
Usually `${{ github.event.workflow_run.id }}`

### `token`

The GitHub token to access the run information
Usually `${{ secrets.GITHUB_TOKEN }}`
