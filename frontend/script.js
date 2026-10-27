
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

const STORAGE_PREFIX = "meditrack_demo_v1";
const USER_KEY = `${STORAGE_PREFIX}_users`;
const SESSION_KEY = `${STORAGE_PREFIX}_session`;

let currentUser = null;
let medications = [];
let doseHistory = {};
let settings = { doseNotifications: true, stockNotifications: true };
let isRegistering = false;
let toastTimer = null;
let notificationTimer = null;

const pageNames = {
  dashboard: "Dashboard",
  medications: "My Medications",
  schedule: "Dose Schedule",
  prescriptions: "Prescriptions",
  supplements: "Supplements",
  professional: "Professional Portal",
  settings: "Settings"
};

const vendors = {
  iHerb: "https://www.iherb.com/search?kw=",
  Walmart: "https://www.walmart.com/search?q=",
  Target: "https://www.target.com/s?searchTerm=",
  CVS: "https://www.cvs.com/search?searchTerm=",
  Walgreens: "https://www.walgreens.com/search/results.jsp?Ntt="
};

function getJSON(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function userKey(type) {
  return `${STORAGE_PREFIX}_${type}_${currentUser.id}`;
}

function todayKey() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function makeId() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function notify(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3200);
}

function exampleMedications() {
  return [
    {
      id: makeId(),
      name: "Vitamin D3",
      type: "supplement",
      dosage: "1 softgel",
      quantity: 24,
      threshold: 7,
      time: "09:00",
      frequency: "daily",
      doctor: "",
      notes: "Take with breakfast",
      createdAt: todayKey()
    },
    {
      id: makeId(),
      name: "Amoxicillin",
      type: "medication",
      dosage: "1 capsule",
      quantity: 6,
      threshold: 8,
      time: "08:00",
      frequency: "twice",
      doctor: "Dr. Taylor",
      notes: "Example prescription only",
      createdAt: todayKey()
    },
    {
      id: makeId(),
      name: "Omega-3",
      type: "supplement",
      dosage: "2 softgels",
      quantity: 35,
      threshold: 10,
      time: "12:30",
      frequency: "daily",
      doctor: "",
      notes: "Take with food",
      createdAt: todayKey()
    },
    {
      id: makeId(),
      name: "Cetirizine",
      type: "medication",
      dosage: "1 tablet",
      quantity: 15,
      threshold: 5,
      time: "20:00",
      frequency: "daily",
      doctor: "Dr. Morgan",
      notes: "Example prescription only",
      createdAt: todayKey()
    }
  ];
}

function loadUserData() {
  const savedMeds = getJSON(userKey("medications"), null);
  medications = Array.isArray(savedMeds) ? savedMeds : exampleMedications();
  doseHistory = getJSON(userKey("history"), {});
  settings = getJSON(userKey("settings"), {
    doseNotifications: true,
    stockNotifications: true
  });
  saveData();
}

function saveData() {
  if (!currentUser) return;
  saveJSON(userKey("medications"), medications);
  saveJSON(userKey("history"), doseHistory);
  saveJSON(userKey("settings"), settings);
}

function setupAuth() {
  $("#authToggle").addEventListener("click", () => {
    isRegistering = !isRegistering;
    $("#nameField").classList.toggle("hidden", !isRegistering);
    $("#authName").required = isRegistering;
    $("#authTitle").textContent = isRegistering ? "Create your account" : "Welcome back";
    $("#authSubmit").textContent = isRegistering ? "Create account" : "Sign in";
    $("#authPrompt").textContent = isRegistering ? "Already have an account?" : "Don't have an account?";
    $("#authToggle").textContent = isRegistering ? "Sign in" : "Create account";
  });

  $("#authForm").addEventListener("submit", event => {
    event.preventDefault();
    const email = $("#authEmail").value.trim().toLowerCase();
    const password = $("#authPassword").value;
    const users = getJSON(USER_KEY, []);

    if (isRegistering) {
      if (users.some(user => user.email === email)) {
        notify("An account with this email already exists.");
        return;
      }

      const user = {
        id: makeId(),
        name: $("#authName").value.trim(),
        email,
        password
      };

      if (!user.name) {
        notify("Please enter your name.");
        return;
      }

      users.push(user);
      saveJSON(USER_KEY, users);
      login(user);
      return;
    }

    const user = users.find(item => item.email === email && item.password === password);
    if (!user) {
      notify("Invalid email or password. Create a demo account first.");
      return;
    }
    login(user);
  });
}

