export const site = {
  name: "قِرى",
  tagline: "كل التفاصيل. في قِرى.",
  logo: "/logo.svg", // استبدل هذا الملف لتغيير الشعار في جميع الصفحات.
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://www.qira.ltd",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "s.14f@outlook.sa",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "966501191554",
  whatsappMessage:
    "مرحبًا، أرغب في معرفة المزيد عن منصة إدارة المطاعم وكيف يمكن أن تناسب نشاطي.",
};

export const navLinks = [
  ["الرئيسية", "home"],
  ["المميزات", "features"],
  ["كيف تعمل المنصة", "how-it-works"],
  ["تجربة العميل", "experience"],
  ["صمّم باقتك", "pricing"],
  ["الأسئلة الشائعة", "faq"],
  ["تواصل معنا", "contact"],
] as const;

export const menuItems = [
  {
    id: "burger",
    name: "برجر Qira الكلاسيكي",
    description: "لحم أنجوس مشوي، جبن شيدر، خضار طازجة وصوص Qira الخاص.",
    price: 4200,
    category: "الأطباق الرئيسية",
    image: "/burger.jpg",
    badge: "الأكثر طلبًا",
  },
  {
    id: "chicken",
    name: "برجر الدجاج المقرمش",
    description: "دجاج مقرمش، خس طازج، مخلل وصوص كريمي في خبز البريوش.",
    price: 3600,
    category: "الأطباق الرئيسية",
    image: "/chicken.jpg",
    badge: "اختيار الشيف",
  },
  {
    id: "salad",
    name: "سلطة الحديقة",
    description:
      "تشكيلة من الخضار الموسمية الطازجة مع تتبيلة الليمون وزيت الزيتون.",
    price: 2800,
    category: "المقبلات",
    image: "/salad.jpg",
    badge: "طازج يوميًا",
  },
  {
    id: "lemon",
    name: "ليمون ونعناع",
    description: "ليمون طازج مع أوراق النعناع والثلج. انتعاش يستحق التجربة.",
    price: 1800,
    category: "المشروبات",
    image: "/lemon.svg",
    badge: "منعش",
  },
];

export function money(amount: number) {
  return (amount / 100).toLocaleString("ar-SA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}
