#!/usr/bin/env node
/**
 * Makes the Arabic page from the page the skill built:
 *   node arabic.mjs hairline-battery.html  ->  hairline-battery-ar.html
 * Right to left, every word in Arabic, numbers in Arabic-Indic digits, and the
 * Thmanyah Sans font embedded, so the page is still one file. The figure and the
 * skill's bench are left as they are; this only rewrites the built copy.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const src = process.argv[2] || "hairline-battery.html";
const out = src.replace(/\.html$/, "-ar.html");
let html = readFileSync(src, "utf8");

const font = (weight, file) => `  @font-face { font-family: "Thmanyah Sans"; font-weight: ${weight}; font-display: swap;
    src: url(data:font/otf;base64,${readFileSync(join(here, "fonts", file)).toString("base64")}) format("opentype"); }`;

const css = `
${font(400, "thmanyahsans-Regular.otf")}
${font(500, "thmanyahsans-Medium.otf")}
  body { font: 15px/1.7 "Thmanyah Sans", system-ui, sans-serif; }
  .tag, .label, output, button { font: 500 13px/1 "Thmanyah Sans", system-ui, sans-serif; letter-spacing: 0; }
  #read { font-size: 14px; }
  #name { left: auto; right: 14px; }
  #read { right: auto; left: 14px; }
  output { min-width: 5ch; text-align: left; }
  #error { padding-left: 0; padding-right: 10px; border-left: 0; border-right: 1px solid var(--ink); }
</style>`;

const MEANS = "ست خلايا بطارية سيارة، طول كل منها بقدر شحنها؛ حرّك المؤشر على امتداد البطارية لتشحنها أو تفرغها وتقرأ جهدها.";

// Each pair must be found exactly once, or the bench changed and this script needs a look.
const swaps = [
  ['<html lang="en">', '<html lang="ar" dir="rtl">'],
  ["<title>Hairline figure</title>", "<title>بطارية السيارة</title>"],
  ["</style>", css],
  ['>intensity</label>', ">تآكل الخلية</label>"],
  ['<span class="label">theme</span>', '<span class="label">المظهر</span>'],
  ['aria-label="Switch between the light and the dark theme"', 'aria-label="التبديل بين المظهر الفاتح والداكن"'],
  ['<span class="label">play</span>', '<span class="label">الجولة</span>'],
  ['aria-pressed="false">play</button>', 'aria-pressed="false">تشغيل</button>'],
  ['const RULES = ["hit", "order", "reach", "accent", "rest", "honesty", "cost", "clock", "radius", "quiet"];',
    `const RULES = ["ثبات الإصابة", "الترتيب", "المدى", "الإبراز", "السكون", "الصدق", "الكلفة", "الإيقاع", "الاستدارة", "الصمت"];
  const AR = new Intl.NumberFormat("ar-u-nu-arab"), num = (n, d = 0) => AR.format(Number(n.toFixed(d)));
  const V = new Intl.NumberFormat("ar-u-nu-arab", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  /* the read-out, in Arabic: "rest" and "75% · 12.46V" */
  const arabic = (t) => {
    if (t === "rest") return "في السكون";
    const m = /^(\\d+)% · ([\\d.]+)V$/.exec(t);
    return m ? \`الشحن \${num(Number(m[1]))}٪، الجهد \${V.format(Number(m[2]))} فولت\` : t;
  };`],
  ['$("theme").textContent = dark() ? "dark" : "light";', '$("theme").textContent = dark() ? "داكن" : "فاتح";'],
  ['stage.setAttribute("aria-label", figure.means);', `stage.setAttribute("aria-label", ${JSON.stringify(MEANS)});`],
  ['$("read").textContent = text;', '$("read").textContent = arabic(text);'],
  ['document.title = "Hairline · " + figure.name;', 'document.title = "بطارية السيارة";'],
  ['$("name").textContent = figure.name;', '$("name").textContent = "بطارية";'],
  ['$("means").textContent = figure.means;', `$("means").textContent = ${JSON.stringify(MEANS)};`],
  ['String(n).padStart(2, "0") + " " + RULES[n - 1]).join(" · ")', 'AR.format(n) + " " + RULES[n - 1]).join("، ")'],
  ['$("value").textContent = String(at(Number(slider.value)));', '$("value").textContent = num(at(Number(slider.value)) * 100) + "٪";'],
];
for (const [from, to] of swaps) {
  const n = html.split(from).length - 1;
  if (n !== 1) { console.error(`arabic: expected one "${from.slice(0, 60)}", found ${n}`); process.exit(1); }
  html = html.replace(from, () => to);
}
writeFileSync(out, html);
console.log("wrote", out);
