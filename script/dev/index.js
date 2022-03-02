const os = require('os');
const fs = require('fs');
const { spawn } = require('child_process');
const vite = require('vite');
const vue = require('@vitejs/plugin-vue');
const path = require('path');
const esbuild = require('esbuild');

const cwdDir = process.cwd();

const dev = {
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
      plugins: [vue()],
    };

    this.server = await vite.createServer(options);
    await this.server.listen();
    console.log(`the server is running on port: ${this.serverPort}`);
  },
  getEnvScript() {
    const env = require('./env');
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
  createElectronProcess() {
    this.electronProcess = spawn(
      require('electron').toString(),
      [path.join(cwdDir, 'release/bundled/entry.js')],
      {
        cwd: cwdDir,
        stdio: 'inherit',
      }
    );

    this.electronProcess.on('close', () => {
      this.server.close();
      process.exit();
    });

    // this.electronProcess.stdout.on('data', (data) => {
    //   data = data.toString();

    //   console.log(data);
    // });
  },
  async start() {
    await this.createServer();
    await this.buildMain();
    this.createElectronProcess();
  },
};

dev.start();
