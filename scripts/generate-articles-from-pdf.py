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

IMAGE_URL: dict[str, str] = {
    "archicad": "https://i.pinimg.com/736x/78/79/1f/78791f95f5a7fff8fafd132e3b3adc8c.jpg",
    "autocad": "https://i.pinimg.com/originals/58/6b/be/586bbe06de2d9896b8ef4dda71caa13c.png",
    "auto.elec": "https://rochasoftwares.com/wp-content/uploads/2023/04/autocad-electrical-2024.png",
    "revit": "https://th.bing.com/th/id/OIP.q_gCvE7EFU2Gp8OZNiEfQwHaHa?o=7rm=3&rs=1&pid=ImgDetMain&o=7&rm=3",
    "sketchup": "https://i.pinimg.com/1200x/0d/9c/14/0d9c147ce693bb180b9c7f0ed378516e.jpg",
    "graitec": "https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://www.graitec.com/&size=256",
    "robot ddc/mil": "https://tse3.mm.bing.net/th/id/OIP.ptyDuSX49cOEjauswiqM3QAAAA?w=300&h=225&rs=1&pid=ImgDetMain&o=7&rm=3",
    "rsa": "https://damassets.autodesk.net/content/dam/autodesk/www/products/responsive-imagery/responsive-badges-free-trial/2017/robot-structural-analysis-professional-badge-150x150.png",
    "dialux": "https://upload.wikimedia.org/wikipedia/commons/a/a2/Dx_Logo.svg",
    "covadis": "https://th.bing.com/th/id/OIP.VwFXGi5mBquqySoHk-LWAAHaFd?o=7rm=3&rs=1&pid=ImgDetMain&o=7&rm=3",
    "lumion pro": "https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://lumion.com/&size=256",
    "enscape": "https://upload.wikimedia.org/wikipedia/commons/1/18/Enscape-logo-color-black-rgb.svg",
    "cypecad": "https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https%3A%2F%2Fwww.cype.com&size=256",
    "digsilent powerfactory": "https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https%3A%2F%2Fwww.digsilent.de&size=256",
    "eplan electric p8": "https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https%3A%2F%2Fwww.eplan.de&size=256",
    "etap": "https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https%3A%2F%2Fetap.com&size=256",
    "office + msproject": "https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https%3A%2F%2Fwww.microsoft.com%2Fmicrosoft-365&size=256",
    "office + ms project": "https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https%3A%2F%2Fwww.microsoft.com%2Fmicrosoft-365&size=256",
}

PRIX: dict[str, int] = {
    "covadis": 10000,
    "lumion pro": 5000,
}


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
    prix = PRIX.get(key, 5000)
    prix_assist = prix + 5000
    if key == "covadis":
        prix_assist = 15000
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
