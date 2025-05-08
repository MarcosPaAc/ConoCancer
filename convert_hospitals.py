import json

INPUT_FILE = "northwell_raw_merged.json"
OUTPUT_FILE = "northwell_enriched.json"

def enrich_hospital(h, idx):
    return {
        "id": idx + 1,
        "name": h.get("Hospital Name", "Unknown Hospital"),
        "address": h.get("Address", "Address not available"),
        "lat": 40.7128,
        "lon": -74.0060,
        "oncologist": "To Be Assigned",
        "insurance": ["Pending"],
        "phone": h.get("Phone Number", "N/A"),
        "hours": "Mon–Fri: 9AM–5PM",
        "services": ["General Care"],
        "image": "hospital-photo.jpg",
        "website": h.get("Hospital URL", "#"),
        "description": h.get("Description", "")
    }

def convert_hospital_json():
    with open(INPUT_FILE, "r") as f:
        raw_data = json.load(f)

    enriched_data = [enrich_hospital(h, idx) for idx, h in enumerate(raw_data)]

    with open(OUTPUT_FILE, "w") as f:
        json.dump(enriched_data, f, indent=2)

    print(f"✅ Converted and saved to {OUTPUT_FILE} with {len(enriched_data)} hospitals.")

if __name__ == "__main__":
    convert_hospital_json()
