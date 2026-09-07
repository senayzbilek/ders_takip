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
  const isDark =
    document.documentElement.classList.toggle("dark");

  localStorage.setItem(
    "dersTakipTheme",
    isDark ? "dark" : "light"
  );

  updateThemeButton();
}

function updateThemeButton() {
  const button =
    document.querySelector("#theme-toggle") ||
    document.querySelector("#student-theme-toggle");

  if (!button) return;

  const isDark =
    document.documentElement.classList.contains("dark");

  button.textContent = isDark ? "☀️" : "🌙";

  button.title = isDark
    ? "Açık temaya geç"
    : "Koyu temaya geç";
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

  const loginForm =
    document.querySelector("#login-form");

  const message =
    document.querySelector("#message");

  const forgotPassword =
    document.querySelector("#forgot-password");

  const themeToggle =
    document.querySelector("#theme-toggle");

  themeToggle.addEventListener(
    "click",
    toggleTheme
  );

  updateThemeButton();

  // ========================================
  // GİRİŞ YAP
  // ========================================

  loginForm.addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();

      const email = document
        .querySelector("#email")
        .value
        .trim();

      const password =
        document.querySelector("#password").value;

      message.textContent =
        "Giriş yapılıyor...";

      message.className = "info";

      const { data, error } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (error) {
        message.textContent =
          "E-posta veya şifre hatalı.";

        message.className = "error";

        return;
      }

      await checkUser(data.user.id);
    }
  );

  // ========================================
  // ŞİFREMİ UNUTTUM
  // ========================================

  forgotPassword.addEventListener(
    "click",
    async () => {
      const email = document
        .querySelector("#email")
        .value
        .trim();

      if (!email) {
        message.textContent =
          "Önce e-posta adresinizi yazın.";

        message.className = "error";

        return;
      }

      const { error } =
        await supabase.auth.resetPasswordForEmail(
          email,
          {
            redirectTo: window.location.origin + "/?reset=1",
          }
        );

        if (error) {
          console.error("Şifre sıfırlama hatası:", error);

          message.textContent =
            error.message ||
            "Şifre sıfırlama bağlantısı gönderilemedi.";

          message.className = "error";

          return;
        }

      message.textContent =
        "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. 📧";

      message.className = "success";
    }
  );
}

// ==========================================
// KULLANICI KONTROLÜ
// ==========================================

async function checkUser(userId) {

  const { data: teacher } =
    await supabase
      .from("teachers")
      .select("id, name")
      .eq("id", userId)
      .maybeSingle();

  if (teacher) {
    await showTeacherDashboard(teacher);
    return;
  }

  const { data: student } =
    await supabase
      .from("students")
      .select("id, name, grade")
      .eq("id", userId)
      .maybeSingle();

  if (student) {
    showStudentDashboard(student);
    return;
  }

  await supabase.auth.signOut();

  alert(
    "Bu hesap Ders Takip sistemine tanımlı değil."
  );

  showLogin();
}

// ==========================================
// ÖĞRETMEN PANELİ
// ==========================================

async function showTeacherDashboard(teacher) {

  const {
    data: students,
    error,
  } = await supabase
    .from("students")
    .select(
      "id, name, grade, created_at"
    )
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

  const studentCount =
    students?.length || 0;

  app.innerHTML = `
    <div class="dashboard-page">

      <!-- TEMA -->

      <button
        id="theme-toggle"
        class="theme-toggle"
        aria-label="Tema değiştir"
      >
        🌙
      </button>


      <!-- HEADER -->

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


      <!-- CONTENT -->

      <main class="dashboard-content">


        <!-- İSTATİSTİKLER -->

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


        <!-- ÖĞRENCİ YÖNETİMİ -->

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


        <!-- ÖĞRENCİLER -->

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
                          ${getInitials(
                            student.name
                          )}
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

                    `
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
    .addEventListener(
      "click",
      toggleTheme
    );

  updateThemeButton();


  // ========================================
  // ÇIKIŞ
  // ========================================

  document
    .querySelector("#logout-button")
    .addEventListener(
      "click",
      async () => {

        await supabase.auth.signOut();

        showLogin();
      }
    );


  // ========================================
  // ÖĞRENCİ EKLE
  // ========================================

  document
    .querySelector("#add-student-button")
    ?.addEventListener(
      "click",
      showAddStudentModal
    );

  document
    .querySelector("#empty-add-button")
    ?.addEventListener(
      "click",
      showAddStudentModal
    );


  // ========================================
  // ÖĞRENCİ KARTLARI
  // ========================================

  document
    .querySelectorAll(".student-card")
    .forEach((card) => {

      card.addEventListener(
        "click",
        () => {

          const studentId =
            card.dataset.studentId;

          alert(
            `Öğrenci detayları bir sonraki aşamada açılacak.\nID: ${studentId}`
          );

        }
      );

    });
}

