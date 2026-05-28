import os
import re
import json
import base64
import requests as req
from flask import Flask, request, jsonify
from flask_cors import CORS
from google import genai
from google.genai import types
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
client = genai.Client(api_key=GEMINI_API_KEY)

SUPABASE_HEADERS = {
    "apikey": SUPABASE_SERVICE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024
CORS(app, resources={r"/*": {
    "origins": "*",
    "allow_headers": ["Authorization", "Content-Type"],
    "methods": ["GET", "POST", "OPTIONS"]
}})


def extract_carbon_number(value_str):
    if not value_str:
        return 0.0
    match = re.search(r"[\d.]+", str(value_str))
    return float(match.group()) if match else 0.0

def get_user_from_token(auth_header):
    if not auth_header or not auth_header.startswith('Bearer '):
        print("❌ No auth header or wrong format")
        return None
    token = auth_header.replace('Bearer ', '')
    print(f"🔑 Token received (first 20 chars): {token[:20]}")
    try:
        response = req.get(
            f"{SUPABASE_URL}/auth/v1/user",
            headers={
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": f"Bearer {token}"
            }
        )
        if response.status_code == 200:
            user = response.json()
            print(f"✅ User verified: {user.get('email')}")
            return user
        print(f"❌ Auth failed: {response.status_code} {response.text}")
        return None
    except Exception as e:
        print(f"❌ Token error: {e}")
        return None

def supabase_insert(table, data):
    response = req.post(
        f"{SUPABASE_URL}/rest/v1/{table}",
        headers=SUPABASE_HEADERS,
        json=data
    )
    if response.status_code not in [200, 201]:
        print(f"❌ Insert error: {response.status_code} {response.text}")
    else:
        print(f"✅ Insert successful: Row committed directly via Admin Access.")
    return response

def update_streak(user_id):
    from datetime import date, timedelta

    # Get current streak data
    response = req.get(
        f"{SUPABASE_URL}/rest/v1/users?id=eq.{user_id}&select=streak_count,last_scan_date",
        headers=SUPABASE_HEADERS
    )
    rows = response.json()
    if not rows:
        return 0

    today = date.today()
    last_scan = rows[0].get("last_scan_date")
    streak = rows[0].get("streak_count") or 0

    if last_scan:
        last_scan_date = date.fromisoformat(last_scan)
        diff = (today - last_scan_date).days

        if diff == 0:
            # Already scanned today, don't increment
            return streak
        elif diff == 1:
            # Scanned yesterday, increment streak
            streak += 1
        else:
            # Missed a day, reset streak
            streak = 1
    else:
        # First scan ever
        streak = 1

    # Save updated streak
    req.patch(
        f"{SUPABASE_URL}/rest/v1/users?id=eq.{user_id}",
        headers=SUPABASE_HEADERS,
        json={
            "streak_count": streak,
            "last_scan_date": today.isoformat()
        }
    )

    print(f"🔥 Streak updated: {streak} days for user {user_id}")
    return streak


# ✅ FIX: home() is now its own proper route, outside of classify()
@app.route("/")
def home():
    return "The backend is officially online and secure!", 200

@app.route("/signin", methods=["POST", "OPTIONS"])
def signin():
    if request.method == "OPTIONS":
        return "", 200

    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    response = req.post(
        f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
        headers={
            "apikey": SUPABASE_ANON_KEY,
            "Content-Type": "application/json"
        },
        json={"email": email, "password": password}
    )

    if response.status_code != 200:
        return jsonify({"success": False, "error": "Invalid email or password"}), 401

    result = response.json()
    return jsonify({
        "success": True,
        "session": {
            "access_token": result.get("access_token"),
            "refresh_token": result.get("refresh_token")
        },
        "user": {
            "id": result.get("user", {}).get("id"),
            "email": result.get("user", {}).get("email")
        }
    })

@app.route("/signup", methods=["POST", "OPTIONS"])
def signup():
    if request.method == "OPTIONS":
        return "", 200

    data = request.get_json()
    email = data.get("email")
    password = data.get("password")
    username = data.get("username")

    # 1. Create auth user in Supabase
    response = req.post(
        f"{SUPABASE_URL}/auth/v1/signup",
        headers={
            "apikey": SUPABASE_ANON_KEY,
            "Content-Type": "application/json"
        },
        json={"email": email, "password": password}
    )

    if response.status_code not in [200, 201]:
        print(f"❌ Supabase signup error: {response.status_code} {response.text}")
        return jsonify({"success": False, "error": "Signup failed"}), 400

    result = response.json()
    user_id = result.get("user", {}).get("id")
    access_token = result.get("access_token")
    refresh_token = result.get("refresh_token")

    if not user_id:
        return jsonify({"success": False, "error": "Could not create user"}), 400

    # 2. Insert into public users table
    supabase_insert("users", {
        "id": user_id,
        "username": username,
        "email": email,
        "total_points": 0
    })

    # 3. Auto-create challenge rows for new user
    default_challenges = [
        {"user_id": user_id, "challenge_type": "sort",        "progress": 0, "target": 10, "completed": False, "total_points": 0},
        {"user_id": user_id, "challenge_type": "identify",    "progress": 0, "target": 5,  "completed": False, "total_points": 0},
        {"user_id": user_id, "challenge_type": "reuse",       "progress": 0, "target": 3,  "completed": False, "total_points": 0},
        {"user_id": user_id, "challenge_type": "eco_starter", "progress": 0, "target": 3,  "completed": False, "total_points": 500},
    ]

    for challenge in default_challenges:
        supabase_insert("user_challenges", challenge)

    print(f"✅ New user created: {email} | challenges seeded")

    return jsonify({
        "success": True,
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": {
            "id": user_id,
            "email": email,
            "username": username
        }
    })

