const CONFIG = {
  SUPABASE_URL: "https://zotlmglsjvdhuynfcazu.supabase.co", 
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvdGxtZ2xzanZkaHV5bmZjYXp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwMTAzOTAsImV4cCI6MjEwODU4NjM5MH0._6L5LvSsnNjHDI1D-ZZryySEXCX6V9bcCiIinf4Nb94",
  ALLOWED_GUESTS: ["شيماء", "أسيل", "حور", "شهد", "رند", "نور", "تالا", "آية", "زهراء"],
  WORDS_COUNT: 20
};

// تفعيل أيقونات Lucide
lucide.createIcons();

let supabaseClient = null;
if (CONFIG.SUPABASE_URL.includes("supabase.co")) {
  supabaseClient = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
}

const DOM = {
  bootScreen: document.getElementById("boot-screen"),
  mainApp: document.getElementById("main-app"),
  screens: [document.getElementById("screen-1"), document.getElementById("screen-2"), document.getElementById("screen-3"), document.getElementById("screen-4")],
  dots: document.querySelectorAll(".step-dot"),
  dropdown: document.getElementById("custom-dropdown"),
  dropdownSelected: document.getElementById("dropdown-selected"),
  dropdownSelectedText: document.querySelector("#dropdown-selected span"),
  dropdownOptions: document.getElementById("dropdown-options"),
  optionsList: document.querySelectorAll(".custom-option"),
  greetingBox: document.getElementById("personalized-greeting"),
  btnToRsvp: document.getElementById("btn-to-rsvp"),
  altTimeContainer: document.getElementById("alt-time-container"),
  altTimeInput: document.getElementById("alt-time-input"),
  whatsappInput: document.getElementById("whatsapp-input"),
  whatsappError: document.getElementById("whatsapp-error"),
  capsulesGrid: document.getElementById("capsules-grid"),
  wordsCounter: document.getElementById("words-filled-count"),
  capsulesError: document.getElementById("capsules-error-msg"),
  btnSubmit: document.getElementById("btn-submit-rsvp"),
  submitError: document.getElementById("submit-error"),
  form: document.getElementById("rsvp-form")
};

const state = { guestName: "", attendance: "", time: "", altTime: "", whatsapp: "", words: Array(CONFIG.WORDS_COUNT).fill("") };

// منطق شاشة الإقلاع (Boot Screen) الوهمية
window.onload = () => {
  setTimeout(() => {
    DOM.bootScreen.style.opacity = "0";
    setTimeout(() => {
      DOM.bootScreen.classList.add("hidden");
      DOM.mainApp.classList.remove("hidden");
    }, 500);
  }, 2200); // 2.2 ثانية
};