// ==========================================
// İSİM BAŞ HARFLERİ
// ==========================================

function getInitials(name) {

  const parts =
    name.trim().split(" ");

  if (parts.length === 1) {

    return parts[0]
      .substring(0, 2)
      .toUpperCase();

  }

  return (
    parts[0][0] +
    parts[parts.length - 1][0]
  ).toUpperCase();
}

// ==========================================
// ÖĞRENCİ EKLE MODALI
// ==========================================

function showAddStudentModal() {

  // Daha önce açık modal varsa kaldır
  document
    .querySelector("#student-modal")
    ?.remove();


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


          <!-- AD -->

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


          <!-- EMAIL -->

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


          <!-- SINIF -->

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


          <!-- MESAJ -->

          <p
            id="student-modal-message"
            class="modal-message"
          ></p>


          <!-- BUTONLAR -->

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


  // ========================================
  // ELEMENTLER
  // ========================================

  const overlay =
    document.querySelector(
      ".student-modal-overlay"
    );

  const closeButton =
    document.querySelector(
      "#close-student-modal"
    );

  const cancelButton =
    document.querySelector(
      "#cancel-student-modal"
    );

  const form =
    document.querySelector(
      "#student-form"
    );

  const message =
    document.querySelector(
      "#student-modal-message"
    );

  const createButton =
    document.querySelector(
      "#create-student-button"
    );


  // ========================================
  // MODALI KAPAT
  // ========================================

  function closeModal() {
    modal.remove();
  }

  closeButton.addEventListener(
    "click",
    closeModal
  );

  cancelButton.addEventListener(
    "click",
    closeModal
  );


  overlay.addEventListener(
    "click",
    (event) => {

      if (
        event.target === overlay
      ) {
        closeModal();
      }

    }
  );


  // ========================================
  // ÖĞRENCİ OLUŞTUR
  // ========================================

  form.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      const name =
        document
          .querySelector("#student-name")
          .value
          .trim();

      const email =
        document
          .querySelector("#student-email")
          .value
          .trim()
          .toLowerCase();

      const grade =
        Number(
          document
            .querySelector("#student-grade")
            .value
        );


      if (!name || !email || !grade) {

        message.textContent =
          "Lütfen tüm alanları doldur.";

        message.className =
          "modal-message error";

        return;
      }


      // Butonu kilitle

      createButton.disabled = true;

      createButton.textContent =
        "Oluşturuluyor...";

      message.textContent =
        "Öğrenci hesabı oluşturuluyor...";

      message.className =
        "modal-message info";


      try {

        // Güncel oturumu al

        const {
          data: {
            session,
          },
        } =
          await supabase.auth.getSession();


        if (!session) {

          throw new Error(
            "Oturum bulunamadı. Lütfen tekrar giriş yapın."
          );

        }


        // Edge Function çağrısı

        const {
          data,
          error,
        } =
          await supabase.functions.invoke(
            "create-student",
            {
              body: {
                name,
                email,
                grade,
              },
            }
          );


        if (error) {

          console.error(
            "Edge Function Error:",
            error
          );

          throw new Error(
            error.message ||
            "Öğrenci oluşturulamadı."
          );

        }


        if (!data?.success) {

          throw new Error(
            data?.error ||
            "Öğrenci oluşturulamadı."
          );

        }


        // Başarılı

        message.textContent =
          "Öğrenci başarıyla oluşturuldu! 🎉";

        message.className =
          "modal-message success";


        createButton.textContent =
          "Tamamlandı ✓";


        // Biraz bekleyip paneli yenile

        setTimeout(async () => {
          closeModal();

          const teacher = await getCurrentTeacher();

          if (teacher) {
            await showTeacherDashboard(teacher);
          }
        }, 1200);


      } catch (error) {

        console.error(
          "Öğrenci ekleme hatası:",
          error
        );


        message.textContent =
          error.message ||
          "Öğrenci eklenirken bir hata oluştu.";

        message.className =
          "modal-message error";


        createButton.disabled =
          false;

        createButton.textContent =
          "Öğrenci Ekle";

      }

    }
  );
}

// ==========================================
// MEVCUT ÖĞRETMENİ GETİR
// ==========================================

