#!/usr/bin/env python3
"""
sprite_splitter_gui.py

Tkinter GUI to split a sprite sheet (transparent-background image with
separate, non-overlapping renders) into individual sprite images.

Only dependency: Pillow (PIL). Tkinter is part of the Python standard
library. No numpy / scipy / scikit-image required.

    pip install pillow
    python sprite_splitter_gui.py

Handling sprites that touch through a faint, partially-transparent
"bridge" pixel (alpha somewhere between 0 and 255, not a clean seam):

  - Visibility threshold (loose): any pixel with alpha above this counts
    as belonging to some sprite. Keeps soft anti-aliased edges.
  - Separation threshold (strict): used to find the initial "seed" blobs
    via flood fill. A faint bridge (alpha below this) won't connect two
    seeds, so touching sprites still get treated as separate.
  - Growth step: each seed then expands outward (multi-source flood fill)
    through all the remaining visible pixels, so the faint bridge pixels
    get divided between the two sprites instead of merging them.
"""

import os
from collections import deque
import tkinter as tk
from tkinter import filedialog, messagebox, ttk

from PIL import Image, ImageTk


CANVAS_MAX = 800
CHECKER = 10


# ---------------------------------------------------------------------------
# Core logic - plain Python, only Pillow for image I/O
# ---------------------------------------------------------------------------

def segment_sprites(img, visibility_threshold=10, separation_threshold=200, min_area=20):
    """
    img: PIL Image in RGBA mode
    Returns (labels, count):
        labels: flat list of ints, length w*h, 0 = background, 1..count = sprite id
        count: number of sprites found
    """
    w, h = img.size
    alpha = list(img.getchannel("A").getdata())  # flat list, len w*h

    def idx(x, y):
        return y * w + x

    visible = [a > visibility_threshold for a in alpha]
    is_seed = [a > separation_threshold for a in alpha]

    labels = [0] * (w * h)
    next_label = 0

    neighbors = [(-1, -1), (0, -1), (1, -1), (-1, 0), (1, 0), (-1, 1), (0, 1), (1, 1)]

    # 1) Flood fill strict seeds into initial labeled blobs
    for y in range(h):
        for x in range(w):
            i = idx(x, y)
            if is_seed[i] and labels[i] == 0:
                next_label += 1
                labels[i] = next_label
                q = deque([(x, y)])
                while q:
                    cx, cy = q.popleft()
                    for dx, dy in neighbors:
                        nx, ny = cx + dx, cy + dy
                        if 0 <= nx < w and 0 <= ny < h:
                            ni = idx(nx, ny)
                            if is_seed[ni] and labels[ni] == 0:
                                labels[ni] = next_label
                                q.append((nx, ny))

    if next_label == 0:
        return labels, 0

    # 2) Grow all seed regions simultaneously through the full visible mask.
    #    Multi-source BFS: whichever seed's wavefront reaches a pixel first
    #    claims it. This lets a thin low-alpha bridge get split between the
    #    two sprites on either side instead of joining them into one.
    q = deque(i for i in range(w * h) if labels[i] != 0)

    while q:
        ci = q.popleft()
        cx, cy = ci % w, ci // w
        for dx, dy in neighbors:
            nx, ny = cx + dx, cy + dy
            if 0 <= nx < w and 0 <= ny < h:
                ni = idx(nx, ny)
                if visible[ni] and labels[ni] == 0:
                    labels[ni] = labels[ci]
                    q.append(ni)

    # 3) Drop tiny regions (noise specks)
    areas = [0] * (next_label + 1)
    for i in range(w * h):
        if labels[i]:
            areas[labels[i]] += 1
    keep = [False] * (next_label + 1)
    for lbl in range(1, next_label + 1):
        keep[lbl] = areas[lbl] >= min_area

    # 4) Relabel to contiguous 1..N for the kept regions
    remap = [0] * (next_label + 1)
    new_id = 0
    for lbl in range(1, next_label + 1):
        if keep[lbl]:
            new_id += 1
            remap[lbl] = new_id

    for i in range(w * h):
        if labels[i]:
            labels[i] = remap[labels[i]]

    return labels, new_id