function goTo(step) {
  DOM.screens.forEach(s => s.classList.remove("active"));
  DOM.screens.forEach(s => s.classList.add("hidden"));
  DOM.screens[step - 1].classList.remove("hidden");
  DOM.screens[step - 1].classList.add("active");
  
  DOM.dots.forEach((dot, idx) => {
    dot.classList.toggle("active", idx === step - 1);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.getElementById("btn-start").onclick = () => goTo(2);
document.querySelectorAll(".btn-back").forEach(btn => {
  btn.onclick = () => goTo(parseInt(btn.dataset.target));
});

// Custom Dropdown Logic
DOM.dropdownSelected.onclick = () => {
  DOM.dropdownOptions.classList.toggle("hidden");
  DOM.dropdown.classList.toggle("active");
};

DOM.optionsList.forEach(option => {
  option.onclick = () => {
    const val = option.getAttribute("data-value");
    DOM.dropdownSelectedText.innerText = val;
    DOM.dropdownOptions.classList.add("hidden");
    DOM.dropdown.classList.remove("active");
    
    if (CONFIG.ALLOWED_GUESTS.includes(val)) {
      state.guestName = val;
      DOM.greetingBox.innerHTML = `<i data-lucide="sparkles" class="icon-sm"></i> يا أهلاً يا ${val}، نورتِ دعوتي ♡`;
      lucide.createIcons();
      DOM.greetingBox.classList.remove("hidden");
      DOM.btnToRsvp.disabled = false;
    }
  };
});

document.addEventListener('click', (e) => {
  if (!DOM.dropdown.contains(e.target)) {
    DOM.dropdownOptions.classList.add("hidden");
    DOM.dropdown.classList.remove("active");
  }
});

DOM.btnToRsvp.onclick = () => goTo(3);

document.querySelectorAll('input[name="attendance"]').forEach(r => {
  r.onchange = e => { state.attendance = e.target.value; validate(); }
});

document.querySelectorAll('input[name="time_suitability"]').forEach(r => {
  r.onchange = e => {
    state.time = e.target.value;
    if(state.time === "alternative") {
      DOM.altTimeContainer.classList.remove("hidden");
      DOM.altTimeInput.focus();
    } else {
      DOM.altTimeContainer.classList.add("hidden");
      state.altTime = ""; DOM.altTimeInput.value = "";
    }
    validate();
  }
});
DOM.altTimeInput.oninput = e => { state.altTime = e.target.value; validate(); };

DOM.whatsappInput.oninput = e => {
  const val = e.target.value.replace(/[\s-]/g, "");
  const isValid = /^((\+962|00962)7[789]\d{7}|07[789]\d{7})$/.test(val);
  DOM.whatsappError.classList.toggle("hidden", val.length === 0 || isValid);
  state.whatsapp = isValid ? val : "";
  validate();
};

function renderCapsules() {
  DOM.capsulesGrid.innerHTML = "";
  for (let i = 0; i < CONFIG.WORDS_COUNT; i++) {
    const div = document.createElement("div"); div.className = "capsule-item"; div.id = `capsule-box-${i}`;
    const span = document.createElement("span"); span.className = "capsule-num"; span.innerText = (i+1).toString().padStart(2, '0');
    const inp = document.createElement("input"); inp.className = "capsule-input"; inp.type = "text";
    
    inp.oninput = (e) => handleWord(i, e.target.value);
    inp.onpaste = (e) => { e.preventDefault(); handlePaste(i, (e.clipboardData || window.clipboardData).getData("text")); };
    
    div.append(span, inp);
    DOM.capsulesGrid.append(div);
  }
}

function handleWord(idx, val) {
  DOM.capsulesError.classList.toggle("hidden", !/\s/.test(val.trim()));
  const word = val.trim().split(/\s+/)[0] || "";
  state.words[idx] = word;
  
  const box = document.getElementById(`capsule-box-${idx}`);
  box.querySelector("input").value = word;
  box.classList.toggle("filled", word.length > 0);
  updateWordsCounter();
}

function handlePaste(startIdx, text) {
  const words = text.trim().split(/[\s,،]+/).filter(w => w.length > 0);
  let curr = startIdx;
  words.forEach(w => {
    if(curr < CONFIG.WORDS_COUNT) {
      state.words[curr] = w;
      const box = document.getElementById(`capsule-box-${curr}`);
      box.querySelector("input").value = w;
      box.classList.add("filled");
      curr++;
    }
  });
  DOM.capsulesError.classList.add("hidden");
  updateWordsCounter();
}

function updateWordsCounter() {
  const count = state.words.filter(w => w.length > 0).length;
  DOM.wordsCounter.innerText = count;
  validate();
}

function validate() {
  const timeOk = state.time === "suitable" || (state.time === "alternative" && state.altTime.length > 2);
  const wordsOk = state.words.filter(w => w.length > 0).length === CONFIG.WORDS_COUNT;
  const ok = state.guestName && state.attendance && timeOk && state.whatsapp && wordsOk;
  DOM.btnSubmit.disabled = !ok;
}

DOM.form.onsubmit = async (e) => {
  e.preventDefault();
  if(!supabaseClient) {
    DOM.submitError.innerText = "لم يتم ربط قاعدة البيانات (وضع المعاينة). الرجاء إضافة روابط Supabase.";
    DOM.submitError.classList.remove("hidden");
    return;
  }
  
  DOM.btnSubmit.disabled = true;
  DOM.btnSubmit.querySelector(".btn-text").innerText = "جاري الحفظ بكل حب...";
  
  const payload = {
    guest_name: state.guestName, attendance_choice: state.attendance,
    time_suitable: state.time === "suitable" ? "مناسب" : "وقت بديل",
    preferred_time: state.altTime, whatsapp_number: state.whatsapp, words: state.words
  };
  
  const { error } = await supabaseClient.from("party_rsvps").insert([payload]);
  
  if(error) {
    DOM.submitError.innerText = `حدث خطأ: ${error.message}`;
    DOM.submitError.classList.remove("hidden");
    DOM.btnSubmit.disabled = false;
    DOM.btnSubmit.querySelector(".btn-text").innerText = "أرسلي حبّك للطيفة";
  } else {
    document.getElementById("success-message-dynamic").innerHTML = `والله إني مبسوطة إنك راح تيجي يا ${state.guestName}! 🥹♡<br>وإنتِ راح تكوني عندي الساعة 5:00 بالزبط... ممنوع التأخير!<br>اللوكيشن بيتي، قريب من مدرسة الأندلس عند سوبر ماركت فاميلي، ورح أبعتلك إياه على الواتساب.`;
    if(state.time === "alternative") document.getElementById("success-alt-time-note").classList.remove("hidden");
    goTo(4);
  }
};

renderCapsules();