@app.route("/refresh", methods=["POST"])
def refresh():
    data = request.get_json()
    refresh_token = data.get("refresh_token")

    if not refresh_token:
        return jsonify({"error": "No refresh token provided"}), 400

    response = req.post(
        f"{SUPABASE_URL}/auth/v1/token?grant_type=refresh_token",
        headers={
            "apikey": SUPABASE_ANON_KEY,
            "Content-Type": "application/json"
        },
        json={"refresh_token": refresh_token}
    )

    if response.status_code != 200:
        return jsonify({"error": "Refresh failed"}), 401

    return jsonify(response.json())

@app.route("/add-points", methods=["POST", "OPTIONS"])
def add_points():
    if request.method == "OPTIONS":
        return "", 200

    auth_header = request.headers.get('Authorization')
    user = get_user_from_token(auth_header)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json()
    points = data.get("points", 0)
    user_id = user.get("id")

    # Fetch current points first
    response = req.get(
        f"{SUPABASE_URL}/rest/v1/users?id=eq.{user_id}&select=total_points",
        headers=SUPABASE_HEADERS
    )
    rows = response.json()
    current_points = rows[0].get("total_points") or 0 if rows else 0
    new_points = current_points + points

    # Update users table
    update = req.patch(
        f"{SUPABASE_URL}/rest/v1/users?id=eq.{user_id}",
        headers=SUPABASE_HEADERS,
        json={"total_points": new_points}
    )

    if update.status_code not in [200, 204]:
        print(f"❌ Points update failed: {update.status_code} {update.text}")
        return jsonify({"error": "Failed to update points"}), 500

    print(f"✅ Points updated: {current_points} → {new_points} for user {user_id}")
    return jsonify({"success": True, "total_points": new_points})

@app.route("/challenges", methods=["GET"])
def challenges():
    auth_header = request.headers.get('Authorization')
    user = get_user_from_token(auth_header)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    user_id = user.get("id")

    # Fetch challenges for this user
    challenges_response = req.get(
        f"{SUPABASE_URL}/rest/v1/user_challenges?user_id=eq.{user_id}&select=*",
        headers=SUPABASE_HEADERS
    )
    challenges = challenges_response.json()

    if isinstance(challenges, dict) and "message" in challenges:
        return jsonify({"error": challenges["message"]}), 400

    # Fetch user total points
    points_response = req.get(
        f"{SUPABASE_URL}/rest/v1/users?id=eq.{user_id}&select=total_points",
        headers=SUPABASE_HEADERS
    )
    points_rows = points_response.json()
    total_points = points_rows[0].get("total_points") or 0 if points_rows else 0

    # Fetch streak
    streak_response = req.get(
        f"{SUPABASE_URL}/rest/v1/users?id=eq.{user_id}&select=streak_count,last_scan_date",
        headers=SUPABASE_HEADERS
    )
    streak_rows = streak_response.json()
    streak_count = streak_rows[0].get("streak_count") or 0 if streak_rows else 0

    return jsonify({
        "challenges": challenges,
        "total_points": total_points,
        "streak": streak_count
    })

