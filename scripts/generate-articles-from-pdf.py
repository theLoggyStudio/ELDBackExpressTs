#!/usr/bin/env python3
"""Génère / fusionne ELDVente article.json depuis un PDF catalogue."""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_PDF_PATH = ROOT / "LISTE DES LOGICIELS DISPONIBLE.pdf"
OUT_PATH = ROOT / "ELDVente" / "src" / "constants" / "json" / "article.json"
BACKUP_PATH = ROOT / "ELDBack" / "src" / "constants" / "json" / "article.json"
ELLADARIE_DEFAULT_LOGO = "/logo.png"
LINK_RE = re.compile(
    r"(https://(?:drive\.google\.com|youtu\.be|www\.youtube\.com|youtube\.com)/[^\s]+)",
    re.I,
)

DEFAULT_TEL = "+221708984443"
ELEMENTS_SANS = [
    "Téléchargement du logiciel",
    "Pas d'assistance à l'installation",
]
ELEMENTS_AVEC = [
    "Téléchargement du logiciel",
    "Assistance téléphonique pour installation du logiciel",
]

NOM_CANON: dict[str, str] = {
    "3ds max": "3ds Max",
    "autocad": "AutoCAD",
    "auto.elec": "AutoCAD Electrical",
    "auto sd": "AutoCAD Structural Detailing",
    "archicad": "ArchiCAD",
    "revit": "Revit",
    "covadis": "Covadis",
    "enscape": "Enscape",
    "graitec": "Graitec OMD",
    "office et msproject": "Office et MS Project",
    "office + msproject": "Office et MS Project",
    "office + ms project": "Office et MS Project",
    "rhino": "Rhino",
    "robot ddc/mil": "Robot DDC / Millennium",
    "rsa": "Robot Structural Analysis",
    "illustrator": "Adobe Illustrator",
    "dialux": "Dialux",
    "artlantis": "Artlantis",
    "arlantis": "Artlantis",
    "alize lpc": "Alizé LPC",
    "allplan": "Allplan",
    "civil 3d": "Civil 3D",
    "davinci": "DaVinci Resolve",
    "blender": "Blender",
    "cadwox": "Cadwork",
    "cbs/rsa": "CBS / RSA",
    "csi.bridge": "CSI Bridge",
    "cype": "CYPE",
    "cypecad": "CYPECAD",
    "digsilent powerfactory": "DIgSILENT PowerFactory",
    "eplan electric p8": "EPLAN Electric P8",
    "etap": "ETAP",
    "schemaplic": "Schemaplic",
    "global mapper": "Global Mapper",
    "homer pro": "Homer Pro",
    "pronest": "ProNest",
    "lumion pro": "Lumion",
    "cinema 4d": "Cinema 4D",
    "mechanical": "AutoCAD Mechanical",
    "mensura": "Mensura",
    "pdf creator": "PDF Creator",
    "photoshop": "Adobe Photoshop",
    "premiere pro": "Adobe Premiere Pro",
    "pvsyst": "PVsyst",
    "qoter plan": "Qoter Plan",
    "sketchup": "SketchUp",
    "solidworks": "SolidWorks",
    "tekla struc": "Tekla Structures",
    "autofluid": "AutoFLUID",
    "twinmotion": "Twinmotion",
    "vray": "V-Ray",
}

CATEGORY: dict[str, str] = {
    "3ds max": "Modélisation 3D",
    "autocad": "CAO 2D/3D",
    "auto.elec": "Schémas électriques & automatisme",
    "auto sd": "Calcul structurel",
    "archicad": "BIM : conception architecturale",
    "revit": "Architecture BIM",
    "covadis": "Topographie & VRD",
    "enscape": "Rendu temps réel",
    "graitec": "Métallerie & charpente",
    "office et msproject": "Bureautique & gestion de projet",
    "rhino": "Modélisation 3D",
    "robot ddc/mil": "Calcul structurel",
    "rsa": "Calcul structurel",
    "illustrator": "PAO",
    "dialux": "Éclairage technique",
    "artlantis": "Visualisation architecturale",
    "arlantis": "Visualisation architecturale",
    "alize lpc": "Calcul structure bois",
    "allplan": "BIM : conception architecturale",
    "civil 3d": "Génie civil & VRD",
    "davinci": "Montage vidéo",
    "blender": "Modélisation 3D",
    "cadwox": "BIM charpente bois",
    "cbs/rsa": "Calcul structurel",
    "csi.bridge": "Ponts & ouvrages d'art",
    "cype": "Calcul structure & BIM",
    "cypecad": "Calcul structure & BIM",
    "digsilent powerfactory": "Réseaux électriques",
    "eplan electric p8": "Schémas électriques & automatisme",
    "etap": "Réseaux électriques",
    "office + msproject": "Bureautique & gestion de projet",
    "office + ms project": "Bureautique & gestion de projet",
    "schemaplic": "Schémas électriques",
    "global mapper": "Cartographie & SIG",
    "homer pro": "Énergie solaire",
    "pronest": "Découpe & chaudronnerie",
    "lumion pro": "Visualisation architecturale",
    "cinema 4d": "Modélisation 3D",
    "mechanical": "CAO mécanique",
    "mensura": "Métré & estimation",
    "pdf creator": "Utilitaire PDF",
    "photoshop": "PAO",
    "premiere pro": "Montage vidéo",
    "pvsyst": "Énergie solaire",
    "qoter plan": "Plans & métré",
    "sketchup": "Modélisation 3D",
    "solidworks": "CAO mécanique",
    "tekla struc": "Ingénierie structure BIM",
    "autofluid": "Fluides & CVC",
    "twinmotion": "Visualisation architecturale",
    "vray": "Rendu 3D",
}

