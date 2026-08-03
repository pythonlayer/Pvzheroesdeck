import os
from collections import deque
import tkinter as tk
from tkinter import filedialog, messagebox, ttk

from PIL import Image, ImageTk

CANVAS_MAX = 800
CHECKER = 10
HANDLE_MARGIN = 6
MIN_BOX_SIZE = 3


def flood_seeds(alpha, is_seed, w, h):
    labels = [0] * (w * h)
    next_label = 0
    neighbors = [(-1, -1), (0, -1), (1, -1), (-1, 0), (1, 0), (-1, 1), (0, 1), (1, 1)]

    def idx(x, y):
        return y * w + x

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
    return labels, next_label


def grow_regions(labels, visible, w, h):
    neighbors = [(-1, -1), (0, -1), (1, -1), (-1, 0), (1, 0), (-1, 1), (0, 1), (1, 1)]
    q = deque(i for i in range(w * h) if labels[i] != 0)
    while q:
        ci = q.popleft()
        cx, cy = ci % w, ci // w
        for dx, dy in neighbors:
            nx, ny = cx + dx, cy + dy
            if 0 <= nx < w and 0 <= ny < h:
                ni = ny * w + nx
                if visible[ni] and labels[ni] == 0:
                    labels[ni] = labels[ci]
                    q.append(ni)
    return labels


def segment_sprites(alpha, w, h, visibility_threshold, separation_threshold, min_area):
    visible = [a > visibility_threshold for a in alpha]
    is_seed = [a > separation_threshold for a in alpha]
    labels, next_label = flood_seeds(alpha, is_seed, w, h)
    if next_label == 0:
        return labels, 0
    labels = grow_regions(labels, visible, w, h)

    areas = [0] * (next_label + 1)
    for i in range(w * h):
        if labels[i]:
            areas[labels[i]] += 1
    keep = [areas[l] >= min_area for l in range(next_label + 1)]
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


def bboxes_from_labels(labels, w, h):
    boxes = {}
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
    return boxes


def normalize_rect(x0, y0, x1, y1):
    return [min(x0, x1), min(y0, y1), max(x0, x1), max(y0, y1)]


def clamp_rect(rect, w, h):
    x0, y0, x1, y1 = rect
    x0 = max(0, min(x0, w - 1))
    y0 = max(0, min(y0, h - 1))
    x1 = max(0, min(x1, w - 1))
    y1 = max(0, min(y1, h - 1))
    if x1 < x0:
        x0, x1 = x1, x0
    if y1 < y0:
        y0, y1 = y1, y0
    return [x0, y0, x1, y1]


def shift_rect(rect, dx, dy, w, h):
    x0, y0, x1, y1 = rect
    width = x1 - x0
    height = y1 - y0
    nx0 = x0 + dx
    ny0 = y0 + dy
    nx0 = max(0, min(nx0, w - 1 - width))
    ny0 = max(0, min(ny0, h - 1 - height))
    return [nx0, ny0, nx0 + width, ny0 + height]


def resize_rect(orig, edges, img_x, img_y, w, h, min_size=MIN_BOX_SIZE):
    x0, y0, x1, y1 = orig
    if edges.get("left"):
        x0 = max(0, min(img_x, x1 - min_size))
    if edges.get("right"):
        x1 = min(w - 1, max(img_x, x0 + min_size))
    if edges.get("top"):
        y0 = max(0, min(img_y, y1 - min_size))
    if edges.get("bottom"):
        y1 = min(h - 1, max(img_y, y0 + min_size))
    return [x0, y0, x1, y1]


def hit_test(px, py, rect, margin=HANDLE_MARGIN):
    x0, y0, x1, y1 = rect
    left = abs(px - x0) <= margin and (y0 - margin) <= py <= (y1 + margin)
    right = abs(px - x1) <= margin and (y0 - margin) <= py <= (y1 + margin)
    top = abs(py - y0) <= margin and (x0 - margin) <= px <= (x1 + margin)
    bottom = abs(py - y1) <= margin and (x0 - margin) <= px <= (x1 + margin)
    inside = x0 <= px <= x1 and y0 <= py <= y1
    edges = {"left": left, "right": right, "top": top, "bottom": bottom}
    if left or right or top or bottom:
        return "resize", edges
    if inside:
        return "move", {}
    return None, {}


