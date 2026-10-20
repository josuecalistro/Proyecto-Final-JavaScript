"use strict";

const $ = (selector) => document.querySelector(selector);
const dinero = (valor) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(valor);
const claves = almacenamiento;

let catalogo = [];
let carrito = [];
let pedidos = [];
let cuponActivo = false;
let temporizadorToast;
let ultimoFoco = null;

function escaparHTML(valor) {
  return String(valor).replace(/[&<>"']/g, (caracter) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[caracter]);
}

function aviso(mensaje, tipo = "success") {
  if (typeof Swal !== "undefined") {
    return Swal.fire({ icon: tipo, text: mensaje, confirmButtonColor: "#1263e6" });
  }
  const toast = $("#toast");
  toast.textContent = mensaje;
  toast.classList.add("visible");
  clearTimeout(temporizadorToast);
  temporizadorToast = setTimeout(() => toast.classList.remove("visible"), 4500);
  return Promise.resolve();
}

async function preguntar(mensaje) {
  if (typeof Swal !== "undefined") {
    const respuesta = await Swal.fire({ title: "¿Estás seguro?", text: mensaje, icon: "warning", showCancelButton: true, confirmButtonText: "Sí, continuar", cancelButtonText: "Cancelar", confirmButtonColor: "#1263e6" });
    return respuesta.isConfirmed;
  }
  return false;
}

function cargarStorage() {
  const carritoGuardado = claves.leer(claves.carrito, []);
  const pedidosGuardados = claves.leer(claves.pedidos, []);
  carrito = Array.isArray(carritoGuardado) ? carritoGuardado.filter((item) => Number.isInteger(item.id) && Number.isInteger(item.cantidad) && item.cantidad > 0) : [];
  pedidos = Array.isArray(pedidosGuardados) ? pedidosGuardados : [];
  cuponActivo = claves.leer(claves.cupon, false) === true;
}

function guardarCarrito() {
  if (!claves.guardar(claves.carrito, carrito)) aviso("No se pudo guardar el carrito en este navegador.", "error");
}

function disponibles(producto) {
  const vendidos = pedidos.reduce((total, pedido) => total + (Array.isArray(pedido.items) ? pedido.items.reduce((suma, item) => suma + (item.id === producto.id ? item.cantidad : 0), 0) : 0), 0);
  return Math.max(0, producto.stock - vendidos);
}

async function cargarCatalogo() {
  const estado = $("#estadoCatalogo");
  estado.hidden = false;
  estado.classList.remove("error");
  estado.textContent = "Cargando camisetas...";
  try {
    const respuesta = await fetch("assets/data/productos.json", { cache: "no-store" });
    if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status}`);
    const datos = await respuesta.json();
    if (!Array.isArray(datos) || !datos.every((producto) => Number.isInteger(producto.id) && typeof producto.nombre === "string" && Number.isFinite(producto.precio) && Number.isInteger(producto.stock) && typeof producto.imagen === "string")) throw new Error("El archivo JSON tiene un formato inválido.");
    catalogo = datos;
    carrito = carrito.filter((item) => catalogo.some((producto) => producto.id === item.id));
    carrito.forEach((item) => {
      const producto = catalogo.find((actual) => actual.id === item.id);
      item.cantidad = Math.min(item.cantidad, disponibles(producto));
    });
    carrito = carrito.filter((item) => item.cantidad > 0);
    guardarCarrito();
    actualizarTodo();
  } catch (error) {
    estado.classList.add("error");
    estado.innerHTML = `<strong>No pudimos cargar el catálogo.</strong><p>${escaparHTML(error.message)}</p><p>Usá Live Server y comprobá que exista assets/data/productos.json.</p><button id="reintentarCarga" class="btn btn-primary btn-small" type="button">Reintentar</button>`;
    $("#reintentarCarga").addEventListener("click", cargarCatalogo);
  } finally {
    if (catalogo.length > 0) estado.hidden = true;
  }
}

function productosFiltrados() {
  const busqueda = $("#buscarProducto").value.trim().toLocaleLowerCase("es");
  const soloDisponibles = $("#filtroStock").value === "disponibles";
  const orden = $("#ordenProductos").value;
  const lista = catalogo.filter((producto) => `${producto.nombre} ${producto.equipo}`.toLocaleLowerCase("es").includes(busqueda) && (!soloDisponibles || disponibles(producto) > 0));
  if (orden === "menor") lista.sort((primero, segundo) => primero.precio - segundo.precio);
  if (orden === "mayor") lista.sort((primero, segundo) => segundo.precio - primero.precio);
  if (orden === "nombre") lista.sort((primero, segundo) => primero.nombre.localeCompare(segundo.nombre, "es"));
  return lista;
}

function renderizarProductos() {
  const productos = productosFiltrados();
  $("#cantidadResultados").textContent = `${productos.length} ${productos.length === 1 ? "producto" : "productos"}`;
  $("#grillaProductos").innerHTML = productos.length ? productos.map((producto) => {
    const { id, nombre, precio, imagen, categoria } = producto;
    const stock = disponibles(producto);
    return `<article class="product-card"><div class="product-image"><img src="${escaparHTML(imagen)}" alt="Camiseta de ${escaparHTML(nombre)}" loading="lazy"><span class="product-tag">${stock > 0 ? "DISPONIBLE" : "AGOTADO"}</span></div><div class="product-info"><small>${escaparHTML(categoria || "Fútbol argentino")}</small><h3>${escaparHTML(nombre)}</h3><p class="stock-text">${stock > 0 ? `${stock} unidades disponibles` : "Sin stock"}</p><div class="product-footer"><strong>${dinero(precio)}</strong><button class="btn btn-primary btn-small" type="button" data-agregar="${id}" ${stock === 0 ? "disabled" : ""}>Agregar +</button></div></div></article>`;
  }).join("") : (catalogo.length ? `<p class="empty-state">No hay camisetas que coincidan con tu búsqueda.</p>` : "");
}

function agregarProducto(id) {
  const producto = catalogo.find((actual) => actual.id === id);
  if (!producto) return;
  const existente = carrito.find((item) => item.id === id);
  const cantidadActual = existente?.cantidad || 0;
  if (cantidadActual >= disponibles(producto)) return aviso("No hay más unidades disponibles de esta camiseta.", "warning");
  if (existente) existente.cantidad += 1;
  else carrito.push({ id, cantidad: 1 });
  guardarCarrito();
  renderizarCarrito();
  aviso(`${producto.nombre} se agregó al carrito.`);
}

function modificarCantidad(id, diferencia) {
  const item = carrito.find((actual) => actual.id === id);
  const producto = catalogo.find((actual) => actual.id === id);
  if (!item || !producto) return;
  const nuevaCantidad = item.cantidad + diferencia;
  if (nuevaCantidad > disponibles(producto)) return aviso("Alcanzaste el stock disponible.", "warning");
  if (nuevaCantidad <= 0) carrito = carrito.filter((actual) => actual.id !== id);
  else item.cantidad = nuevaCantidad;
  guardarCarrito();
  renderizarCarrito();
}

function quitarProducto(id) {
  carrito = carrito.filter((item) => item.id !== id);
  guardarCarrito();
  renderizarCarrito();
}

function calcularTotales() {
  const subtotal = carrito.reduce((acumulado, item) => {
    const producto = catalogo.find((actual) => actual.id === item.id);
    return acumulado + (producto?.precio || 0) * item.cantidad;
  }, 0);
  const descuento = cuponActivo ? Math.round(subtotal * 0.10) : 0;
  return { subtotal, descuento, total: subtotal - descuento };
}

function renderizarCarrito() {
  const totalUnidades = carrito.reduce((suma, item) => suma + item.cantidad, 0);
  $("#contadorCarrito").textContent = totalUnidades;
  $("#itemsCarrito").innerHTML = carrito.length ? carrito.map((item) => {
    const producto = catalogo.find((actual) => actual.id === item.id);
    if (!producto) return "";
    const { id, nombre, imagen, precio } = producto;
    return `<article class="cart-item"><img src="${escaparHTML(imagen)}" alt="${escaparHTML(nombre)}"><div class="cart-item-info"><h3>${escaparHTML(nombre)}</h3><strong>${dinero(precio * item.cantidad)}</strong><div class="quantity"><button type="button" data-cantidad="-1" data-id="${id}" aria-label="Quitar una unidad de ${escaparHTML(nombre)}">−</button><span>${item.cantidad}</span><button type="button" data-cantidad="1" data-id="${id}" aria-label="Agregar una unidad de ${escaparHTML(nombre)}" ${item.cantidad >= disponibles(producto) ? "disabled" : ""}>+</button></div></div><button class="remove-item" type="button" data-quitar="${id}" aria-label="Eliminar ${escaparHTML(nombre)}">✕</button></article>`;
  }).join("") : `<div class="empty-cart">🛒<h3>Tu carrito está vacío</h3><p>Elegí una camiseta para comenzar.</p></div>`;
  const { subtotal, descuento, total } = calcularTotales();
  $("#subtotalCarrito").textContent = dinero(subtotal);
  $("#descuentoCarrito").textContent = `−${dinero(descuento)}`;
  $("#totalCarrito").textContent = dinero(total);
  $("#totalCheckout").textContent = dinero(total);
  $("#irCheckout").disabled = carrito.length === 0;
  $("#vaciarCarrito").disabled = carrito.length === 0;
  $("#estadoCupon").textContent = cuponActivo ? "✓ Cupón SPORT10 aplicado: 10% de descuento" : "";
  $("#codigoCupon").value = cuponActivo ? "SPORT10" : "";
}

function renderizarPedidos() {
  $("#vaciarHistorial").disabled = pedidos.length === 0;
  $("#listaPedidos").innerHTML = pedidos.length ? [...pedidos].reverse().map((pedido) => {
    const detalle = Array.isArray(pedido.items) ? pedido.items.map((item) => `${escaparHTML(item.nombre)} × ${item.cantidad}`).join(" · ") : "";
    return `<article class="order-card"><div><small>Pedido #${escaparHTML(pedido.id)}</small><h3>${escaparHTML(pedido.cliente.nombre)}</h3><p>${escaparHTML(pedido.fecha)}</p><p>${detalle}</p></div><div class="order-side"><strong>${dinero(pedido.total)}</strong><span class="order-status">✓ Confirmado</span></div></article>`;
  }).join("") : `<div class="empty-state">Todavía no realizaste compras. ¡Tu próxima camiseta te espera!</div>`;
}