SITE_URL: dict[str, str] = {
    "3ds max": "https://www.autodesk.com/products/3ds-max",
    "autocad": "https://www.autodesk.com/products/autocad",
    "auto.elec": "https://www.autodesk.com/products/autocad-electrical",
    "auto sd": "https://www.autodesk.com",
    "archicad": "https://graphisoft.com",
    "revit": "https://www.autodesk.com/products/revit",
    "covadis": "https://www.covadis.fr",
    "enscape": "https://enscape3d.com",
    "graitec": "https://www.graitec.com",
    "office et msproject": "https://www.microsoft.com",
    "rhino": "https://www.rhino3d.com",
    "robot ddc/mil": "https://www.autodesk.com",
    "rsa": "https://www.autodesk.com/products/robot-structural-analysis",
    "illustrator": "https://www.adobe.com/products/illustrator.html",
    "dialux": "https://www.dial.de",
    "artlantis": "https://artlantis.com",
    "arlantis": "https://artlantis.com",
    "alize lpc": "https://www.bois.com",
    "allplan": "https://www.allplan.com",
    "civil 3d": "https://www.autodesk.com/products/civil-3d",
    "davinci": "https://www.blackmagicdesign.com/products/davinciresolve",
    "blender": "https://www.blender.org",
    "cadwox": "https://www.cadwork.com",
    "cbs/rsa": "https://www.autodesk.com",
    "csi.bridge": "https://www.csiamerica.com",
    "cype": "https://www.cype.com",
    "cypecad": "https://www.cype.com",
    "digsilent powerfactory": "https://www.digsilent.de",
    "eplan electric p8": "https://www.eplan.de",
    "etap": "https://etap.com",
    "office + msproject": "https://www.microsoft.com",
    "office + ms project": "https://www.microsoft.com",
    "schemaplic": "https://www.schemaplic.com",
    "global mapper": "https://www.bluemarblegeo.com",
    "homer pro": "https://www.homerenergy.com",
    "pronest": "https://www.hypertherm.com",
    "lumion pro": "https://lumion.com",
    "cinema 4d": "https://www.maxon.net",
    "mechanical": "https://www.autodesk.com/products/autocad-mechanical",
    "mensura": "https://www.mensura.be",
    "pdf creator": "https://www.pdfforge.org",
    "photoshop": "https://www.adobe.com/products/photoshop.html",
    "premiere pro": "https://www.adobe.com/products/premiere.html",
    "pvsyst": "https://www.pvsyst.com",
    "qoter plan": "https://www.qoter.com",
    "sketchup": "https://www.sketchup.com",
    "solidworks": "https://www.solidworks.com",
    "tekla struc": "https://www.tekla.com",
    "autofluid": "https://www.autofluid.com",
    "twinmotion": "https://www.twinmotion.com",
    "vray": "https://www.chaos.com/vray",
}

WM_COMMONS = "https://upload.wikimedia.org/wikipedia/commons"
WM_EN = "https://upload.wikimedia.org/wikipedia/en"


def _favicon(domain: str) -> str:
    return (
        "https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON"
        f"&fallback_opts=TYPE,SIZE,URL&url=https://{domain}&size=128"
    )


