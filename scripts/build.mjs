// Genera dist/: una copia del sitio con el JSX ya compilado, para que el
// navegador del visitante no tenga que cargar Babel ni compilar al abrir.
// index.html sigue siendo el archivo que se edita; este script no lo toca.
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, existsSync } from "node:fs";
import Babel from "@babel/standalone";

const html = readFileSync("index.html", "utf8");

const open = '<script type="text/babel">';
const start = html.indexOf(open);
const end = html.indexOf("</script>", start);
if (start === -1 || end === -1) throw new Error("No se encontró el <script type=\"text/babel\"> en index.html");

const source = html.slice(start + open.length, end);
const { code } = Babel.transform(source, {
  presets: ["react"],
  sourceType: "script",
  compact: true,
  comments: false,
});

let out = html.slice(0, start) + "<script>" + code + html.slice(end);

// Babel ya no hace falta en el navegador.
out = out.replace(/\s*<script src="https:\/\/unpkg\.com\/@babel\/standalone@[^"]*"><\/script>/, "");
// Versiones exactas: evitan la redirección de unpkg y que cambien solas.
out = out
  .replace("https://unpkg.com/react@18/umd/", "https://unpkg.com/react@18.3.1/umd/")
  .replace("https://unpkg.com/react-dom@18/umd/", "https://unpkg.com/react-dom@18.3.1/umd/");

if (out.includes("@babel/standalone")) throw new Error("No se pudo quitar Babel del HTML");

rmSync("dist", { recursive: true, force: true });
mkdirSync("dist");
writeFileSync("dist/index.html", out);
for (const dir of ["images", "audio"]) {
  if (existsSync(dir)) cpSync(dir, `dist/${dir}`, { recursive: true });
}

const kb = (n) => `${Math.round(n / 1024)} KB`;
console.log(`dist/index.html: ${kb(Buffer.byteLength(html))} → ${kb(Buffer.byteLength(out))}`);
