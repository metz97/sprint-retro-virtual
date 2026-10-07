# Retro Village

Sprint retrospective dalam dunia 3D isometrik. Peserta tidak menggerakkan karakter. Setiap masukan membuat **duplikat** karakter penulisnya berjalan dari lobby ke room yang dipilih, dan moderator mengklik duplikat itu untuk membuka isinya ke semua orang.

## Menjalankan

```bash
npm install
npm run dev
```

Buka http://localhost:5173. Untuk mensimulasikan beberapa peserta, buka beberapa tab: identitas disimpan per tab (`sessionStorage`). Rekan satu jaringan bisa membuka `http://<ip-kamu>:5173`.

Mode produksi (satu port):

```bash
npm run build
npm start        # http://localhost:3001
```

> `.npmrc` di folder ini mengarahkan npm ke registry publik npmjs, bukan feed perusahaan.

## Alur

| Ruang | Kategori |
|---|---|
| 🏡 Lobby | Semua peserta yang join |
| 🌤️ How did it go | ☀️ What did you like · 🌧️ What did the team lack |
| 💡 What are we going to keep | 📚 What did you learn · 🌠 What does the team long for |
| 🎯 Actions | 🎯 Actions |

- **Satu duplikat per orang per kategori.** Masukan berikutnya menambah isi duplikat yang sudah ada (karakternya melompat).
- **Anonim:** semua masukan anonim di satu kategori dikumpulkan ke satu karakter bertopeng yang muncul dari 🎭 Pintu Anonim. Server tidak pernah mengirim identitas penulisnya ke orang lain.
- **Tertutup sampai dibuka:** teks hanya dikirim ke penulisnya sampai moderator mengklik karakternya.
- **Kamera:** moderator mengendalikan kamera semua orang. Peserta boleh melihat-lihat sendiri, tetapi kamera mereka ditarik kembali setiap kali moderator berpindah.

## Struktur

```
shared/   config room & kategori, layout (posisi slot & jalur jalan), tipe pesan
server/   Node + ws, state di memori, disimpan ke server/data/retro.json
src/      React + React Three Fiber
  scene/  dunia 3D: Rooms, Decor, Character, CameraRig, NoteCard
  ui/     overlay: JoinScreen, Panel, TopBar, ReactionBar
```

Animasi jalan tidak disinkronkan lewat jaringan. Server hanya mengirim state. Setiap browser menghitung jalur yang sama secara deterministik dari `shared/layout.ts`, jadi semua orang melihat hasil yang sama.
