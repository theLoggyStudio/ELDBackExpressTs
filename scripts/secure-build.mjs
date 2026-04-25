import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, extname } from "node:path";
import { minify } from "terser";
import JavaScriptObfuscator from "javascript-obfuscator";

const DIST_DIR = "dist";

async function getJsFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        return getJsFiles(fullPath);
      }
      return extname(entry.name) === ".js" ? [fullPath] : [];
    })
  );
  return files.flat();
}

async function secureFile(filePath) {
  const originalCode = await readFile(filePath, "utf8");

  const minified = await minify(originalCode, {
    module: true,
    compress: true,
    mangle: true,
    format: {
      comments: false
    }
  });

  if (!minified.code) {
    throw new Error(`Echec de minification: ${filePath}`);
  }

  const obfuscated = JavaScriptObfuscator.obfuscate(minified.code, {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.75,
    deadCodeInjection: true,
    deadCodeInjectionThreshold: 0.2,
    identifierNamesGenerator: "hexadecimal",
    renameGlobals: false,
    stringArray: true,
    stringArrayShuffle: true,
    stringArrayThreshold: 0.75
  });

  await writeFile(filePath, obfuscated.getObfuscatedCode(), "utf8");
}

async function main() {
  const jsFiles = await getJsFiles(DIST_DIR);
  if (!jsFiles.length) {
    console.log("Aucun fichier .js trouve dans dist.");
    return;
  }

  for (const filePath of jsFiles) {
    await secureFile(filePath);
    console.log(`Securise: ${filePath}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
