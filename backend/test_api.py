import urllib.request
import json
import sys

API_BASE = "http://127.0.0.1:8001"

def test_endpoint(path, expected_keys=None):
    url = f"{API_BASE}{path}"
    print(f"Testing {url}...", end="")
    try:
        response = urllib.request.urlopen(url)
        if response.status != 200:
            print(" FAILED (Status not 200)")
            return False
        
        data = json.loads(response.read())
        
        if expected_keys:
            if isinstance(data, dict):
                missing_keys = [k for k in expected_keys if k not in data]
                if missing_keys:
                    print(f" FAILED (Missing keys: {missing_keys})")
                    return False
            elif isinstance(data, list):
                if len(data) > 0 and isinstance(data[0], dict):
                    missing_keys = [k for k in expected_keys if k not in data[0]]
                    if missing_keys:
                        print(f" FAILED (Item missing keys: {missing_keys})")
                        return False
            else:
                print(" FAILED (Unexpected JSON type)")
                return False
                
        print(" PASSED")
        return True
    except Exception as e:
        print(f" FAILED (Exception: {e})")
        return False

def test_chat():
    url = f"{API_BASE}/api/chat"
    print(f"Testing {url}...", end="")
    try:
        req = urllib.request.Request(
            url, 
            data=json.dumps({"message": "Predict medals for India in 2028"}).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        response = urllib.request.urlopen(req)
        if response.status != 200:
            print(" FAILED (Status not 200)")
            return False
            
        data = json.loads(response.read())
        if "response" not in data:
            print(" FAILED (Missing 'response' key)")
            return False
            
        print(" PASSED")
        return True
    except Exception as e:
        print(f" FAILED (Exception: {e})")
        return False

def main():
    tests = [
        ("/api/filters", ["years", "countries", "sports"]),
        ("/api/medal-tally", ["region", "Gold", "Silver", "Bronze", "total"]),
        ("/api/overall-stats", ["editions", "hosts", "sports", "events", "athletes", "nations"]),
        ("/api/overall-charts", ["Edition", "Nations", "Events", "Athletes"]),
        ("/api/sport-heatmap", ["years", "sports", "data"]),
        ("/api/most-successful", ["Name", "Sex", "Team", "Medals", "Sport"]),
        ("/api/country-analysis?country=India", ["medal_tally", "heatmap", "top_athletes"]),
        ("/api/athlete-analysis", ["age_distribution", "height_vs_weight", "men_vs_women"]),
        ("/api/predict?country=India&year=2028", ["country", "year", "Gold", "Silver", "Bronze", "total", "confidence"]),
        ("/api/comparison?country1=USA&country2=China", ["timeline", "sports1", "sports2", "metrics1", "metrics2"]),
        ("/api/host-details?city=Paris", ["city", "editions"])
    ]
    
    success = True
    for path, keys in tests:
        if not test_endpoint(path, keys):
            success = False
            
    if not test_chat():
        success = False
        
    if success:
        print("\nAll backend integration tests passed successfully!")
        sys.exit(0)
    else:
        print("\nSome backend integration tests failed.")
        sys.exit(1)

if __name__ == "__main__":
    main()