@app.route("/update-challenges", methods=["POST", "OPTIONS"])
def update_challenges():
    if request.method == "OPTIONS":
        return "", 200

    auth_header = request.headers.get('Authorization')
    user = get_user_from_token(auth_header)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json()
    category = data.get("category", "").lower()
    disposal = data.get("disposal", "").lower()
    user_id = user.get("id")

    # Fetch all incomplete challenges for this user
    response = req.get(
        f"{SUPABASE_URL}/rest/v1/user_challenges"
        f"?user_id=eq.{user_id}&completed=eq.false&select=*",
        headers=SUPABASE_HEADERS
    )
    challenges = response.json()

    if not challenges or isinstance(challenges, dict):
        return jsonify({"updated": 0})

    updated = 0
    for challenge in challenges:
        challenge_type = challenge.get("challenge_type", "").lower()
        progress = challenge.get("progress") or 0
        target = challenge.get("target") or 1
        challenge_id = challenge.get("id")

        # Determine if this scan counts toward the challenge
        should_increment = False

        CHALLENGE_POINTS = {
            "sort": 5,
            "identify": 3,
            "reuse": 10
        }

        if challenge_type == "sort":
            should_increment = True
        elif challenge_type == "identify":
            should_increment = True
        elif challenge_type == "reuse":
            should_increment = False

        if not should_increment:
            continue

        new_progress = progress + 1
        is_completed = new_progress >= target

        patch = req.patch(
            f"{SUPABASE_URL}/rest/v1/user_challenges?id=eq.{challenge_id}",
            headers=SUPABASE_HEADERS,
            json={
                "progress": new_progress,
                "completed": is_completed,
                "updated_at": "now()"
            }
        )

        if patch.status_code in [200, 204]:
            updated += 1
            print(f"✅ Challenge {challenge_id} updated: {progress} → {new_progress} {'(COMPLETED)' if is_completed else ''}")

            # Award points if challenge just completed
            if is_completed:
                points_to_award = CHALLENGE_POINTS.get(challenge_type, 0)
                if points_to_award > 0:
                    # Get current points
                    pts_response = req.get(
                        f"{SUPABASE_URL}/rest/v1/users?id=eq.{user_id}&select=total_points",
                        headers=SUPABASE_HEADERS
                    )
                    pts_rows = pts_response.json()
                    current_points = pts_rows[0].get("total_points") or 0 if isinstance(pts_rows, list) and pts_rows else 0
                    new_points = current_points + points_to_award

                    req.patch(
                        f"{SUPABASE_URL}/rest/v1/users?id=eq.{user_id}",
                        headers=SUPABASE_HEADERS,
                        json={"total_points": new_points}
                    )
                    print(f"🏆 Challenge complete: +{points_to_award} points awarded to user {user_id} | total: {new_points}")
                    # Increment eco_starter progress when a base challenge completes
                    if challenge_type in ["sort", "identify", "reuse"]:
                        eco_prog_response = req.get(
                            f"{SUPABASE_URL}/rest/v1/user_challenges"
                            f"?user_id=eq.{user_id}&challenge_type=eq.eco_starter&select=id,progress,completed",
                            headers=SUPABASE_HEADERS
                        )
                        eco_prog_rows = eco_prog_response.json()
                        if isinstance(eco_prog_rows, list) and eco_prog_rows and not eco_prog_rows[0].get("completed"):
                            current_eco_progress = eco_prog_rows[0].get("progress") or 0
                            req.patch(
                                f"{SUPABASE_URL}/rest/v1/user_challenges?user_id=eq.{user_id}&challenge_type=eq.eco_starter",
                                headers=SUPABASE_HEADERS,
                                json={"progress": current_eco_progress + 1, "updated_at": "now()"}
                            )
                            print(f"⭐ Eco Starter progress: {current_eco_progress + 1}/3")

                    # Check if all 3 base challenges are now complete
                    base_challenges = ["sort", "identify", "reuse"]
                    completed_response = req.get(
                        f"{SUPABASE_URL}/rest/v1/user_challenges"
                        f"?user_id=eq.{user_id}&challenge_type=in.(sort,identify,reuse)&select=challenge_type,completed",
                        headers=SUPABASE_HEADERS
                    )
                    completed_rows = completed_response.json()

                    if isinstance(completed_rows, list) and len(completed_rows) == 3:
                        all_complete = all(r.get("completed") for r in completed_rows)

                        if all_complete:
                            # Check if eco_starter is already completed
                            eco_response = req.get(
                                f"{SUPABASE_URL}/rest/v1/user_challenges"
                                f"?user_id=eq.{user_id}&challenge_type=eq.eco_starter&select=id,completed",
                                headers=SUPABASE_HEADERS
                            )
                            eco_rows = eco_response.json()

                            if isinstance(eco_rows, list) and eco_rows and not eco_rows[0].get("completed"):
                                # Complete eco_starter and award 500 points
                                req.patch(
                                    f"{SUPABASE_URL}/rest/v1/user_challenges?user_id=eq.{user_id}&challenge_type=eq.eco_starter",
                                    headers=SUPABASE_HEADERS,
                                    json={"progress": 3, "completed": True, "updated_at": "now()"}
                                )

                                # Award 500 points
                                pts_response = req.get(
                                    f"{SUPABASE_URL}/rest/v1/users?id=eq.{user_id}&select=total_points",
                                    headers=SUPABASE_HEADERS
                                )
                                pts_rows = pts_response.json()
                                current_points = pts_rows[0].get("total_points") or 0 if isinstance(pts_rows, list) and pts_rows else 0

                                req.patch(
                                    f"{SUPABASE_URL}/rest/v1/users?id=eq.{user_id}",
                                    headers=SUPABASE_HEADERS,
                                    json={"total_points": current_points + 500}
                                )
                                print(f"🏆 Eco Starter completed! +500 points awarded to user {user_id}")

    return jsonify({"updated": updated})