IMAGE_URL: dict[str, str] = {
    # Logos officiels via Wikimedia
    "archicad": f"{WM_COMMONS}/3/32/Graphisoft_Archicad_Logo.svg",
    "autocad": f"{WM_COMMONS}/0/08/AutoCad_logo.svg",
    "auto.elec": f"{WM_COMMONS}/d/db/Autodesk_AutoCAD_Logo.svg",
    "mechanical": f"{WM_COMMONS}/d/db/Autodesk_AutoCAD_Logo.svg",
    "auto sd": f"{WM_COMMONS}/d/db/Autodesk_AutoCAD_Logo.svg",
    "3ds max": f"{WM_COMMONS}/b/ba/Autodesk_3ds_Max_Logo.svg",
    "revit": f"{WM_COMMONS}/c/c6/Autodesk_Revit_Logo.svg",
    "allplan": f"{WM_COMMONS}/0/0a/Allplan_Logo.png",
    "cadwox": f"{WM_COMMONS}/a/ae/Cadwork_logo.jpg",
    "cinema 4d": f"{WM_COMMONS}/0/04/Cinema_4D_Logo_2026.svg",
    "csi.bridge": f"{WM_EN}/8/83/Fair_use_image_of_CSI_circular_logo.PNG",
    "eplan electric p8": f"{WM_COMMONS}/7/76/Eplan-logo.svg",
    "office + msproject": f"{WM_EN}/3/35/Microsoft_Office_Logo_%282019-present%29.svg",
    "office + ms project": f"{WM_EN}/3/35/Microsoft_Office_Logo_%282019-present%29.svg",
    "pdf creator": f"{WM_COMMONS}/0/08/PDFCreator_logo.svg",
    "rhino": f"{WM_EN}/d/d0/Rhinoceros3d-logo.png",
    "sketchup": f"{WM_COMMONS}/b/ba/Brand_Wordmark_for_SketchUp.png",
    "solidworks": f"{WM_COMMONS}/b/bf/SOLIDWORKS_Logo.svg",
    "tekla struc": f"{WM_COMMONS}/8/81/Tekla_Structures_Logo_2026.svg",
    "vray": f"{WM_COMMONS}/5/55/V-Ray_Logo_1.jpg",
    "dialux": f"{WM_COMMONS}/a/a2/Dx_Logo.svg",
    "enscape": f"{WM_COMMONS}/1/18/Enscape-logo-color-black-rgb.svg",
    # Icônes officielles des sites éditeurs
    "lumion pro": _favicon("lumion.com"),
    "twinmotion": _favicon("twinmotion.com"),
    "global mapper": _favicon("bluemarblegeo.com"),
    "graitec": _favicon("graitec.com"),
    "pvsyst": _favicon("pvsyst.com"),
    "etap": _favicon("etap.com"),
    "digsilent powerfactory": _favicon("digsilent.de"),
    "artlantis": _favicon("artlantis.com"),
    "arlantis": _favicon("artlantis.com"),
    "homer pro": _favicon("homerenergy.com"),
    "pronest": _favicon("hypertherm.com"),
    "cype": _favicon("cype.com"),
    "cypecad": _favicon("cype.com"),
    "covadis": _favicon("geo-media.com"),
    "mensura": _favicon("geomensura.com"),
    "autofluid": _favicon("autofluid.fr"),
    "schemaplic": _favicon("schemaplic.fr"),
    "alize lpc": _favicon("alize-lpc.com"),
    "qoter plan": _favicon("quoterplan.com"),
    # Produits Autodesk sans logo dédié → logo EllaDarie (chaîne vide)
    "robot ddc/mil": "",
    "rsa": "",
    "cbs/rsa": "",
    "civil 3d": "",
}

PRIX: dict[str, int] = {}


def norm_key(nom: str) -> str:
    return re.sub(r"\s+", " ", nom.strip().lower())


def parse_pdf_entries(pdf_path: Path) -> list[dict[str, str]]:
    reader = PdfReader(str(pdf_path))
    text = "\n".join((page.extract_text() or "") for page in reader.pages)
    text = re.sub(r"\s+", " ", text)
    parts = LINK_RE.split(text)
    entries: list[dict[str, str]] = []
    i = 1
    while i < len(parts):
        before = parts[i - 1].strip()
        url = parts[i].strip().rstrip(".,;)")
        i += 2
        if not url.lower().startswith("http"):
            continue
        before = re.sub(r"^.*LIEN DE TELECHARGEMENT\s*", "", before, flags=re.I).strip(" |")
        if not before:
            continue
        tokens = before.split()
        version = ""
        if len(tokens) >= 2 and re.match(r"^\d{4}$", tokens[-1]) and re.match(r"^\d{4}$", tokens[-2]):
            version = f"{tokens[-2]}-{tokens[-1]}"
            tokens = tokens[:-2]
        elif tokens:
            cand = tokens[-1]
            if re.match(r"^V?\d+(?:[._]\d+)*$", cand, re.I) or re.match(r"^\d{4}$", cand):
                version = tokens.pop()
        nom = re.sub(r"\s+", " ", " ".join(tokens)).strip()
        if not nom:
            continue
        entries.append({"nom": nom, "version": version, "urlDrive": url})
    return entries


