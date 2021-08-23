# Consideration Deploy Bot

> A GitHub App built with [Probot](https://github.com/probot/probot)

## Setup

This app uses `npm` as the package manager, so to get started all you need is an `npm install`.

## Triggers

Currently the workflow is triggered only on Pull Request Labeled and it filters out the labels for 2 different conditions:
- label to be `on staging` - creates a GitHub Deployment
- label to be `deploy to staging` and the branch name to follow the release pattern(e.g `releases/20.12.02`) - creates a GitHub Release, pushes a git tag and lets the PR creator know by approving the PR and sending a comment

## Testing
Currently the only way to develop this is to run the workflow locally on the repository level. For that please check the [test workflow](.github/workflows/test.yml).

## License

[ISC](LICENSE) © 2020 Vladimir Turcan <vladimir.turcan@sumup.com>
