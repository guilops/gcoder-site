"use strict";

const config = window.GCODER_CONFIG || {};
const supabaseReady = Boolean(
  config.supabaseUrl &&
  config.supabaseAnonKey &&
  window.supabase &&
  window.supabase.createClient
);
const db = supabaseReady
  ? window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey)
  : null;
const contactForm = document.querySelector("#contact-form");
const contactFeedback = document.querySelector("#contact-feedback");
const adminOverlay = document.querySelector("#admin-overlay");
const loginForm = document.querySelector("#login-form");
const loginFeedback = document.querySelector("#login-feedback");
const dashboard = document.querySelector("#dashboard");
const loginSection = document.querySelector("#admin-login");
const calendarGrid = document.querySelector("#calendar-grid");
const bookingList = document.querySelector("#booking-list");
const monthNames = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });
const dateNames = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "numeric",
  month: "long",
});
const dayNames = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const services = [
  "Criação de sites",
  "Formatação de computadores",
  "Limpeza e remoção de vírus",
  "Manutenção e otimização",
  "Outro serviço de informática",
];
const heroPhotos = [
  {
    caption: "Tecnologia para tirar suas ideias do papel",
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1400&q=85",
    source: "https://unsplash.com/photos/macbook-pro-on-brown-wooden-table-IJrIeCs3D4g",
  },
  {
    caption: "Cuidado e manutenção para seu computador",
    image: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=1400&q=85",
    source: "https://unsplash.com/s/photos/computer-hardware",
  },
  {
    caption: "Um espaço de trabalho pronto para novas ideias",
    image: "https://images.unsplash.com/photo-1487014679447-9f8336841d58?auto=format&fit=crop&w=1400&q=85",
    source: "https://unsplash.com/s/photos/website-design-workspace",
  },
];
const bookingFields = "id,customer_name,customer_phone,customer_email,service,details,booking_date,booking_time,duration_minutes,status";
let visibleMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
let selectedDate = dateToISO(new Date());
let monthBookings = [];
let monthBlocks = [];
let toastTimer;

function dateToISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function setFeedback(element, message, isSuccess = false) {
  element.textContent = message;
  element.classList.toggle("success", isSuccess);
}

function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("visible"), 3400);
}

function formatWhatsappNumber(phone) {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("55") ? digits : `55${digits}`;
}

function setupContactLinks() {
  const phone = (config.whatsappNumber || "").replace(/\D/g, "");
  const contactEmail = (config.contactEmail || "").trim();
  const instagramUrl = (config.instagramUrl || "").trim();
  const githubUrl = (config.githubUrl || "").trim();
  for (const link of document.querySelectorAll("[data-whatsapp]")) {
    if (phone) {
      link.href = `https://wa.me/${phone}`;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.setAttribute("aria-label", "Conversar pelo WhatsApp");
    } else {
      link.hidden = true;
    }
  }
  for (const link of document.querySelectorAll("[data-email]")) {
    if (contactEmail) {
      link.href = `mailto:${contactEmail}`;
    } else {
      link.hidden = true;
    }
  }
  for (const link of document.querySelectorAll("[data-instagram]")) {
    if (instagramUrl) {
      link.href = instagramUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.setAttribute("aria-label", "Acompanhe a Gcoder no Instagram");
    } else {
      link.hidden = true;
    }
  }
  for (const link of document.querySelectorAll("[data-github]")) {
    if (githubUrl) {
      link.href = githubUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.setAttribute("aria-label", "Veja os projetos da Gcoder no GitHub");
    } else {
      link.hidden = true;
    }
  }
  for (const element of document.querySelectorAll("[data-brand-name]")) {
    if (config.businessName) {
      const textNode = [...element.childNodes].find((node) => node.nodeType === Node.TEXT_NODE);
      if (textNode) textNode.textContent = config.businessName;
    }
  }
  for (const element of document.querySelectorAll("[data-brand-tagline]")) {
    if (config.businessTagline) element.textContent = config.businessTagline;
  }
  for (const area of document.querySelectorAll("[data-area]")) {
    area.textContent = config.serviceArea || "Consulte a disponibilidade para a sua região.";
  }
}

function removeLegacyMonetagServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      const scriptUrl = registration.active?.scriptURL || registration.waiting?.scriptURL || registration.installing?.scriptURL;
      if (scriptUrl && new URL(scriptUrl).pathname === "/sw.js") {
        void registration.unregister();
      }
    }
  }).catch(() => {});
}

function setupCourseCheckout() {
  const link = document.querySelector("#logic-course-buy");
  if (!link) return;
  const configuredUrl = typeof config.hotmartLogicUrl === "string"
    ? config.hotmartLogicUrl.trim()
    : "";
  let checkoutUrl;
  try {
    const candidate = new URL(configuredUrl);
    if (
      candidate.protocol === "https:" &&
      (candidate.hostname === "hotmart.com" || candidate.hostname.endsWith(".hotmart.com"))
    ) checkoutUrl = candidate.href;
  } catch {
    checkoutUrl = null;
  }
  if (!checkoutUrl) {
    link.addEventListener("click", (event) => event.preventDefault());
    return;
  }
  link.href = checkoutUrl;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.removeAttribute("aria-disabled");
  link.removeAttribute("tabindex");
  link.innerHTML = 'Comprar na Hotmart <span aria-hidden="true">↗</span>';
}

function setupContactForm() {
  if (!contactForm) return;
  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(contactForm).entries());
    if (!db) {
      const contactEmail = (config.contactEmail || "").trim();
      if (!contactEmail) {
        setFeedback(contactFeedback, "O formulário ainda não está configurado. Fale com a Gcoder pelo WhatsApp ou Instagram.");
        return;
      }

      const emailBody = [
        `Nome: ${data.name}`,
        `E-mail: ${data.email}`,
        `WhatsApp: ${data.phone || "Não informado"}`,
        `Assunto: ${data.subject}`,
        "",
        "Como podemos ajudar?",
        data.details,
      ].join("\n");
      window.location.href = `mailto:${contactEmail}?subject=${encodeURIComponent(`[Gcoder] ${data.subject}`)}&body=${encodeURIComponent(emailBody)}`;
      setFeedback(contactFeedback, "Seu aplicativo de e-mail deve abrir com a mensagem pronta para revisão e envio.", true);
      return;
    }

    const submitButton = contactForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.firstChild.textContent = "Enviando... ";
    setFeedback(contactFeedback, "");
    try {
      const { error } = await db.functions.invoke("contact-message", {
        body: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          subject: data.subject,
          details: data.details,
          website: data.website,
        },
      });
      if (error) {
        console.error("Could not send the contact message:", error.message);
        setFeedback(contactFeedback, "Não foi possível enviar sua mensagem agora. Tente novamente ou fale com a Gcoder pelo WhatsApp.");
        return;
      }
      contactForm.reset();
      setFeedback(contactFeedback, "Mensagem enviada! Em breve a Gcoder entrará em contato.", true);
    } catch (error) {
      console.error("Contact message request failed:", error);
      setFeedback(contactFeedback, "Não foi possível enviar sua mensagem agora. Tente novamente ou fale com a Gcoder pelo WhatsApp.");
    } finally {
      submitButton.disabled = false;
      submitButton.firstChild.textContent = "Enviar mensagem ";
    }
  });
}

function setupCookieNotice() {
  const notice = document.querySelector("#cookie-notice");
  const closeButton = document.querySelector("#cookie-notice-close");
  const reopenButton = document.querySelector("#cookie-notice-open");
  if (!notice || !closeButton) return;

  const storageKey = "gcoder-cookie-notice-dismissed";
  try {
    notice.hidden = window.localStorage.getItem(storageKey) === "true";
  } catch (error) {
    console.warn("Could not read the cookie notice preference:", error);
    notice.hidden = false;
  }

  closeButton.addEventListener("click", () => {
    notice.hidden = true;
    try {
      window.localStorage.setItem(storageKey, "true");
    } catch (error) {
      console.warn("Could not save the cookie notice preference:", error);
    }
  });
  reopenButton?.addEventListener("click", () => {
    notice.hidden = false;
    try {
      window.localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn("Could not reset the cookie notice preference:", error);
    }
    closeButton.focus();
  });
}