@app.route("/classify", methods=["GET", "POST", "OPTIONS"])
def classify():
    if request.method == "OPTIONS":
        return "", 200

    if request.method == "GET":
        return "✅ Server is LIVE and reaching the /classify route!", 200

    # ✅ FIX: All POST logic now lives cleanly inside this block
    auth_header = request.headers.get('Authorization')
    user = get_user_from_token(auth_header)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json()
    image_data = data.get("image")
    mime_type = data.get("mime_type", "image/jpeg")

    if not image_data:
        return jsonify({"error": "No image provided"}), 400

    image_bytes = base64.b64decode(image_data)

    # ✅ FIX: prompt and Gemini call are now reachable
    prompt = """You are a waste classification authority. Analyze this image and respond ONLY with a raw JSON object.

STRICT RULES:
- NO "it depends" or "check local guidelines". Give direct, concrete commands.
- If an item is NOT recyclable, return an empty list [] for recycle_steps.
- Each recycle_step and dispose_step must be 8-15 words long.
- Give exactly 4 steps for each category (unless the list is empty).
- Each fun_fact must be 12 words max. Give exactly 3.
- confidence: must be exactly 'high', 'medium', or 'low'.
- carbon_footprint: CO2 generated by producing this item, number with unit only e.g. 9.5 kg CO2.
- carbon_saved: CO2 saved by recycling instead of landfilling, number with unit only e.g. 8.1 kg CO2.

{
  "material": "specific material",
  "item_name": "common name",
  "category": "category",
  "confidence": "high/medium/low",
  "disposal": "Recyclable / Non-Recyclable",
  "impact": "10 words or less",
  "carbon_footprint": "number with unit",
  "carbon_saved": "number with unit",
  "did_you_know": "20 words or less",
  "fun_facts": ["fact 1", "fact 2", "fact 3"],
  "recycle_steps": ["step 1", "step 2", "step 3", "step 4"],
  "dispose_steps": ["step 1", "step 2", "step 3", "step 4"]
}"""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[
            types.Content(
                role="user",
                parts=[
                    types.Part.from_bytes(
                        data=image_bytes,
                        mime_type=mime_type
                    ),
                    types.Part.from_text(text=prompt)
                ]
            )
        ]
    )

    raw = response.text
    clean = re.sub(r"```json|```", "", raw).strip()
    result = json.loads(clean)

    carbon_generated = extract_carbon_number(result.get("carbon_footprint"))
    carbon_saved = extract_carbon_number(result.get("carbon_saved"))

    supabase_insert("scan_results", {
        "user_id": user.get("id"),
        "item_name": result.get("item_name"),
        "material": result.get("material"),
        "category": result.get("category"),
        "disposal": result.get("disposal"),
        "carbon_generated": carbon_generated,
        "carbon_saved": carbon_saved,
        "confidence": result.get("confidence")
    })

    # Award 1 point per scan
    pts_response = req.get(
        f"{SUPABASE_URL}/rest/v1/users?id=eq.{user.get('id')}&select=total_points",
        headers=SUPABASE_HEADERS
    )
    pts_rows = pts_response.json()
    current_points = pts_rows[0].get("total_points") or 0 if isinstance(pts_rows, list) and pts_rows else 0
    req.patch(
        f"{SUPABASE_URL}/rest/v1/users?id=eq.{user.get('id')}",
        headers=SUPABASE_HEADERS,
        json={"total_points": current_points + 1}
    )
    print(f"⭐ +1 scan point awarded | total: {current_points + 1}")

    streak = update_streak(user.get("id"))
    print(f"✅ Saved: {result.get('item_name')} | {carbon_generated} kg generated | {carbon_saved} kg saved | user: {user.get('id')}")

    return jsonify({**result, "streak": streak})


