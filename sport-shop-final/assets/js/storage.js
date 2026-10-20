"use strict";

const almacenamiento = {
  carrito: "sportshop_carrito_final",
  pedidos: "sportshop_pedidos_final",
  cupon: "sportshop_cupon_final",

  leer(clave, valorPorDefecto) {
    try {
      const valor = localStorage.getItem(clave);
      return valor === null ? valorPorDefecto : JSON.parse(valor);
    } catch {
      return valorPorDefecto;
    }
  },

  guardar(clave, valor) {
    try {
      localStorage.setItem(clave, JSON.stringify(valor));
      return true;
    } catch {
      return false;
    }
  },

  borrar(clave) {
    try {
      localStorage.removeItem(clave);
      return true;
    } catch {
      return false;
    }
  }
};