function login(user) {
  currentUser = user;
  sessionStorage.setItem(SESSION_KEY, user.id);
  loadUserData();
  $("#authScreen").classList.add("hidden");
  $("#app").classList.remove("hidden");
  $("#authForm").reset();
  renderAll();
  navigate("dashboard");
  startNotificationChecks();
}

function logout() {
  clearInterval(notificationTimer);
  sessionStorage.removeItem(SESSION_KEY);
  currentUser = null;
  medications = [];
  doseHistory = {};
  $("#app").classList.add("hidden");
  $("#authScreen").classList.remove("hidden");
  $("#notificationPanel").classList.add("hidden");
  $("#sidebar").classList.remove("open");
}

function navigate(page) {
  if (!pageNames[page]) return;
  $$(".page").forEach(element => element.classList.remove("active"));
  $(`#${page}Page`).classList.add("active");
  $$(".nav-link[data-page]").forEach(button => {
    button.classList.toggle("active", button.dataset.page === page);
  });
  $("#breadcrumbCurrent").textContent = pageNames[page];
  $("#sidebar").classList.remove("open");
  window.scrollTo(0, 0);
  renderAll();
}

function timeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes) {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(normalized / 60)).padStart(2, "0")}:${String(normalized % 60).padStart(2, "0")}`;
}

function formatTime(time) {
  const [hours, minutes] = time.split(":").map(Number);
  const hour = hours % 12 || 12;
  return `${hour}:${String(minutes).padStart(2, "0")} ${hours >= 12 ? "PM" : "AM"}`;
}

function isScheduledToday(medication) {
  if (medication.frequency !== "weekly") return true;
  const start = new Date(`${medication.createdAt}T12:00:00`);
  const today = new Date(`${todayKey()}T12:00:00`);
  const days = Math.round((today - start) / 86400000);
  return days >= 0 && days % 7 === 0;
}

function getDoses() {
  const doses = [];
  medications.forEach(medication => {
    if (!isScheduledToday(medication)) return;

    const times = [medication.time];
    if (medication.frequency === "twice") {
      times.push(minutesToTime(timeToMinutes(medication.time) + 720));
    }

    times.forEach((time, index) => {
      const key = `${todayKey()}_${medication.id}_${index}`;
      doses.push({
        ...medication,
        doseKey: key,
        doseTime: time,
        taken: Boolean(doseHistory[key])
      });
    });
  });

  return doses.sort((a, b) => timeToMinutes(a.doseTime) - timeToMinutes(b.doseTime));
}

function getStats() {
  const doses = getDoses();
  const taken = doses.filter(dose => dose.taken).length;
  const lowStock = medications.filter(medication => medication.quantity <= medication.threshold);
  return {
    total: medications.length,
    doses,
    taken,
    remaining: doses.length - taken,
    lowStock,
    percentage: doses.length ? Math.round(taken / doses.length * 100) : 0
  };
}

function iconFor(medication) {
  return medication.type === "supplement" ? "◈" : "✚";
}

function emptyState(title, description) {
  return `<div class="empty-state"><div class="empty-icon">✦</div><h3>${title}</h3><p>${description}</p></div>`;
}

function renderDose(dose) {
  const status = dose.taken
    ? `<span class="status-pill taken">✓ Taken</span>`
    : `<button class="btn btn-primary btn-small" data-action="take-dose" data-id="${escapeHTML(dose.doseKey)}" ${dose.quantity <= 0 ? "disabled" : ""}>Mark Taken</button>`;

  return `
    <div class="dose-item">
      <div class="med-icon ${dose.type === "supplement" ? "supplement" : ""}">${iconFor(dose)}</div>
      <div class="dose-details">
        <strong>${escapeHTML(dose.name)}</strong>
        <p>${escapeHTML(dose.dosage)} · ${escapeHTML(dose.notes || "Scheduled dose")}</p>
      </div>
      <span class="dose-time">${formatTime(dose.doseTime)}</span>
      ${status}
    </div>
  `;
}

function renderDashboard() {
  const stats = getStats();
  $("#welcomeName").textContent = currentUser.name.split(" ")[0];
  $("#statMedications").textContent = stats.total;
  $("#statTaken").textContent = `${stats.taken}/${stats.doses.length}`;
  $("#statUpcoming").textContent = stats.remaining;
  $("#statLowStock").textContent = stats.lowStock.length;
  $("#progressPercent").textContent = `${stats.percentage}%`;
  $("#progressRing").style.background = `conic-gradient(var(--primary) ${stats.percentage}%, #edf0fb ${stats.percentage}%)`;
  $("#progressMessage").textContent = stats.doses.length
    ? stats.percentage === 100
      ? "All your scheduled doses are complete!"
      : `${stats.remaining} dose${stats.remaining === 1 ? "" : "s"} left to complete today.`
    : "Add your medications to get started.";

  $("#dashboardSchedule").innerHTML = stats.doses.length
    ? stats.doses.slice(0, 5).map(renderDose).join("")
    : emptyState("No doses scheduled", "Add a medication to create your schedule.");

  $("#dashboardRefills").innerHTML = stats.lowStock.length
    ? stats.lowStock.slice(0, 4).map(medication => `
      <div class="refill-item">
        <div><strong>${escapeHTML(medication.name)}</strong><p>${medication.quantity} pills remaining</p></div>
        <span class="status-pill low">Low stock</span>
      </div>
    `).join("")
    : `<p class="muted small-text">All your medications have sufficient stock.</p>`;
}

