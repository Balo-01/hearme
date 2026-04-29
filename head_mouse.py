import cv2
import numpy as np
import pyautogui
import keyboard
import threading
import time
import os

from mediapipe.python.solutions import face_mesh as mp_face_mesh
# -----------------------------
# Stable head-tracking mouse
# -----------------------------

pyautogui.FAILSAFE = False

MONITOR_WIDTH, MONITOR_HEIGHT = pyautogui.size()
CENTER_X = MONITOR_WIDTH // 2
CENTER_Y = MONITOR_HEIGHT // 2

mouse_control_enabled = False
mouse_target = [CENTER_X, CENTER_Y]
mouse_lock = threading.Lock()

screen_position_file = os.path.join(os.path.dirname(__file__), "screen_position.txt")

# Tracking / control tuning
deadzone_norm = 0.015          # ignore tiny normalized face movements
gain_x = 2.2                   # horizontal sensitivity
gain_y = 2.0                   # vertical sensitivity
max_norm = 0.18                # clamp large movements
move_interval = 0.01
move_duration = 0.01

# Smoothing
cursor_alpha = 0.14
smoothed_cursor = np.array([CENTER_X, CENTER_Y], dtype=float)

# Neutral head pose (captured on C)
neutral_nose = None
neutral_mid = None
neutral_face_w = None
neutral_face_h = None

