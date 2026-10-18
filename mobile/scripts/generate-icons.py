"""Gera icon, splash e favicon a partir da geometria da marca (components/brand-mark.tsx).

Uso: python scripts/generate-icons.py assets/images   (requer: pip install pillow)
Se mudar o desenho em brand-mark.tsx, atualize MUSCLE/FIBERS/CHART aqui também.
"""
from PIL import Image, ImageDraw, ImageFilter
import sys
OUT = sys.argv[1]
BG=(5,6,7); LIME=(180,247,42); CYAN=(39,217,232)
SS=4

def bez(p0,p1,p2,p3,n=40):
    pts=[]
    for i in range(n+1):
        t=i/n; u=1-t
        pts.append((u**3*p0[0]+3*u*u*t*p1[0]+3*u*t*t*p2[0]+t**3*p3[0],
                    u**3*p0[1]+3*u*u*t*p1[1]+3*u*t*t*p2[1]+t**3*p3[1]))
    return pts

muscle = bez((15,3),(1,19),(1,45),(15,61)) + bez((15,61),(27,45),(27,19),(15,3))
fibers = [bez((12,13),(8,26),(8,40),(12,52)), bez((17,16),(15,28),(15,40),(16,50))]
chart = [(18,47),(27,39),(32,43),(40,31),(48,24),(54,12)]

def render(px, scale, glow=True):
    """Marca centrada em um canvas px x px; scale = fração do canvas ocupada pela marca."""
    big = px*SS
    k = big*scale/64.0
    off = (big - 64*k)/2
    def T(p): return (off+p[0]*k, off+p[1]*k)
    def Tm(p): return (off+(64-p[0])*k, off+p[1]*k)
    layer = Image.new("RGBA",(big,big),(0,0,0,0))
    d = ImageDraw.Draw(layer)
    for f in (T,Tm):
        d.polygon([f(p) for p in muscle], fill=LIME+(255,))
        for fl in fibers:
            d.line([f(p) for p in fl], fill=BG+(140,), width=max(1,int(1.3*k)), joint="curve")
    d.line([T(p) for p in chart], fill=BG+(255,), width=int(4.6*k), joint="curve")
    for a,b in zip(chart,chart[1:]):
        for p in (a,b):
            x,y=T(p); r=2.3*k; d.ellipse((x-r,y-r,x+r,y+r), fill=BG+(255,))
    d.line([T(p) for p in chart], fill=CYAN+(255,), width=int(2.6*k), joint="curve")
    for p in chart[1:-1]:
        if p in ((27,39),(40,31)):
            x,y=T(p); r=2.9*k; d.ellipse((x-r,y-r,x+r,y+r), fill=BG+(255,), outline=CYAN+(255,), width=int(1.6*k))
    x,y=T(chart[-1]); r=3.2*k; d.ellipse((x-r,y-r,x+r,y+r), fill=CYAN+(255,))
    base = Image.new("RGBA",(big,big),BG+(255,))
    if glow:
        g = layer.filter(ImageFilter.GaussianBlur(big*0.018))
        a = g.split()[3].point(lambda v: int(v*0.55))
        g.putalpha(a)
        base = Image.alpha_composite(base,g)
    base = Image.alpha_composite(base,layer)
    return base.resize((px,px), Image.LANCZOS).convert("RGB")

render(1024,0.62).save(f"{OUT}/icon.png")
render(1024,0.46).save(f"{OUT}/splash-icon.png")
render(1024,0.42).save(f"{OUT}/android-icon-foreground.png")
render(256,0.82,glow=False).save(f"{OUT}/favicon.png")
print("ok")
