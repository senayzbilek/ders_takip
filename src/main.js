import "./style.css";
import { supabase } from "./supabase.js";

const app = document.querySelector("#app");

// ==========================================
// TEMA SİSTEMİ
// ==========================================

function initTheme() {
  const savedTheme = localStorage.getItem("dersTakipTheme");

  if (savedTheme === "light") {
    document.documentElement.classList.remove("dark");
  } else {
    document.documentElement.classList.add("dark");
  }
}

function toggleTheme() {
  const isDark = document.documentElement.classList.toggle("dark");

  localStorage.setItem("dersTakipTheme", isDark ? "dark" : "light");

  updateThemeButton();
}

function updateThemeButton() {
  const button =
    document.querySelector("#theme-toggle") ||
    document.querySelector("#student-theme-toggle");

  if (!button) return;

  const isDark = document.documentElement.classList.contains("dark");

  button.textContent = isDark ? "☀️" : "🌙";

  button.title = isDark ? "Açık temaya geç" : "Koyu temaya geç";
}

// ==========================================
// LOGIN
// ==========================================

function showLogin() {
  app.innerHTML = `
    <div class="login-page">

      <button
        id="theme-toggle"
        class="theme-toggle"
        aria-label="Tema değiştir"
      >
        🌙
      </button>

      <div class="login-card">

        <div class="logo">📚</div>

        <h1>Ders Takip</h1>

        <p class="subtitle">
          Çalışmalarını takip et, gelişimini gör. ✨
        </p>

        <form id="login-form">

          <div class="form-group">
            <label for="email">E-posta</label>

            <input
              type="email"
              id="email"
              placeholder="ornek@mail.com"
              required
            />
          </div>

          <div class="form-group">
            <label for="password">Şifre</label>

            <input
              type="password"
              id="password"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            class="login-button"
          >
            Giriş Yap →
          </button>

          <button
            type="button"
            id="forgot-password"
            class="forgot-button"
          >
            Şifremi Unuttum
          </button>

          <p id="message"></p>

        </form>

      </div>
    </div>
  `;

  const loginForm = document.querySelector("#login-form");

  const message = document.querySelector("#message");

  const forgotPassword = document.querySelector("#forgot-password");

  const themeToggle = document.querySelector("#theme-toggle");

  themeToggle.addEventListener("click", toggleTheme);

  updateThemeButton();

  // ========================================
  // GİRİŞ YAP
  // ========================================

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.querySelector("#email").value.trim();

    const password = document.querySelector("#password").value;

    message.textContent = "Giriş yapılıyor...";

    message.className = "info";

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error(error);

      message.textContent = "E-posta veya şifre hatalı.";

      message.className = "error";

      return;
    }

    await checkUser(data.user.id);
  });

  // ========================================
  // ŞİFREMİ UNUTTUM
  // ========================================

  forgotPassword.addEventListener("click", async () => {
    const email = document.querySelector("#email").value.trim();

    if (!email) {
      message.textContent = "Önce e-posta adresinizi yazın.";

      message.className = "error";

      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/?reset=1",
    });

    if (error) {
      console.error("Şifre sıfırlama hatası:", error);

      message.textContent =
        error.message || "Şifre sıfırlama bağlantısı gönderilemedi.";

      message.className = "error";

      return;
    }

    message.textContent =
      "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. 📧";

    message.className = "success";
  });
}

// ==========================================
// KULLANICI KONTROLÜ
// ==========================================

async function checkUser(userId) {
  const { data: teacher } = await supabase
    .from("teachers")
    .select("id, name")
    .eq("id", userId)
    .maybeSingle();

  if (teacher) {
    await showTeacherDashboard(teacher);
    return;
  }

  const { data: student } = await supabase
    .from("students")
    .select("id, name, grade")
    .eq("id", userId)
    .maybeSingle();

  if (student) {
    await showStudentDashboard(student);
    return;
  }

  await supabase.auth.signOut();

  alert("Bu hesap Ders Takip sistemine tanımlı değil.");

  showLogin();
}

// ==========================================
// İSİM BAŞ HARFLERİ
// ==========================================

