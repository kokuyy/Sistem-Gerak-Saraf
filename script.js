"use strict";

const sidebar = document.querySelector("#sidebar");
const menuToggle = document.querySelector("#menu-toggle");
const mobileBackdrop = document.querySelector("#mobile-backdrop");

function setMenuOpen(isOpen) {
  sidebar.classList.toggle("is-open", isOpen);
  mobileBackdrop.hidden = !isOpen;
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Tutup menu navigasi" : "Buka menu navigasi");
  document.body.classList.toggle("menu-open", isOpen);
}

menuToggle.addEventListener("click", () => {
  setMenuOpen(menuToggle.getAttribute("aria-expanded") !== "true");
});
mobileBackdrop.addEventListener("click", () => setMenuOpen(false));
sidebar.querySelectorAll(".nav-link").forEach((link) => {
  link.addEventListener("click", () => setMenuOpen(false));
});

const navLinks = [...document.querySelectorAll(".nav-link")];
const observedSections = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

if ("IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver((entries) => {
    const visibleEntries = entries.filter((entry) => entry.isIntersecting);
    if (!visibleEntries.length) return;
    const currentId = visibleEntries.sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0].target.id;
    navLinks.forEach((link) => {
      const isCurrent = link.getAttribute("href") === `#${currentId}`;
      link.classList.toggle("is-active", isCurrent);
      if (isCurrent) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }, { rootMargin: "-18% 0px -62% 0px", threshold: [0, 0.15, 0.4] });
  observedSections.forEach((section) => sectionObserver.observe(section));
}

const movementModes = {
  sadar: {
    title: "Apa yang terjadi saat kamu mengambil buku?",
    icon: "📖",
    description: "Kamu melihat buku di meja dan memutuskan untuk mengambilnya.",
    type: "DISENGAJA",
    explanation: "<strong>Gerak sadar</strong> direncanakan dan diolah oleh otak sebelum perintah dikirim ke otot.",
    steps: [
      ["Rangsangan", "Mata melihat buku."],
      ["Reseptor", "Reseptor penglihatan menerima informasi."],
      ["Sistem saraf pusat", "Informasi diolah oleh otak."],
      ["Efektor", "Otot lengan menerima perintah."],
      ["Respons", "Tangan bergerak mengambil buku."]
    ]
  },
  refleks: {
    title: "Apa yang terjadi saat tangan menyentuh benda panas?",
    icon: "♨",
    description: "Ilustrasi: kulit menerima rangsangan panas dan tangan segera ditarik menjauh.",
    type: "RESPONS CEPAT",
    explanation: "<strong>Gerak refleks tertentu</strong> diproses cepat melalui sumsum tulang belakang sebelum informasi diteruskan ke otak. Contoh benda panas ini hanya ilustrasi — jangan dicoba.",
    steps: [
      ["Rangsangan", "Kulit menerima rangsangan panas."],
      ["Reseptor", "Reseptor kulit mengirim impuls melalui saraf sensorik."],
      ["Sumsum tulang belakang", "Respons diproses cepat pada jalur refleks."],
      ["Efektor", "Otot lengan menerima perintah melalui saraf motorik."],
      ["Respons", "Tangan segera ditarik menjauh."]
    ]
  }
};

document.querySelectorAll(".mode-button").forEach((button) => {
  button.addEventListener("click", () => {
    const mode = movementModes[button.dataset.mode];
    if (!mode) return;

    document.querySelectorAll(".mode-button").forEach((modeButton) => {
      const isSelected = modeButton === button;
      modeButton.classList.toggle("is-selected", isSelected);
      modeButton.setAttribute("aria-pressed", String(isSelected));
    });

    document.querySelector("#simulation-heading").textContent = mode.title;
    document.querySelector("#scenario-icon").textContent = mode.icon;
    document.querySelector("#scenario-description").textContent = mode.description;
    document.querySelector("#scenario-type").textContent = mode.type;
    document.querySelector("#simulation-explanation").innerHTML = mode.explanation;
    document.querySelector("#pathway").setAttribute("aria-label", `Tahapan ${button.dataset.mode === "sadar" ? "gerak sadar" : "gerak refleks"}`);
    document.querySelectorAll(".path-step").forEach((step, index) => {
      step.querySelector("h4").textContent = mode.steps[index][0];
      step.querySelector("p").textContent = mode.steps[index][1];
      step.classList.remove("is-highlighted");
    });
  });
});

