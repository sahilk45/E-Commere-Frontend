import os, zipfile, tempfile, json
import numpy as np

PROD_DIR = os.path.dirname(os.path.abspath(__file__))
gru_path = os.path.join(PROD_DIR, "gru_embedding_extractor.keras")

tmpdir = tempfile.mkdtemp()
with zipfile.ZipFile(gru_path, "r") as z:
    z.extractall(tmpdir)
    print("Files in .keras ZIP:", z.namelist())

# Read config
with open(os.path.join(tmpdir, "config.json")) as f:
    cfg = json.load(f)
print("\n--- config.json (top-level keys):", list(cfg.keys()))
print(json.dumps(cfg, indent=2)[:3000])

# Inspect weights h5
import h5py
wpath = os.path.join(tmpdir, "model.weights.h5")
print("\n--- Weights file structure ---")
def print_h5(f, prefix=""):
    for k in f.keys():
        item = f[k]
        if isinstance(item, h5py.Dataset):
            print(f"{prefix}{k}: shape={item.shape}, dtype={item.dtype}")
        else:
            print(f"{prefix}{k}/")
            print_h5(item, prefix + "  ")

with h5py.File(wpath, "r") as wf:
    print_h5(wf)
