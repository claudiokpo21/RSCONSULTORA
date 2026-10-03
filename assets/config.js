'use strict';
/* config.js — CONFIGURACIÓN EDITABLE (empresa, capacitador, aprobación, integración)
   RS Consultora · Fatiga y Conducción Segura */

/* =====================================================================
   a) CONFIGURACIÓN EDITABLE
   Modificar estos valores para adaptar la capacitación a cada empresa.
   ===================================================================== */
const CONFIG = {
  capacitacion: {
    nombre: 'Fatiga y Conducción Segura – Vehículos Livianos y Pesados',
    codigo: 'RS-HYS-FAT-01',
    version: '1.0'
  },
  // Identidad de la consultora que dicta la capacitación (editable).
  consultora: {
    nombre: 'RS Consultora',
    iniciales: 'RS',
    capacitador: 'Lic. Roberto Seguin',
    rol: 'Capacitador',
    mensaje: 'En RS Consultora creemos que la seguridad se construye entre todos. Esta capacitación es para vos, que conducís todos los días: reconocer la fatiga y detenerse a tiempo es cuidarte a vos, a tu equipo y a quienes te esperan en casa.'
  },
  // Criterio de aprobación (porcentaje mínimo). Modificable.
  aprobacion: { porcentajeMinimo: 80 },

  // Formato válido de legajo: 3 a 12 caracteres alfanuméricos (se admite guion).
  legajo: { patron: /^[A-Za-z0-9-]{3,12}$/, descripcion: 'Entre 3 y 12 caracteres: letras, números o guion.' },

  // Acceso de administración. IMPORTANTE: en una versión local sin servidor esta clave
  // es solo una barrera básica (puede leerse en el código). Cambiarla antes de usar.
  // En el sitio publicado cualquiera puede ver este archivo: la clave es solo una barrera básica.
  // recordarEquipo: permite marcar 'Recordar este equipo' para no volver a ingresarla en ese dispositivo.
  admin: { habilitado: true, password: 'CambiarClave2026', recordarEquipo: true },

  // Datos opcionales de la organización (dejar '' si no se usan).
  organizacion: {
    empresa: '',                 // Empresa cliente (precarga el campo EMPRESA). Ej.: 'Empresa S.A.'
    logo: '',                    // Logo de RS Consultora: ruta o data URI (si está vacío se usa el monograma RS). Ej.: 'logo.png' (misma carpeta que este archivo)
    capacitador: '',             // Opcional: reemplaza a consultora.capacitador
    fecha: '',                   // Ej.: '25/09/2026'
    sector: '',                  // Ej.: 'Operaciones – Yacimiento Norte'
    duracion: '',                // Ej.: '60 minutos'
    politicaConduccion: { titulo: '', enlace: '' },   // Política interna de conducción
    procedimientoFatiga: { titulo: '', enlace: '' }   // Procedimiento de gestión de fatiga
  },

  // Almacenamiento local (solo este navegador / dispositivo).
  almacenamiento: { clave: 'hys_fatiga_registros_v1', claveSesion: 'hys_fatiga_sesion_v1' },

  // Punto de integración futura (SharePoint, Power Automate, API, base de datos).
  // Si se define una función, se llama cada vez que se guarda un registro.
  // Ejemplo (Power Automate / API REST):
  //   enviarResultado: (registro) => fetch('https://<url-del-flujo>', {
  //       method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(registro) })
  integracion: {
    // URL de la aplicación web de Google Apps Script (ver apps-script/Code.gs y README.md).
    // Vacío = prototipo: los resultados quedan solo en el dispositivo de cada participante.
    endpoint: '',
    // Enlace a la planilla de Google Sheets con los resultados (se muestra en Administración).
    planillaUrl: '',
    // Alternativa avanzada: función propia de envío (tiene prioridad sobre endpoint).
    enviarResultado: null
  },

  // URL fija de la evaluación para el QR. Vacío = se calcula automáticamente según dónde esté publicado.
  publicacion: { urlEvaluacion: '' },

  // SUPABASE: registro central, administración, informes y desafío en vivo.
  // Proyecto 'Inventario Clear'. Los datos viven en el schema privado rs_capacitacion y solo se
  // accede mediante las funciones public.rs_* (ver README: Registro central).
  // La clave es la PÚBLICA (publishable): es seguro que esté en el sitio. Nunca poner la service_role.
  // Dejar url vacía para volver al modo local (sin servidor).
  supabase: {
    url: 'https://hhwfhearafhmougtfssu.supabase.co',
    clavePublica: 'sb_publishable_UlhKyAUIXPFxrKkEb0lJxw_66kgPg9o'
  },

  // REGISTRO DE ASISTENCIA con firma en pantalla antes de la evaluación.
  asistencia: { firmaObligatoria: true },

  // DESAFÍO EN VIVO (vivo.html + jugar.html). Usa el canal de tiempo real de Supabase.
  // Sin Supabase funciona en modo demostración (participantes simulados o pestañas del mismo navegador).
  vivo: {
    tiempoPregunta: 20,       // segundos por pregunta
    puntosBase: 500,          // puntos por respuesta correcta
    puntosVelocidad: 500,     // bonus máximo por responder rápido
    maxParticipantes: 150
  },

  // REPORTES, CERTIFICADOS Y DIAGNÓSTICO
  reportes: {
    // Vigencia del certificado en meses (0 = sin vencimiento). La define RS Consultora:
    // no es un plazo legal. Se usa para el aviso de vencimientos del informe por empresa.
    vigenciaMeses: 12,
    // true = el certificado de aprobación muestra el porcentaje obtenido; false = solo dice APROBADO.
    mostrarNotaEnCertificado: false,
    avisoVencimientoDias: 60,   // anticipación del aviso 'por vencer'
    // Diagnóstico inicial anónimo (antes de la charla): números de pregunta de la evaluación
    // (0 = la primera). Se comparan con la evaluación final para medir el aprendizaje.
    diagnostico: [1, 2, 4, 8, 9]
  }
};

