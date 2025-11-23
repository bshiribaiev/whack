// contentScript.js

function getText(el) {
  return el ? el.innerText.trim() : "";
}

function parsePrice(text) {
  if (!text) return null;
  const cleaned = text.replace(/[^0-9.,]/g, "");
  if (!cleaned) return null;
  const normalized = cleaned.replace(",", "");
  const value = parseFloat(normalized);
  return isNaN(value) ? null : value;
}

// --- Site-specific scrapers ---

function scrapeEbay() {
  const title =
    getText(document.querySelector("#itemTitle")) ||
    getText(document.querySelector("h1[itemprop='name']")) ||
    document.title;

  const priceText =
    getText(document.querySelector("#prcIsum")) ||
    getText(document.querySelector("#mm-saleDscPrc")) ||
    getText(document.querySelector(".display-price")) ||
    getText(document.querySelector("[itemprop='price']"));

  const seller =
    getText(document.querySelector("#RightSummaryPanel .mbg-nw")) ||
    getText(document.querySelector(".mbg-nw")) ||
    "";

  return { platform: "eBay", title, priceText, priceValue: parsePrice(priceText), seller };
}

function scrapeAmazon() {
  const title =
    getText(document.querySelector("#productTitle")) ||
    getText(document.querySelector("h1")) ||
    document.title;

  const priceText =
    getText(document.querySelector("#priceblock_ourprice")) ||
    getText(document.querySelector("#priceblock_dealprice")) ||
    getText(document.querySelector(".a-price .a-offscreen"));

  const seller =
    getText(document.querySelector("#sellerProfileTriggerId")) ||
    getText(document.querySelector("#tabular-buybox .tabular-buybox-text")) ||
    "";

  return { platform: "Amazon", title, priceText, priceValue: parsePrice(priceText), seller };
}

function scrapeFacebookMarketplace() {
  const title =
    getText(document.querySelector("h1")) ||
    document.title;

  const priceText =
    getText(document.querySelector("span[dir='auto'][style*='font-size']")) ||
    getText(document.querySelector("div[role='heading'] ~ span")) ||
    "";

  const seller =
    getText(document.querySelector("a[role='link'] span[dir='auto']")) || "";

  return {
    platform: "Facebook Marketplace",
    title,
    priceText,
    priceValue: parsePrice(priceText),
    seller
  };
}

function scrapeCraigslist() {
  const title =
    getText(document.querySelector("#titletextonly")) ||
    document.title;

  const priceText = getText(document.querySelector(".price")) || "";
  const seller = "";

  return {
    platform: "Craigslist",
    title,
    priceText,
    priceValue: parsePrice(priceText),
    seller
  };
}

function scrapeGeneric() {
  const title = document.title;
  const priceText =
    getText(document.querySelector("[itemprop='price']")) ||
    getText(document.querySelector(".price")) ||
    getText(document.querySelector(".product-price")) ||
    "";

  const seller =
    getText(document.querySelector("[data-seller-name]")) ||
    getText(document.querySelector(".seller-name")) ||
    "";

  return {
    platform: "Unknown",
    title,
    priceText,
    priceValue: parsePrice(priceText),
    seller
  };
}

function scrapePage() {
  const host = window.location.hostname;

  if (host.includes("ebay.")) return scrapeEbay();
  if (host.includes("amazon.")) return scrapeAmazon();
  if (host.includes("facebook.com") && window.location.pathname.includes("/marketplace"))
    return scrapeFacebookMarketplace();
  if (host.includes("craigslist.org")) return scrapeCraigslist();

  return scrapeGeneric();
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === "SHOPCHAIN_SCRAPE") {
    try {
      const data = scrapePage();
      const bodyText = document.body.innerText.slice(0, 2000);

      sendResponse({
        ...data,
        url: window.location.href,
        bodyText
      });
    } catch (e) {
      sendResponse({ error: e.message || "Failed to scrape page" });
    }
  }
  return true;
});
