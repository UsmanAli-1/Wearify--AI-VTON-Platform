from fastapi import FastAPI, UploadFile, File
import cv2
import numpy as np
import mediapipe as mp
from ultralytics import YOLO

app = FastAPI()

# YOLOv8 nano — lightweight, fast
yolo = YOLO("yolov8n.pt")

mp_pose = mp.solutions.pose
pose = mp_pose.Pose(static_image_mode=True, min_detection_confidence=0.5)

def is_full_body(image):
    h, w = image.shape[:2]

    # ---------- STEP 1: COUNT PEOPLE WITH YOLO ----------
    results = yolo(image, verbose=False)[0]
    
    # Filter only "person" class with confidence > 0.5
    people = [box for box in results.boxes if int(box.cls) == 0 and float(box.conf) > 0.5]

    if len(people) == 0:
        return {"isFullBody": False, "reason": "no_person_detected"}

    if len(people) > 1:
        # Sort by box area — largest = main subject
        people = sorted(people, key=lambda b: (b.xyxy[0][2]-b.xyxy[0][0]) * (b.xyxy[0][3]-b.xyxy[0][1]), reverse=True)
        
        largest_area = (people[0].xyxy[0][2]-people[0].xyxy[0][0]) * (people[0].xyxy[0][3]-people[0].xyxy[0][1])
        second_area = (people[1].xyxy[0][2]-people[1].xyxy[0][0]) * (people[1].xyxy[0][3]-people[1].xyxy[0][1])
        
        # Only reject if second person is 35%+ size of main person
        if second_area / largest_area > 0.35:
            return {"isFullBody": False, "reason": "multiple_people"}
        
        # Otherwise keep only the largest person
        people = [people[0]]

    # ---------- STEP 2: GET PERSON BOUNDING BOX ----------
    box = people[0].xyxy[0].tolist()  # x1, y1, x2, y2
    x1, y1, x2, y2 = box
    person_h = y2 - y1
    person_w = x2 - x1
    person_area = person_h * person_w
    image_area = h * w

    # ---------- STEP 3: SELFIE CHECK ----------
    # Person takes up too much of the frame = selfie/close-up
    if person_area / image_area > 0.75:
        return {"isFullBody": False, "reason": "selfie"}

    # ---------- STEP 4: FULL BODY CHECK WITH MEDIAPIPE ----------
    rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    pose_results = pose.process(rgb)

    if not pose_results.pose_landmarks:
        return {"isFullBody": False, "reason": "not_full_body"}

    lm = pose_results.pose_landmarks.landmark

    shoulders = lm[11].visibility > 0.4 and lm[12].visibility > 0.4
    hips = lm[23].visibility > 0.4 and lm[24].visibility > 0.4
    ankles = lm[27].visibility > 0.4 and lm[28].visibility > 0.4

    if not (shoulders and hips and ankles):
        return {"isFullBody": False, "reason": "not_full_body"}

    # ---------- STEP 5: HEIGHT RATIO ----------
    head_y = lm[0].y * h
    ankle_y = max(lm[27].y, lm[28].y) * h
    height_ratio = (ankle_y - head_y) / h

    if height_ratio < 0.35:
        return {"isFullBody": False, "reason": "not_full_body"}

    return {"isFullBody": True}

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