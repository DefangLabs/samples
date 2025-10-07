# Defang Samples

Samples to show you how to develop, deploy, and debug cloud applications with Defang.

Browse through the [./samples](./samples) directory, or search and browse in the [docs](https://docs.defang.io/docs/samples).

## Adding Samples

To start working on a new sample, run `. ./scripts/new-sample` from the root of the repository. This will create a new sample directory, with some basic scaffolding to get you started. Look for `#REMOVE_ME_AFTER_EDITING` in your new project to look for things that you should probably be changing/checking per sample. Feel free to remove files, like `compose.dev.yaml` if they aren't necessary for your sample.

### Testing Samples

When you add a new sample, make sure to add any config vals to the `deploy-changed-samples.yml` workflow. They need to be prefixed with `TEST_` and those values need to be set in the repo secrets. **NOTE** at the moment test break if we have a config value that only shows up in string interpolation in a longer string, for example in `ENV_NAME: proto://user:${PASSWORD}@host` if `PASSWORD` only ever shows up in that longer string, it will break the test. A workaround is to just add a line with `PASSWORD:` in the environment section, so the test can pick it up. Ugly, but works for now.
