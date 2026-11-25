/**
 * ============================================================================
 * JOEL BARBER SHOP 21 - SISTEMA DE RESERVAS EN TIEMPO REAL
 * Google Calendar + Google Apps Script + CallMeBot (WhatsApp)
 * ============================================================================
 */

// 1. CONSTANTES CONFIGURABLES
const HORARIOS_DIA = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];
const TELEFONO_BARBERO = "593978919928";
const CALLMEBOT_API_KEY = "PEGA_AQUI_TU_APIKEY_DE_CALLMEBOT";
const TIMEZONE_ECUADOR = "GMT-5";
const NOMBRE_LOCAL = "Joel Barber Shop 21";
const DIRECCION_LOCAL = "Atahualpa y Salinas (Parque La Florida), Otavalo";

/**
 * Endpoint GET: Consulta disponibilidad de horarios para una fecha
 * URL: https://script.google.com/macros/s/.../exec?fecha=YYYY-MM-DD
 */
function doGet(e) {
  try {
    const fecha = e && e.parameter ? e.parameter.fecha : null;
    if (!fecha) {
      return jsonResponse({
        ok: false,
        error: "Parámetro 'fecha' requerido (formato YYYY-MM-DD)."
      });
    }

    const cal = CalendarApp.getDefaultCalendar();
    const partes = fecha.split("-");
    const anio = parseInt(partes[0], 10);
    const mes = parseInt(partes[1], 10) - 1;
    const dia = parseInt(partes[2], 10);

    const inicioDia = new Date(anio, mes, dia, 0, 0, 0);
    const finDia = new Date(anio, mes, dia, 23, 59, 59);

    const eventos = cal.getEvents(inicioDia, finDia);
    const ocupadas = [];

    eventos.forEach(function (ev) {
      if (ev.isAllDayEvent()) return;
      // Formatear la hora de inicio en zona horaria de Ecuador (GMT-5)
      const horaStr = Utilities.formatDate(ev.getStartTime(), TIMEZONE_ECUADOR, "HH:mm");
      if (ocupadas.indexOf(horaStr) === -1) {
        ocupadas.push(horaStr);
      }
    });

    return jsonResponse({
      ok: true,
      fecha: fecha,
      horarios: HORARIOS_DIA,
      ocupadas: ocupadas
    });
  } catch (err) {
    return jsonResponse({
      ok: false,
      error: "Error al consultar agenda: " + err.toString()
    });
  }
}

/**
 * Endpoint POST: Procesa y agenda la reserva
 * Body JSON: { nombre, telefono, servicio, fecha, hora }
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ ok: false, mensaje: "Cuerpo de solicitud vacío." });
    }

    const data = JSON.parse(e.postData.contents);
    const nombre = (data.nombre || "").trim();
    const telefono = (data.telefono || "").trim();
    const servicio = (data.servicio || "").trim();
    const fecha = (data.fecha || "").trim(); // YYYY-MM-DD
    const hora = (data.hora || "").trim();   // HH:mm

    if (!nombre || !telefono || !servicio || !fecha || !hora) {
      return jsonResponse({
        ok: false,
        mensaje: "Por favor completa todos los campos requeridos."
      });
    }

    const cal = CalendarApp.getDefaultCalendar();

    const partesFecha = fecha.split("-");
    const partesHora = hora.split(":");
    const anio = parseInt(partesFecha[0], 10);
    const mes = parseInt(partesFecha[1], 10) - 1;
    const dia = parseInt(partesFecha[2], 10);
    const horaNum = parseInt(partesHora[0], 10);
    const minNum = parseInt(partesHora[1], 10);

    const startTime = new Date(anio, mes, dia, horaNum, minNum, 0);
    const endTime = new Date(anio, mes, dia, horaNum + 1, minNum, 0);

    // 1. Doble verificación en Google Calendar para evitar choques en el mismo segundo
    const eventosExistentes = cal.getEvents(startTime, endTime);
    const estaOcupado = eventosExistentes.some(function (ev) {
      return !ev.isAllDayEvent();
    });

    if (estaOcupado) {
      return jsonResponse({
        ok: false,
        mensaje: "Esa hora acaba de ser reservada. Por favor elige otra."
      });
    }

    // 2. Formatear teléfono a estándar Ecuador (593XXXXXXXXX)
    let telEcuador = telefono.replace(/\D/g, "");
    if (telEcuador.startsWith("0")) {
      telEcuador = "593" + telEcuador.substring(1);
    } else if (!telEcuador.startsWith("593")) {
      telEcuador = "593" + telEcuador;
    }

    // 3. Crear enlace WhatsApp en 1 clic para recordatorio del barbero
    const textoRecordatorio = "Hola " + nombre + ", te recordamos tu cita en " + NOMBRE_LOCAL + " hoy a las " + hora + " para tu servicio de " + servicio + ". ¡Te esperamos en " + DIRECCION_LOCAL + "!";
    const linkWhatsApp = "https://wa.me/" + telEcuador + "?text=" + encodeURIComponent(textoRecordatorio);

    const descripcion = [
      "👤 Cliente: " + nombre,
      "📱 WhatsApp: +" + telEcuador,
      "✂️ Servicio: " + servicio,
      "📅 Fecha: " + fecha,
      "🕒 Hora: " + hora,
      "📍 Dirección: " + DIRECCION_LOCAL,
      "",
      "--------------------------------------------------",
      "💬 Enviar recordatorio al cliente por WhatsApp (1 clic):",
      linkWhatsApp
    ].join("\n");

    // 4. Crear evento en Google Calendar con recordatorio popup de 60 min
    const evento = cal.createEvent("✂️ " + nombre + " - " + servicio, startTime, endTime, {
      description: descripcion,
      location: DIRECCION_LOCAL
    });
    evento.addPopupReminder(60);

    // 5. Notificación automática silenciosa al WhatsApp del barbero con CallMeBot
    if (CALLMEBOT_API_KEY && CALLMEBOT_API_KEY !== "PEGA_AQUI_TU_APIKEY_DE_CALLMEBOT") {
      try {
        const msgBarbero = [
          "🔔 *NUEVA RESERVA WEB*",
          "",
          "👤 *Cliente:* " + nombre,
          "✂️ *Servicio:* " + servicio,
          "📅 *Fecha:* " + fecha,
          "🕒 *Hora:* " + hora,
          "📱 *WhatsApp:* +" + telEcuador,
          "📍 *Lugar:* " + DIRECCION_LOCAL
        ].join("\n");

        const urlCallMeBot = "https://api.callmebot.com/whatsapp.php?phone=" +
          encodeURIComponent(TELEFONO_BARBERO) +
          "&text=" + encodeURIComponent(msgBarbero) +
          "&apikey=" + encodeURIComponent(CALLMEBOT_API_KEY);

        UrlFetchApp.fetch(urlCallMeBot, {
          method: "get",
          muteHttpExceptions: true
        });
      } catch (botErr) {
        Logger.log("Aviso: No se pudo enviar notificación de CallMeBot: " + botErr.toString());
      }
    }

    return jsonResponse({
      ok: true,
      mensaje: "Reserva confirmada con éxito",
      fecha: fecha,
      hora: hora,
      servicio: servicio,
      nombre: nombre
    });

  } catch (err) {
    return jsonResponse({
      ok: false,
      mensaje: "Error interno del servidor: " + err.toString()
    });
  }
}

/**
 * Helper para responder en JSON limpio compatible con CORS
 */
function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

