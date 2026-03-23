import { Router, type IRouter } from "express";
import { exec } from "child_process";
import { writeFile, readFile, unlink, mkdir, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { randomUUID } from "crypto";
import ffmpegPath from "ffmpeg-static";
import {
  GetSurahsResponse,
  GetSurahResponse,
  SearchQuranResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const surahs = [
  { number: 1, name: "الفاتحة", englishName: "Al-Faatiha", englishNameTranslation: "The Opening", numberOfAyahs: 7, revelationType: "Meccan" },
  { number: 2, name: "البقرة", englishName: "Al-Baqara", englishNameTranslation: "The Cow", numberOfAyahs: 286, revelationType: "Medinan" },
  { number: 3, name: "آل عمران", englishName: "Aal-i-Imraan", englishNameTranslation: "The Family of Imraan", numberOfAyahs: 200, revelationType: "Medinan" },
  { number: 4, name: "النساء", englishName: "An-Nisaa", englishNameTranslation: "The Women", numberOfAyahs: 176, revelationType: "Medinan" },
  { number: 5, name: "المائدة", englishName: "Al-Maaida", englishNameTranslation: "The Table Spread", numberOfAyahs: 120, revelationType: "Medinan" },
  { number: 6, name: "الأنعام", englishName: "Al-An'aam", englishNameTranslation: "The Cattle", numberOfAyahs: 165, revelationType: "Meccan" },
  { number: 7, name: "الأعراف", englishName: "Al-A'raaf", englishNameTranslation: "The Heights", numberOfAyahs: 206, revelationType: "Meccan" },
  { number: 8, name: "الأنفال", englishName: "Al-Anfaal", englishNameTranslation: "The Spoils of War", numberOfAyahs: 75, revelationType: "Medinan" },
  { number: 9, name: "التوبة", englishName: "At-Tawba", englishNameTranslation: "The Repentance", numberOfAyahs: 129, revelationType: "Medinan" },
  { number: 10, name: "يونس", englishName: "Yunus", englishNameTranslation: "Jonah", numberOfAyahs: 109, revelationType: "Meccan" },
  { number: 11, name: "هود", englishName: "Hud", englishNameTranslation: "Hud", numberOfAyahs: 123, revelationType: "Meccan" },
  { number: 12, name: "يوسف", englishName: "Yusuf", englishNameTranslation: "Joseph", numberOfAyahs: 111, revelationType: "Meccan" },
  { number: 13, name: "الرعد", englishName: "Ar-Ra'd", englishNameTranslation: "The Thunder", numberOfAyahs: 43, revelationType: "Medinan" },
  { number: 14, name: "إبراهيم", englishName: "Ibrahim", englishNameTranslation: "Abraham", numberOfAyahs: 52, revelationType: "Meccan" },
  { number: 15, name: "الحجر", englishName: "Al-Hijr", englishNameTranslation: "The Rocky Tract", numberOfAyahs: 99, revelationType: "Meccan" },
  { number: 16, name: "النحل", englishName: "An-Nahl", englishNameTranslation: "The Bee", numberOfAyahs: 128, revelationType: "Meccan" },
  { number: 17, name: "الإسراء", englishName: "Al-Israa", englishNameTranslation: "The Night Journey", numberOfAyahs: 111, revelationType: "Meccan" },
  { number: 18, name: "الكهف", englishName: "Al-Kahf", englishNameTranslation: "The Cave", numberOfAyahs: 110, revelationType: "Meccan" },
  { number: 19, name: "مريم", englishName: "Maryam", englishNameTranslation: "Mary", numberOfAyahs: 98, revelationType: "Meccan" },
  { number: 20, name: "طه", englishName: "Taa-Haa", englishNameTranslation: "Ta-Ha", numberOfAyahs: 135, revelationType: "Meccan" },
  { number: 21, name: "الأنبياء", englishName: "Al-Anbiyaa", englishNameTranslation: "The Prophets", numberOfAyahs: 112, revelationType: "Meccan" },
  { number: 22, name: "الحج", englishName: "Al-Hajj", englishNameTranslation: "The Pilgrimage", numberOfAyahs: 78, revelationType: "Medinan" },
  { number: 23, name: "المؤمنون", englishName: "Al-Muminoon", englishNameTranslation: "The Believers", numberOfAyahs: 118, revelationType: "Meccan" },
  { number: 24, name: "النور", englishName: "An-Noor", englishNameTranslation: "The Light", numberOfAyahs: 64, revelationType: "Medinan" },
  { number: 25, name: "الفرقان", englishName: "Al-Furqaan", englishNameTranslation: "The Criterion", numberOfAyahs: 77, revelationType: "Meccan" },
  { number: 26, name: "الشعراء", englishName: "Ash-Shu'araa", englishNameTranslation: "The Poets", numberOfAyahs: 227, revelationType: "Meccan" },
  { number: 27, name: "النمل", englishName: "An-Naml", englishNameTranslation: "The Ant", numberOfAyahs: 93, revelationType: "Meccan" },
  { number: 28, name: "القصص", englishName: "Al-Qasas", englishNameTranslation: "The Stories", numberOfAyahs: 88, revelationType: "Meccan" },
  { number: 29, name: "العنكبوت", englishName: "Al-Ankaboot", englishNameTranslation: "The Spider", numberOfAyahs: 69, revelationType: "Meccan" },
  { number: 30, name: "الروم", englishName: "Ar-Room", englishNameTranslation: "The Romans", numberOfAyahs: 60, revelationType: "Meccan" },
  { number: 31, name: "لقمان", englishName: "Luqman", englishNameTranslation: "Luqman", numberOfAyahs: 34, revelationType: "Meccan" },
  { number: 32, name: "السجدة", englishName: "As-Sajda", englishNameTranslation: "The Prostration", numberOfAyahs: 30, revelationType: "Meccan" },
  { number: 33, name: "الأحزاب", englishName: "Al-Ahzaab", englishNameTranslation: "The Combined Forces", numberOfAyahs: 73, revelationType: "Medinan" },
  { number: 34, name: "سبإ", englishName: "Saba", englishNameTranslation: "Sheba", numberOfAyahs: 54, revelationType: "Meccan" },
  { number: 35, name: "فاطر", englishName: "Faatir", englishNameTranslation: "Originator", numberOfAyahs: 45, revelationType: "Meccan" },
  { number: 36, name: "يس", englishName: "Yaseen", englishNameTranslation: "Ya Sin", numberOfAyahs: 83, revelationType: "Meccan" },
  { number: 37, name: "الصافات", englishName: "As-Saaffaat", englishNameTranslation: "Those who set the Ranks", numberOfAyahs: 182, revelationType: "Meccan" },
  { number: 38, name: "ص", englishName: "Saad", englishNameTranslation: "The Letter Saad", numberOfAyahs: 88, revelationType: "Meccan" },
  { number: 39, name: "الزمر", englishName: "Az-Zumar", englishNameTranslation: "The Troops", numberOfAyahs: 75, revelationType: "Meccan" },
  { number: 40, name: "غافر", englishName: "Ghafir", englishNameTranslation: "The Forgiver", numberOfAyahs: 85, revelationType: "Meccan" },
  { number: 41, name: "فصلت", englishName: "Fussilat", englishNameTranslation: "Explained in Detail", numberOfAyahs: 54, revelationType: "Meccan" },
  { number: 42, name: "الشورى", englishName: "Ash-Shura", englishNameTranslation: "The Consultation", numberOfAyahs: 53, revelationType: "Meccan" },
  { number: 43, name: "الزخرف", englishName: "Az-Zukhruf", englishNameTranslation: "The Ornaments of Gold", numberOfAyahs: 89, revelationType: "Meccan" },
  { number: 44, name: "الدخان", englishName: "Ad-Dukhaan", englishNameTranslation: "The Smoke", numberOfAyahs: 59, revelationType: "Meccan" },
  { number: 45, name: "الجاثية", englishName: "Al-Jaathiya", englishNameTranslation: "The Crouching", numberOfAyahs: 37, revelationType: "Meccan" },
  { number: 46, name: "الأحقاف", englishName: "Al-Ahqaf", englishNameTranslation: "The Wind-Curved Sandhills", numberOfAyahs: 35, revelationType: "Meccan" },
  { number: 47, name: "محمد", englishName: "Muhammad", englishNameTranslation: "Muhammad", numberOfAyahs: 38, revelationType: "Medinan" },
  { number: 48, name: "الفتح", englishName: "Al-Fath", englishNameTranslation: "The Victory", numberOfAyahs: 29, revelationType: "Medinan" },
  { number: 49, name: "الحجرات", englishName: "Al-Hujuraat", englishNameTranslation: "The Rooms", numberOfAyahs: 18, revelationType: "Medinan" },
  { number: 50, name: "ق", englishName: "Qaaf", englishNameTranslation: "The Letter Qaaf", numberOfAyahs: 45, revelationType: "Meccan" },
  { number: 51, name: "الذاريات", englishName: "Adh-Dhaariyat", englishNameTranslation: "The Winnowing Winds", numberOfAyahs: 60, revelationType: "Meccan" },
  { number: 52, name: "الطور", englishName: "At-Tur", englishNameTranslation: "The Mount", numberOfAyahs: 49, revelationType: "Meccan" },
  { number: 53, name: "النجم", englishName: "An-Najm", englishNameTranslation: "The Star", numberOfAyahs: 62, revelationType: "Meccan" },
  { number: 54, name: "القمر", englishName: "Al-Qamar", englishNameTranslation: "The Moon", numberOfAyahs: 55, revelationType: "Meccan" },
  { number: 55, name: "الرحمن", englishName: "Ar-Rahman", englishNameTranslation: "The Beneficent", numberOfAyahs: 78, revelationType: "Medinan" },
  { number: 56, name: "الواقعة", englishName: "Al-Waaqia", englishNameTranslation: "The Inevitable", numberOfAyahs: 96, revelationType: "Meccan" },
  { number: 57, name: "الحديد", englishName: "Al-Hadid", englishNameTranslation: "The Iron", numberOfAyahs: 29, revelationType: "Medinan" },
  { number: 58, name: "المجادلة", englishName: "Al-Mujaadila", englishNameTranslation: "She That Disputeth", numberOfAyahs: 22, revelationType: "Medinan" },
  { number: 59, name: "الحشر", englishName: "Al-Hashr", englishNameTranslation: "Exile", numberOfAyahs: 24, revelationType: "Medinan" },
  { number: 60, name: "الممتحنة", englishName: "Al-Mumtahana", englishNameTranslation: "She that is to be examined", numberOfAyahs: 13, revelationType: "Medinan" },
  { number: 61, name: "الصف", englishName: "As-Saff", englishNameTranslation: "The Ranks", numberOfAyahs: 14, revelationType: "Medinan" },
  { number: 62, name: "الجمعة", englishName: "Al-Jumu'a", englishNameTranslation: "Friday", numberOfAyahs: 11, revelationType: "Medinan" },
  { number: 63, name: "المنافقون", englishName: "Al-Munaafiqoon", englishNameTranslation: "The Hypocrites", numberOfAyahs: 11, revelationType: "Medinan" },
  { number: 64, name: "التغابن", englishName: "At-Taghaabun", englishNameTranslation: "Mutual Disillusion", numberOfAyahs: 18, revelationType: "Medinan" },
  { number: 65, name: "الطلاق", englishName: "At-Talaaq", englishNameTranslation: "Divorce", numberOfAyahs: 12, revelationType: "Medinan" },
  { number: 66, name: "التحريم", englishName: "At-Tahrim", englishNameTranslation: "The Prohibition", numberOfAyahs: 12, revelationType: "Medinan" },
  { number: 67, name: "الملك", englishName: "Al-Mulk", englishNameTranslation: "The Sovereignty", numberOfAyahs: 30, revelationType: "Meccan" },
  { number: 68, name: "القلم", englishName: "Al-Qalam", englishNameTranslation: "The Pen", numberOfAyahs: 52, revelationType: "Meccan" },
  { number: 69, name: "الحاقة", englishName: "Al-Haaqqa", englishNameTranslation: "The Reality", numberOfAyahs: 52, revelationType: "Meccan" },
  { number: 70, name: "المعارج", englishName: "Al-Ma'aarij", englishNameTranslation: "The Ascending Stairways", numberOfAyahs: 44, revelationType: "Meccan" },
  { number: 71, name: "نوح", englishName: "Nooh", englishNameTranslation: "Noah", numberOfAyahs: 28, revelationType: "Meccan" },
  { number: 72, name: "الجن", englishName: "Al-Jinn", englishNameTranslation: "The Jinn", numberOfAyahs: 28, revelationType: "Meccan" },
  { number: 73, name: "المزمل", englishName: "Al-Muzzammil", englishNameTranslation: "The Enshrouded One", numberOfAyahs: 20, revelationType: "Meccan" },
  { number: 74, name: "المدثر", englishName: "Al-Muddaththir", englishNameTranslation: "The Cloaked One", numberOfAyahs: 56, revelationType: "Meccan" },
  { number: 75, name: "القيامة", englishName: "Al-Qiyaama", englishNameTranslation: "The Resurrection", numberOfAyahs: 40, revelationType: "Meccan" },
  { number: 76, name: "الإنسان", englishName: "Al-Insaan", englishNameTranslation: "Man", numberOfAyahs: 31, revelationType: "Medinan" },
  { number: 77, name: "المرسلات", englishName: "Al-Mursalaat", englishNameTranslation: "The Emissaries", numberOfAyahs: 50, revelationType: "Meccan" },
  { number: 78, name: "النبإ", englishName: "An-Naba", englishNameTranslation: "The Tidings", numberOfAyahs: 40, revelationType: "Meccan" },
  { number: 79, name: "النازعات", englishName: "An-Naazi'aat", englishNameTranslation: "Those who drag forth", numberOfAyahs: 46, revelationType: "Meccan" },
  { number: 80, name: "عبس", englishName: "Abasa", englishNameTranslation: "He Frowned", numberOfAyahs: 42, revelationType: "Meccan" },
  { number: 81, name: "التكوير", englishName: "At-Takwir", englishNameTranslation: "The Overthrowing", numberOfAyahs: 29, revelationType: "Meccan" },
  { number: 82, name: "الانفطار", englishName: "Al-Infitaar", englishNameTranslation: "The Cleaving", numberOfAyahs: 19, revelationType: "Meccan" },
  { number: 83, name: "المطففين", englishName: "Al-Mutaffifin", englishNameTranslation: "The Defrauding", numberOfAyahs: 36, revelationType: "Meccan" },
  { number: 84, name: "الانشقاق", englishName: "Al-Inshiqaaq", englishNameTranslation: "The Sundering", numberOfAyahs: 25, revelationType: "Meccan" },
  { number: 85, name: "البروج", englishName: "Al-Burooj", englishNameTranslation: "The Mansions of the Stars", numberOfAyahs: 22, revelationType: "Meccan" },
  { number: 86, name: "الطارق", englishName: "At-Taariq", englishNameTranslation: "The Nightcommer", numberOfAyahs: 17, revelationType: "Meccan" },
  { number: 87, name: "الأعلى", englishName: "Al-A'laa", englishNameTranslation: "The Most High", numberOfAyahs: 19, revelationType: "Meccan" },
  { number: 88, name: "الغاشية", englishName: "Al-Ghaashiya", englishNameTranslation: "The Overwhelming", numberOfAyahs: 26, revelationType: "Meccan" },
  { number: 89, name: "الفجر", englishName: "Al-Fajr", englishNameTranslation: "The Dawn", numberOfAyahs: 30, revelationType: "Meccan" },
  { number: 90, name: "البلد", englishName: "Al-Balad", englishNameTranslation: "The City", numberOfAyahs: 20, revelationType: "Meccan" },
  { number: 91, name: "الشمس", englishName: "Ash-Shams", englishNameTranslation: "The Sun", numberOfAyahs: 15, revelationType: "Meccan" },
  { number: 92, name: "الليل", englishName: "Al-Layl", englishNameTranslation: "The Night", numberOfAyahs: 21, revelationType: "Meccan" },
  { number: 93, name: "الضحى", englishName: "Ad-Dhuhaa", englishNameTranslation: "The Morning Hours", numberOfAyahs: 11, revelationType: "Meccan" },
  { number: 94, name: "الشرح", englishName: "Ash-Sharh", englishNameTranslation: "The Relief", numberOfAyahs: 8, revelationType: "Meccan" },
  { number: 95, name: "التين", englishName: "At-Tin", englishNameTranslation: "The Fig", numberOfAyahs: 8, revelationType: "Meccan" },
  { number: 96, name: "العلق", englishName: "Al-Alaq", englishNameTranslation: "The Clot", numberOfAyahs: 19, revelationType: "Meccan" },
  { number: 97, name: "القدر", englishName: "Al-Qadr", englishNameTranslation: "The Power", numberOfAyahs: 5, revelationType: "Meccan" },
  { number: 98, name: "البينة", englishName: "Al-Bayyina", englishNameTranslation: "The Clear Proof", numberOfAyahs: 8, revelationType: "Medinan" },
  { number: 99, name: "الزلزلة", englishName: "Az-Zalzala", englishNameTranslation: "The Earthquake", numberOfAyahs: 8, revelationType: "Medinan" },
  { number: 100, name: "العاديات", englishName: "Al-Aadiyaat", englishNameTranslation: "The Courser", numberOfAyahs: 11, revelationType: "Meccan" },
  { number: 101, name: "القارعة", englishName: "Al-Qaari'a", englishNameTranslation: "The Calamity", numberOfAyahs: 11, revelationType: "Meccan" },
  { number: 102, name: "التكاثر", englishName: "At-Takaathur", englishNameTranslation: "The Rivalry in world increase", numberOfAyahs: 8, revelationType: "Meccan" },
  { number: 103, name: "العصر", englishName: "Al-Asr", englishNameTranslation: "The Declining Day", numberOfAyahs: 3, revelationType: "Meccan" },
  { number: 104, name: "الهمزة", englishName: "Al-Humaza", englishNameTranslation: "The Traducer", numberOfAyahs: 9, revelationType: "Meccan" },
  { number: 105, name: "الفيل", englishName: "Al-Fil", englishNameTranslation: "The Elephant", numberOfAyahs: 5, revelationType: "Meccan" },
  { number: 106, name: "قريش", englishName: "Quraish", englishNameTranslation: "Quraysh", numberOfAyahs: 4, revelationType: "Meccan" },
  { number: 107, name: "الماعون", englishName: "Al-Maa'oon", englishNameTranslation: "The Small Kindnesses", numberOfAyahs: 7, revelationType: "Meccan" },
  { number: 108, name: "الكوثر", englishName: "Al-Kawthar", englishNameTranslation: "Abundance", numberOfAyahs: 3, revelationType: "Meccan" },
  { number: 109, name: "الكافرون", englishName: "Al-Kaafiroon", englishNameTranslation: "The Disbelievers", numberOfAyahs: 6, revelationType: "Meccan" },
  { number: 110, name: "النصر", englishName: "An-Nasr", englishNameTranslation: "Divine Support", numberOfAyahs: 3, revelationType: "Medinan" },
  { number: 111, name: "المسد", englishName: "Al-Masad", englishNameTranslation: "The Palm Fibre", numberOfAyahs: 5, revelationType: "Meccan" },
  { number: 112, name: "الإخلاص", englishName: "Al-Ikhlaas", englishNameTranslation: "Sincerity", numberOfAyahs: 4, revelationType: "Meccan" },
  { number: 113, name: "الفلق", englishName: "Al-Falaq", englishNameTranslation: "The Daybreak", numberOfAyahs: 5, revelationType: "Meccan" },
  { number: 114, name: "الناس", englishName: "An-Naas", englishNameTranslation: "Mankind", numberOfAyahs: 6, revelationType: "Meccan" },
];

// Cache for surah ayahs to avoid repeated external API calls
const surahCache = new Map<number, { number: number; numberInSurah: number; text: string; juz: number; page: number }[]>();

async function fetchSurahFromExternal(surahNumber: number) {
  if (surahCache.has(surahNumber)) {
    return surahCache.get(surahNumber)!;
  }

  const response = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch surah ${surahNumber} from external API`);
  }

  const data = await response.json() as {
    data: {
      ayahs: { number: number; numberInSurah: number; text: string; juz: number; page: number }[];
    };
  };

  const ayahs = data.data.ayahs.map((a) => ({
    number: a.number,
    numberInSurah: a.numberInSurah,
    text: a.text,
    juz: a.juz,
    page: a.page,
  }));

  surahCache.set(surahNumber, ayahs);
  return ayahs;
}

router.get("/quran/surahs", (_req, res) => {
  const data = GetSurahsResponse.parse(surahs);
  res.json(data);
});

router.get("/quran/surahs/:surahNumber", async (req, res) => {
  const surahNumber = parseInt(req.params.surahNumber, 10);
  const surah = surahs.find((s) => s.number === surahNumber);
  if (!surah) {
    res.status(404).json({ error: "Surah not found" });
    return;
  }

  try {
    const ayahs = await fetchSurahFromExternal(surahNumber);
    const data = GetSurahResponse.parse({ ...surah, ayahs });
    res.json(data);
  } catch {
    res.status(503).json({ error: "Failed to fetch surah content. Please try again." });
  }
});

router.get("/quran/audio/:reciter/:ayahNumber", async (req, res) => {
  const { reciter, ayahNumber } = req.params;
  const num = parseInt(ayahNumber, 10);
  if (!reciter || isNaN(num) || num < 1 || num > 6236) {
    res.status(400).json({ error: "Invalid parameters" });
    return;
  }
  const allowedReciters = [
    "ar.alafasy", "ar.abdurrahmanasudais", "ar.husary",
    "ar.minshawi", "ar.ahmedajamy",
    "ar.mahermuaiqly", "ar.abdullahbasfar", "ar.saudalshuraim",
    "ar.shaatree", "ar.ibrahimakhbar", "ar.hani",
    "ar.husarymujawwad", "ar.minshawimujawwad",
    "ar.nasser.alqatami", "ar.khalefa",
    "ar.abdulsamad", "ar.alhudhayfi", "ar.saadalghamdi",
    "ar.muhammadayyub", "ar.johani", "ar.faresabbad",
    "ar.bandarbalila", "ar.walk",
  ];
  if (!allowedReciters.includes(reciter)) {
    res.status(400).json({ error: "Invalid reciter" });
    return;
  }
  try {
    const padded = String(num).padStart(6, "0");
    const everyayahMap: Record<string, string> = {
      "ar.alafasy":            "Alafasy_128kbps",
      "ar.abdurrahmanasudais": "Abdurrahmaan_As-Sudais_192kbps",
      "ar.husary":             "Husary_128kbps",
      "ar.husarymujawwad":     "Husary_Mujawwad_64kbps",
      "ar.minshawi":           "Menshawi_128kbps",
      "ar.minshawimujawwad":   "Menshawi_Mujawwad_128kbps",
      "ar.ahmedajamy":         "Ahmed_ibn_Ali_al-Ajamy_128kbps_ketaballah.net",
      "ar.mahermuaiqly":       "Maher_Al_Muaiqly_128kbps",
      "ar.abdullahbasfar":     "Abdullah_Basfar_192kbps",
      "ar.saudalshuraim":      "Saud_al-Shuraim_128kbps",
      "ar.shaatree":           "Abu_Bakr_al-Shatri_128kbps",
      "ar.abdulsamad":         "Abdul_Basit_Murattal_128kbps",
      "ar.saadalghamdi":       "Saad_al-Ghamdi_128kbps",
      "ar.muhammadayyub":      "Muhammad_Ayyub_128kbps",
      "ar.johani":             "Khalid_Al-Johani_128kbps",
      "ar.alhudhayfi":         "Ali_Al-Huzaifi_128kbps",
      "ar.nasser.alqatami":    "Nasser_Alqatami_128kbps",
    };
    const quranicAudioMap: Record<string, string> = {
      "ar.alafasy":            "mishaari_raashid_al_3afaasee",
      "ar.abdurrahmanasudais": "abdurrahmaan_as-sudays",
      "ar.husary":             "husary",
      "ar.minshawi":           "minshawi_murattal",
      "ar.ahmedajamy":         "ahmed_ibn_3ali_al-3ajamy",
      "ar.mahermuaiqly":       "maher_al_muaiqly",
      "ar.saudalshuraim":      "sa3d_al-shurym",
      "ar.abdulsamad":         "abdulbaset_abdulsamad_murattal",
      "ar.saadalghamdi":       "sa3d_al-ghaamidy",
      "ar.muhammadayyub":      "muhammad_ayyoub",
      "ar.shaatree":           "abu_bakr_ash-shaatree",
    };
    const candidates: string[] = [
      `https://cdn.islamic.network/quran/audio/128/${reciter}/${num}.mp3`,
      `https://cdn.islamic.network/quran/audio-lofi/64/${reciter}/${num}.mp3`,
    ];
    const every = everyayahMap[reciter];
    if (every) candidates.push(`https://everyayah.com/data/${every}/${padded}.mp3`);
    const qAudio = quranicAudioMap[reciter];
    if (qAudio) candidates.push(`https://download.quranicaudio.com/quran/${qAudio}/${padded}.mp3`);

    for (const url of candidates) {
      try {
        const upstream = await fetch(url, { signal: AbortSignal.timeout(10_000) });
        if (upstream.ok) {
          const buf = await upstream.arrayBuffer();
          if (buf.byteLength > 1000) {
            res.setHeader("Content-Type", "audio/mpeg");
            res.setHeader("Cache-Control", "public, max-age=86400");
            res.send(Buffer.from(buf));
            return;
          }
        }
      } catch { /* try next */ }
    }
    res.status(404).json({ error: "Audio not found for this reciter" });
  } catch {
    res.status(503).json({ error: "Failed to fetch audio" });
  }
});

