/* ═══════════════════════════════════════════
   CINEMARK ADMIN — script.js
═══════════════════════════════════════════ */

// ── Referencias DOM ──
const ticketForm = document.getElementById("ticketForm");
const emailInput = document.getElementById("email");
const typeSelect = document.getElementById("type");
const venueSelect = document.getElementById("venue");
const functionDateInput = document.getElementById("functionDate");
const functionTimeSelect = document.getElementById("functionTime");
const paidStatusSelect = document.getElementById("paidStatus");
const notesInput = document.getElementById("notes");
const formMessage = document.getElementById("formMessage");
const ticketList = document.getElementById("ticketList");
const saveBtn = document.getElementById("saveBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const searchInput = document.getElementById("searchInput");
const statusAll = document.getElementById("statusAll");
const statusPending = document.getElementById("statusPending");
const statusPaid = document.getElementById("statusPaid");
const formSectionTitle = document.getElementById("formSectionTitle");
const formSectionSub = document.getElementById("formSectionSub");

// KPI
const totalCount = document.getElementById("totalCount");
const paidCount = document.getElementById("paidCount");
const pendingCount = document.getElementById("pendingCount");
const paidPct = document.getElementById("paidPct");
const pendingPct = document.getElementById("pendingPct");
const paidBar = document.getElementById("paidBar");
const pendingBar = document.getElementById("pendingBar");
const paymentPercent = document.getElementById("paymentPercent");
const revenueCount = document.getElementById("revenueCount");
const kpiTotalBar = document.getElementById("kpiTotalBar");
const paidCountBar = document.getElementById("paidCountBar");
const pendingCountBar = document.getElementById("pendingCountBar");

// Butacas
const seatMap = document.getElementById("seatMap");
const seatCountBadge = document.getElementById("seatCountBadge");
const selectedSeatsText = document.getElementById("selectedSeatsText");
const seatHint = document.getElementById("seatHint");
const unitPriceEl = document.getElementById("unitPrice");
const priceQuantityEl = document.getElementById("priceQuantity");
const ticketTotalEl = document.getElementById("ticketTotal");

// Modales
const deleteModalEl = document.getElementById("deleteModal");
const deleteModal = bootstrap.Modal.getOrCreateInstance(deleteModalEl);
const deleteModalText = document.getElementById("deleteModalText");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

const toggleModalEl = document.getElementById("toggleModal");
const toggleModal = bootstrap.Modal.getOrCreateInstance(toggleModalEl);
const toggleModalText = document.getElementById("toggleModalText");
const confirmToggleBtn = document.getElementById("confirmToggleBtn");

const toastContainer = document.getElementById("toastContainer");
const paginationControls = document.getElementById("paginationControls");
const trailerFrame = document.getElementById("trailerFrame");

// ── Configuración ──
const STORAGE_KEY = "cineticket_admin_tadc_v1";
const movieTitle = "The Amazing Digital Circus";
const TRAILER_URL =
  "https://www.youtube.com/embed/yQm6F1XCHaU?rel=0&showinfo=0";
const ITEMS_PER_PAGE = 5;

const prices = { Normal: 5000, VIP: 8500, "3D": 7000 };
const rows = ["A", "B", "C", "D", "E", "F"];
const seatsPerRow = 10;
const allowedTimes = ["17:00", "18:30", "19:30", "21:00"];
const allowedDateStart = "2026-06-04";
const allowedDateEnd = "2026-06-10";
const sedes = [
  "Mall Maipú",
  "Cinemark Alto Las Condes",
  "Mall Plaza Oeste",
  "Mall Plaza Ñuñoa",
];

// ── Estado ──
let tickets = cargarTickets();
let editingId = null;
let selectedSeats = [];
let pendingDeleteId = null;
let pendingToggleId = null;
let currentShowKey = "";
let submittedOnce = false;
let currentPage = 1;

// ── localStorage ──
function cargarTickets() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}
function guardarTickets() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
}

// ── Navegación SPA ──
const sections = ["pelicula", "dashboard", "registrar", "listado"];
const sidebarLinks = document.querySelectorAll(".sidebar-link[data-section]");

