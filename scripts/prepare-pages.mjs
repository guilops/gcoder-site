import { cp, mkdir } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const output = new URL("../dist/", import.meta.url);
await Promise.all([
  mkdir(output, { recursive: true }),
  mkdir(new URL("assets/logos/", output), { recursive: true }),
  mkdir(new URL("assets/courses/", output), { recursive: true }),
  mkdir(new URL("gestao/", output), { recursive: true }),
]);

for (const file of ["index.html", "style.css", "script.js", "config.js", "CNAME", "sw.js"]) {
  await cp(new URL(file, root), new URL(file, output));
}
await cp(new URL("assets/logos/", root), new URL("assets/logos/", output), { recursive: true });
await cp(new URL("assets/courses/", root), new URL("assets/courses/", output), { recursive: true });
await cp(new URL("gestao/index.html", root), new URL("gestao/index.html", output));
console.log("Site estático preparado em dist/.");
