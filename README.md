# (unofficial) setup-rhino3d

[![tests](https://github.com/smola/setup-rhino3d/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/smola/setup-rhino3d/actions/workflows/ci.yml)

Sets up [Rhino](https://www.rhino3d.com/) in GitHub Actions. Supports version selection and caching.

> [!NOTE]
> This project is not affiliated with or officially supported by McNeel. You can find the official action at [mcneel/setup-rhino3d](https://github.com/mcneel/setup-rhino3d).

### Supported versions

This action supports Rhino 6 or later. It is actively tested with Rhino 6, 7, 8 and 9 WIP.

### Supported platforms

The action works on Windows runners. It is actively tested with the following [GitHub-hosted runners](https://docs.github.com/en/actions/using-github-hosted-runners/about-github-hosted-runners/about-github-hosted-runners#supported-runners-and-hardware-resources): `windows-2019` and `windows-2022`.

## Usage

See [action.yml](action.yml)

```yaml
- uses: smola/setup-rhino3d@main
  with:
    # Whether to cache the Rhino install. Defaults to 'true'.
    cache: "true"

    # Rhino version to install. Supports 6, 7, 8, 9, wip, or a full version.
    # See Version pinning section for more information. Defaults to '8'.
    rhino-version: "8"

    # Optional. Rhino version date to install. This parameter is only required
    # if rhino-version is set to a full version. See the Version pinning
    # section for more information. Defaults to empty.
    rhino-version-date: ""

    # Optional. Email address to use for Rhino 3D installer download.
    email: ""
```

**Basic:**

```
steps:
- uses: actions/checkout@v4
- uses: smola/setup-rhino3d@main
  with:
    rhino-version: '8'
# Now you can use Rhino 8.
```

## Outputs

This action sets several outputs that you can use in subsequent steps.

### `rhino-version`

The exact version of Rhino that was installed. Even if you specify `rhino-version: '8'`, the output will be a full version, such as `8.0.21012.12351`.

### `rhino-version-date`

The date of the Rhino version that was installed. This is only relevant to determine the download URL.

### `rhino-home`

The path to the Rhino installation directory.

## Version pinning

If you just want the latest release of a majr Rhino version, such as latest Rhino 8, you can just use `rhino-version: '8'`.

If you want to pin to a specific version, you have to use the full version number. For example, `rhino-version: '6.35.21222.17001'`. You will also need to set the version date, for example, `rhino-version-date: '20210810'`. To find these two values, you can go to the logs of a setup-rhino3d and look for the download URL. In this example, it would be `https://files.mcneel.com/dujour/exe/20210810/rhino_en-us_6.35.21222.17001.exe`. You can then use these two values to pin the version.

## License

The scripts and documentation in this project are released under the [MIT License](LICENSE).
