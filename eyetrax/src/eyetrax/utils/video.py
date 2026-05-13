from __future__ import annotations

from contextlib import contextmanager

import cv2


def open_camera_with_index(
    index: int = 0,
    *,
    allow_fallback: bool = True,
) -> tuple[cv2.VideoCapture, int]:
    """
    Open a camera by index and return both the capture object and the actual
    opened index.

    Compatibility fallback: if camera 0 fails to open, try camera 1.
    """
    cap = cv2.VideoCapture(index)
    if cap.isOpened():
        return cap, index

    cap.release()
    if allow_fallback and index == 0:
        cap = cv2.VideoCapture(1)
        if cap.isOpened():
            return cap, 1
        cap.release()
        raise RuntimeError("cannot open camera 0 (fallback to camera 1 also failed)")

    raise RuntimeError(f"cannot open camera {index}")


def open_camera(
    index: int = 0,
    *,
    allow_fallback: bool = True,
) -> cv2.VideoCapture:
    """
    Open a camera by index.
    """
    cap, _ = open_camera_with_index(index, allow_fallback=allow_fallback)
    return cap


def list_available_cameras(max_index: int = 4) -> list[int]:
    """
    Probe a small range of camera indexes and return the ones that can be opened.
    """
    available = []
    for index in range(max_index):
        cap = cv2.VideoCapture(index)
        if cap.isOpened():
            available.append(index)
        cap.release()
    return available


@contextmanager
def fullscreen(name: str):
    """
    Open a window in full-screen mode
    """
    cv2.namedWindow(name, cv2.WND_PROP_FULLSCREEN)
    cv2.setWindowProperty(name, cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_FULLSCREEN)
    try:
        yield
    finally:
        cv2.destroyWindow(name)


@contextmanager
def camera(index: int = 0):
    """
    Context manager returning an opened VideoCapture
    """
    cap = open_camera(index)
    try:
        yield cap
    finally:
        cap.release()


def iter_frames(cap: cv2.VideoCapture):
    """
    Infinite generator yielding successive frames
    """
    while True:
        ok, frame = cap.read()
        if not ok:
            continue
        yield frame