const activityTabs = [...document.querySelectorAll(".activity-tab")];
const activityPanels = [...document.querySelectorAll(".activity-panel")];

function selectActivityTab(tab, moveFocus = false) {
  const selectedTab = typeof tab === "string" ? activityTabs.find((item) => item.dataset.tab === tab) : tab;
  if (!selectedTab) return;

  activityTabs.forEach((item) => {
    const isSelected = item === selectedTab;
    item.classList.toggle("is-active", isSelected);
    item.setAttribute("aria-selected", String(isSelected));
    item.tabIndex = isSelected ? 0 : -1;
  });
  activityPanels.forEach((panel) => {
    const isSelected = panel.dataset.panel === selectedTab.dataset.tab;
    panel.hidden = !isSelected;
    panel.classList.toggle("is-active", isSelected);
  });
  if (moveFocus) selectedTab.focus();
}

activityTabs.forEach((tab, index) => {
  tab.addEventListener("click", () => selectActivityTab(tab));
  tab.addEventListener("keydown", (event) => {
    let nextIndex = index;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % activityTabs.length;
    else if (event.key === "ArrowLeft") nextIndex = (index - 1 + activityTabs.length) % activityTabs.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = activityTabs.length - 1;
    else return;
    event.preventDefault();
    selectActivityTab(activityTabs[nextIndex], true);
  });
});

const worksheetForm = document.querySelector("#worksheet-form");
const saveStatus = document.querySelector("#save-status");
const worksheetStorageKey = "human-body-explorer-worksheet-v1";
let saveTimer;

function setSaveStatus(message, state = "") {
  saveStatus.lastChild.textContent = ` ${message}`;
  saveStatus.classList.remove("is-saving", "is-unsaved");
  if (state) saveStatus.classList.add(state);
}

function loadWorksheet() {
  let savedAnswers;
  try {
    const savedText = localStorage.getItem(worksheetStorageKey);
    if (!savedText) return false;
    savedAnswers = JSON.parse(savedText);
  } catch (error) {
    console.error("Jawaban lembar kerja tidak dapat dibaca dari penyimpanan lokal.", error);
    setSaveStatus("Penyimpanan tidak dapat dibaca", "is-unsaved");
    return false;
  }

  if (!savedAnswers || typeof savedAnswers !== "object" || Array.isArray(savedAnswers)) return false;
  worksheetForm.querySelectorAll("[name]").forEach((field) => {
    if (typeof savedAnswers[field.name] === "string") field.value = savedAnswers[field.name];
  });
  return true;
}

function saveWorksheet() {
  const answers = {};
  worksheetForm.querySelectorAll("[name]").forEach((field) => {
    answers[field.name] = field.value;
  });

  try {
    localStorage.setItem(worksheetStorageKey, JSON.stringify(answers));
    setSaveStatus("Isian tersimpan otomatis");
  } catch (error) {
    console.error("Jawaban lembar kerja tidak dapat disimpan di perangkat ini.", error);
    setSaveStatus("Gagal menyimpan — unduh jawaban untuk menyimpannya", "is-unsaved");
  }
}

loadWorksheet();
worksheetForm.addEventListener("input", () => {
  setSaveStatus("Menyimpan...", "is-saving");
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(saveWorksheet, 350);
});
worksheetForm.addEventListener("change", () => {
  window.clearTimeout(saveTimer);
  saveWorksheet();
});

const eventScenarios = {
  book: [
    "Mata melihat buku di atas meja.",
    "Mata sebagai reseptor penglihatan.",
    "Saraf tepi membawa informasi ke otak; otak mengolahnya lalu mengirim perintah melalui saraf ke otot lengan.",
    "Otot lengan berkontraksi sehingga tangan mengambil buku.",
    "Gerak sadar, karena informasi diolah oleh otak dan gerakan dilakukan dengan sengaja."
  ],
  hot: [
    "Kulit menerima rangsangan panas (ilustrasi saja).",
    "Reseptor pada kulit.",
    "Impuls dibawa saraf sensorik ke sumsum tulang belakang, lalu perintah diteruskan melalui saraf motorik ke otot.",
    "Otot lengan berkontraksi sehingga tangan ditarik menjauh.",
    "Gerak refleks tertentu, karena respons cepat diproses melalui sumsum tulang belakang. Jangan mencoba menyentuh benda panas."
  ],
  custom: ["", "", "", "", ""]
};