function renderMedicationRow(medication) {
  const frequency = {
    daily: "Every day",
    twice: "Twice daily",
    weekly: "Once weekly"
  }[medication.frequency] || "Every day";

  return `
    <div class="med-row">
      <div class="med-icon ${medication.type === "supplement" ? "supplement" : ""}">${iconFor(medication)}</div>
      <div class="med-row-main">
        <strong>${escapeHTML(medication.name)}</strong>
        <p>${escapeHTML(medication.dosage)} · ${frequency} · ${formatTime(medication.time)}</p>
      </div>
      <div class="med-row-side">
        <span class="status-pill ${medication.quantity <= medication.threshold ? "low" : "taken"}">${medication.quantity <= medication.threshold ? "Low Stock" : "In Stock"}</span>
        <small>${medication.quantity} pills left</small>
      </div>
      <div class="row-actions">
        <button class="action-btn" data-action="edit-medication" data-id="${escapeHTML(medication.id)}">Edit</button>
        <button class="action-btn delete" data-action="delete-medication" data-id="${escapeHTML(medication.id)}">Delete</button>
      </div>
    </div>
  `;
}

function renderMedications() {
  const query = $("#medSearch").value.trim().toLowerCase();
  const filter = $("#medFilter").value;

  const filtered = medications.filter(medication => {
    const matchesSearch = medication.name.toLowerCase().includes(query);
    const matchesFilter = filter === "all"
      || medication.type === filter
      || (filter === "low" && medication.quantity <= medication.threshold);
    return matchesSearch && matchesFilter;
  });

  $("#medicationList").innerHTML = filtered.length
    ? filtered.map(renderMedicationRow).join("")
    : emptyState("No medications found", "Try another search or add a medication.");
}

function renderSchedule() {
  const doses = getDoses();
  const taken = doses.filter(dose => dose.taken).length;
  $("#scheduleDate").textContent = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric"
  });
  $("#scheduleSummary").textContent = `${taken} of ${doses.length} completed`;

  if (!doses.length) {
    $("#fullSchedule").innerHTML = emptyState("Your schedule is empty", "Add medications to see your doses.");
    return;
  }

  const groups = {
    Morning: doses.filter(dose => timeToMinutes(dose.doseTime) < 720),
    Afternoon: doses.filter(dose => timeToMinutes(dose.doseTime) >= 720 && timeToMinutes(dose.doseTime) < 1020),
    Evening: doses.filter(dose => timeToMinutes(dose.doseTime) >= 1020)
  };

  $("#fullSchedule").innerHTML = Object.entries(groups)
    .filter(([, items]) => items.length)
    .map(([title, items]) => `<div class="schedule-group-title">${title.toUpperCase()}</div>${items.map(renderDose).join("")}`)
    .join("");
}

