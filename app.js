const STORAGE_KEY = "prompt-desk-prompts";
const USER_KEY = "prompt-desk-user";
const SUPABASE_CDN = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const seedPrompts = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    title: "Earnings Call Red-Flag Scan",
    category: "investing",
    visibility: "team",
    body: "Act as a skeptical equity analyst. Review the latest earnings call transcript for {{company}}. Extract management claims, quantify each claim where possible, identify evasive language, compare tone versus the prior quarter, and list the top 5 red flags I should investigate before changing my position.",
    tags: ["earnings", "risk", "transcript"],
    author: "Alex",
    authorEmail: "alex@example.com",
    favorite: true,
    copies: 17,
    createdAt: "2026-04-24T09:20:00.000Z",
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    title: "Valuation Bear/Base/Bull Case",
    category: "investing",
    visibility: "team",
    body: "Build a bear, base, and bull valuation case for {{ticker}} over {{timeframe}}. Include revenue growth, margin, multiple, and dilution assumptions. Show what needs to be true for each case, which assumptions are most fragile, and what new evidence would move me between cases.",
    tags: ["valuation", "scenario", "ticker"],
    author: "Maya",
    authorEmail: "maya@example.com",
    favorite: false,
    copies: 22,
    createdAt: "2026-04-26T12:10:00.000Z",
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    title: "Portfolio Concentration Check",
    category: "portfolio",
    visibility: "team",
    body: "Analyze this portfolio: {{holdings}}. Group exposure by sector, factor, geography, revenue driver, interest-rate sensitivity, and AI-cycle dependency. Identify hidden concentration risk and propose 3 rebalancing options with tradeoffs.",
    tags: ["portfolio", "risk", "allocation"],
    author: "Sam",
    authorEmail: "sam@example.com",
    favorite: false,
    copies: 11,
    createdAt: "2026-04-28T16:35:00.000Z",
  },
  {
    id: "00000000-0000-4000-8000-000000000004",
    title: "Company Deep Research Brief",
    category: "research",
    visibility: "team",
    body: "Create an investment research brief for {{company}}. Cover business model, segment economics, competitive advantages, customer concentration, growth drivers, key risks, balance sheet quality, and 10 questions I should answer before investing.",
    tags: ["research", "brief", "company"],
    author: "Nina",
    authorEmail: "nina@example.com",
    favorite: true,
    copies: 31,
    createdAt: "2026-04-29T08:15:00.000Z",
  },
  {
    id: "00000000-0000-4000-8000-000000000005",
    title: "News Impact Triage",
    category: "investing",
    visibility: "team",
    body: "Given this news: {{news}}. Explain whether it changes the long-term thesis for {{ticker}}, short-term sentiment, financial estimates, valuation multiple, or competitive positioning. Separate signal from noise and give a confidence score.",
    tags: ["news", "thesis", "sentiment"],
    author: "Alex",
    authorEmail: "alex@example.com",
    favorite: false,
    copies: 8,
    createdAt: "2026-05-01T10:00:00.000Z",
  },
  {
    id: "00000000-0000-4000-8000-000000000006",
    title: "AI Workflow Optimizer",
    category: "productivity",
    visibility: "team",
    body: "Turn this repeated task into a reusable AI workflow: {{task}}. Ask clarifying questions only if essential. Then produce a prompt template, variables, expected output format, quality checklist, and a shorter version for quick use.",
    tags: ["workflow", "template", "automation"],
    author: "Maya",
    authorEmail: "maya@example.com",
    favorite: false,
    copies: 14,
    createdAt: "2026-05-02T14:50:00.000Z",
  },
];

const state = {
  prompts: loadLocalPrompts(),
  user: loadLocalUser(),
  activeFilter: "all",
  sort: "recent",
  editingId: null,
  supabase: null,
  syncMode: "local",
};

const elements = {
  promptGrid: document.querySelector("#promptGrid"),
  emptyState: document.querySelector("#emptyState"),
  searchInput: document.querySelector("#searchInput"),
  mineOnlyToggle: document.querySelector("#mineOnlyToggle"),
  promptModal: document.querySelector("#promptModal"),
  promptForm: document.querySelector("#promptForm"),
  promptTitle: document.querySelector("#promptTitle"),
  promptCategory: document.querySelector("#promptCategory"),
  promptVisibility: document.querySelector("#promptVisibility"),
  promptBody: document.querySelector("#promptBody"),
  promptTags: document.querySelector("#promptTags"),
  modalTitle: document.querySelector("#modalTitle"),
  authModal: document.querySelector("#authModal"),
  authForm: document.querySelector("#authForm"),
  authName: document.querySelector("#authName"),
  authEmail: document.querySelector("#authEmail"),
  authButton: document.querySelector("#authButton"),
  sharingText: document.querySelector("#sharingText"),
  syncBadge: document.querySelector("#syncBadge"),
  toast: document.querySelector("#toast"),
  importFile: document.querySelector("#importFile"),
};