function getInitials(name) {
  const parts = name.trim().split(" ");

  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ==========================================
// ÖĞRETMEN PANELİ
// ==========================================

async function showTeacherDashboard(teacher) {
  const { data: students, error } = await supabase
    .from("students")
    .select("id, name, grade, created_at")
    .order("name");

  if (error) {
    console.error(error);

    app.innerHTML = `
      <div style="
        padding:40px;
        text-align:center;
      ">
        <h2>Bir hata oluştu 😕</h2>
        <p>Öğrenciler yüklenemedi.</p>
      </div>
    `;

    return;
  }

  const studentCount = students?.length || 0;

  app.innerHTML = `
    <div class="dashboard-page">

      <button
        id="theme-toggle"
        class="theme-toggle"
        aria-label="Tema değiştir"
      >
        🌙
      </button>

      <header class="dashboard-header">

        <div>

          <span class="welcome-small">
            ÖĞRETMEN PANELİ
          </span>

          <h1>
            Merhaba, ${teacher.name}! 👋
          </h1>

          <p>
            Öğrencilerinin gelişimini
            buradan takip edebilirsin.
          </p>

        </div>

        <button
          id="logout-button"
          class="logout-button"
        >
          Çıkış
        </button>

      </header>

      <main class="dashboard-content">

        <section class="stats-grid">

          <div class="stat-card">

            <div class="stat-icon">
              👥
            </div>

            <div>

              <span>
                Öğrencilerim
              </span>

              <strong>
                ${studentCount}
              </strong>

            </div>

          </div>

          <div class="stat-card">

            <div class="stat-icon">
              📚
            </div>

            <div>

              <span>
                Bu Hafta
              </span>

              <strong>
                0
              </strong>

              <small>
                soru
              </small>

            </div>

          </div>

          <div class="stat-card">

            <div class="stat-icon">
              📈
            </div>

            <div>

              <span>
                Ortalama Başarı
              </span>

              <strong>
                %0
              </strong>

            </div>

          </div>

        </section>

        <section class="section-header">

          <div>

            <span class="section-label">
              YÖNETİM
            </span>

            <h2>
              Öğrencilerim
            </h2>

          </div>

          <button
            id="add-student-button"
            class="primary-button"
          >
            ＋ Öğrenci Ekle
          </button>

        </section>

        <section
          class="students-list"
          id="students-list"
        >

          ${
            studentCount === 0
              ? `

                <div class="empty-state">

                  <div class="empty-icon">
                    🎒
                  </div>

                  <h3>
                    Henüz öğrencin yok
                  </h3>

                  <p>
                    İlk öğrencini ekleyerek
                    başlayabilirsin.
                  </p>

                  <button
                    id="empty-add-button"
                    class="primary-button"
                  >
                    ＋ İlk Öğrenciyi Ekle
                  </button>

                </div>

              `
              : students
                  .map(
                    (student) => `

                      <div
                        class="student-card"
                        data-student-id="${student.id}"
                      >

                        <div class="student-avatar">
                          ${getInitials(student.name)}
                        </div>

                        <div class="student-info">

                          <h3>
                            ${student.name}
                          </h3>

                          <p>
                            ${student.grade}. Sınıf
                          </p>

                        </div>

                        <div class="student-arrow">
                          →
                        </div>

                      </div>

                    `,
                  )
                  .join("")
          }

        </section>

      </main>

    </div>
  `;

  // ========================================
  // TEMA
  // ========================================

  document
    .querySelector("#theme-toggle")
    ?.addEventListener("click", toggleTheme);

  updateThemeButton();

  // ========================================
  // ÇIKIŞ
  // ========================================

  document
    .querySelector("#logout-button")
    ?.addEventListener("click", async () => {
      await supabase.auth.signOut();

      showLogin();
    });

  // ========================================
  // ÖĞRENCİ EKLE
  // ========================================

  document
    .querySelector("#add-student-button")
    ?.addEventListener("click", showAddStudentModal);

  document
    .querySelector("#empty-add-button")
    ?.addEventListener("click", showAddStudentModal);

  // ========================================
  // ÖĞRENCİ KARTLARI
  // ========================================

  document.querySelectorAll(".student-card").forEach((card) => {
    card.addEventListener("click", () => {
      const studentId = card.dataset.studentId;

      alert(
        `Öğrenci detayları bir sonraki aşamada açılacak.\nID: ${studentId}`,
      );
    });
  });
}

// ==========================================
// ÖĞRENCİ EKLE MODALI
// ==========================================

function showAddStudentModal() {
  document.querySelector("#student-modal")?.remove();

  const modal = document.createElement("div");

  modal.id = "student-modal";

  modal.innerHTML = `

    <div class="student-modal-overlay">

      <div class="student-modal-card">

        <button
          type="button"
          id="close-student-modal"
          class="modal-close"
        >
          ×
        </button>

        <div class="modal-icon">
          🎓
        </div>

        <h2>
          Yeni Öğrenci Ekle
        </h2>

        <p class="modal-description">
          Öğrencinin bilgilerini girerek
          hesabını oluştur.
        </p>

        <form id="student-form">

          <div class="form-group">

            <label for="student-name">
              Öğrenci Adı Soyadı
            </label>

            <input
              type="text"
              id="student-name"
              placeholder="Örn. Ayşe Yılmaz"
              required
              autocomplete="name"
            />

          </div>

          <div class="form-group">

            <label for="student-email">
              E-posta
            </label>

            <input
              type="email"
              id="student-email"
              placeholder="ogrenci@mail.com"
              required
              autocomplete="email"
            />

          </div>

          <div class="form-group">

            <label for="student-grade">
              Sınıf
            </label>

            <select
              id="student-grade"
              required
            >

              <option value="">
                Sınıf seç
              </option>

              <option value="5">
                5. Sınıf
              </option>

              <option value="6">
                6. Sınıf
              </option>

              <option value="7">
                7. Sınıf
              </option>

              <option value="8">
                8. Sınıf
              </option>

            </select>

          </div>

          <p
            id="student-modal-message"
            class="modal-message"
          ></p>

          <div class="modal-actions">

            <button
              type="button"
              id="cancel-student-modal"
              class="secondary-button"
            >
              İptal
            </button>

            <button
              type="submit"
              id="create-student-button"
              class="primary-button"
            >
              Öğrenci Ekle
            </button>

          </div>

        </form>

      </div>

    </div>

  `;

  document.body.appendChild(modal);

  const overlay = document.querySelector(".student-modal-overlay");

  const closeButton = document.querySelector("#close-student-modal");

  const cancelButton = document.querySelector("#cancel-student-modal");

  const form = document.querySelector("#student-form");
  const correctInput = document.querySelector("#study-correct");

  const wrongInput = document.querySelector("#study-wrong");

  const blankInput = document.querySelector("#study-blank");

  const totalDisplay = document.querySelector("#study-total-display");

  function updateStudyTotal() {
    const correct = Number(correctInput.value) || 0;

    const wrong = Number(wrongInput.value) || 0;

    const blank = Number(blankInput.value) || 0;

    const total = correct + wrong + blank;

    totalDisplay.textContent = total;
  }

  correctInput.addEventListener("input", updateStudyTotal);

  wrongInput.addEventListener("input", updateStudyTotal);

  blankInput.addEventListener("input", updateStudyTotal);

  updateStudyTotal();
  const message = document.querySelector("#student-modal-message");

  const createButton = document.querySelector("#create-student-button");

  function closeModal() {
    modal.remove();
  }

  closeButton.addEventListener("click", closeModal);

  cancelButton.addEventListener("click", closeModal);

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      closeModal();
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.querySelector("#student-name").value.trim();

    const email = document
      .querySelector("#student-email")
      .value.trim()
      .toLowerCase();

    const grade = Number(document.querySelector("#student-grade").value);

    if (!name || !email || !grade) {
      message.textContent = "Lütfen tüm alanları doldur.";

      message.className = "modal-message error";

      return;
    }

    createButton.disabled = true;

    createButton.textContent = "Oluşturuluyor...";

    message.textContent = "Öğrenci hesabı oluşturuluyor...";

    message.className = "modal-message info";

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("Oturum bulunamadı. Lütfen tekrar giriş yapın.");
      }

      const { data, error } = await supabase.functions.invoke(
        "create-student",
        {
          body: {
            name,
            email,
            grade,
          },
        },
      );

      if (error) {
        console.error("Edge Function Error:", error);

        throw new Error(error.message || "Öğrenci oluşturulamadı.");
      }

      if (!data?.success) {
        throw new Error(data?.error || "Öğrenci oluşturulamadı.");
      }

      message.textContent = "Öğrenci başarıyla oluşturuldu! 🎉";

      message.className = "modal-message success";

      createButton.textContent = "Tamamlandı ✓";

      setTimeout(async () => {
        closeModal();

        const teacher = await getCurrentTeacher();

        if (teacher) {
          await showTeacherDashboard(teacher);
        }
      }, 1200);
    } catch (error) {
      console.error("Öğrenci ekleme hatası:", error);

      message.textContent =
        error.message || "Öğrenci eklenirken bir hata oluştu.";

      message.className = "modal-message error";

      createButton.disabled = false;

      createButton.textContent = "Öğrenci Ekle";
    }
  });
}

