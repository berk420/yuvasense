/**
 * YuvaSense ornek (mock) veri seti.
 * Veritabani bossa otomatik calisir (bkz. src/app.js). Manuel calistirmak icin:
 *   node src/db/seed.js
 */
const bcrypt = require("bcryptjs");
const db = require("./db");
const { genId } = require("../utils/id");

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

function daysAgo(n) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

function isWeekend(d) {
  const day = d.getDay();
  return day === 0 || day === 6;
}

function hash(pw) {
  return bcrypt.hashSync(pw, 8);
}

function seed() {
  console.log("[seed] Ornek veri olusturuluyor...");

  // ---------- Siniflar ----------
  const classrooms = [
    { id: genId("cls"), name: "Kelebekler", ageGroup: "1-2 Yaş", capacity: 12, color: "#f6a623" },
    { id: genId("cls"), name: "Arılar", ageGroup: "2-3 Yaş", capacity: 14, color: "#1e8a78" },
    { id: genId("cls"), name: "Yıldızlar", ageGroup: "3-4 Yaş", capacity: 16, color: "#3b6bd6" },
    { id: genId("cls"), name: "Güneşler", ageGroup: "4-6 Yaş", capacity: 18, color: "#d8536a" }
  ];

  // ---------- Personel ----------
  const staff = [
    {
      id: genId("stf"),
      name: "Burcu Şahin",
      role: "Müdür",
      email: "burcu.sahin@yuvasense.com.tr",
      phone: "0532 111 22 33",
      classroomId: null,
      hireDate: "2021-08-15"
    },
    {
      id: genId("stf"),
      name: "Ayşe Demir",
      role: "Öğretmen",
      email: "ayse.demir@yuvasense.com.tr",
      phone: "0532 222 33 44",
      classroomId: classrooms[0].id,
      hireDate: "2022-09-01"
    },
    {
      id: genId("stf"),
      name: "Elif Korkmaz",
      role: "Öğretmen",
      email: "elif.korkmaz@yuvasense.com.tr",
      phone: "0533 333 44 55",
      classroomId: classrooms[1].id,
      hireDate: "2022-09-01"
    },
    {
      id: genId("stf"),
      name: "Mert Aydın",
      role: "Öğretmen",
      email: "mert.aydin@yuvasense.com.tr",
      phone: "0534 444 55 66",
      classroomId: classrooms[2].id,
      hireDate: "2023-02-01"
    },
    {
      id: genId("stf"),
      name: "Zeynep Acar",
      role: "Öğretmen",
      email: "zeynep.acar@yuvasense.com.tr",
      phone: "0535 555 66 77",
      classroomId: classrooms[3].id,
      hireDate: "2021-09-01"
    },
    {
      id: genId("stf"),
      name: "Caner Yıldırım",
      role: "Yardımcı Öğretmen",
      email: "caner.yildirim@yuvasense.com.tr",
      phone: "0536 666 77 88",
      classroomId: classrooms[1].id,
      hireDate: "2024-01-10"
    },
    {
      id: genId("stf"),
      name: "Seda Aksoy",
      role: "Hemşire",
      email: "seda.aksoy@yuvasense.com.tr",
      phone: "0537 777 88 99",
      classroomId: null,
      hireDate: "2023-06-01"
    }
  ];

  // ---------- Cocuklar ----------
  const childNames = [
    ["Elif", "Yıldız"], ["Mert", "Şahin"], ["Defne", "Kaya"], ["Ekrem", "Demir"],
    ["Zehra", "Aksoy"], ["Kerem", "Korkmaz"], ["Asya", "Aydın"], ["Yusuf", "Acar"],
    ["Nehir", "Çelik"], ["Ali", "Yıldırım"], ["Eylül", "Polat"], ["Kuzey", "Aslan"],
    ["Miray", "Güneş"], ["Çınar", "Özkan"], ["Lina", "Arslan"], ["Bartu", "Doğan"],
    ["Sare", "Koç"], ["Tuna", "Şen"], ["İdil", "Yılmaz"], ["Poyraz", "Kurt"],
    ["Azra", "Tekin"], ["Berk", "Avcı"], ["Selin", "Erdoğan"], ["Arda", "Uçar"]
  ];
  const allergyPool = [null, null, null, null, null, "Fıstık alerjisi", "Laktoz intoleransı", "Polen alerjisi", null, null];

  const children = childNames.map((nm, i) => {
    const cls = classrooms[i % classrooms.length];
    const ageYears = cls.ageGroup === "1-2 Yaş" ? 1 : cls.ageGroup === "2-3 Yaş" ? 2 : cls.ageGroup === "3-4 Yaş" ? 3 : 5;
    const birth = new Date();
    birth.setFullYear(birth.getFullYear() - ageYears);
    birth.setMonth(i % 12);
    birth.setDate(((i * 3) % 27) + 1);
    const enrollment = daysAgo(200 + (i % 8) * 20);
    return {
      id: genId("chd"),
      firstName: nm[0],
      lastName: nm[1],
      birthDate: isoDate(birth),
      classroomId: cls.id,
      allergies: allergyPool[i % allergyPool.length],
      notes: i % 7 === 0 ? "Öğleden sonra uyku düzeni farklı, takip ediliyor." : "",
      enrollmentDate: isoDate(enrollment),
      status: i === childNames.length - 1 ? "pasif" : "aktif",
      parentIds: []
    };
  });

  // ---------- Veliler ----------
  const parentDemoPassword = hash("Veli2026!");
  const parents = [];
  for (let i = 0; i < children.length; i += 1) {
    // Her cocuk icin 1 veli (bazi velilerin 2 cocugu olabilir - kardes senaryosu)
    if (i > 0 && i % 5 === 0) {
      // bu cocugu onceki velinin ikinci cocugu yap (kardes)
      const sibling = parents[parents.length - 1];
      sibling.childIds.push(children[i].id);
      children[i].parentIds.push(sibling.id);
      continue;
    }
    const child = children[i];
    const parent = {
      id: genId("par"),
      name: `${child.lastName} Ailesi - ${child.firstName === "Elif" ? "Hakan" : "Veli"} ${child.lastName}`,
      email: `${child.firstName.toLowerCase().replace("ı", "i")}.veli@example.com`,
      phone: `053${i % 10} ${String(100 + i).slice(-3)} ${String(10 + i).slice(-2)} ${String(20 + i).slice(-2)}`,
      passwordHash: parentDemoPassword,
      childIds: [child.id]
    };
    child.parentIds.push(parent.id);
    parents.push(parent);
  }

  // ---------- Kullanicilar (admin/ogretmen girisi) ----------
  const users = [
    {
      id: genId("usr"),
      name: "Burcu Şahin",
      email: "admin",
      passwordHash: hash("admin"),
      role: "admin",
      staffId: staff[0].id
    },
    {
      id: genId("usr"),
      name: "Ayşe Demir",
      email: "ayse.demir@yuvasense.com.tr",
      passwordHash: hash("Ogretmen2026!"),
      role: "teacher",
      staffId: staff[1].id
    }
  ];

  // ---------- Devam / Yoklama (son 14 gun, hafta sonu haric) ----------
  const attendance = [];
  const statusPool = ["geldi", "geldi", "geldi", "geldi", "geldi", "geç geldi", "izinli", "hasta"];
  for (let dayOffset = 13; dayOffset >= 0; dayOffset -= 1) {
    const d = daysAgo(dayOffset);
    if (isWeekend(d)) continue;
    children.forEach((child, idx) => {
      if (child.status !== "aktif") return;
      const status = statusPool[(idx + dayOffset) % statusPool.length];
      const present = status === "geldi" || status === "geç geldi";
      attendance.push({
        id: genId("att"),
        childId: child.id,
        classroomId: child.classroomId,
        date: isoDate(d),
        status,
        checkInTime: present ? (status === "geç geldi" ? "09:40" : "08:15") : null,
        checkOutTime: present ? "17:30" : null,
        note: status === "hasta" ? "Veli tarafından bildirildi" : ""
      });
    });
  }

  // ---------- Faturalar (son 3 ay) ----------
  const invoices = [];
  const monthlyFee = 3500;
  const periods = [];
  for (let m = 2; m >= 0; m -= 1) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - m);
    periods.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
  }

  children.forEach((child, idx) => {
    if (child.status !== "aktif") return;
    periods.forEach((p, pIdx) => {
      const isCurrentMonth = pIdx === periods.length - 1;
      const period = `${p.year}-${String(p.month).padStart(2, "0")}`;
      const dueDate = `${period}-10`;
      let status = "ödendi";
      let paidDate = `${period}-05`;

      if (isCurrentMonth) {
        status = idx % 4 === 0 ? "gecikmiş" : "bekliyor";
        paidDate = null;
      } else if (idx % 9 === 0 && !isCurrentMonth) {
        status = "gecikmiş";
        paidDate = null;
      }

      invoices.push({
        id: genId("inv"),
        childId: child.id,
        period,
        items: [
          { label: "Aylık Aidat", amount: monthlyFee },
          { label: "Yemek Ücreti", amount: 450 }
        ],
        amount: monthlyFee + 450,
        status,
        dueDate,
        issuedDate: `${period}-01`,
        paidDate
      });
    });
  });

  // ---------- Ornek demo talepleri (tanitim sitesinden gelmis gibi) ----------
  const demoRequests = [
    {
      id: genId("dmr"),
      name: "Hakan Öztürk",
      email: "hakan.ozturk@example.com",
      phone: "0532 444 55 66",
      daycareName: "Minik Adımlar Kreşi",
      childCount: "21-50",
      message: "Mevcut Excel takibimizden geçiş yapmak istiyoruz.",
      createdAt: daysAgo(3).toISOString(),
      status: "yeni"
    },
    {
      id: genId("dmr"),
      name: "Gül Aydınlı",
      email: "gul.aydinli@example.com",
      phone: "0533 222 11 00",
      daycareName: "Gökkuşağı Yuva",
      childCount: "51-100",
      message: "",
      createdAt: daysAgo(1).toISOString(),
      status: "yeni"
    }
  ];

  db.set("classrooms", classrooms)
    .set("staff", staff)
    .set("children", children)
    .set("parents", parents)
    .set("users", users)
    .set("attendance", attendance)
    .set("invoices", invoices)
    .set("demoRequests", demoRequests)
    .set("meta", { seeded: true, seededAt: new Date().toISOString() })
    .write();

  console.log(
    `[seed] Tamamlandı: ${classrooms.length} sınıf, ${staff.length} personel, ${children.length} çocuk, ` +
      `${parents.length} veli, ${attendance.length} yoklama kaydı, ${invoices.length} fatura.`
  );
}

if (require.main === module) {
  seed();
}

module.exports = seed;