document.querySelector("#newPromptButton").addEventListener("click", () => openPromptModal());
document.querySelector("#emptyNewPromptButton").addEventListener("click", () => openPromptModal());
document.querySelector("#exportButton").addEventListener("click", exportPrompts);
document.querySelector("#importButton").addEventListener("click", () => elements.importFile.click());
elements.importFile.addEventListener("change", importPrompts);
elements.searchInput.addEventListener("input", render);
elements.mineOnlyToggle.addEventListener("change", render);
elements.authButton.addEventListener("click", openAuthModal);
elements.promptForm.addEventListener("submit", savePrompt);
elements.authForm.addEventListener("submit", saveUser);

document.querySelectorAll("[data-close-modal]").forEach((button) => {
  button.addEventListener("click", () => elements.promptModal.close());
});

document.querySelectorAll("[data-close-auth]").forEach((button) => {
  button.addEventListener("click", () => elements.authModal.close());
});

document.querySelectorAll("[data-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    state.activeFilter = button.dataset.filter;
    document.querySelectorAll("[data-filter]").forEach((item) => item.classList.toggle("active", item === button));
    render();
  });
});

document.querySelectorAll("[data-sort]").forEach((button) => {
  button.addEventListener("click", () => {
    state.sort = button.dataset.sort;
    document.querySelectorAll("[data-sort]").forEach((item) => item.classList.toggle("active", item === button));
    render();
  });
});

elements.promptGrid.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const prompt = state.prompts.find((item) => item.id === button.dataset.id);
  if (!prompt) return;

  const action = button.dataset.action;
  if (action === "copy") await copyPrompt(prompt);
  if (action === "favorite") await toggleFavorite(prompt);
  if (action === "edit") openPromptModal(prompt);
  if (action === "delete") await deletePrompt(prompt);
});

await initializeApp();

async function initializeApp() {
  await setupSupabase();

  if (state.supabase) {
    const remotePrompts = await fetchRemotePrompts();
    if (remotePrompts) {
      state.prompts = remotePrompts.length ? remotePrompts : state.prompts;
      persistLocal();
    }
  }

  updateAuthUI();
  render();
}

function loadLocalPrompts() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return seedPrompts;

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : seedPrompts;
  } catch {
    return seedPrompts;
  }
}

function loadLocalUser() {
  const stored = localStorage.getItem(USER_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

function persistLocal() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.prompts));
}

async function setupSupabase() {
  const config = window.PROMPT_DESK_CONFIG ?? {};
  const hasConfig = Boolean(config.supabaseUrl && config.supabaseAnonKey);
  if (!hasConfig) return;

  try {
    const { createClient } = await import(SUPABASE_CDN);
    state.supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);
    state.syncMode = "supabase";

    const { data } = await state.supabase.auth.getSession();
    if (data.session?.user?.email) {
      state.user = userFromSession(data.session);
      localStorage.setItem(USER_KEY, JSON.stringify(state.user));
    }

    state.supabase.auth.onAuthStateChange(async (_event, session) => {
      state.user = session?.user?.email ? userFromSession(session) : null;
      if (state.user) localStorage.setItem(USER_KEY, JSON.stringify(state.user));
      updateAuthUI();
      const remotePrompts = await fetchRemotePrompts();
      if (remotePrompts) state.prompts = remotePrompts;
      render();
    });
  } catch {
    state.supabase = null;
    state.syncMode = "local";
    showToast("Supabase is not reachable. Using local mode.");
  }
}

async function fetchRemotePrompts() {
  if (!state.supabase) return null;

  const { data, error } = await state.supabase
    .from("prompts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    showToast("Could not load shared prompts. Using local cache.");
    return null;
  }

  return data.map(fromRemotePrompt);
}

async function syncRemotePrompt(prompt) {
  if (!state.supabase) return;

  const { error } = await state.supabase.from("prompts").upsert(toRemotePrompt(prompt));
  if (error) showToast("Saved locally. Shared sync failed.");
}

async function deleteRemotePrompt(prompt) {
  if (!state.supabase) return;

  const { error } = await state.supabase.from("prompts").delete().eq("id", prompt.id);
  if (error) showToast("Deleted locally. Shared delete failed.");
}