def build_article(raw: dict[str, str]) -> dict:
    key = norm_key(raw["nom"])
    nom = NOM_CANON.get(key, raw["nom"].strip())
    version = raw["version"].strip()
    version_label = f" {version}" if version else ""
    prix = PRIX.get(key, 4000)
    prix_assist = 6000
    image = IMAGE_URL.get(key, ELLADARIE_DEFAULT_LOGO)
    desc = f"Licence {nom}{version_label} : livraison numérique."
    return {
        "urlImage": image,
        "nom": nom,
        "version": version,
        "categorie": CATEGORY.get(key, "Logiciel professionnel"),
        "URL": SITE_URL.get(key, "https://www.autodesk.com"),
        "urlDrive": raw["urlDrive"],
        "prix": prix,
        "description": desc,
        "descriptionAvecAssistace": desc,
        "prixAvecAssistace": prix_assist,
        "tel": DEFAULT_TEL,
        "elementsSansAssistance": ELEMENTS_SANS,
        "elementsAvecAssistance": ELEMENTS_AVEC,
    }


def article_key(article: dict) -> tuple[str, str]:
    return (
        str(article.get("nom", "")).strip().lower(),
        str(article.get("version", "")).strip().lower(),
    )


def merge_articles(existing: list[dict], incoming: list[dict]) -> tuple[list[dict], int, int]:
    by_key = {article_key(item): dict(item) for item in existing}
    created = 0
    updated = 0
    for item in incoming:
        key = article_key(item)
        if key in by_key:
            merged = {**by_key[key], **item}
            by_key[key] = merged
            updated += 1
        else:
            by_key[key] = item
            created += 1
    merged_list = list(by_key.values())
    merged_list.sort(
        key=lambda a: (
            str(a.get("nom", "")).lower(),
            str(a.get("version", "")).lower(),
        )
    )
    return merged_list, created, updated


def main() -> None:
    parser = argparse.ArgumentParser(description="Importe les articles depuis un PDF catalogue.")
    parser.add_argument(
        "pdf",
        nargs="?",
        default=str(DEFAULT_PDF_PATH),
        help="Chemin du PDF (défaut: LISTE DES LOGICIELS DISPONIBLE.pdf à la racine du repo)",
    )
    parser.add_argument(
        "--replace",
        action="store_true",
        help="Remplace entièrement article.json (sinon fusionne par nom+version)",
    )
    args = parser.parse_args()

    pdf_path = Path(args.pdf).expanduser().resolve()
    if not pdf_path.is_file():
        raise SystemExit(f"PDF introuvable: {pdf_path}")

    incoming = [build_article(entry) for entry in parse_pdf_entries(pdf_path)]
    if not incoming:
        raise SystemExit(f"Aucun article détecté dans {pdf_path}")

    # BACKUP_PATH (ELDBack) est la référence complète : la copie front est expurgée d'urlDrive.
    if args.replace or not BACKUP_PATH.is_file():
        articles = incoming
        created, updated = len(articles), 0
        mode = "remplacement"
    else:
        existing = json.loads(BACKUP_PATH.read_text(encoding="utf-8"))
        if not isinstance(existing, list):
            raise SystemExit(f"Format invalide dans {BACKUP_PATH}")
        articles, created, updated = merge_articles(existing, incoming)
        mode = "fusion"

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    BACKUP_PATH.parent.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(articles, ensure_ascii=False, indent=2)
    # Version publique (bundlée dans le front) : jamais d'urlDrive pour ne pas exposer les liens.
    public_articles = [{k: v for k, v in a.items() if k != "urlDrive"} for a in articles]
    public_payload = json.dumps(public_articles, ensure_ascii=False, indent=2)
    OUT_PATH.write_text(public_payload + "\n", encoding="utf-8")
    BACKUP_PATH.write_text(payload + "\n", encoding="utf-8")
    print(
        f"{mode.capitalize()} : {len(incoming)} lus depuis le PDF -> "
        f"{created} ajoute(s), {updated} mis a jour, {len(articles)} au total -> {OUT_PATH}"
    )


if __name__ == "__main__":
    main()