function renderPrescriptions() {
  const prescriptions = medications.filter(medication => medication.type === "medication");
  $("#prescriptionList").innerHTML = prescriptions.length
    ? prescriptions.map(medication => `
      <div class="prescription-card">
        <span class="status-pill neutral">Medication Record</span>
        <h3>${escapeHTML(medication.name)}</h3>
        <p><strong>Dosage:</strong> ${escapeHTML(medication.dosage)}</p>
        <p><strong>Prescribed by:</strong> ${escapeHTML(medication.doctor || "Not specified")}</p>
        <p><strong>Remaining:</strong> ${medication.quantity} pills</p>
        <p><strong>Instructions:</strong> ${escapeHTML(medication.notes || "None")}</p>
        <div class="card-actions">
          <button class="action-btn" data-action="edit-medication" data-id="${escapeHTML(medication.id)}">Edit Record</button>
          <button class="action-btn delete" data-action="delete-medication" data-id="${escapeHTML(medication.id)}">Remove</button>
        </div>
      </div>
    `).join("")
    : emptyState("No prescriptions", "Your medication records will appear here.");
}

function renderSupplements() {
  const supplements = medications.filter(medication => medication.type === "supplement");
  $("#supplementList").innerHTML = supplements.length
    ? supplements.map(renderMedicationRow).join("")
    : emptyState("No supplements yet", "Add supplements to your routine.");
}

function renderProfessional() {
  const prescriptions = medications.filter(medication => medication.type === "medication");
  $("#professionalList").innerHTML = prescriptions.length
    ? prescriptions.map(medication => `
      <div class="professional-row">
        <div>
          <strong>${escapeHTML(medication.name)}</strong>
          <p>Current dosage: ${escapeHTML(medication.dosage)} · Prescriber: ${escapeHTML(medication.doctor || "Unspecified")}</p>
        </div>
        <button class="btn btn-secondary btn-small" data-action="change-dosage" data-id="${escapeHTML(medication.id)}">Simulate Dosage Change</button>
      </div>
    `).join("")
    : emptyState("No prescriptions available", "Add a medication record to preview this workflow.");
}

function renderNotifications() {
  const stats = getStats();
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const alerts = [];

  if (settings.stockNotifications) {
    stats.lowStock.forEach(medication => {
      alerts.push({
        title: `${medication.name} is running low`,
        message: `Only ${medication.quantity} pills remaining.`
      });
    });
  }

  if (settings.doseNotifications) {
    stats.doses.filter(dose => !dose.taken && timeToMinutes(dose.doseTime) <= nowMinutes)
      .forEach(dose => {
        alerts.push({
          title: `${dose.name} dose due`,
          message: `Scheduled for ${formatTime(dose.doseTime)}.`
        });
      });
  }

  $("#notificationDot").classList.toggle("hidden", alerts.length === 0);
  $("#notificationList").innerHTML = alerts.length
    ? alerts.map(alert => `<div class="notification-item"><strong>${escapeHTML(alert.title)}</strong><p>${escapeHTML(alert.message)}</p></div>`).join("")
    : `<p class="muted small-text">You're all caught up!</p>`;
}

function renderSettings() {
  $("#settingsName").value = currentUser.name;
  $("#settingsEmail").value = currentUser.email;
  $("#doseNotifications").checked = settings.doseNotifications;
  $("#stockNotifications").checked = settings.stockNotifications;
}

function renderAll() {
  if (!currentUser) return;
  $("#userAvatar").textContent = currentUser.name.charAt(0).toUpperCase();
  $("#topDate").textContent = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric"
  });
  renderDashboard();
  renderMedications();
  renderSchedule();
  renderPrescriptions();
  renderSupplements();
  renderProfessional();
  renderNotifications();
  renderSettings();
}

function openMedicationModal(id = null) {
  $("#medicationForm").reset();
  $("#medId").value = "";
  $("#medQuantity").value = 30;
  $("#medThreshold").value = 7;
  $("#medTime").value = "09:00";

  if (id) {
    const medication = medications.find(item => item.id === id);
    if (!medication) return;

    $("#modalTitle").textContent = "Edit Medication";
    $("#medId").value = medication.id;
    $("#medName").value = medication.name;
    $("#medType").value = medication.type;
    $("#medDosage").value = medication.dosage;
    $("#medQuantity").value = medication.quantity;
    $("#medThreshold").value = medication.threshold;
    $("#medTime").value = medication.time;
    $("#medFrequency").value = medication.frequency;
    $("#medDoctor").value = medication.doctor || "";
    $("#medNotes").value = medication.notes || "";
  } else {
    $("#modalTitle").textContent = "Add Medication";
    if ($("#supplementsPage").classList.contains("active")) {
      $("#medType").value = "supplement";
    }
  }

  $("#medicationModal").classList.remove("hidden");
  $("#medName").focus();
}

