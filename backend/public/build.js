/**
 * Copies the static front-end into frontend/dist so the Express server can
 * host it at http://localhost:5000. No bundler, no dependencies.
 */
const fs = require("fs");
const path = require("path");

const files = ["index.html", "styles.css", "app.js"];
const dist = path.join(__dirname, "dist");

fs.mkdirSync(dist, { recursive: true });
for (const file of files) {
  fs.copyFileSync(path.join(__dirname, file), path.join(dist, file));
}
console.log(`Built ${files.length} files into frontend/dist`);