function actualizarTodo() {
  renderizarProductos();
  renderizarCarrito();
  renderizarPedidos();
}

function abrirCarrito() {
  ultimoFoco = document.activeElement;
  $("#fondoCarrito").hidden = false;
  $("#panelCarrito").classList.add("open");
  $("#panelCarrito").setAttribute("aria-hidden", "false");
  document.body.classList.add("no-scroll");
  $("#cerrarCarrito").focus();
}

function cerrarCarrito(restaurarFoco = true) {
  $("#fondoCarrito").hidden = true;
  $("#panelCarrito").classList.remove("open");
  $("#panelCarrito").setAttribute("aria-hidden", "true");
  if (!$("#modalCheckout").classList.contains("open")) document.body.classList.remove("no-scroll");
  if (restaurarFoco) ultimoFoco?.focus();
}

function abrirCheckout() {
  if (!carrito.length) return;
  cerrarCarrito(false);
  $("#fondoCheckout").hidden = false;
  $("#modalCheckout").classList.add("open");
  $("#modalCheckout").setAttribute("aria-hidden", "false");
  document.body.classList.add("no-scroll");
  $("#formCheckout").elements.nombre.focus();
}

function cerrarCheckout() {
  $("#fondoCheckout").hidden = true;
  $("#modalCheckout").classList.remove("open");
  $("#modalCheckout").setAttribute("aria-hidden", "true");
  document.body.classList.remove("no-scroll");
  $("#abrirCarrito").focus();
}

