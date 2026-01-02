export const id = {
  appName: "Wellness",

  welcome: {
    title: "Selamat datang",
    subtitle: "Verifikasi sekali. Setelah itu, Anda bisa mulai sesi kapan pun.",
    primaryCta: "Daftar untuk mulai",
    secondaryCta: "Masuk"
  },

  signup: {
    title: "Buat akun",
    subtitle: "Kami akan meminta verifikasi email sebelum Anda bisa mulai sesi.",
    emailLabel: "Email",
    passwordLabel: "Kata sandi",
    emailPlaceholder: "anda@email.com",
    passwordPlaceholder: "Minimal 8 karakter",
    primaryCta: "Buat akun",
    busyCta: "Membuat akun...",
    secondaryCta: "Sudah punya akun? Masuk",
    finePrint: "Dengan melanjutkan, Anda menyetujui S&K dan Kebijakan Privasi."
  },

  login: {
    title: "Masuk",
    subtitle:
      "Jika email Anda belum terverifikasi, kami akan mengarahkan Anda ke halaman verifikasi.",
    forgot: "Lupa kata sandi",
    create: "Buat akun"
  },

  verify: {
    title: "Verifikasi email",
    subtitle: "Kami mengirim tautan verifikasi ke:",
    openEmail: "Buka aplikasi email",
    resend: "Kirim ulang email",
    changeEmail: "Ganti email",
    backToLogin: "Kembali ke masuk"
  },

  forgot: {
    title: "Lupa kata sandi",
    subtitle: "Kami akan mengirim tautan untuk mengatur ulang kata sandi lewat email.",
    send: "Kirim email reset",
    backToLogin: "Kembali ke masuk"
  },

  reset: {
    title: "Atur ulang kata sandi",
    subtitle:
      "Buka tautan reset dari email, lalu atur kata sandi baru di aplikasi.",
    set: "Simpan kata sandi baru",
    backToLogin: "Kembali ke masuk"
  },

  placeholders: {
    nextStepTitle: "Langkah berikutnya",
    nextStepBodySignUp:
      "Kami akan menambahkan input email + kata sandi, lalu memanggil Supabase signUp dengan redirect ke wellnessapp://auth/callback.",
    nextStepBodyLogin:
      "Kami akan menambahkan login (signInWithPassword) dan tautan Lupa kata sandi.",
    nextStepBodyVerify:
      "Kami akan implement: buka email, kirim ulang dengan cooldown, dan ganti email (MVP: daftar ulang dengan email baru).",
    nextStepBodyForgot:
      "Kami akan menambahkan input email dan memanggil resetPasswordForEmail dengan redirect wellnessapp://auth/reset.",
    nextStepBodyReset:
      "Setelah deep link ditangani, kami akan memanggil supabase.auth.updateUser({ password }) untuk menyimpan kata sandi baru."
  }
};
