/* ═══════════════════════════════════════════════════════
   CINEMARK ADMIN — script.js
   Sumativa 2 · Procesamiento de formularios y DOM

   ── APOYO DE INTELIGENCIA ARTIFICIAL ──
   Herramienta utilizada: Claude Sonnet (claude.ai)

   Áreas donde se usó IA y razonamiento incorporado:
   ┌──────────────────────────────────────────────────────
   │ 1. ARQUITECTURA: La IA sugirió separar la lógica en
   │    capas (CONFIG → estado → utilidades → CRUD →
   │    render → eventos). Facilita mantenimiento y evita
   │    funciones monolíticas. Se adoptó completamente.
   │
   │ 2. SEGURIDAD XSS: La IA señaló el riesgo de insertar
   │    datos de usuario con innerHTML y propuso usar
   │    textContent + createElement. Se crearon sanitizar()
   │    y crearElemento() como wrappers explícitos.
   │
   │ 3. PATRONES DE ARRAYS: La IA recomendó usar flatMap,
   │    filter, reduce y spread en lugar de loops manuales
   │    para mayor claridad y menos errores.
   │
   │ 4. EVENT DELEGATION: La IA propuso un único listener
   │    en el contenedor padre en lugar de uno por tarjeta,
   │    evitando memory leaks al re-renderizar.
   │
   │ 5. DocumentFragment: La IA explicó que agrupar
   │    inserciones en un Fragment reduce los repaints del
   │    navegador, mejorando el rendimiento notablemente.
   │
   │ 6. JSDoc: La IA sugirió documentar cada función con
   │    @param y @returns para mayor claridad del código.
   └──────────────────────────────────────────────────────
   Ver detalles completos en USO_IA.md
════════════════════════════════════════════════════════ */

// ══════════════════════════════════════════
// 1. CONFIGURACIÓN — única fuente de verdad
// ══════════════════════════════════════════

/**
 * Objeto inmutable con toda la configuración de la aplicación.
 * Centralizar aquí evita "magic strings" dispersos por el código.
 * ASISTIDO POR IA: la IA recomendó Object.freeze() para garantizar
 * inmutabilidad en tiempo de ejecución y evitar mutaciones accidentales.
 */
const CONFIG = Object.freeze({
  storageKey: "cineticket_admin_tadc_v1",
  movieTitle: "The Amazing Digital Circus",
  trailerUrl: "https://www.youtube.com/embed/yQm6F1XCHaU?rel=0&showinfo=0",
  itemsPerPage: 5,
  prices: { Normal: 5000, VIP: 8500, "3D": 7000 },
  rows: ["A", "B", "C", "D", "E", "F"],
  seatsPerRow: 10,
  allowedTimes: ["17:00", "18:30", "19:30", "21:00"],
  dateStart: "2026-06-04",
  dateEnd: "2026-06-10",
  venues: [
    "Mall Maipú",
    "Cinemark Alto Las Condes",
    "Mall Plaza Oeste",
    "Mall Plaza Ñuñoa",
  ],
  days: [
    { date: "2026-06-04", label: "Jue 4", full: "Jueves 4 de junio" },
    { date: "2026-06-05", label: "Vie 5", full: "Viernes 5 de junio" },
    { date: "2026-06-06", label: "Sáb 6", full: "Sábado 6 de junio" },
    { date: "2026-06-07", label: "Dom 7", full: "Domingo 7 de junio" },
    { date: "2026-06-08", label: "Lun 8", full: "Lunes 8 de junio" },
    { date: "2026-06-09", label: "Mar 9", full: "Martes 9 de junio" },
    { date: "2026-06-10", label: "Mié 10", full: "Miércoles 10 de junio" },
  ],
});

// ══════════════════════════════════════════
// 2. ESTADO — objeto mutable centralizado
// ══════════════════════════════════════════

/** Estado mutable de la aplicación. Toda variable de estado vive aquí.
 *  ASISTIDO POR IA: la IA propuso agrupar el estado en un único objeto
 *  para evitar variables globales dispersas y facilitar la depuración. */
const state = {
  tickets: cargarTickets(),
  editingId: null,
  selectedSeats: [],
  pendingDeleteId: null,
  pendingToggleId: null,
  currentShowKey: "",
  submittedOnce: false,
  currentPage: 1,
  selectedDay: null,
};

// ══════════════════════════════════════════
// 3. REFERENCIAS DOM — agrupadas en un objeto
// ══════════════════════════════════════════

/** Shorthand para document.getElementById */
const $ = (id) => document.getElementById(id);

/** Todas las referencias al DOM en un solo objeto.
 *  Evita llamadas repetidas a getElementById durante el runtime. */
const DOM = {
  form: $("ticketForm"),
  email: $("email"),
  type: $("type"),
  venue: $("venue"),
  date: $("functionDate"),
  time: $("functionTime"),
  paidStatus: $("paidStatus"),
  notes: $("notes"),
  formMsg: $("formMessage"),
  saveBtn: $("saveBtn"),
  cancelBtn: $("cancelEditBtn"),
  formTitle: $("formSectionTitle"),
  formSub: $("formSectionSub"),
  seatMap: $("seatMap"),
  seatBadge: $("seatCountBadge"),
  seatsText: $("selectedSeatsText"),
  seatHint: $("seatHint"),
  unitPrice: $("unitPrice"),
  priceQty: $("priceQuantity"),
  ticketTotal: $("ticketTotal"),
  totalCount: $("totalCount"),
  paidCount: $("paidCount"),
  pendingCount: $("pendingCount"),
  paidPct: $("paidPct"),
  pendingPct: $("pendingPct"),
  revenueCount: $("revenueCount"),
  kpiBar: $("kpiTotalBar"),
  paidBar: $("paidBar"),
  pendingBar: $("pendingBar"),
  paymentPct: $("paymentPercent"),
  paidCountBar: $("paidCountBar"),
  pendingCountBar: $("pendingCountBar"),
  ticketList: $("ticketList"),
  searchInput: $("searchInput"),
  statusAll: $("statusAll"),
  statusPending: $("statusPending"),
  statusPaid: $("statusPaid"),
  pagination: $("paginationControls"),
  toastContainer: $("toastContainer"),
  deleteModalEl: $("deleteModal"),
  deleteModalText: $("deleteModalText"),
  confirmDeleteBtn: $("confirmDeleteBtn"),
  toggleModalEl: $("toggleModal"),
  toggleModalText: $("toggleModalText"),
  confirmToggleBtn: $("confirmToggleBtn"),
  trailerModalEl: $("trailerModal"),
  trailerFrame: $("trailerFrame"),
};

