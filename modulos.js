'use strict';
/* modulos.js — CURSOS (MÓDULOS) DE LA PLATAFORMA
   Cada módulo es una capacitación con su presentación, sus actividades y su evaluación.
   Para sumar un curso nuevo:
     1. Copiar sus páginas (por ejemplo en una carpeta /cursos/<id>/) y sus archivos.
     2. Agregar aquí un elemento con estado:'activo' y sus accesos.
     3. Agregar las rutas privadas del curso en middleware.js (config.matcher).
   Las jornadas guardan el nombre de la capacitación, así los informes y certificados de cada curso
   quedan separados aunque se usen la misma Administración y la misma base.
   RS Consultora · Capacitaciones */

const MODULOS = [
  { id:'fatiga', estado:'activo', icon:'steering',
    nombre:'Fatiga y conducción segura', sub:'Vehículos livianos y pesados',
    d:'Presentación de 22 pantallas con 10 videos, actividades interactivas, desafío en vivo, evaluación con constancia y refuerzo a 30 días.',
    accesos:[
      { t:'Presentación',          href:'capacitacion.html', icon:'play',      d:'Para proyectar en la sala.' },
      { t:'Desafío en vivo',       href:'vivo.html',         icon:'zap',       d:'Preguntas por equipos con el celular.' },
      { t:'Guía del capacitador',  href:'guia.html',         icon:'clipboard', d:'Agenda y pantalla por pantalla.' },
      { t:'Actividades',           href:'actividades.html',  icon:'target',    d:'Juegos, dibujos y gráficos.' },
      { t:'Afiche',                href:'afiche.html',       icon:'print',     d:'Para imprimir o compartir.' }
    ] },
  { id:'nuevo', estado:'proximamente', icon:'calendar',
    nombre:'Próximo curso', sub:'Lugar reservado para un nuevo módulo',
    d:'La plataforma ya está preparada para sumar otras capacitaciones con el mismo ingreso, la misma Administración y los mismos informes.' }
];
