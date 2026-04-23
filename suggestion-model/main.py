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

#  Skin tone → color families mapping 
SKIN_TO_COLORS = {
    "fair": [
        "black", "dark-blue", "blue", "dark-red", "red",
        "dark-purple", "purple", "dark-green"
    ],
    "medium": [
        "brown", "dark-brown", "orange", "dark-orange",
        "green", "blue", "neutral", "light-brown"
    ],
    "tan": [
        "white", "light-blue", "blue", "red", "orange",
        "light-green", "green", "light-yellow"
    ],
    "deep": [
        "white", "yellow", "light-yellow", "orange",
        "light-orange", "red", "light-red", "light-grey"
    ],
}

#  Background removal 
def get_background_color(img_rgb):
    h, w = img_rgb.shape[:2]
    s = 15
    corners = [
        img_rgb[0:s, 0:s],
        img_rgb[0:s, w-s:w],
        img_rgb[h-s:h, 0:s],
        img_rgb[h-s:h, w-s:w],
    ]
    all_pixels = np.vstack([c.reshape(-1, 3) for c in corners])
    return all_pixels.mean(axis=0)

def remove_background_pixels(img_rgb, bg_color, threshold=40):
    diff = np.abs(img_rgb.astype(float) - bg_color).sum(axis=2)
    mask = diff > threshold
    return img_rgb[mask]

#  Skin tone extraction 
def get_skin_tone(image_bytes: bytes) -> str:
    arr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)

    if img is None:
        return "medium"

    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img_rgb = cv2.resize(img_rgb, (200, 300))

    h, w = img_rgb.shape[:2]

    # Sample top-center = face/neck area
    face_region = img_rgb[0:h//3, w//4:3*w//4]

    # Remove background from face region
    bg = get_background_color(face_region)
    garment_pixels = remove_background_pixels(face_region, bg, threshold=30)

    if len(garment_pixels) == 0:
        avg = face_region.mean(axis=(0, 1))
    else:
        avg = garment_pixels.mean(axis=0)

    brightness = float(avg.mean())

    if brightness > 200:
        return "fair"
    elif brightness > 160:
        return "medium"
    elif brightness > 120:
        return "tan"
    else:
        return "deep"

#  Endpoint 
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