/** Instancias de los modales de Bootstrap */
const modals = {
  delete: bootstrap.Modal.getOrCreateInstance(DOM.deleteModalEl),
  toggle: bootstrap.Modal.getOrCreateInstance(DOM.toggleModalEl),
};

// ══════════════════════════════════════════
// 4. UTILIDADES — funciones puras reutilizables
// ══════════════════════════════════════════

/**
 * Sanitiza un valor a cadena de texto segura para uso en el DOM.
 * ASISTIDO POR IA: la IA señaló que insertar datos de usuario sin
 * sanitización previa permite ataques XSS. La combinación de esta
 * función con textContent (nunca innerHTML) garantiza que cualquier
 * carácter especial como <, > o " se trate como texto literal.
 * @param {unknown} val - Valor a convertir
 * @returns {string} Cadena segura sin riesgo de inyección
 */
function sanitizar(val) {
  return String(val ?? "").trim();
}

/**
 * Crea un elemento HTML con atributos y texto (XSS-safe).
 * Usa textContent internamente para insertar texto; jamás innerHTML
 * con datos externos. ASISTIDO POR IA: la IA propuso este wrapper
 * para estandarizar la creación de nodos y eliminar el riesgo de
 * olvidar escapar datos en alguna parte del código.
 * @param {string} tag - Nombre del elemento HTML
 * @param {Object} [attrs={}] - Atributos del elemento
 * @param {string} [text] - Texto (escapa entidades automáticamente)
 * @returns {HTMLElement}
 */
function crearElemento(tag, attrs = {}, text) {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === "className") el.className = v;
    else if (k === "dataset") Object.assign(el.dataset, v);
    else el.setAttribute(k, v);
  });
  if (text !== undefined) el.textContent = sanitizar(text); // seguro contra XSS
  return el;
}

/**
 * Formatea un número como moneda CLP (ej: $5.000).
 * @param {number} n
 * @returns {string}
 */
function formatDinero(n) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(n);
}

/**
 * Convierte una fecha YYYY-MM-DD al formato largo en español.
 * Ej: "2026-06-04" → "4 de junio de 2026"
 * Usa la zona horaria local fijando T00:00:00 para evitar
 * desfases de un día por UTC.
 * @param {string} fecha - Formato YYYY-MM-DD
 * @returns {string}
 */
