# Resumen del proyecto

Qué es SaaS-O-Matic y qué incluye este repositorio, con mis palabras.

## Qué hace

**SaaS-O-Matic** es una herramienta interna para que un equipo comercial simule y
presupueste suscripciones SaaS de clientes corporativos, viendo los precios en
varias divisas.

**Backend** (Node.js con TypeScript y SQLite):

- Alta de clientes: empresa, identificador fiscal, email, país y plan. Si el
  país es España, el identificador tiene que pasar el algoritmo oficial de
  control.
- Simulaciones guardadas en la base de datos: usuarios, almacenamiento y
  llamadas a la API. El coste base se calcula por tramos acumulativos de
  usuarios (10 €, 8 € y 5 € por usuario según el tramo) y se le suma el
  impuesto del país del cliente.

**Frontend** (Angular):

- Conversión de los importes a otra divisa con una API pública de tipos de
  cambio.
- Tres vistas: buscador de clientes, detalle del cliente con su historial de
  simulaciones en tarjetas, y un simulador con slider que enseña la factura al
  momento.

## Qué incluye el repositorio

El código y la carpeta `ai-workspace/`, con el proceso de trabajo con IA: cómo
se planificó (specs, contratos y validaciones antes de programar), qué
arquitectura y directrices se dieron a la IA, y cómo fue el desarrollo con ella
y su control de calidad.

Mi primera lectura de los requisitos, punto por punto, está en
[`evaluacion_inicial_requisitos.md`](evaluacion_inicial_requisitos.md).
