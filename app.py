from flask import Flask, request, jsonify
from flask_cors import CORS
from google import genai
from google.genai import types
import base64
import json
import re

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

client = genai.Client(api_key="AIzaSyBcaEUUJCmP269tq6XVEplyJ69ExEWVq_Y")

@app.route("/classify", methods=["POST"])
def classify():
    data = request.get_json()
    image_data = data.get("image")
    mime_type = data.get("mime_type", "image/jpeg")

    if not image_data:
        return jsonify({"error": "No image provided"}), 400

    image_bytes = base64.b64decode(image_data)

    # ... inside your classify() function ...
    prompt = """You are a waste classification authority. Analyze this image and respond ONLY with a raw JSON object.

STRICT RULES:
- NO "it depends" or "check local guidelines". Give direct, concrete commands.
- If an item is NOT recyclable, return an empty list [] for recycle_steps.
- Each recycle_step and dispose_step must be 8-15 words long.
- Give exactly 4 steps for each category (unless the list is empty).
- Each fun_fact must be 12 words max. Give exactly 3.
- confidence: must be exactly 'high', 'medium', or 'low'.

{
  "material": "specific material",
  "item_name": "common name",
  "category": "category",
  "confidence": "high/medium/low",
  "disposal": "Recyclable / Non-Recyclable",
  "impact": "10 words or less",
  "carbon_footprint": "number with unit",
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

    return jsonify(result)

if __name__ == "__main__":
    print("Flask starting on port 5000...")
    app.run(debug=True, host="0.0.0.0", port=5000)