// ==========================================
// MEVCUT ÖĞRETMENİ GETİR
// ==========================================

async function getCurrentTeacher() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    showLogin();

    return null;
  }

  const { data: teacher } = await supabase
    .from("teachers")
    .select("id, name")
    .eq("id", user.id)
    .maybeSingle();

  if (!teacher) {
    await supabase.auth.signOut();

    showLogin();

    return null;
  }

  return teacher;
}

// ==========================================
// ŞİFRE OLUŞTURMA
// ==========================================

async function showSetPassword() {
  app.innerHTML = `
    <div class="auth-page">

      <div class="auth-card password-setup-card">

        <div class="auth-logo">

          <div class="logo-icon">
            📚
          </div>

          <div>
            <h1>Ders Takip</h1>
            <p>Hesabını tamamla</p>
          </div>

        </div>

        <div class="password-setup-content">

          <div class="password-icon">
            🔐
          </div>

          <h2>
            Şifreni oluştur
          </h2>

          <p class="password-description">
            Hesabını kullanmaya başlamak için
            kendine bir şifre belirle.
          </p>

          <form id="set-password-form">

            <div class="form-group">

              <label for="new-password">
                Yeni şifre
              </label>

              <input
                id="new-password"
                type="password"
                placeholder="En az 8 karakter"
                minlength="8"
                required
              />

            </div>

            <div class="form-group">

              <label for="confirm-password">
                Şifre tekrar
              </label>

              <input
                id="confirm-password"
                type="password"
                placeholder="Şifreni tekrar gir"
                minlength="8"
                required
              />

            </div>

            <div
              id="password-message"
              class="modal-message"
            ></div>

            <button
              type="submit"
              class="primary-button password-submit-button"
            >
              Şifremi Oluştur
            </button>

          </form>

        </div>

      </div>

    </div>
  `;

  const form = document.querySelector("#set-password-form");

  const message = document.querySelector("#password-message");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const password = document.querySelector("#new-password").value;

    const confirmPassword = document.querySelector("#confirm-password").value;

    message.textContent = "";
    message.className = "modal-message";

    if (password.length < 8) {
      message.textContent = "Şifren en az 8 karakter olmalı.";

      message.classList.add("error");

      return;
    }

    if (password !== confirmPassword) {
      message.textContent = "Şifreler birbiriyle eşleşmiyor.";

      message.classList.add("error");

      return;
    }

    const button = form.querySelector("button");

    button.disabled = true;

    button.textContent = "Şifre oluşturuluyor...";

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      console.error(error);

      message.textContent =
        error.message || "Şifre oluşturulurken bir hata oluştu.";

      message.classList.add("error");

      button.disabled = false;

      button.textContent = "Şifremi Oluştur";

      return;
    }

    message.textContent = "Şifren başarıyla oluşturuldu! 🎉";

    message.classList.add("success");

    window.history.replaceState({}, document.title, window.location.pathname);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      await supabase.auth.signOut();

      showLogin();

      return;
    }

    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("*")
      .eq("id", user.id)
      .single();

    if (studentError || !student) {
      message.textContent = "Öğrenci profili bulunamadı.";

      message.classList.add("error");

      button.disabled = false;

      button.textContent = "Şifremi Oluştur";

      return;
    }

    setTimeout(() => {
      showStudentDashboard(student);
    }, 800);
  });
}

