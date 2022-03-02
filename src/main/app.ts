import fs from 'fs';
import path from 'path';
import { app, BrowserWindow, protocol } from 'electron';

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      standard: true,
      supportFetchAPI: true,
      secure: true,
      corsEnabled: true,
    },
  },
]);

const startTime = Date.now();
let mainWin: BrowserWindow;

app.on('ready', () => {
  protocol.registerBufferProtocol('app', (request, response) => {
    let pathName = new URL(request.url).pathname;
    let extension = path.extname(pathName).toLowerCase();
    if (!extension) return;

    pathName = decodeURI(pathName);

    const filePath = path.join(__dirname, pathName);
    fs.readFile(filePath, (error, data) => {
      if (error) {
        console.error(error);
        return;
      }

      let mimeType = '';
      switch (extension) {
        case '.js':
          mimeType = 'text/javascript';
          break;
        case '.html':
          mimeType = 'text/html';
          break;
        case '.css':
          mimeType = 'text/css';
          break;
        case '.svg':
          mimeType = 'image/svg+xml';
          break;
        case '.json':
          mimeType = 'application/json';
          break;
        default:
          break;
      }

      response({
        mimeType,
        data,
      });
    });
  });

  mainWin = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      webSecurity: false,
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });

  console.log(startTime, Date.now() - startTime);
  if (app.isPackaged) {
    mainWin.loadURL('app://./index.html');
  } else {
    mainWin.loadURL(`http://localhost:${process.env.WEB_PORT}/`);
  }
});
