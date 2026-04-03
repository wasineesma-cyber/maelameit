export interface Category {
  name: string;
  emoji: string;
}

export const INCOME_CATEGORIES: Category[] = [
  { name: "เงินเดือน", emoji: "💼" },
  { name: "งานพิเศษ", emoji: "⭐" },
  { name: "ฟรีแลนซ์", emoji: "💻" },
  { name: "ลงทุน", emoji: "📈" },
  { name: "ขายของ", emoji: "🛍️" },
  { name: "รับโอน", emoji: "💸" },
  { name: "โบนัส", emoji: "🎁" },
  { name: "อื่นๆ", emoji: "➕" },
];

export const EXPENSE_CATEGORIES: Category[] = [
  { name: "อาหาร", emoji: "🍚" },
  { name: "เครื่องดื่ม", emoji: "☕" },
  { name: "เดลิเวอรี", emoji: "🛵" },
  { name: "เดินทาง", emoji: "🚌" },
  { name: "ชอปปิ้ง", emoji: "🛒" },
  { name: "ความงาม", emoji: "💄" },
  { name: "สุขภาพ", emoji: "🏥" },
  { name: "บ้าน/บิล", emoji: "🏠" },
  { name: "โทรศัพท์", emoji: "📱" },
  { name: "บันเทิง", emoji: "🎮" },
  { name: "การศึกษา", emoji: "📚" },
  { name: "สัตว์เลี้ยง", emoji: "🐱" },
  { name: "ประกัน", emoji: "🛡️" },
  { name: "อื่นๆ", emoji: "➕" },
];
