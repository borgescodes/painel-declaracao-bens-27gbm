// app.js — Painel de Declarações de Bens 27º GBM / CBMPA

const deadline = new Date("2025-12-31T23:59:00");
const $ = (sel) => document.querySelector(sel);

let allData = [];

// Utilitários
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("pt-BR") : "-");

function escapeHtml(unsafe) {
  return (unsafe + "").replace(/[&<>"']/g, function (m) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    }[m];
  });
}

// Carrega o data.json
async function loadData() {
  try {
    const res = await fetch("data.json", { cache: "no-store" });
    const data = await res.json();
    return data;
  } catch (e) {
    console.error("Erro ao carregar data.json", e);
    return [];
  }
}

// Monta datalist para autocomplete (graduação + nome de guerra)
function buildAutocomplete() {
  const dl = document.getElementById("militares-list");
  if (!dl) return;

  dl.innerHTML = "";
  const seen = new Set();

  allData.forEach((item) => {
    const label = `${item.grad || ""} ${item.nome_guerra || ""}`.trim();
    if (!label) return;

    const key = label.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);

    const opt = document.createElement("option");
    opt.value = label;
    dl.appendChild(opt);
  });
}

// Renderiza lista (usando apenas graduação + nome de guerra)
function renderList(filter = "") {
  const listEl = $("#list");
  if (!listEl) return;

  listEl.innerHTML = "";

  const f = filter.trim().toLowerCase();

  const filtered = allData.filter((item) => {
    const hay = (
      (item.grad || "") +
      " " +
      (item.nome_guerra || "") +
      " " +
      (item.nome_completo || "")
    ).toLowerCase();
    return !f || hay.includes(f);
  });

  // Atualiza total (sempre considerando TODOS os militares)
  const totalEl = $("#total");
  if (totalEl) totalEl.textContent = allData.length;

  filtered.forEach((item) => {
    const wrap = document.createElement("div");
    wrap.className = "card-person";

    const avatar = document.createElement("div");
    avatar.className = "avatar";
    const img = document.createElement("img");
    img.alt = (item.nome_guerra || "Militar") + " - foto";
    img.src = item.img;
    img.onerror = () => {
      img.src = "img/default.svg";
    };
    avatar.appendChild(img);

    const meta = document.createElement("div");
    meta.className = "meta";

    const name = document.createElement("p");
    name.className = "name";

    const gradBold = `<strong>${escapeHtml(item.grad || "")}</strong>`;
    const nomeBold = `<strong>${escapeHtml(item.nome_guerra || "")}</strong>`;

    // Somente graduação + nome de guerra
    name.innerHTML = `${gradBold} ${nomeBold}`;

    const extra = document.createElement("div");
    extra.className = "meta-extra";

    const isDelivered = item.status === "entregue";

    let dateHtml;
    if (isDelivered) {
      // Ex.: "Data de entrega: 05/12/2025"
      dateHtml = `<span class="date">Data de entrega: <strong>${fmtDate(
        item.data_entrega
      )}</strong></span>`;
    } else {
      // Quem ainda não entregou: apenas "Aguardando"
      dateHtml = `<span class="date">Aguardando</span>`;
    }

    extra.innerHTML = dateHtml;

    meta.appendChild(name);
    meta.appendChild(extra);

    const status = document.createElement("div");
    status.className = "status " + (isDelivered ? "delivered" : "pending");
    status.textContent = isDelivered ? "ENTREGUE" : "PENDENTE";

    wrap.appendChild(avatar);
    wrap.appendChild(meta);
    wrap.appendChild(status);

    listEl.appendChild(wrap);
  });

  // Atualiza estatísticas globais
  updateSummary();
}

// Atualiza contadores + barra de progresso
function updateSummary() {
  const delivered = allData.filter((d) => d.status === "entregue").length;
  const pending = allData.length - delivered;
  const total = allData.length || 0;

  const deliveredEl = $("#deliveredCount");
  const pendingEl = $("#pendingCount");
  const totalEl = $("#total");
  const progressFill = $("#progressFill");
  const progressLabel = $("#progressLabel");

  if (deliveredEl) deliveredEl.textContent = delivered;
  if (pendingEl) pendingEl.textContent = pending;
  if (totalEl) totalEl.textContent = total;

  const pct = total ? (delivered / total) * 100 : 0;

  if (progressFill) {
    progressFill.style.width = pct.toFixed(1) + "%";
  }

  if (progressLabel) {
    progressLabel.textContent = `${Math.round(
      pct
    )}% das declarações entregues`;
  }
}

// Atualiza contador regressivo do prazo
function updateCountdown(deadlineDate) {
  const countdownEl = $("#countdown");
  if (!countdownEl) return;

  const now = new Date();
  let diff = deadlineDate - now;

  if (diff <= 0) {
    countdownEl.textContent = "Prazo encerrado";
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  diff -= days * (1000 * 60 * 60 * 24);
  const hours = Math.floor(diff / (1000 * 60 * 60));
  diff -= hours * (1000 * 60 * 60);
  const mins = Math.floor(diff / (1000 * 60));

  countdownEl.textContent = `${days}d ${hours}h ${mins}min restantes`;
}

// Inicialização
(async () => {
  allData = await loadData();

  // Monta datalist de autocomplete
  buildAutocomplete();

  // Render inicial
  renderList("");

  // Busca
  const searchInput = $("#search");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      renderList(e.target.value);
    });
  }

  // Countdown
  updateCountdown(deadline);
  setInterval(() => updateCountdown(deadline), 60 * 1000);
})();

// :contentReference[oaicite:0]{index=0}
