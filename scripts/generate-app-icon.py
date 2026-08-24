from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "client" / "public"
PUBLIC.mkdir(parents=True, exist_ok=True)

S = 4
W = H = 1024
size = W * S

# Dark olive background with a restrained vertical gradient.
image = Image.new("RGB", (size, size))
pixels = image.load()
for y in range(size):
    t = y / (size - 1)
    top = (52, 73, 51)
    bottom = (20, 32, 24)
    row = tuple(round(top[i] * (1 - t) + bottom[i] * t) for i in range(3))
    for x in range(size):
        pixels[x, y] = row

d = ImageDraw.Draw(image, "RGBA")

def box(values):
    return tuple(int(v * S) for v in values)

def points(values):
    return [(int(x * S), int(y * S)) for x, y in values]

# Soft central glow.
glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
gd = ImageDraw.Draw(glow, "RGBA")
for radius in range(390, 20, -8):
    alpha = max(0, int(2.2 * (390 - radius)))
    gd.ellipse((size // 2 - radius * S, 445 * S - radius * S, size // 2 + radius * S, 445 * S + radius * S), fill=(214, 177, 93, min(alpha, 42)))
glow = glow.filter(ImageFilter.GaussianBlur(34 * S))
image = Image.alpha_composite(image.convert("RGBA"), glow)
d = ImageDraw.Draw(image, "RGBA")

# Rounded app-icon frame and inset gold keyline.
d.rounded_rectangle(box((18, 18, 1006, 1006)), radius=214 * S, outline=(214, 177, 93, 65), width=4 * S)
d.rounded_rectangle(box((43, 43, 981, 981)), radius=190 * S, outline=(214, 177, 93, 48), width=4 * S)

# Subtle lower arc.
d.arc(box((178, 480, 846, 886)), start=20, end=160, fill=(214, 177, 93, 34), width=8 * S)

# Drop shadow under the shield.
shadow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
sd = ImageDraw.Draw(shadow, "RGBA")
shield = [(512, 154), (790, 254), (790, 484), (770, 584), (730, 668), (665, 735), (592, 786), (512, 870), (432, 786), (359, 735), (294, 668), (254, 584), (234, 484), (234, 254)]
sd.polygon(points(shield), fill=(5, 12, 8, 180))
shadow = shadow.filter(ImageFilter.GaussianBlur(22 * S))
image = Image.alpha_composite(image, shadow)
d = ImageDraw.Draw(image, "RGBA")

# Shield fill with bands to simulate a rich olive gradient.
for y in range(205, 871):
    t = (y - 205) / (871 - 205)
    c1 = (91, 116, 75)
    c2 = (27, 43, 32)
    color = tuple(round(c1[i] * (1 - t) + c2[i] * t) for i in range(3)) + (255,)
    d.line([(240 * S, y * S), (784 * S, y * S)], fill=color, width=2 * S)
d.polygon(points(shield), fill=(49, 72, 50, 18))
d.line(points(shield + [shield[0]]), fill=(232, 198, 111, 255), width=20 * S, joint="curve")

inner = [(512, 205), (738, 286), (738, 479), (726, 545), (694, 616), (642, 680), (584, 727), (512, 801), (440, 727), (382, 680), (330, 616), (298, 545), (286, 479), (286, 286)]
d.line(points(inner + [inner[0]]), fill=(242, 215, 132, 72), width=7 * S, joint="curve")

# Fine shield geometry for a security/seal feel.
d.line([(512 * S, 251 * S), (512 * S, 641 * S)], fill=(242, 215, 132, 38), width=6 * S)
d.line([(321 * S, 444 * S), (703 * S, 444 * S)], fill=(242, 215, 132, 38), width=6 * S)

# Gold eight-point compass/star mark.
star = [(512, 251), (543, 366), (627, 368), (561, 421), (583, 503), (512, 457), (441, 503), (463, 421), (397, 368), (481, 366)]
d.polygon(points(star), fill=(244, 217, 132, 245))
d.line(points(star + [star[0]]), fill=(255, 235, 164, 190), width=3 * S, joint="curve")

# Center lock: clear and recognizable at small sizes.
d.rounded_rectangle(box((420, 504, 604, 647)), radius=28 * S, fill=(19, 31, 23, 255), outline=(214, 177, 93, 255), width=14 * S)
d.arc(box((459, 370, 565, 556)), start=180, end=360, fill=(226, 190, 99, 255), width=18 * S)
d.line([(459 * S, 463 * S), (459 * S, 504 * S)], fill=(226, 190, 99, 255), width=18 * S)
d.line([(565 * S, 463 * S), (565 * S, 504 * S)], fill=(226, 190, 99, 255), width=18 * S)
d.ellipse(box((496, 549, 528, 581)), fill=(244, 217, 132, 255))
d.line([(512 * S, 581 * S), (512 * S, 615 * S)], fill=(244, 217, 132, 255), width=14 * S)

# Small gold anchors keep the mark balanced in a maskable icon.
d.ellipse(box((502, 101, 522, 121)), fill=(214, 177, 93, 210))
d.ellipse(box((502, 903, 522, 923)), fill=(214, 177, 93, 125))

# Downsample once for clean anti-aliased edges.
image = image.convert("RGB")
icon_512 = image.resize((512, 512), Image.Resampling.LANCZOS)
icon_192 = image.resize((192, 192), Image.Resampling.LANCZOS)
icon_512.save(PUBLIC / "icon-512.png", format="PNG", optimize=True)
icon_192.save(PUBLIC / "icon.png", format="PNG", optimize=True)
print(f"created {PUBLIC / 'icon.png'} ({icon_192.size})")
print(f"created {PUBLIC / 'icon-512.png'} ({icon_512.size})")
