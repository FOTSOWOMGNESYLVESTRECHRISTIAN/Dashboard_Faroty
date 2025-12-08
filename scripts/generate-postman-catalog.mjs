#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const collectionPath = path.resolve(
  projectRoot,
  "connexionPostman",
  "FAROTY.postman_collection.json",
);
const outputPath = path.resolve(projectRoot, "src", "data", "postmanCatalog.ts");

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const ensureFile = (targetPath) => {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
};

const readCollection = () => {
  if (!fs.existsSync(collectionPath)) {
    throw new Error(`Postman collection not found at ${collectionPath}`);
  }
  const raw = fs.readFileSync(collectionPath, "utf8");
  return JSON.parse(raw);
};

const buildRelativePath = (urlObj = {}) => {
  const segments = Array.isArray(urlObj.path) ? urlObj.path : [];
  const basePath = segments.length ? `/${segments.join("/")}` : "";
  if (!Array.isArray(urlObj.query) || urlObj.query.length === 0) {
    return basePath;
  }
  const queryString = urlObj.query
    .map((q) => `${encodeURIComponent(q.key)}=${encodeURIComponent(q.value ?? "")}`)
    .join("&");
  return `${basePath}?${queryString}`;
};

const walkItems = (items, parents = []) => {
  const endpoints = [];
  if (!Array.isArray(items)) return endpoints;

  for (const item of items) {
    const nextParents = item?.name ? [...parents, item.name] : parents;
    if (Array.isArray(item?.item)) {
      endpoints.push(...walkItems(item.item, nextParents));
      continue;
    }

    const request = item?.request;
    if (!request) continue;

    const method = String(request.method || "GET").toUpperCase();
    const url = request.url || {};
    const relativePath = buildRelativePath(url);
    const rawUrl =
      typeof url === "string"
        ? url
        : url.raw ||
          relativePath ||
          [
            Array.isArray(url.host) ? url.host.join(".") : "",
            url.port ? `:${url.port}` : "",
            relativePath,
          ].join("");

    const identifierSource = [...nextParents, method, relativePath || rawUrl].join("-");
    const idBase = slugify(identifierSource) || slugify(`${method}-${Date.now()}`);

    endpoints.push({
      id: idBase,
      label: item?.name || `${method} ${relativePath || rawUrl}`,
      method,
      folder: nextParents[0] || "root",
      parents: nextParents,
      relativePath,
      rawUrl,
      pathSegments: Array.isArray(url.path) ? url.path : [],
    });
  }

  return endpoints;
};

const writeCatalogFile = (endpoints) => {
  const banner = `// AUTO-GENERATED - DO NOT EDIT
// Source: ${path.relative(projectRoot, collectionPath)}
// Generated via scripts/generate-postman-catalog.mjs
`;

  const interfaceDef = `export interface PostmanEndpoint {
  id: string;
  label: string;
  method: string;
  folder: string;
  parents: string[];
  relativePath: string;
  rawUrl: string;
  pathSegments: string[];
}
`;

  const payload = `${banner}${interfaceDef}export const postmanEndpoints: PostmanEndpoint[] = ${JSON.stringify(
    endpoints,
    null,
    2,
  )};
`;

  ensureFile(outputPath);
  fs.writeFileSync(outputPath, payload, "utf8");
  console.log(
    `Generated ${endpoints.length} Postman endpoints -> ${path.relative(projectRoot, outputPath)}`,
  );
};

try {
  const collection = readCollection();
  const endpoints = walkItems(collection.item || []);
  writeCatalogFile(endpoints);
} catch (error) {
  console.error("[generate-postman-catalog] Failed:", error);
  process.exitCode = 1;
}