function irA(id) {
  sections.forEach((s) =>
    document.getElementById(s).classList.remove("active"),
  );
  const target = document.getElementById(id);
  if (target) target.classList.add("active");
  sidebarLinks.forEach((l) =>
    l.classList.toggle("active", l.dataset.section === id),
  );
  document.getElementById("sidebar").classList.remove("open");
}

sidebarLinks.forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    irA(link.dataset.section);
  });
});

document.getElementById("sidebarToggle").addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("open");
});

document
  .getElementById("goRegister")
  .addEventListener("click", () => irA("registrar"));
document
  .getElementById("goListado")
  .addEventListener("click", () => irA("listado"));
document
  .getElementById("goPelicula")
  .addEventListener("click", () => irA("pelicula"));

// ── Toast ──
function mostrarToast(mensaje, tipo = "success") {
  const el = document.createElement("div");
  const claro = ["warning", "info"].includes(tipo);
  el.className = `toast align-items-center border-0 bg-${tipo} ${claro ? "text-dark" : "text-white"}`;
  el.setAttribute("role", "alert");
  el.innerHTML = `<div class="d-flex"><div class="toast-body fw-semibold">${mensaje}</div><button type="button" class="btn-close ${claro ? "" : "btn-close-white"} me-2 m-auto" data-bs-dismiss="toast" aria-label="Cerrar"></button></div>`;
  toastContainer.appendChild(el);
  const t = new bootstrap.Toast(el, { delay: 3200 });
  el.addEventListener("hidden.bs.toast", () => el.remove());
  t.show();
}

// ── Mensajes formulario ──
function mostrarMensaje(txt, ok = false) {
  formMessage.textContent = txt;
  formMessage.className = `form-msg ${ok ? "ok" : "err"}`;
}
function limpiarMensaje() {
  formMessage.textContent = "";
  formMessage.className = "form-msg";
}

// ── Validaciones ──
function esEmailValido(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}
function esFechaValida(f) {
  if (!f) return false;
  const s = new Date(`${f}T00:00:00`);
  return (
    s >= new Date(`${allowedDateStart}T00:00:00`) &&
    s <= new Date(`${allowedDateEnd}T00:00:00`)
  );
}

// ── Datos formulario ──
function obtenerDatos() {
  return {
    movie: movieTitle,
    email: emailInput.value.trim().toLowerCase(),
    type: typeSelect.value,
    venue: venueSelect.value,
    functionDate: functionDateInput.value,
    functionTime: functionTimeSelect.value,
    notes: notesInput.value.trim(),
    seats: [...selectedSeats],
    paid: paidStatusSelect.value === "paid",
  };
}
function obtenerClaveShow(d) {
  if (!d.venue || !d.functionDate || !d.functionTime) return null;
  return `${d.venue}__${d.functionDate}__${d.functionTime}`;
}
function obtenerOcupadas(exceptId, claveShow) {
  const set = new Set();
  tickets.forEach((t) => {
    if (exceptId && t.id === exceptId) return;
    if (claveShow && obtenerClaveShow(t) !== claveShow) return;
    (t.seats || []).forEach((s) => set.add(s));
  });
  return set;
}
function validarTicket(d) {
  const err = [];
  if (!esEmailValido(d.email)) err.push("Correo inválido.");
  if (!["Normal", "VIP", "3D"].includes(d.type))
    err.push("Selecciona un tipo de entrada.");
  if (!sedes.includes(d.venue)) err.push("Selecciona una sede válida.");
  if (!esFechaValida(d.functionDate))
    err.push("La fecha debe estar entre el 4 y el 10 de junio de 2026.");
  if (!allowedTimes.includes(d.functionTime))
    err.push("Selecciona un horario válido.");
  if (d.notes && d.notes.length < 5)
    err.push("Las notas deben tener al menos 5 caracteres si se completan.");
  if (d.seats.length < 1) err.push("Debes seleccionar al menos una butaca.");
  const clave = obtenerClaveShow(d);
  const ocup = obtenerOcupadas(editingId, clave);
  const conf = d.seats.filter((s) => ocup.has(s));
  if (conf.length)
    err.push(`Butacas ya ocupadas en esta función: ${conf.join(", ")}`);
  return err;
}

