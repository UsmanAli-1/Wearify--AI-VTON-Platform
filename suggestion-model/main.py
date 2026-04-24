from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
import mediapipe as mp

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# SKIN_TO_COLORS = {
#     "fair": [
#         "black", "dark-blue", "blue", "dark-red", "red",
#         "dark-purple", "purple", "dark-green"
#     ],
#     "medium": [
#         "brown", "dark-brown", "orange", "dark-orange",
#         "green", "blue", "neutral", "light-brown"
#     ],
#     "tan": [
#         "white", "light-blue", "blue", "red", "orange",
#         "light-green", "green", "light-yellow"
#     ],
#     "deep": [
#         "white", "yellow", "light-yellow", "orange",
#         "light-orange", "red", "light-red", "light-grey"
#     ],
# }


SKIN_TO_COLORS = {

    # FAIR (گورا رنگ)
    # Pakistani fair skin has warm undertones — jewel tones, rich darks work best
    # Avoid: pastels wash them out, neon looks harsh
    "fair": [
        "dark-blue",    # navy — universally flattering on fair Pakistani skin
        "dark-green",   # bottle green — very popular in Pakistani fashion
        "dark-red",     # maroon/deep red — wedding staple
        "purple",       # medium purple — works beautifully
        "dark-purple",  # deep purple — rich look
        "black",        # classic contrast
        "blue",         # medium blue — everyday
        "dark-brown",   # chocolate brown — earthy, popular
    ],

    # MEDIUM (گندمی رنگ — wheatish, most common Pakistani skin tone)
    # Warm earthy tones, terracotta, mustard — very on-trend in Pakistan
    # Avoid: very pale pastels, pure white can look washed
    "medium": [
        "orange",       # burnt orange — extremely flattering
        "dark-orange",  # terracotta — huge in Pakistani fashion
        "brown",        # camel/tan brown — earthy match
        "dark-brown",   # chocolate — rich contrast
        "green",        # medium green — olive/forest work well
        "dark-green",   # bottle green — classic
        "blue",         # medium blue — safe flattering choice
        "dark-blue",    # navy — always works
    ],

    # TAN (سانولا رنگ — deeper wheatish/brown)
    # Bright colors create beautiful contrast
    # Avoid: brown family blends in too much, dark colors lose contrast
    "tan": [
        "white",        # brightest contrast — very popular
        "light-blue",   # sky blue — fresh contrast
        "blue",         # medium blue — great contrast
        "light-green",  # mint/lime — vibrant contrast
        "orange",       # warm orange — complementary
        "red",          # bright red — stunning contrast
        "light-yellow", # mustard/yellow — traditional Pakistani pairing
        "light-orange", # peach — soft flattering contrast
    ],

    # DEEP (سیاہ فام — deep brown/dark skin)
    # Bold bright colors create the most striking looks
    # Avoid: dark colors reduce visibility, navy/black blend in
    "deep": [
        "white",        # maximum contrast — always stunning
        "light-yellow", # golden yellow — traditional & beautiful
        "yellow",       # bright yellow — vibrant
        "light-orange", # peach/apricot — warm glow
        "orange",       # bright orange — bold & beautiful  
        "light-green",  # mint — fresh contrast
        "light-red",    # rose/coral — soft flattering
        "light-blue",   # sky blue — clean contrast
    ],
}



# ── MediaPipe face detector (loaded once at startup) ──
mp_face = mp.solutions.face_detection
face_detector = mp_face.FaceDetection(
    model_selection=1,       # 1 = full range model (better for varied distances)
    min_detection_confidence=0.4
)

def get_dominant_skin_tone(pixels: np.ndarray) -> float:
    """
    From a bunch of skin pixels, find the most common brightness.
    Uses histogram instead of mean — so dominant tone wins, not average.
    """
    if len(pixels) == 0:
        return 128.0

    brightness = pixels.mean(axis=1)  # brightness per pixel

    # Build histogram with 20 bins
    hist, bin_edges = np.histogram(brightness, bins=20, range=(0, 255))

    # Find the most populated bin
    dominant_bin = np.argmax(hist)
    dominant_brightness = (bin_edges[dominant_bin] + bin_edges[dominant_bin + 1]) / 2

    print(f"  Dominant brightness bin: {dominant_brightness:.1f}")
    return float(dominant_brightness)