function userFromSession(session) {
  const email = session.user.email;
  return {
    email,
    name: session.user.user_metadata?.name || email.split("@")[0],
  };
}

function fromRemotePrompt(row) {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    visibility: row.visibility,
    body: row.body,
    tags: row.tags ?? [],
    author: row.author,
    authorEmail: row.author_email,
    favorite: row.favorite,
    copies: row.copies,
    createdAt: row.created_at,
  };
}

function toRemotePrompt(prompt) {
  return {
    id: prompt.id,
    title: prompt.title,
    category: prompt.category,
    visibility: prompt.visibility,
    body: prompt.body,
    tags: prompt.tags,
    author: prompt.author,
    author_email: prompt.authorEmail,
    favorite: prompt.favorite,
    copies: prompt.copies,
    created_at: prompt.createdAt,
  };
}

function render() {
  const prompts = getVisiblePrompts();
  elements.promptGrid.innerHTML = prompts.map(renderPromptCard).join("");
  elements.emptyState.hidden = prompts.length > 0;
  updateCounts();
}

function getVisiblePrompts() {
  const query = elements.searchInput.value.trim().toLowerCase();
  const mineOnly = elements.mineOnlyToggle.checked;

  return state.prompts
    .filter((prompt) => {
      const matchesFilter =
        state.activeFilter === "all" ||
        (state.activeFilter === "favorite" && prompt.favorite) ||
        prompt.category === state.activeFilter;
      const mineMatches = !mineOnly || (state.user && prompt.authorEmail === state.user.email);
      const searchable = [prompt.title, prompt.body, prompt.author, prompt.category, prompt.tags.join(" ")]
        .join(" ")
        .toLowerCase();
      return matchesFilter && mineMatches && searchable.includes(query);
    })
    .sort((a, b) => {
      if (state.sort === "popular") return b.copies - a.copies;
      if (state.sort === "title") return a.title.localeCompare(b.title);
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
}

function renderPromptCard(prompt) {
  const tags = prompt.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("");
  const visibilityClass = prompt.visibility === "private" ? "visibility private" : "visibility";
  const visibilityText = prompt.visibility === "private" ? "draft" : "pool";

  return `
    <article class="prompt-card">
      <header>
        <div>
          <h3>${escapeHtml(prompt.title)}</h3>
          <p class="prompt-meta">${escapeHtml(prompt.author)} · ${formatDate(prompt.createdAt)} · ${prompt.copies} copies</p>
        </div>
        <span class="${visibilityClass}">${visibilityText}</span>
      </header>
      <p class="prompt-body">${escapeHtml(prompt.body)}</p>
      <div class="tag-row">${tags}</div>
      <div class="card-actions">
        <button class="secondary-action" type="button" data-action="copy" data-id="${prompt.id}">Copy</button>
        <button class="icon-button favorite-button ${prompt.favorite ? "active" : ""}" type="button" title="Favorite" aria-label="Favorite" data-action="favorite" data-id="${prompt.id}">★</button>
        <button class="icon-button" type="button" title="Edit" aria-label="Edit" data-action="edit" data-id="${prompt.id}">✎</button>
        <button class="icon-button" type="button" title="Delete" aria-label="Delete" data-action="delete" data-id="${prompt.id}">×</button>
      </div>
    </article>
  `;
}

async function copyPrompt(prompt) {
  const copied = await copyText(prompt.body);
  if (!copied) {
    showToast("Clipboard access was blocked.");
    return;
  }

  prompt.copies += 1;
  persistLocal();
  await syncRemotePrompt(prompt);
  render();
  showToast(`Copied "${prompt.title}"`);
}

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to the selection-based copy path for embedded browsers.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  document.body.append(textarea);
  textarea.select();

  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    textarea.remove();
  }
}

async function toggleFavorite(prompt) {
  prompt.favorite = !prompt.favorite;
  persistLocal();
  await syncRemotePrompt(prompt);
  render();
}

async function deletePrompt(prompt) {
  state.prompts = state.prompts.filter((item) => item.id !== prompt.id);
  persistLocal();
  await deleteRemotePrompt(prompt);
  render();
  showToast("Prompt deleted");
}

function openPromptModal(prompt = null) {
  state.editingId = prompt?.id ?? null;
  elements.modalTitle.textContent = prompt ? "Edit prompt" : "New prompt";
  elements.promptTitle.value = prompt?.title ?? "";
  elements.promptCategory.value = prompt?.category ?? "investing";
  elements.promptVisibility.value = prompt?.visibility ?? "team";
  elements.promptBody.value = prompt?.body ?? "";
  elements.promptTags.value = prompt?.tags.join(", ") ?? "";
  elements.promptModal.showModal();
  elements.promptTitle.focus();
}

