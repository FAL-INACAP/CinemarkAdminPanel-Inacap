# USO_IA.md — Apoyo de Inteligencia Artificial

**Proyecto:** Cinemark Admin — The Amazing Digital Circus  
**Asignatura:** Desarrollo de Aplicaciones Web  
**Evaluación:** Sumativa 2  
**Herramienta utilizada:** Claude (claude.ai) — modelo Claude Sonnet

---

## Objetivo de Aprendizaje cubierto

> _"Utiliza codificación en JavaScript para procesar formularios HTML y modificar el DOM, resolviendo problemas funcionales mediante estructuras de datos, funciones y herramientas de inteligencia artificial que apoyen la validación, organización y mejora del código."_

---

## Resumen del uso de IA

Se utilizó IA como herramienta de apoyo estratégico en tres fases del desarrollo:

1. **Diseño de arquitectura** — antes de escribir código.
2. **Revisión de seguridad** — auditoría de vulnerabilidades XSS.
3. **Optimización y refactorización** — mejora de funciones existentes.

En ningún caso se copió código sin entenderlo. Cada sugerencia fue analizada, adaptada y comentada en el código fuente.

---

## Prompts utilizados y mejoras incorporadas

### Prompt 1 — Arquitectura general

**Prompt enviado:**

> "Tengo que hacer un sistema de administración de entradas de cine en JavaScript vanilla. El proyecto necesita: formulario de registro, listado con filtros, dashboard con estadísticas, y mapa de butacas. ¿Cómo organizarías el código para que sea modular y fácil de mantener?"

**Respuesta de IA (resumen):**
La IA propuso una arquitectura por capas separando: configuración inmutable (`CONFIG`), estado mutable (`state`), referencias DOM (`DOM`), utilidades puras, operaciones CRUD y función central de render. También recomendó `Object.freeze()` para el objeto de configuración.

**Razonamiento para incorporarlo:**
Esta estructura evita "magic strings" dispersos y hace que cada función tenga una sola responsabilidad. Si en el futuro cambian los precios o las fechas, solo hay que modificar `CONFIG` sin tocar el resto del código.

**Código resultante:**

```js
const CONFIG = Object.freeze({
  storageKey: "cineticket_admin_tadc_v1",
  prices: { Normal: 5000, VIP: 8500, "3D": 7000 },
  // ...
});
```

---

### Prompt 2 — Seguridad XSS

**Prompt enviado:**

> "¿Cuáles son los riesgos de seguridad más comunes en una SPA con formularios? Tengo un listado dinámico donde construyo tarjetas HTML con datos que ingresa el usuario. ¿Cómo puedo evitar ataques XSS?"

**Respuesta de IA (resumen):**
La IA explicó que usar `innerHTML` con datos de usuario permite inyectar etiquetas `<script>` o atributos maliciosos. Recomendó exclusivamente `textContent` para texto y `createElement` para estructura. También sugirió crear una función `sanitizar()` como defensa explícita adicional.

**Razonamiento para incorporarlo:**
Sin esta medida, un correo como `<img src=x onerror=alert(1)>` podría ejecutar código arbitrario. La función `sanitizar()` y el wrapper `crearElemento()` garantizan que cualquier dato del formulario se trate como texto literal en todo el código.

**Código resultante:**

```js
// sanitizar() convierte cualquier valor a cadena segura
function sanitizar(val) {
  return String(val ?? "").trim();
}

// crearElemento() usa textContent internamente, nunca innerHTML
function crearElemento(tag, attrs = {}, text) {
  const el = document.createElement(tag);
  // ...
  if (text !== undefined) el.textContent = sanitizar(text);
  return el;
}
```

---

### Prompt 3 — Validación con regex

**Prompt enviado:**

> "Necesito validar correo electrónico en JavaScript. ¿Qué regex me recomiendas y por qué?"

**Respuesta de IA (resumen):**
La IA generó la expresión `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` y explicó que patrones más simples como `/\S+@\S+/` aceptan correos inválidos (sin TLD, con espacios). También señaló que ninguna regex es perfecta para RFC 5322 completo, pero esta cubre los casos más comunes de forma práctica.

**Razonamiento para incorporarlo:**
La regex propuesta es más robusta que lo que habría escrito sin apoyo, pero suficientemente simple para un formulario de administración. Se mantuvo este equilibrio entre seguridad y legibilidad.

**Código resultante:**

```js
const esEmailValido = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
```

---

### Prompt 4 — Rendimiento con DocumentFragment

**Prompt enviado:**

> "Tengo una lista de 60 botones de butacas que se re-renderizan completos cada vez que el usuario hace clic en una. ¿Es eficiente llamar a appendChild 60 veces dentro de un loop?"

**Respuesta de IA (resumen):**
La IA explicó que cada `appendChild` al DOM activo provoca un potencial repaint. La solución es usar `document.createDocumentFragment()` para construir todos los nodos en memoria y hacer un único `appendChild` al final.

**Razonamiento para incorporarlo:**
Con 60 butacas y múltiples re-renders por interacción, el impacto acumulado es significativo. El Fragment reduce los repaints de 60 a 1 sin cambiar la lógica de ninguna función.

**Código resultante:**