// ── Validación visual ──
function marcar(input, ok) {
  input.classList.remove("is-valid", "is-invalid");
  input.classList.add(ok ? "is-valid" : "is-invalid");
}
function validarVisualmente() {
  const d = obtenerDatos();
  marcar(emailInput, esEmailValido(d.email));
  marcar(typeSelect, ["Normal", "VIP", "3D"].includes(d.type));
  marcar(venueSelect, sedes.includes(d.venue));
  marcar(functionDateInput, esFechaValida(d.functionDate));
  marcar(functionTimeSelect, allowedTimes.includes(d.functionTime));
  marcar(notesInput, d.notes === "" || d.notes.length >= 5);
}
function limpiarValidacion() {
  [
    emailInput,
    typeSelect,
    venueSelect,
    functionDateInput,
    functionTimeSelect,
    notesInput,
  ].forEach((el) => el.classList.remove("is-valid", "is-invalid"));
}

// ── Precios y butacas ──
function ordenarButacas(lista) {
  return [...lista].sort((a, b) => {
    if (a[0] !== b[0]) return a[0].localeCompare(b[0]);
    return Number(a.slice(1)) - Number(b.slice(1));
  });
}
function formatDinero(n) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(n);
}
function todasLasButacas() {
  const l = [];
  rows.forEach((f) => {
    for (let n = 1; n <= seatsPerRow; n++) l.push(f + n);
  });
  return l;
}
function actualizarPreciosUI() {
  const qty = selectedSeats.length;
  const pu = prices[typeSelect.value] || 0;
  unitPriceEl.textContent = formatDinero(pu);
  priceQuantityEl.textContent = String(qty);
  ticketTotalEl.textContent = formatDinero(pu * qty);
  seatCountBadge.textContent = `${qty} seleccionada${qty !== 1 ? "s" : ""}`;
  selectedSeatsText.textContent = qty
    ? `Butacas seleccionadas: ${ordenarButacas(selectedSeats).join(", ")}`
    : "Butacas seleccionadas: ninguna";
}

// ── Mapa de butacas ──
function renderizarMapa() {
  const d = obtenerDatos();
  const clave = obtenerClaveShow(d);
  seatMap.innerHTML = "";
  const ocup = clave ? obtenerOcupadas(editingId, clave) : new Set();
  if (clave) selectedSeats = selectedSeats.filter((s) => !ocup.has(s));
  else selectedSeats = [];
  seatHint.textContent = clave
    ? "Haz clic en una butaca disponible para seleccionarla."
    : "Selecciona sede, fecha y horario para habilitar el mapa.";

  todasLasButacas().forEach((cod) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "seat-btn";
    btn.textContent = cod;
    btn.setAttribute("aria-label", `Butaca ${cod}`);
    const ocupada = clave ? ocup.has(cod) : false;
    const seleccionada = selectedSeats.includes(cod);
    if (ocupada) {
      btn.classList.add("occupied");
      btn.disabled = true;
    } else if (seleccionada) {
      btn.classList.add("selected");
    } else {
      btn.classList.add("available");
    }
    if (!clave) btn.disabled = true;
    btn.addEventListener("click", () => {
      if (!clave) return;
      const idx = selectedSeats.indexOf(cod);
      if (idx !== -1) selectedSeats.splice(idx, 1);
      else {
        selectedSeats.push(cod);
        limpiarMensaje();
      }
      renderizarMapa();
      actualizarPreciosUI();
    });
    seatMap.appendChild(btn);
  });
  actualizarPreciosUI();
}

function actualizarContextoShow() {
  const d = obtenerDatos();
  const clave = obtenerClaveShow(d);
  if (clave !== currentShowKey) {
    currentShowKey = clave || "";
    selectedSeats = [];
    limpiarMensaje();
  }
  renderizarMapa();
}

// ── Reset / llenar formulario ──
function resetearFormulario() {
  ticketForm.reset();
  editingId = null;
  submittedOnce = false;
  selectedSeats = [];
  currentShowKey = "";
  saveBtn.textContent = "Registrar compra";
  cancelEditBtn.classList.add("d-none");
  formSectionTitle.textContent = "Registrar compra manual";
  formSectionSub.textContent =
    "Ingresa los datos del comprador y selecciona función y butacas.";
  limpiarMensaje();
  limpiarValidacion();
  actualizarPreciosUI();
  renderizarMapa();
}

