from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options

CHROMEDRIVER_PATH = "C:/Users/Dillon/Documents/conocancer-map/scraper/drivers/chromedriver.exe" # relative to scraper/

options = Options()
options.add_argument("--headless")  # comment this out if you want to see the browser

service = Service(CHROMEDRIVER_PATH)
driver = webdriver.Chrome(service=service, options=options)

try:
    driver.get("https://www.google.com")
    print("✅ ChromeDriver is working!")
    print("Page title:", driver.title)
finally:
    driver.quit()
