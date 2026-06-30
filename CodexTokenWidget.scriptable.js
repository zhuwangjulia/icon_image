// Codex Token Widget for Scriptable on iOS.
// Configure DATA_URL below, or set the widget parameter to a JSON URL.

const CONFIG = {
  dataUrl: "https://raw.githubusercontent.com/zhuwangjulia/icon_image/main/codex-token-snapshot.json",
  fallbackDataUrl: "https://github.com/zhuwangjulia/icon_image/raw/refs/heads/main/codex-token-snapshot.json",
  title: "Codex Token",
  accent: new Color("#6C5CE7"),
  good: new Color("#19A974"),
  warn: new Color("#F59E0B"),
  danger: new Color("#E5484D"),
  text: Color.dynamic(new Color("#101418"), new Color("#F5F7FA")),
  subtext: Color.dynamic(new Color("#5A6572"), new Color("#AAB4C0")),
  bgTop: Color.dynamic(new Color("#F8FAFC"), new Color("#151922")),
  bgBottom: Color.dynamic(new Color("#E9EEF7"), new Color("#252B36")),
};

const sample = {
  updated_at: new Date().toISOString(),
  primary: { label: "5小时", used_percent: 38, remaining_percent: 62, resets_at: null },
  secondary: { label: "周限额", used_percent: 54, remaining_percent: 46, resets_at: null },
  today_tokens: 128000,
  five_day_tokens: [
    { date: "06-26", tokens: 92000 },
    { date: "06-27", tokens: 114000 },
    { date: "06-28", tokens: 86000 },
    { date: "06-29", tokens: 151000 },
    { date: "06-30", tokens: 128000 },
  ],
  status: "sample",
};

const dataUrl = (args.widgetParameter || CONFIG.dataUrl || "").trim();
let data = sample;
let errorText = "";

if (dataUrl && !dataUrl.includes("example.com")) {
  try {
    data = await loadSnapshot(dataUrl);
  } catch (error) {
    if (CONFIG.fallbackDataUrl && CONFIG.fallbackDataUrl !== dataUrl) {
      try {
        data = await loadSnapshot(CONFIG.fallbackDataUrl);
      } catch (fallbackError) {
        errorText = cleanError(fallbackError);
      }
    } else {
      errorText = cleanError(error);
    }
  }
}

const widget = await createWidget(data, errorText);
if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  await widget.presentMedium();
}
Script.complete();

async function createWidget(snapshot, error) {
  const widget = new ListWidget();
  const gradient = new LinearGradient();
  gradient.colors = [CONFIG.bgTop, CONFIG.bgBottom];
  gradient.locations = [0, 1];
  widget.backgroundGradient = gradient;
  widget.setPadding(14, 14, 12, 14);
  widget.refreshAfterDate = new Date(Date.now() + 10 * 60 * 1000);

  const header = widget.addStack();
  header.centerAlignContent();
  const title = header.addText(CONFIG.title);
  title.font = Font.semiboldSystemFont(14);
  title.textColor = CONFIG.text;
  header.addSpacer();
  const time = header.addText(relativeUpdate(snapshot.updated_at));
  time.font = Font.mediumSystemFont(10);
  time.textColor = CONFIG.subtext;

  widget.addSpacer(10);

  if (error) {
    addError(widget, error);
    return widget;
  }

  const primary = normalizeWindow(snapshot.primary, "5小时");
  const secondary = normalizeWindow(snapshot.secondary, "周限额");

  if (config.widgetFamily === "small") {
    addQuotaBlock(widget, primary);
    widget.addSpacer(8);
    addQuotaBlock(widget, secondary);
    widget.addSpacer();
    addFooter(widget, snapshot);
    return widget;
  }

  const row = widget.addStack();
  row.layoutHorizontally();
  const left = row.addStack();
  left.layoutVertically();
  addQuotaBlock(left, primary);
  left.addSpacer(10);
  addQuotaBlock(left, secondary);
  row.addSpacer(14);
  const right = row.addStack();
  right.layoutVertically();
  addTrend(right, snapshot.five_day_tokens || []);
  right.addSpacer(8);
  addMetricLine(right, "今日", formatTokens(snapshot.today_tokens || 0));
  addMetricLine(right, "状态", snapshot.status || "live");

  widget.addSpacer();
  addFooter(widget, snapshot);
  return widget;
}

function normalizeWindow(value, fallbackLabel) {
  const used = clamp(Number(value?.used_percent ?? (100 - Number(value?.remaining_percent ?? 100))), 0, 100);
  return {
    label: value?.label || fallbackLabel,
    used_percent: used,
    remaining_percent: clamp(Number(value?.remaining_percent ?? (100 - used)), 0, 100),
    resets_at: value?.resets_at || null,
  };
}