def extract_skin_pixels(face_crop: np.ndarray) -> np.ndarray:
    """
    From a face crop, keep only pixels that look like skin.
    Uses HSV color space — much better for skin detection than RGB.
    """
    # Convert to HSV
    hsv = cv2.cvtColor(face_crop, cv2.COLOR_RGB2HSV)

    # Skin tone range in HSV
    # H: 0-25 covers peach/brown/tan skin tones
    # S: 20-170 — not too grey, not too saturated
    # V: 80-255 — not too dark
    lower = np.array([0, 20, 80], dtype=np.uint8)
    upper = np.array([25, 170, 255], dtype=np.uint8)

    mask = cv2.inRange(hsv, lower, upper)

    # Also check wraparound for very red skin (H near 180)
    lower2 = np.array([165, 20, 80], dtype=np.uint8)
    upper2 = np.array([180, 170, 255], dtype=np.uint8)
    mask2 = cv2.inRange(hsv, lower2, upper2)

    combined_mask = cv2.bitwise_or(mask, mask2)

    # Get RGB pixels where mask is active
    skin_pixels = face_crop[combined_mask > 0]
    return skin_pixels



def get_skin_tone(image_bytes: bytes) -> str:
    arr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)

    if img is None:
        return "medium"

    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    h, w = img_rgb.shape[:2]

    # ── Face detection ──
    results = face_detector.process(img_rgb)

    if not results.detections:
        print("No face — using fallback crop")
        face_crop = img_rgb[
            int(h * 0.05): int(h * 0.38),
            int(w * 0.25): int(w * 0.75)
        ]
    else:
        detection = results.detections[0]
        bbox = detection.location_data.relative_bounding_box
        x1 = max(0, int(bbox.xmin * w))
        y1 = max(0, int(bbox.ymin * h))
        x2 = min(w, int((bbox.xmin + bbox.width) * w))
        y2 = min(h, int((bbox.ymin + bbox.height) * h))
        print(f"Face: ({x1},{y1})→({x2},{y2})")
        face_crop = img_rgb[y1:y2, x1:x2]

    if face_crop.size == 0:
        return "medium"

    # ── Extract skin pixels using HSV ──
    hsv = cv2.cvtColor(face_crop, cv2.COLOR_RGB2HSV)

    # Skin hue range: 0-22 covers all South Asian skin tones
    lower = np.array([0,  25, 60], dtype=np.uint8)
    upper = np.array([22, 180, 255], dtype=np.uint8)
    mask1 = cv2.inRange(hsv, lower, upper)

    # Wraparound red hues
    lower2 = np.array([165, 25, 60], dtype=np.uint8)
    upper2 = np.array([180, 180, 255], dtype=np.uint8)
    mask2 = cv2.inRange(hsv, lower2, upper2)

    mask = cv2.bitwise_or(mask1, mask2)
    skin_pixels_hsv = hsv[mask > 0]

    print(f"Skin pixels: {len(skin_pixels_hsv)}")

    if len(skin_pixels_hsv) < 40:
        # Fallback
        avg = face_crop.mean(axis=(0,1))
        brightness = float(avg.mean())
        print(f"Fallback brightness: {brightness:.1f}")
        if brightness > 148: return "fair"
        elif brightness > 120: return "medium"
        elif brightness > 95: return "tan"
        else: return "deep"

    # ── Use HSV Value (V) channel = true brightness of skin ──
    # V channel is lighting-normalized compared to raw RGB
    v_values = skin_pixels_hsv[:, 2].astype(float)
    s_values = skin_pixels_hsv[:, 1].astype(float)

    # Weight by low saturation (lighter skin = less saturated)
    # High S = darker/more colored skin, Low S = lighter skin
    avg_v = float(np.median(v_values))      # median V of skin pixels
    avg_s = float(np.median(s_values))      # median S of skin pixels
    print(f"Median V (value/brightness): {avg_v:.1f}")
    print(f"Median S (saturation): {avg_s:.1f}")

    # ── Pakistani-calibrated classification ──

    # FAIR: bright + not too saturated
    if avg_v > 195:
        return "fair"                          # very clearly fair
    elif avg_v > 165 and avg_s < 95:
        return "fair"                          # fair in normal light
    elif avg_v > 155 and avg_s < 85:
        return "fair"                          # fair in warm/dim light

   # MEDIUM: decent brightness, moderate saturation
    elif avg_v > 145 and avg_s < 130:
        return "medium"
    elif avg_v > 138 and avg_s < 100:    # ← S tightened 105→100
        return "medium"

    # TAN: lower brightness or higher saturation  
    elif avg_v > 125 and avg_s < 150:    # ← V raised 122→125
        return "tan"

    # DEEP
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