function aplicarCupon(evento) {
  evento.preventDefault();
  const codigo = $("#codigoCupon").value.trim().toUpperCase();
  if (codigo !== "SPORT10") return aviso("El cupón ingresado no es válido.", "error");
  if (cuponActivo) return aviso("El cupón ya está aplicado.", "info");
  cuponActivo = true;
  claves.guardar(claves.cupon, true);
  renderizarCarrito();
  aviso("¡Cupón aplicado! Tenés 10% de descuento.");
}

async function vaciarCarrito() {
  if (!carrito.length) return;
  if (!await preguntar("Se eliminarán todas las camisetas del carrito.")) return;
  carrito = [];
  claves.borrar(claves.carrito);
  renderizarCarrito();
  aviso("El carrito quedó vacío.");
}

async function borrarHistorial() {
  if (!pedidos.length) return;
  if (!await preguntar("Se eliminará el historial y se restablecerá el stock simulado.")) return;
  pedidos = [];
  claves.borrar(claves.pedidos);
  actualizarTodo();
  aviso("Historial eliminado. Stock restablecido.");
}

async function confirmarCompra(evento) {
  evento.preventDefault();
  if (!carrito.length) return aviso("Tu carrito está vacío.", "warning");
  const formulario = evento.currentTarget;
  if (!formulario.reportValidity()) return;
  for (const item of carrito) {
    const producto = catalogo.find((actual) => actual.id === item.id);
    if (!producto || item.cantidad > disponibles(producto)) return aviso("El stock cambió. Revisá las cantidades de tu carrito.", "error");
  }
  const datos = new FormData(formulario);
  const cliente = {
    nombre: String(datos.get("nombre") || "").trim(),
    email: String(datos.get("email") || "").trim(),
    direccion: String(datos.get("direccion") || "").trim(),
    pago: String(datos.get("pago") || "")
  };
  if (cliente.nombre.length < 3 || cliente.direccion.length < 5 || !cliente.email.includes("@") || !cliente.pago) return aviso("Completá todos los datos de compra.", "warning");
  const { subtotal, descuento, total } = calcularTotales();
  const items = carrito.map(({ id, cantidad }) => {
    const { nombre, precio } = catalogo.find((producto) => producto.id === id);
    return { id, nombre, precio, cantidad };
  });
  const pedido = { id: `${Date.now()}`, fecha: new Date().toLocaleString("es-AR"), cliente, items, subtotal, descuento, total };
  const nuevosPedidos = [...pedidos, pedido];
  if (!claves.guardar(claves.pedidos, nuevosPedidos)) return aviso("No se pudo guardar el pedido. Verificá el almacenamiento del navegador.", "error");
  pedidos = nuevosPedidos;
  carrito = [];
  cuponActivo = false;
  claves.borrar(claves.carrito);
  claves.borrar(claves.cupon);
  formulario.reset();
  cerrarCheckout();
  actualizarTodo();
  if (typeof Swal !== "undefined") {
    await Swal.fire({ icon: "success", title: "¡Compra confirmada!", html: `Pedido <strong>#${escaparHTML(pedido.id)}</strong><br>Total: <strong>${dinero(total)}</strong><br><small>Es una simulación: no se efectuó ningún pago.</small>`, confirmButtonText: "Ver mis compras", confirmButtonColor: "#1263e6" });
  } else await aviso(`Compra confirmada. Pedido #${pedido.id}. Total: ${dinero(total)}.`);
  $("#pedidos").scrollIntoView({ behavior: "smooth" });
}

