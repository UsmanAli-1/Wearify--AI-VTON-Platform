from fastapi import FastAPI, UploadFile, File
import cv2
import numpy as np
import mediapipe as mp

app = FastAPI()


face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)

mp_pose = mp.solutions.pose
pose = mp_pose.Pose(static_image_mode=True)

def is_full_body(image):
    h, w = image.shape[:2]

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.1, 4)

    # ---------- FACE DETECTION ----------
    if len(faces) == 0:
        return {
            "isFullBody": False,
            "reason": "no_person_detected"
        }

    if len(faces) > 1:
        return {
            "isFullBody": False,
            "reason": "multiple_people"
        }

    # ---------- POSE ----------
    results = pose.process(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))

    if not results.pose_landmarks:
        return {
            "isFullBody": False,
            "reason": "no_person_detected"
        }

    lm = results.pose_landmarks.landmark

    shoulders = lm[11].visibility > 0.5 and lm[12].visibility > 0.5
    hips = lm[23].visibility > 0.5 and lm[24].visibility > 0.5
    ankles = lm[27].visibility > 0.5 and lm[28].visibility > 0.5

    if not (shoulders and hips and ankles):
        return {
            "isFullBody": False,
            "reason": "not_full_body"
        }

    # ---------- FACE SIZE ----------
    (x, y, fw, fh) = faces[0]
    face_area = fw * fh
    image_area = w * h

    if (face_area / image_area) > 0.15:
        return {
            "isFullBody": False,
            "reason": "selfie"
        }

    # ---------- HEIGHT ----------
    head_y = lm[0].y * h
    ankle_y = max(lm[27].y, lm[28].y) * h

    height_ratio = (ankle_y - head_y) / h

    if height_ratio < 0.4:
        return {
            "isFullBody": False,
            "reason": "not_full_body"
        }

    return {
        "isFullBody": True
    }

@app.post("/check-full-body")
async def check_full_body(file: UploadFile = File(...)):
    contents = await file.read()

    np_arr = np.frombuffer(contents, np.uint8)
    image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    if image is None:
        return {"error": "Invalid image"}

    return is_full_body(image)


@app.get("/")
def home():
    return {"message": "AI Service Running"}