def get_bboxes(labels, w, h, padding):
    """Returns list of (x0, y0, x1, y1, label_id), sorted top-to-bottom, left-to-right."""
    boxes = {}  # label_id -> [x0, y0, x1, y1]
    for y in range(h):
        row = y * w
        for x in range(w):
            lbl = labels[row + x]
            if lbl == 0:
                continue
            if lbl not in boxes:
                boxes[lbl] = [x, y, x, y]
            else:
                b = boxes[lbl]
                if x < b[0]:
                    b[0] = x
                if x > b[2]:
                    b[2] = x
                if y > b[3]:
                    b[3] = y

    result = []
    for lbl, (x0, y0, x1, y1) in boxes.items():
        x0 = max(0, x0 - padding)
        y0 = max(0, y0 - padding)
        x1 = min(w - 1, x1 + padding)
        y1 = min(h - 1, y1 + padding)
        result.append((x0, y0, x1 + 1, y1 + 1, lbl))

    result.sort(key=lambda b: (b[1], b[0]))
    return result


def export_sprites(img, labels, boxes, w, output_dir, prefix="sprite"):
    """Crops each sprite and blanks out any pixels in the crop belonging to a different label."""
    os.makedirs(output_dir, exist_ok=True)
    saved = []

    for idx, (x0, y0, x1, y1, label_id) in enumerate(boxes, start=1):
        crop = img.crop((x0, y0, x1, y1)).convert("RGBA")
        pixels = crop.load()
        cw, ch = crop.size
        for cy in range(ch):
            for cx in range(cw):
                gx, gy = x0 + cx, y0 + cy
                lbl = labels[gy * w + gx]
                if lbl != 0 and lbl != label_id:
                    r, g, b, a = pixels[cx, cy]
                    pixels[cx, cy] = (r, g, b, 0)

        out_path = os.path.join(output_dir, f"{prefix}_{idx:03d}.png")
        crop.save(out_path)
        saved.append(out_path)

    return saved


# ---------------------------------------------------------------------------
# GUI
# ---------------------------------------------------------------------------