# MediaPipe Face Mesh
face_mesh = mp_face_mesh.FaceMesh(
    static_image_mode=False,
    max_num_faces=1,
    refine_landmarks=True,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

# Landmark ids
NOSE_TIP = 1
LEFT_FACE = 234
RIGHT_FACE = 454
TOP_FACE = 10
BOTTOM_FACE = 152


def write_screen_position(x, y):
    with open(screen_position_file, "w", encoding="utf-8") as f:
        f.write(f"{x},{y}\n")


def clamp(v, lo, hi):
    return max(lo, min(hi, v))


def lowpass(old, new, alpha):
    return (1.0 - alpha) * old + alpha * new


def draw_mouse_halo(frame, screen_x, screen_y):
    fh, fw = frame.shape[:2]
    fx = int((screen_x / max(MONITOR_WIDTH, 1)) * fw)
    fy = int((screen_y / max(MONITOR_HEIGHT, 1)) * fh)
    fx = clamp(fx, 0, fw - 1)
    fy = clamp(fy, 0, fh - 1)

    cv2.circle(frame, (fx, fy), 24, (0, 255, 255), 3, cv2.LINE_AA)
    cv2.circle(frame, (fx, fy), 8, (0, 255, 255), 2, cv2.LINE_AA)


def mouse_mover():
    while True:
        if mouse_control_enabled:
            with mouse_lock:
                x, y = mouse_target
            pyautogui.moveTo(x, y, duration=move_duration)
        time.sleep(move_interval)


threading.Thread(target=mouse_mover, daemon=True).start()

# Webcam
cap = cv2.VideoCapture(0)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

WINDOW_NAME = "Stable Head Tracking Mouse"
cv2.namedWindow(WINDOW_NAME, cv2.WINDOW_NORMAL)
cv2.setWindowProperty(WINDOW_NAME, cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_FULLSCREEN)


def get_face_points(landmarks):
    def pt(idx):
        lm = landmarks[idx]
        return np.array([lm.x * w, lm.y * h], dtype=float)

    nose = pt(NOSE_TIP)
    left = pt(LEFT_FACE)
    right = pt(RIGHT_FACE)
    top = pt(TOP_FACE)
    bottom = pt(BOTTOM_FACE)

    mid = (left + right) * 0.5
    face_w = np.linalg.norm(right - left)
    face_h = np.linalg.norm(bottom - top)

    return nose, mid, face_w, face_h, left, right, top, bottom


while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    # Some camera drivers can output grayscale; force BGR so display stays in color.
    if frame.ndim == 2 or (frame.ndim == 3 and frame.shape[2] == 1):
        frame = cv2.cvtColor(frame, cv2.COLOR_GRAY2BGR)

    frame = cv2.flip(frame, 1)  # mirror for more intuitive control
    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = face_mesh.process(frame_rgb)

    status_lines = [
        f"Mouse: {'ON' if mouse_control_enabled else 'OFF'}",
        "C = calibrate neutral head pose",
        "F7 = toggle mouse control",
        "Q = quit",
    ]

    if results.multi_face_landmarks:
        face_landmarks = results.multi_face_landmarks[0].landmark
        nose, mid, face_w, face_h, left, right, top, bottom = get_face_points(face_landmarks)

        # Draw face reference points
        for p, color in [
            (nose, (0, 255, 255)),
            (left, (0, 255, 0)),
            (right, (0, 255, 0)),
            (top, (255, 0, 0)),
            (bottom, (255, 0, 0)),
        ]:
            cv2.circle(frame, (int(p[0]), int(p[1])), 4, color, -1)

        cv2.line(frame, tuple(left.astype(int)), tuple(right.astype(int)), (0, 200, 0), 1)
        cv2.line(frame, tuple(top.astype(int)), tuple(bottom.astype(int)), (200, 0, 0), 1)

        if neutral_nose is not None and neutral_mid is not None and neutral_face_w is not None and neutral_face_h is not None:
            # Use both nose-tip motion and face-center motion relative to calibrated neutral.
            dx_nose = (nose[0] - neutral_nose[0]) / max(neutral_face_w, 1.0)
            dy_nose = (nose[1] - neutral_nose[1]) / max(neutral_face_h, 1.0)

            dx_mid = (mid[0] - neutral_mid[0]) / max(neutral_face_w, 1.0)
            dy_mid = (mid[1] - neutral_mid[1]) / max(neutral_face_h, 1.0)

            # Blend: face center gives stability, nose gives responsiveness.
            dx = 0.65 * dx_mid + 0.35 * dx_nose
            dy = 0.65 * dy_mid + 0.35 * dy_nose

            # Scale compensation if user moves slightly forward/backward
            scale_w = face_w / max(neutral_face_w, 1.0)
            scale_h = face_h / max(neutral_face_h, 1.0)
            scale_avg = (scale_w + scale_h) * 0.5
            if scale_avg > 1e-6:
                dx /= scale_avg
                dy /= scale_avg

            # Dead zone
            if abs(dx) < deadzone_norm:
                dx = 0.0
            if abs(dy) < deadzone_norm:
                dy = 0.0

            dx = clamp(dx, -max_norm, max_norm)
            dy = clamp(dy, -max_norm, max_norm)

            target_x = CENTER_X + (dx / max_norm) * (MONITOR_WIDTH * 0.45 * gain_x)
            target_y = CENTER_Y + (dy / max_norm) * (MONITOR_HEIGHT * 0.45 * gain_y)

            target_x = clamp(target_x, 10, MONITOR_WIDTH - 10)
            target_y = clamp(target_y, 10, MONITOR_HEIGHT - 10)

            smoothed_cursor[0] = lowpass(smoothed_cursor[0], target_x, cursor_alpha)
            smoothed_cursor[1] = lowpass(smoothed_cursor[1], target_y, cursor_alpha)

            screen_x = int(round(smoothed_cursor[0]))
            screen_y = int(round(smoothed_cursor[1]))

            with mouse_lock:
                mouse_target[0] = screen_x
                mouse_target[1] = screen_y

            if mouse_control_enabled:
                draw_mouse_halo(frame, screen_x, screen_y)

            write_screen_position(screen_x, screen_y)

            cv2.circle(frame, (int(nose[0]), int(nose[1])), 8, (0, 255, 255), 2)
            cv2.putText(frame, f"Screen: ({screen_x}, {screen_y})", (20, 35),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2, cv2.LINE_AA)
            status_lines.insert(1, "Calib: READY")
            status_lines.insert(2, f"dx={dx:.3f} dy={dy:.3f}")
        else:
            status_lines.insert(1, "Calib: PRESS C")
            cv2.putText(frame, "Press C while looking straight / sitting naturally", (20, 35),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2, cv2.LINE_AA)

    y0 = h - (len(status_lines) * 24) - 10
    for i, line in enumerate(status_lines):
        cv2.putText(frame, line, (10, y0 + i * 24),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (220, 220, 220), 1, cv2.LINE_AA)

    cv2.imshow(WINDOW_NAME, frame)

    if keyboard.is_pressed('f7'):
        mouse_control_enabled = not mouse_control_enabled
        print(f"[Mouse Control] {'Enabled' if mouse_control_enabled else 'Disabled'}")
        time.sleep(0.3)

    key = cv2.waitKey(1) & 0xFF
    if key == ord('q'):
        break
    elif key == ord('c') and results.multi_face_landmarks:
        neutral_nose = nose.copy()
        neutral_mid = mid.copy()
        neutral_face_w = face_w
        neutral_face_h = face_h
        smoothed_cursor[:] = np.array([CENTER_X, CENTER_Y], dtype=float)
        with mouse_lock:
            mouse_target[0] = CENTER_X
            mouse_target[1] = CENTER_Y
        print("[Calibration] Neutral head pose captured.")
        print("[Calibration] Sit naturally, look straight, keep webcam roughly centered on the monitor.")

cap.release()
cv2.destroyAllWindows()
