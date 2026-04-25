# 🎬 Cinemark Admin – The Amazing Digital Circus (Proyecto Académico)

Panel de administración ficticio desarrollado como proyecto académico. Simula la gestión de ventas de entradas para el estreno cinematográfico de _The Amazing Digital Circus: El Último Acto_, incluyendo registro de compras, dashboard con indicadores en tiempo real, listado de entradas y mapa interactivo de butacas.

> **Nota:** Todos los datos, precios y funciones son inventados. Este sitio no representa una plataforma real de ventas ni tiene fines comerciales.

---

## 🌐 Sitio en Producción

🔗 https://cinemark-admin-panel-inacap.vercel.app/

---

## ✨ Características Principales

- **Sidebar lateral** con navegación entre secciones (Película, Dashboard, Registrar compra, Listado de entradas).
- **Sección Película** con póster, sinopsis, ficha técnica y funciones disponibles (horarios, sedes, precios).
- **Dashboard** con tarjetas KPI en tiempo real: total de entradas, pagadas, pendientes y recaudación.
- **Gráfico de progreso** visual de pagadas vs. pendientes.
- **Formulario de registro** con validación de campos: correo, tipo de entrada, sede, horario, fecha y notas.
- **Mapa de butacas interactivo** (10×4 asientos) que se habilita al seleccionar sede, fecha y horario. Las butacas ocupadas se marcan y no se pueden volver a seleccionar.
- **Resumen de precios** dinámico que actualiza según tipo de entrada y cantidad de butacas.
- **Listado de entradas** con paginación, búsqueda por sede/correo y filtros por estado de pago (todas, pendientes, pagadas).
- **Edición y eliminación** de entradas desde el listado.
- **Modal de tráiler** que reproduce el avance oficial de la película.
- **Diseño 100% responsive** (mobile, tablet, escritorio).
- **Persistencia de datos** mediante `localStorage`, simulando una base de datos en el front-end.

---

## 🚀 Cómo Ejecutar el Proyecto

1. Clona o descarga los archivos del repositorio.
2. Abre el archivo `index.html` en cualquier navegador web moderno (Chrome, Firefox, Edge, etc.).
3. No se requiere servidor local, ya que es HTML/CSS/JS puro (todo el almacenamiento es local).

> **Nota:** Si no dispones de las imágenes originales, puedes reemplazar las rutas en el código HTML con imágenes placeholder o crear la carpeta `img/` con archivos de prueba. El mapa de butacas funciona correctamente aunque falten algunas imágenes, mostrando un placeholder.

---

## 🎨 Decisiones de Diseño y Técnicas Implementadas

- **Variables CSS** para colores (`--red`, `--surface`, `--border`, `--success`, `--danger`) y espaciados, facilitando el mantenimiento del tema oscuro.
- **Sidebar fijo** con `position: fixed` y `justify-content: space-between` para mantener el bloque de imagen y detalles siempre en la parte inferior.
- **Imagen de sidebar en formato 16:9** usando `aspect-ratio: 16/9` y `object-fit: cover` para adaptar la imagen de Jax sin deformarla.
- **Dashboard dinámico**: los KPIs se actualizan automáticamente al agregar, editar o eliminar entradas, utilizando eventos personalizados y `localStorage`.
- **Mapa de butacas generado dinámicamente** con JavaScript: cada asiento es un botón cuyo estado se sincroniza con la combinación `sede-fecha-horario`. Los asientos ocupados se almacenan en un array y se cargan al cambiar los filtros.
- **Validación de formulario** nativa con `novalidate` y mensajes personalizados mediante JavaScript, incluyendo fecha límite (4 al 10 de junio de 2026) y correo electrónico válido.
- **Paginación y búsqueda** implementadas en el listado con corte de array (`slice`) y actualización de la interfaz sin recargar la página.
- **Modales de Bootstrap** utilizados para confirmar eliminación y cambio de estado de pago, mejorando la experiencia de usuario.
- **Toasts** para notificaciones de éxito o error al guardar/editar/eliminar.
- **Responsive Design**: media queries que ocultan/muestran el toggle del sidebar, reorganizan las tarjetas KPI, reducen el tamaño del mapa de butacas y ajustan la grilla del formulario.

---

## 📄 Licencia

Este proyecto es de carácter académico y no cuenta con una licencia de uso comercial. Puede ser utilizado con fines educativos y de aprendizaje.

---

## 👥 Créditos

- **Desarrollador**: Fidel Alarcon Leiva
- **Docente**: Patricio Araya Castro
- **Institución**: INACAP Maipú – Ingeniería en Informática
- **Año**: 2026