router.get("/quran/search", async (req, res) => {
  const query = req.query.q as string;
  if (!query || query.trim().length < 2) {
    res.json([]);
    return;
  }

  const results: { surahNumber: number; surahName: string; ayahNumber: number; text: string }[] = [];

  // Search through cached surahs first
  for (const [surahNum, ayahs] of surahCache.entries()) {
    const surah = surahs.find((s) => s.number === surahNum);
    if (!surah) continue;
    for (const ayah of ayahs) {
      if (ayah.text.includes(query)) {
        results.push({
          surahNumber: surahNum,
          surahName: surah.name,
          ayahNumber: ayah.numberInSurah,
          text: ayah.text,
        });
      }
    }
  }

  const data = SearchQuranResponse.parse(results);
  res.json(data);
});

// Accepts JSON:
//   CDN mode:    { ayahs:[{frames:[{pngBase64,durationSec}], globalAyahNum}], reciter }
//   Custom mode: { ayahs:[{frames:[{pngBase64,durationSec}]}], customAudioBase64, customAudioExt }
router.post("/quran/generate-mp4", async (req, res) => {
  interface FrameData { pngBase64: string; durationSec: number; }
  interface AyahData  { frames: FrameData[]; globalAyahNum?: number; }
  const { ayahs, reciter, customAudioBase64, customAudioExt, videoBitrateKbps, fps } = req.body as {
    ayahs: AyahData[]; reciter?: string;
    customAudioBase64?: string; customAudioExt?: string;
    surahNumber: number; startAyah: number; endAyah: number;
    videoBitrateKbps?: number; fps?: number;
  };
  const bitrateKbps = Math.min(8000, Math.max(500, videoBitrateKbps ?? 2500));
  const frameRate   = [24, 30, 60].includes(fps ?? 0) ? (fps as number) : 30;

  if (!Array.isArray(ayahs) || ayahs.length === 0) {
    res.status(400).json({ error: "Missing ayahs" }); return;
  }
  const isCustomAudio = !!customAudioBase64;
  if (!isCustomAudio) {
    if (!reciter) { res.status(400).json({ error: "Missing reciter" }); return; }
    const allowedReciters = [
      "ar.alafasy","ar.abdurrahmanasudais","ar.husary","ar.minshawi","ar.ahmedajamy",
      "ar.mahermuaiqly","ar.abdullahbasfar","ar.saudalshuraim","ar.shaatree",
      "ar.ibrahimakhbar","ar.hani","ar.husarymujawwad","ar.minshawimujawwad",
      "ar.nasser.alqatami","ar.khalefa",
      "ar.abdulsamad","ar.alhudhayfi","ar.saadalghamdi",
      "ar.muhammadayyub","ar.johani","ar.faresabbad",
      "ar.bandarbalila","ar.walk",
    ];
    if (!allowedReciters.includes(reciter)) { res.status(400).json({ error: "Invalid reciter" }); return; }
  }

  // ── Stream NDJSON progress back to client ─────────────────────────
  res.setHeader("Content-Type", "application/x-ndjson");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Transfer-Encoding", "chunked");
  res.flushHeaders();

  const emit = (obj: Record<string, unknown>) => {
    try { res.write(JSON.stringify(obj) + "\n"); } catch { /* client disconnected */ }
  };
  const emitProgress = (p: number, detail: string) => emit({ type: "progress", p: Math.round(p), detail });

  const id = randomUUID();
  const tmpDir = join(tmpdir(), `qr_${id}`);
  await mkdir(tmpDir, { recursive: true });

  const FFMPEG = ffmpegPath ?? "ffmpeg";
  const ffmpegExec = (cmd: string) =>
    new Promise<void>((resolve, reject) =>
      exec(cmd, { maxBuffer: 100 * 1024 * 1024 }, (err, _out, stderr) =>
        err ? reject(new Error(stderr || err.message)) : resolve()
      )
    );

  // Fetch audio with retries + CDN fallbacks
  const FETCH_HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; IslamReels/1.0; +https://islamreels.replit.app)",
    "Accept": "audio/mpeg, audio/*, */*",
  };

  const fetchAudio = async (globalAyahNum: number): Promise<Buffer> => {
    const apiUrl = `https://api.alquran.cloud/v1/ayah/${globalAyahNum}/${reciter}`;
    const padded  = String(globalAyahNum).padStart(6, "0");

    // everyayah.com folder names (verified)
    const everyayahMap: Record<string, string> = {
      "ar.alafasy":            "Alafasy_128kbps",
      "ar.abdurrahmanasudais": "Abdurrahmaan_As-Sudais_192kbps",
      "ar.husary":             "Husary_128kbps",
      "ar.husarymujawwad":     "Husary_Mujawwad_64kbps",
      "ar.minshawi":           "Menshawi_128kbps",
      "ar.minshawimujawwad":   "Menshawi_Mujawwad_128kbps",
      "ar.ahmedajamy":         "Ahmed_ibn_Ali_al-Ajamy_128kbps_ketaballah.net",
      "ar.mahermuaiqly":       "Maher_Al_Muaiqly_128kbps",
      "ar.abdullahbasfar":     "Abdullah_Basfar_192kbps",
      "ar.saudalshuraim":      "Saud_al-Shuraim_128kbps",
      "ar.shaatree":           "Abu_Bakr_al-Shatri_128kbps",
      "ar.abdulsamad":         "Abdul_Basit_Murattal_128kbps",
      "ar.saadalghamdi":       "Saad_al-Ghamdi_128kbps",
      "ar.muhammadayyub":      "Muhammad_Ayyub_128kbps",
      "ar.johani":             "Khalid_Al-Johani_128kbps",
      "ar.alhudhayfi":         "Ali_Al-Huzaifi_128kbps",
      "ar.nasser.alqatami":    "Nasser_Alqatami_128kbps",
    };

    // quranicaudio.com folder names (verified)
    const quranicAudioMap: Record<string, string> = {
      "ar.alafasy":            "mishaari_raashid_al_3afaasee",
      "ar.abdurrahmanasudais": "abdurrahmaan_as-sudays",
      "ar.husary":             "husary",
      "ar.minshawi":           "minshawi_murattal",
      "ar.ahmedajamy":         "ahmed_ibn_3ali_al-3ajamy",
      "ar.mahermuaiqly":       "maher_al_muaiqly",
      "ar.saudalshuraim":      "sa3d_al-shurym",
      "ar.abdulsamad":         "abdulbaset_abdulsamad_murattal",
      "ar.saadalghamdi":       "sa3d_al-ghaamidy",
      "ar.muhammadayyub":      "muhammad_ayyoub",
      "ar.shaatree":           "abu_bakr_ash-shaatree",
    };

    const candidates: string[] = [
      // Primary: islamic.network CDN 128 kbps
      `https://cdn.islamic.network/quran/audio/128/${reciter}/${globalAyahNum}.mp3`,
      // Secondary: islamic.network CDN lofi 64 kbps
      `https://cdn.islamic.network/quran/audio-lofi/64/${reciter}/${globalAyahNum}.mp3`,
    ];
    const every = everyayahMap[reciter];
    if (every) candidates.push(`https://everyayah.com/data/${every}/${padded}.mp3`);
    const qAudio = quranicAudioMap[reciter];
    if (qAudio) candidates.push(`https://download.quranicaudio.com/quran/${qAudio}/${padded}.mp3`);

    // Try each candidate (2 attempts per URL, shorter timeout)
    for (const url of candidates) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const r = await fetch(url, { signal: AbortSignal.timeout(12_000), headers: FETCH_HEADERS });
          if (r.ok) {
            const buf = Buffer.from(await r.arrayBuffer());
            if (buf.length > 1000) return buf; // guard against empty/stub responses
          }
        } catch { if (attempt === 0) await new Promise(x => setTimeout(x, 600)); }
      }
    }

    // Last resort: resolve audio URL from alquran.cloud API metadata
    try {
      const meta = await fetch(apiUrl, { signal: AbortSignal.timeout(10_000), headers: FETCH_HEADERS });
      if (meta.ok) {
        const json = await meta.json() as { data?: { audio?: string; audioSecondary?: string[] } };
        const audioUrls = [json.data?.audio, ...(json.data?.audioSecondary ?? [])].filter(Boolean) as string[];
        for (const audioUrl of audioUrls) {
          try {
            const r = await fetch(audioUrl, { signal: AbortSignal.timeout(15_000), headers: FETCH_HEADERS });
            if (r.ok) {
              const buf = Buffer.from(await r.arrayBuffer());
              if (buf.length > 1000) return buf;
            }
          } catch { /* try next */ }
        }
      }
    } catch { /* ignore */ }

    throw new Error(`لا يتوفر صوت للآية ${globalAyahNum} بهذا القارئ — جرّب قارئاً آخر`);
  };

  // Get actual duration of a media file (seconds) by parsing ffmpeg stderr
  // ffmpeg always prints "Duration: HH:MM:SS.xx" to stderr when given an input
  const getMediaDuration = (filePath: string): Promise<number> =>
    new Promise((resolve, reject) =>
      exec(`"${FFMPEG}" -i "${filePath}"`, (_err, _stdout, stderr) => {
        // ffmpeg exits non-zero when no output file given, _err is expected – ignore it
        const m = stderr.match(/Duration:\s*(\d+):(\d+):([\d.]+)/);
        if (m) resolve(+m[1] * 3600 + +m[2] * 60 + +m[3]);
        else reject(new Error("Cannot parse media duration from: " + filePath));
      })
    );

  // Helper: build a silent still/slideshow video segment for a set of frames
  // ultrafast preset is ~8x faster than medium with minimal quality loss for reels
  const bitrateFlag = `-b:v ${bitrateKbps}k -maxrate ${Math.round(bitrateKbps * 1.5)}k -bufsize ${bitrateKbps * 2}k`;
  const buildImageSegment = async (frames: FrameData[], segPath: string, i: number) => {
    if (frames.length === 1) {
      const imgPath = join(tmpDir, `img${i}_0.jpg`);
      await writeFile(imgPath, Buffer.from(frames[0].pngBase64, "base64"));
      await ffmpegExec(
        `"${FFMPEG}" -y -loop 1 -framerate ${frameRate} -t ${frames[0].durationSec} -i "${imgPath}" ` +
        `-vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" ` +
        `-c:v libx264 -preset ultrafast -tune stillimage ${bitrateFlag} -r ${frameRate} -pix_fmt yuv420p -an "${segPath}"`
      );
    } else {
      const imgInputs = frames.map((f, j) => ({ path: join(tmpDir, `img${i}_${j}.jpg`), dur: f.durationSec, b64: f.pngBase64 }));
      for (const { path: p, b64 } of imgInputs) await writeFile(p, Buffer.from(b64, "base64"));
      const inputFlags = imgInputs.map(({ path: p, dur }) => `-loop 1 -framerate ${frameRate} -t ${dur} -i "${p}"`).join(" ");
      const n = imgInputs.length;
      const concatLabel = imgInputs.map((_, j) => `[${j}:v]`).join("") + `concat=n=${n}:v=1:a=0,scale=trunc(iw/2)*2:trunc(ih/2)*2[vout]`;
      await ffmpegExec(
        `"${FFMPEG}" -y ${inputFlags} -filter_complex "${concatLabel}" -map "[vout]" ` +
        `-c:v libx264 -preset ultrafast -tune stillimage ${bitrateFlag} -r ${frameRate} -pix_fmt yuv420p -an "${segPath}"`
      );
    }
  };

  try {
    const ayahSegPaths: string[] = [];
    const n = ayahs.length;
    console.log(`[generate-mp4] Processing ${n} ayah(s), isCustomAudio=${isCustomAudio}`);

    if (isCustomAudio) {
      // ── Custom audio mode ───────────────────────────────────────────
      const ext = customAudioExt ?? "mp3";
      const audioPath = join(tmpDir, `custom.${ext}`);
      await writeFile(audioPath, Buffer.from(customAudioBase64!, "base64"));
      emitProgress(2, "جاري تجهيز الملف الصوتي...");

      // Build silent image segment for each ayah (2-75%)
      for (let i = 0; i < n; i++) {
        const { frames } = ayahs[i];
        const segPath = join(tmpDir, `seg${i}.mp4`);
        emitProgress(2 + (i / n) * 73, `ترميز مقطع ${i + 1} من ${n}...`);
        await buildImageSegment(frames, segPath, i);
        ayahSegPaths.push(segPath);
        emitProgress(2 + ((i + 1) / n) * 73, `مقطع ${i + 1} من ${n} جاهز ✓`);
      }

      // Concat all silent image segments (75-88%)
      emitProgress(76, "دمج المقاطع المرئية...");
      const videoOnlyPath = join(tmpDir, "video_only.mp4");
      if (ayahSegPaths.length === 1) {
        const listPath = join(tmpDir, "list.txt");
        await writeFile(listPath, `file '${ayahSegPaths[0]}'`, "utf-8");
        await ffmpegExec(
          `"${FFMPEG}" -y -f concat -safe 0 -i "${listPath}" -c copy "${videoOnlyPath}"`
        );
      } else {
        const listPath = join(tmpDir, "list.txt");
        await writeFile(listPath, ayahSegPaths.map(p => `file '${p}'`).join("\n"), "utf-8");
        await ffmpegExec(
          `"${FFMPEG}" -y -f concat -safe 0 -i "${listPath}" ` +
          `-c:v libx264 -preset ultrafast ${bitrateFlag} -r ${frameRate} -pix_fmt yuv420p -an "${videoOnlyPath}"`
        );
      }

      // Mix video with custom audio (88-95%)
      emitProgress(88, "دمج الصوت مع الفيديو...");
      const finalPath = join(tmpDir, "output.mp4");
      await ffmpegExec(
        `"${FFMPEG}" -y -i "${videoOnlyPath}" -i "${audioPath}" ` +
        `-c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart "${finalPath}"`
      );

      emitProgress(96, "الفيديو جاهز، جاري الإرسال...");
      const mp4Buffer = await readFile(finalPath);
      emit({ type: "result", b64: mp4Buffer.toString("base64") });

    } else {
      // ── CDN audio mode ──────────────────────────────────────────────
      // Phase 1: download audio + build silent video for each ayah (0-75%)
      const silentSegPaths: string[] = [];
      const audioPaths: string[] = [];
      const perAyah = 75 / n;

      for (let i = 0; i < n; i++) {
        const { frames, globalAyahNum } = ayahs[i];
        const base = i * perAyah;
        const audioPath = join(tmpDir, `audio${i}.mp3`);
        const silentSeg = join(tmpDir, `seg${i}_silent.mp4`);

        emitProgress(base + perAyah * 0.05, `تحميل صوت الآية ${i + 1} من ${n}...`);
        const audioBuf = await fetchAudio(globalAyahNum!);
        await writeFile(audioPath, audioBuf);
        audioPaths.push(audioPath);
        console.log(`[generate-mp4] ayah ${i + 1}/${n} globalAyahNum=${globalAyahNum} audioBytes=${audioBuf.length}`);

        let audioDur: number;
        try {
          audioDur = await getMediaDuration(audioPath);
        } catch (e) {
          console.warn("getMediaDuration failed, using client duration:", e);
          audioDur = Math.max(1, frames.reduce((s, f) => s + f.durationSec, 0));
        }
        console.log(`[generate-mp4] ayah ${i + 1}/${n} audioDur=${audioDur.toFixed(2)}s frames=${frames.length}`);
        const clientTotalDur = Math.max(0.001, frames.reduce((s, f) => s + f.durationSec, 0));
        const scaledFrames: FrameData[] = frames.map(f => ({
          ...f,
          durationSec: Math.max(0.1, (f.durationSec / clientTotalDur) * audioDur),
        }));

        emitProgress(base + perAyah * 0.55, `ترميز الآية ${i + 1} من ${n}...`);
        await buildImageSegment(scaledFrames, silentSeg, i);
        silentSegPaths.push(silentSeg);
        emitProgress(base + perAyah, `الآية ${i + 1} من ${n} جاهزة ✓`);
      }

      // Phase 2: concat video segments (75-83%)
      // All segments are encoded with identical settings → safe to use -c copy (no re-encode, no timestamp drift)
      emitProgress(76, "دمج المقاطع المرئية...");
      const combinedVideoPath = join(tmpDir, "combined_video.mp4");
      const videoListPath = join(tmpDir, "list_video.txt");
      await writeFile(videoListPath, silentSegPaths.map(p => `file '${p}'`).join("\n"), "utf-8");
      await ffmpegExec(
        `"${FFMPEG}" -y -f concat -safe 0 -i "${videoListPath}" -c copy "${combinedVideoPath}"`
      );

      // Phase 3: concat audio using filter_complex (handles MP3 files with different bitrates/channels from various CDNs)
      emitProgress(83, "دمج الملفات الصوتية...");
      const combinedAudioPath = join(tmpDir, "combined_audio.aac");
      if (audioPaths.length === 1) {
        await ffmpegExec(
          `"${FFMPEG}" -y -i "${audioPaths[0]}" -c:a aac -b:a 192k "${combinedAudioPath}"`
        );
      } else {
        const audioInputs = audioPaths.map(p => `-i "${p}"`).join(" ");
        const audioFilter = audioPaths.map((_, i) => `[${i}:a]`).join("") + `concat=n=${audioPaths.length}:v=0:a=1[aout]`;
        console.log(`[generate-mp4] Concat audio: ${audioPaths.length} files via filter_complex`);
        await ffmpegExec(
          `"${FFMPEG}" -y ${audioInputs} -filter_complex "${audioFilter}" -map "[aout]" -c:a aac -b:a 192k "${combinedAudioPath}"`
        );
      }

      // Phase 4: mux video + audio (90-96%)
      // Video total duration == sum of per-ayah audio durations, so no -shortest needed
      emitProgress(90, "دمج الصوت مع الفيديو...");
      const finalPath = join(tmpDir, "output.mp4");
      await ffmpegExec(
        `"${FFMPEG}" -y -i "${combinedVideoPath}" -i "${combinedAudioPath}" ` +
        `-c:v copy -c:a copy -movflags +faststart "${finalPath}"`
      );

      emitProgress(96, "الفيديو جاهز، جاري الإرسال...");
      const mp4Buffer = await readFile(finalPath);
      emit({ type: "result", b64: mp4Buffer.toString("base64") });
    }

    res.end();

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("generate-mp4 error:", msg);
    emit({ type: "error", msg: msg || "فشل توليد الفيديو" });
    res.end();
  } finally {
    await rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
});

export default router;
