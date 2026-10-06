(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const fileInput = $("fileInput");
  const openBtn = $("openBtn");
  const chooseBtn = $("chooseBtn");
  const dropZone = $("dropZone");
  const fileInfo = $("fileInfo");
  const editor = $("editor");
  const findInput = $("findInput");
  const replaceInput = $("replaceInput");
  const caseSensitive = $("caseSensitive");
  const wholeWord = $("wholeWord");
  const regexMode = $("regexMode");
  const matchCount = $("matchCount");
  const cursorStatus = $("cursorStatus");
  const findPrevBtn = $("findPrevBtn");
  const findNextBtn = $("findNextBtn");
  const replaceBtn = $("replaceBtn");
  const replaceAllBtn = $("replaceAllBtn");
  const downloadBtn = $("downloadBtn");
  const resetBtn = $("resetBtn");
  const formatBtn = $("formatBtn");
  const refreshPreviewBtn = $("refreshPreviewBtn");
  const preview = $("preview");
  const lineInfo = $("lineInfo");
  const toast = $("toast");

  let originalContent = "";
  let currentFileName = "edited.html";
  let toastTimer = null;

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
  }

  function updateStats() {
    const value = editor.value;
    const lines = value.length ? value.split("\n").length : 0;
    lineInfo.textContent = `${lines.toLocaleString()} line${lines === 1 ? "" : "s"}`;
    cursorStatus.textContent = `Cursor: ${editor.selectionStart.toLocaleString()}`;
    updateMatchCount();
  }

  function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function getSearchRegex() {
    const query = findInput.value;
    if (!query) return null;

    let source = regexMode.checked ? query : escapeRegex(query);
    if (wholeWord.checked) {
      source = `\\b(?:${source})\\b`;
    }

    try {
      return new RegExp(source, caseSensitive.checked ? "g" : "gi");
    } catch (error) {
      matchCount.textContent = "Invalid regex";
      return null;
    }
  }

  function getMatches() {
    const regex = getSearchRegex();
    if (!regex) return [];

    const matches = [];
    let match;

    while ((match = regex.exec(editor.value)) !== null) {
      matches.push({
        index: match.index,
        length: match[0].length
      });

      if (match[0] === "") regex.lastIndex++;
    }

    return matches;
  }

  function updateMatchCount() {
    const query = findInput.value;
    if (!query) {
      matchCount.textContent = "0 matches";
      return;
    }

    const matches = getMatches();
    matchCount.textContent = `${matches.length.toLocaleString()} match${matches.length === 1 ? "" : "es"}`;
  }

  function focusMatch(direction = 1) {
    const matches = getMatches();

    if (!matches.length) {
      showToast("No matches found.");
      return;
    }

    const cursor = editor.selectionStart;
    let target;

    if (direction > 0) {
      target = matches.find((m) => m.index > cursor);
      if (!target) target = matches[0];
    } else {
      target = [...matches].reverse().find((m) => m.index < cursor);
      if (!target) target = matches[matches.length - 1];
    }

    editor.focus();
    editor.setSelectionRange(target.index, target.index + target.length);
    editor.scrollTop = Math.max(0, (editor.scrollHeight * target.index / Math.max(editor.value.length, 1)) - editor.clientHeight / 2);
    updateStats();
  }

  function replaceCurrent() {
    const selected = editor.value.slice(editor.selectionStart, editor.selectionEnd);
    const query = findInput.value;

    if (!query) {
      showToast("Enter text to find first.");
      findInput.focus();
      return;
    }

    const regex = getSearchRegex();
    if (!regex) return;

    const isMatch = regex.test(selected);
    regex.lastIndex = 0;

    if (isMatch && selected.length > 0) {
      const replacement = replaceInput.value;
      const start = editor.selectionStart;
      const newValue = editor.value.slice(0, start) + selected.replace(regex, replacement) + editor.value.slice(editor.selectionEnd);
      editor.value = newValue;
      editor.setSelectionRange(start, start + replacement.length);
      updateStats();
      refreshPreview();
      showToast("Match replaced.");
      return;
    }

    const matches = getMatches();
    if (!matches.length) {
      showToast("No matches found.");
      return;
    }

    const next = matches.find((m) => m.index >= editor.selectionStart) || matches[0];
    editor.focus();
    editor.setSelectionRange(next.index, next.index + next.length);
    showToast("Match selected. Press Replace again.");
  }

  function replaceAll() {
    const query = findInput.value;

    if (!query) {
      showToast("Enter text to find first.");
      findInput.focus();
      return;
    }

    const regex = getSearchRegex();
    if (!regex) {
      showToast("Invalid regular expression.");
      return;
    }

    const before = editor.value;
    let count = 0;

    const after = before.replace(regex, (...args) => {
      count++;
      return replaceInput.value;
    });

    if (count === 0) {
      showToast("No matches found.");
      return;
    }

    editor.value = after;
    updateStats();
    refreshPreview();
    showToast(`${count.toLocaleString()} replacement${count === 1 ? "" : "s"} made.`);
  }

  function refreshPreview() {
    const html = editor.value;

    try {
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const oldUrl = preview.dataset.blobUrl;

      preview.src = url;
      preview.dataset.blobUrl = url;

      if (oldUrl) {
        setTimeout(() => URL.revokeObjectURL(oldUrl), 1000);
      }
    } catch (error) {
      preview.srcdoc = html;
    }
  }

  function loadFile(file) {
    if (!file) return;

    const name = file.name.toLowerCase();
    if (!name.endsWith(".html") && !name.endsWith(".htm")) {
      showToast("Please select an HTML file.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      originalContent = String(reader.result || "");
      editor.value = originalContent;
      currentFileName = file.name;
      fileInfo.textContent = `${file.name} • ${formatBytes(file.size)}`;
      downloadBtn.disabled = false;
      resetBtn.disabled = false;
      updateStats();
      refreshPreview();
      showToast("HTML file loaded.");
    };

    reader.onerror = () => showToast("Could not read the file.");
    reader.readAsText(file);
  }

  function downloadFile() {
    const content = editor.value;
    let name = currentFileName || "edited.html";

    if (!/\.(html|htm)$/i.test(name)) {
      name += ".html";
    }

    const blob = new Blob([content], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = name.replace(/(\.html?)$/i, "-edited$1");
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast("Edited HTML downloaded.");
  }

  function resetEditor() {
    if (!originalContent) return;

    if (!confirm("Reset all edits and restore the original file?")) return;

    editor.value = originalContent;
    updateStats();
    refreshPreview();
    showToast("Changes reset.");
  }

  function formatHTML() {
    const source = editor.value.trim();
    if (!source) return;

    // Lightweight formatter. It deliberately avoids external libraries so the
    // GitHub Pages app remains dependency-free.
    let formatted = source
      .replace(/>\s*</g, "><")
      .replace(/</g, "\n<")
      .trim();

    const lines = formatted.split("\n");
    let indent = 0;
    const output = [];

    const voidTags = new Set([
      "area", "base", "br", "col", "embed", "hr", "img",
      "input", "link", "meta", "param", "source", "track", "wbr"
    ]);

    for (let raw of lines) {
      raw = raw.trim();
      if (!raw) continue;

      const closing = /^<\//.test(raw);
      const openingMatch = raw.match(/^<([a-zA-Z0-9-]+)/);
      const tag = openingMatch ? openingMatch[1].toLowerCase() : "";

      if (closing) indent = Math.max(0, indent - 1);

      output.push("  ".repeat(indent) + raw);

      const opens = /^<([a-zA-Z0-9-]+)(?:\s[^>]*)?>$/.test(raw);
      const selfClosing = /\/>$/.test(raw);
      const isVoid = voidTags.has(tag);
      const isDoctype = /^<!/.test(raw);

      if (opens && !selfClosing && !isVoid && !isDoctype && !/^<\//.test(raw)) {
        indent++;
      }
    }

    editor.value = output.join("\n");
    updateStats();
    refreshPreview();
    showToast("HTML formatted.");
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  openBtn.addEventListener("click", () => fileInput.click());
  chooseBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    fileInput.click();
  });

  dropZone.addEventListener("click", (event) => {
    if (event.target.closest("button")) return;
    fileInput.click();
  });

  fileInput.addEventListener("change", () => {
    loadFile(fileInput.files[0]);
    fileInput.value = "";
  });

  ["dragenter", "dragover"].forEach((eventName) => {
    dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      event.stopPropagation();
      dropZone.classList.add("dragover");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      event.stopPropagation();
      dropZone.classList.remove("dragover");
    });
  });

  dropZone.addEventListener("drop", (event) => {
    const file = event.dataTransfer.files[0];
    loadFile(file);
  });

  findInput.addEventListener("input", updateMatchCount);
  replaceInput.addEventListener("input", updateStats);
  caseSensitive.addEventListener("change", updateMatchCount);
  wholeWord.addEventListener("change", updateMatchCount);
  regexMode.addEventListener("change", updateMatchCount);

  editor.addEventListener("input", updateStats);
  editor.addEventListener("click", updateStats);
  editor.addEventListener("keyup", updateStats);
  editor.addEventListener("select", updateStats);

  findNextBtn.addEventListener("click", () => focusMatch(1));
  findPrevBtn.addEventListener("click", () => focusMatch(-1));
  replaceBtn.addEventListener("click", replaceCurrent);
  replaceAllBtn.addEventListener("click", replaceAll);
  downloadBtn.addEventListener("click", downloadFile);
  resetBtn.addEventListener("click", resetEditor);
  formatBtn.addEventListener("click", formatHTML);
  refreshPreviewBtn.addEventListener("click", refreshPreview);

  document.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "f") {
      event.preventDefault();
      findInput.focus();
      findInput.select();
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "h") {
      event.preventDefault();
      replaceInput.focus();
      replaceInput.select();
    }

    if (event.key === "F3") {
      event.preventDefault();
      focusMatch(event.shiftKey ? -1 : 1);
    }

    if (event.key === "Tab" && document.activeElement === editor) {
      event.preventDefault();
      const start = editor.selectionStart;
      const end = editor.selectionEnd;
      editor.setRangeText("  ", start, end, "end");
      updateStats();
    }
  });

  updateStats();
})();
