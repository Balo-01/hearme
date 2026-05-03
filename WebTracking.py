import cv2
import numpy as np
import os
import mediapipe as mp
import time
from collections import deque
import pyautogui
import threading
import keyboard

pyautogui.FAILSAFE = False

MONITOR_WIDTH, MONITOR_HEIGHT = pyautogui.size()
CENTER_X = MONITOR_WIDTH // 2
CENTER_Y = MONITOR_HEIGHT // 2

mouse_control_enabled = False
mouse_target = [CENTER_X, CENTER_Y]
mouse_lock = threading.Lock()

screen_position_file = os.path.join(os.path.dirname(__file__), "screen_position.txt")

# Smoothing - ca în codul inițial
direction_buffer = deque(maxlen=12)
screen_alpha = 0.18
smoothed_x = float(CENTER_X)
smoothed_y = float(CENTER_Y)

center_deadzone = 0.035
edge_padding = 10

neutral_yaw = None
neutral_pitch = None

neutral_head_x = None
neutral_head_y = None

is_collecting_calibration = False
current_calibration_index = -1
calibration_samples = []

CALIBRATION_POINTS = [
    ("CENTER", 0.50, 0.50),
    ("TOP_LEFT", 0.15, 0.15),
    ("TOP_RIGHT", 0.85, 0.15),
    ("BOTTOM_LEFT", 0.15, 0.85),
    ("BOTTOM_RIGHT", 0.85, 0.85),
]

linear_model_x = None
linear_model_y = None
has_linear_calibration = False

last_f7_toggle_time = 0.0

mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(
    static_image_mode=False,
    max_num_faces=1,
    refine_landmarks=True,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

cap = cv2.VideoCapture(0)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 960)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 540)

w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

WINDOW_NAME = "Linear Eye Tracking"
cv2.namedWindow(WINDOW_NAME, cv2.WINDOW_NORMAL)
cv2.setWindowProperty(WINDOW_NAME, cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_FULLSCREEN)

LEFT_IRIS = 468
RIGHT_IRIS = 473

LEFT_FACE = 234
RIGHT_FACE = 454
TOP_FACE = 10
BOTTOM_FACE = 152
NOSE_TIP = 1


def write_screen_position(x, y):
    with open(screen_position_file, "w", encoding="utf-8") as f:
        f.write(f"{x},{y}\n")


def clamp(v, lo, hi):
    return max(lo, min(hi, v))


def lowpass(old, new, alpha):
    return (1.0 - alpha) * old + alpha * new


def apply_deadzone(v, dz):
    if abs(v) <= dz:
        return 0.0
    if v > 0:
        return (v - dz) / (1.0 - dz)
    return (v + dz) / (1.0 - dz)


def mouse_mover():
    while True:
        if mouse_control_enabled:
            with mouse_lock:
                x, y = mouse_target
            pyautogui.moveTo(x, y)
        time.sleep(0.01)


threading.Thread(target=mouse_mover, daemon=True).start()


def get_point(landmarks, idx):
    lm = landmarks[idx]
    return np.array([lm.x * w, lm.y * h, lm.z * w], dtype=float)


def get_raw_gaze_angles(landmarks):
    left_iris = get_point(landmarks, LEFT_IRIS)
    right_iris = get_point(landmarks, RIGHT_IRIS)
    nose = get_point(landmarks, NOSE_TIP)
    left_face = get_point(landmarks, LEFT_FACE)
    right_face = get_point(landmarks, RIGHT_FACE)
    top_face = get_point(landmarks, TOP_FACE)
    bottom_face = get_point(landmarks, BOTTOM_FACE)

    face_center = (left_face + right_face + top_face + bottom_face) * 0.25
    iris_center = (left_iris + right_iris) * 0.5

    face_w = np.linalg.norm(right_face - left_face)
    face_h = np.linalg.norm(bottom_face - top_face)

    if face_w < 1e-6:
        face_w = 1.0
    if face_h < 1e-6:
        face_h = 1.0

    dx = (iris_center[0] - face_center[0]) / face_w
    dy = (iris_center[1] - face_center[1]) / face_h

    yaw = dx * 180.0
    pitch = dy * 180.0

    return yaw, pitch, iris_center, face_center, left_face, right_face, top_face, bottom_face, nose


