from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Skin tone → color families (Pakistani-calibrated) ──
SKIN_TO_COLORS = {
    "fair": [
        "dark-blue",
        "dark-green",
        "dark-red",
        "purple",
        "dark-purple",
        "black",
        "blue",
        "dark-brown",
    ],
    "medium": [
        "orange",
        "dark-orange",
        "brown",
        "dark-brown",
        "green",
        "dark-green",
        "blue",
        "dark-blue",
    ],
    "tan": [
        "white",
        "light-blue",
        "blue",
        "light-green",
        "orange",
        "red",
        "light-yellow",
        "light-orange",
    ],
    "deep": [
        "white",
        "light-yellow",
        "yellow",
        "light-orange",
        "orange",
        "light-green",
        "light-red",
        "light-blue",
    ],
}

# ── OpenCV Haar Cascade face detector (built-in, no download needed) ──
face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)


def get_skin_tone(image_bytes: bytes) -> str:
    arr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)

    if img is None:
        return "medium"

    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    h, w = img_rgb.shape[:2]

    # ── Step 1: Detect face with OpenCV Haar Cascade ──
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(
        gray,
        scaleFactor=1.1,
        minNeighbors=5,
        minSize=(30, 30)
    )

    if len(faces) > 0:
        x, y, fw, fh = faces[0]
        face_crop = img_rgb[y:y + fh, x:x + fw]
        print(f"Face detected: ({x},{y}) size={fw}x{fh}")
    else:
        # Fallback — top-center crop (face area)
        print("No face detected — using fallback crop")
        face_crop = img_rgb[
            int(h * 0.05): int(h * 0.38),
            int(w * 0.25): int(w * 0.75)
        ]

    if face_crop.size == 0:
        return "medium"

    # ── Step 2: Extract skin pixels using HSV ──
    hsv = cv2.cvtColor(face_crop, cv2.COLOR_RGB2HSV)

    # Hue 0-22: covers all South Asian skin tones
    lower = np.array([0, 25, 60], dtype=np.uint8)
    upper = np.array([22, 180, 255], dtype=np.uint8)
    mask1 = cv2.inRange(hsv, lower, upper)

    # Wraparound red hues (165-180)
    lower2 = np.array([165, 25, 60], dtype=np.uint8)
    upper2 = np.array([180, 180, 255], dtype=np.uint8)
    mask2 = cv2.inRange(hsv, lower2, upper2)

    mask = cv2.bitwise_or(mask1, mask2)
    skin_pixels_hsv = hsv[mask > 0]

    print(f"Skin pixels found: {len(skin_pixels_hsv)}")

    # ── Step 3: Classify using V and S channels ──
    if len(skin_pixels_hsv) < 40:
        # Not enough skin pixels — fallback to raw brightness
        avg = face_crop.mean(axis=(0, 1))
        brightness = float(avg.mean())
        print(f"Fallback brightness: {brightness:.1f}")
        if brightness > 148:   return "fair"
        elif brightness > 120: return "medium"
        elif brightness > 95:  return "tan"
        else:                  return "deep"

    v_values = skin_pixels_hsv[:, 2].astype(float)
    s_values = skin_pixels_hsv[:, 1].astype(float)

    avg_v = float(np.median(v_values))
    avg_s = float(np.median(s_values))

    print(f"Median V: {avg_v:.1f}  Median S: {avg_s:.1f}")

    # ── Pakistani-calibrated thresholds ──
    if avg_v > 195:
        return "fair"
    elif avg_v > 165 and avg_s < 95:
        return "fair"
    elif avg_v > 155 and avg_s < 85:
        return "fair"
    elif avg_v > 145 and avg_s < 130:
        return "medium"
    elif avg_v > 138 and avg_s < 100:
        return "medium"
    elif avg_v > 125 and avg_s < 150:
        return "tan"
    else:
        return "deep"


@app.post("/suggest-outfits")
async def suggest_outfits(
    file: UploadFile = File(...),
    gender: str = Form(...)
):
    image_bytes = await file.read()
    skin_tone = get_skin_tone(image_bytes)
    suggested_colors = SKIN_TO_COLORS[skin_tone]

    return {
        "skin_tone": skin_tone,
        "suggested_colors": suggested_colors,
        "gender": gender
    }


@app.get("/health")
async def health():
    return {"status": "ok"}