def padded_export_rect(rect, padding, w, h):
    x0, y0, x1, y1 = rect
    x0 = max(0, x0 - padding)
    y0 = max(0, y0 - padding)
    x1 = min(w - 1, x1 + padding)
    y1 = min(h - 1, y1 + padding)
    return x0, y0, x1 + 1, y1 + 1


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
        self.root.geometry("1050x720")

        self.img = None
        self.w = 0
        self.h = 0
        self.alpha = []
        self.labels = []
        self.boxes = {}
        self.next_id = 0
        self.selected = set()

        self.display_scale = 1.0
        self.base_photo = None
        self.base_image_item = None

        self.drag_mode = None
        self.drag_target_id = None
        self.drag_orig_rect = None
        self.drag_edges = {}
        self.drag_start_img = None
        self.temp_rect = None

        self._build_layout()

    def _build_layout(self):
        main = ttk.Frame(self.root, padding=10)
        main.pack(fill=tk.BOTH, expand=True)

        controls = ttk.Frame(main, width=300)
        controls.pack(side=tk.LEFT, fill=tk.Y, padx=(0, 10))

        ttk.Button(controls, text="Open Sprite Sheet...", command=self.open_image).pack(fill=tk.X, pady=4)
        self.status_label = ttk.Label(controls, text="No image loaded", wraplength=280)
        self.status_label.pack(fill=tk.X, pady=(0, 10))

        ttk.Separator(controls).pack(fill=tk.X, pady=8)

        self.visibility_var = tk.IntVar(value=10)
        self.separation_var = tk.IntVar(value=200)
        self.min_area_var = tk.IntVar(value=20)
        self.padding_var = tk.IntVar(value=2)

        self._add_slider(controls, "Visibility threshold", self.visibility_var, 0, 254)
        self._add_slider(controls, "Separation threshold", self.separation_var, 1, 255)
        self._add_slider(controls, "Min area (px)", self.min_area_var, 1, 500)
        self._add_slider(controls, "Padding on export (px)", self.padding_var, 0, 50)

        ttk.Separator(controls).pack(fill=tk.X, pady=8)

        ttk.Button(controls, text="Run Auto Segmentation", command=self.run_segmentation).pack(fill=tk.X, pady=4)

        ttk.Separator(controls).pack(fill=tk.X, pady=8)

        ttk.Label(controls, text="Editing").pack(fill=tk.X)
        ttk.Button(controls, text="Merge Selected", command=self.merge_selected).pack(fill=tk.X, pady=4)
        ttk.Button(controls, text="Delete Selected", command=self.delete_selected).pack(fill=tk.X, pady=4)
        ttk.Button(controls, text="Clear Selection", command=self.clear_selection).pack(fill=tk.X, pady=4)

        ttk.Separator(controls).pack(fill=tk.X, pady=8)

        ttk.Button(controls, text="Export Sprites...", command=self.export).pack(fill=tk.X, pady=4)

        self.count_label = ttk.Label(controls, text="")
        self.count_label.pack(fill=tk.X, pady=(10, 0))

        help_text = (
            "Click a box to select it, shift-click to select more. "
            "Drag inside a box to move it, drag an edge or corner to resize it. "
            "Drag on empty space to draw a new box. "
            "Delete or Backspace removes the selection."
        )
        ttk.Label(controls, text=help_text, wraplength=280, foreground="#555").pack(fill=tk.X, pady=(20, 0))

        right = ttk.Frame(main)
        right.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        self.canvas = tk.Canvas(right, background="#333333")
        self.canvas.pack(fill=tk.BOTH, expand=True)

        self.canvas.bind("<ButtonPress-1>", self.on_press)
        self.canvas.bind("<B1-Motion>", self.on_motion)
        self.canvas.bind("<ButtonRelease-1>", self.on_release)
        self.root.bind("<Delete>", lambda e: self.delete_selected())
        self.root.bind("<BackSpace>", lambda e: self.delete_selected())

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
            img = Image.open(path).convert("RGBA")
        except Exception as e:
            messagebox.showerror("Error", f"Could not open image:\n{e}")
            return

        self.img = img
        self.w, self.h = img.size
        self.alpha = list(img.getchannel("A").getdata())
        self.labels = [0] * (self.w * self.h)
        self.boxes = {}
        self.next_id = 0
        self.selected = set()

        self.status_label.config(text=f"Loaded: {os.path.basename(path)}  ({self.w}x{self.h})")
        self.count_label.config(text="")
        self._prepare_base_image()
        self.render()

    def run_segmentation(self):
        if self.img is None:
            messagebox.showwarning("No image", "Open a sprite sheet first.")
            return
        vis = self.visibility_var.get()
        sep = self.separation_var.get()
        if sep <= vis:
            messagebox.showwarning("Check thresholds", "Separation threshold should be higher than visibility threshold.")

        self.labels, count = segment_sprites(self.alpha, self.w, self.h, vis, sep, self.min_area_var.get())
        self.boxes = bboxes_from_labels(self.labels, self.w, self.h)
        self.next_id = max(self.boxes.keys()) if self.boxes else 0
        self.selected = set()
        self.count_label.config(text=f"Found {len(self.boxes)} sprite(s)")
        self.render()

    def claim(self, target_id, rect):
        vis = self.visibility_var.get()
        w, h = self.w, self.h
        for i in range(len(self.labels)):
            if self.labels[i] == target_id:
                self.labels[i] = 0
        x0, y0, x1, y1 = rect
        for y in range(y0, y1 + 1):
            row = y * w
            for x in range(x0, x1 + 1):
                i = row + x
                if self.alpha[i] > vis:
                    self.labels[i] = target_id
        self.boxes[target_id] = rect

    def merge_selected(self):
        if len(self.selected) < 2:
            messagebox.showinfo("Merge", "Select two or more boxes to merge (shift-click to multi-select).")
            return
        ids = sorted(self.selected)
        target = ids[0]
        x0 = min(self.boxes[i][0] for i in ids)
        y0 = min(self.boxes[i][1] for i in ids)
        x1 = max(self.boxes[i][2] for i in ids)
        y1 = max(self.boxes[i][3] for i in ids)
        for i in range(len(self.labels)):
            if self.labels[i] in self.selected:
                self.labels[i] = target
        for other in ids[1:]:
            del self.boxes[other]
        self.boxes[target] = [x0, y0, x1, y1]
        self.selected = {target}
        self.count_label.config(text=f"Found {len(self.boxes)} sprite(s)")
        self.render()

    def delete_selected(self):
        if not self.selected:
            return
        for i in range(len(self.labels)):
            if self.labels[i] in self.selected:
                self.labels[i] = 0
        for lbl in self.selected:
            self.boxes.pop(lbl, None)
        self.selected = set()
        self.count_label.config(text=f"Found {len(self.boxes)} sprite(s)")
        self.render()

    def clear_selection(self):
        self.selected = set()
        self.render()

    def export(self):
        if self.img is None:
            messagebox.showwarning("No image", "Open a sprite sheet first.")
            return
        if not self.boxes:
            messagebox.showwarning("No sprites", "Run auto segmentation or draw a box first.")
            return

        out_dir = filedialog.askdirectory(title="Choose output folder")
        if not out_dir:
            return

        os.makedirs(out_dir, exist_ok=True)
        padding = self.padding_var.get()
        ordered = sorted(self.boxes.items(), key=lambda kv: (kv[1][1], kv[1][0]))
        saved = []
        for idx, (label_id, rect) in enumerate(ordered, start=1):
            x0, y0, x1, y1 = padded_export_rect(rect, padding, self.w, self.h)
            crop = self.img.crop((x0, y0, x1, y1)).convert("RGBA")
            pixels = crop.load()
            cw, ch = crop.size
            for cy in range(ch):
                for cx in range(cw):
                    gx, gy = x0 + cx, y0 + cy
                    lbl = self.labels[gy * self.w + gx]
                    if lbl != 0 and lbl != label_id:
                        r, g, b, a = pixels[cx, cy]
                        pixels[cx, cy] = (r, g, b, 0)
            out_path = os.path.join(out_dir, f"sprite_{idx:03d}.png")
            crop.save(out_path)
            saved.append(out_path)

        messagebox.showinfo("Done", f"Saved {len(saved)} sprite(s) to:\n{out_dir}")

    def to_img_coords(self, cx, cy):
        s = self.display_scale
        x = int(cx / s)
        y = int(cy / s)
        x = max(0, min(x, self.w - 1))
        y = max(0, min(y, self.h - 1))
        return x, y

    def to_canvas_rect(self, rect):
        s = self.display_scale
        x0, y0, x1, y1 = rect
        return x0 * s, y0 * s, x1 * s, y1 * s

    def on_press(self, event):
        if self.img is None:
            return
        img_x, img_y = self.to_img_coords(event.x, event.y)
        shift_held = bool(event.state & 0x0001)

        hit_id = None
        mode = None
        edges = {}
        for lbl, rect in reversed(list(self.boxes.items())):
            canvas_rect = self.to_canvas_rect(rect)
            m, e = hit_test(event.x, event.y, canvas_rect)
            if m:
                hit_id = lbl
                mode = m
                edges = e
                break

        if hit_id is not None:
            if shift_held:
                if hit_id in self.selected:
                    self.selected.discard(hit_id)
                else:
                    self.selected.add(hit_id)
                self.drag_mode = None
            else:
                if hit_id not in self.selected:
                    self.selected = {hit_id}
                self.drag_mode = mode
                self.drag_target_id = hit_id
                self.drag_orig_rect = list(self.boxes[hit_id])
                self.drag_edges = edges
                self.drag_start_img = (img_x, img_y)
                self.temp_rect = list(self.boxes[hit_id])
        else:
            if not shift_held:
                self.selected = set()
            self.drag_mode = "create"
            self.drag_start_img = (img_x, img_y)
            self.temp_rect = [img_x, img_y, img_x, img_y]

        self.render()

    def on_motion(self, event):
        if self.drag_mode is None:
            return
        img_x, img_y = self.to_img_coords(event.x, event.y)

        if self.drag_mode == "create":
            x0, y0 = self.drag_start_img
            self.temp_rect = normalize_rect(x0, y0, img_x, img_y)
        elif self.drag_mode == "move":
            dx = img_x - self.drag_start_img[0]
            dy = img_y - self.drag_start_img[1]
            self.temp_rect = shift_rect(self.drag_orig_rect, dx, dy, self.w, self.h)
        elif self.drag_mode == "resize":
            self.temp_rect = resize_rect(self.drag_orig_rect, self.drag_edges, img_x, img_y, self.w, self.h)

        self.render(temp_rect=self.temp_rect)

    def on_release(self, event):
        if self.drag_mode is None:
            return

        if self.drag_mode == "create":
            rect = clamp_rect(self.temp_rect, self.w, self.h)
            if rect[2] - rect[0] >= MIN_BOX_SIZE and rect[3] - rect[1] >= MIN_BOX_SIZE:
                self.next_id += 1
                self.claim(self.next_id, rect)
                self.selected = {self.next_id}
        elif self.drag_mode in ("move", "resize"):
            rect = clamp_rect(self.temp_rect, self.w, self.h)
            self.claim(self.drag_target_id, rect)

        self.drag_mode = None
        self.drag_target_id = None
        self.drag_orig_rect = None
        self.drag_edges = {}
        self.drag_start_img = None
        self.temp_rect = None
        self.count_label.config(text=f"Found {len(self.boxes)} sprite(s)")
        self.render()

    def _prepare_base_image(self):
        w, h = self.w, self.h
        scale = min(CANVAS_MAX / w, CANVAS_MAX / h, 1.0)
        self.display_scale = scale
        dw, dh = max(1, int(w * scale)), max(1, int(h * scale))
        checker = make_checkerboard(dw, dh)
        resized = self.img.resize((dw, dh), Image.NEAREST)
        checker.paste(resized, (0, 0), resized)
        self.base_photo = ImageTk.PhotoImage(checker)

    def render(self, temp_rect=None):
        self.canvas.delete("all")
        self.canvas.create_image(0, 0, anchor="nw", image=self.base_photo)

        for lbl, rect in self.boxes.items():
            x0, y0, x1, y1 = self.to_canvas_rect(rect)
            color = "#ff8800" if lbl in self.selected else "#00ff88"
            self.canvas.create_rectangle(x0, y0, x1, y1, outline=color, width=2)

        if temp_rect is not None:
            x0, y0, x1, y1 = self.to_canvas_rect(temp_rect)
            self.canvas.create_rectangle(x0, y0, x1, y1, outline="#ffffff", width=1, dash=(4, 2))


def main():
    root = tk.Tk()
    SpriteSplitterApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
