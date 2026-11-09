import { readFile, writeFile } from "node:fs/promises";

const env = { ...process.env };
try {
  const contents = await readFile(new URL("../.env", import.meta.url), "utf8");
  for (const line of contents.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || match[1] in env) continue;
    const value = match[2].trim();
    env[match[1]] = value.replace(/^(['"])(.*)\1$/, "$2");
  }
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

const supabaseUrl = env.SUPABASE_URL || "";
const supabaseAnonKey = env.SUPABASE_ANON_KEY || "";
if (Boolean(supabaseUrl) !== Boolean(supabaseAnonKey)) {
  throw new Error("Configure SUPABASE_URL e SUPABASE_ANON_KEY juntos.");
}
if (supabaseUrl && !/^https?:\/\/.+/.test(supabaseUrl)) {
  throw new Error("SUPABASE_URL deve ser uma URL http ou https válida.");
}

const config = {
  supabaseUrl,
  supabaseAnonKey,
  whatsappNumber: env.WHATSAPP_NUMBER || "5511953687653",
  contactEmail: env.CONTACT_EMAIL || "guilhermelopes_dev@hotmail.com",
  instagramUrl: env.INSTAGRAM_URL || "",
  githubUrl: env.GITHUB_URL || "https://github.com/guilops",
  serviceArea: env.SERVICE_AREA || "",
  hotmartLogicUrl: env.HOTMART_LOGIC_URL || "https://go.hotmart.com/J79485536F",
  businessName: env.BUSINESS_NAME || "Gcoder",
  businessTagline: env.BUSINESS_TAGLINE || "TECNOLOGIA SEM COMPLICAÇÃO",
};

await writeFile(
  new URL("../config.js", import.meta.url),
  `window.GCODER_CONFIG = ${JSON.stringify(config, null, 2)};\n`,
  "utf8",
);
console.log("Configuração pública gerada em config.js.");
