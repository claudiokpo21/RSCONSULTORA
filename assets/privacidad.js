'use strict';
/* privacidad.js — AVISO DE PRIVACIDAD (Ley 25.326 de Protección de los Datos Personales)
   Toma los datos del responsable de config.js → privacidad. Las leyendas del final son las exigidas
   por el art. 14 inc. 3 de la Ley 25.326 y por la Resolución AAIP 14/2018.
   RS Consultora · Fatiga y Conducción Segura */

const PV = Object.assign({ responsable:CONFIG.consultora.nombre, domicilio:'', contacto:'', conservacionAnios:5 }, CONFIG.privacidad || {});
const falta = t => `<span class="pend">[${t} — completar en config.js]</span>`;
const contacto = PV.contacto ? `<a href="mailto:${esc(PV.contacto)}" style="color:#9dbcf5">${esc(PV.contacto)}</a>` : falta('email de contacto');

(function(){
  initBrand();
  $('#view').innerHTML = `<article class="doc">
    <p class="eyebrow">${esc(PV.responsable)} · Capacitación de Higiene y Seguridad</p>
    <h1>Aviso de privacidad</h1>
    <p class="lead">Cómo usamos tus datos personales cuando participás de la capacitación «${esc(CONFIG.capacitacion.nombre)}», conforme a la Ley 25.326 de Protección de los Datos Personales.</p>

    <h2>Quién es el responsable</h2>
    <p><b>${esc(PV.responsable)}</b>${PV.domicilio ? `, con domicilio en ${esc(PV.domicilio)}` : `, ${falta('domicilio')}`}. Contacto: ${contacto}.</p>

    <h2>Qué datos recolectamos</h2>
    <ul>
      <li><b>Evaluación final:</b> DNI, legajo (si lo indicás), nombre, apellido, empresa, sector, tipo de vehículo, firma de asistencia, respuestas, resultado, fecha y hora, y —si la completás— tu opinión sobre la capacitación.</li>
      <li><b>Diagnóstico inicial y refuerzo:</b> son <b>anónimos</b>: no se pide nombre, DNI ni legajo; solo se guardan las respuestas, asociadas a la jornada.</li>
      <li><b>Desafío en vivo:</b> el nombre que escribís se muestra en pantalla durante el juego. Al terminar, solo se guardan los totales anónimos y el nombre de los tres primeros puestos.</li>
    </ul>

    <h2>Para qué los usamos</h2>
    <ul>
      <li>Registrar tu asistencia y el resultado de la evaluación.</li>
      <li>Emitir tu constancia o certificado, y permitir verificar su autenticidad con el código QR.</li>
      <li>Elaborar los informes de la capacitación para la empresa en la que trabajás o para la que se dictó la capacitación.</li>
      <li>Mejorar el contenido de la capacitación a partir de resultados agregados (sin identificar personas).</li>
    </ul>

    <h2>Quién puede verlos</h2>
    <p>${esc(PV.responsable)} y la empresa para la que se dicta la capacitación (por ejemplo, en el informe y la planilla de asistencia). No se venden ni se ceden a terceros con otros fines. Los datos se guardan en servidores de un proveedor de infraestructura en la nube contratado por ${esc(PV.responsable)}, con acceso restringido.</p>

    <h2>¿Es obligatorio?</h2>
    <p>DNI, nombre y apellido son necesarios para registrar la capacitación y emitir la constancia: sin ellos no es posible registrarla. Legajo, empresa, sector, tipo de vehículo y la opinión son opcionales. En la verificación pública de la constancia el DNI se muestra parcialmente oculto.</p>

    <h2>Por cuánto tiempo</h2>
    <p>Mientras sea necesario para acreditar la capacitación realizada, y como máximo ${PV.conservacionAnios} años, salvo que una norma exija conservarlos por más tiempo.</p>

    <h2>Tus derechos</h2>
    <p>Podés pedir <b>acceso</b> a tus datos, su <b>rectificación</b>, actualización o <b>supresión</b> (artículos 14 a 16 de la Ley 25.326) escribiendo a ${contacto}. Te responderemos en los plazos que fija la ley.</p>

    <div class="legal">El titular de los datos personales tiene la facultad de ejercer el derecho de acceso a los mismos en forma gratuita a intervalos no inferiores a seis meses, salvo que se acredite un interés legítimo al efecto conforme lo establecido en el artículo 14, inciso 3 de la Ley N° 25.326.</div>
    <div class="legal">LA AGENCIA DE ACCESO A LA INFORMACIÓN PÚBLICA, en su carácter de Órgano de Control de la Ley N° 25.326, tiene la atribución de atender las denuncias y reclamos que interpongan quienes resulten afectados en sus derechos por incumplimiento de las normas vigentes en materia de protección de datos personales.</div>

    <a class="back" href="index.html" id="pvBack">${ic('arrowl')} Volver</a>
  </article>`;
  // Si se abrió desde el formulario (pestaña nueva), "Volver" cierra esta pestaña.
  $('#pvBack').onclick = e => { if(window.opener){ e.preventDefault(); window.close(); } else if(history.length > 1){ e.preventDefault(); history.back(); } };
})();