function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (!hours) return `${remainingMinutes} min`;
  return remainingMinutes ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
}

function setupHeroCarousel() {
  const image = document.querySelector("#hero-carousel-image");
  const caption = document.querySelector("#carousel-caption");
  const source = document.querySelector("#photo-credit");
  const dots = document.querySelector("#carousel-dots");
  const counter = document.querySelector("#carousel-counter");
  const toggle = document.querySelector("#carousel-toggle");
  if (!image || !caption || !source || !dots || !counter || !toggle) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let currentIndex = 0;
  let timer;
  let paused = reducedMotion.matches;

  function stopTimer() {
    window.clearInterval(timer);
    timer = undefined;
  }

  function startTimer() {
    stopTimer();
    if (paused || document.hidden || heroPhotos.length < 2) return;
    timer = window.setInterval(() => showPhoto(currentIndex + 1), 3000);
  }

  function showPhoto(index) {
    currentIndex = (index + heroPhotos.length) % heroPhotos.length;
    const photo = heroPhotos[currentIndex];
    image.src = photo.image;
    image.alt = photo.caption;
    caption.textContent = photo.caption;
    source.hidden = !photo.source;
    if (photo.source) {
      source.href = photo.source;
      source.textContent = "Ver imagem";
    }
    counter.textContent = `${String(currentIndex + 1).padStart(2, "0")} / ${String(heroPhotos.length).padStart(2, "0")}`;
    for (const [dotIndex, dot] of [...dots.children].entries()) {
      dot.setAttribute("aria-pressed", String(dotIndex === currentIndex));
    }
    if (currentIndex + 1 < heroPhotos.length) {
      const nextImage = new Image();
      nextImage.src = heroPhotos[currentIndex + 1].image;
    }
    startTimer();
  }

  for (const [index, photo] of heroPhotos.entries()) {
    const dot = document.createElement("button");
    dot.className = "carousel-dot";
    dot.type = "button";
    dot.setAttribute("aria-label", `Mostrar foto ${index + 1}: ${photo.caption}`);
    dot.setAttribute("aria-pressed", String(index === currentIndex));
    dot.addEventListener("click", () => showPhoto(index));
    dots.append(dot);
  }

  document.querySelector("#carousel-previous").addEventListener("click", () => showPhoto(currentIndex - 1));
  document.querySelector("#carousel-next").addEventListener("click", () => showPhoto(currentIndex + 1));
  toggle.addEventListener("click", () => {
    paused = !paused;
    toggle.textContent = paused ? "▶" : "Ⅱ";
    toggle.setAttribute("aria-label", paused ? "Iniciar carrossel" : "Pausar carrossel");
    startTimer();
  });
  image.addEventListener("error", () => {
    console.error(`Não foi possível carregar a foto do carrossel: ${image.src}`);
  });

  const carousel = image.closest(".hero-carousel");
  carousel.addEventListener("click", (event) => {
    if (event.target.closest(".hero-image-label, .photo-credit, .carousel-controls")) return;
    const bounds = carousel.getBoundingClientRect();
    showPhoto(event.clientX < bounds.left + bounds.width / 2 ? currentIndex - 1 : currentIndex + 1);
  });
  document.addEventListener("visibilitychange", startTimer);
  reducedMotion.addEventListener("change", (event) => {
    paused = event.matches;
    toggle.textContent = paused ? "▶" : "Ⅱ";
    toggle.setAttribute("aria-label", paused ? "Iniciar carrossel" : "Pausar carrossel");
    startTimer();
  });
  showPhoto(0);
}

