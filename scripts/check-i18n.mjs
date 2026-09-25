#!/usr/bin/env node
// Verifies the app's text sources before every build:
//  - src/translations/<lang>.json (UI chrome): same keys in every language, no empty values,
//    and every literal t("...") key used in the code exists;
//  - src/content/*.json (editable copy): every bilingual { en, es } value has both sides.
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "src");
const LANGS = ["en", "es"];

function flatten(tree, prefix, out) {
  for (const [key, value] of Object.entries(tree)) {
    const p = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") out[p] = value;
    else flatten(value, p, out);
  }
  return out;
}

const errors = [];
const catalogs = Object.fromEntries(
  LANGS.map((l) => [l, flatten(JSON.parse(fs.readFileSync(path.join(root, "translations", `${l}.json`), "utf8")), "", {})]),
);
const [base, ...others] = LANGS;
for (const lang of others) {
  for (const key of Object.keys(catalogs[base])) if (!(key in catalogs[lang])) errors.push(`${lang}: missing key ${key}`);
  for (const key of Object.keys(catalogs[lang])) if (!(key in catalogs[base])) errors.push(`${base}: missing key ${key}`);
}
for (const lang of LANGS)
  for (const [key, value] of Object.entries(catalogs[lang])) if (!value.trim()) errors.push(`${lang}: empty value for ${key}`);

const used = new Set();
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!["translations", "content"].includes(entry.name)) walk(p);
      continue;
    }
    if (!/\.(tsx?|jsx?)$/.test(entry.name)) continue;
    for (const m of fs.readFileSync(p, "utf8").matchAll(/\bt\(\s*["']([a-zA-Z0-9_.]+)["']/g)) used.add(m[1]);
  }
})(root);
for (const key of used) if (!(key in catalogs[base])) errors.push(`code uses undefined key ${key}`);

// Bilingual content values: any object whose keys are exactly the languages.
const contentDir = path.join(root, "content");
let localized = 0;
for (const file of fs.existsSync(contentDir) ? fs.readdirSync(contentDir).filter((f) => f.endsWith(".json")) : []) {
  (function visit(node, where) {
    if (Array.isArray(node)) return node.forEach((v, i) => visit(v, `${where}[${i}]`));
    if (!node || typeof node !== "object") return;
    const keys = Object.keys(node).sort();
    if (keys.join() === [...LANGS].sort().join() && keys.every((k) => typeof node[k] === "string")) {
      localized++;
      for (const l of LANGS) if (!node[l].trim()) errors.push(`${file}: empty ${l} at ${where}`);
      return;
    }
    for (const [k, v] of Object.entries(node)) visit(v, where ? `${where}.${k}` : k);
  })(JSON.parse(fs.readFileSync(path.join(contentDir, file), "utf8")), "");
}

if (errors.length) {
  console.error(`i18n check failed (${errors.length}):\n  ` + errors.join("\n  "));
  process.exit(1);
}
console.log(
  `i18n ok: ${LANGS.join(", ")} · ${Object.keys(catalogs[base]).length} keys · ${used.size} used in code · ${localized} bilingual content values`,
);
