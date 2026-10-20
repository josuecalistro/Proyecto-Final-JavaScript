
# ⚽ Sport Shop Online

## Proyecto Final - JavaScript

Sport Shop Online es un simulador de comercio electrónico desarrollado con HTML, CSS y JavaScript.

El proyecto permite explorar camisetas de clubes del fútbol argentino, buscar productos, agregarlos a un carrito de compras y realizar una compra simulada.

Fue desarrollado como proyecto final del curso de JavaScript, aplicando los conocimientos adquiridos durante las distintas pre-entregas.

---

## 🚀 Funcionalidades

- Visualización dinámica de productos.
- Carga de productos desde un archivo JSON.
- Búsqueda de camisetas por nombre.
- Filtrado de productos según disponibilidad.
- Ordenamiento por nombre y precio.
- Agregar productos al carrito.
- Aumentar y disminuir cantidades.
- Eliminar productos individualmente.
- Vaciar el carrito con confirmación.
- Cálculo automático del subtotal.
- Aplicación del cupón SPORT10 con 10% de descuento.
- Control de stock disponible.
- Formulario de finalización de compra.
- Confirmación de compra mediante SweetAlert2.
- Historial de pedidos realizados.
- Persistencia de información con localStorage.
- Diseño responsive para computadoras, tablets y celulares.

---

## 🛠️ Tecnologías utilizadas

### HTML5
Utilizado para crear la estructura de la tienda, los formularios y los elementos visuales.

### CSS3
Utilizado para diseñar una interfaz moderna y adaptable mediante Flexbox, CSS Grid, variables CSS y media queries.

### JavaScript
Utilizado para desarrollar la lógica del simulador, administrar el carrito y manipular dinámicamente el DOM.

### JSON
Utilizado para almacenar la información de los productos.

### Fetch API
Utilizada para cargar los productos desde el archivo JSON mediante peticiones asíncronas.

### LocalStorage
Utilizado para guardar el carrito, los descuentos y el historial de pedidos.

### SweetAlert2
Librería externa utilizada para mostrar mensajes y confirmaciones interactivas.

---

## 📁 Estructura del proyecto

```text
Proyecto-Final-JavaScript/
│
├── index.html
│
├── assets/
│   ├── css/
│   │   └── style.css
│   │
│   ├── js/
│   │   ├── main.js
│   │   └── storage.js
│   │
│   ├── data/
│   │   └── productos.json
│   │
│   └── img/
│       ├── estudiantes.svg
│       ├── river.svg
│       ├── racing.svg
│       ├── independiente.svg
│       ├── boca.svg
│       └── san-lorenzo.svg
│
└── docs/
    └── README.md
```

---

## 🛒 Funcionamiento del carrito

El usuario puede agregar camisetas al carrito desde el catálogo.

Dentro del carrito puede:

- Consultar los productos seleccionados.
- Modificar la cantidad de unidades.
- Eliminar productos.
- Consultar el subtotal.
- Aplicar descuentos.
- Visualizar el total.
- Confirmar una compra simulada.

El carrito se guarda mediante localStorage, permitiendo recuperar los productos al actualizar la página.

---

## 🎟️ Cupón de descuento

El simulador incluye un cupón de descuento:

**Código:** SPORT10

**Descuento:** 10% sobre el subtotal del carrito.

El descuento se calcula automáticamente cuando se aplica el cupón.

---

## 💳 Simulación de compra

Para finalizar una compra, el usuario debe completar:

- Nombre y apellido.
- Correo electrónico.
- Dirección de entrega.
- Medio de pago simulado.

Después de confirmar, se genera un número de pedido y se guarda la compra en el historial.

---

## 🧠 Conceptos de JavaScript aplicados

Durante el desarrollo se utilizaron:

- Variables y constantes.
- Arrays y objetos.
- Funciones.
- Condicionales.
- Operadores ternarios.
- Desestructuración de objetos.
- Métodos de arrays: map, filter, find, some, reduce y sort.
- Manipulación del DOM.
- Eventos con addEventListener.
- Delegación de eventos.
- JSON.stringify y JSON.parse.
- LocalStorage.
- Promesas.
- Fetch API.
- Async/Await.
- Manejo de errores con try, catch y finally.
- Librerías externas.

---

## 🌐 Repositorio de GitHub

Código fuente:

https://github.com/josuecalistro/Proyecto-Final-JavaScript

GitHub Pages (una vez publicado correctamente):

https://josuecalistro.github.io/Proyecto-Final-JavaScript/

---

## 👨‍💻 Autor

Josué Calistro

Proyecto Final de JavaScript

---

