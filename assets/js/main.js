
"use strict";

// ==========================================
// SPORT SHOP ONLINE - PROYECTO FINAL
// ==========================================

// DATOS PRINCIPALES

let productos = [];
let carrito = [];
let pedidos = [];
let cuponAplicado = "";

// ELEMENTOS DEL DOM

const grillaProductos = document.getElementById("grillaProductos");
const estadoCatalogo = document.getElementById("estadoCatalogo");
const cantidadResultados = document.getElementById("cantidadResultados");

const buscarProducto = document.getElementById("buscarProducto");
const filtroStock = document.getElementById("filtroStock");
const ordenProductos = document.getElementById("ordenProductos");

const abrirCarritoBtn = document.getElementById("abrirCarrito");
const cerrarCarritoBtn = document.getElementById("cerrarCarrito");
const fondoCarrito = document.getElementById("fondoCarrito");
const panelCarrito = document.getElementById("panelCarrito");

const contadorCarrito = document.getElementById("contadorCarrito");
const itemsCarrito = document.getElementById("itemsCarrito");

const subtotalCarrito = document.getElementById("subtotalCarrito");
const descuentoCarrito = document.getElementById("descuentoCarrito");
const totalCarrito = document.getElementById("totalCarrito");

const formCupon = document.getElementById("formCupon");
const codigoCupon = document.getElementById("codigoCupon");
const estadoCupon = document.getElementById("estadoCupon");
const copiarCuponBtn = document.getElementById("copiarCupon");

const vaciarCarritoBtn = document.getElementById("vaciarCarrito");
const irCheckoutBtn = document.getElementById("irCheckout");

const fondoCheckout = document.getElementById("fondoCheckout");
const modalCheckout = document.getElementById("modalCheckout");
const cerrarCheckoutBtn = document.getElementById("cerrarCheckout");

const formCheckout = document.getElementById("formCheckout");
const totalCheckout = document.getElementById("totalCheckout");
const confirmarPedidoBtn = document.getElementById("confirmarPedido");

const listaPedidos = document.getElementById("listaPedidos");
const vaciarHistorialBtn = document.getElementById("vaciarHistorial");

const toast = document.getElementById("toast");

// ==========================================
// FUNCIONES GENERALES
// ==========================================

const formatoPrecio = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0
});

function formatearPrecio(precio) {
  return formatoPrecio.format(precio);
}

// Evita insertar HTML peligroso cuando se
// muestran textos de productos o pedidos.