function formatearFecha(fecha) {
  if (!fecha) return "—";
  return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Ordena un arreglo de códigos de butaca (A1, A2 … F10) correctamente.
 * Orden: alfabético por fila, numérico por número de asiento.
 * ASISTIDO POR IA: la IA señaló que un sort léxico estándar ordena
 * "A10" antes de "A2", y propuso comparar fila y número por separado.
 * @param {string[]} lista
 * @returns {string[]}
 */
function ordenarButacas(lista) {
  return [...lista].sort((a, b) =>
    a[0] !== b[0]
      ? a[0].localeCompare(b[0])
      : Number(a.slice(1)) - Number(b.slice(1)),
  );
}

/**
 * Calcula el precio total de un ticket (precio unitario × butacas).
 * @param {{ type: string, quantity: number }} t
 * @returns {number}
 */
function totalTicket(t) {
  return (CONFIG.prices[t.type] || 0) * Number(t.quantity);
}

/**
 * Genera todos los códigos de butaca disponibles en la sala (A1–F10).
 * ASISTIDO POR IA: la IA recomendó flatMap como alternativa más
 * concisa y declarativa al doble bucle for anidado.
 * @returns {string[]}
 */
function todasLasButacas() {
  return CONFIG.rows.flatMap((fila) =>
    Array.from({ length: CONFIG.seatsPerRow }, (_, i) => `${fila}${i + 1}`),
  );
}

// ══════════════════════════════════════════
// 5. PERSISTENCIA (localStorage)
// ══════════════════════════════════════════

/**
 * Lee y parsea los tickets desde localStorage.
 * El try/catch protege contra JSON malformado (seguridad defensiva).
 * ASISTIDO POR IA: la IA señaló que localStorage puede contener
 * datos corruptos si el usuario o una extensión los modificó, y
 * propuso envolver el parse en try/catch para evitar crashes.
 * @returns {Object[]}
 */
function cargarTickets() {
  try {
    return JSON.parse(localStorage.getItem(CONFIG.storageKey)) || [];
  } catch {
    return []; // datos corruptos → estado limpio
  }
}

/** Serializa y persiste el arreglo de tickets en localStorage. */
function guardarTickets() {
  localStorage.setItem(CONFIG.storageKey, JSON.stringify(state.tickets));
}

// ══════════════════════════════════════════
// 6. NAVEGACIÓN SPA
// ══════════════════════════════════════════

const sections = ["pelicula", "dashboard", "registrar", "listado"];
const sidebarLinks = document.querySelectorAll(".sidebar-link[data-section]");

/**
 * Activa una sección de la SPA y oculta las demás.
 * Actualiza el link activo en el sidebar.
 * @param {string} id - ID de la sección destino
 */
function irA(id) {
  sections.forEach((s) => $(s)?.classList.remove("active"));
  $(id)?.classList.add("active");
  sidebarLinks.forEach((l) =>
    l.classList.toggle("active", l.dataset.section === id),
  );
  $("sidebar").classList.remove("open");
}

sidebarLinks.forEach((link) =>
  link.addEventListener("click", (e) => {
    e.preventDefault();
    irA(link.dataset.section);
  }),
);

$("sidebarToggle").addEventListener("click", () =>
  $("sidebar").classList.toggle("open"),
);

// Quick-actions del dashboard mapeadas en un objeto para evitar repetición
// ASISTIDO POR IA: la IA sugirió este patrón para reemplazar tres
// addEventListener idénticos por un único forEach.
const quickActions = {
  goRegister: "registrar",
  goListado: "listado",
  goPelicula: "pelicula",
};
Object.entries(quickActions).forEach(([id, dest]) =>
  $(id)?.addEventListener("click", () => irA(dest)),
);

// ══════════════════════════════════════════
// 7. NOTIFICACIONES (Toast Bootstrap)
// ══════════════════════════════════════════

/**
 * Muestra un toast de notificación con autodestrucción.
 * ASISTIDO POR IA: la IA recomendó construir los toasts con
 * createElement en lugar de innerHTML para mantener la política
 * XSS-safe en toda la aplicación, sin excepciones.
 * @param {string} mensaje
 * @param {"success"|"danger"|"warning"|"info"} [tipo="success"]
 */
function mostrarToast(mensaje, tipo = "success") {
  const claro = ["warning", "info"].includes(tipo);
  const toast = crearElemento("div", {
    className: `toast align-items-center border-0 bg-${tipo} ${claro ? "text-dark" : "text-white"}`,
    role: "alert",
  });
  const inner = crearElemento("div", { className: "d-flex" });
  const body = crearElemento(
    "div",
    { className: "toast-body fw-semibold" },
    mensaje,
  );
  const close = crearElemento("button", {
    type: "button",
    className: `btn-close ${claro ? "" : "btn-close-white"} me-2 m-auto`,
    "data-bs-dismiss": "toast",
    "aria-label": "Cerrar",
  });
  inner.append(body, close);
  toast.appendChild(inner);
  DOM.toastContainer.appendChild(toast);
  toast.addEventListener("hidden.bs.toast", () => toast.remove());
  new bootstrap.Toast(toast, { delay: 3200 }).show();
}

// ══════════════════════════════════════════
// 8. MENSAJES DEL FORMULARIO
// ══════════════════════════════════════════

/** Muestra un mensaje de error o éxito bajo el formulario. */
function mostrarMensaje(txt, ok = false) {
  DOM.formMsg.textContent = sanitizar(txt);
  DOM.formMsg.className = `form-msg ${ok ? "ok" : "err"}`;
}

/** Limpia el mensaje del formulario. */
function limpiarMensaje() {
  DOM.formMsg.textContent = "";
  DOM.formMsg.className = "form-msg";
}

// ══════════════════════════════════════════
// 9. VALIDACIONES
// ══════════════════════════════════════════

/**
 * Valida formato de correo electrónico con regex.
 * ASISTIDO POR IA: la IA generó esta expresión regular y explicó
 * por qué patrones más simples como /\S+@\S+/ permiten correos
 * inválidos como "a@b" sin TLD.
 * @param {string} email
 * @returns {boolean}
 */
const esEmailValido = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/**
 * Verifica que la fecha esté dentro del rango de funciones permitido.
 * @param {string} fecha - Formato YYYY-MM-DD
 * @returns {boolean}
 */
function esFechaValida(fecha) {
  if (!fecha) return false;
  const d = new Date(`${fecha}T00:00:00`);
  const ini = new Date(`${CONFIG.dateStart}T00:00:00`);
  const fin = new Date(`${CONFIG.dateEnd}T00:00:00`);
  return d >= ini && d <= fin;
}

/**
 * Lee y normaliza los datos actuales del formulario en un objeto.
 * El email se normaliza a minúsculas para consistencia en los datos.
 * @returns {Object}
 */
function obtenerDatos() {
  return {
    movie: CONFIG.movieTitle,
    email: sanitizar(DOM.email.value).toLowerCase(),
    type: DOM.type.value,
    venue: DOM.venue.value,
    functionDate: DOM.date.value,
    functionTime: DOM.time.value,
    notes: sanitizar(DOM.notes.value),
    seats: [...state.selectedSeats],
    paid: DOM.paidStatus.value === "paid",
  };
}

/**
 * Genera una clave compuesta que identifica unívocamente una función.
 * Retorna null si algún campo está vacío.
 * @param {{ venue, functionDate, functionTime }} d
 * @returns {string|null}
 */
const obtenerClaveShow = (d) =>
  d.venue && d.functionDate && d.functionTime
    ? `${d.venue}__${d.functionDate}__${d.functionTime}`
    : null;

/**
 * Devuelve el Set de butacas ocupadas en una función, excluyendo
 * opcionalmente el ticket en edición para no auto-bloquearse.
 * @param {string|null} exceptId - ID del ticket actualmente en edición
 * @param {string|null} claveShow - Clave de función a consultar
 * @returns {Set<string>}
 */
function obtenerOcupadas(exceptId, claveShow) {
  const ocupadas = new Set();
  state.tickets.forEach((t) => {
    if (exceptId && t.id === exceptId) return;
    if (claveShow && obtenerClaveShow(t) !== claveShow) return;
    t.seats?.forEach((s) => ocupadas.add(s));
  });
  return ocupadas;
}

/**
 * Valida los datos del formulario y devuelve todos los errores encontrados.
 * Retorna [] si todo es válido (sin efectos secundarios en el DOM).
 * ASISTIDO POR IA: la IA propuso separar la validación de la UI
 * (función pura que retorna errores) del código que marca los campos,
 * siguiendo el principio de responsabilidad única.
 * @param {Object} d - Datos del formulario
 * @returns {string[]} Array de mensajes de error
 */
function validarTicket(d) {
  const errores = [];
  if (!esEmailValido(d.email)) errores.push("Correo inválido.");
  if (!CONFIG.prices[d.type]) errores.push("Selecciona un tipo de entrada.");
  if (!CONFIG.venues.includes(d.venue))
    errores.push("Selecciona una sede válida.");
  if (!esFechaValida(d.functionDate))
    errores.push("La fecha debe estar entre el 4 y el 10 de junio de 2026.");
  if (!CONFIG.allowedTimes.includes(d.functionTime))
    errores.push("Selecciona un horario válido.");
  if (d.notes && d.notes.length < 5)
    errores.push(
      "Las notas deben tener al menos 5 caracteres si se completan.",
    );
  if (!d.seats.length) errores.push("Debes seleccionar al menos una butaca.");

  // Verificar conflictos con butacas ya ocupadas en esa función
  const ocupadas = obtenerOcupadas(state.editingId, obtenerClaveShow(d));
  const conflictos = d.seats.filter((s) => ocupadas.has(s));
  if (conflictos.length)
    errores.push(
      `Butacas ya ocupadas en esta función: ${conflictos.join(", ")}`,
    );

  return errores;
}

// ── Validación visual (clases Bootstrap is-valid / is-invalid) ──

/** Pares [elemento, función de validación] — reutilizados en blur y submit */
const reglasValidacion = [
  [DOM.email, (v) => esEmailValido(v)],
  [DOM.type, (v) => !!CONFIG.prices[v]],
  [DOM.venue, (v) => CONFIG.venues.includes(v)],
  [DOM.date, (v) => esFechaValida(v)],
  [DOM.time, (v) => CONFIG.allowedTimes.includes(v)],
  [DOM.notes, (v) => v === "" || v.length >= 5],
];

/** Aplica clase is-valid o is-invalid a un input. */
function marcar(input, ok) {
  input.classList.toggle("is-valid", ok);
  input.classList.toggle("is-invalid", !ok);
}

/** Ejecuta todas las validaciones visuales usando el arreglo de reglas. */
function validarVisualmente() {
  reglasValidacion.forEach(([el, fn]) => marcar(el, fn(el.value.trim())));
}

/** Elimina todas las clases de validación visual del formulario. */
function limpiarValidacion() {
  reglasValidacion.forEach(([el]) =>
    el.classList.remove("is-valid", "is-invalid"),
  );
}

// ══════════════════════════════════════════
// 10. MAPA DE BUTACAS
// ══════════════════════════════════════════

/**
 * Actualiza los valores del resumen de precios y el badge de butacas.
 * Llamado cada vez que cambia la selección o el tipo de entrada.
 */
function actualizarPreciosUI() {
  const qty = state.selectedSeats.length;
  const pu = CONFIG.prices[DOM.type.value] || 0;
  DOM.unitPrice.textContent = formatDinero(pu);
  DOM.priceQty.textContent = String(qty);
  DOM.ticketTotal.textContent = formatDinero(pu * qty);
  DOM.seatBadge.textContent = `${qty} seleccionada${qty !== 1 ? "s" : ""}`;
  DOM.seatsText.textContent = qty
    ? `Butacas seleccionadas: ${ordenarButacas(state.selectedSeats).join(", ")}`
    : "Butacas seleccionadas: ninguna";
}

/**
 * Renderiza el mapa de butacas con estado actual (disponible, seleccionada, ocupada).
 * ASISTIDO POR IA: la IA recomendó DocumentFragment para agrupar todas
 * las inserciones y hacer un solo append al DOM, reduciendo repaints
 * de 60 (una por butaca) a 1.
 */
function renderizarMapa() {
  const d = obtenerDatos();
  const clave = obtenerClaveShow(d);
  const ocupadas = clave ? obtenerOcupadas(state.editingId, clave) : new Set();

  state.selectedSeats = clave
    ? state.selectedSeats.filter((s) => !ocupadas.has(s))
    : [];

  DOM.seatHint.textContent = clave
    ? "Haz clic en una butaca disponible para seleccionarla."
    : "Selecciona sede, fecha y horario para habilitar el mapa.";

  const frag = document.createDocumentFragment();
  todasLasButacas().forEach((cod) => {
    const esOcupada = ocupadas.has(cod);
    const esSeleccionada = state.selectedSeats.includes(cod);
    const estado = esOcupada
      ? "occupied"
      : esSeleccionada
        ? "selected"
        : "available";

    const btn = crearElemento(
      "button",
      {
        type: "button",
        className: `seat-btn ${estado}`,
        "aria-label": `Butaca ${cod}${esOcupada ? " (ocupada)" : esSeleccionada ? " (seleccionada)" : ""}`,
      },
      cod,
    );

    if (esOcupada || !clave) btn.disabled = true;

    btn.addEventListener("click", () => {
      const idx = state.selectedSeats.indexOf(cod);
      if (idx !== -1) state.selectedSeats.splice(idx, 1);
      else {
        state.selectedSeats.push(cod);
        limpiarMensaje();
      }
      renderizarMapa();
      actualizarPreciosUI();
    });

    frag.appendChild(btn);
  });

  DOM.seatMap.innerHTML = "";
  DOM.seatMap.appendChild(frag);
  actualizarPreciosUI();
}

/**
 * Detecta si cambió la función seleccionada (sede + fecha + horario).
 * Si cambió, resetea la selección de butacas para evitar conflictos.
 */
function actualizarContextoShow() {
  const nuevaClave = obtenerClaveShow(obtenerDatos()) || "";
  if (nuevaClave !== state.currentShowKey) {
    state.currentShowKey = nuevaClave;
    state.selectedSeats = [];
    limpiarMensaje();
  }
  renderizarMapa();
}

// ══════════════════════════════════════════
// 11. FORMULARIO: RESET / PRECARGA
// ══════════════════════════════════════════

/** Restablece el formulario a su estado inicial (alta de nueva compra). */
function resetearFormulario() {
  DOM.form.reset();
  Object.assign(state, {
    editingId: null,
    submittedOnce: false,
    selectedSeats: [],
    currentShowKey: "",
  });
  DOM.saveBtn.textContent = "Registrar compra";
  DOM.cancelBtn.classList.add("d-none");
  DOM.formTitle.textContent = "Registrar compra manual";
  DOM.formSub.textContent =
    "Ingresa los datos del comprador y selecciona función y butacas.";
  limpiarMensaje();
  limpiarValidacion();
  actualizarPreciosUI();
  renderizarMapa();
}

/**
 * Precarga los datos de un ticket existente en el formulario para edición.
 * @param {Object} ticket - Ticket a editar
 */
function llenarFormulario(ticket) {
  DOM.email.value = ticket.email;
  DOM.type.value = ticket.type;
  DOM.venue.value = ticket.venue;
  DOM.date.value = ticket.functionDate;
  DOM.time.value = ticket.functionTime;
  DOM.paidStatus.value = ticket.paid ? "paid" : "pending";
  DOM.notes.value = ticket.notes || "";

  state.selectedSeats = Array.isArray(ticket.seats) ? [...ticket.seats] : [];
  state.currentShowKey = obtenerClaveShow(ticket) || "";
  state.editingId = ticket.id;
  state.submittedOnce = false;

  DOM.saveBtn.textContent = "Guardar cambios";
  DOM.cancelBtn.classList.remove("d-none");
  DOM.formTitle.textContent = "Editar compra";
  DOM.formSub.textContent = "Modifica los datos y guarda los cambios.";

  limpiarMensaje();
  limpiarValidacion();
  actualizarPreciosUI();
  renderizarMapa();
  irA("registrar");
}

// ══════════════════════════════════════════
// 12. CRUD — operaciones sobre el arreglo
// ══════════════════════════════════════════

/**
 * Agrega un nuevo ticket al inicio del arreglo (más reciente primero).
 * @param {Object} t - Objeto ticket con todos sus campos
 */
function agregarTicket(t) {
  state.tickets.unshift(t);
  guardarTickets();
  state.currentPage = 1;
  renderizar();
}

/**
 * Actualiza un ticket existente por su ID usando spread (inmutabilidad).
 * ASISTIDO POR IA: la IA explicó que mutar directamente los objetos
 * dentro del arreglo puede causar bugs difíciles de rastrear; propuso
 * usar .map() con spread para crear nuevos objetos en cada actualización.
 * @param {string} id
 * @param {Object} datos
 */
function actualizarTicket(id, datos) {
  state.tickets = state.tickets.map((t) =>
    t.id === id ? { ...t, ...datos } : t,
  );
  guardarTickets();
  renderizar();
}

/**
 * Elimina un ticket por su ID y ajusta la página actual si es necesario.
 * @param {string} id
 */
function eliminarTicket(id) {
  state.tickets = state.tickets.filter((t) => t.id !== id);
  guardarTickets();
  const maxPag = Math.ceil(getFiltered().length / CONFIG.itemsPerPage);
  if (state.currentPage > maxPag) state.currentPage = 1;
  renderizar();
}

/**
 * Alterna el estado de pago de un ticket (pagado ↔ pendiente).
 * @param {string} id
 */
function togglePagado(id) {
  state.tickets = state.tickets.map((t) =>
    t.id === id ? { ...t, paid: !t.paid } : t,
  );
  guardarTickets();
  renderizar();
}

// ══════════════════════════════════════════
// 13. FILTRADO
// ══════════════════════════════════════════

/**
 * Aplica los filtros activos (texto y estado de pago) al arreglo de tickets.
 * El filtro de texto busca en sede y correo de forma case-insensitive.
 * @returns {Object[]} Tickets que cumplen todos los filtros
 */
function getFiltered() {
  const busq = DOM.searchInput.value.trim().toLowerCase();
  const estado = DOM.statusPending.checked
    ? "Pendiente"
    : DOM.statusPaid.checked
      ? "Pagada"
      : "Todos";

  return state.tickets.filter((t) => {
    const coincide =
      t.venue.toLowerCase().includes(busq) ||
      t.email.toLowerCase().includes(busq);
    const est = t.paid ? "Pagada" : "Pendiente";
    return coincide && (estado === "Todos" || est === estado);
  });
}

// ══════════════════════════════════════════
// 14. KPIs — cálculo de estadísticas
// ══════════════════════════════════════════

/**
 * Calcula las estadísticas globales de todos los tickets.
 * Función pura: no modifica estado ni el DOM.
 * ASISTIDO POR IA: la IA propuso separar el cálculo (calcStats) del
 * render (actualizarKPIs), aplicando el principio de responsabilidad
 * única para facilitar pruebas y reutilización.
 * @returns {{ total, pagadas, pendientes, recaudado, pctPag, pctPend }}
 */
function calcStats() {
  const total = state.tickets.length;
  const pagadas = state.tickets.filter((t) => t.paid).length;
  const pendientes = total - pagadas;
  const recaudado = state.tickets
    .filter((t) => t.paid)
    .reduce((s, t) => s + totalTicket(t), 0);
  const pctPag = total ? Math.round((pagadas / total) * 100) : 0;
  const pctPend = total ? 100 - pctPag : 0;
  return { total, pagadas, pendientes, recaudado, pctPag, pctPend };
}

/** Actualiza todos los elementos KPI del dashboard con las estadísticas actuales. */
function actualizarKPIs() {
  const { total, pagadas, pendientes, recaudado, pctPag, pctPend } =
    calcStats();

  DOM.totalCount.textContent = total;
  DOM.paidCount.textContent = pagadas;
  DOM.pendingCount.textContent = pendientes;
  DOM.paidPct.textContent = total ? `${pctPag}% del total` : "—";
  DOM.pendingPct.textContent = total ? `${pctPend}% del total` : "—";
  DOM.revenueCount.textContent = formatDinero(recaudado);
  DOM.kpiBar.style.width = total ? "100%" : "0%";
  DOM.paidCountBar.textContent = pagadas;
  DOM.pendingCountBar.textContent = pendientes;
  DOM.paidBar.style.width = `${pctPag}%`;
  DOM.paidBar.setAttribute("aria-valuenow", pctPag);
  DOM.pendingBar.style.width = `${pctPend}%`;
  DOM.pendingBar.setAttribute("aria-valuenow", pctPend);
  DOM.paymentPct.textContent = total
    ? `${pagadas} pagadas · ${pendientes} pendientes`
    : "Sin entradas registradas aún.";
}

// ══════════════════════════════════════════
// 15. TARJETA DE TICKET — construcción XSS-safe
// ══════════════════════════════════════════

/**
 * Construye el elemento article de una tarjeta de ticket.
 *
 * SEGURIDAD: todos los datos del usuario se insertan con textContent
 * a través de crearElemento() y sanitizar(). Nunca se usa innerHTML
 * con datos provenientes de formularios para evitar ataques XSS.
 * ASISTIDO POR IA: la IA auditó esta función específicamente y
 * confirmó que el flujo es seguro, pero recomendó añadir sanitizar()
 * como capa explícita adicional de defensa.
 *
 * @param {Object} ticket - Objeto ticket a renderizar
 * @returns {HTMLElement}
 */
function crearTarjetaTicket(ticket) {
  const esPagada = ticket.paid;
  const butacas = Array.isArray(ticket.seats)
    ? ordenarButacas(ticket.seats).join(", ")
    : "Sin butacas";

  const art = crearElemento("article", {
    className: `card ticket-card ${esPagada ? "paid" : "pending"}`,
    dataset: { id: ticket.id },
  });
  const body = crearElemento("div", { className: "card-body" });

  // ── Encabezado ──
  const top = crearElemento("div", {
    className:
      "d-flex justify-content-between align-items-start flex-wrap gap-2 mb-2",
  });
  const leftDiv = crearElemento("div");
  const title = crearElemento("h3", {}, ticket.movie);
  const badgeRow = crearElemento("div", {
    className: "d-flex gap-2 flex-wrap mt-1",
  });
  badgeRow.append(
    crearElemento(
      "span",
      { className: "badge badge-type" },
      `Tipo: ${ticket.type}`,
    ),
    crearElemento(
      "span",
      { className: "badge badge-qty" },
      `Butacas: ${ticket.quantity}`,
    ),
    crearElemento(
      "span",
      { className: `badge ${esPagada ? "badge-paid" : "badge-pending"}` },
      esPagada ? "Pagada" : "Pendiente",
    ),
  );
  leftDiv.append(title, badgeRow);

  const rightDiv = crearElemento("div", { className: "ticket-meta text-end" });
  rightDiv.append(
    crearElemento("div", {}, ticket.email),
    crearElemento("div", {}, ticket.venue),
  );
  top.append(leftDiv, rightDiv);

  // ── Detalles de la función (fecha formateada en español) ──
  const detFuncion = crearElemento("div", { className: "ticket-meta mb-1" });
  detFuncion.append(
    document.createTextNode("Función: "),
    crearElemento("strong", {}, formatearFecha(ticket.functionDate)),
    document.createTextNode(" · "),
    crearElemento("strong", {}, ticket.functionTime),
  );

  const detPrecio = crearElemento("div", { className: "ticket-meta mb-1" });
  detPrecio.append(
    document.createTextNode("Precio unitario: "),
    crearElemento("strong", {}, formatDinero(CONFIG.prices[ticket.type] || 0)),
    document.createTextNode("   ·   Total: "),
    crearElemento("strong", {}, formatDinero(totalTicket(ticket))),
  );

  const detButacas = crearElemento("div", { className: "ticket-meta mb-2" });
  detButacas.append(
    document.createTextNode("Butacas: "),
    crearElemento("strong", {}, butacas),
  );

  // ── Botones de acción ──
  const actions = crearElemento("div", {
    className: "d-flex gap-2 flex-wrap mt-2",
  });
  const btnToggle = crearElemento(
    "button",
    {
      className: "btn btn-sm btn-success btn-toggle",
      dataset: { id: ticket.id },
    },
    esPagada ? "Marcar pendiente" : "Marcar como pagada",
  );
  const btnEditar = crearElemento(
    "button",
    {
      className: "btn btn-sm btn-warning btn-editar",
      dataset: { id: ticket.id },
    },
    "Editar",
  );
  const btnEliminar = crearElemento(
    "button",
    {
      className: "btn btn-sm btn-danger btn-eliminar",
      dataset: { id: ticket.id },
    },
    "Eliminar",
  );
  actions.append(btnToggle, btnEditar, btnEliminar);

  body.append(top, detFuncion, detPrecio, detButacas);

  if (ticket.notes) {
    const nota = crearElemento("div", { className: "ticket-meta mb-2" });
    nota.appendChild(crearElemento("em", {}, ticket.notes));
    body.appendChild(nota);
  }

  body.appendChild(actions);
  art.appendChild(body);
  return art;
}

// ══════════════════════════════════════════
// 16. LISTADO — renderizado con event delegation
// ══════════════════════════════════════════

/** Renderiza el listado paginado de tickets con los filtros activos. */
function renderizarListado() {
  const filtrados = getFiltered();
  const totalPags = Math.ceil(filtrados.length / CONFIG.itemsPerPage);
  if (state.currentPage > totalPags) state.currentPage = totalPags || 1;
  const inicio = (state.currentPage - 1) * CONFIG.itemsPerPage;
  const pagina = filtrados.slice(inicio, inicio + CONFIG.itemsPerPage);

  DOM.ticketList.innerHTML = "";

  if (!pagina.length) {
    DOM.ticketList.appendChild(
      crearElemento(
        "div",
        { className: "empty-state" },
        "No hay entradas para mostrar con los filtros actuales.",
      ),
    );
  } else {
    // ASISTIDO POR IA: DocumentFragment para insertar todas las tarjetas
    // en una sola operación y evitar múltiples repaints del navegador.
    const frag = document.createDocumentFragment();
    pagina.forEach((t) => frag.appendChild(crearTarjetaTicket(t)));
    DOM.ticketList.appendChild(frag);
  }

  renderizarPaginacion(totalPags);
}

/**
 * Renderiza los controles de paginación.
 * @param {number} totalPags
 */
function renderizarPaginacion(totalPags) {
  DOM.pagination.innerHTML = "";
  if (totalPags <= 1) return;

  const crearLi = (pagina, texto) => {
    const li = crearElemento("li", {
      className: `page-item ${pagina === state.currentPage ? "active" : ""} ${pagina < 1 || pagina > totalPags ? "disabled" : ""}`,
    });
    const a = crearElemento(
      "a",
      { className: "page-link", href: "#" },
      texto || String(pagina),
    );
    a.addEventListener("click", (e) => {
      e.preventDefault();
      if (pagina >= 1 && pagina <= totalPags) {
        state.currentPage = pagina;
        renderizar();
      }
    });
    li.appendChild(a);
    return li;
  };

  DOM.pagination.appendChild(crearLi(state.currentPage - 1, "«"));
  let ini = Math.max(1, state.currentPage - 1);
  let fin = Math.min(totalPags, state.currentPage + 1);
  if (fin - ini < 2) {
    ini = ini === 1 ? 1 : Math.max(1, totalPags - 2);
    fin = Math.min(totalPags, ini + 2);
  }
  for (let i = ini; i <= fin; i++) DOM.pagination.appendChild(crearLi(i));
  DOM.pagination.appendChild(crearLi(state.currentPage + 1, "»"));
}

// ══════════════════════════════════════════
// 17. DASHBOARD — panel de días y horarios
// ══════════════════════════════════════════

/** Renderiza los botones de selección de días en el dashboard. */
function renderizarBotonesDias() {
  const group = $("daysBtnGroup");
  if (!group) return;
  const frag = document.createDocumentFragment();

  CONFIG.days.forEach(({ date, label }) => {
    const count = state.tickets.filter((t) => t.functionDate === date).length;
    const btn = crearElemento("button", {
      type: "button",
      className: `btn days-btn${state.selectedDay === date ? " days-btn-active" : ""}`,
    });
    btn.appendChild(
      crearElemento("span", { className: "days-btn-label" }, label),
    );
    if (count > 0)
      btn.appendChild(
        crearElemento("span", { className: "days-btn-badge" }, String(count)),
      );

    btn.addEventListener("click", () => {
      state.selectedDay = state.selectedDay === date ? null : date;
      renderizarBotonesDias();
      renderizarDetalleDia();
    });
    frag.appendChild(btn);
  });

  group.innerHTML = "";
  group.appendChild(frag);
}

/**
 * Renderiza el detalle de horarios del día seleccionado en el dashboard.
 * Muestra compras, butacas, pagadas, pendientes y recaudación por horario.
 */
function renderizarDetalleDia() {
  const panel = $("dayDetail");
  if (!panel) return;

  if (!state.selectedDay) {
    panel.innerHTML = "";
    panel.appendChild(
      crearElemento(
        "div",
        { className: "day-empty" },
        "Selecciona un día para ver los horarios y entradas registradas.",
      ),
    );
    return;
  }

  const dia = CONFIG.days.find((d) => d.date === state.selectedDay);
  const delDia = state.tickets.filter(
    (t) => t.functionDate === state.selectedDay,
  );
  const totalDia = delDia.length;

  const header = crearElemento("div", { className: "day-detail-header" });
  header.append(
    crearElemento("span", { className: "day-detail-title" }, dia.full),
    crearElemento(
      "span",
      { className: "day-detail-pill" },
      `${totalDia} entrada${totalDia !== 1 ? "s" : ""} registrada${totalDia !== 1 ? "s" : ""}`,
    ),
  );

  const grid = crearElemento("div", { className: "day-slots-grid" });

  CONFIG.allowedTimes.forEach((time) => {
    const enHorario = delDia.filter((t) => t.functionTime === time);
    const count = enHorario.length;
    const pagadas = enHorario.filter((t) => t.paid).length;
    const pendientes = count - pagadas;
    const butacas = enHorario.reduce((s, t) => s + Number(t.quantity), 0);
    const recaudado = enHorario
      .filter((t) => t.paid)
      .reduce((s, t) => s + totalTicket(t), 0);

    const card = crearElemento("div", {
      className: `day-slot-card${count === 0 ? " day-slot-empty" : ""}`,
    });
    card.appendChild(crearElemento("div", { className: "slot-time" }, time));

    if (count === 0) {
      card.appendChild(
        crearElemento(
          "div",
          { className: "slot-no-entries" },
          "Sin entradas registradas",
        ),
      );
    } else {
      const crearStat = (label, val, extra = "") => {
        const d = crearElemento("div", {
          className: `slot-stat${extra ? " " + extra : ""}`,
        });
        d.append(
          crearElemento("span", { className: "slot-stat-label" }, label),
          crearElemento("strong", { className: "slot-stat-val" }, val),
        );
        return d;
      };
      const stats = crearElemento("div", { className: "slot-stats" });
      stats.append(
        crearStat("Compras", String(count)),
        crearStat("Butacas", String(butacas)),
        crearStat("Pagadas", String(pagadas), "slot-stat-paid"),
        crearStat("Pendientes", String(pendientes), "slot-stat-pending"),
        crearStat("Recaudado", formatDinero(recaudado), "slot-stat-revenue"),
      );
      card.appendChild(stats);
    }
    grid.appendChild(card);
  });

  panel.innerHTML = "";
  panel.append(header, grid);
}

// ══════════════════════════════════════════
// 18. FUNCIÓN CENTRAL DE RENDER
// ══════════════════════════════════════════

/**
 * Actualiza toda la interfaz: KPIs, listado, panel de días.
 * Llamada después de cualquier operación CRUD.
 */
function renderizar() {
  actualizarKPIs();
  renderizarListado();
  renderizarBotonesDias();
  renderizarDetalleDia();
}

// ══════════════════════════════════════════
// 19. LISTENERS — FORMULARIO
// ══════════════════════════════════════════

DOM.date.min = CONFIG.dateStart;
DOM.date.max = CONFIG.dateEnd;

DOM.form.addEventListener("submit", (e) => {
  e.preventDefault();
  state.submittedOnce = true;
  limpiarMensaje();

  const d = obtenerDatos();
  const errores = validarTicket(d);
  validarVisualmente();

  if (errores.length) {
    mostrarMensaje(errores[0]);
    renderizarMapa();
    return;
  }

  const datos = {
    movie: CONFIG.movieTitle,
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

  if (state.editingId) {
    actualizarTicket(state.editingId, datos);
    mostrarToast("Compra actualizada correctamente", "success");
  } else {
    agregarTicket({
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      ...datos,
    });
    mostrarToast("Compra registrada correctamente", "success");
  }

  resetearFormulario();
  irA("listado");
});

DOM.cancelBtn.addEventListener("click", () => {
  resetearFormulario();
  irA("listado");
});

// ══════════════════════════════════════════
// 20. EVENT DELEGATION — LISTADO DE TICKETS
//
// Un único listener en el contenedor padre maneja los clics
// de todas las tarjetas (toggle, editar, eliminar).
// ASISTIDO POR IA: la IA explicó que añadir un listener por tarjeta
// genera memory leaks al re-renderizar la lista, y propuso event
// delegation como solución estándar para listas dinámicas.
// ══════════════════════════════════════════

DOM.ticketList.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-id]");
  if (!btn) return;

  const id = btn.dataset.id;
  const t = state.tickets.find((x) => x.id === id);
  if (!t) return;

  if (btn.classList.contains("btn-toggle")) {
    state.pendingToggleId = id;
    DOM.toggleModalText.textContent = t.paid
      ? "¿Confirmas marcar esta entrada como PENDIENTE de pago?"
      : "¿Confirmas marcar esta entrada como PAGADA?";
    DOM.confirmToggleBtn.className = t.paid
      ? "btn btn-warning"
      : "btn btn-success";
    DOM.confirmToggleBtn.textContent = t.paid
      ? "Sí, marcar pendiente"
      : "Sí, marcar pagada";
    modals.toggle.show();
  } else if (btn.classList.contains("btn-editar")) {
    llenarFormulario(t);
  } else if (btn.classList.contains("btn-eliminar")) {
    state.pendingDeleteId = id;
    // textContent es XSS-safe: sanitizar() garantiza que venue/date
    // se traten como texto literal incluso si contienen caracteres HTML.
    DOM.deleteModalText.textContent = sanitizar(
      `¿Seguro que deseas eliminar la compra de "${t.movie}" — ${t.venue} (${formatearFecha(t.functionDate)} ${t.functionTime})?`,
    );
    modals.delete.show();
  }
});

