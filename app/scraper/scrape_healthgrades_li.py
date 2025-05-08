import json
import time
import requests
from bs4 import BeautifulSoup
from geopy.geocoders import Nominatim

# Cities to match for Long Island hospitals
LONG_ISLAND_CITIES = [
    "Stony Brook", "Bay Shore", "Manhasset", "Huntington",
    "Oceanside", "Hempstead", "Syosset", "West Islip", "Riverhead",
    "Port Jefferson", "Rockville Centre", "Mineola", "Amityville"
]

# Base URL
BASE_URL = "https://www.healthgrades.com/hospital-directory/ny-new-york"

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
}

geolocator = Nominatim(user_agent="cono-scraper")

def geocode_address(address):
    try:
        location = geolocator.geocode(address)
        if location:
            return location.latitude, location.longitude
    except:
        return None, None
    return None, None

def is_long_island(address):
    return any(city.lower() in address.lower() for city in LONG_ISLAND_CITIES)

def scrape_healthgrades():
    print("🌐 Requesting Healthgrades page...")
    response = requests.get(BASE_URL, headers=headers)
    soup = BeautifulSoup(response.text, "html.parser")

    hospitals = soup.select("div[class*='card-info']")  # all hospital cards
    print(f"🧪 Found {len(hospitals)} hospital cards on page")

    results = []
    id_counter = 1

    for card in hospitals:
        try:
            name = card.select_one("h3").text.strip()
            address = card.select_one("address").text.strip()
            print(f"📍 Hospital: {name} | Address: {address}")
            phone_tag = card.find("a", href=lambda href: href and href.startswith("tel:"))
            phone = phone_tag.text.strip() if phone_tag else "N/A"

            #if not is_long_island(address):
            #    continue

            lat, lon = geocode_address(address)

            hospital_data = {
                "id": id_counter,
                "name": name,
                "address": address,
                "phone": phone,
                "hours": "N/A",  # Not listed on this page
                "image": "",     # Could be added if found in detail page
                "insurance": ["Aetna", "Medicaid", "UnitedHealth"],  # placeholder
                "services": ["Cancer Care", "Emergency", "Surgery"],
                "oncologist": "N/A",  # You can fill this later manually
                "lat": lat,
                "lon": lon
            }
            results.append(hospital_data)
            print(f"✅ {name} - {address}")
            id_counter += 1

        except Exception as e:
            print("⚠️ Error parsing hospital:", e)

    with open("hospitals.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Done! {len(results)} Long Island hospitals saved to hospitals.json")

if __name__ == "__main__":
    scrape_healthgrades()