def draw_head_center_guide(frame, face_center):
    fh, fw = frame.shape[:2]

    target_x = fw // 2
    target_y = fh // 2

    hx = int(face_center[0])
    hy = int(face_center[1])

    cv2.circle(frame, (target_x, target_y), 24, (255, 255, 255), 2, cv2.LINE_AA)
    cv2.line(frame, (target_x - 25, target_y), (target_x + 25, target_y), (255, 255, 255), 1)
    cv2.line(frame, (target_x, target_y - 25), (target_x, target_y + 25), (255, 255, 255), 1)

    cv2.circle(frame, (hx, hy), 8 , (0, 255, 255), -1, cv2.LINE_AA)
    cv2.line(frame, (target_x, target_y), (hx, hy), (0, 255, 255), 2, cv2.LINE_AA)

    distance = np.hypot(hx - target_x, hy - target_y)

    if distance < 55:
        text = "HEAD CENTERED"
        color = (0, 255, 0)
    else:
        text = "CENTER YOUR FACE"
        color = (0, 0, 255)

    cv2.putText(frame, text, (30, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.75, color, 2, cv2.LINE_AA)


def start_calibration():
    global is_collecting_calibration, current_calibration_index, calibration_samples
    calibration_samples = []
    current_calibration_index = 0
    is_collecting_calibration = True
    print(f"[Calibration] Started. Look at {CALIBRATION_POINTS[current_calibration_index][0]} and press SPACE.")


def finalize_calibration():
    global linear_model_x, linear_model_y, has_linear_calibration

    if len(calibration_samples) < 5:
        print("[Calibration] Not enough points.")
        return

    A = []
    bx = []
    by = []

    for sample in calibration_samples:
        yaw, pitch, sx, sy = sample
        A.append([yaw, pitch, 1.0])
        bx.append(sx)
        by.append(sy)

    A = np.array(A, dtype=float)
    bx = np.array(bx, dtype=float)
    by = np.array(by, dtype=float)

    linear_model_x, _, _, _ = np.linalg.lstsq(A, bx, rcond=None)
    linear_model_y, _, _, _ = np.linalg.lstsq(A, by, rcond=None)

    has_linear_calibration = True

    print("[Calibration] Linear calibration complete.")
    print(f"[Calibration] model_x = {linear_model_x}")
    print(f"[Calibration] model_y = {linear_model_y}")


def capture_calibration_point(raw_yaw, raw_pitch):
    global current_calibration_index, is_collecting_calibration

    point_name, nx, ny = CALIBRATION_POINTS[current_calibration_index]
    sx = int(nx * MONITOR_WIDTH)
    sy = int(ny * MONITOR_HEIGHT)

    calibration_samples.append((raw_yaw, raw_pitch, sx, sy))
    print(f"[Calibration] Saved {point_name}: yaw={raw_yaw:.3f}, pitch={raw_pitch:.3f} -> ({sx}, {sy})")

    current_calibration_index += 1

    if current_calibration_index >= len(CALIBRATION_POINTS):
        is_collecting_calibration = False
        finalize_calibration()
    else:
        print(f"[Calibration] Next: look at {CALIBRATION_POINTS[current_calibration_index][0]} and press SPACE.")


def map_to_screen(raw_yaw, raw_pitch):
    global smoothed_x, smoothed_y

    if has_linear_calibration and linear_model_x is not None and linear_model_y is not None:
        target_x = linear_model_x[0] * raw_yaw + linear_model_x[1] * raw_pitch + linear_model_x[2]
        target_y = linear_model_y[0] * raw_yaw + linear_model_y[1] * raw_pitch + linear_model_y[2]
    else:
        yaw = raw_yaw - (neutral_yaw if neutral_yaw is not None else 0.0)
        pitch = raw_pitch - (neutral_pitch if neutral_pitch is not None else 0.0)

        nx = clamp(yaw / 8.0, -1.0, 1.0)
        ny = clamp(pitch / 6.0, -1.0, 1.0)

        nx = apply_deadzone(nx, center_deadzone)
        ny = apply_deadzone(ny, center_deadzone)

        target_x = CENTER_X + nx * (MONITOR_WIDTH * 0.45)
        target_y = CENTER_Y + ny * (MONITOR_HEIGHT * 0.45)

    target_x = clamp(target_x, edge_padding, MONITOR_WIDTH - edge_padding)
    target_y = clamp(target_y, edge_padding, MONITOR_HEIGHT - edge_padding)

    smoothed_x = lowpass(smoothed_x, target_x, screen_alpha)
    smoothed_y = lowpass(smoothed_y, target_y, screen_alpha)

    return int(round(smoothed_x)), int(round(smoothed_y))


def draw_calibration_overlay(frame):
    if not is_collecting_calibration:
        return

    fh, fw = frame.shape[:2]
    radius = max(12, int(min(fw, fh) * 0.02))

    for idx, (name, px, py) in enumerate(CALIBRATION_POINTS):
        cx = int(px * fw)
        cy = int(py * fh)

        color = (0, 0, 255) if idx == current_calibration_index else (0, 255, 255)
        thickness = 3 if idx == current_calibration_index else 2

        cv2.circle(frame, (cx, cy), radius, color, thickness, lineType=cv2.LINE_AA)
        cv2.line(frame, (cx - radius - 8, cy), (cx + radius + 8, cy), color, 1, cv2.LINE_AA)
        cv2.line(frame, (cx, cy - radius - 8), (cx, cy + radius + 8), color, 1, cv2.LINE_AA)

        cv2.putText(
            frame,
            name.replace("_", " "),
            (cx - 45, cy - radius - 10),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.45,
            color,
            1,
            cv2.LINE_AA
        )

    active_name = CALIBRATION_POINTS[current_calibration_index][0].replace("_", " ")
    msg = f"Look at {active_name} and press SPACE"
    cv2.putText(frame, msg, (20, 35), cv2.FONT_HERSHEY_SIMPLEX, 0.75, (0, 0, 255), 2, cv2.LINE_AA)


def draw_mouse_halo(frame, screen_x, screen_y):
    fh, fw = frame.shape[:2]
    fx = int((screen_x / max(MONITOR_WIDTH, 1)) * fw)
    fy = int((screen_y / max(MONITOR_HEIGHT, 1)) * fh)

    fx = clamp(fx, 0, fw - 1)
    fy = clamp(fy, 0, fh - 1)

    cv2.circle(frame, (fx, fy), 24, (0, 255, 255), 3, cv2.LINE_AA)
    cv2.circle(frame, (fx, fy), 8, (0, 255, 255), 2, cv2.LINE_AA)


while cap.isOpened():
    ret, frame = cap.read()

    if not ret:
        break

    if frame.ndim == 2 or (frame.ndim == 3 and frame.shape[2] == 1):
        frame = cv2.cvtColor(frame, cv2.COLOR_GRAY2BGR)

    frame = cv2.flip(frame, 1)
    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = face_mesh.process(frame_rgb)

    status_lines = [
        f"Mouse: {'ON' if mouse_control_enabled else 'OFF'}",
        f"Linear calibration: {'READY' if has_linear_calibration else 'NO'}",
        "C = set neutral pose + head center",
        "S = start 5-point calibration",
        "SPACE = capture active calibration point",
        "F7 = toggle mouse control",
        "Q = quit",
    ]

    raw_yaw = None
    raw_pitch = None
    screen_x = CENTER_X
    screen_y = CENTER_Y

    if results.multi_face_landmarks:
        face_landmarks = results.multi_face_landmarks[0].landmark

        raw_yaw, raw_pitch, iris_center, face_center, left_face, right_face, top_face, bottom_face, nose = get_raw_gaze_angles(face_landmarks)

        draw_head_center_guide(frame, face_center)

        if neutral_yaw is not None:
            raw_yaw -= neutral_yaw
        if neutral_pitch is not None:
            raw_pitch -= neutral_pitch

        direction_buffer.append(np.array([raw_yaw, raw_pitch], dtype=float))
        smoothed_angles = np.median(direction_buffer, axis=0)

        raw_yaw = float(smoothed_angles[0])
        raw_pitch = float(smoothed_angles[1])

        screen_x, screen_y = map_to_screen(raw_yaw, raw_pitch)

        if mouse_control_enabled:
            with mouse_lock:
                mouse_target[0] = screen_x
                mouse_target[1] = screen_y

            draw_mouse_halo(frame, screen_x, screen_y)

        write_screen_position(screen_x, screen_y)

        for p, color in [
            (iris_center, (0, 255, 255)),
            (face_center, (255, 0, 255)),
            (left_face, (0, 255, 0)),
            (right_face, (0, 255, 0)),
            (top_face, (255, 0, 0)),
            (bottom_face, (255, 0, 0)),
            (nose, (255, 255, 0)),
        ]:
            cv2.circle(frame, (int(p[0]), int(p[1])), 4, color, -1)

        cv2.line(frame, tuple(left_face[:2].astype(int)), tuple(right_face[:2].astype(int)), (0, 200, 0), 1)
        cv2.line(frame, tuple(top_face[:2].astype(int)), tuple(bottom_face[:2].astype(int)), (200, 0, 0), 1)

        info_x = max(20, frame.shape[1] - 430)

        cv2.putText(
            frame,
            f"Screen: ({screen_x}, {screen_y})",
            (info_x, 35),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.75,
            (0, 255, 0),
            2,
            cv2.LINE_AA
        )

        cv2.putText(
            frame,
            f"Yaw/Pitch: ({raw_yaw:.2f}, {raw_pitch:.2f})",
            (info_x, 65),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.65,
            (0, 255, 255),
            2,
            cv2.LINE_AA
        )

    else:
        status_lines.insert(1, "Face: NOT DETECTED")

    draw_calibration_overlay(frame)

    y0 = h - (len(status_lines) * 24) - 10
    for i, line in enumerate(status_lines):
        cv2.putText(
            frame,
            line,
            (10, y0 + i * 24),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (220, 220, 220),
            1,
            cv2.LINE_AA
        )

    cv2.imshow(WINDOW_NAME, frame)

    now = time.time()

    if keyboard.is_pressed("f7"):
        if now - last_f7_toggle_time > 0.35:
            mouse_control_enabled = not mouse_control_enabled
            print(f"[Mouse Control] {'Enabled' if mouse_control_enabled else 'Disabled'}")
            last_f7_toggle_time = now

    key = cv2.waitKey(1) & 0xFF

    if key == ord("q"):
        break

    elif key == ord("c"):
        if results.multi_face_landmarks:
            face_landmarks = results.multi_face_landmarks[0].landmark
            base_yaw, base_pitch, _, face_center, *_ = get_raw_gaze_angles(face_landmarks)

            neutral_yaw = base_yaw
            neutral_pitch = base_pitch

            neutral_head_x = face_center[0]
            neutral_head_y = face_center[1]

            direction_buffer.clear()

            print(f"[Neutral] Captured neutral pose: yaw={neutral_yaw:.3f}, pitch={neutral_pitch:.3f}")
            print(f"[Neutral] Captured head center: x={neutral_head_x:.1f}, y={neutral_head_y:.1f}")
        else:
            print("[Neutral] No face detected.")

    elif key == ord("s"):
        if raw_yaw is not None and raw_pitch is not None:
            start_calibration()
        else:
            print("[Calibration] No face detected.")

    elif key == 32:
        if is_collecting_calibration:
            if raw_yaw is not None and raw_pitch is not None:
                capture_calibration_point(raw_yaw, raw_pitch)
            else:
                print("[Calibration] No face detected for this point.")

cap.release()
cv2.destroyAllWindows()