// ══════════════════════════════════════════
// 21. LISTENERS — MODALES DE CONFIRMACIÓN
// ══════════════════════════════════════════

DOM.confirmDeleteBtn.addEventListener("click", () => {
  if (!state.pendingDeleteId) return;
  eliminarTicket(state.pendingDeleteId);
  mostrarToast("Entrada eliminada", "danger");
  state.pendingDeleteId = null;
  modals.delete.hide();
});
DOM.deleteModalEl.addEventListener("hidden.bs.modal", () => {
  state.pendingDeleteId = null;
});

DOM.confirmToggleBtn.addEventListener("click", () => {
  if (!state.pendingToggleId) return;
  const t = state.tickets.find((x) => x.id === state.pendingToggleId);
  const eraPagada = t?.paid;
  togglePagado(state.pendingToggleId);
  mostrarToast(
    eraPagada
      ? "Entrada marcada como pendiente"
      : "Entrada marcada como pagada",
    "success",
  );
  state.pendingToggleId = null;
  modals.toggle.hide();
});
DOM.toggleModalEl.addEventListener("hidden.bs.modal", () => {
  state.pendingToggleId = null;
});

// ══════════════════════════════════════════
// 22. LISTENERS — FILTROS Y BÚSQUEDA
// ══════════════════════════════════════════