@app.route("/stats", methods=["GET"])
def stats():
    # ... (unchanged)
    auth_header = request.headers.get('Authorization')
    user = get_user_from_token(auth_header)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    try:
        range_param = request.args.get("range", "monthly")
        from datetime import datetime, timedelta, timezone
        now = datetime.now(timezone.utc)
        since = now - timedelta(weeks=1) if range_param == "weekly" else now - timedelta(days=30)
        since_str = since.isoformat().replace("+00:00", "Z")
        user_id = user.get("id")

        url = (
            f"{SUPABASE_URL}/rest/v1/scan_results"
            f"?select=carbon_generated,carbon_saved,disposal,category,created_at"
            f"&user_id=eq.{user_id}"
            f"&created_at=gte.{since_str}"
        )

        response = req.get(url, headers=SUPABASE_HEADERS)
        rows = response.json()

        if isinstance(rows, dict) and "message" in rows:
            return jsonify({"error": rows["message"]}), 400

        total_carbon_generated = sum(float(r["carbon_generated"]) for r in rows if r.get("carbon_generated") is not None)
        total_carbon_saved = sum(float(r["carbon_saved"]) for r in rows if r.get("carbon_saved") is not None)
        total_scans = len(rows)
        recyclable_count = sum(1 for r in rows if r.get("disposal") and "recyclable" in r["disposal"].lower())

        # Fetch username
        user_response = req.get(
            f"{SUPABASE_URL}/rest/v1/users?id=eq.{user_id}&select=username",
            headers=SUPABASE_HEADERS
        )
        user_rows = user_response.json()
        username = user_rows[0].get("username") or "User" if user_rows else "User"

        # Fetch streak
        streak_response = req.get(
            f"{SUPABASE_URL}/rest/v1/users?id=eq.{user_id}&select=streak_count,last_scan_date",
            headers=SUPABASE_HEADERS
        )
        streak_rows = streak_response.json()
        streak_count = streak_rows[0].get("streak_count") or 0 if streak_rows else 0

        return jsonify({
            "total_scans": total_scans,
            "total_carbon_generated": round(total_carbon_generated, 4),
            "total_carbon_saved": round(total_carbon_saved, 4),
            "recyclable_count": recyclable_count,
            "username": username,
            "streak": streak_count
        })

    except Exception as e:
        print(f"❌ Stats error: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True,
        ssl_context=('localhost+2.pem', 'localhost+2-key.pem')
    )