import { promisify } from 'util';
import { exec as execCb } from 'child_process';
import os from 'os';
import fs from 'fs';
import path from 'path';
import { mkdtemp } from 'node:fs/promises';
import chalk from 'chalk';

const exec = promisify(execCb);

async function getJupyterLiteInstalledVersion() {
  try {
    const res = await exec('jupyter lite --version');
    if (res.stderr === '') return res.stdout.trim();
    console.error(chalk.red(res.stderr));
    process.exit(-1);
  } catch (err: any) {
    console.error(chalk.red(err.stderr));
    process.exit(1);
  }
}

function getJupyterLiteDependencyVersion() {
  const json = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../package.json'), {
      encoding: 'utf8',
    })
  );

  return json.dependencies['@jupyterlite/server']
    .replace('^', '')
    .replace('-beta.', 'b')
    .replace('-alpha.', 'a')
    .trim();
}

function getWheelsAndSpec(
  litePath: string,
  pyoliteVersion: string
): {
  json: any;
  wheels: { filename: string; filepath: string }[];
} {
  const readPath = path.join(litePath, 'build', 'pypi');
  const jsonPath = path.join(readPath, 'all.json');
  const json: { [x: string]: { releases: { [x: string]: { filename: string }[] } } } = JSON.parse(
    fs.readFileSync(jsonPath, { encoding: 'utf8' })
  );

  const wheels: string[] = Object.entries(json).reduce((acc, [dependency, item]) => {
    if (dependency === 'piplite' || dependency === 'pyolite') {
      return acc.concat(item.releases[pyoliteVersion].map((r) => r.filename));
    }
    const versions = Object.keys(item.releases);
    if (versions.length > 1) {
      console.warn(
        chalk.yellow(
          `Multiple versions of ${dependency} found: ${versions.join(', ')}, using ${versions[0]}`
        )
      );
    }
    return acc.concat(item.releases[versions[0]].map((r) => r.filename));
  }, [] as string[]);

  return {
    json: jsonPath,
    wheels: wheels.map((w) => ({ filename: w, filepath: path.join(readPath, w) })),
  };
}

async function main(copyIndex = false, outdir = path.join(__dirname, '..', 'demo')) {
  const installedVersion = await getJupyterLiteInstalledVersion();
  const dependencyVersion = await getJupyterLiteDependencyVersion();
  if (installedVersion !== dependencyVersion) {
    console.error(
      chalk.red(`Error - both installed and dependency versions of jupyterlite must match`)
    );
    console.error(chalk.red(`Got installed: ${installedVersion}`));
    console.error(chalk.red(`Requires: ${dependencyVersion}`));
    process.exit(1);
  }
  console.log(chalk.green(`Using jupyterlite ${installedVersion}`));
  const tmpPath = await mkdtemp(`${os.tmpdir()}${path.sep}thebe`);
  console.log(chalk.green('Building temporary site in', tmpPath));

  await exec(`jupyter lite build --lite-dir=${tmpPath}`);

  const litePath = path.join(tmpPath, '_output');
  if (!fs.existsSync(litePath)) {
    console.error(chalk.red(`Can't find lite output folder at ${litePath}`));
    console.error(chalk.red('Maybe `jupyter lite build` did not complete'));
    process.exit(1);
  }

  const { json, wheels } = getWheelsAndSpec(litePath, dependencyVersion);
  console.log(
    chalk.green(`Found ${wheels.length} wheels: ${wheels.map(({ filename }) => filename)}`)
  );

  const buildPyPi = path.join(outdir, 'build', 'pypi');
  fs.mkdirSync(buildPyPi, { recursive: true });
  console.log(chalk.green(`Created ${buildPyPi}`));

  fs.copyFileSync(json, path.join(buildPyPi, 'all.json'));
  console.log(chalk.green(`Copied ${json} to ${path.join(buildPyPi, 'all.json')}`));
  wheels.forEach((w) => {
    fs.copyFileSync(w.filepath, path.join(buildPyPi, w.filename));
    console.log(chalk.green(`Copied ${w.filepath} to ${path.join(buildPyPi, w.filename)}`));
  });

  fs.rmdirSync(tmpPath, { recursive: true });

  console.log(chalk.green('Adding stub api/contents'));
  const apiContents = path.join(outdir, 'api', 'contents');
  fs.mkdirSync(apiContents, { recursive: true });
  fs.copyFileSync(path.join(__dirname, 'contents.json'), path.join(apiContents, 'all.json'));
  console.log(
    chalk.green(
      `Copied ${path.join(__dirname, 'contents.json')} to ${path.join(apiContents, 'all.json')}`
    )
  );

  console.log(chalk.green('Success!!'));
}

const myArgs = process.argv.slice(2);
if (myArgs.length > 0 && myArgs[0] === '--help') {
  console.log('You may supply an alternative output folder');
  process.exit(0);
}

if (myArgs.length > 0) {
  console.log(chalk.bgGreen(`Building demo/starter assets in ${myArgs[0]}`));
  main(true, myArgs[0]);
} else {
  main();
}