// ==========================================
// ŞİFRE SIFIRLAMA
// ==========================================

async function showResetPassword() {
  app.innerHTML = `
    <div class="auth-page">

      <div class="auth-card password-setup-card">

        <div class="auth-logo">

          <div class="logo-icon">
            📚
          </div>

          <div>
            <h1>Ders Takip</h1>
            <p>Yeni şifre belirle</p>
          </div>

        </div>

        <div class="password-setup-content">

          <div class="password-icon">
            🔐
          </div>

          <h2>
            Yeni şifreni belirle
          </h2>

          <p class="password-description">
            Hesabın için yeni bir şifre oluştur.
          </p>

          <form id="reset-password-form">

            <div class="form-group">

              <label for="reset-new-password">
                Yeni şifre
              </label>

              <input
                id="reset-new-password"
                type="password"
                placeholder="En az 8 karakter"
                minlength="8"
                required
              />

            </div>

            <div class="form-group">

              <label for="reset-confirm-password">
                Şifre tekrar
              </label>

              <input
                id="reset-confirm-password"
                type="password"
                placeholder="Şifreni tekrar gir"
                minlength="8"
                required
              />

            </div>

            <div
              id="reset-password-message"
              class="modal-message"
            ></div>

            <button
              type="submit"
              class="primary-button password-submit-button"
            >
              Şifremi Güncelle
            </button>

          </form>

        </div>

      </div>

    </div>
  `;

  const form = document.querySelector("#reset-password-form");

  const message = document.querySelector("#reset-password-message");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const password = document.querySelector("#reset-new-password").value;

    const confirmPassword = document.querySelector(
      "#reset-confirm-password",
    ).value;

    message.textContent = "";

    message.className = "modal-message";

    if (password.length < 8) {
      message.textContent = "Şifren en az 8 karakter olmalı.";

      message.classList.add("error");

      return;
    }

    if (password !== confirmPassword) {
      message.textContent = "Şifreler birbiriyle eşleşmiyor.";

      message.classList.add("error");

      return;
    }

    const button = form.querySelector("button");

    button.disabled = true;

    button.textContent = "Şifre güncelleniyor...";

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      console.error(error);

      message.textContent =
        error.message || "Şifre güncellenirken bir hata oluştu.";

      message.classList.add("error");

      button.disabled = false;

      button.textContent = "Şifremi Güncelle";

      return;
    }

    message.textContent = "Şifren başarıyla güncellendi! 🎉";

    message.classList.add("success");

    setTimeout(async () => {
      await supabase.auth.signOut();

      window.history.replaceState({}, document.title, window.location.pathname);

      showLogin();
    }, 1200);
  });
}

// ==========================================
// ÖĞRENCİ İSTATİSTİKLERİ
// ==========================================

async function getStudentStats(studentId) {
  const { data, error } = await supabase
    .from("study_records")
    .select("study_date, correct, wrong, blank, total, success_rate")
    .eq("student_id", studentId)
    .order("study_date", {
      ascending: false,
    });

  if (error) {
    console.error("İstatistikler alınamadı:", error);

    return {
      streak: 0,
      weeklyQuestions: 0,
      successRate: 0,
    };
  }

  const records = data || [];

  // ========================================
  // BU HAFTAKİ SORU
  // ========================================

  const today = new Date();

  const day = today.getDay();

  const diff = day === 0 ? 6 : day - 1;

  const weekStart = new Date(today);

  weekStart.setDate(today.getDate() - diff);

  weekStart.setHours(0, 0, 0, 0);

  const weeklyQuestions = records
    .filter((record) => {
      const recordDate = new Date(record.study_date + "T00:00:00");

      return recordDate >= weekStart;
    })
    .reduce((sum, record) => sum + Number(record.total || 0), 0);

  // ========================================
  // GENEL BAŞARI
  // ========================================

  const totalQuestions = records.reduce(
    (sum, record) => sum + Number(record.total || 0),
    0,
  );

  const totalCorrect = records.reduce(
    (sum, record) => sum + Number(record.correct || 0),
    0,
  );

  const successRate =
    totalQuestions === 0
      ? 0
      : Math.round((totalCorrect / totalQuestions) * 100);

  // ========================================
  // SERİ
  // ========================================

  const studyDates = [...new Set(records.map((record) => record.study_date))];

  let streak = 0;

  const checkDate = new Date();

  checkDate.setHours(0, 0, 0, 0);

  while (true) {
    const dateString = checkDate.toISOString().split("T")[0];

    if (!studyDates.includes(dateString)) {
      break;
    }

    streak++;

    checkDate.setDate(checkDate.getDate() - 1);
  }

  return {
    streak,
    weeklyQuestions,
    successRate,
  };
}

