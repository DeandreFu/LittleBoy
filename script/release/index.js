const os = require('os');
const fs = require('fs');
const path = require('path');
const vite = require('vite');
const esbuild = require('esbuild');
const vue = require('@vitejs/plugin-vue');

const cwdDir = process.cwd();

const prod = {
  getEnvScript() {
    let env = require('./env.js');
    let script = '';
    for (let v in env) {
      script += `process.env.${v}="${env[v]}";`;
    }
    script += `process.env.RES_DIR = process.resourcesPath;`;
    return script;
  },
  buildMain() {
    const entryFilePath = path.join(cwdDir, 'src/main/app.ts');
    const outfile = path.join(cwdDir, 'release/bundled/entry.js');

    esbuild.buildSync({
      entryPoints: [entryFilePath],
      outfile,
      minify: true,
      bundle: true,
      platform: 'node',
      sourcemap: false,
      external: ['electron'],
    });
    const envScript = this.getEnvScript();
    const js = `${envScript}${os.EOL}${fs.readFileSync(outfile)}`;

    fs.writeFileSync(outfile, js);
  },
  async buildRender() {
    const options = {
      root: cwdDir,
      build: {
        enableEsbuild: true,
        minify: true,
        outDir: path.join(cwdDir, 'release/bundled'),
      },
      plugins: [vue()],
    };

    await vite.build(options);
  },
  buildModule() {
    const pkgJsonPath = path.join(cwdDir, 'package.json');
    const localPkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
    let electronConfig = localPkgJson.devDependencies.electron.replace('^', '');
    delete localPkgJson.scripts;
    delete localPkgJson.devDependencies;

    localPkgJson.main = 'entry.js';
    localPkgJson.devDependencies = {
      electron: electronConfig,
    };

    fs.writeFileSync(
      path.join(cwdDir, 'release/bundled/package.json'),
      JSON.stringify(localPkgJson)
    );
    fs.mkdirSync(path.join(cwdDir, 'release/bundled/node_modules'));
  },
  buildInstaller() {
    const options = {
      config: {
        directories: {
          output: path.join(cwdDir, 'release'),
          app: path.join(cwdDir, 'release/bundled'),
        },
        files: ['**'],
        extends: null,
        productName: 'little-boy',
        appId: 'site.fujia.app', // the property is important, replace with you own appId
        asar: true,
        extraResources: require('../common/extraResources.js'),
        win: require('../common/winConfig.js'),
        mac: require('../common/macConfig.js'),
        nsis: require('../common/nsisConfig.js'),
        publish: [
          {
            provider: 'generic',
            url: '',
          },
        ],
      },
      project: cwdDir,
    };

    const builder = require('electron-builder');
    return builder.build(options);
  },
  async start() {
    await this.buildRender();
    await this.buildMain();
    await this.buildModule();
    this.buildInstaller();
  },
};

prod.start();