```js
const frag = document.createDocumentFragment();
todasLasButacas().forEach((cod) => {
  const btn = crearElemento(
    "button",
    {
      /* ... */
    },
    cod,
  );
  frag.appendChild(btn);
});
DOM.seatMap.innerHTML = "";
DOM.seatMap.appendChild(frag); // una sola operación de escritura al DOM
```

---

### Prompt 5 — Event delegation

**Prompt enviado:**

> "Tengo una lista de tarjetas renderizadas dinámicamente. Cada tarjeta tiene 3 botones (editar, eliminar, toggle pago). Si añado addEventListener a cada botón al crearlos, ¿qué problema puede surgir?"

**Respuesta de IA (resumen):**
La IA explicó que al re-renderizar la lista, los listeners del DOM anterior se eliminan pero los de los objetos en memoria no, generando memory leaks. Propuso event delegation: un único listener en el contenedor padre que identifica el botón clickeado mediante `e.target.closest()`.

**Razonamiento para incorporarlo:**
Es una práctica estándar en JavaScript para listas dinámicas. Además de eliminar el riesgo de memory leaks, el código resultante es más limpio: un solo bloque maneja toda la interacción del listado.

**Código resultante:**

```js
// Un único listener en el contenedor, no uno por tarjeta
DOM.ticketList.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-id]");
  if (!btn) return;
  const id = btn.dataset.id;
  if (btn.classList.contains("btn-toggle")) {
    /* ... */
  } else if (btn.classList.contains("btn-editar")) {
    /* ... */
  } else if (btn.classList.contains("btn-eliminar")) {
    /* ... */
  }
});
```

---

### Prompt 6 — Validación separada del render

**Prompt enviado:**

> "¿Es buena práctica mezclar la lógica de validación con el código que actualiza la UI del formulario?"

**Respuesta de IA (resumen):**
La IA recomendó el principio de responsabilidad única: una función valida y retorna errores (función pura, sin efectos secundarios), y otra función separada aplica las clases visuales al DOM. Esto facilita las pruebas y la reutilización.

**Razonamiento para incorporarlo:**
Se implementaron `validarTicket()` (retorna array de errores, no toca el DOM) y `validarVisualmente()` (aplica clases Bootstrap) como funciones completamente separadas. Esto permite reutilizar la validación lógica sin necesidad de tener un formulario visible.

**Código resultante:**

```js
// Función pura: solo retorna errores, no modifica el DOM
function validarTicket(d) {
  const errores = [];
  if (!esEmailValido(d.email)) errores.push("Correo inválido.");
  // ...
  return errores;
}

// Función de UI: solo aplica clases visuales
function validarVisualmente() {
  reglasValidacion.forEach(([el, fn]) => marcar(el, fn(el.value.trim())));
}
```

---

### Prompt 7 — Manejo de fechas en JavaScript

**Prompt enviado:**

> "En JavaScript, new Date('2026-06-04') a veces da un día antes. ¿Por qué? ¿Cómo evitarlo?"

**Respuesta de IA (resumen):**
La IA explicó que cuando la fecha no incluye hora, el estándar ISO 8601 la interpreta como UTC medianoche. En zonas con UTC-3 (Chile), esto resulta en el día anterior al hacer `toLocaleDateString`. La solución es añadir `T00:00:00` para forzar la interpretación como hora local.

**Razonamiento para incorporarlo:**
Sin esta corrección, las fechas de función mostradas en las tarjetas habrían sido incorrectas para usuarios en Chile. Se aplicó en `esFechaValida()` y en la nueva función `formatearFecha()`.

**Código resultante:**

```js
function esFechaValida(fecha) {
  if (!fecha) return false;
  const d = new Date(`${fecha}T00:00:00`); // T00:00:00 evita desfase UTC
  const ini = new Date(`${CONFIG.dateStart}T00:00:00`);
  const fin = new Date(`${CONFIG.dateEnd}T00:00:00`);
  return d >= ini && d <= fin;
}

function formatearFecha(fecha) {
  return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
```

---

## Mejoras sustanciales gracias a la IA

| Área            | Sin IA                                 | Con IA                                                                |
| --------------- | -------------------------------------- | --------------------------------------------------------------------- |
| Seguridad XSS   | Uso de innerHTML con template literals | `sanitizar()` + `crearElemento()` con `textContent` en todo el código |
| Arquitectura    | Variables globales sueltas             | CONFIG + state + DOM centralizados                                    |
| Rendimiento DOM | 60 `appendChild` individuales          | 1 `appendChild` con DocumentFragment                                  |
| Memoria         | 1 listener por botón (memory leaks)    | 1 listener con event delegation                                       |
| Validación      | Lógica mezclada con UI                 | `validarTicket()` pura + `validarVisualmente()` separada              |
| Fechas          | Desfase de 1 día en Chile (UTC bug)    | Uso de `T00:00:00` para zona local                                    |
| Ordenamiento    | Sort léxico incorrecto (A10 < A2)      | Comparación separada por fila y número                                |

---

## Lo que NO fue asistido por IA

- El diseño visual y paleta de colores (elaboración propia).
- La idea del tema (The Amazing Digital Circus) y la estructura narrativa del proyecto.
- La selección de la información a mostrar por sección (película, dashboard, registro, listado).
- La lógica de butacas ocupadas por función (clave compuesta sede+fecha+hora).
- El panel de funciones por día con detalle por horario.

---

_Documento generado como parte de la entrega de la Sumativa 2._