// ==========================================
// ÖĞRENCİ PANELİ
// ==========================================

async function showStudentDashboard(student) {
  app.innerHTML = `
    <div class="student-app">

      <header class="student-header">

        <div>

          <span class="student-greeting">
            MERHABA 👋
          </span>

          <h1>
            ${student.name}
          </h1>

          <p>
            ${student.grade}. Sınıf
          </p>

        </div>

        <div class="student-header-actions">

          <button
            id="student-theme-toggle"
            class="theme-toggle"
            aria-label="Tema değiştir"
          >
            🌙
          </button>

          <button
            id="student-top-logout"
            class="student-top-logout"
          >
            Çıkış Yap
          </button>

        </div>

      </header>

      <main
        id="student-content"
        class="student-content"
      ></main>

      <nav class="student-bottom-nav">

        <button
          class="nav-item active"
          data-page="home"
        >
          <span>🏠</span>
          <small>Ana Sayfa</small>
        </button>

        <button
          class="nav-item"
          data-page="add"
        >
          <span>➕</span>
          <small>Çalışma Ekle</small>
        </button>

        <button
          class="nav-item"
          data-page="analysis"
        >
          <span>📊</span>
          <small>Analiz</small>
        </button>

        <button
          class="nav-item"
          data-page="diary"
        >
          <span>📖</span>
          <small>Günlüğüm</small>
        </button>

        <button
          class="nav-item"
          data-page="profile"
        >
          <span>👤</span>
          <small>Profil</small>
        </button>

      </nav>

    </div>
  `;

  // ========================================
  // ELEMENTLER
  // ========================================

  const content = document.querySelector("#student-content");

  const navItems = document.querySelectorAll(".nav-item");

  // ========================================
  // TEMA
  // ========================================

  document
    .querySelector("#student-theme-toggle")
    ?.addEventListener("click", toggleTheme);

  updateThemeButton();

  // ========================================
  // ÇIKIŞ
  // ========================================

  document
    .querySelector("#student-top-logout")
    ?.addEventListener("click", async () => {
      await supabase.auth.signOut();

      showLogin();
    });

  // ========================================
  // AKTİF MENÜ
  // ========================================

  function setActiveNav(page) {
    navItems.forEach((item) => {
      item.classList.toggle("active", item.dataset.page === page);
    });
  }

  // ========================================
  // ANA SAYFA
  // ========================================

  async function showHome() {
    const stats = await getStudentStats(student.id);

    content.innerHTML = `

      <section class="student-home">

        <div class="hero-card">

          <div>

            <span class="hero-label">
              BUGÜN
            </span>

            <h2>
              Çalışmaya hazır mısın? 🚀
            </h2>

            <p>
              Bugünkü çalışmalarını kaydet,
              gelişimini birlikte takip edelim.
            </p>

          </div>

          <div class="hero-emoji">
            📚
          </div>

        </div>

        <section class="student-stats">

          <div class="student-stat-card">

            <span class="stat-icon">
              🔥
            </span>

            <small>
              Serim
            </small>

            <strong>
              ${stats.streak} gün
            </strong>

          </div>

          <div class="student-stat-card">

            <span class="stat-icon">
              📝
            </span>

            <small>
              Bu Hafta
            </small>

            <strong>
              ${stats.weeklyQuestions} soru
            </strong>

          </div>

          <div class="student-stat-card">

            <span class="stat-icon">
              🎯
            </span>

            <small>
              Başarı
            </small>

            <strong>
              %${stats.successRate}
            </strong>

          </div>

        </section>

        <section class="student-section">

          <div class="student-section-header">

            <div>

              <span class="section-label">
                GENEL DURUM
              </span>

              <h2>
                Konu Durumların
              </h2>

            </div>

          </div>

          <div class="topic-empty">

            <div class="topic-empty-icon">
              📖
            </div>

            <h3>
              Çalışma kayıtlarını burada göreceksin
            </h3>

            <p>
              Çalışmalarını ekledikçe
              konu gelişimin burada görünecek.
            </p>

            <button
              class="primary-button"
              id="home-add-study"
            >
              ＋ Çalışma Ekle
            </button>

          </div>

        </section>

        <section class="student-section">

          <div class="student-section-header">

            <div>

              <span class="section-label">
                SON ÇALIŞMALAR
              </span>

              <h2>
                Son Çalışmaların
              </h2>

            </div>

          </div>

          <div class="recent-empty">
            Henüz kayıt bulunmuyor.
          </div>

        </section>

      </section>
    `;

    document
      .querySelector("#home-add-study")
      ?.addEventListener("click", () => showPage("add"));
  }

  // ========================================
  // SAYFA DEĞİŞTİR
  // ========================================

  async function showPage(page) {
    setActiveNav(page);

    if (page === "home") {
      await showHome();

      return;
    }

    if (page === "add") {
      await showAddStudyPage(content, student);

      return;
    }

    if (page === "analysis") {
      content.innerHTML = `

        <section class="placeholder-page">

          <div class="placeholder-icon">
            📊
          </div>

          <span class="section-label">
            GELİŞİM
          </span>

          <h2>
            Analiz
          </h2>

          <p>
            Başarı oranların, konu gelişimin
            ve haftalık istatistiklerin burada olacak.
          </p>

        </section>
      `;

      return;
    }

    if (page === "diary") {
      content.innerHTML = `

        <section class="placeholder-page">

          <div class="placeholder-icon">
            📖
          </div>

          <span class="section-label">
            GÜNLÜK
          </span>

          <h2>
            Günlüğüm
          </h2>

          <p>
            Günlük çalışma notlarını
            burada tutabileceksin.
          </p>

        </section>
      `;

      return;
    }

    if (page === "profile") {
      content.innerHTML = `

        <section class="placeholder-page">

          <div class="placeholder-icon">
            👤
          </div>

          <span class="section-label">
            HESABIM
          </span>

          <h2>
            Profil
          </h2>

          <p>
            Profilin ve başarı rozetlerin
            burada olacak.
          </p>

          <div class="profile-preview">

            <strong>
              ${student.name}
            </strong>

            <span>
              ${student.grade}. Sınıf
            </span>

          </div>

        </section>
      `;

      return;
    }
  }

  // ========================================
  // ALT MENÜ
  // ========================================

  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      showPage(item.dataset.page);
    });
  });

  // ========================================
  // BAŞLANGIÇ
  // ========================================

  await showHome();
}

