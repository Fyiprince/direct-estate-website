const { app, BrowserWindow } = require("electron");
const path = require("path");

const isDev = !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    title: "EstateDirect",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  if (isDev) {
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools();
  } else {
    // main.cjs is inside /electron
    // dist is one level above /electron
    const indexPath = path.join(__dirname, "../dist/index.html");

    console.log("Loading:", indexPath);

    win.webContents.openDevTools();

    win.webContents.on("did-finish-load", () => {
      console.log("Page loaded:", win.webContents.getURL());
    });

    win.webContents.on(
      "did-fail-load",
      (event, errorCode, errorDescription, validatedURL) => {
        console.error("LOAD FAILED:", {
          errorCode,
          errorDescription,
          validatedURL,
          indexPath,
        });
      }
    );

    win.loadFile(indexPath);
  }

  win.on("closed", () => {
    // Window cleanup
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});