def make_checkerboard(w, h, size=CHECKER):
    board = Image.new("RGB", (w, h), (255, 255, 255))
    px = board.load()
    for y in range(h):
        for x in range(w):
            if ((x // size) + (y // size)) % 2 == 0:
                px[x, y] = (222, 222, 222)
    return board


class SpriteSplitterApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Sprite Sheet Splitter")
        self.root.geometry("1000x700")

        self.img = None
        self.labels = None
        self.boxes = []
        self.display_scale = 1.0
        self.tk_preview_img = None

        self._build_layout()

    def _build_layout(self):
        main = ttk.Frame(self.root, padding=10)
        main.pack(fill=tk.BOTH, expand=True)

        controls = ttk.Frame(main, width=280)
        controls.pack(side=tk.LEFT, fill=tk.Y, padx=(0, 10))

        ttk.Button(controls, text="Open Sprite Sheet...", command=self.open_image).pack(fill=tk.X, pady=4)
        self.status_label = ttk.Label(controls, text="No image loaded", wraplength=260)
        self.status_label.pack(fill=tk.X, pady=(0, 10))

        ttk.Separator(controls).pack(fill=tk.X, pady=8)

        self.visibility_var = tk.IntVar(value=10)
        self.separation_var = tk.IntVar(value=200)
        self.min_area_var = tk.IntVar(value=20)
        self.padding_var = tk.IntVar(value=2)

        self._add_slider(controls, "Visibility threshold", self.visibility_var, 0, 254)
        self._add_slider(controls, "Separation threshold\n(raise if touching sprites merge)",
                          self.separation_var, 1, 255)
        self._add_slider(controls, "Min area (px)", self.min_area_var, 1, 500)
        self._add_slider(controls, "Padding (px)", self.padding_var, 0, 50)

        ttk.Separator(controls).pack(fill=tk.X, pady=8)

        ttk.Button(controls, text="Preview Segmentation", command=self.preview).pack(fill=tk.X, pady=4)
        ttk.Button(controls, text="Export Sprites...", command=self.export).pack(fill=tk.X, pady=4)

        self.count_label = ttk.Label(controls, text="")
        self.count_label.pack(fill=tk.X, pady=(10, 0))

        right = ttk.Frame(main)
        right.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        self.canvas = tk.Canvas(right, background="#333333")
        self.canvas.pack(fill=tk.BOTH, expand=True)

    def _add_slider(self, parent, label, var, lo, hi):
        ttk.Label(parent, text=label).pack(fill=tk.X, pady=(6, 0))
        frame = ttk.Frame(parent)
        frame.pack(fill=tk.X)
        ttk.Scale(frame, from_=lo, to=hi, variable=var, orient=tk.HORIZONTAL).pack(
            side=tk.LEFT, fill=tk.X, expand=True)
        ttk.Entry(frame, width=5, textvariable=var).pack(side=tk.LEFT, padx=(4, 0))

    def open_image(self):
        path = filedialog.askopenfilename(
            title="Select sprite sheet",
            filetypes=[("PNG images", "*.png"), ("All images", "*.*")],
        )
        if not path:
            return
        try:
            self.img = Image.open(path).convert("RGBA")
        except Exception as e:
            messagebox.showerror("Error", f"Could not open image:\n{e}")
            return

        self.labels = None
        self.boxes = []
        self.status_label.config(text=f"Loaded: {os.path.basename(path)}  ({self.img.width}x{self.img.height})")
        self.count_label.config(text="")
        self._render(boxes=None)

    def preview(self):
        if self.img is None:
            messagebox.showwarning("No image", "Open a sprite sheet first.")
            return
        vis = self.visibility_var.get()
        sep = self.separation_var.get()
        if sep <= vis:
            messagebox.showwarning("Check thresholds",
                                    "Separation threshold should be higher than the visibility threshold.")

        w, h = self.img.size
        self.labels, count = segment_sprites(self.img, vis, sep, self.min_area_var.get())
        self.boxes = get_bboxes(self.labels, w, h, self.padding_var.get()) if count else []
        self.count_label.config(text=f"Found {count} sprite(s)")
        self._render(boxes=self.boxes)

    def export(self):
        if self.img is None:
            messagebox.showwarning("No image", "Open a sprite sheet first.")
            return
        if not self.boxes:
            self.preview()
            if not self.boxes:
                messagebox.showwarning("No sprites found", "Adjust thresholds and preview again.")
                return

        out_dir = filedialog.askdirectory(title="Choose output folder")
        if not out_dir:
            return

        w, _ = self.img.size
        saved = export_sprites(self.img, self.labels, self.boxes, w, out_dir)
        messagebox.showinfo("Done", f"Saved {len(saved)} sprite(s) to:\n{out_dir}")

    def _render(self, boxes):
        w, h = self.img.size
        scale = min(CANVAS_MAX / w, CANVAS_MAX / h, 1.0)
        self.display_scale = scale
        dw, dh = max(1, int(w * scale)), max(1, int(h * scale))

        checker = make_checkerboard(dw, dh)
        resized = self.img.resize((dw, dh), Image.NEAREST)
        checker.paste(resized, (0, 0), resized)

        self.tk_preview_img = ImageTk.PhotoImage(checker)
        self.canvas.delete("all")
        self.canvas.create_image(0, 0, anchor="nw", image=self.tk_preview_img)

        if boxes:
            s = self.display_scale
            for (x0, y0, x1, y1, _lbl) in boxes:
                self.canvas.create_rectangle(x0 * s, y0 * s, x1 * s, y1 * s, outline="#00ff88", width=2)


def main():
    root = tk.Tk()
    SpriteSplitterApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