async function getCurrentTeacher() {

  const {
    data: {
      user,
    },
  } =
    await supabase.auth.getUser();


  if (!user) {

    showLogin();

    return null;
  }


  const {
    data: teacher,
  } =
    await supabase
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
// ÖĞRENCİ PANELİ
// ==========================================
async function showSetPassword() {
  document.querySelector("#app").innerHTML = `
    <div class="auth-page">
      <div class="auth-card password-setup-card">

        <div class="auth-logo">
          <div class="logo-icon">📚</div>
          <div>
            <h1>Ders Takip</h1>
            <p>Hesabını tamamla</p>
          </div>
        </div>

        <div class="password-setup-content">
          <div class="password-icon">🔐</div>

          <h2>Şifreni oluştur</h2>

          <p class="password-description">
            Hesabını kullanmaya başlamak için kendine bir şifre belirle.
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

    const password =
      document.querySelector("#new-password").value;

    const confirmPassword =
      document.querySelector("#confirm-password").value;

    message.textContent = "";
    message.className = "modal-message";

    if (password.length < 8) {
      message.textContent =
        "Şifren en az 8 karakter olmalı.";
      message.classList.add("error");
      return;
    }

    if (password !== confirmPassword) {
      message.textContent =
        "Şifreler birbiriyle eşleşmiyor.";
      message.classList.add("error");
      return;
    }

    const button =
      form.querySelector("button");

    button.disabled = true;
    button.textContent = "Şifre oluşturuluyor...";

    const { error } =
      await supabase.auth.updateUser({
        password,
      });

    if (error) {
      console.error(error);

      message.textContent =
        error.message ||
        "Şifre oluşturulurken bir hata oluştu.";

      message.classList.add("error");

      button.disabled = false;
      button.textContent = "Şifremi Oluştur";

      return;
    }

    message.textContent =
      "Şifren başarıyla oluşturuldu! 🎉";

    message.classList.add("success");

    // invite parametresini URL'den kaldır
    window.history.replaceState(
      {},
      document.title,
      window.location.pathname
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      await supabase.auth.signOut();
      showLogin();
      return;
    }

    const { data: student, error: studentError } =
      await supabase
        .from("students")
        .select("*")
        .eq("id", user.id)
        .single();

    if (studentError || !student) {
      message.textContent =
        "Öğrenci profili bulunamadı.";
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
async function showResetPassword() {
  document.querySelector("#app").innerHTML = `
    <div class="auth-page">
      <div class="auth-card password-setup-card">

        <div class="auth-logo">
          <div class="logo-icon">📚</div>
          <div>
            <h1>Ders Takip</h1>
            <p>Yeni şifre belirle</p>
          </div>
        </div>

        <div class="password-setup-content">
          <div class="password-icon">🔐</div>

          <h2>Yeni şifreni belirle</h2>

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

  const form =
    document.querySelector("#reset-password-form");

  const message =
    document.querySelector("#reset-password-message");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const password =
      document.querySelector("#reset-new-password").value;

    const confirmPassword =
      document.querySelector("#reset-confirm-password").value;

    message.textContent = "";
    message.className = "modal-message";

    if (password.length < 8) {
      message.textContent =
        "Şifren en az 8 karakter olmalı.";

      message.classList.add("error");
      return;
    }

    if (password !== confirmPassword) {
      message.textContent =
        "Şifreler birbiriyle eşleşmiyor.";

      message.classList.add("error");
      return;
    }

    const button =
      form.querySelector("button");

    button.disabled = true;
    button.textContent =
      "Şifre güncelleniyor...";

    const { error } =
      await supabase.auth.updateUser({
        password,
      });

    if (error) {
      console.error(error);

      message.textContent =
        error.message ||
        "Şifre güncellenirken bir hata oluştu.";

      message.classList.add("error");

      button.disabled = false;
      button.textContent =
        "Şifremi Güncelle";

      return;
    }

    message.textContent =
      "Şifren başarıyla güncellendi! 🎉";

    message.classList.add("success");

    setTimeout(async () => {
      await supabase.auth.signOut();

      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      );

      showLogin();
    }, 1200);
  });
}

