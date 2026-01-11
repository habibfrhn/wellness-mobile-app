export const id = {
  appName: "Wellness",

  common: {
    ok: "OK",
    invalidEmail: "Email tidak valid",
    invalidEmailBody: "Masukkan alamat email yang benar.",
    weakPassword: "Kata sandi terlalu lemah",
    weakPasswordBody: "Kata sandi minimal 8 karakter.",
    passwordsNotMatch: "Kata sandi tidak sama",
    passwordsNotMatchBody: "Pastikan kedua kata sandi sama.",
    errorTitle: "Terjadi kesalahan",
    tryAgain: "Silakan coba lagi.",
  },

  welcome: {
    title: "Selamat datang",
    subtitle: "Verifikasi sekali. Setelah itu, Anda bisa mulai sesi kapan pun.",
    primaryCta: "Daftar untuk mulai",
    secondaryCta: "Masuk",
  },

  signup: {
    title: "Buat akun",
    subtitle: "Kami akan meminta verifikasi email sebelum Anda bisa mulai sesi.",
    emailLabel: "Email",
    passwordLabel: "Kata sandi",
    confirmPasswordLabel: "Ulangi kata sandi",
    emailPlaceholder: "anda@email.com",
    passwordPlaceholder: "Minimal 8 karakter",
    confirmPasswordPlaceholder: "Ulangi kata sandi",
    primaryCta: "Buat akun",
    busyCta: "Membuat akun...",
    secondaryCta: "Sudah punya akun? Masuk",
    finePrint: "Dengan melanjutkan, Anda menyetujui S&K dan Kebijakan Privasi.",
  },

  login: {
    title: "Masuk",
    subtitle: "Jika email Anda belum terverifikasi, kami akan mengarahkan Anda ke halaman verifikasi.",
    emailLabel: "Email",
    passwordLabel: "Kata sandi",
    emailPlaceholder: "anda@email.com",
    passwordPlaceholder: "Kata sandi Anda",
    primaryCta: "Masuk",
    busyCta: "Memproses...",
    forgot: "Lupa kata sandi",
    create: "Buat akun",
  },

  verify: {
    title: "Verifikasi email",
    subtitle: "Kami mengirim tautan verifikasi ke:",
    openEmail: "Buka aplikasi email",
    resend: "Kirim ulang email",
    resendBusy: "Mengirim ulang...",
    resendWait: "Tunggu",
    changeEmail: "Ganti email",
    backToLogin: "Kembali ke masuk",
    help: "Jika tidak masuk, cek folder Spam/Promosi dan tunggu 1–2 menit.",
  },

  forgot: {
    title: "Lupa kata sandi",
    subtitle: "Kami akan mengirim tautan untuk mengatur ulang kata sandi lewat email.",
    emailLabel: "Email",
    emailPlaceholder: "anda@email.com",
    send: "Kirim email reset",
    sending: "Mengirim...",
    backToLogin: "Kembali ke masuk",
    successTitle: "Email terkirim",
    successBody: "Silakan cek email Anda untuk tautan reset kata sandi.",
  },

  reset: {
    title: "Atur ulang kata sandi",
    subtitle: "Masukkan kata sandi baru Anda.",
    newPassword: "Kata sandi baru",
    confirmPassword: "Ulangi kata sandi",
    placeholderNew: "Minimal 8 karakter",
    placeholderConfirm: "Ulangi kata sandi baru",
    set: "Simpan kata sandi baru",
    saving: "Menyimpan...",
    backToLogin: "Kembali ke masuk",
    successTitle: "Berhasil",
    successBody: "Kata sandi berhasil diperbarui. Silakan masuk kembali.",
  },

  home: {
    title: "Beranda",
    subtitle: "Pilih sesi singkat untuk menutup hari dengan lebih tenang.",
    durationBadge: "5 menit",
    continueLabel: "Lanjutkan",
    continueFrom: "Mulai dari",
    noteNoAutoplay: "Audio tidak diputar otomatis. Anda yang memulai saat sudah siap.",
  },

  player: {
    back: "Kembali",
    start: "Mulai",
    pause: "Pause",
    restart: "Ulang dari awal",
    timerLabel: "Timer",
    timerOff: "Off",
    timerEnd: "Akhiri saat audio selesai",
    noteNoAutoplay: "Tidak ada autoplay. Tekan Mulai jika Anda ingin memutar audio.",
  },

  account: {
    title: "Akun",
    emailLabel: "Email",

    aboutTitle: "Tentang aplikasi",
    versionLabel: "Versi",
    buildLabel: "Build",
    runtimeLabel: "Runtime",
    channelLabel: "Channel",

    helpTitle: "Bantuan",
    helpNoAutoplay: "Audio tidak diputar otomatis. Anda bisa menekan tombol “Mulai” saat sudah siap.",
    helpVerify:
      "Jika verifikasi email belum masuk, cek folder Spam/Promosi dan tunggu 1–2 menit. Anda juga bisa kirim ulang dari layar verifikasi.",
    helpPlayback:
      "Jika terjadi error saat pemutaran, coba tutup aplikasi lalu buka lagi. Untuk build “preview/production”, perbaikan kecil bisa dikirim lewat pembaruan online.",
    helpStoreUpdateNote:
      "Catatan: Pembaruan online hanya untuk perbaikan kecil. Jika ada perubahan besar atau pembaruan sistem, Anda perlu update lewat Play Store/App Store.",

    updatesTitle: "Pembaruan",
    updatesButton: "Periksa pembaruan",
    updatesChecking: "Memeriksa...",
    updatesDownloadButton: "Unduh pembaruan",
    updatesDownloading: "Mengunduh...",
    updatesLater: "Nanti",

    updatesDisabledTitle: "Pembaruan tidak aktif",
    updatesDisabledBody:
      "Pembaruan online tidak tersedia pada mode ini (misalnya Expo Go) atau updates belum diaktifkan.",

    updatesUpToDateTitle: "Tidak ada pembaruan",
    updatesUpToDateBody: "Aplikasi Anda sudah versi terbaru.",

    updatesAvailableTitle: "Pembaruan tersedia",
    updatesAvailableBody: "Pembaruan akan diunduh dan aplikasi akan dimuat ulang.",

    updatesLaterTitle: "Pembaruan ditunda",
    updatesLaterBody: 'Anda bisa mengunduhnya kapan saja dari menu Akun dengan menekan "Unduh pembaruan".',

    updatesFailed: "Gagal memeriksa pembaruan. Silakan coba lagi.",

    legalTitle: "Legal & bantuan",
    privacy: "Kebijakan Privasi",
    terms: "Syarat & Ketentuan",
    support: "Kontak dukungan",
    openLinkFailed: "Tidak bisa membuka tautan di perangkat ini.",
    comingSoonTitle: "Belum tersedia",
    comingSoonBody: "Tautan ini akan kami tambahkan pada versi berikutnya.",

    logout: "Keluar",
    confirmLogoutTitle: "Keluar?",
    confirmLogoutBody: "Anda yakin ingin keluar?",
    cancel: "Batal",

    resetPassword: "Atur ulang kata sandi",
    resetPasswordBody: "Kami akan mengirim tautan reset ke email Anda.",

    deleteTitle: "Hapus akun",
    deleteWarning: "Aksi ini permanen. Data akun Anda akan dihapus dan tidak dapat dipulihkan.",
    deleteTypeLabel: 'Ketik "HAPUS" untuk konfirmasi',
    deletePlaceholder: "HAPUS",
    deleteFinal: "Hapus akun permanen",
    deleting: "Menghapus...",
    deletedTitle: "Akun dihapus",
    deletedBody: "Akun Anda berhasil dihapus.",

    deleteContinue: "Lanjut",
    deleteConfirmTitle: "Konfirmasi belum valid",
    deleteConfirmBody: 'Ketik "HAPUS" untuk melanjutkan.',
    sessionMissing: "Sesi tidak ditemukan. Silakan masuk kembali.",
  },
};