function llenarFormulario(ticket) {
  emailInput.value = ticket.email;
  typeSelect.value = ticket.type;
  venueSelect.value = ticket.venue;
  functionDateInput.value = ticket.functionDate;
  functionTimeSelect.value = ticket.functionTime;
  paidStatusSelect.value = ticket.paid ? "paid" : "pending";
  notesInput.value = ticket.notes || "";
  selectedSeats = Array.isArray(ticket.seats) ? [...ticket.seats] : [];
  currentShowKey = obtenerClaveShow(ticket) || "";
  editingId = ticket.id;
  submittedOnce = false;
  saveBtn.textContent = "Guardar cambios";
  cancelEditBtn.classList.remove("d-none");
  formSectionTitle.textContent = "Editar compra";
  formSectionSub.textContent = "Modifica los datos y guarda los cambios.";
  limpiarMensaje();
  limpiarValidacion();
  actualizarPreciosUI();
  renderizarMapa();
  irA("registrar");
}

// ── CRUD ──
function agregarTicket(t) {
  tickets.unshift(t);
  guardarTickets();
  currentPage = 1;
  renderizarTickets();
}
function actualizarTicket(id, datos) {
  tickets = tickets.map((t) => (t.id === id ? { ...t, ...datos } : t));
  guardarTickets();
  renderizarTickets();
}
function eliminarTicket(id) {
  tickets = tickets.filter((t) => t.id !== id);
  guardarTickets();
  const maxPage = Math.ceil(getFiltered().length / ITEMS_PER_PAGE);
  if (currentPage > maxPage) currentPage = 1;
  renderizarTickets();
}
function togglePagado(id) {
  tickets = tickets.map((t) => (t.id === id ? { ...t, paid: !t.paid } : t));
  guardarTickets();
  renderizarTickets();
}
function totalTicket(t) {
  return (prices[t.type] || 0) * Number(t.quantity);
}

// ── Filtrado ──
function getFiltered() {
  const busq = searchInput.value.trim().toLowerCase();
  let estado = "Todos";
  if (statusPending.checked) estado = "Pendiente";
  else if (statusPaid.checked) estado = "Pagada";
  return tickets.filter((t) => {
    const est = t.paid ? "Pagada" : "Pendiente";
    const ok =
      t.venue.toLowerCase().includes(busq) ||
      t.email.toLowerCase().includes(busq);
    return ok && (estado === "Todos" || est === estado);
  });
}