async function getStudentStats(studentId) {
  const { data, error } = await supabase
    .from("study_records")
    .select("study_date, correct, wrong, blank, total, success_rate")
    .eq("student_id", studentId)
    .order("study_date", { ascending: false });

  if (error) {
    console.error("İstatistikler alınamadı:", error);
    return {
      streak: 0,
      weeklyQuestions: 0,
      successRate: 0,
    };
  }

  const records = data || [];

  // -----------------------------
  // BU HAFTAKİ SORU SAYISI
  // -----------------------------

  const today = new Date();

  const day = today.getDay();

  const diff = day === 0 ? 6 : day - 1;

  const weekStart = new Date(today);

  weekStart.setDate(today.getDate() - diff);
  weekStart.setHours(0, 0, 0, 0);

  const weeklyQuestions = records
    .filter((record) => {
      const recordDate = new Date(
        record.study_date + "T00:00:00"
      );

      return recordDate >= weekStart;
    })
    .reduce(
      (sum, record) =>
        sum + Number(record.total || 0),
      0
    );

  // -----------------------------
  // GENEL BAŞARI
  // -----------------------------

  const totalQuestions = records.reduce(
    (sum, record) =>
      sum + Number(record.total || 0),
    0
  );

  const totalCorrect = records.reduce(
    (sum, record) =>
      sum + Number(record.correct || 0),
    0
  );

  const successRate =
    totalQuestions === 0
      ? 0
      : Math.round(
          (totalCorrect / totalQuestions) * 100
        );

  // -----------------------------
  // SERİ
  // -----------------------------

  const studyDates = [
    ...new Set(
      records.map(
        (record) => record.study_date
      )
    ),
  ];

  let streak = 0;

  const checkDate = new Date();

  checkDate.setHours(0, 0, 0, 0);

  while (true) {
    const dateString =
      checkDate.toISOString().split("T")[0];

    if (!studyDates.includes(dateString)) {
      break;
    }

    streak++;

    checkDate.setDate(
      checkDate.getDate() - 1
    );
  }

  return {
    streak,
    weeklyQuestions,
    successRate,
  };
}
async function showStudentDashboard(student) {
  app.innerHTML = `
    <div class="student-app">

      <!-- ÜST ALAN -->
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

      <!-- ANA İÇERİK -->
      <main
        id="student-content"
        class="student-content"
      ></main>

      <!-- ALT MENÜ -->
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

  document
    .querySelector("#student-theme-toggle")
    .addEventListener("click", toggleTheme);
  document
  .querySelector("#student-top-logout")
  .addEventListener("click", async () => {
    await supabase.auth.signOut();
    showLogin();
  });
  updateThemeButton();

  const content =
    document.querySelector("#student-content");

  const navItems =
    document.querySelectorAll(".nav-item");

  function setActiveNav(page) {
    navItems.forEach((item) => {
      item.classList.toggle(
        "active",
        item.dataset.page === page
      );
    });
  }

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
            <span class="stat-icon">🔥</span>
            <small>Serim</small>
            <strong>${stats.streak} gün</strong>
          </div>

          <div class="student-stat-card">
            <span class="stat-icon">📝</span>
            <small>Bu Hafta</small>
            <strong>${stats.weeklyQuestions} soru</strong>
          </div>

          <div class="student-stat-card">
            <span class="stat-icon">🎯</span>
            <small>Başarı</small>
            <strong>%${stats.successRate}</strong>
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
              Henüz çalışma kaydın yok
            </h3>

            <p>
              İlk çalışmanı eklediğinde
              konu gelişimini burada görebileceksin.
            </p>

            <button
              class="primary-button"
              id="home-add-study"
            >
              ＋ İlk Çalışmamı Ekle
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
      ?.addEventListener(
        "click",
        () => showPage("add")
      );

  }

  function showPage(page) {
    setActiveNav(page);

    if (page === "home") {
      showHome();
      return;
    }

    if (page === "add") {
      content.innerHTML = `
        <section class="placeholder-page">
          <div class="placeholder-icon">➕</div>
          <span class="section-label">
            ÇALIŞMA
          </span>
          <h2>Çalışma Ekle</h2>
          <p>
            Bir sonraki aşamada burada
            çalışma kayıtlarını oluşturacağız.
          </p>
        </section>
      `;
      return;
    }

    if (page === "analysis") {
      content.innerHTML = `
        <section class="placeholder-page">
          <div class="placeholder-icon">📊</div>
          <span class="section-label">
            GELİŞİM
          </span>
          <h2>Analiz</h2>
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
          <div class="placeholder-icon">📖</div>
          <span class="section-label">
            GÜNLÜK
          </span>
          <h2>Günlüğüm</h2>
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
          <div class="placeholder-icon">👤</div>
          <span class="section-label">
            HESABIM
          </span>
          <h2>Profil</h2>
          <p>
            Profilin ve başarı rozetlerin
            burada olacak.
          </p>

          <div class="profile-preview">
            <strong>${student.name}</strong>
            <span>${student.grade}. Sınıf</span>
          </div>
        </section>
      `;
    }
  }

  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      showPage(item.dataset.page);
    });
  });

  showHome();
}

// ==========================================
// UYGULAMA BAŞLANGICI
// ==========================================

async function init() {
  initTheme();

  const urlParams =
    new URLSearchParams(window.location.search);

  const isInvite =
    urlParams.get("invite") === "1";

  const isReset =
    urlParams.get("reset") === "1";

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (isReset && session?.user) {
    showResetPassword();
    return;
  }

  if (session?.user) {

    if (isInvite) {
      showSetPassword();
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
