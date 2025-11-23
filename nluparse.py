import argparse
from playwright.sync_api import sync_playwright
from undetected_playwright import Tarnished
from bs4 import BeautifulSoup
import time
import re
import os
import json
from google import genai
from dotenv import load_dotenv

load_dotenv()
genai_apikey = os.getenv("API_KEY")

parser = argparse.ArgumentParser()
parser.add_argument('-u', '--url')
args = parser.parse_args()

def get_url_soup():
    play = sync_playwright().start()

    browser = play.chromium.launch(
        headless=True,
        args=["--disable-blink-features=AutomationControlled"]
    )

    context = browser.new_context(
        user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:145.0) Gecko/20100101 Firefox/145.0"
    )

    Tarnished.apply_stealth(context)

    page = context.new_page()
    def handle_route(route, request):
        if request.resource_type in ["image", "font", "media", "nav", "span"]:
            route.abort()
        else:
            route.continue_()

    page.route("**/*", handle_route)


    page.goto(args.url, wait_until="domcontentloaded", timeout=90000)
    page.wait_for_load_state("networkidle")
    try:
        f_T = page.locator("div[role='button']").all()
        for btn in f_T:
            btn.evaluate("""
        el => {
            const span = [...el.children].find(c => 
                c.tagName === 'SPAN' && 
                c.innerText.trim().toLowerCase() === 'see more'
            );
            if (span) el.click();
        }
    """)
    except Exception as e:
        pass
    page.wait_for_timeout(800)
#     dt_t = {}
#     full_dec = []
#     for btn in f_T:
#         full_dec.append(btn.evaluate("""
#             el => {
#                 return Array.from(el.children).map(child => {
#                     if(child.tagName === 'SPAN') {
#                         return el.parentNode.innerText;
#                     }
#                 });
#             }
# """))
#     dt_t["meta_content_expand"] = next(x for sub in full_dec for x in sub if x is not None)
    time.sleep(1)

    html = page.evaluate("() => document.documentElement.outerHTML")
    scroll_until_feedback(page)

    browser.close()
    play.stop()
    return html


def clean_text(t):
    return re.sub(r'\s+', ' ', t).strip()

def scroll_until_feedback(page, max_scrolls=10, idle_rounds=5):
    target = page.locator("text=/see all feedback/i")

    last_height = 0
    stagnant = 0

    for i in range(max_scrolls):
        # print(f"Scroll #{i+1}")
        if target.count() > 0:
            # print("Found 'See all feedback'!")
            return target.first
        page.evaluate("window.scrollBy(0, document.body.scrollHeight);")
        time.sleep(1)
        new_height = page.evaluate("document.body.scrollHeight")
        if new_height == last_height:
            stagnant += 1
            # print(f"Page stagnant {stagnant}/{idle_rounds}")
        else:
            stagnant = 0

        last_height = new_height
        if stagnant >= idle_rounds:
            # print("Page stopped loading new content — terminating scroll.")
            return None

    # print("Reached maximum scroll limit.")
    return None

def TPM_reducer(ct,mc):
    return ct[ct.find("Share"):]

def extract_page_summary():
    raw_html = get_url_soup()
    soup = BeautifulSoup(raw_html, "html.parser")

    for tag in soup(["script", "style", "noscript"]):
        tag.extract()

    visible_text = clean_text(soup.get_text(separator="/", strip=True))

    jsonlod_blocks = []
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            print(script)
            data = json.loads(script.string)
            jsonlod_blocks.append(data)
        except:
            pass


    tags = {}
    for tag in soup.find_all(True):
        tags[tag.name] = tags.get(tag.name, 0) + 1
    meta_tags = {}   
    for meta in soup.find_all("meta",attrs={"property": True}):
        prop = meta["property"]
        if prop.startswith("og:"):
            meta_tags[prop] = meta.get("content", "")

    #put reducer here
    print(TPM_reducer(visible_text, meta_tags))

    if visible_text.find("Location is approximate") != -1: #needs gen
        return {
            "visible_text": visible_text[visible_text.find("See more"):visible_text.find("Location is approximate")+1],
            "jsonld": jsonlod_blocks,
            "meta_content": meta_tags,
        }
    else: 
        return {
        "visible_text": visible_text,
        "jsonld": jsonlod_blocks,
        "meta_content": meta_tags
    }


test=extract_page_summary()








def AI_testing():
    system_prompt = """
You are a product safety & scam risk evaluator.
Given product details and user feedback, output a structured JSON with:

1. risk_score (integer 0-100, 0 = very safe, 100 = extremely risky)
2. reasons: short bullet points explaining the risk
3. advice: what the buyer should do

Evaluate risk strictly on:
- misleading or incomplete descriptions
- suspicious pricing or seller behavior
- inconsistent or fake reviews
- signs of scams

Please note that there will be lots of noise in the data, do your best to filter through it.
"""
    try:
        client = genai.Client(api_key=genai_apikey)
    except Exception as e:
        print(f"eror: {e}")
    try: 
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=system_prompt+str(test)
        )
        print(response.text)
    except Exception as e:
        print(f"An error occurred during API call: {e}")
# AI_testing()