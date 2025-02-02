// Dependencies
const {
  app,
  BrowserWindow,
  BrowserView,
  ipcMain,
  WebContentsView,
} = require("electron");
const path = require("path");

let mainWindow;

let browserViews = {};
let currentTabId = 0;

// Function to create the main window
createWindow = (page) => {
  // Create main Window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: true,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.setMaxListeners(50);
  mainWindow.setMenu(null);

  // Load index html file
  mainWindow.loadFile("index.html");

  mainWindow.on("enter-full-screen", () => {
    const view = browserViews[currentTabId];
    // Perform after 100 ms to ensure the window is fully resized
    setTimeout(() => {
      const [width, height] = mainWindow.getSize();
      view.setBounds({ x: 0, y: 0, width, height });
    }, 10);
  });

  mainWindow.on("leave-full-screen", () => {
    const view = browserViews[currentTabId];
    // Perform after 100 ms to ensure the window is fully resized
    setTimeout(() => {
      const [width, height] = mainWindow.getSize();
      view.setBounds({ x: 0, y: 80, width, height: height - 120 });
    }, 10);
  });

  // Create a default tab
  createNewTab(0);

  // Update BrowserView size when window is resized
  mainWindow.on("resize", () => {
    const [width, height] = mainWindow.getSize();
    const view = browserViews[currentTabId];
    if (view) {
      // Adjust the bounds of the current BrowserView to match the new size of the window
      view.setBounds({ x: 0, y: 80, width, height: height - 120 });
    }
  });
};

createNewTab = (tabId, url = "https://www.google.com") => {
  // Create Browser View
  const view = new BrowserView();
  browserViews[tabId] = view;
  mainWindow.setBrowserView(view);
  const [width, height] = mainWindow.getSize();
  view.setBounds({ x: 0, y: 80, width, height: height - 120 });

  view.webContents.loadURL(url);

  // Listen for page title updates
  view.webContents.on("page-title-updated", (event, title) => {
    sendTabDisplayUpdate(tabId, title, getFavicon(view.webContents));
  });

  // Initial tab title and favicon after loading the page
  view.webContents.on("did-finish-load", () => {
    const title = view.webContents.getTitle();
    sendTabDisplayUpdate(tabId, title, getFavicon(view.webContents));
  });

  // Helper function to retrieve the favicon URL
  function getFavicon(webContents) {
    const url = new URL(webContents.getURL());
    return `${url.origin}/favicon.ico`;
  }

  // Function to send tab title and favicon updates to renderer
  function sendTabDisplayUpdate(tabId, title, favicon) {
    mainWindow.webContents.send("update-tab-display", tabId, title, favicon);
  }

  // Handle URL Updates for each view
  view.webContents.on("did-navigate", (event, url) => {
    // Check if 'url' starts with 'https://www.google.com/search?q='
    if (!url.startsWith("https://www.google.com/search?q="))
      mainWindow.webContents.send("update-adress-bar", url);
    // Update Navigation Buttons
    let canGoBack = view.webContents.navigationHistory.canGoBack();
    let canGoForward = view.webContents.navigationHistory.canGoForward();
    mainWindow.webContents.send("update-navigation-state", {
      canGoBack,
      canGoForward,
    });
  });
};

// Function to switch to a specific tab
function switchTab(tabId) {
  const view = browserViews[tabId];
  if (view) {
    mainWindow.setBrowserView(view);
    const [width, height] = mainWindow.getSize();
    view.setBounds({ x: 0, y: 80, width, height: height - 120 });
    currentTabId = tabId;
  }
}

// Create the main window once the app initializes
app.whenReady().then(createWindow);
// Quit the application once all windows has been closed
app.on("window-all-closed", () => {
  if (process.platform !== "darvin") app.quit();
});
// Create the main window if it wasn't created already
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// #region IPC
ipcMain.on("navigate", (event, action, url) => {
  const view = browserViews[currentTabId];
  if (!view) createNewTab(0);
  if (view && view.webContents) {
    switch (action) {
      case "home":
        view.webContents.loadURL(url);
        break;
      case "back":
        view.webContents.navigationHistory.canGoBack() &&
          view.webContents.navigationHistory.goBack();
        break;
      case "forward":
        view.webContents.navigationHistory.canGoForward() &&
          view.webContents.navigationHistory.goForward();
        break;
      case "refresh":
        view.webContents.reload();
        break;
      case "search":
        view.webContents.loadURL(url);
        break;
    }
  }
});

// IPC handlers for new tab and switching tabs
ipcMain.on("new-tab", (event, tabId) => {
  createNewTab(tabId);
});

ipcMain.on("switch-tab", (event, tabId) => {
  switchTab(tabId);
});

ipcMain.on("close-tab", (event, tabId) => {
  if (browserViews[tabId]) {
    // Remove the BrowserView from the main window
    mainWindow.removeBrowserView(browserViews[tabId]);

    delete browserViews[tabId];
  } else {
    console.error(`No BrowserView found for tabId: ${tabId}`);
  }
});

ipcMain.on("log", (event, msg) => {
  console.log(msg);
});
