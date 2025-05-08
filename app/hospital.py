def get_all_hospitals():
    return [
        {
            "id": 1,
            "name": "NY Cancer Center",
            "address": "123 Main St, New York, NY",
            "lat": 40.7128,
            "lon": -74.0060,
            "oncologist": "Dr. Rivera",
            "insurance": ["Aetna", "BCBS"],
            "phone": "(212) 555-0100",
            "hours": "Mon–Fri: 8AM–6PM",
            "services": ["Radiation", "Chemotherapy"],
            "image": "hospital-photo.jpg"
        },
        {
            "id": 2,
            "name": "Brooklyn Oncology",
            "address": "456 Flatbush Ave, Brooklyn, NY",
            "lat": 40.661,
            "lon": -73.950,
            "oncologist": "Dr. Liu",
            "insurance": ["United", "Cigna"],
            "phone": "(718) 555-0111",
            "hours": "Mon–Fri: 9AM–5PM",
            "services": ["Imaging", "Hormone Therapy"],
            "image": "hospital-photo.jpg"
        }
    ]