async function savePrompt(event) {
  event.preventDefault();

  const form = new FormData(elements.promptForm);
  const tags = form
    .get("tags")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 6);

  const prompt = {
    title: form.get("title").trim(),
    category: form.get("category"),
    visibility: form.get("visibility"),
    body: form.get("body").trim(),
    tags,
    author: state.user?.name || "Guest",
    authorEmail: state.user?.email || "guest@promptdesk.local",
  };

  if (state.editingId) {
    let savedPrompt = null;
    state.prompts = state.prompts.map((item) =>
      item.id === state.editingId ? (savedPrompt = { ...item, ...prompt }) : item,
    );
    await syncRemotePrompt(savedPrompt);
    showToast("Prompt updated");
  } else {
    const savedPrompt = {
      id: crypto.randomUUID(),
      ...prompt,
      favorite: false,
      copies: 0,
      createdAt: new Date().toISOString(),
    };
    state.prompts.unshift(savedPrompt);
    await syncRemotePrompt(savedPrompt);
    showToast("Prompt added");
  }

  persistLocal();
  elements.promptModal.close();
  render();
}

function openAuthModal() {
  elements.authName.value = state.user?.name ?? "";
  elements.authEmail.value = state.user?.email ?? "";
  elements.authModal.showModal();
  elements.authName.focus();
}

async function saveUser(event) {
  event.preventDefault();
  const form = new FormData(elements.authForm);
  const user = {
    name: form.get("name").trim(),
    email: form.get("email").trim().toLowerCase() || `${slugify(form.get("name"))}@promptdesk.local`,
  };

  state.user = user;
  localStorage.setItem(USER_KEY, JSON.stringify(state.user));
  elements.authModal.close();
  updateAuthUI();
  render();
  showToast(`Posting as ${state.user.name}`);
}

function updateAuthUI() {
  const isSupabase = state.syncMode === "supabase";

  if (state.user) {
    elements.authButton.textContent = state.user.name;
    elements.sharingText.textContent = isSupabase
      ? "Shared pool mode is active. Anyone with the link can add, edit, and delete prompts."
      : "Local mode is active. Anyone using this browser can add, edit, and delete prompts.";
  } else {
    elements.authButton.textContent = "Set name";
    elements.sharingText.textContent = isSupabase
      ? "Shared pool mode is active. Set a display name if you want prompts attributed to you."
      : "Local mode is active. Add Supabase keys to share one prompt pool across every visitor.";
  }

  elements.syncBadge.textContent = isSupabase ? "Shared" : "Local";
}

function updateCounts() {
  const byCategory = (category) => state.prompts.filter((prompt) => prompt.category === category).length;
  document.querySelector("#countAll").textContent = state.prompts.length;
  document.querySelector("#countInvesting").textContent = byCategory("investing");
  document.querySelector("#countResearch").textContent = byCategory("research");
  document.querySelector("#countPortfolio").textContent = byCategory("portfolio");
  document.querySelector("#countFavorites").textContent = state.prompts.filter((prompt) => prompt.favorite).length;
}

function exportPrompts() {
  const blob = new Blob([JSON.stringify(state.prompts, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `prompt-desk-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function importPrompts(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const incoming = JSON.parse(reader.result);
      if (!Array.isArray(incoming)) throw new Error("Expected an array");
      state.prompts = mergePrompts(state.prompts, incoming);
      persistLocal();
      await Promise.all(state.prompts.map((prompt) => syncRemotePrompt(prompt)));
      render();
      showToast("Prompts imported");
    } catch {
      showToast("Could not import that JSON file.");
    } finally {
      event.target.value = "";
    }
  };
  reader.readAsText(file);
}

function mergePrompts(existing, incoming) {
  const byId = new Map(existing.map((prompt) => [prompt.id, prompt]));
  incoming.forEach((prompt) => {
    if (prompt?.id && prompt?.title && prompt?.body) {
      byId.set(prompt.id, {
        favorite: false,
        copies: 0,
        tags: [],
        visibility: "team",
        category: "investing",
        author: "Imported",
        authorEmail: "imported@example.com",
        createdAt: new Date().toISOString(),
        ...prompt,
      });
    }
  });
  return Array.from(byId.values());
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => elements.toast.classList.remove("show"), 2200);
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(value));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "guest";
}
