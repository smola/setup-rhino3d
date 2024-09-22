import * as core from "@actions/core";
import * as cache from "@actions/cache";
import * as fs from "fs";
import * as https from "https";
import * as child_process from "child_process";
import { Readable } from "stream";
import { finished } from "stream/promises";

async function download(dest, url) {
  const stream = fs.createWriteStream(dest + ".tmp");
  const { body } = await fetch(url);
  await finished(Readable.fromWeb(body).pipe(stream));
  fs.renameSync(dest + ".tmp", dest);
}

async function resolve_location(url) {
  return await new Promise((resolve) => {
    https.get(url, {}, (res) => {
      if (res.statusCode != 302) {
        throw new Error(`Unexpected status code: ${res.statusCode}`);
      }
      resolve(res.headers.location);
    });
  });
}

async function main() {
  switch (process.platform) {
    case "win32":
      break;
    default:
      throw new Error(
        `Unsupported platform: ${process.platform} (only Windows is supported at the moment)`,
      );
  }

  // cache=true to enable caching. save-only is used to save cache but avoid
  // restoring it (used for testing).
  const cacheInput = core.getInput("cache");
  const enabledCacheSave = ["true", "save-only"].includes(cacheInput);
  const enabledCacheRestore = cacheInput == "true";
  if (
    (enabledCacheSave || enabledCacheRestore) &&
    !cache.isFeatureAvailable()
  ) {
    console.error(
      "⚠️ cache was enabled, but cache service is not available in this runner",
    );
  }

  const selectedVersion = core.getInput("rhino-version");
  const email = core.getInput("email");

  process.env.TEMP;
  process.chdir(process.env.TEMP);

  var installerUrl = null;
  var installerFilename = null;
  var rhinoHome = null;
  var version = null;
  var date = null;

  if (core.getInput("rhino-version-date")) {
    version = core.getInput("rhino-version");
    date = core.getInput("rhino-version-date");
    if (!/^\d+\.[0-9.]+$/.test(version)) {
      throw new Error(`Invalid full version: ${version}`);
    }
    installerFilename = `rhino_en-us_${version}.exe`;
    installerUrl = `https://files.mcneel.com/dujour/exe/${date}/${installerFilename}`;
    console.log(`Pinning Rhino version to ${version} (date: ${date})`);
  } else {
    if (!/^\d+$/.test(selectedVersion) && selectedVersion != "wip") {
      throw new Error(`Unknown selected version: ${selectedVersion}`);
    }

    installerUrl = await resolve_location(
      `https://www.rhino3d.com/www-api/download/direct/?slug=rhino-for-windows/${selectedVersion}/latest/&email=${email}`,
    );
    date = installerUrl.match(/\/(\d{8})\//)[1];
    installerFilename = installerUrl.match(/\/([^/]+)$/)[1];
    version = installerFilename.match(
      /rhino_[a-z]{2}-[a-z]{2}_(\d+\.\d+\.\d+\.\d+)\.exe/,
    )[1];
  }

  const majorVersion = version.split(".")[0];
  rhinoHome = `C:\\Program Files\\Rhino ${majorVersion}`;
  if (selectedVersion == "wip") {
    rhinoHome += " WIP";
  }

  core.setOutput("rhino-version", version);
  core.setOutput("rhino-version-date", date);
  core.setOutput("rhino-home", rhinoHome);

  if (fs.existsSync(rhinoHome)) {
    console.log(`🎉 ${rhinoHome} already exists, skipping installation`);
  } else {
    const cachedPaths = [rhinoHome];
    const cacheKey = `smola-setup-rhino3d-v0-${version}-${date}`;

    var cacheWasRestored = false;
    if (enabledCacheRestore) {
      const restoredCacheKey = await cache.restoreCache(cachedPaths, cacheKey);
      if (restoredCacheKey) {
        console.log(
          `🎉 Restored Rhino ${version} install from cache with key: ${restoredCacheKey}`,
        );
        cacheWasRestored = true;
      }
    }

    if (!cacheWasRestored) {
      if (fs.existsSync(installerFilename)) {
        console.log(`${installerFilename} already exists, skipping download`);
      } else {
        console.log("Downloading Rhino installer from", installerUrl);
        await download(installerFilename, installerUrl);
        console.log(
          `Downloaded installer to ${process.cwd()}\\${installerFilename}`,
        );
      }

      console.log(
        `Running: "${installerFilename}" -package -passive -norestart ENABLE_AUTOMATIC_UPDATES=0`,
      );
      child_process.execSync(
        `"${installerFilename}" -package -passive -norestart ENABLE_AUTOMATIC_UPDATES=0`,
        {
          stdio: "inherit",
        },
      );
      console.log(`🎉 Rhino ${version} installation complete`);
      if (enabledCacheSave) {
        console.log(`Caching Rhino ${version} install`);
        await cache.saveCache(cachedPaths, cacheKey);
      }
    }
  }

  process.exit(core.ExitCode.Success);
}

try {
  await main();
} catch (error) {
  core.setFailed(error.message);
  process.exit(core.ExitCode.Failure);
}
