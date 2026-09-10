"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "./ui";
import Image from "next/image";

const periods = ["هذا الأسبوع", "هذا الشهر", "اليوم"];
const values = ["١٢٬٤٥٠", "٤٨٬٧٢٠", "٣٬٨٤٠"];
const chartPaths = [
  "M0 112 C16 111 23 128 38 108 S57 115 71 91 S90 108 107 87 S130 104 146 77 S165 101 184 76 S200 90 221 61 S244 80 258 49 S280 72 296 35 S316 60 339 20 S366 48 390 12",
  "M0 125 C40 130 44 84 80 92 S132 62 157 75 S205 35 236 58 S274 14 300 25 S345 5 390 0",
  "M0 120 C25 127 44 97 78 108 S119 68 159 90 S205 84 240 50 S292 65 325 36 S360 39 390 15",
];
export default function DashboardPreview({
  expanded = false,
  onExplore,
}: {
  expanded?: boolean;
  onExplore?: () => void;
}) {
  const [period, setPeriod] = useState(0);
  const [view, setView] = useState("dashboard");
  const [branch, setBranch] = useState(false);
  const [kitchenStates, setKitchenStates] = useState([0, 1, 1]);
  const kitchenLabels = ["جديد", "قيد التحضير", "جاهز"];
  const titles: Record<string, string> = {
    dashboard: "نظرة عامة",
    bag: "الطلبات المباشرة",
    chef: "المطبخ الرقمي",
    chart: "تقارير المبيعات",
    users: "عملاء المطعم",
  };
  return (
    <div className={`product-preview ${expanded ? "expanded" : ""}`}>
      <div className="window-toolbar">
        <span className="window-dots">
          <i />
          <i />
          <i />
        </span>
        <span>
          <Icon name="lock" size={9} />
          Qira / لوحة التحكم
        </span>
        <button
          type="button"
          onClick={onExplore || (() => setView("dashboard"))}
          aria-label="استكشاف لوحة التحكم"
        >
          <Icon name="expand" size={12} />
        </button>
      </div>
      <div className="preview-app">
        <aside className="preview-sidebar">
          <Image src="/logo2.svg" width={30} height={30} alt="Qira" />
          <div className="preview-nav">
            {["dashboard", "bag", "chef", "chart", "users"].map((icon) => (
              <button
                type="button"
                key={icon}
                className={view === icon ? "selected" : ""}
                aria-label={titles[icon]}
                title={titles[icon]}
                onClick={() => setView(icon)}
              >
                <Icon name={icon} size={17} />
              </button>
            ))}
          </div>
          <span className="preview-user">أ</span>
        </aside>
        <div className="preview-content">
          <header className="preview-top">
            <div>
              <span className="muted">مساحة عمل مطعمك</span>
              <h3>{titles[view]}</h3>
            </div>
            <div className="preview-top-actions">
              <button
                onClick={() => setBranch(!branch)}
                className="branch-select"
                type="button"
              >
                <Icon name="store" size={10} />
                {branch ? "فرع النخيل" : "فرع العليا"}
                <Icon name="down" size={10} />
              </button>
              <span className="preview-notification">
                <Icon name="bell" size={15} />
                <i />
              </span>
            </div>
          </header>
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
            >
              {(view === "dashboard" || view === "chart") && (
                <>
                  <div className="preview-greeting">
                    <div>
                      <b>كل التفاصيل، أمامك.</b>
                    </div>
                  </div>
                  <div className="preview-kpis">
                    <div className="preview-kpi">
                      <span>
                        إجمالي المبيعات
                        <Icon name="wallet" size={14} />
                      </span>
                      <strong>
                        {branch ? "٩٬٦٨٠" : values[period]}
                        <small>ر.س</small>
                      </strong>
                      <em>
                        <Icon name="trend" size={9} />
                        ١٨.٦٪ <small>مقارنة بالأمس</small>
                      </em>
                    </div>
                    <div className="preview-kpi">
                      <span>
                        إجمالي الطلبات
                        <Icon name="bag" size={14} />
                      </span>
                      <strong>
                        {period === 1 ? "٥٨٠" : "١٤٨"}
                        <small>طلب</small>
                      </strong>
                      <em>
                        <Icon name="trend" size={9} />
                        ١٢.٤٪ <small>مقارنة بالأمس</small>
                      </em>
                    </div>
                    <div className="preview-kpi">
                      <span>
                        متوسط الفاتورة
                        <Icon name="receipt" size={14} />
                      </span>
                      <strong>
                        ٨٤.١<small>ر.س</small>
                      </strong>
                      <em>
                        <Icon name="trend" size={9} />
                        ٨.٢٪ <small>مقارنة بالأمس</small>
                      </em>
                    </div>
                  </div>
                  <div className="preview-chart">
                    <div className="chart-heading">
                      <strong>أداء المبيعات</strong>
                      <button
                        type="button"
                        onClick={() => setPeriod((period + 1) % 3)}
                      >
                        {periods[period]}
                        <Icon name="down" size={10} />
                      </button>
                    </div>
                    <div className="chart-area">
                      <div className="chart-y">
                        <span>١٥ ألف</span>
                        <span>١٠ آلاف</span>
                        <span>٥ آلاف</span>
                        <span>٠</span>
                      </div>
                      <div className="chart-plot">
                        <div className="chart-grid">
                          <i />
                          <i />
                          <i />
                          <i />
                        </div>
                        <svg
                          viewBox="0 0 390 150"
                          preserveAspectRatio="none"
                          role="img"
                          aria-label="رسم توضيحي لنمو مبيعات المطعم"
                        >
                          <defs>
                            <linearGradient
                              id={`chart-fill-${expanded ? "large" : "small"}`}
                              x1="0"
                              x2="0"
                              y1="0"
                              y2="1"
                            >
                              <stop
                                offset="0%"
                                stopColor="#188B8A"
                                stopOpacity=".17"
                              />
                              <stop
                                offset="100%"
                                stopColor="#188B8A"
                                stopOpacity="0"
                              />
                            </linearGradient>
                          </defs>
                          <path
                            d={`${chartPaths[period]} L390 150 L0 150 Z`}
                            fill={`url(#chart-fill-${expanded ? "large" : "small"})`}
                          />
                          <path
                            d={chartPaths[period]}
                            stroke="#188B8A"
                            strokeWidth="2.5"
                            fill="none"
                            vectorEffect="non-scaling-stroke"
                          />
                        </svg>
                        <div className="chart-tooltip">
                          <small>الأربعاء</small>
                          <b>
                            ٢٬٨٤٠ <span>ر.س</span>
                          </b>
                          <i />
                        </div>
                        <div className="chart-x">
                          <span>السبت</span>
                          <span>الأحد</span>
                          <span>الإثنين</span>
                          <span>الثلاثاء</span>
                          <span>الأربعاء</span>
                          <span>الخميس</span>
                          <span>الجمعة</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="preview-bottom">
                    <div className="preview-recent">
                      <h4>
                        آخر الطلبات<span>عرض الكل</span>
                      </h4>
                      {["٠٤٨", "٠٤٧"].map((id, i) => (
                        <div className="mini-order-row" key={id}>
                          <span className="mini-order-icon">
                            <Icon name="receipt" size={13} />
                          </span>
                          <div>
                            <b>طلب #{id}</b>
                            <small>
                              طاولة {i === 0 ? "٠٨" : "٠٣"} · منذ دقيقتين
                            </small>
                          </div>
                          <span className={`tiny-status ${i ? "orange" : ""}`}>
                            {i ? "قيد التحضير" : "مكتمل"}
                          </span>
                          <b>
                            {i ? "١١٢" : "٨٤"} <small>ر.س</small>
                          </b>
                        </div>
                      ))}
                    </div>
                    <div className="preview-best">
                      <h4>
                        الأكثر طلبًا
                        <Icon name="trend" size={11} />
                      </h4>
                      <div className="best-food">
                        <Image
                          src="/chicken.jpg"
                          alt="برجر Qira"
                          width={38}
                          height={38}
                        />
                        <div>
                          <b>برجر Qira</b>
                          <small>٤٨ طلبًا اليوم</small>
                        </div>
                      </div>
                      <div className="best-bar">
                        <span />
                      </div>
                    </div>
                  </div>
                </>
              )}
              {(view === "chef" || view === "bag") && (
                <div className="preview-kitchen">
                  <div className="preview-greeting">
                    <div>
                      <b>مطبخك، بإيقاع واحد.</b>
                      <span>اضغط على الطلب لتحديث مرحلته — بيانات توضيحية</span>
                    </div>
                  </div>
                  <div className="mini-kitchen-columns">
                    {kitchenLabels.map((label, stage) => (
                      <div key={label}>
                        <h4>
                          <i className={`stage-dot stage-${stage}`} />
                          {label}
                        </h4>
                        {kitchenStates.map(
                          (state, index) =>
                            state === stage && (
                              <button
                                className="mini-kitchen-card"
                                key={index}
                                onClick={() =>
                                  setKitchenStates(
                                    kitchenStates.map((s, i) =>
                                      i === index ? (s + 1) % 3 : s,
                                    ),
                                  )
                                }
                              >
                                <b>طلب #٠{48 + index}</b>
                                <span>طاولة ٠{index + 3}</span>
                                <hr />
                                <p>٢ × برجر Qira</p>
                                <p>١ × ليمون ونعناع</p>
                                <small>
                                  <Icon name="clock" size={10} />
                                  منذ {index + 2} دقائق
                                </small>
                                <em>
                                  {stage < 2
                                    ? "المرحلة التالية"
                                    : "إعادة العرض"}
                                  <Icon name="arrow" size={10} />
                                </em>
                              </button>
                            ),
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {view === "users" && (
                <div className="preview-customers">
                  <div className="preview-greeting">
                    <div>
                      <b>زيارة اليوم. عميل الغد.</b>
                      <span>برنامج ولاء مستقل لمطعمك — بيانات توضيحية</span>
                    </div>
                  </div>
                  {["أحمد محمد", "سارة خالد", "عبدالله سعد"].map((name, i) => (
                    <div className="customer-demo-row" key={name}>
                      <span>{name[0]}</span>
                      <div>
                        <b>{name}</b>
                        <small>{i + 3} زيارات هذا الشهر</small>
                      </div>
                      <strong>
                        {(i + 2) * 120} نقطة
                        <Icon name="gift" size={14} />
                      </strong>
                    </div>
                  ))}
                  <p className="demo-caption">
                    كل زيارة، فرصة جديدة لبناء علاقة تدوم.
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
          <div className="preview-footnote">
            <Icon name="shield" size={10} />
            <span>بيانات آمنة · تشغيل متصل</span>
            <small>بيانات توضيحية</small>
          </div>
        </div>
      </div>
    </div>
  );
}