function escaparHTML(valor) {
  return String(valor ?? "").replace(
    /[&<>"']/g,
    caracter => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[caracter]
  );
}

// Muestra notificaciones pequeñas dentro
// de la página, sin usar alert nativo.

let temporizadorToast;

function mostrarToast(mensaje) {
  clearTimeout(temporizadorToast);

  toast.textContent = mensaje;
  toast.classList.add("visible");

  temporizadorToast = setTimeout(() => {
    toast.classList.remove("visible");
  }, 3000);
}

// Notificaciones con la librería SweetAlert2.

function mostrarAlerta(icono, titulo, mensaje = "") {
  if (typeof Swal !== "undefined") {
    return Swal.fire({
      icon: icono,
      title: titulo,
      text: mensaje,
      confirmButtonColor: "#1262e8"
    });
  }

  mostrarToast(`${titulo}. ${mensaje}`);

  return Promise.resolve();
}

// Confirmaciones sin usar confirm() nativo.

async function solicitarConfirmacion(titulo, mensaje) {
  if (typeof Swal === "undefined") {
    mostrarToast("No se pudo cargar la ventana de confirmación.");
    return false;
  }

  const resultado = await Swal.fire({
    title: titulo,
    text: mensaje,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, continuar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#1262e8",
    cancelButtonColor: "#64748b"
  });

  return resultado.isConfirmed;
}

// ==========================================
// CARGA DE PRODUCTOS DESDE JSON
// ==========================================

async function cargarProductos() {
  estadoCatalogo.hidden = false;
  estadoCatalogo.classList.remove("error");
  estadoCatalogo.textContent = "Cargando camisetas...";

  try {
    const respuesta = await fetch(
      "assets/data/productos.json"
    );

    if (!respuesta.ok) {
      throw new Error(
        `Error HTTP ${respuesta.status}`
      );
    }

    const datos = await respuesta.json();

    if (!Array.isArray(datos)) {
      throw new Error(
        "El archivo JSON no contiene una lista válida."
      );
    }

    // Validamos los datos antes de utilizarlos.

    productos = datos.filter(producto => {
      return (
        producto &&
        Number.isInteger(producto.id) &&
        typeof producto.nombre === "string" &&
        typeof producto.imagen === "string" &&
        Number.isFinite(producto.precio) &&
        producto.precio > 0 &&
        Number.isInteger(producto.stock) &&
        producto.stock >= 0
      );
    });

    if (productos.length === 0) {
      throw new Error(
        "No se encontraron productos válidos."
      );
    }

    // Los datos iniciales siempre provienen
    // del archivo JSON, no de un array en JS.

    restaurarDatosGuardados();
    renderizarProductos();
    renderizarCarrito();
    renderizarPedidos();

  } catch (error) {
    productos = [];

    estadoCatalogo.hidden = false;
    estadoCatalogo.classList.add("error");

    estadoCatalogo.textContent =
      "No se pudo cargar el catálogo. " +
      "Comprobá que productos.json exista " +
      "y que estés usando Live Server.";

    cantidadResultados.textContent = "0 productos";

    await mostrarAlerta(
      "error",
      "Error al cargar productos",
      "Revisá el archivo productos.json y sus rutas."
    );

  } finally {
    if (productos.length > 0) {
      estadoCatalogo.hidden = true;
    }
  }
}

// ==========================================
// RESTAURAR LOCALSTORAGE
// ==========================================

function restaurarDatosGuardados() {
  const carritoGuardado = obtenerCarritoGuardado();
  const pedidosGuardados = obtenerPedidosGuardados();
  const codigoGuardado = obtenerCuponGuardado();

  pedidos = pedidosGuardados;

  // Las compras anteriores descuentan stock
  // del catálogo original.

  productos = productos.map(producto => {
    const unidadesVendidas = pedidos.reduce(
      (total, pedido) => {
        const items = Array.isArray(pedido.items)
          ? pedido.items
          : [];

        const cantidadVendida = items.reduce(
          (cantidad, item) => {
            return item.id === producto.id
              ? cantidad + Number(item.cantidad || 0)
              : cantidad;
          },
          0
        );

        return total + cantidadVendida;
      },
      0
    );

    return {
      ...producto,
      stock: Math.max(
        0,
        producto.stock - unidadesVendidas
      )
    };
  });

  // Restauramos solamente productos que
  // todavía existen en el catálogo.

  carrito = carritoGuardado
    .filter(item => {
      return productos.some(
        producto => producto.id === item.id
      );
    })
    .map(item => {
      const producto = productos.find(
        producto => producto.id === item.id
      );

      return {
        id: producto.id,
        cantidad: Math.min(
          Math.max(1, Number(item.cantidad) || 1),
          producto.stock
        )
      };
    })
    .filter(item => item.cantidad > 0);

  cuponAplicado =
    codigoGuardado === "SPORT10"
      ? "SPORT10"
      : "";

  guardarCarrito(carrito);

  if (cuponAplicado) {
    codigoCupon.value = cuponAplicado;
  }
}

// ==========================================
// FILTROS Y ORDENAMIENTO
// ==========================================

function obtenerProductosFiltrados() {
  const busqueda = buscarProducto.value
    .trim()
    .toLowerCase();

  const filtro = filtroStock.value;
  const orden = ordenProductos.value;

  let resultado = productos.filter(producto => {
    const coincideNombre = producto.nombre
      .toLowerCase()
      .includes(busqueda);

    const coincideStock =
      filtro === "disponibles"
        ? producto.stock > 0
        : true;

    return coincideNombre && coincideStock;
  });

  if (orden === "menor") {
    resultado.sort(
      (primero, segundo) =>
        primero.precio - segundo.precio
    );
  }

  if (orden === "mayor") {
    resultado.sort(
      (primero, segundo) =>
        segundo.precio - primero.precio
    );
  }

  if (orden === "nombre") {
    resultado.sort(
      (primero, segundo) =>
        primero.nombre.localeCompare(
          segundo.nombre,
          "es"
        )
    );
  }

  return resultado;
}

// ==========================================
// RENDERIZAR CATÁLOGO
// ==========================================

function renderizarProductos() {
  const productosFiltrados =
    obtenerProductosFiltrados();

  cantidadResultados.textContent =
    `${productosFiltrados.length} productos`;

  if (productosFiltrados.length === 0) {
    grillaProductos.innerHTML = `
      <div class="empty-state">
        <strong>No encontramos camisetas</strong>
        <p>Probá con otra búsqueda o filtro.</p>
      </div>
    `;

    return;
  }

  grillaProductos.innerHTML = productosFiltrados
    .map(producto => {
      const {
        id,
        nombre,
        precio,
        stock,
        imagen
      } = producto;

      const disponible = stock > 0;

      const textoStock = disponible
        ? `${stock} disponibles`
        : "Sin stock";

      const textoBoton = disponible
        ? "Agregar al carrito"
        : "Agotado";

      return `
        <article class="product-card">

          <div class="product-image">
            <span class="product-badge">
              Fútbol argentino
            </span>

            <img
              src="${escaparHTML(imagen)}"
              alt="Camiseta de ${escaparHTML(nombre)}"
              loading="lazy"
            >
          </div>

          <div class="product-info">

            <span class="product-category">
              Camiseta oficial
            </span>

            <h3>${escaparHTML(nombre)}</h3>

            <p class="product-description">
              Camiseta de fútbol para acompañar
              a tu equipo en cada partido.
            </p>

            <div class="product-details">
              <span class="product-price">
                ${formatearPrecio(precio)}
              </span>

              <span class="product-stock ${
                disponible ? "" : "out"
              }">
                ${textoStock}
              </span>
            </div>

            <button
              class="btn btn-primary agregar-producto"
              type="button"
              data-id="${id}"
              ${disponible ? "" : "disabled"}
            >
              ${textoBoton}
            </button>

          </div>
        </article>
      `;
    })
    .join("");
}

// ==========================================
// AGREGAR PRODUCTOS AL CARRITO
// ==========================================

function agregarAlCarrito(idProducto) {
  const producto = productos.find(
    producto => producto.id === idProducto
  );

  if (!producto) {
    mostrarToast("Producto no encontrado.");
    return;
  }

  const itemExistente = carrito.find(
    item => item.id === idProducto
  );

  const cantidadActual = itemExistente
    ? itemExistente.cantidad
    : 0;

  if (cantidadActual >= producto.stock) {
    mostrarToast(
      "No hay más unidades disponibles."
    );
    return;
  }

  if (itemExistente) {
    itemExistente.cantidad += 1;
  } else {
    carrito.push({
      id: producto.id,
      cantidad: 1
    });
  }

  if (!guardarCarrito(carrito)) {
    mostrarToast(
      "No se pudo guardar el carrito."
    );
  }

  renderizarCarrito();

  mostrarToast(
    `${producto.nombre} agregado al carrito`
  );
}

// ==========================================
// CAMBIAR CANTIDADES
// ==========================================

function modificarCantidad(idProducto, cambio) {
  const item = carrito.find(
    item => item.id === idProducto
  );

  const producto = productos.find(
    producto => producto.id === idProducto
  );

  if (!item || !producto) {
    return;
  }

  const nuevaCantidad = item.cantidad + cambio;

  if (nuevaCantidad > producto.stock) {
    mostrarToast(
      "Alcanzaste el stock disponible."
    );
    return;
  }

  if (nuevaCantidad <= 0) {
    eliminarDelCarrito(idProducto);
    return;
  }

  item.cantidad = nuevaCantidad;

  guardarCarrito(carrito);
  renderizarCarrito();
}

// ==========================================
// ELIMINAR PRODUCTO DEL CARRITO
// ==========================================

function eliminarDelCarrito(idProducto) {
  carrito = carrito.filter(
    item => item.id !== idProducto
  );

  guardarCarrito(carrito);
  renderizarCarrito();

  mostrarToast("Producto eliminado del carrito.");
}

// ==========================================
// CÁLCULOS DEL CARRITO
// ==========================================

function calcularSubtotal() {
  return carrito.reduce((total, item) => {
    const producto = productos.find(
      producto => producto.id === item.id
    );

    if (!producto) {
      return total;
    }

    return total + producto.precio * item.cantidad;
  }, 0);
}

function calcularDescuento() {
  const subtotal = calcularSubtotal();

  return cuponAplicado === "SPORT10"
    ? Math.round(subtotal * 0.10)
    : 0;
}

function calcularTotal() {
  return calcularSubtotal() - calcularDescuento();
}

function calcularCantidadCarrito() {
  return carrito.reduce(
    (total, item) => total + item.cantidad,
    0
  );
}

// ==========================================
// RENDERIZAR CARRITO
// ==========================================

function renderizarCarrito() {
  contadorCarrito.textContent =
    calcularCantidadCarrito();

  if (carrito.length === 0) {
    itemsCarrito.innerHTML = `
      <div class="empty-state">
        <strong>Tu carrito está vacío</strong>
        <p>Agregá una camiseta para comenzar.</p>
      </div>
    `;
  } else {
    itemsCarrito.innerHTML = carrito
      .map(item => {
        const producto = productos.find(
          producto => producto.id === item.id
        );

        if (!producto) {
          return "";
        }

        const {
          id,
          nombre,
          precio,
          imagen
        } = producto;

        return `
          <div class="cart-item">

            <img
              src="${escaparHTML(imagen)}"
              alt="${escaparHTML(nombre)}"
            >

            <div class="cart-item-info">

              <h3>${escaparHTML(nombre)}</h3>

              <p class="cart-item-price">
                ${formatearPrecio(precio)}
              </p>

              <div class="quantity-controls">

                <button
                  type="button"
                  data-accion="restar"
                  data-id="${id}"
                  aria-label="Restar una unidad"
                >
                  −
                </button>

                <span>${item.cantidad}</span>

                <button
                  type="button"
                  data-accion="sumar"
                  data-id="${id}"
                  aria-label="Agregar una unidad"
                >
                  +
                </button>

              </div>

              <button
                class="remove-item"
                type="button"
                data-accion="eliminar"
                data-id="${id}"
              >
                Eliminar
              </button>

            </div>

          </div>
        `;
      })
      .join("");
  }

  subtotalCarrito.textContent =
    formatearPrecio(calcularSubtotal());

  descuentoCarrito.textContent =
    `−${formatearPrecio(calcularDescuento())}`;

  totalCarrito.textContent =
    formatearPrecio(calcularTotal());

  totalCheckout.textContent =
    formatearPrecio(calcularTotal());

  irCheckoutBtn.disabled = carrito.length === 0;
  vaciarCarritoBtn.disabled = carrito.length === 0;

  estadoCupon.textContent = cuponAplicado
    ? "Cupón SPORT10 aplicado: 10% de descuento."
    : "";
}

// ==========================================
// ABRIR Y CERRAR CARRITO
// ==========================================

function abrirCarrito() {
  fondoCarrito.hidden = false;

  panelCarrito.classList.add("open");
  panelCarrito.setAttribute("aria-hidden", "false");

  document.body.classList.add("no-scroll");

  cerrarCarritoBtn.focus();
}

function cerrarCarrito() {
  panelCarrito.classList.remove("open");
  panelCarrito.setAttribute("aria-hidden", "true");

  fondoCarrito.hidden = true;

  if (!modalCheckout.classList.contains("open")) {
    document.body.classList.remove("no-scroll");
  }
}

// ==========================================
// CUPÓN DE DESCUENTO
// ==========================================

function aplicarCupon(evento) {
  evento.preventDefault();

  const codigo = codigoCupon.value
    .trim()
    .toUpperCase();

  if (codigo !== "SPORT10") {
    mostrarAlerta(
      "error",
      "Cupón inválido",
      "Probá con el código SPORT10."
    );
    return;
  }

  cuponAplicado = "SPORT10";

  guardarCupon(cuponAplicado);

  codigoCupon.value = cuponAplicado;

  renderizarCarrito();

  mostrarToast("¡Descuento del 10% aplicado!");
}

// ==========================================
// VACIAR CARRITO
// ==========================================

async function vaciarCarrito() {
  if (carrito.length === 0) {
    return;
  }

  const confirmado = await solicitarConfirmacion(
    "¿Vaciar carrito?",
    "Se eliminarán todos los productos seleccionados."
  );

  if (!confirmado) {
    return;
  }

  carrito = [];

  vaciarCarritoGuardado();

  renderizarCarrito();

  mostrarToast("Carrito vaciado correctamente.");
}

// ==========================================
// ABRIR Y CERRAR CHECKOUT
// ==========================================

function abrirCheckout() {
  if (carrito.length === 0) {
    mostrarToast("Agregá productos antes de comprar.");
    return;
  }

  cerrarCarrito();

  totalCheckout.textContent =
    formatearPrecio(calcularTotal());

  fondoCheckout.hidden = false;

  modalCheckout.classList.add("open");
  modalCheckout.setAttribute("aria-hidden", "false");

  document.body.classList.add("no-scroll");

  formCheckout.elements.nombre.focus();
}

function cerrarCheckout() {
  modalCheckout.classList.remove("open");
  modalCheckout.setAttribute("aria-hidden", "true");

  fondoCheckout.hidden = true;

  document.body.classList.remove("no-scroll");
}

// ==========================================
// CONFIRMAR COMPRA
// ==========================================

async function confirmarCompra(evento) {
  evento.preventDefault();

  if (!formCheckout.reportValidity()) {
    return;
  }

  if (carrito.length === 0) {
    mostrarToast("El carrito está vacío.");
    return;
  }

  // Comprobamos el stock antes de confirmar.

  const stockInsuficiente = carrito.some(item => {
    const producto = productos.find(
      producto => producto.id === item.id
    );

    return (
      !producto ||
      item.cantidad > producto.stock
    );
  });

  if (stockInsuficiente) {
    await mostrarAlerta(
      "error",
      "Stock insuficiente",
      "Revisá las cantidades del carrito."
    );
    return;
  }

  const datosFormulario = new FormData(formCheckout);

  const nombre = String(
    datosFormulario.get("nombre") || ""
  ).trim();

  const email = String(
    datosFormulario.get("email") || ""
  ).trim();

  const direccion = String(
    datosFormulario.get("direccion") || ""
  ).trim();

  const pago = String(
    datosFormulario.get("pago") || ""
  );

  const subtotal = calcularSubtotal();
  const descuento = calcularDescuento();
  const total = calcularTotal();

  const itemsPedido = carrito.map(item => {
    const producto = productos.find(
      producto => producto.id === item.id
    );

    return {
      id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      cantidad: item.cantidad
    };
  });

  const pedido = {
    id: `SS-${Date.now()}`,
    fecha: new Date().toISOString(),
    cliente: {
      nombre,
      email,
      direccion
    },
    pago,
    items: itemsPedido,
    subtotal,
    descuento,
    total
  };

  const confirmado = await solicitarConfirmacion(
    "¿Confirmar compra?",
    `El total del pedido es ${formatearPrecio(total)}.`
  );

  if (!confirmado) {
    return;
  }

  confirmarPedidoBtn.disabled = true;
  confirmarPedidoBtn.textContent =
    "Registrando pedido...";

  try {
    const guardado = guardarNuevoPedido(pedido);

    if (!guardado) {
      throw new Error(
        "No se pudo guardar el pedido."
      );
    }

    pedidos.push(pedido);

    // Actualizamos el stock disponible.

    productos = productos.map(producto => {
      const itemComprado = carrito.find(
        item => item.id === producto.id
      );

      return itemComprado
        ? {
            ...producto,
            stock: producto.stock - itemComprado.cantidad
          }
        : producto;
    });

    // Una vez confirmada la compra,
    // limpiamos el carrito y el cupón.

    carrito = [];
    cuponAplicado = "";

    vaciarCarritoGuardado();
    eliminarCuponGuardado();

    codigoCupon.value = "";

    formCheckout.reset();

    cerrarCheckout();

    renderizarProductos();
    renderizarCarrito();
    renderizarPedidos();

    await mostrarAlerta(
      "success",
      "¡Compra confirmada!",
      `Tu número de pedido es ${pedido.id}.`
    );

    document.getElementById("pedidos")
      .scrollIntoView({
        behavior: "smooth"
      });

  } catch (error) {
    await mostrarAlerta(
      "error",
      "No se pudo completar la compra",
      "Verificá que el navegador permita guardar datos."
    );

  } finally {
    confirmarPedidoBtn.disabled = false;
    confirmarPedidoBtn.textContent =
      "Confirmar compra";
  }
}

// ==========================================
// HISTORIAL DE PEDIDOS
// ==========================================

function renderizarPedidos() {
  if (pedidos.length === 0) {
    listaPedidos.innerHTML = `
      <div class="empty-state">
        <strong>Todavía no realizaste compras</strong>
        <p>
          Tus pedidos confirmados aparecerán acá.
        </p>
      </div>
    `;

    vaciarHistorialBtn.disabled = true;
    return;
  }

  vaciarHistorialBtn.disabled = false;

  listaPedidos.innerHTML = [...pedidos]
    .reverse()
    .map(pedido => {
      const fecha = new Date(
        pedido.fecha
      ).toLocaleString("es-AR");

      const nombresProductos = pedido.items
        .map(item => {
          return `${item.cantidad} × ${
            escaparHTML(item.nombre)
          }`;
        })
        .join(", ");

      return `
        <article class="order-card">

          <div class="order-head">
            <div>
              <h3>
                Pedido ${escaparHTML(pedido.id)}
              </h3>

              <p class="order-date">
                ${escaparHTML(fecha)}
              </p>
            </div>

            <strong class="order-total">
              ${formatearPrecio(pedido.total)}
            </strong>
          </div>

          <p class="order-details">
            Cliente:
            ${escaparHTML(pedido.cliente.nombre)}
          </p>

          <p class="order-details">
            Pago: ${escaparHTML(pedido.pago)}
          </p>

          <p class="order-items">
            ${nombresProductos}
          </p>

        </article>
      `;
    })
    .join("");
}

// ==========================================
// BORRAR HISTORIAL
// ==========================================

async function borrarHistorial() {
  if (pedidos.length === 0) {
    return;
  }

  const confirmado = await solicitarConfirmacion(
    "¿Borrar historial?",
    "Se eliminarán los pedidos guardados en este navegador."
  );

  if (!confirmado) {
    return;
  }

  // El historial se usa para reconstruir el
  // stock vendido. Por eso, al eliminarlo,
  // también se restablece el catálogo.

  const historialAnterior = [...pedidos];

  pedidos = [];

  const eliminado = vaciarHistorialGuardado();

  if (!eliminado) {
    pedidos = historialAnterior;

    mostrarAlerta(
      "error",
      "No se pudo borrar el historial"
    );

    return;
  }

  renderizarPedidos();

  await cargarProductos();

  mostrarToast("Historial eliminado.");
}

// ==========================================
// EVENTOS DEL CATÁLOGO
// ==========================================

buscarProducto.addEventListener(
  "input",
  renderizarProductos
);

filtroStock.addEventListener(
  "change",
  renderizarProductos
);

ordenProductos.addEventListener(
  "change",
  renderizarProductos
);

// Delegación de eventos: funciona incluso
// cuando las tarjetas se crean con innerHTML.

grillaProductos.addEventListener(
  "click",
  evento => {
    const boton = evento.target.closest(
      ".agregar-producto"
    );

    if (!boton) {
      return;
    }

    const idProducto = Number(
      boton.dataset.id
    );

    agregarAlCarrito(idProducto);
  }
);

// ==========================================
// EVENTOS DEL CARRITO
// ==========================================

abrirCarritoBtn.addEventListener(
  "click",
  abrirCarrito
);

cerrarCarritoBtn.addEventListener(
  "click",
  cerrarCarrito
);

fondoCarrito.addEventListener(
  "click",
  cerrarCarrito
);

itemsCarrito.addEventListener(
  "click",
  evento => {
    const boton = evento.target.closest(
      "button[data-accion]"
    );

    if (!boton) {
      return;
    }

    const idProducto = Number(
      boton.dataset.id
    );

    const accion = boton.dataset.accion;

    if (accion === "sumar") {
      modificarCantidad(idProducto, 1);
    }

    if (accion === "restar") {
      modificarCantidad(idProducto, -1);
    }

    if (accion === "eliminar") {
      eliminarDelCarrito(idProducto);
    }
  }
);

vaciarCarritoBtn.addEventListener(
  "click",
  vaciarCarrito
);

formCupon.addEventListener(
  "submit",
  aplicarCupon
);

copiarCuponBtn.addEventListener(
  "click",
  async () => {
    try {
      await navigator.clipboard.writeText(
        "SPORT10"
      );

      mostrarToast(
        "Cupón SPORT10 copiado."
      );

    } catch (error) {
      mostrarToast(
        "Tu cupón es SPORT10."
      );
    }
  }
);

// ==========================================
// EVENTOS DEL CHECKOUT
// ==========================================

irCheckoutBtn.addEventListener(
  "click",
  abrirCheckout
);

cerrarCheckoutBtn.addEventListener(
  "click",
  cerrarCheckout
);

fondoCheckout.addEventListener(
  "click",
  cerrarCheckout
);

formCheckout.addEventListener(
  "submit",
  confirmarCompra
);

// ==========================================
// EVENTOS DEL HISTORIAL
// ==========================================

vaciarHistorialBtn.addEventListener(
  "click",
  borrarHistorial
);

// Cerrar ventanas con la tecla Escape.

document.addEventListener(
  "keydown",
  evento => {
    if (evento.key !== "Escape") {
      return;
    }

    if (modalCheckout.classList.contains("open")) {
      cerrarCheckout();
      return;
    }

    if (panelCarrito.classList.contains("open")) {
      cerrarCarrito();
    }
  }
);

// ==========================================
// INICIALIZACIÓN
// ==========================================

async function iniciarAplicacion() {
  renderizarCarrito();
  renderizarPedidos();

  await cargarProductos();
}

iniciarAplicacion();
