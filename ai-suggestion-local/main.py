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

SKIN_TO_COLORS = {

    # FAIR (گورا رنگ)
    # Jewel tones, rich darks, deep jewel shades work best
    # New: lilac adds soft contrast, olive-green is trending in Pakistani fashion
    "fair": [
        "dark-blue",      # navy — classic contrast
        "dark-green",     # bottle green — very popular
        "dark-red",       # maroon — wedding staple
        "purple",         # medium purple — flattering
        "dark-purple",    # deep purple — rich look
        "black",          # classic
        "blue",           # medium blue
        "dark-brown",     # chocolate brown
        "lilac",          # soft purple — flattering on fair skin
        "olive-green",    # earthy trending tone — works on fair
    ],

    # MEDIUM (گندمی رنگ — most common Pakistani tone)
    # Warm earthy tones, terracotta, mustard
    # New: cream too pale for medium, olive-green perfect match
    "medium": [
        "orange",         # burnt orange — extremely flattering
        "dark-orange",    # terracotta — huge in Pakistani fashion
        "brown",          # camel/tan brown
        "dark-brown",     # chocolate
        "green",          # olive/forest
        "dark-green",     # bottle green
        "blue",           # medium blue
        "dark-blue",      # navy
        "olive-green",    # perfect earthy match for wheatish skin
        "cream",          # off-white cream — warm neutral, works on medium
    ],

    # TAN (سانولا رنگ)
    # Bright colors for contrast, avoid dark/brown family
    # New: off-white great contrast, cream slightly warm works well
    "tan": [
        "white",          # brightest contrast
        "light-blue",     # sky blue — fresh
        "blue",           # medium blue
        "light-green",    # mint — vibrant
        "orange",         # warm complementary
        "red",            # bright red — stunning
        "light-yellow",   # mustard — traditional pairing
        "light-orange",   # peach — soft contrast
        "off-white",      # warm white — elegant contrast
        "cream",          # slightly warmer than white — works on tan
    ],

    # DEEP (سیاہ فام)
    # Maximum contrast bold brights
    # New: off-white + cream = maximum contrast, lilac pops beautifully
    "deep": [
        "white",          # maximum contrast
        "light-yellow",   # golden yellow — stunning
        "yellow",         # bright yellow
        "light-orange",   # peach/apricot
        "orange",         # bold beautiful
        "light-green",    # mint — fresh
        "light-red",      # rose/coral
        "light-blue",     # sky blue
        "off-white",      # warm white — elegant on deep skin
        "cream",          # soft warm contrast
        "lilac",          # soft purple pops on deep skin beautifully
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


# @app.post("/suggest-outfits")
# async def suggest_outfits(
#     file: UploadFile = File(...),
#     gender: str = Form(...)
# ):
#     image_bytes = await file.read()
#     skin_tone = get_skin_tone(image_bytes)
#     suggested_colors = SKIN_TO_COLORS[skin_tone]

#     return {
#         "skin_tone": skin_tone,
#         "suggested_colors": suggested_colors,
#         "gender": gender
#     }


# @app.get("/health")
# async def health():
#     return {"status": "ok"}


@app.post("/suggest-outfits")
async def suggest_outfits(
    file: UploadFile = File(...),
    gender: str = Form(...)
):
    image_bytes = await file.read()

    # Detect skin tone
    skin_tone = get_skin_tone(image_bytes)

    # Get recommended garment colors
    suggested_colors = SKIN_TO_COLORS[skin_tone]

    # -------- LOGS --------
    print("\n========== AI OUTFIT SUGGESTION ==========")
    print(f"Detected Skin Tone: {skin_tone}")
    print(f"Recommended Garment Colors: {suggested_colors}")
    print(f"Gender: {gender}")
    print("==========================================\n")

    return {
        "skin_tone": skin_tone,
        "suggested_colors": suggested_colors,
        "gender": gender
    }

@app.get("/")
async def home():
    return {"message": "AI Suggestion API Running"}