// ==========================================
// ÇALIŞMA EKLE SAYFASI
// ==========================================

async function showAddStudyPage(content, student) {
  content.innerHTML = `

    <section class="student-section">

      <div class="student-section-header">

        <div>

          <span class="section-label">
            ÇALIŞMA
          </span>

          <h2>
            Çalışma Ekle
          </h2>

          <p>
            Bugün yaptığın çalışmayı kaydet.
          </p>

        </div>

      </div>

      <form
        id="study-form"
        class="study-form"
      >

        <!-- DERS -->

        <div class="form-group">

          <label for="study-subject">
            Ders
          </label>

          <select
            id="study-subject"
            required
          >

            <option value="">
              Ders seç
            </option>

          </select>

        </div>

        <!-- KONU -->

        <div class="form-group">

          <label for="study-topic">
            Konu
          </label>

          <select
            id="study-topic"
            disabled
          >

            <option value="">
              Önce ders seç
            </option>

          </select>

        </div>

        <!-- ALT KONU -->

        <div class="form-group">

          <label for="study-subtopic">
            Alt konu
          </label>

          <select
            id="study-subtopic"
            disabled
          >

            <option value="">
              Önce konu seç
            </option>

          </select>

        </div>

        <!-- ÇALIŞMA TÜRÜ -->

        <div class="form-group">

          <label for="study-type">
            Çalışma türü
          </label>

          <select
            id="study-type"
            required
          >

            <option value="question">
              Soru Çözümü
            </option>

            <option value="review">
              Konu Tekrarı
            </option>

          </select>

        </div>

<!-- SORU ALANLARI -->

<div id="question-fields">

  <div class="study-number-grid">

    <div class="form-group">

      <label for="study-correct">
        Doğru
      </label>

      <input
        type="number"
        id="study-correct"
        min="0"
        value="0"
        placeholder="0"
      />

    </div>

    <div class="form-group">

      <label for="study-wrong">
        Yanlış
      </label>

      <input
        type="number"
        id="study-wrong"
        min="0"
        value="0"
        placeholder="0"
      />

    </div>

    <div class="form-group">

      <label for="study-blank">
        Boş
      </label>

      <input
        type="number"
        id="study-blank"
        min="0"
        value="0"
        placeholder="0"
      />

    </div>

  </div>

  <!-- OTOMATİK TOPLAM -->

  <div class="study-total-box">

    <span>Toplam Soru</span>

    <strong id="study-total-display">
      0
    </strong>

  </div>

</div>

        <!-- SÜRE -->

        <div class="form-group">

          <label for="study-duration">
            Çalışma Süresi
            <span>(isteğe bağlı)</span>
          </label>

          <input
            type="number"
            id="study-duration"
            min="1"
            placeholder="Dakika"
          />

        </div>

        <!-- NOT -->

        <div class="form-group">

          <label for="study-note">
            Not
            <span>(isteğe bağlı)</span>
          </label>

          <textarea
            id="study-note"
            rows="4"
            placeholder="Örn. Konu tekrarı yaptım, zorlandığım soruları tekrar çözdüm..."
          ></textarea>

        </div>

        <div
          id="study-form-message"
          class="modal-message"
        ></div>

        <button
          type="submit"
          id="save-study-button"
          class="primary-button"
        >
          Çalışmayı Kaydet
        </button>

      </form>

    </section>
  `;

  // ========================================
  // ELEMENTLER
  // ========================================

  const typeSelect = document.querySelector("#study-type");

  const questionFields = document.querySelector("#question-fields");

  const subjectSelect = document.querySelector("#study-subject");

  const topicSelect = document.querySelector("#study-topic");

  const subtopicSelect = document.querySelector("#study-subtopic");

  const form = document.querySelector("#study-form");

  const message = document.querySelector("#study-form-message");

  const saveButton = document.querySelector("#save-study-button");
  // ========================================
  // OTOMATİK TOPLAM SORU HESABI
  // ========================================
// ========================================
// OTOMATİK TOPLAM SORU HESABI
// ========================================

const correctInput =
  document.querySelector("#study-correct");

const wrongInput =
  document.querySelector("#study-wrong");

const blankInput =
  document.querySelector("#study-blank");

const totalDisplay =
  document.querySelector("#study-total-display");

function updateStudyTotal() {

  const correct =
    Number(correctInput.value) || 0;

  const wrong =
    Number(wrongInput.value) || 0;

  const blank =
    Number(blankInput.value) || 0;

  const total =
    correct + wrong + blank;

  totalDisplay.textContent = total;
}

// ========================================
// 0'A BASIP YAZINCA 0'I OTOMATİK SİL
// ========================================

function handleNumberInputFocus(event) {

  if (event.target.value === "0") {
    event.target.value = "";
  }
}

correctInput.addEventListener(
  "focus",
  handleNumberInputFocus
);

wrongInput.addEventListener(
  "focus",
  handleNumberInputFocus
);

blankInput.addEventListener(
  "focus",
  handleNumberInputFocus
);

// ========================================
// YAZDIKÇA TOPLAMI GÜNCELLE
// ========================================

correctInput.addEventListener(
  "input",
  updateStudyTotal
);

wrongInput.addEventListener(
  "input",
  updateStudyTotal
);

blankInput.addEventListener(
  "input",
  updateStudyTotal
);

updateStudyTotal();


[
  correctInput,
  wrongInput,
  blankInput,
  document.querySelector("#study-duration"),
].forEach((input) => {
  input.addEventListener("wheel", (event) => {
    event.preventDefault();
  });
});
  // ========================================
  // SORU ALANLARINI GÖSTER / GİZLE
  // ========================================

  function updateQuestionFields() {
    const type = typeSelect.value;

    if (type === "review") {
      questionFields.style.display = "none";
    } else {
      questionFields.style.display = "block";
    }
  }

  typeSelect.addEventListener("change", updateQuestionFields);

  updateQuestionFields();

  // ========================================
  // DERSLERİ GETİR
  // ========================================

  const { data: subjects, error: subjectError } = await supabase
    .from("subjects")
    .select("*")
    .eq("grade", student.grade)
    .order("name");

  if (subjectError) {
    console.error("Dersler yüklenemedi:", subjectError);

    subjectSelect.innerHTML = `
      <option value="">
        Dersler yüklenemedi
      </option>
    `;

    message.textContent = "Dersler yüklenemedi.";

    message.className = "modal-message error";

    return;
  }

  (subjects || []).forEach((subject) => {
    const option = document.createElement("option");

    option.value = subject.id;

    option.textContent = subject.name;

    subjectSelect.appendChild(option);
  });

  // ========================================
  // DERS DEĞİŞİNCE KONULAR
  // ========================================

  subjectSelect.addEventListener("change", async () => {
    const subjectId = subjectSelect.value;

    topicSelect.innerHTML = `
        <option value="">
          Konu seç
        </option>
      `;

    subtopicSelect.innerHTML = `
        <option value="">
          Önce konu seç
        </option>
      `;

    topicSelect.disabled = true;

    subtopicSelect.disabled = true;

    if (!subjectId) {
      return;
    }

    const { data: topics, error } = await supabase
      .from("topics")
      .select("*")
      .eq("subject_id", subjectId)
      .order("name");

    if (error) {
      console.error("Konular yüklenemedi:", error);

      return;
    }

    topicSelect.disabled = false;

    (topics || []).forEach((topic) => {
      const option = document.createElement("option");

      option.value = topic.id;

      option.textContent = topic.name;

      topicSelect.appendChild(option);
    });
  });

  // ========================================
  // KONU DEĞİŞİNCE ALT KONULAR
  // ========================================

  topicSelect.addEventListener("change", async () => {
    const topicId = topicSelect.value;

    subtopicSelect.innerHTML = `
    <option value="">Alt konu seçin</option>
  `;

    subtopicSelect.disabled = true;

    if (!topicId) {
      return;
    }

    const { data: subtopics, error } = await supabase
      .from("subtopics")
      .select("*")
      .eq("topic_id", topicId)
      .order("name");

    if (error) {
      console.error("Alt konular yüklenemedi:", error);
      return;
    }
    console.log("Seçilen topic ID:", topicId);
    console.log("Öğrenci sınıfı:", student.grade);
    if (!subtopics || subtopics.length === 0) {
      subtopicSelect.innerHTML = `
      <option value="">Bu konuda alt konu bulunmuyor</option>
    `;
      subtopicSelect.disabled = true;
      return;
    }

    subtopicSelect.innerHTML = `
    <option value="">Alt konu seçin</option>
    ${subtopics
      .map(
        (subtopic) => `
      <option value="${subtopic.id}">
        ${subtopic.name}
      </option>
    `,
      )
      .join("")}
  `;

    subtopicSelect.disabled = false;
  });

  // ========================================
  // ÇALIŞMA KAYDET
  // ========================================

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const type = typeSelect.value;

    const correct = Number(document.querySelector("#study-correct").value || 0);

    const wrong = Number(document.querySelector("#study-wrong").value || 0);

    const blank = Number(document.querySelector("#study-blank").value || 0);

    const total = correct + wrong + blank;
    const duration = Number(
      document.querySelector("#study-duration").value || 0,
    );

    const note = document.querySelector("#study-note").value.trim();

    // ====================================
    // KONTROLLER
    // ====================================

    if (type !== "review" && total <= 0) {
      message.textContent = "Lütfen doğru, yanlış veya boş soru sayısını gir.";

      message.className = "modal-message error";

      return;
    }

    if (correct < 0 || wrong < 0 || blank < 0) {
      message.textContent = "Soru sayıları negatif olamaz.";

      message.className = "modal-message error";

      return;
    }

    saveButton.disabled = true;

    saveButton.textContent = "Kaydediliyor...";

    message.textContent = "Çalışman kaydediliyor...";

    message.className = "modal-message info";

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Oturum bulunamadı.");
      }

      // ==================================
      // BAŞARI ORANI
      // ==================================

      const actualTotal = type === "review" ? 0 : total;

      const actualCorrect = type === "review" ? 0 : correct;

      const actualWrong = type === "review" ? 0 : wrong;

      const actualBlank = type === "review" ? 0 : blank;

      const successRate =
        actualTotal > 0 ? Math.round((actualCorrect / actualTotal) * 100) : 0;

      // ==================================
      // KAYIT
      // ==================================

      const { error } = await supabase.from("study_records").insert({
        student_id: user.id,

        subject_id: subjectSelect.value || null,

        topic_id: topicSelect.value || null,

        subtopic_id: subtopicSelect.value || null,

        study_type: type,

        correct: actualCorrect,

        wrong: actualWrong,

        blank: actualBlank,

        study_date: new Date().toISOString().split("T")[0],

        duration_minutes: duration || null,

        note: note || null,
      });

      if (error) {
        throw error;
      }

      // ==================================
      // BAŞARILI
      // ==================================

      message.textContent = "Çalışman başarıyla kaydedildi! 🎉";

      message.className = "modal-message success";

      saveButton.textContent = "Kaydedildi ✓";

      setTimeout(async () => {
        await showPageFromStudent("home", content, student);
      }, 900);
    } catch (error) {
      console.error("Çalışma kaydetme hatası:", error);

      message.textContent = error.message || "Çalışma kaydedilemedi.";

      message.className = "modal-message error";

      saveButton.disabled = false;

      saveButton.textContent = "Çalışmayı Kaydet";
    }
  });
}

