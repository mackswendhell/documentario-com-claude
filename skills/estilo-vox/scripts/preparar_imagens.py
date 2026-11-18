"""Prepara as imagens e as texturas do estilo VOX.

Duas entradas:

  # a partir de um vídeo, um quadro por cena (segundos na ordem das cenas)
  python preparar_imagens.py --projeto ../remotion --video base.mp4 --tempos "3.5,11,19,27"

  # a partir de uma pasta de fotos reais (ordem alfabética)
  python preparar_imagens.py --projeto ../remotion --pasta referencias/

Gera:
  public/img/iNN.jpg        imagem como entrou
  public/imgp/iNN_s.jpg     sépia (usada por padrão nas fotos)
  public/imgp/iNN_b.jpg     preto e branco (cenas de "evidencia")
  src/data/assets.json      largura, altura e razão de aspecto de cada imagem
  public/voxp/*.jpg         texturas de papel tratadas (a partir de public/vox)
"""
import argparse, glob, json, os, subprocess
import numpy as np
from PIL import Image, ImageEnhance

rng = np.random.default_rng(3)


def sepia(im, k=0.40):
    a = np.asarray(im).astype(np.float32)
    gray = a @ np.array([0.299, 0.587, 0.114], dtype=np.float32)
    sep = np.stack([gray * 1.07, gray * 0.94, gray * 0.74], axis=-1)
    return Image.fromarray(np.clip(a * (1 - k) + sep * k, 0, 255).astype(np.uint8))


def grain(im, amount=3):
    a = np.asarray(im).astype(np.float32)
    n = rng.normal(0, amount, a.shape[:2])[..., None]
    return Image.fromarray(np.clip(a + n, 0, 255).astype(np.uint8))


def vignette(im, strength=0.55):
    w, h = im.size
    y, x = np.ogrid[:h, :w]
    r = np.sqrt(((x - w / 2) / (w * 0.62)) ** 2 + ((y - h / 2) / (h * 0.62)) ** 2)
    m = np.clip(1 - strength * np.clip(r - 0.55, 0, 2) ** 1.4, 0.25, 1)
    a = np.asarray(im).astype(np.float32) * m[..., None]
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


def preparar_texturas(base):
    src, dst = os.path.join(base, "vox"), os.path.join(base, "voxp")
    os.makedirs(dst, exist_ok=True)
    n = 0
    for f in sorted(glob.glob(os.path.join(src, "*.jpg"))):
        im = Image.open(f).convert("RGB")
        im = ImageEnhance.Contrast(ImageEnhance.Brightness(sepia(im, 0.38)).enhance(0.9)).enhance(1.06)
        im = grain(vignette(im, 0.55), 5)
        im.save(os.path.join(dst, os.path.basename(f)), quality=88, optimize=True)
        n += 1
    return n


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--projeto", default=".", help="pasta do projeto Remotion (com src/ e public/)")
    ap.add_argument("--video", help="vídeo de onde extrair um quadro por cena")
    ap.add_argument("--tempos", help="segundos separados por vírgula, na ordem das cenas")
    ap.add_argument("--pasta", help="pasta com fotos reais (ordem alfabética)")
    args = ap.parse_args()

    public = os.path.join(args.projeto, "public")
    img = os.path.join(public, "img")
    imgp = os.path.join(public, "imgp")
    os.makedirs(img, exist_ok=True)
    os.makedirs(imgp, exist_ok=True)

    if args.video and args.tempos:
        tempos = [float(t) for t in args.tempos.replace(";", ",").split(",") if t.strip()]
        fontes = []
        for i, t in enumerate(tempos):
            out = os.path.join(img, f"i{i:02d}.jpg")
            subprocess.run(["ffmpeg", "-y", "-v", "error", "-ss", f"{t:.2f}", "-i", args.video,
                            "-frames:v", "1", "-q:v", "2", out], check=True)
            fontes.append(out)
    elif args.pasta:
        arquivos = sorted([p for p in glob.glob(os.path.join(args.pasta, "*"))
                           if p.lower().endswith((".jpg", ".jpeg", ".png", ".webp"))])
        fontes = []
        for i, p in enumerate(arquivos):
            out = os.path.join(img, f"i{i:02d}.jpg")
            Image.open(p).convert("RGB").save(out, quality=92)
            fontes.append(out)
    else:
        raise SystemExit("use --video + --tempos ou --pasta")

    assets = {}
    antigo = os.path.join(args.projeto, "src", "data", "assets.json")
    if os.path.exists(antigo):
        try:
            assets = {k: v for k, v in json.load(open(antigo, encoding="utf-8")).items() if k.startswith("v")}
        except Exception:
            assets = {}

    for i, f in enumerate(fontes):
        iid = f"i{i:02d}"
        im = Image.open(f).convert("RGB")
        assets[iid] = {"w": im.width, "h": im.height, "a": round(im.width / im.height, 4)}
        s = ImageEnhance.Contrast(sepia(im, 0.40)).enhance(1.06)
        grain(ImageEnhance.Brightness(s).enhance(0.98), 3).save(os.path.join(imgp, iid + "_s.jpg"), quality=90, optimize=True)
        b = ImageEnhance.Contrast(im.convert("L")).enhance(1.12)
        grain(ImageEnhance.Brightness(b.convert("RGB")).enhance(0.96), 3).save(os.path.join(imgp, iid + "_b.jpg"), quality=90, optimize=True)

    os.makedirs(os.path.dirname(antigo), exist_ok=True)
    json.dump(assets, open(antigo, "w", encoding="utf-8"), indent=1)
    tex = preparar_texturas(public)
    print(f"imagens: {len(fontes)} | texturas tratadas: {tex} | assets.json com {len(assets)} entradas")


if __name__ == "__main__":
    main()
