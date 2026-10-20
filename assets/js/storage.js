
"use strict";

// ==========================================
// SPORT SHOP ONLINE - ALMACENAMIENTO LOCAL
// ==========================================

// Claves utilizadas para guardar los datos.
const CLAVES_STORAGE = {
  carrito: "sportShop_carrito",
  pedidos: "sportShop_pedidos",
  cupon: "sportShop_cupon"
};

// ==========================================
// LEER INFORMACIÓN
// ==========================================

// Recupera un dato guardado en localStorage.
// Si no existe o está dañado, devuelve el valor
// predeterminado que recibe como argumento.

function leerStorage(clave, valorPredeterminado = null) {
  try {
    const informacionGuardada = localStorage.getItem(clave);

    if (informacionGuardada === null) {
      return valorPredeterminado;
    }

    return JSON.parse(informacionGuardada);

  } catch (error) {
    return valorPredeterminado;
  }
}

// ==========================================
// GUARDAR INFORMACIÓN
// ==========================================

// Convierte arrays y objetos a formato JSON
// antes de guardarlos en el navegador.

function guardarStorage(clave, informacion) {
  try {
    localStorage.setItem(
      clave,
      JSON.stringify(informacion)
    );

    return true;

  } catch (error) {
    return false;
  }
}

// ==========================================
// ELIMINAR INFORMACIÓN
// ==========================================

// Elimina únicamente la clave indicada.

function eliminarStorage(clave) {
  try {
    localStorage.removeItem(clave);
    return true;

  } catch (error) {
    return false;
  }
}

// ==========================================
// GESTIÓN DEL CARRITO
// ==========================================

// Recuperar el carrito guardado.

function obtenerCarritoGuardado() {
  const carrito = leerStorage(
    CLAVES_STORAGE.carrito,
    []
  );

  return Array.isArray(carrito) ? carrito : [];
}

// Guardar los productos del carrito.

function guardarCarrito(carrito) {
  return guardarStorage(
    CLAVES_STORAGE.carrito,
    carrito
  );
}

// Vaciar completamente el carrito.

function vaciarCarritoGuardado() {
  return eliminarStorage(
    CLAVES_STORAGE.carrito
  );
}

// ==========================================
// HISTORIAL DE COMPRAS
// ==========================================

// Recuperar las compras realizadas.

function obtenerPedidosGuardados() {
  const pedidos = leerStorage(
    CLAVES_STORAGE.pedidos,
    []
  );

  return Array.isArray(pedidos) ? pedidos : [];
}

// Guardar una nueva compra sin perder
// las compras anteriores.

function guardarNuevoPedido(pedido) {
  const pedidos = obtenerPedidosGuardados();

  pedidos.push(pedido);

  return guardarStorage(
    CLAVES_STORAGE.pedidos,
    pedidos
  );
}

// Borrar el historial de compras.

function vaciarHistorialGuardado() {
  return eliminarStorage(
    CLAVES_STORAGE.pedidos
  );
}

// ==========================================
// CUPÓN DE DESCUENTO
// ==========================================

// Recuperar el cupón aplicado.

function obtenerCuponGuardado() {
  return leerStorage(
    CLAVES_STORAGE.cupon,
    ""
  );
}

// Guardar el cupón de descuento.

function guardarCupon(codigo) {
  return guardarStorage(
    CLAVES_STORAGE.cupon,
    codigo
  );
}

// Eliminar el cupón guardado.

function eliminarCuponGuardado() {
  return eliminarStorage(
    CLAVES_STORAGE.cupon
  );
}
