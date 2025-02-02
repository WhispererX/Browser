// Navigation Buttons
const backButton = document.getElementById("back");
const forwardButton = document.getElementById("forward");
const adressBar = document.getElementById("adress-bar");

// Navigation controls
document
  .getElementById("home")
  .addEventListener("click", () =>
    window.electron.navigate("home", "https://google.com")
  );
document
  .getElementById("back")
  .addEventListener("click", () => window.electron.navigate("back"));
document
  .getElementById("forward")
  .addEventListener("click", () => window.electron.navigate("forward"));
document
  .getElementById("refresh")
  .addEventListener("click", () => window.electron.navigate("refresh"));
document
  .getElementById("search")
  .addEventListener("click", () =>
    window.electron.navigate(
      "search",
      document.getElementById("adress-bar").value
    )
  );

// Adress Bar
window.electron.onUpdateAddressBar((url) => {
  document.getElementById("adress-bar").value = url;
});

adressBar.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    let url = adressBar.value;

    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://www.google.com/search?q=" + url;
    }
    window.electron.navigate("search", url);
  }
});

// Update navigation buttons
window.electron.onUpdateNavigationState((state) => {
  if (!state.canGoBack) {
    backButton.setAttribute("disabled", "true");
  } else {
    backButton.removeAttribute("disabled");
  }

  if (!state.canGoForward) {
    forwardButton.setAttribute("disabled", "true");
  } else {
    forwardButton.removeAttribute("disabled");
  }
});

/* ---------------------------------- Tabs ---------------------------------- */
let currentTabId = 0;
const maxTabs = 15;
let tabsOpened = 1;
const tabs = [];

// Create initial Tab
const tabButton = document.createElement("button");
tabButton.textContent = ``;
tabButton.onclick = () => switchTab(0);

// Create and append close button
const closeButton = document.createElement("span");
closeButton.textContent = "✕";
closeButton.className = "tab-close";
closeButton.onclick = (event) => {
  event.stopPropagation();
  closeTab(0);
};

tabButton.appendChild(closeButton);

document
  .getElementById("tab-bar")
  .insertBefore(tabButton, document.getElementById("new-tab"));
tabs.push(tabButton);

document.getElementById("new-tab").addEventListener("click", () => {
  if (tabsOpened >= maxTabs) return;

  const tabId = tabs.length;
  const tabButton = document.createElement("button");
  tabButton.textContent = ``;
  tabButton.onclick = () => switchTab(tabId);

  // Create and append close button
  const closeButton = document.createElement("span");
  closeButton.textContent = "✕";
  closeButton.className = "tab-close";
  closeButton.onclick = (event) => {
    event.stopPropagation();
    closeTab(tabId);
  };

  tabButton.appendChild(closeButton);

  document
    .getElementById("tab-bar")
    .insertBefore(tabButton, document.getElementById("new-tab"));
  tabs.push(tabButton);

  tabsOpened++;

  // Notify main process to create a new BrowserView for this tab
  window.electron.newTab(tabId);
  switchTab(tabId);
});

// Function to close a tab
function closeTab(tabId) {
  if (tabsOpened === 1) return;
  // Remove the tab button from the UI
  const tabButton = tabs[tabId];
  if (tabButton) {
    //tabs.splice(tabId, 1);

    // If closing the current tab, switch to the last tab or the previous one
    if (tabId === currentTabId) {
      // Filter tabs array to ensure only existing tabs are considered
      const existingTabs = tabs.filter((tab) => tab.isConnected);

      // Find the current index in the existingTabs array
      const currentIndex = existingTabs.indexOf(tabs[tabId]);
      console.log("Current index:", currentIndex);

      if (currentIndex > 0) {
        // Grab the previous element in existingTabs
        const previousTab = existingTabs[currentIndex - 1];

        // Check if the previousTab is inside the original tabs array
        const newTabId = tabs.indexOf(previousTab);

        if (newTabId !== -1) {
          switchTab(newTabId); // Switch to the new tab ID
        } else {
          console.log("Previous tab is not valid.");
        }
      } else if (existingTabs.length > 0) {
        // Fallback to the first tab if no previous tab is found
        switchTab(tabs.indexOf(existingTabs[1]));
      } else {
        console.log("No tabs left.");
      }
    }
    tabButton.remove();
    tabsOpened--;
  }

  // Notify main process to close the corresponding BrowserView
  window.electron.closeTab(tabId);
}

function switchTab(tabId) {
  // Deselect all tabs
  tabs.forEach((tab, index) => {
    tab.classList.toggle("active", index === tabId);
  });

  // Update the current tab ID and switch the BrowserView in the main process
  currentTabId = tabId;
  window.electron.switchTab(tabId);
}

function updateTabDisplay(tabId, title, favicon) {
  const tabButton = tabs[tabId];

  // Clear the tab button's existing content
  tabButton.innerHTML = "";

  // Create and add favicon
  if (favicon) {
    const faviconImg = document.createElement("img");
    faviconImg.style.width = "16px";
    faviconImg.style.height = "16px";
    faviconImg.style.marginRight = "5px";
    faviconImg.src = favicon;
    tabButton.appendChild(faviconImg);
  }

  // Create and add title
  const titleText = document.createElement("span");
  titleText.textContent = title;
  titleText.style.whiteSpace = "nowrap";
  titleText.style.overflow = "hidden";
  titleText.style.textOverflow = "ellipsis";
  tabButton.appendChild(titleText);

  // Create and add close button
  const closeButton = document.createElement("span");
  closeButton.textContent = "✕";
  closeButton.className = "tab-close";
  closeButton.onclick = (event) => {
    event.stopPropagation();
    closeTab(tabId);
  };
  tabButton.appendChild(closeButton);
}

window.electron.onUpdateTabDisplay((tabId, title, favicon) => {
  updateTabDisplay(tabId, title, favicon);
});
