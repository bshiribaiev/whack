// popup.js

const API_URL = "https://blockscam.us/api/analyze-listing"; // <- backend endpoint

function setText(id, text) {
  document.getElementById(id).textContent = text;
}

function clearList(id) {
  document.getElementById(id).innerHTML = "";
}

function pushList(id, text) {
  const ul = document.getElementById(id);
  const li = document.createElement("li");
  li.textContent = text;
  ul.appendChild(li);
}

function updateUIFromBackend(data, scraped) {
  const title = data.title || scraped.title || "Unknown listing";
  const price = data.price || scraped.priceText || "N/A";
  const label = data.riskLabel || "Unknown Risk";
  const score = typeof data.riskScore === "number" ? `${data.riskScore}%` : "—";

  setText("listingTitle", title);
  setText("listingPrice", price);
  setText("riskScore", `${label} (${score})`);
  setText("platform", scraped.platform || "Unknown platform");

  clearList("whyList");
  clearList("whyNotList");

  if (Array.isArray(data.why)) {
    data.why.forEach((r) => pushList("whyList", r));
  } else {
    pushList("whyList", "Backend did not return 'why' reasons.");
  }

  if (Array.isArray(data.whyNot)) {
    data.whyNot.forEach((r) => pushList("whyNotList", r));
  } else {
    pushList("whyNotList", "Backend did not return 'why not' reasons.");
  }

  setText("status", "Analysis provided by your ShopChain backend.");
}

async function callBackend(scraped) {
  try {
    setText("status", "Contacting backend for risk analysis…");

    const resp = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        url: scraped.url,
        title: scraped.title,
        price: scraped.priceValue,
        seller: scraped.seller,
        bodyText: scraped.bodyText
      })
    });

    if (!resp.ok) {
      throw new Error(`Backend error: ${resp.status}`);
    }

    const data = await resp.json();
    updateUIFromBackend(data, scraped);
  } catch (err) {
    console.error(err);
    setText(
      "status",
      "Backend request failed. Check API_URL or server status."
    );
  }
}

function scanCurrentTab() {
  setText("status", "Scraping current page…");

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || !tabs[0]) {
      setText("status", "No active tab found.");
      return;
    }

    const tab = tabs[0];

    chrome.tabs.sendMessage(
      tab.id,
      { type: "SHOPCHAIN_SCRAPE" },
      (response) => {
        if (chrome.runtime.lastError || !response) {
          setText(
            "status",
            "Could not read the page. Content script may not be running."
          );
          return;
        }

        // scraped now contains { platform, title, priceText, priceValue, seller, url, bodyText }
        callBackend(response);
      }
    );
  });
}

document.addEventListener("DOMContentLoaded", () => {
  scanCurrentTab();

  document.getElementById("rescanBtn").addEventListener("click", () => {
    scanCurrentTab();
  });

  document.getElementById("openWebBtn").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || !tabs[0]) return;
      const url = encodeURIComponent(tabs[0].url || "");
      const target = "https://blockscam.us/?url=" + url;
      chrome.tabs.create({ url: target });
    });
  });
});