function addQuotaBlock(parent, item) {
  const row = parent.addStack();
  row.centerAlignContent();
  const label = row.addText(item.label);
  label.font = Font.mediumSystemFont(11);
  label.textColor = CONFIG.subtext;
  row.addSpacer();
  const pct = row.addText(`${Math.round(item.remaining_percent)}%`);
  pct.font = Font.boldSystemFont(20);
  pct.textColor = colorForRemaining(item.remaining_percent);

  parent.addSpacer(5);
  parent.addImage(progressImage(item.remaining_percent, 190, 8));
  parent.addSpacer(4);
  const reset = parent.addText(item.resets_at ? `重置 ${formatReset(item.resets_at)}` : "等待额度窗口数据");
  reset.font = Font.systemFont(10);
  reset.textColor = CONFIG.subtext;
  reset.lineLimit = 1;
}

function addTrend(parent, values) {
  const title = parent.addText("近 5 天消耗");
  title.font = Font.mediumSystemFont(11);
  title.textColor = CONFIG.subtext;
  parent.addSpacer(7);

  const bars = parent.addStack();
  bars.layoutHorizontally();
  bars.bottomAlignContent();
  const max = Math.max(...values.map(v => Number(v.tokens || 0)), 1);
  for (const point of values.slice(-5)) {
    const col = bars.addStack();
    col.layoutVertically();
    col.bottomAlignContent();
    col.size = new Size(16, 54);
    col.addSpacer();
    const h = Math.max(5, Math.round((Number(point.tokens || 0) / max) * 42));
    col.addImage(barImage(12, h, CONFIG.accent));
    bars.addSpacer(5);
  }
}

function addMetricLine(parent, label, value) {
  const row = parent.addStack();
  row.centerAlignContent();
  const left = row.addText(label);
  left.font = Font.systemFont(10);
  left.textColor = CONFIG.subtext;
  row.addSpacer();
  const right = row.addText(value);
  right.font = Font.semiboldSystemFont(11);
  right.textColor = CONFIG.text;
}

function addFooter(widget, snapshot) {
  const footer = widget.addText(`Today ${formatTokens(snapshot.today_tokens || 0)}`);
  footer.font = Font.mediumSystemFont(10);
  footer.textColor = CONFIG.subtext;
  footer.lineLimit = 1;
}

function addError(widget, message) {
  const text = widget.addText("读取失败");
  text.font = Font.boldSystemFont(18);
  text.textColor = CONFIG.danger;
  widget.addSpacer(6);
  const detail = widget.addText(message);
  detail.font = Font.systemFont(11);
  detail.textColor = CONFIG.subtext;
  detail.lineLimit = 4;
}

function progressImage(remaining, width, height) {
  const ctx = new DrawContext();
  ctx.size = new Size(width, height);
  ctx.opaque = false;
  ctx.respectScreenScale = true;
  ctx.setFillColor(Color.dynamic(new Color("#D9DEE8"), new Color("#3A414D")));
  ctx.fillRoundedRect(new Rect(0, 0, width, height), height / 2, height / 2);
  ctx.setFillColor(colorForRemaining(remaining));
  ctx.fillRoundedRect(new Rect(0, 0, width * clamp(remaining, 0, 100) / 100, height), height / 2, height / 2);
  return ctx.getImage();
}

function barImage(width, height, color) {
  const ctx = new DrawContext();
  ctx.size = new Size(width, 44);
  ctx.opaque = false;
  ctx.respectScreenScale = true;
  ctx.setFillColor(color);
  ctx.fillRoundedRect(new Rect(0, 44 - height, width, height), 4, 4);
  return ctx.getImage();
}

function colorForRemaining(value) {
  if (value <= 20) return CONFIG.danger;
  if (value <= 45) return CONFIG.warn;
  return CONFIG.good;
}

function formatTokens(value) {
  const n = Number(value || 0);
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${Math.round(n / 1000)}K`;
  return String(Math.round(n));
}

function formatReset(value) {
  const raw = Number(value);
  const date = Number.isFinite(raw)
    ? new Date(raw < 100000000000 ? raw * 1000 : raw)
    : new Date(value);
  if (Number.isNaN(date.getTime())) return "未知";
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function relativeUpdate(value) {
  const date = new Date(value || 0);
  if (Number.isNaN(date.getTime())) return "未更新";
  const mins = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
  if (mins < 1) return "刚刚";
  if (mins < 60) return `${mins}m`;
  return `${Math.round(mins / 60)}h`;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
}

function pad(value) {
  return String(value).padStart(2, "0");
}

async function loadSnapshot(url) {
  const req = new Request(withCacheBuster(url));
  req.timeoutInterval = 12;
  req.headers = {
    "Accept": "application/json,text/plain,*/*",
    "User-Agent": "Scriptable-CodexTokenWidget",
  };
  const text = await req.loadString();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) {
    throw new Error(`Not JSON: ${text.slice(0, 80)}`);
  }
  return JSON.parse(text.slice(start, end + 1));
}

function cleanError(error) {
  return String(error).replace(/^Error:\s*/, "").slice(0, 180);
}

function withCacheBuster(url) {
  const separator = url.includes("?") ? "&" : "?";
  const bucket = Math.floor(Date.now() / (10 * 60 * 1000));
  return `${url}${separator}_=${bucket}`;
}