function closeMedicationModal() {
  $("#medicationModal").classList.add("hidden");
}

function saveMedication(event) {
  event.preventDefault();

  const id = $("#medId").value;
  const existing = medications.find(item => item.id === id);

  const medication = {
    id: id || makeId(),
    name: $("#medName").value.trim(),
    type: $("#medType").value,
    dosage: $("#medDosage").value.trim(),
    quantity: Number($("#medQuantity").value),
    threshold: Number($("#medThreshold").value),
    time: $("#medTime").value,
    frequency: $("#medFrequency").value,
    doctor: $("#medDoctor").value.trim(),
    notes: $("#medNotes").value.trim(),
    createdAt: existing?.createdAt || todayKey()
  };

  if (!medication.name || !medication.dosage || !medication.time) {
    notify("Please complete the required fields.");
    return;
  }

  if (!Number.isInteger(medication.quantity) || !Number.isInteger(medication.threshold)
      || medication.quantity < 0 || medication.threshold < 0) {
    notify("Pill counts must be nonnegative whole numbers.");
    return;
  }

  if (existing) {
    medications = medications.map(item => item.id === id ? medication : item);
  } else {
    medications.push(medication);
  }

  saveData();
  closeMedicationModal();
  renderAll();
  notify(existing ? "Medication updated successfully." : "Medication added successfully.");
}

function deleteMedication(id) {
  const medication = medications.find(item => item.id === id);
  if (!medication) return;
  if (!confirm(`Remove ${medication.name} from your medication list?`)) return;

  medications = medications.filter(item => item.id !== id);
  Object.keys(doseHistory).forEach(key => {
    if (key.includes(`_${id}_`)) delete doseHistory[key];
  });

  saveData();
  renderAll();
  notify("Medication removed.");
}

function takeDose(key) {
  const dose = getDoses().find(item => item.doseKey === key);
  if (!dose || dose.taken) return;

  const medication = medications.find(item => item.id === dose.id);
  if (!medication || medication.quantity <= 0) {
    notify("No pills remaining. Update your inventory.");
    return;
  }

  doseHistory[key] = true;
  medication.quantity = Math.max(0, medication.quantity - 1);
  saveData();
  renderAll();
  notify(`${medication.name} marked as taken.`);

  if (medication.quantity <= medication.threshold) {
    notify(`${medication.name} is running low: ${medication.quantity} pills left.`);
  }
}

function simulateDosageChange(id) {
  const medication = medications.find(item => item.id === id);
  if (!medication) return;

  const value = prompt(`Demo only: enter a new dosage for ${medication.name}`, medication.dosage);
  if (value === null) return;
  if (!value.trim() || value.length > 80) {
    notify("Please enter a valid dosage.");
    return;
  }

  medication.dosage = value.trim();
  saveData();
  renderAll();
  notify("Demo dosage updated. This is not an authorized prescription change.");
}

function openVendor() {
  const name = $("#orderSupplement").value.trim();
  const vendor = $("#orderVendor").value;
  const quantity = Number($("#orderQuantity").value);

  if (!name) {
    notify("Enter a supplement name.");
    return;
  }
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
    notify("Enter a quantity between 1 and 100.");
    return;
  }

  const url = vendors[vendor] + encodeURIComponent(name);
  window.open(url, "_blank", "noopener,noreferrer");
  notify(`Opening ${vendor} search for ${quantity} item(s).`);
}

async function enableBrowserNotifications() {
  if (!("Notification" in window)) {
    notify("This browser does not support notifications.");
    return;
  }

  if (!window.isSecureContext) {
    notify("Browser notifications require HTTPS or localhost.");
    return;
  }

  try {
    const permission = await Notification.requestPermission();
    notify(permission === "granted" ? "Browser notifications enabled." : "Notification permission was not granted.");
  } catch {
    notify("Could not enable browser notifications.");
  }
}