function formatDateTitle(date) {
  const parsed = new Date(`${date}T12:00:00`);
  const value = dateNames.format(parsed);
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function appendBookingField(parent, tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = text;
  parent.append(element);
  return element;
}

function renderBookingList() {
  const dayBookings = monthBookings
    .filter((booking) => booking.booking_date === selectedDate)
    .sort((left, right) => left.booking_time.localeCompare(right.booking_time));
  document.querySelector("#selected-day-title").textContent = formatDateTitle(selectedDate);
  document.querySelector("#day-count").textContent =
    `${dayBookings.length} ${dayBookings.length === 1 ? "compromisso" : "compromissos"}`;
  bookingList.replaceChildren();
  if (dayBookings.length === 0) {
    appendBookingField(bookingList, "p", "empty-day", "Nenhum agendamento para este dia.");
  }
  for (const booking of dayBookings) {
    const card = document.createElement("article");
    card.className = "admin-booking";
    appendBookingField(card, "span", "admin-booking-time", booking.booking_time);
    const details = document.createElement("div");
    details.className = "admin-booking-main";
    appendBookingField(details, "strong", "", booking.customer_name);
    appendBookingField(details, "small", "", `${booking.service} · ${formatDuration(booking.duration_minutes)}${booking.details ? ` · ${booking.details}` : ""}`);
    card.append(details);
    const contact = document.createElement("div");
    contact.className = "admin-booking-contact";
    const phoneLink = document.createElement("a");
    phoneLink.href = `https://wa.me/${formatWhatsappNumber(booking.customer_phone)}`;
    phoneLink.target = "_blank";
    phoneLink.rel = "noopener noreferrer";
    phoneLink.textContent = booking.customer_phone;
    contact.append(phoneLink);
    const emailLink = document.createElement("a");
    emailLink.href = `mailto:${booking.customer_email}`;
    emailLink.textContent = booking.customer_email;
    contact.append(emailLink);
    card.append(contact);
    const actions = document.createElement("div");
    actions.className = "admin-booking-actions";
    appendBookingField(actions, "span", `booking-status ${booking.status}`, statusLabel(booking.status));
    const select = document.createElement("select");
    select.className = "status-select";
    select.setAttribute("aria-label", `Alterar status do agendamento de ${booking.customer_name}`);
    for (const [value, label] of [
      ["pending", "Aguardando"],
      ["confirmed", "Confirmado"],
      ["completed", "Concluído"],
      ["cancelled", "Cancelado"],
    ]) {
      select.add(new Option(label, value, false, booking.status === value));
    }
    select.addEventListener("change", () => updateBookingStatus(booking.id, select.value, select));
    actions.append(select);
    card.append(actions);
    bookingList.append(card);
  }
  const dayBlocks = monthBlocks.filter((block) => block.blocked_date === selectedDate);
  updateScheduleControls(dayBlocks);
  for (const block of dayBlocks) {
    const card = document.createElement("article");
    card.className = "admin-booking schedule-block";
    appendBookingField(card, "span", "admin-booking-time", block.start_time
      ? `${String(block.start_time).slice(0, 5)}–${String(block.end_time).slice(0, 5)}`
      : "Dia todo");
    appendBookingField(card, "strong", "admin-booking-main", "Horário bloqueado");
    const removeButton = document.createElement("button");
    removeButton.className = "button button-outline";
    removeButton.type = "button";
    removeButton.textContent = "Liberar";
    removeButton.addEventListener("click", () => void removeScheduleBlock(block.id));
    card.append(removeButton);
    bookingList.append(card);
  }
}

function getWeekRange(dateValue) {
  const start = new Date(`${dateValue}T12:00:00`);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return { start: dateToISO(start), end: dateToISO(end) };
}

function escapeICalendarText(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function scheduleBlockConflicts(startTime, durationMinutes, blocks) {
  if (!startTime) return blocks.length > 0;
  const start = timeToMinutes(startTime);
  const end = start + durationMinutes;
  return blocks.some((block) =>
    block.start_time === null ||
    (start < timeToMinutes(block.end_time) && end > timeToMinutes(block.start_time))
  );
}

function updateScheduleControls(dayBlocks) {
  const dayButton = document.querySelector("#block-day-button");
  const startSelect = document.querySelector("#block-time");
  const durationSelect = document.querySelector("#block-duration");
  const timeButton = document.querySelector("#block-time-button");
  if (!dayButton || !startSelect || !durationSelect || !timeButton) return;

  const wholeDayBlocked = dayBlocks.some((block) => block.start_time === null);
  const selectedStart = startSelect.value;
  const duration = Number(durationSelect.value);
  const selectedPeriodBlocked = selectedStart &&
    (timeToMinutes(selectedStart) + duration > 18 * 60 ||
      scheduleBlockConflicts(selectedStart, duration, dayBlocks));
  dayButton.disabled = dayBlocks.length > 0;
  startSelect.disabled = wholeDayBlocked;
  durationSelect.disabled = wholeDayBlocked;
  timeButton.disabled = wholeDayBlocked || !selectedStart || selectedPeriodBlocked;
  dayButton.title = dayBlocks.length
    ? "Libere os bloqueios existentes antes de bloquear o dia todo."
    : "";
  timeButton.title = selectedPeriodBlocked
    ? "Esse período já está bloqueado ou termina depois das 18h."
    : "";
}

function foldICalendarLine(line) {
  const encoder = new TextEncoder();
  let folded = "";
  let currentLine = "";
  let currentBytes = 0;
  for (const character of line) {
    const characterBytes = encoder.encode(character).length;
    if (currentBytes + characterBytes > 75) {
      folded += `${currentLine}\r\n `;
      currentLine = "";
      currentBytes = 1;
    }
    currentLine += character;
    currentBytes += characterBytes;
  }
  return folded + currentLine;
}

function formatICalendarDate(date, time) {
  return new Date(`${date}T${time.slice(0, 5)}:00-03:00`)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

function createCalendarFile(bookings) {
  const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Gcoder//Agenda//PT-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];
  for (const booking of bookings) {
    const start = new Date(`${booking.booking_date}T${booking.booking_time.slice(0, 5)}:00-03:00`);
    const end = new Date(start.getTime() + booking.duration_minutes * 60_000);
    const startValue = formatICalendarDate(booking.booking_date, booking.booking_time);
    const endValue = end.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const description = [
      booking.service,
      `Duração: ${formatDuration(booking.duration_minutes)}`,
      `WhatsApp: ${booking.customer_phone}`,
      booking.details,
    ].filter(Boolean).join("\n");
    lines.push(
      "BEGIN:VEVENT",
      `UID:${booking.id}@dmm-montagens`,
      `DTSTAMP:${timestamp}`,
      `DTSTART:${startValue}`,
      `DTEND:${endValue}`,
      `SUMMARY:${escapeICalendarText(`${booking.service} - ${booking.customer_name}`)}`,
      `DESCRIPTION:${escapeICalendarText(description)}`,
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return `${lines.map(foldICalendarLine).join("\r\n")}\r\n`;
}

async function exportConfirmedWeek(button) {
  const { start, end } = getWeekRange(selectedDate);
  button.disabled = true;
  try {
    const { data, error } = await db.from("bookings")
      .select(bookingFields)
      .eq("status", "confirmed")
      .gte("booking_date", start)
      .lte("booking_date", end)
      .order("booking_date")
      .order("booking_time");
    if (error) {
      showToast(`Não foi possível exportar a semana: ${error.message}`);
      return;
    }
    if (data.length === 0) {
      showToast("Não há agendamentos confirmados nesta semana.");
      return;
    }
    const blob = new Blob([createCalendarFile(data)], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `dmm-agenda-${start}-${end}.ics`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    showToast(`${data.length} ${data.length === 1 ? "agendamento exportado" : "agendamentos exportados"} para a agenda.`);
  } finally {
    button.disabled = false;
  }
}

async function addScheduleBlock(startTime = null, durationMinutes = 90) {
  if (!db) return;
  if (startTime && timeToMinutes(startTime) + durationMinutes > 18 * 60) {
    showToast("O bloqueio precisa terminar até 18h. Escolha um período menor.");
    return;
  }
  const dayButton = document.querySelector("#block-day-button");
  const timeButton = document.querySelector("#block-time-button");
  const startSelect = document.querySelector("#block-time");
  const durationSelect = document.querySelector("#block-duration");
  dayButton.disabled = true;
  timeButton.disabled = true;
  startSelect.disabled = true;
  durationSelect.disabled = true;

  const endTime = startTime
    ? `${String(Math.floor((timeToMinutes(startTime) + durationMinutes) / 60)).padStart(2, "0")}:${String((timeToMinutes(startTime) + durationMinutes) % 60).padStart(2, "0")}`
    : null;
  try {
    const { data: existingBlocks, error: blocksError } = await db.from("schedule_blocks")
      .select("start_time,end_time")
      .eq("blocked_date", selectedDate);
    if (blocksError) {
      showToast(`Não foi possível verificar os bloqueios existentes: ${blocksError.message}`);
      return;
    }
    if (scheduleBlockConflicts(startTime, durationMinutes, existingBlocks)) {
      showToast("Esse dia ou horário já está bloqueado. Libere o bloqueio existente ou escolha outro período.");
      await refreshDashboard();
      return;
    }

    const { error } = await db.from("schedule_blocks").insert({
      blocked_date: selectedDate,
      start_time: startTime,
      end_time: endTime,
    });
    if (error) {
      showToast(`Não foi possível bloquear esse período: ${error.message}`);
      return;
    }
    showToast(startTime ? `Horário bloqueado por ${formatDuration(durationMinutes)}.` : "Dia bloqueado.");
    await refreshDashboard();
  } finally {
    updateScheduleControls(monthBlocks.filter((block) => block.blocked_date === selectedDate));
  }
}

function timeToMinutes(value) {
  const [hours, minutes] = value.slice(0, 5).split(":").map(Number);
  return hours * 60 + minutes;
}

async function saveServiceDurations(button) {
  if (!db) return;
  const rows = services.map((service) => {
    const input = [...document.querySelectorAll("[data-duration-service]")]
      .find((element) => element.dataset.durationService === service);
    return { service, duration_minutes: Number(input.value) };
  });
  if (rows.some(({ duration_minutes }) =>
    !Number.isInteger(duration_minutes) || duration_minutes < 30 ||
    duration_minutes > 480 || duration_minutes % 30 !== 0
  )) {
    showToast("Use durações entre 30 minutos e 8 horas, em intervalos de 30 minutos.");
    return;
  }
  button.disabled = true;
  const { error } = await db.from("service_durations").upsert(rows, { onConflict: "service" });
  button.disabled = false;
  if (error) {
    showToast(`Não foi possível salvar as durações: ${error.message}`);
    return;
  }
  showToast("Durações dos serviços salvas.");
}

async function removeScheduleBlock(id) {
  const { error } = await db.from("schedule_blocks").delete().eq("id", id);
  if (error) {
    showToast(`Não foi possível liberar o horário: ${error.message}`);
    return;
  }
  showToast("Horário liberado.");
  await refreshDashboard();
}

function statusLabel(status) {
  return {
    pending: "Aguardando confirmação",
    confirmed: "Confirmado",
    completed: "Concluído",
    cancelled: "Cancelado",
  }[status] || "Status desconhecido";
}

function renderCalendar() {
  calendarGrid.replaceChildren();
  for (const day of dayNames) appendBookingField(calendarGrid, "span", "calendar-cell weekday", day);
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const offset = (firstDay.getDay() + 6) % 7;
  const gridStart = new Date(year, month, 1 - offset);
  const today = dateToISO(new Date());
  document.querySelector("#calendar-month").textContent = monthNames.format(visibleMonth);
  const bookingsByDate = new Map();
  for (const booking of monthBookings) {
    const group = bookingsByDate.get(booking.booking_date) || [];
    group.push(booking);
    bookingsByDate.set(booking.booking_date, group);
  }
  for (let index = 0; index < 42; index += 1) {
    const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index);
    const iso = dateToISO(date);
    const dayBookings = bookingsByDate.get(iso) || [];
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "calendar-cell";
    if (date.getMonth() !== month) cell.classList.add("outside");
    if (iso === today) cell.classList.add("today");
    if (iso === selectedDate) cell.classList.add("selected");
    cell.setAttribute("aria-label", `${formatDateTitle(iso)}${dayBookings.length ? `, ${dayBookings.length} agendamentos` : ""}`);
    appendBookingField(cell, "span", "calendar-date", String(date.getDate()));
    if (dayBookings.length) {
      const pending = dayBookings.some((booking) => booking.status === "pending");
      appendBookingField(cell, "span", `calendar-dot${pending ? " pending" : ""}`, "");
      if (dayBookings.length > 1) appendBookingField(cell, "span", "calendar-booking-count", `${dayBookings.length} horários`);
    }
    cell.addEventListener("click", () => {
      selectedDate = iso;
      if (date.getMonth() !== visibleMonth.getMonth()) {
        visibleMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        refreshDashboard();
        return;
      }
      renderCalendar();
      renderBookingList();
    });
    calendarGrid.append(cell);
  }
}

async function updateBookingStatus(id, status, select) {
  select.disabled = true;
  const { error } = await db.from("bookings").update({ status }).eq("id", id);
  select.disabled = false;
  if (error) {
    showToast(`Não foi possível atualizar o agendamento: ${error.message}`);
    await refreshDashboard();
    return;
  }
  showToast("Status do agendamento atualizado.");
  await refreshDashboard();
}

async function refreshDashboard() {
  const start = dateToISO(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1));
  const end = dateToISO(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0));
  const today = dateToISO(new Date());
  const weekEnd = dateToISO(new Date(Date.now() + 6 * 24 * 60 * 60 * 1000));
  const activeUntil = dateToISO(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000));
  const [calendarResult, activeResult, blocksResult, durationsResult] = await Promise.all([
    db.from("bookings")
    .select(bookingFields)
    .gte("booking_date", start)
    .lte("booking_date", end)
    .order("booking_date")
    .order("booking_time"),
    db.from("bookings")
      .select("booking_date,status")
      .gte("booking_date", today)
      .lte("booking_date", activeUntil),
    db.from("schedule_blocks")
      .select("id,blocked_date,start_time,end_time")
      .gte("blocked_date", start)
      .lte("blocked_date", end),
    db.from("service_durations").select("service,duration_minutes"),
  ]);
  if (calendarResult.error || activeResult.error || blocksResult.error || durationsResult.error) {
    showToast(`Não foi possível carregar a agenda: ${(calendarResult.error || activeResult.error || blocksResult.error || durationsResult.error).message}`);
    return;
  }
  monthBookings = calendarResult.data;
  monthBlocks = blocksResult.data;
  for (const duration of durationsResult.data) {
    const input = [...document.querySelectorAll("[data-duration-service]")]
      .find((element) => element.dataset.durationService === duration.service);
    if (input) input.value = String(duration.duration_minutes);
  }
  const activeBookings = activeResult.data.filter((booking) => booking.status !== "cancelled");
  document.querySelector("#today-count").textContent =
    activeBookings.filter((booking) => booking.booking_date === today).length;
  document.querySelector("#pending-count").textContent =
    activeBookings.filter((booking) => booking.status === "pending").length;
  document.querySelector("#week-count").textContent =
    activeBookings.filter((booking) => booking.booking_date <= weekEnd).length;
  renderCalendar();
  renderBookingList();
}

function showAdmin() {
  adminOverlay.hidden = false;
  document.querySelector("#main-nav")?.classList.remove("open");
  document.querySelector("#menu-toggle")?.setAttribute("aria-expanded", "false");
  if (!db) {
    loginFeedback.textContent = "Configure a conexão segura com a agenda antes de acessar o painel.";
    return;
  }
  db.auth.getSession().then(({ data: { session }, error }) => {
    if (error) {
      setFeedback(loginFeedback, `Não foi possível verificar sua sessão: ${error.message}`);
      return;
    }
    if (session) authorizeAdmin(session);
  });
}

async function authorizeAdmin(session) {
  if (!session?.user) return;
  loginFeedback.textContent = "Verificando acesso...";
  const { data, error } = await db.from("admins").select("user_id").eq("user_id", session.user.id).maybeSingle();
  if (error || !data) {
    if (error) {
      setFeedback(loginFeedback, `Não foi possível verificar a permissão: ${error.message}`);
    } else {
      setFeedback(loginFeedback, "Esta conta não tem acesso ao painel da Gcoder.");
    }
    await db.auth.signOut();
    return;
  }
  loginSection.hidden = true;
  dashboard.hidden = false;
  loginFeedback.textContent = "";
  await refreshDashboard();
}

async function handleLogin(event) {
  event.preventDefault();
  if (!db) {
    setFeedback(loginFeedback, "O painel ainda não está configurado. Consulte as instruções de instalação do projeto.");
    return;
  }
  const button = loginForm.querySelector('[type="submit"]');
  button.disabled = true;
  setFeedback(loginFeedback, "");
  const values = new FormData(loginForm);
  const { data, error } = await db.auth.signInWithPassword({
    email: values.get("email"),
    password: values.get("password"),
  });
  button.disabled = false;
  if (error) {
    setFeedback(loginFeedback, "Não foi possível entrar. Confira o e-mail e a senha.");
    return;
  }
  await authorizeAdmin(data.session);
}

async function signOut() {
  const { error } = await db.auth.signOut();
  if (error) {
    showToast(`Não foi possível sair: ${error.message}`);
    return;
  }
  dashboard.hidden = true;
  loginSection.hidden = false;
  loginForm.reset();
  setFeedback(loginFeedback, "Sessão encerrada.");
}

function refreshSelectedMonth(offset) {
  visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + offset, 1);
  refreshDashboard();
}

function routeToAdmin() {
  const isAdmin = window.location.hash === "#admin" ||
    window.location.pathname.replace(/\/index\.html$/i, "").replace(/\/+$/, "").endsWith("/gestao");
  adminOverlay.hidden = !isAdmin;
  if (isAdmin) showAdmin();
  else {
    loginSection.hidden = false;
    dashboard.hidden = true;
  }
}

const year = document.querySelector("#year");
if (year) year.textContent = String(new Date().getFullYear());
document.querySelector("#menu-toggle")?.addEventListener("click", (event) => {
  const menu = document.querySelector("#main-nav");
  if (!menu) return;
  const isOpen = menu.classList.toggle("open");
  event.currentTarget.setAttribute("aria-expanded", String(isOpen));
});
document.querySelector("#main-nav")?.addEventListener("click", (event) => {
  if (event.target.closest("a")) {
    document.querySelector("#main-nav").classList.remove("open");
    document.querySelector("#menu-toggle").setAttribute("aria-expanded", "false");
  }
});
setupContactForm();
setupCookieNotice();
loginForm.addEventListener("submit", handleLogin);
document.querySelector("#signout-button").addEventListener("click", signOut);
document.querySelector("#previous-month").addEventListener("click", () => refreshSelectedMonth(-1));
document.querySelector("#next-month").addEventListener("click", () => refreshSelectedMonth(1));
document.querySelector("#today-button").addEventListener("click", () => {
  visibleMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  selectedDate = dateToISO(new Date());
  void refreshDashboard();
});
document.querySelector("#export-week-button")?.addEventListener("click", (event) => {
  void exportConfirmedWeek(event.currentTarget);
});
document.querySelector("#block-day-button")?.addEventListener("click", () => void addScheduleBlock());
document.querySelector("#block-time")?.addEventListener("change", () => {
  updateScheduleControls(monthBlocks.filter((block) => block.blocked_date === selectedDate));
});
document.querySelector("#block-duration")?.addEventListener("change", () => {
  updateScheduleControls(monthBlocks.filter((block) => block.blocked_date === selectedDate));
});
document.querySelector("#block-time-button")?.addEventListener("click", () => {
  const select = document.querySelector("#block-time");
  if (!select.value) {
    showToast("Escolha um horário para bloquear.");
    return;
  }
  void addScheduleBlock(select.value, Number(document.querySelector("#block-duration").value));
});
document.querySelector("#save-durations-button")?.addEventListener("click", (event) => {
  void saveServiceDurations(event.currentTarget);
});
setupContactLinks();
removeLegacyMonetagServiceWorker();
setupCourseCheckout();
setupHeroCarousel();
window.addEventListener("hashchange", routeToAdmin);
routeToAdmin();