const eventFieldNames = ["event-stimulus", "event-receptor", "event-pathway", "event-response", "event-reason"];
const eventSelect = document.querySelector("#event-select");
const customEventWrap = document.querySelector("#custom-event-wrap");
customEventWrap.hidden = eventSelect.value !== "custom";
eventSelect.addEventListener("change", (event) => {
  customEventWrap.hidden = event.target.value !== "custom";
  const scenario = eventScenarios[event.target.value];
  eventFieldNames.forEach((name, index) => {
    worksheetForm.elements.namedItem(name).value = scenario[index];
  });
  saveWorksheet();
});

document.querySelector("#export-worksheet").addEventListener("click", () => {
  const lines = ["LEMBAR KERJA — DIGITAL HUMAN BODY EXPLORER", "IPAS · Kelas X PPLG", ""];
  worksheetForm.querySelectorAll("[name]").forEach((field) => {
    const label = worksheetForm.querySelector(`label[for="${field.id}"]`);
    const fieldLabel = field.getAttribute("aria-label") || label?.textContent.trim() || field.closest("label")?.querySelector("span")?.textContent.trim() || field.name;
    const option = field.tagName === "SELECT" ? field.selectedOptions[0]?.textContent : "";
    lines.push(`${fieldLabel}: ${option || field.value || "(belum diisi)"}`);
  });

  const file = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
  const downloadUrl = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = "lembar-kerja-digital-human-body-explorer.txt";
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
});

document.querySelector("#print-worksheet").addEventListener("click", () => window.print());

const correctAnswers = {
  q1: { value: "b", explanation: "Otak menjadi pusat pengolahan informasi dan koordinasi tubuh." },
  q2: { value: "c", explanation: "Sendi menghubungkan tulang dan memungkinkan gerakan tertentu." },
  q3: { value: "a", explanation: "Pada gerak sadar, informasi diolah oleh otak sebelum perintah dikirim ke otot." },
  q4: { value: "b", explanation: "Sumsum tulang belakang dapat memproses respons refleks tertentu dengan cepat." },
  q5: { value: "c", explanation: "Otot berkontraksi dan relaksasi untuk menghasilkan gerakan." }
};

const quizForm = document.querySelector("#quiz-form");
const quizMessage = document.querySelector("#quiz-message");
const quizResult = document.querySelector("#quiz-result");

quizForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const unanswered = Object.keys(correctAnswers).find((name) => !quizForm.querySelector(`input[name="${name}"]:checked`));
  if (unanswered) {
    quizMessage.textContent = "Lengkapi semua pertanyaan terlebih dahulu, ya.";
    quizForm.querySelector(`input[name="${unanswered}"]`).focus();
    return;
  }

  let score = 0;
  Object.entries(correctAnswers).forEach(([name, answer]) => {
    const question = quizForm.querySelector(`[data-question="${name}"]`);
    const selected = quizForm.querySelector(`input[name="${name}"]:checked`).value;
    const isCorrect = selected === answer.value;
    if (isCorrect) score += 1;
    question.classList.toggle("is-correct", isCorrect);
    question.classList.toggle("is-incorrect", !isCorrect);
    question.querySelector(".answer-feedback").textContent = `${isCorrect ? "Tepat!" : "Belum tepat."} ${answer.explanation}`;
  });

  quizMessage.textContent = "Hasil kuis sudah diperiksa.";
  quizResult.hidden = false;
  quizResult.textContent = score === 5
    ? `Hebat! Skormu ${score} dari 5. Kamu sudah memahami hubungan sistem saraf dan sistem gerak.`
    : `Skormu ${score} dari 5. Baca kembali penjelasan pada jawaban, lalu coba lagi untuk menguatkan pemahamanmu.`;
  quizResult.scrollIntoView({ behavior: "smooth", block: "nearest" });
});

quizForm.addEventListener("change", (event) => {
  if (event.target.matches('input[type="radio"]')) {
    quizResult.hidden = true;
    quizMessage.textContent = "Jawaban berubah. Periksa kembali setelah semua pertanyaan terisi.";
  }
});

quizForm.addEventListener("reset", () => {
  window.setTimeout(() => {
    quizForm.querySelectorAll(".quiz-question").forEach((question) => {
      question.classList.remove("is-correct", "is-incorrect");
      question.querySelector(".answer-feedback").textContent = "";
    });
    quizResult.hidden = true;
    quizMessage.textContent = "Pilih satu jawaban pada setiap pertanyaan.";
  }, 0);
});