[DOM.statusAll, DOM.statusPending, DOM.statusPaid].forEach((radio) =>
  radio.addEventListener("change", () => {
    state.currentPage = 1;
    renderizarListado();
  }),
);

DOM.searchInput.addEventListener("input", () => {
  state.currentPage = 1;
  renderizarListado();
});

[DOM.venue, DOM.date, DOM.time].forEach((el) =>
  el.addEventListener("change", actualizarContextoShow),
);

DOM.type.addEventListener("change", actualizarPreciosUI);

reglasValidacion.forEach(([el, fn]) =>
  el.addEventListener("blur", () => {
    if (state.submittedOnce) marcar(el, fn(el.value.trim()));
  }),
);

// ══════════════════════════════════════════
// 23. LISTENERS — MODAL DE TRÁILER
// ══════════════════════════════════════════

DOM.trailerModalEl.addEventListener("show.bs.modal", () => {
  DOM.trailerFrame.src = CONFIG.trailerUrl;
});
DOM.trailerModalEl.addEventListener("hidden.bs.modal", () => {
  DOM.trailerFrame.src = "";
});

// ══════════════════════════════════════════
// 24. INICIALIZACIÓN
// ══════════════════════════════════════════

/** IIFE de inicialización: ejecuta el render inicial de toda la UI. */
(function init() {
  renderizar();
  renderizarMapa();
  actualizarPreciosUI();
})();