// ── Renderizado principal ──
function renderizarTickets() {
  const filtrados = getFiltered();
  const total = tickets.length;
  const pagadas = tickets.filter((t) => t.paid).length;
  const pendientes = total - pagadas;
  const recaudado = tickets
    .filter((t) => t.paid)
    .reduce((s, t) => s + totalTicket(t), 0);
  const pctPag = total ? Math.round((pagadas / total) * 100) : 0;
  const pctPend = total ? 100 - pctPag : 0;

  // KPIs
  totalCount.textContent = total;
  paidCount.textContent = pagadas;
  pendingCount.textContent = pendientes;
  paidPct.textContent = total ? `${pctPag}% del total` : "—";
  pendingPct.textContent = total ? `${pctPend}% del total` : "—";
  revenueCount.textContent = formatDinero(recaudado);
  kpiTotalBar.style.width = total ? "100%" : "0%";
  paidCountBar.textContent = pagadas;
  pendingCountBar.textContent = pendientes;
  paidBar.style.width = `${pctPag}%`;
  paidBar.setAttribute("aria-valuenow", pctPag);
  pendingBar.style.width = `${pctPend}%`;
  pendingBar.setAttribute("aria-valuenow", pctPend);
  paymentPercent.textContent = total
    ? `${pagadas} pagadas · ${pendientes} pendientes`
    : "Sin entradas registradas aún.";

  // Paginación
  const totalPaginas = Math.ceil(filtrados.length / ITEMS_PER_PAGE);
  if (currentPage > totalPaginas) currentPage = totalPaginas || 1;
  const inicio = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginaActual = filtrados.slice(inicio, inicio + ITEMS_PER_PAGE);

  ticketList.innerHTML = "";

  if (paginaActual.length === 0) {
    ticketList.innerHTML = `<div class="empty-state">No hay entradas para mostrar con los filtros actuales.</div>`;
  } else {
    paginaActual.forEach((ticket) => {
      const butacas = Array.isArray(ticket.seats)
        ? ordenarButacas(ticket.seats).join(", ")
        : "Sin butacas";
      const esPagada = ticket.paid;
      const art = document.createElement("article");
      art.className = `card ticket-card ${esPagada ? "paid" : "pending"}`;
      art.innerHTML = `
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-2">
            <div>
              <h3>${ticket.movie}</h3>
              <div class="d-flex gap-2 flex-wrap mt-1">
                <span class="badge badge-type">Tipo: ${ticket.type}</span>
                <span class="badge badge-qty">Butacas: ${ticket.quantity}</span>
                <span class="badge ${esPagada ? "badge-paid" : "badge-pending"}">${esPagada ? "Pagada" : "Pendiente"}</span>
              </div>
            </div>
            <div class="ticket-meta text-end">
              <div>${ticket.email}</div>
              <div>${ticket.venue}</div>
            </div>
          </div>
          <div class="ticket-meta mb-1">
            Función: <strong>${ticket.functionDate}</strong> · <strong>${ticket.functionTime}</strong>
          </div>
          <div class="ticket-meta mb-1">
            Precio unitario: <strong>${formatDinero(prices[ticket.type] || 0)}</strong>
            &nbsp;·&nbsp; Total: <strong>${formatDinero(totalTicket(ticket))}</strong>
          </div>
          <div class="ticket-meta mb-2">Butacas: <strong>${butacas}</strong></div>
          ${ticket.notes ? `<div class="ticket-meta mb-2"><em>${ticket.notes}</em></div>` : ""}
          <div class="d-flex gap-2 flex-wrap mt-2">
            <button class="btn btn-sm btn-success btn-toggle" data-id="${ticket.id}">
              ${esPagada ? "Marcar pendiente" : "Marcar como pagada"}
            </button>
            <button class="btn btn-sm btn-warning btn-editar" data-id="${ticket.id}">Editar</button>
            <button class="btn btn-sm btn-danger btn-eliminar" data-id="${ticket.id}">Eliminar</button>
          </div>
        </div>`;

      // Botón toggle → abre modal de confirmación
      art.querySelector(".btn-toggle").addEventListener("click", () => {
        const t = tickets.find((x) => x.id === ticket.id);
        if (!t) return;
        pendingToggleId = ticket.id;
        toggleModalText.textContent = t.paid
          ? `¿Confirmas marcar esta entrada como PENDIENTE de pago?`
          : `¿Confirmas marcar esta entrada como PAGADA?`;
        confirmToggleBtn.className = t.paid
          ? "btn btn-warning"
          : "btn btn-success";
        confirmToggleBtn.textContent = t.paid
          ? "Sí, marcar pendiente"
          : "Sí, marcar pagada";
        toggleModal.show();
      });

      art.querySelector(".btn-editar").addEventListener("click", () => {
        const t = tickets.find((x) => x.id === ticket.id);
        if (t) llenarFormulario(t);
      });
      art
        .querySelector(".btn-eliminar")
        .addEventListener("click", () => abrirEliminar(ticket));
      ticketList.appendChild(art);
    });
  }

  // Controles de paginación
  paginationControls.innerHTML = "";
  if (totalPaginas <= 1) return;
  const crearLi = (i, txt) => {
    const li = document.createElement("li");
    li.className = `page-item ${i === currentPage ? "active" : ""} ${i < 1 || i > totalPaginas ? "disabled" : ""}`;
    li.innerHTML = `<a class="page-link" href="#">${txt || i}</a>`;
    li.addEventListener("click", (e) => {
      e.preventDefault();
      if (i >= 1 && i <= totalPaginas) {
        currentPage = i;
        renderizarTickets();
      }
    });
    return li;
  };
  paginationControls.appendChild(crearLi(currentPage - 1, "«"));
  let ini = Math.max(1, currentPage - 1);
  let fin = Math.min(totalPaginas, currentPage + 1);
  if (fin - ini < 2) {
    ini = 1 === ini ? 1 : Math.max(1, totalPaginas - 2);
    fin = Math.min(totalPaginas, ini + 2);
  }
  for (let i = ini; i <= fin; i++) paginationControls.appendChild(crearLi(i));
  paginationControls.appendChild(crearLi(currentPage + 1, "»"));
}