function configurarEventos() {
  $("#buscarProducto").addEventListener("input", renderizarProductos);
  $("#filtroStock").addEventListener("change", renderizarProductos);
  $("#ordenProductos").addEventListener("change", renderizarProductos);
  $("#grillaProductos").addEventListener("click", (evento) => {
    const boton = evento.target.closest("[data-agregar]");
    if (boton) agregarProducto(Number(boton.dataset.agregar));
  });
  $("#itemsCarrito").addEventListener("click", (evento) => {
    const botonCantidad = evento.target.closest("[data-cantidad]");
    const botonQuitar = evento.target.closest("[data-quitar]");
    if (botonCantidad) modificarCantidad(Number(botonCantidad.dataset.id), Number(botonCantidad.dataset.cantidad));
    if (botonQuitar) quitarProducto(Number(botonQuitar.dataset.quitar));
  });
  $("#abrirCarrito").addEventListener("click", abrirCarrito);
  $("#cerrarCarrito").addEventListener("click", () => cerrarCarrito());
  $("#fondoCarrito").addEventListener("click", () => cerrarCarrito());
  $("#irCheckout").addEventListener("click", abrirCheckout);
  $("#cerrarCheckout").addEventListener("click", cerrarCheckout);
  $("#fondoCheckout").addEventListener("click", cerrarCheckout);
  $("#formCupon").addEventListener("submit", aplicarCupon);
  $("#vaciarCarrito").addEventListener("click", vaciarCarrito);
  $("#vaciarHistorial").addEventListener("click", borrarHistorial);
  $("#formCheckout").addEventListener("submit", confirmarCompra);
  $("#copiarCupon").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText("SPORT10"); aviso("Código SPORT10 copiado."); }
    catch { aviso("Tu cupón es SPORT10. Ingresalo en el carrito.", "info"); }
  });
  document.addEventListener("keydown", (evento) => {
    if (evento.key !== "Escape") return;
    if ($("#modalCheckout").classList.contains("open")) cerrarCheckout();
    else if ($("#panelCarrito").classList.contains("open")) cerrarCarrito();
  });
}

function iniciarAplicacion() {
  cargarStorage();
  configurarEventos();
  renderizarCarrito();
  renderizarPedidos();
  cargarCatalogo();
}

iniciarAplicacion();