// ==========================================
// ÇALIŞMA KAYDI SONRASI ANA SAYFAYA DÖN
// ==========================================

async function showPageFromStudent(page, content, student) {
  if (page === "home") {
    const stats = await getStudentStats(student.id);

    content.innerHTML = `

      <section class="student-home">

        <div class="hero-card">

          <div>

            <span class="hero-label">
              BUGÜN
            </span>

            <h2>
              Çalışmaya devam! 🚀
            </h2>

            <p>
              Çalışman başarıyla kaydedildi.
            </p>

          </div>

          <div class="hero-emoji">
            📚
          </div>

        </div>

        <section class="student-stats">

          <div class="student-stat-card">

            <span class="stat-icon">
              🔥
            </span>

            <small>
              Serim
            </small>

            <strong>
              ${stats.streak} gün
            </strong>

          </div>

          <div class="student-stat-card">

            <span class="stat-icon">
              📝
            </span>

            <small>
              Bu Hafta
            </small>

            <strong>
              ${stats.weeklyQuestions} soru
            </strong>

          </div>

          <div class="student-stat-card">

            <span class="stat-icon">
              🎯
            </span>

            <small>
              Başarı
            </small>

            <strong>
              %${stats.successRate}
            </strong>

          </div>

        </section>

        <section class="student-section">

          <div class="student-section-header">

            <div>

              <span class="section-label">
                ÇALIŞMA
              </span>

              <h2>
                Yeni bir çalışma ekle
              </h2>

            </div>

          </div>

          <button
            class="primary-button"
            id="new-study-after-save"
          >
            ＋ Çalışma Ekle
          </button>

        </section>

      </section>
    `;

    document
      .querySelector("#new-study-after-save")
      ?.addEventListener("click", () => showAddStudyPage(content, student));
  }
}

// ==========================================
// UYGULAMA BAŞLANGICI
// ==========================================

async function init() {
  initTheme();

  const urlParams = new URLSearchParams(window.location.search);

  const isInvite = urlParams.get("invite") === "1";

  const isReset = urlParams.get("reset") === "1";

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (isReset && session?.user) {
    await showResetPassword();

    return;
  }

  if (session?.user) {
    if (isInvite) {
      await showSetPassword();

      return;
    }

    await checkUser(session.user.id);
  } else {
    showLogin();
  }
}

// ==========================================
// BAŞLAT
// ==========================================

init();
