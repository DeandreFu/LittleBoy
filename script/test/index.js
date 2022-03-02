const os = require('os');
const fs = require('fs');
const path = require('path');
const vite = require('vite');
const esbuild = require('esbuild');
const vue = require('@vitejs/plugin-vue');
const spectron = require('spectron');

const cwdDir = process.cwd();

const test = {
  server: null,
  serverPort: 1600,
  electronProcess: null,
  async createServer() {
    const options = {
      configFile: false,
      root: cwdDir,
      server: {
        port: this.serverPort,
      },
      logLevel: 'silent',
      plugins: [vue()],
    };
    this.server = await vite.createServer(options);
    await this.server.listen();
  },
  getEnvScript() {
    let env = require('./env.js');
    env.WEB_PORT = this.serverPort;
    env.RES_DIR = path.join(cwdDir, 'resource/release');
    let script = '';
    for (let v in env) {
      script += `process.env.${v}="${env[v]}";`;
    }
    return script;
  },
  buildMain() {
    const entryFilePath = path.join(cwdDir, 'src/main/app.ts');
    const outfile = path.join(cwdDir, 'release/bundled/entry.js');
    esbuild.buildSync({
      entryPoints: [entryFilePath],
      outfile,
      minify: false,
      bundle: true,
      platform: 'node',
      sourcemap: true,
      external: ['electron'],
    });

    const envScript = this.getEnvScript();
    const js = `${envScript}${os.EOL}${fs.readFileSync(outfile)}`;
    fs.writeFileSync(outfile, js);
  },
  async createElectronProcess() {
    const app = new spectron.Application({
      path: require('electron').toString(),
      args: [path.join(cwdDir, 'release/bundled/entry.js')],
      workingDirectory: cwdDir,
    });

    await app.start();
    return app;
  },
  async start() {
    await this.createServer();
    await this.buildMain();
    const app = await this.createElectronProcess();

    return app;
  },
};

module.exports = test;
