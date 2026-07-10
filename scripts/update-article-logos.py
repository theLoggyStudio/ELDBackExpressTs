#!/usr/bin/env python3
"""Met à jour urlImage des articles avec des logos officiels (Wikimedia / favicon éditeur)."""
from __future__ import annotations

import json
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parents[2]
ELLADARIE_DEFAULT_LOGO = "/logo.png"
ARTICLE_PATHS = [
    ROOT / "ELDVente" / "src" / "constants" / "json" / "article.json",
    ROOT / "ELDBack" / "src" / "constants" / "json" / "article.json",
]


def favicon(site: str, size: int = 256) -> str:
    return (
        "https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON"
        f"&fallback_opts=TYPE,SIZE,URL&url={quote(site, safe='')}&size={size}"
    )


# Logos par nom canonique (SVG Wikimedia ou favicon haute résolution du site éditeur)
LOGOS_BY_NOM: dict[str, str] = {
    "3ds Max": favicon("https://www.autodesk.com/products/3ds-max"),
    "AutoCAD": "https://upload.wikimedia.org/wikipedia/commons/0/08/AutoCad_logo.svg",
    "AutoCAD Electrical": favicon("https://www.autodesk.com/products/autocad-electrical"),
    "AutoCAD Mechanical": favicon("https://www.autodesk.com/products/autocad-mechanical"),
    "AutoCAD Structural Detailing": favicon("https://www.autodesk.com"),
    "Revit": favicon("https://www.autodesk.com/products/revit"),
    "Civil 3D": favicon("https://www.autodesk.com/products/civil-3d"),
    "ArchiCAD": favicon("https://graphisoft.com"),
    "SketchUp": favicon("https://www.sketchup.com"),
    "Rhino": favicon("https://www.rhino3d.com"),
    "Blender": "https://upload.wikimedia.org/wikipedia/commons/0/0c/Blender_logo_no_text.svg",
    "SolidWorks": favicon("https://www.solidworks.com"),
    "Enscape": "https://upload.wikimedia.org/wikipedia/commons/1/18/Enscape-logo-color-black-rgb.svg",
    "Dialux": "https://upload.wikimedia.org/wikipedia/commons/a/a2/Dx_Logo.svg",
    "Lumion": favicon("https://lumion.com"),
    "Graitec OMD": favicon("https://www.graitec.com"),
    "Covadis": favicon("https://www.covadis.fr"),
    "Robot Structural Analysis": (
        "https://damassets.autodesk.net/content/dam/autodesk/www/products/"
        "responsive-imagery/responsive-badges-free-trial/2017/"
        "robot-structural-analysis-professional-badge-150x150.png"
    ),
    "Robot DDC / Millennium": favicon("https://www.autodesk.com/products/robot-structural-analysis"),
    "CBS / RSA": favicon("https://www.autodesk.com/products/robot-structural-analysis"),
    "Adobe Photoshop": "https://upload.wikimedia.org/wikipedia/commons/a/af/Adobe_Photoshop_CC_icon.svg",
    "Adobe Illustrator": "https://upload.wikimedia.org/wikipedia/commons/f/fb/Adobe_Illustrator_CC_icon.svg",
    "Adobe Premiere Pro": "https://upload.wikimedia.org/wikipedia/commons/4/40/Adobe_Premiere_Pro_CC_icon.svg",
    "Office et MS Project": favicon("https://www.microsoft.com/microsoft-365"),
    "DaVinci Resolve": "https://upload.wikimedia.org/wikipedia/commons/9/90/DaVinci_Resolve_17_logo.svg",
    "Cinema 4D": favicon("https://www.maxon.net/en/cinema-4d"),
    "V-Ray": favicon("https://www.chaos.com/vray"),
    "Twinmotion": favicon("https://www.twinmotion.com"),
    "Tekla Structures": favicon("https://www.tekla.com"),
    "CYPE": favicon("https://www.cype.com"),
    "Allplan": favicon("https://www.allplan.com"),
    "Artlantis": favicon("https://artlantis.com"),
    "Alizé LPC": favicon("https://www.bois.com"),
    "Cadwork": favicon("https://www.cadwork.com"),
    "CSI Bridge": favicon("https://www.csiamerica.com"),
    "Schemaplic": favicon("https://www.schemaplic.com"),
    "Global Mapper": favicon("https://www.bluemarblegeo.com"),
    "Homer Pro": favicon("https://www.homerenergy.com"),
    "ProNest": favicon("https://www.hypertherm.com"),
    "Mensura": favicon("https://www.mensura.be"),
    "PDF Creator": favicon("https://www.pdfforge.org"),
    "PVsyst": favicon("https://www.pvsyst.com"),
    "Qoter Plan": favicon("https://www.qoter.com"),
    "AutoFLUID": favicon("https://www.autofluid.com"),
}


def resolve_logo(article: dict) -> str:
    nom = str(article.get("nom", "")).strip()
    if nom in LOGOS_BY_NOM:
        return LOGOS_BY_NOM[nom]
    site = str(article.get("URL", "")).strip()
    if site:
        return favicon(site)
    return ELLADARIE_DEFAULT_LOGO


def main() -> None:
    source = ARTICLE_PATHS[0]
    articles = json.loads(source.read_text(encoding="utf-8"))
    updated = 0
    for article in articles:
        logo = resolve_logo(article)
        if article.get("urlImage") != logo:
            article["urlImage"] = logo
            updated += 1
    payload = json.dumps(articles, ensure_ascii=False, indent=2) + "\n"
    for path in ARTICLE_PATHS:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(payload, encoding="utf-8")
    print(f"Logos mis a jour: {updated}/{len(articles)} articles")


if __name__ == "__main__":
    main()