function checkDueNotifications() {
  if (!currentUser || !settings.doseNotifications) return;
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const sentKey = userKey(`sent_${todayKey()}`);
  const sent = getJSON(sentKey, []);

  getDoses().forEach(dose => {
    const dueMinutes = timeToMinutes(dose.doseTime);
    if (dose.taken || sent.includes(dose.doseKey)) return;

    if (currentMinutes >= dueMinutes && currentMinutes < dueMinutes + 2) {
      try {
        new Notification("MediTrack Dose Reminder", {
          body: `Time for ${dose.name} - ${dose.dosage}`,
          tag: dose.doseKey
        });
        sent.push(dose.doseKey);
      } catch {
        return;
      }
    }
  });

  saveJSON(sentKey, sent);
  renderNotifications();
}

function startNotificationChecks() {
  clearInterval(notificationTimer);
  checkDueNotifications();
  notificationTimer = setInterval(checkDueNotifications, 30000);
}

function setupEvents() {
  document.addEventListener("click", event => {
    const pageButton = event.target.closest("[data-page]");
    if (pageButton) {
      navigate(pageButton.dataset.page);
      return;
    }

    const actionButton = event.target.closest("[data-action]");
    if (!actionButton) return;

    const action = actionButton.dataset.action;
    const id = actionButton.dataset.id;

    if (action === "add-medication") openMedicationModal();
    if (action === "edit-medication") openMedicationModal(id);
    if (action === "delete-medication") deleteMedication(id);
    if (action === "take-dose") takeDose(id);
    if (action === "change-dosage") simulateDosageChange(id);
  });

  $("#medicationForm").addEventListener("submit", saveMedication);
  $("#closeModal").addEventListener("click", closeMedicationModal);
  $("#cancelModal").addEventListener("click", closeMedicationModal);

  $("#medicationModal").addEventListener("click", event => {
    if (event.target === $("#medicationModal")) closeMedicationModal();
  });

  $("#medSearch").addEventListener("input", renderMedications);
  $("#medFilter").addEventListener("change", renderMedications);
  $("#logoutBtn").addEventListener("click", logout);

  $("#menuToggle").addEventListener("click", () => {
    $("#sidebar").classList.toggle("open");
  });

  $("#notificationButton").addEventListener("click", () => {
    renderNotifications();
    $("#notificationPanel").classList.toggle("hidden");
  });

  $("#closeNotifications").addEventListener("click", () => {
    $("#notificationPanel").classList.add("hidden");
  });

  $("#orderButton").addEventListener("click", openVendor);
  $("#enableNotifications").addEventListener("click", enableBrowserNotifications);

  $("#saveProfile").addEventListener("click", () => {
    const name = $("#settingsName").value.trim();
    if (!name) {
      notify("Display name cannot be empty.");
      return;
    }

    const users = getJSON(USER_KEY, []);
    const user = users.find(item => item.id === currentUser.id);
    if (user) {
      user.name = name;
      saveJSON(USER_KEY, users);
    }
    currentUser.name = name;
    renderAll();
    notify("Profile updated.");
  });

  $("#doseNotifications").addEventListener("change", event => {
    settings.doseNotifications = event.target.checked;
    saveData();
    renderNotifications();
  });

  $("#stockNotifications").addEventListener("change", event => {
    settings.stockNotifications = event.target.checked;
    saveData();
    renderNotifications();
  });

  $("#resetDemo").addEventListener("click", () => {
    if (!confirm("Reset your medications and dose history to example data?")) return;
    medications = exampleMedications();
    doseHistory = {};
    saveData();
    renderAll();
    notify("Example data restored.");
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeMedicationModal();
      $("#notificationPanel").classList.add("hidden");
      $("#sidebar").classList.remove("open");
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && currentUser) {
      renderAll();
      checkDueNotifications();
    }
  });
}

function initialize() {
  setupAuth();
  setupEvents();

  const sessionId = sessionStorage.getItem(SESSION_KEY);
  const users = getJSON(USER_KEY, []);
  const user = users.find(item => item.id === sessionId);

  if (user) {
    login(user);
  }
}

document.addEventListener("DOMContentLoaded", initialize);
