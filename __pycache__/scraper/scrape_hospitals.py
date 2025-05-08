from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
import time
import os

# Set up ChromeDriver path
driver_path = os.path.join(os.path.dirname(__file__), 'drivers', 'chromedriver.exe')
service = Service(executable_path=driver_path)
driver = webdriver.Chrome(service=service)

# Open map page
driver.get("https://profiles.health.ny.gov/hospital/#8.05/40.797/-73.211")
time.sleep(8)  # Wait for map to fully load

print("\n=== Hospital Popup Contents ===")

try:
    # More precise targeting of only clickable map markers
    markers = driver.find_elements(By.CSS_SELECTOR, "svg.leaflet-zoom-animated g path.leaflet-interactive")

    for i, marker in enumerate(markers):
        try:
            driver.execute_script("arguments[0].scrollIntoView(true);", marker)
            driver.execute_script("arguments[0].dispatchEvent(new MouseEvent('click', { bubbles: true }))", marker)
            time.sleep(1)  # Wait for popup to appear

            # Grab popup content
            popups = driver.find_elements(By.CLASS_NAME, "leaflet-popup-content")
            for popup in popups:
                text = popup.text.strip()
                if text:
                    print(f"Hospital {i + 1}:\n{text}\n" + "-" * 30)

        except Exception as e:
            print(f"❌ Could not click marker {i + 1}: {e}")

except Exception as e:
    print("❌ General scraping error:", e)

driver.quit()
