import json
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from geopy.geocoders import Nominatim

# Setup ChromeDriver path (relative to your project)
CHROMEDRIVER_PATH = "C:/Users/Dillon/Documents/conocancer-map/scraper/drivers/chromedriver.exe"

# Configure browser
chrome_options = Options()
chrome_options.add_argument("--headless")
chrome_options.add_argument("--no-sandbox")
chrome_options.add_argument("--disable-dev-shm-usage")
service = Service(CHROMEDRIVER_PATH)
driver = webdriver.Chrome(service=service, options=chrome_options)
wait = WebDriverWait(driver, 20)

# Setup geocoder
geolocator = Nominatim(user_agent="cono-scraper")

def is_long_island_address(address):
    keywords = [
        "Long Island", "Nassau County", "Suffolk County",
        "Stony Brook", "Port Jefferson", "Manhasset",
        "Bay Shore", "Huntington", "Hempstead", "Oceanside", "Syosset"
    ]
    return any(k.lower() in address.lower() for k in keywords)

def geocode_address(address):
    try:
        location = geolocator.geocode(address)
        if location:
            return location.latitude, location.longitude
    except:
        pass
    return None, None

def get_hospital_details(url):
    driver.get(url)
    time.sleep(2)

    try:
        name = driver.find_element(By.CSS_SELECTOR, "h1").text.strip()
    except:
        name = "N/A"

    try:
        address = driver.find_element(By.CSS_SELECTOR, "p[data-testid='address']").text.strip()
    except:
        address = "N/A"

    try:
        phone = driver.find_element(By.CSS_SELECTOR, "p[data-testid='phone']").text.strip()
    except:
        phone = "N/A"

    try:
        hours = driver.find_element(By.CSS_SELECTOR, "p[data-testid='visiting-hours']").text.strip()
    except:
        hours = "N/A"

    try:
        photo = driver.find_element(By.CSS_SELECTOR, "img[data-testid='hospital-photo']").get_attribute("src")
    except:
        photo = ""

    if not is_long_island_address(address):
        return None

    lat, lon = geocode_address(address)

    return {
        "name": name,
        "address": address,
        "phone": phone,
        "hours": hours,
        "image": photo,
        "insurance": ["Aetna", "UnitedHealth", "Medicaid"],
        "services": ["Chemotherapy", "Radiology"],
        "oncologist": "Dr. Lisa Raymond",
        "lat": lat,
        "lon": lon
    }

# Load the rankings page
driver.get("https://health.usnews.com/best-hospitals/rankings/cancer/new-york-ny")
print("⏳ Waiting for page to load...")
time.sleep(15)  # use a delay instead of wait.until()

driver.save_screenshot("page_snapshot.png")  # ← Optional debug tool

hospital_links = driver.find_elements(By.CSS_SELECTOR, "a[href^='/best-hospitals/area/ny/']")
print(f"🔍 Found {len(hospital_links)} hospital links")
results = []
id_counter = 1

for card in hospital_links:
    try:
        link = card.get_attribute("href")
        if link.startswith("/"):
            link = "https://health.usnews.com" + link
        print(f"🔍 Visiting: {link}")
        hospital = get_hospital_details(link)
        if hospital:
            hospital["id"] = id_counter
            results.append(hospital)
            id_counter += 1
    except Exception as e:
        print("⚠️ Error processing hospital:", e)

# Save to JSON
output_file = "hospitals.json"
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2, ensure_ascii=False)

print(f"\n✅ Done! {len(results)} Long Island hospitals saved to {output_file}")

driver.quit()