function abrirEliminar(ticket) {
  pendingDeleteId = ticket.id;
  deleteModalText.textContent = `¿Seguro que deseas eliminar la compra de "${ticket.movie}" — ${ticket.venue} (${ticket.functionDate} ${ticket.functionTime})?`;
  deleteModal.show();
}

// ── Listeners formulario ──
functionDateInput.min = allowedDateStart;
functionDateInput.max = allowedDateEnd;

ticketForm.addEventListener("submit", (e) => {
  e.preventDefault();
  submittedOnce = true;
  limpiarMensaje();
  const d = obtenerDatos();
  const err = validarTicket(d);
  validarVisualmente();
  if (err.length) {
    mostrarMensaje(err[0]);
    renderizarMapa();
    return;
  }

  const final = {
    movie: movieTitle,
    email: d.email,
    type: d.type,
    venue: d.venue,
    functionDate: d.functionDate,
    functionTime: d.functionTime,
    notes: d.notes,
    seats: ordenarButacas(d.seats),
    quantity: d.seats.length,
    paid: d.paid,
  };

  if (editingId) {
    actualizarTicket(editingId, final);
    mostrarToast("Compra actualizada correctamente", "success");
  } else {
    agregarTicket({
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      ...final,
    });
    mostrarToast("Compra registrada correctamente", "success");
  }
  resetearFormulario();
  irA("listado");
});

cancelEditBtn.addEventListener("click", () => {
  resetearFormulario();
  irA("listado");
});

// ── Listeners modales ──
confirmDeleteBtn.addEventListener("click", () => {
  if (!pendingDeleteId) return;
  eliminarTicket(pendingDeleteId);
  mostrarToast("Entrada eliminada", "danger");
  pendingDeleteId = null;
  deleteModal.hide();
});
deleteModalEl.addEventListener("hidden.bs.modal", () => {
  pendingDeleteId = null;
});

confirmToggleBtn.addEventListener("click", () => {
  if (!pendingToggleId) return;
  const t = tickets.find((x) => x.id === pendingToggleId);
  togglePagado(pendingToggleId);
  mostrarToast(
    t && t.paid
      ? "Entrada marcada como pendiente"
      : "Entrada marcada como pagada",
    "success",
  );
  pendingToggleId = null;
  toggleModal.hide();
});
toggleModalEl.addEventListener("hidden.bs.modal", () => {
  pendingToggleId = null;
});

// ── Filtros y búsqueda ──
[statusAll, statusPending, statusPaid].forEach((r) =>
  r.addEventListener("change", () => {
    currentPage = 1;
    renderizarTickets();
  }),
);
searchInput.addEventListener("input", () => {
  currentPage = 1;
  renderizarTickets();
});

// ── Contexto función ──
venueSelect.addEventListener("change", actualizarContextoShow);
functionDateInput.addEventListener("change", actualizarContextoShow);
functionTimeSelect.addEventListener("change", actualizarContextoShow);
typeSelect.addEventListener("change", actualizarPreciosUI);

// ── Validación blur (solo tras primer submit) ──
const blurRules = [
  [emailInput, (v) => esEmailValido(v)],
  [typeSelect, (v) => ["Normal", "VIP", "3D"].includes(v)],
  [venueSelect, (v) => sedes.includes(v)],
  [functionDateInput, (v) => esFechaValida(v)],
  [functionTimeSelect, (v) => allowedTimes.includes(v)],
  [notesInput, (v) => v === "" || v.length >= 5],
];
blurRules.forEach(([el, fn]) => {
  el.addEventListener("blur", () => {
    if (submittedOnce) marcar(el, fn(el.value.trim()));
  });
});

// ── Tráiler ──
const trailerModalEl = document.getElementById("trailerModal");
trailerModalEl.addEventListener("show.bs.modal", () => {
  trailerFrame.src = TRAILER_URL;
});
trailerModalEl.addEventListener("hidden.bs.modal", () => {
  trailerFrame.src = "";
});

// ── Init ──
renderizarTickets();
renderizarMapa();
actualizarPreciosUI();
