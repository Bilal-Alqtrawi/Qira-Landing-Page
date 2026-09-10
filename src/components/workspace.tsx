"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { menuItems, money } from "@/lib/site";
import {
  actionLabels,
  nextStatus,
  orderNumber,
  paymentLabels,
  statusLabels,
  type ClientCompany,
  type ClientOrder,
  type ClientServiceRequest,
  type ClientShift,
} from "@/lib/types";
import { EmptyState, Icon, Logo, Modal } from "./ui";
import Image from "next/image";

const views = [
  { id: "overview", label: "نظرة عامة", icon: "dashboard" },
  { id: "orders", label: "الطلبات", icon: "bag" },
  { id: "kitchen", label: "المطبخ الرقمي", icon: "chef" },
  { id: "menu", label: "قائمة الطعام", icon: "utensils" },
  { id: "shifts", label: "المناوبات", icon: "clock" },
  { id: "invoices", label: "مستندات التجربة", icon: "receipt" },
  { id: "reports", label: "التقارير", icon: "chart" },
  { id: "settings", label: "إعدادات المطعم", icon: "settings" },
];

export default function Workspace({
  initialCompany,
}: {
  initialCompany: ClientCompany;
}) {
  const router = useRouter();
  const [company, setCompany] = useState(initialCompany);
  const [draft, setDraft] = useState({
    name: initialCompany.name,
    ownerName: initialCompany.ownerName,
    phone: initialCompany.phone,
    branchCount: initialCompany.branchCount,
  });
  const [view, setView] = useState("overview");
  const [orders, setOrders] = useState<ClientOrder[]>([]);
  const [shifts, setShifts] = useState<ClientShift[]>([]);
  const [services, setServices] = useState<ClientServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [shiftModal, setShiftModal] = useState<"open" | "close" | null>(null);
  const [paymentOrder, setPaymentOrder] = useState<ClientOrder | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [cancelOrder, setCancelOrder] = useState<ClientOrder | null>(null);
  const [deleteModal, setDeleteModal] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [modalError, setModalError] = useState("");
  const activeShift = shifts.find((shift) => !shift.closedAt);
  const paidOrders = orders.filter((order) => order.status === "paid");
  const revenue = paidOrders.reduce((sum, order) => sum + order.total, 0);
  const activeOrders = orders.filter((order) =>
    ["new", "preparing", "ready"].includes(order.status),
  );
  const daysLeft = Math.max(
    0,
    Math.ceil(
      (new Date(company.trialEndsAt).getTime() - Date.now()) / 86400000,
    ),
  );
  const activeCash = paidOrders
    .filter(
      (order) =>
        order.shiftId === activeShift?.id && order.paymentMethod === "cash",
    )
    .reduce((sum, order) => sum + order.total, 0);
  const filteredOrders = orders.filter(
    (order) =>
      (statusFilter === "all" || order.status === statusFilter) &&
      `${order.id} ${order.items.map((i) => i.name).join(" ")}`
        .toLowerCase()
        .includes(search.toLowerCase().trim()),
  );
  const reportOrders = paidOrders.filter(
    (order) =>
      (!fromDate ||
        (order.paidAt || order.createdAt).slice(0, 10) >= fromDate) &&
      (!toDate || (order.paidAt || order.createdAt).slice(0, 10) <= toDate),
  );
  const reportTotal = reportOrders.reduce((sum, order) => sum + order.total, 0);
  const refresh = useCallback(async () => {
    try {
      const [ordersResponse, workspaceResponse] = await Promise.all([
        fetch("/api/orders?scope=dashboard", { cache: "no-store" }),
        fetch("/api/workspace", { cache: "no-store" }),
      ]);
      if (ordersResponse.status === 401 || workspaceResponse.status === 401) {
        router.replace("/?login=1");
        return;
      }
      if (!ordersResponse.ok || !workspaceResponse.ok)
        throw new Error("تعذر تحديث البيانات. تحقق من اتصالك وحاول مجددًا.");
      const [orderData, workspaceData] = await Promise.all([
        ordersResponse.json(),
        workspaceResponse.json(),
      ]);
      setOrders(orderData.orders);
      setServices(orderData.serviceRequests || []);
      setShifts(workspaceData.shifts);
      setCompany(workspaceData.company);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر تحديث البيانات.");
    } finally {
      setLoading(false);
    }
  }, [router]);
  useEffect(() => {
    void refresh();
    const timer = setInterval(() => {
      if (!document.hidden) void refresh();
    }, 8000);
    return () => clearInterval(timer);
  }, [refresh]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(timer);
  }, [toast]);
  function navigate(id: string) {
    setView(id);
    setMobileNav(false);
    setError("");
  }
  async function logout() {
    setBusy("logout");
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("تعذر تسجيل الخروج.");
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر تسجيل الخروج.");
      setBusy("");
    }
  }
  async function updateOrder(
    order: ClientOrder,
    status: string,
    method = "cash",
  ) {
    if (busy) return;
    setBusy(order.id);
    setError("");
    setModalError("");
    try {
      const response = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: order.id, status, paymentMethod: method }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setOrders((current) =>
        current.map((item) => (item.id === data.order.id ? data.order : item)),
      );
      setPaymentOrder(null);
      setCancelOrder(null);
      setToast(`تم تحديث الطلب إلى: ${statusLabels[status]}`);
      await refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "تعذر تحديث الطلب.";
      setError(message);
      setModalError(message);
      await refresh();
    } finally {
      setBusy("");
    }
  }
  function orderAction(order: ClientOrder) {
    if (order.status === "ready") {
      setModalError("");
      setPaymentMethod("cash");
      setPaymentOrder(order);
    } else void updateOrder(order, nextStatus[order.status]);
  }
  async function saveSettings(
    event?: FormEvent<HTMLFormElement>,
    disabledItems?: string[],
  ) {
    event?.preventDefault();
    if (busy) return;
    setBusy("settings");
    setError("");
    const data = disabledItems
      ? {
          name: company.name,
          ownerName: company.ownerName,
          phone: company.phone,
          branchCount: company.branchCount,
          disabledItems,
        }
      : { ...draft, disabledItems: company.disabledItems };
    try {
      const response = await fetch("/api/workspace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setCompany((current) => ({ ...current, ...data }));
      setToast(
        disabledItems
          ? "تم تحديث إتاحة الصنف في قائمة المطعم."
          : "حفظنا إعدادات مطعمك بنجاح.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر حفظ الإعدادات.");
    } finally {
      setBusy("");
    }
  }
  async function submitShift(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy("shift");
    setModalError("");
    const amount = Math.round(
      Number(new FormData(event.currentTarget).get("amount")) * 100,
    );
    try {
      const response = await fetch("/api/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: shiftModal, amount }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setToast(
        shiftModal === "open"
          ? "بدأت المناوبة. يمكنك الآن تسجيل التحصيل التجريبي."
          : `أُغلقت المناوبة. الفرق النقدي: ${money(data.difference)} ر.س`,
      );
      setShiftModal(null);
      await refresh();
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "تعذر حفظ المناوبة.");
    } finally {
      setBusy("");
    }
  }
  function exportData(
    format: "csv" | "excel",
    rows: ClientOrder[] = reportOrders,
  ) {
    const values: (string | number)[][] = [
      [
        "رقم الطلب",
        "التاريخ",
        "الإجمالي بالريال",
        "الحالة",
        "طريقة الدفع",
        "الطاولة",
      ],
      ...rows.map((order) => [
        orderNumber(order.id),
        new Date(order.paidAt || order.createdAt).toLocaleString("ar-SA"),
        order.total / 100,
        statusLabels[order.status],
        paymentLabels[order.paymentMethod || ""] || "—",
        order.tableNumber,
      ]),
    ];
    const escapeXml = (value: string | number) =>
      String(value).replace(
        /[&<>"']/g,
        (c) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&apos;",
          })[c]!,
      );
    let content = "";
    let extension = "csv";
    let type = "text/csv;charset=utf-8";
    if (format === "csv")
      content =
        "\uFEFF" +
        values
          .map((row) =>
            row
              .map(
                (value) =>
                  `"${String(value)
                    .replace(/^[=+@-]/, (c) => `'${c}`)
                    .replaceAll('"', '""')}"`,
              )
              .join(","),
          )
          .join("\r\n");
    else {
      content = `<?xml version="1.0" encoding="UTF-8"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="تقارير Qira"><Table>${values.map((row) => `<Row>${row.map((value) => `<Cell><Data ss:Type="${typeof value === "number" ? "Number" : "String"}">${escapeXml(value)}</Data></Cell>`).join("")}</Row>`).join("")}</Table></Worksheet></Workbook>`;
      extension = "xml";
      type = "application/vnd.ms-excel;charset=utf-8";
    }
    const url = URL.createObjectURL(new Blob([content], { type }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `sufra-report-${new Date().toISOString().slice(0, 10)}.${extension}`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setToast("تم تنزيل التقرير. جميع المبالغ في الملف بالريال السعودي.");
  }
  async function deleteWorkspace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy("delete");
    setModalError("");
    const confirmation = new FormData(event.currentTarget).get("confirmation");
    try {
      const response = await fetch("/api/workspace", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      router.push("/");
      router.refresh();
    } catch (err) {
      setModalError(
        err instanceof Error ? err.message : "تعذر حذف مساحة التجربة.",
      );
      setBusy("");
    }
  }
  const sevenDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const key = date.toISOString().slice(0, 10);
    return {
      key,
      label: date.toLocaleDateString("ar-SA", { weekday: "short" }),
      total: paidOrders
        .filter(
          (order) => (order.paidAt || order.createdAt).slice(0, 10) === key,
        )
        .reduce((sum, order) => sum + order.total, 0),
    };
  });
  const maxDay = Math.max(...sevenDays.map((d) => d.total), 100);
  const renderOrderTable = (rows: ClientOrder[], invoices = false) => (
    <div className="table-scroll">
      <table className="orders-table">
        <thead>
          <tr>
            <th>رقم الطلب</th>
            <th>الأصناف</th>
            <th>الطاولة</th>
            <th>الإجمالي</th>
            <th>الحالة</th>
            <th>{invoices ? "طريقة الدفع" : "الإجراء"}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((order) => (
            <tr key={order.id}>
              <td>
                <b dir="ltr">#{orderNumber(order.id)}</b>
                <small>
                  {new Date(order.createdAt).toLocaleString("ar-SA", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </small>
              </td>
              <td>
                <span className="table-item-name">
                  {order.items
                    .map((item) => `${item.quantity} × ${item.name}`)
                    .join("، ")}
                </span>
              </td>
              <td>
                <span className="table-number">
                  {order.tableNumber.toLocaleString("ar-SA")}
                </span>
              </td>
              <td>
                <strong>{money(order.total)}</strong>{" "}
                <small className="inline">ر.س</small>
              </td>
              <td>
                <span className={`status-badge status-${order.status}`}>
                  {statusLabels[order.status]}
                </span>
              </td>
              <td>
                {invoices ? (
                  <span>{paymentLabels[order.paymentMethod || ""] || "—"}</span>
                ) : (
                  <div className="table-actions">
                    {nextStatus[order.status] && (
                      <button
                        className="table-action"
                        type="button"
                        disabled={!!busy}
                        onClick={() => orderAction(order)}
                      >
                        {busy === order.id
                          ? "جارٍ التحديث..."
                          : actionLabels[order.status]}
                        <Icon name="arrow" size={13} />
                      </button>
                    )}
                    {order.status === "new" && (
                      <button
                        className="icon-button small"
                        type="button"
                        aria-label={`إلغاء الطلب ${orderNumber(order.id)}`}
                        onClick={() => {
                          setModalError("");
                          setCancelOrder(order);
                        }}
                      >
                        <Icon name="close" size={13} />
                      </button>
                    )}
                    {order.status === "paid" && (
                      <button
                        className="table-action"
                        type="button"
                        onClick={() => exportData("csv", [order])}
                      >
                        <Icon name="download" size={14} />
                        تنزيل
                      </button>
                    )}
                    {order.status === "cancelled" && (
                      <span className="muted">—</span>
                    )}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && (
        <EmptyState
          title="لا توجد طلبات هنا بعد"
          description="ابدأ طلبًا من القائمة التجريبية، أو غيّر عوامل التصفية."
        >
          <Link className="button button-primary" href="/demo">
            افتح قائمة العميل
            <Icon name="arrow" size={15} />
          </Link>
        </EmptyState>
      )}
    </div>
  );

  return (
    <MotionConfig reducedMotion="user">
      <div className="workspace-shell">
        <aside className={`workspace-sidebar ${mobileNav ? "open" : ""}`}>
          <div className="workspace-brand">
            <Logo light compact />
            <button
              type="button"
              className="sidebar-close"
              aria-label="إغلاق قائمة لوحة التحكم"
              onClick={() => setMobileNav(false)}
            >
              <Icon name="close" size={22} />
            </button>
          </div>
          <div className="workspace-restaurant">
            <span>
              <Icon name="store" size={21} />
            </span>
            <div>
              <b>{company.name}</b>
              <small>مساحة تجريبية مستقلة</small>
            </div>
          </div>
          <nav aria-label="أقسام لوحة المطعم">
            {views.map((item) => (
              <button
                key={item.id}
                className={view === item.id ? "active" : ""}
                aria-current={view === item.id ? "page" : undefined}
                type="button"
                onClick={() => navigate(item.id)}
              >
                <Icon name={item.icon} size={19} />
                <span>{item.label}</span>
                {item.id === "orders" && activeOrders.length > 0 && (
                  <b>{activeOrders.length}</b>
                )}
              </button>
            ))}
          </nav>
          <div className="workspace-sidebar-bottom">
            <div className="trial-remaining">
              <Icon name="gift" size={21} />
              <b>
                {daysLeft
                  ? `${daysLeft.toLocaleString("ar-SA")} يومًا لاكتشاف الفرق`
                  : "انتهت مدة التجربة المسجلة"}
              </b>
              <p>بدون بطاقة. بدون التزام.</p>
              <Link href="/#pricing">
                استكشف الإضافات
                <Icon name="arrow" size={13} />
              </Link>
            </div>
            <button type="button" onClick={logout} disabled={!!busy}>
              <Icon name="logout" size={18} />
              تسجيل الخروج
            </button>
          </div>
        </aside>
        {mobileNav && (
          <button
            type="button"
            className="sidebar-scrim"
            aria-label="إغلاق التنقل"
            onClick={() => setMobileNav(false)}
          />
        )}
        <div className="workspace-main">
          <header className="workspace-topbar">
            <div>
              <button
                className="icon-button workspace-menu-toggle"
                type="button"
                aria-label="فتح قائمة لوحة التحكم"
                onClick={() => setMobileNav(true)}
              >
                <Icon name="menu" size={21} />
              </button>
              <span>
                مساحة عمل مطعمك
                <Icon name="left" size={13} />
                <b>{views.find((item) => item.id === view)?.label}</b>
              </span>
            </div>
            <div className="workspace-top-actions">
              <Link href="/demo" className="button button-outline">
                <Icon name="qr" size={16} />
                قائمة العميل
              </Link>
              <span className="workspace-owner">
                <span>{company.ownerName[0]}</span>
                <b>
                  {company.ownerName}
                  <small>مدير الشركة</small>
                </b>
              </span>
            </div>
          </header>
          <div className="workspace-notice">
            <Icon name="shield" size={15} />
            <span>
              بيئة تشغيل تجريبية. المدفوعات وزاتكا والرسائل الخارجية غير مرتبطة.
              بياناتك محفوظة ومعزولة لحسابك.
            </span>
          </div>
          <main className="workspace-content">
            <div className="workspace-page-heading">
              <div>
                <span className="eyebrow">
                  {view === "overview"
                    ? `أهلًا، ${company.ownerName.split(" ")[0]}.`
                    : "صورة أوضح لكل التفاصيل"}
                </span>
                <h1>
                  {view === "overview"
                    ? "كل التفاصيل، تحت نظرك."
                    : views.find((item) => item.id === view)?.label}
                </h1>
                <p>
                  {view === "overview"
                    ? "هذا ما يحدث في مطعمك. الأرقام أدناه من طلبات تجربتك الفعلية، وليست بيانات جاهزة."
                    : view === "kitchen"
                      ? "كل طلب في مكانه، وكل مرحلة واضحة. تتحدث الطلبات كل ٨ ثوانٍ."
                      : view === "menu"
                        ? "إيقاف أي صنف ينعكس على قائمة العميل، ويمنع طلبه على الخادم أيضًا."
                        : view === "shifts"
                          ? "بداية واضحة، ونهاية أكثر شفافية. المبالغ محفوظة بالهللة لتجنب فروقات التقريب."
                          : view === "reports"
                            ? "تقارير حقيقية من بيانات التجربة، لآخر ١٠٠ طلب. اختر الفترة وصدّر ما تحتاج إليه."
                            : view === "invoices"
                              ? "مستندات الطلبات المكتملة غير قابلة للتعديل. ليست فواتير ضريبية ولا تُرسل إلى زاتكا."
                              : view === "settings"
                                ? "هوية مساحة عملك، وبيانات التواصل مع مطعمك."
                                : "تابع الطلبات وحدّث حالاتها من مكان واحد."}
                </p>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => {
                  setError("");
                  void refresh();
                }}
                aria-label="تحديث بيانات لوحة التحكم"
              >
                <Icon
                  name="reset"
                  size={19}
                  className={loading ? "spin" : ""}
                />
              </button>
            </div>
            {error && (
              <div className="app-alert error" role="alert">
                <Icon name="alert" size={18} />
                <span>{error}</span>
                <button
                  type="button"
                  onClick={() => setError("")}
                  aria-label="إغلاق رسالة الخطأ"
                >
                  <Icon name="close" size={17} />
                </button>
              </div>
            )}
            {loading ? (
              <div className="loading-state" role="status">
                <Icon name="loading" className="spin" size={28} />
                نجهّز صورة مطعمك...
              </div>
            ) : (
              <>
                {view === "overview" && (
                  <>
                    <div className="workspace-kpis">
                      {[
                        {
                          title: "إجمالي التحصيل التجريبي",
                          value: money(revenue),
                          suffix: "ر.س",
                          icon: "wallet",
                          note: `${paidOrders.length.toLocaleString("ar-SA")} طلبات مكتملة`,
                        },
                        {
                          title: "إجمالي الطلبات",
                          value: orders.length.toLocaleString("ar-SA"),
                          suffix: "طلب",
                          icon: "bag",
                          note: "الطلبات المحفوظة في مساحة مطعمك",
                        },
                        {
                          title: "قيد التشغيل الآن",
                          value: activeOrders.length.toLocaleString("ar-SA"),
                          suffix: "طلب",
                          icon: "chef",
                          note: "جديد · قيد التحضير · جاهز",
                        },
                        {
                          title: "متوسط الفاتورة",
                          value: money(
                            paidOrders.length
                              ? Math.round(revenue / paidOrders.length)
                              : 0,
                          ),
                          suffix: "ر.س",
                          icon: "receipt",
                          note: "من الطلبات المكتملة فقط",
                        },
                      ].map((item) => (
                        <article className="workspace-kpi" key={item.title}>
                          <div>
                            <span>{item.title}</span>
                            <span className="kpi-icon">
                              <Icon name={item.icon} size={21} />
                            </span>
                          </div>
                          <strong>
                            {item.value}
                            <small>{item.suffix}</small>
                          </strong>
                          <p>{item.note}</p>
                        </article>
                      ))}
                    </div>
                    {!orders.length && (
                      <div className="workspace-onboarding">
                        <span className="icon-tile">
                          <Icon name="sparkles" size={30} />
                        </span>
                        <div>
                          <h2>مطعمك جاهز للخطوة الأولى.</h2>
                          <p>
                            ابدأ مناوبة، ثم افتح قائمة العميل وأنشئ طلبًا. ستراه
                            هنا وتتابع رحلته حتى التحصيل التجريبي.
                          </p>
                        </div>
                        <button
                          type="button"
                          className="button button-primary"
                          onClick={() => {
                            navigate("shifts");
                            if (!activeShift) {
                              setModalError("");
                              setShiftModal("open");
                            }
                          }}
                        >
                          ابدأ مناوبتك الأولى
                          <Icon name="arrow" size={17} />
                        </button>
                      </div>
                    )}
                    <div className="workspace-overview-grid">
                      <section className="workspace-card">
                        <div className="workspace-card-head">
                          <h2>أداء آخر سبعة أيام</h2>
                          <span className="subtle-label">مبيعات التجربة</span>
                        </div>
                        <div className="real-sales-chart">
                          {sevenDays.map((day) => (
                            <div key={day.key}>
                              <span>
                                {day.total > 0 ? money(day.total) : "٠"}
                              </span>
                              <div>
                                <i
                                  style={{
                                    height: `${Math.max((day.total / maxDay) * 100, 3)}%`,
                                  }}
                                />
                              </div>
                              <b>{day.label}</b>
                            </div>
                          ))}
                        </div>
                        {!paidOrders.length && (
                          <p className="chart-empty-note">
                            سيبدأ الرسم بالظهور مع أول طلب مكتمل.
                          </p>
                        )}
                      </section>
                      <section className="workspace-card service-feed">
                        <div className="workspace-card-head">
                          <h2>طلبات الخدمة</h2>
                          <Icon name="bell" size={18} />
                        </div>
                        {!services.length ? (
                          <EmptyState
                            icon="bell"
                            title="كل شيء هادئ الآن"
                            description="طلبات الخدمة والفاتورة من قائمة العميل تظهر هنا."
                          />
                        ) : (
                          services.slice(0, 5).map((service) => (
                            <div className="service-feed-row" key={service.id}>
                              <span>
                                <Icon
                                  name={
                                    service.kind === "bill" ? "receipt" : "bell"
                                  }
                                  size={18}
                                />
                              </span>
                              <div>
                                <b>
                                  {service.kind === "bill"
                                    ? "طلب الفاتورة"
                                    : "طلب مساعدة الفريق"}
                                </b>
                                <small>
                                  طاولة{" "}
                                  {service.tableNumber.toLocaleString("ar-SA")}{" "}
                                  ·{" "}
                                  {new Date(
                                    service.createdAt,
                                  ).toLocaleTimeString("ar-SA", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </small>
                              </div>
                            </div>
                          ))
                        )}
                      </section>
                    </div>
                    <section className="workspace-card recent-orders-card">
                      <div className="workspace-card-head">
                        <h2>آخر الطلبات</h2>
                        <button
                          type="button"
                          className="text-button"
                          onClick={() => navigate("orders")}
                        >
                          عرض الكل
                          <Icon name="arrow" size={15} />
                        </button>
                      </div>
                      {renderOrderTable(orders.slice(0, 5))}
                    </section>
                  </>
                )}
                {view === "orders" && (
                  <section className="workspace-card">
                    <div className="order-filters">
                      <label className="menu-search">
                        <Icon name="search" size={17} />
                        <input
                          type="search"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder="ابحث برقم الطلب أو الصنف..."
                          aria-label="البحث في الطلبات"
                        />
                      </label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        aria-label="تصفية الطلبات بحسب الحالة"
                      >
                        <option value="all">كل الحالات</option>
                        {Object.entries(statusLabels).map(([key, label]) => (
                          <option key={key} value={key}>
                            {label}
                          </option>
                        ))}
                      </select>
                      <span>
                        {filteredOrders.length.toLocaleString("ar-SA")} طلب
                      </span>
                      <Link href="/demo" className="button button-primary">
                        <Icon name="plus" size={16} />
                        طلب تجريبي جديد
                      </Link>
                    </div>
                    {renderOrderTable(filteredOrders)}
                  </section>
                )}
                {view === "kitchen" && (
                  <>
                    <div className="kds-board">
                      {["new", "preparing", "ready"].map((status, index) => (
                        <section
                          className={`kds-column kds-${status}`}
                          key={status}
                        >
                          <header>
                            <h2>
                              <span className={`stage-dot stage-${index}`} />
                              {statusLabels[status]}
                            </h2>
                            <span>
                              {orders
                                .filter((order) => order.status === status)
                                .length.toLocaleString("ar-SA")}
                            </span>
                          </header>
                          {orders
                            .filter((order) => order.status === status)
                            .map((order) => {
                              const minutes = Math.floor(
                                (Date.now() -
                                  new Date(order.createdAt).getTime()) /
                                  60000,
                              );
                              return (
                                <article
                                  key={order.id}
                                  className={`kds-ticket ${minutes >= 15 && status !== "ready" ? "overdue" : ""}`}
                                >
                                  <div>
                                    <b dir="ltr">#{orderNumber(order.id)}</b>
                                    <span>
                                      طاولة{" "}
                                      {order.tableNumber.toLocaleString(
                                        "ar-SA",
                                      )}
                                    </span>
                                  </div>
                                  <p className="kds-timer">
                                    <Icon name="clock" size={13} />
                                    {minutes < 1
                                      ? "وصل الآن"
                                      : `منذ ${minutes.toLocaleString("ar-SA")} دقيقة`}
                                    {minutes >= 15 && status !== "ready" && (
                                      <b>يحتاج انتباهك</b>
                                    )}
                                  </p>
                                  <ul>
                                    {order.items.map((item) => (
                                      <li key={item.id}>
                                        <span>
                                          {item.quantity.toLocaleString(
                                            "ar-SA",
                                          )}
                                        </span>
                                        {item.name}
                                      </li>
                                    ))}
                                  </ul>
                                  {order.note && (
                                    <p className="order-note">{order.note}</p>
                                  )}
                                  <button
                                    type="button"
                                    className="button full-width"
                                    disabled={!!busy}
                                    onClick={() => orderAction(order)}
                                  >
                                    {busy === order.id
                                      ? "جارٍ التحديث..."
                                      : actionLabels[status]}
                                    <Icon name="arrow" size={15} />
                                  </button>
                                </article>
                              );
                            })}
                          {!orders.some((order) => order.status === status) && (
                            <div className="kds-empty">
                              <Icon
                                name={
                                  index === 0
                                    ? "bag"
                                    : index === 1
                                      ? "chef"
                                      : "doubleCheck"
                                }
                                size={28}
                              />
                              <p>
                                لا توجد طلبات{" "}
                                {index === 0
                                  ? "جديدة"
                                  : index === 1
                                    ? "قيد التحضير"
                                    : "جاهزة"}
                                .
                              </p>
                            </div>
                          )}
                        </section>
                      ))}
                    </div>
                    <p className="form-note">
                      تظهر الطلبات المتأخرة لأكثر من ١٥ دقيقة بحد مرجاني. تحديث
                      الحالة محفوظ في قاعدة البيانات.
                    </p>
                  </>
                )}
                {view === "menu" && (
                  <div className="workspace-menu-grid">
                    {menuItems.map((item) => (
                      <article
                        className={`managed-menu-item ${company.disabledItems.includes(item.id) ? "unavailable" : ""}`}
                        key={item.id}
                      >
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={400}
                          height={250}
                        />
                        <div>
                          <span className="eyebrow">{item.category}</span>
                          <h2>{item.name}</h2>
                          <p>{item.description}</p>
                          <footer>
                            <strong>
                              {money(item.price)} <small>ر.س</small>
                            </strong>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={
                                !company.disabledItems.includes(item.id)
                              }
                              aria-label={`إتاحة ${item.name}`}
                              className={`availability-switch ${!company.disabledItems.includes(item.id) ? "on" : ""}`}
                              disabled={!!busy}
                              onClick={() => {
                                const next = company.disabledItems.includes(
                                  item.id,
                                )
                                  ? company.disabledItems.filter(
                                      (id) => id !== item.id,
                                    )
                                  : [...company.disabledItems, item.id];
                                void saveSettings(undefined, next);
                              }}
                            >
                              <span>
                                {company.disabledItems.includes(item.id)
                                  ? "غير متاح"
                                  : "متاح للطلب"}
                              </span>
                              <i>
                                <b />
                              </i>
                            </button>
                          </footer>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
                {view === "shifts" && (
                  <>
                    <div className="shift-hero-card">
                      <span className="icon-tile">
                        <Icon name="clock" size={32} />
                      </span>
                      <div>
                        <span
                          className={`status-badge ${activeShift ? "status-ready" : "status-cancelled"}`}
                        >
                          {activeShift ? "مناوبة نشطة" : "لا توجد مناوبة نشطة"}
                        </span>
                        <h2>
                          {activeShift
                            ? "كل ريال، في مكانه."
                            : "ابدأ يومك برصيد واضح."}
                        </h2>
                        <p>
                          {activeShift
                            ? `بدأت في ${new Date(activeShift.openedAt).toLocaleString("ar-SA")}`
                            : "لا يمكن تسجيل التحصيل قبل فتح مناوبة. يمكنك استقبال الطلبات وتحضيرها في أي وقت."}
                        </p>
                      </div>
                      <button
                        type="button"
                        className={`button ${activeShift ? "button-outline" : "button-primary"}`}
                        onClick={() => {
                          setModalError("");
                          setShiftModal(activeShift ? "close" : "open");
                        }}
                      >
                        {activeShift ? "إغلاق المناوبة" : "ابدأ مناوبة جديدة"}
                        <Icon name="arrow" size={17} />
                      </button>
                    </div>
                    {activeShift && (
                      <div className="shift-metrics">
                        <div>
                          <span>الرصيد الافتتاحي</span>
                          <strong>
                            {money(activeShift.openingAmount)}{" "}
                            <small>ر.س</small>
                          </strong>
                        </div>
                        <div>
                          <span>التحصيل النقدي التجريبي</span>
                          <strong>
                            {money(activeCash)} <small>ر.س</small>
                          </strong>
                        </div>
                        <div>
                          <span>المتوقع في الصندوق</span>
                          <strong>
                            {money(activeShift.openingAmount + activeCash)}{" "}
                            <small>ر.س</small>
                          </strong>
                        </div>
                      </div>
                    )}
                    <section className="workspace-card">
                      <div className="workspace-card-head">
                        <h2>سجل المناوبات</h2>
                        <span className="subtle-label">
                          مراجعة شفافة لكل إغلاق
                        </span>
                      </div>
                      <div className="table-scroll">
                        <table className="orders-table">
                          <thead>
                            <tr>
                              <th>بدء المناوبة</th>
                              <th>الحالة</th>
                              <th>رصيد البداية</th>
                              <th>المتوقع عند الإغلاق</th>
                              <th>العدّ الفعلي</th>
                              <th>الفرق النقدي</th>
                            </tr>
                          </thead>
                          <tbody>
                            {shifts.map((shift) => (
                              <tr key={shift.id}>
                                <td>
                                  {new Date(shift.openedAt).toLocaleString(
                                    "ar-SA",
                                    {
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    },
                                  )}
                                </td>
                                <td>
                                  <span
                                    className={`status-badge status-${shift.closedAt ? "paid" : "preparing"}`}
                                  >
                                    {shift.closedAt ? "مغلقة" : "نشطة"}
                                  </span>
                                </td>
                                <td>{money(shift.openingAmount)} ر.س</td>
                                <td>
                                  {shift.expectedAmount !== null
                                    ? `${money(shift.expectedAmount)} ر.س`
                                    : "—"}
                                </td>
                                <td>
                                  {shift.closingAmount !== null
                                    ? `${money(shift.closingAmount)} ر.س`
                                    : "—"}
                                </td>
                                <td>
                                  <b
                                    className={
                                      shift.closedAt &&
                                      shift.closingAmount !==
                                        shift.expectedAmount
                                        ? "coral-text"
                                        : "teal-text"
                                    }
                                  >
                                    {shift.closedAt
                                      ? `${money((shift.closingAmount || 0) - (shift.expectedAmount || 0))} ر.س`
                                      : "—"}
                                  </b>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {!shifts.length && (
                          <EmptyState
                            icon="clock"
                            title="أول مناوبة، بداية أوضح."
                            description="سيظهر سجل المناوبات هنا بمجرد بدء مناوبتك الأولى."
                          />
                        )}
                      </div>
                    </section>
                  </>
                )}
                {view === "invoices" && (
                  <section className="workspace-card">
                    <div className="workspace-card-head">
                      <h2>
                        الطلبات المكتملة{" "}
                        <span className="subtle-label">
                          {paidOrders.length.toLocaleString("ar-SA")}
                        </span>
                      </h2>
                      <button
                        type="button"
                        className="button button-outline"
                        disabled={!paidOrders.length}
                        onClick={() => exportData("csv", paidOrders)}
                      >
                        <Icon name="download" size={16} />
                        تصدير الملخص
                      </button>
                    </div>
                    {renderOrderTable(paidOrders, true)}
                    <p className="table-footnote">
                      <Icon name="lock" size={14} />
                      لا يمكن تعديل الطلب بعد إغلاقه. إجمالي الضريبة التوضيحي:{" "}
                      {money(
                        paidOrders.reduce(
                          (sum, order) =>
                            sum + Math.round((order.total * 15) / 115),
                          0,
                        ),
                      )}{" "}
                      ر.س.
                    </p>
                  </section>
                )}
                {view === "reports" && (
                  <>
                    <section className="workspace-card">
                      <div className="report-filters">
                        <label>
                          من تاريخ
                          <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            max={toDate || undefined}
                          />
                        </label>
                        <label>
                          إلى تاريخ
                          <input
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            min={fromDate || undefined}
                          />
                        </label>
                        <button
                          type="button"
                          className="text-button"
                          onClick={() => {
                            setFromDate("");
                            setToDate("");
                          }}
                        >
                          كل الفترات
                        </button>
                        <div>
                          <button
                            type="button"
                            className="button button-outline"
                            onClick={() => exportData("csv")}
                            disabled={!reportOrders.length}
                          >
                            <Icon name="download" size={16} />
                            CSV
                          </button>
                          <button
                            type="button"
                            className="button button-primary"
                            title="تصدير بصيغة Excel XML"
                            onClick={() => exportData("excel")}
                            disabled={!reportOrders.length}
                          >
                            <Icon name="download" size={16} />
                            Excel
                          </button>
                        </div>
                      </div>
                      <div className="report-summary">
                        <div>
                          <span>إجمالي الفترة</span>
                          <strong>
                            {money(reportTotal)} <small>ر.س</small>
                          </strong>
                        </div>
                        <div>
                          <span>طلبات مكتملة</span>
                          <strong>
                            {reportOrders.length.toLocaleString("ar-SA")}
                          </strong>
                        </div>
                        <div>
                          <span>ضريبة ١٥٪ (توضيحي)</span>
                          <strong>
                            {money(
                              reportOrders.reduce(
                                (sum, order) =>
                                  sum + Math.round((order.total * 15) / 115),
                                0,
                              ),
                            )}{" "}
                            <small>ر.س</small>
                          </strong>
                        </div>
                      </div>
                      {renderOrderTable(reportOrders, true)}
                    </section>
                    <p className="form-note">
                      يشمل التقرير آخر ١٠٠ طلب محفوظ. ملف Excel يُصدّر بصيغة
                      SpreadsheetML المتوافقة مع Excel؛ وملف CSV يدعم العربية
                      بترميز UTF-8.
                    </p>
                  </>
                )}
                {view === "settings" && (
                  <>
                    <form
                      onSubmit={(event) => void saveSettings(event)}
                      className="workspace-card settings-card"
                    >
                      <div className="workspace-card-head">
                        <h2>بيانات المطعم</h2>
                        <Icon name="store" size={22} />
                      </div>
                      <div className="form-grid">
                        <label>
                          اسم المطعم
                          <input
                            value={draft.name}
                            onChange={(e) =>
                              setDraft({ ...draft, name: e.target.value })
                            }
                            minLength={2}
                            maxLength={120}
                            required
                          />
                        </label>
                        <label>
                          اسم مدير الشركة
                          <input
                            value={draft.ownerName}
                            onChange={(e) =>
                              setDraft({ ...draft, ownerName: e.target.value })
                            }
                            minLength={2}
                            maxLength={100}
                            required
                          />
                        </label>
                        <label>
                          رقم الجوال
                          <input
                            type="tel"
                            dir="ltr"
                            value={draft.phone}
                            onChange={(e) =>
                              setDraft({ ...draft, phone: e.target.value })
                            }
                            minLength={8}
                            maxLength={22}
                            required
                          />
                        </label>
                        <label>
                          عدد الفروع
                          <span className="select-wrap">
                            <select
                              value={draft.branchCount}
                              onChange={(e) =>
                                setDraft({
                                  ...draft,
                                  branchCount: e.target.value,
                                })
                              }
                            >
                              <option value="1">فرع واحد</option>
                              <option value="2-5">
                                من فرعين إلى خمسة فروع
                              </option>
                              <option value="5+">أكثر من خمسة فروع</option>
                            </select>
                            <Icon name="down" size={16} />
                          </span>
                        </label>
                        <label className="full-width">
                          البريد الإلكتروني
                          <input
                            type="email"
                            value={company.email}
                            disabled
                            dir="ltr"
                          />
                          <small>
                            البريد مرتبط بحساب الدخول، ولا يمكن تغييره من هذه
                            التجربة.
                          </small>
                        </label>
                      </div>
                      <div className="settings-actions">
                        <button
                          type="submit"
                          className="button button-primary"
                          disabled={!!busy}
                        >
                          {busy === "settings"
                            ? "جارٍ الحفظ..."
                            : "احفظ التغييرات"}
                          <Icon
                            name={busy === "settings" ? "loading" : "check"}
                            className={busy === "settings" ? "spin" : ""}
                            size={17}
                          />
                        </button>
                        <button
                          type="button"
                          className="button button-outline"
                          onClick={() =>
                            setDraft({
                              name: company.name,
                              ownerName: company.ownerName,
                              phone: company.phone,
                              branchCount: company.branchCount,
                            })
                          }
                        >
                          تراجع عن التعديلات
                        </button>
                      </div>
                    </form>
                    <section className="workspace-card settings-privacy">
                      <span className="icon-tile">
                        <Icon name="shield" size={26} />
                      </span>
                      <div>
                        <h2>مساحتك مستقلة. وبياناتك تخصك.</h2>
                        <p>
                          التجربة مستمرة حتى{" "}
                          {new Date(company.trialEndsAt).toLocaleDateString(
                            "ar-SA",
                            { dateStyle: "long" },
                          )}
                          . لا تُطلب بطاقة ولا يحدث تجديد مدفوع تلقائيًا.
                        </p>
                        <Link className="text-button" href="/legal/privacy">
                          اقرأ سياسة الخصوصية
                          <Icon name="arrow" size={14} />
                        </Link>
                      </div>
                    </section>
                    <section className="workspace-danger">
                      <div>
                        <h2>حذف مساحة التجربة</h2>
                        <p>
                          يحذف حساب المطعم والطلبات والمناوبات المرتبطة به
                          نهائيًا.
                        </p>
                      </div>
                      <button
                        type="button"
                        className="button button-outline"
                        onClick={() => {
                          setModalError("");
                          setDeleteModal(true);
                        }}
                      >
                        حذف المساحة
                      </button>
                    </section>
                  </>
                )}
              </>
            )}
            <footer className="workspace-footer">
              <span>
                <Icon name="shield" size={13} />
                بيانات معزولة لحساب مطعمك
              </span>
              <p>Qira · تجربة تشغيل أوضح.</p>
              <Link href="/">
                الموقع الرئيسي
                <Icon name="arrow" size={13} />
              </Link>
            </footer>
          </main>
        </div>
        <AnimatePresence>
          {toast && (
            <motion.div
              className="toast"
              role="status"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Icon name="success" size={20} />
              {toast}
              <button
                type="button"
                onClick={() => setToast("")}
                aria-label="إغلاق التنبيه"
              >
                <Icon name="close" size={15} />
              </button>
            </motion.div>
          )}
          {shiftModal && (
            <Modal
              title={
                shiftModal === "open"
                  ? "بداية واضحة لمناوبتك"
                  : "لنغلق المناوبة بوضوح"
              }
              onClose={() => {
                if (!busy) setShiftModal(null);
              }}
            >
              <form onSubmit={submitShift}>
                <p className="auth-intro">
                  {shiftModal === "open"
                    ? "أدخل الرصيد النقدي الافتتاحي. جميع عمليات هذه المساحة تجريبية دون تحصيل حقيقي."
                    : `الرصيد المتوقع: ${money((activeShift?.openingAmount || 0) + activeCash)} ر.س. أدخل الرصيد الذي عددته لمراجعة الفرق تلقائيًا.`}
                </p>
                <div className="form-grid">
                  <label className="full-width">
                    {shiftModal === "open"
                      ? "الرصيد الافتتاحي"
                      : "الرصيد النقدي عند الإغلاق"}{" "}
                    — ر.س
                    <input
                      name="amount"
                      type="number"
                      inputMode="decimal"
                      min="0"
                      max="1000000"
                      step="0.01"
                      placeholder="0.00"
                      required
                    />
                  </label>
                </div>
                {modalError && (
                  <p className="form-error" role="alert">
                    {modalError}
                  </p>
                )}
                <button
                  type="submit"
                  className="button button-primary full-width modal-submit"
                  disabled={!!busy}
                >
                  {busy
                    ? "جارٍ الحفظ..."
                    : shiftModal === "open"
                      ? "ابدأ المناوبة"
                      : "أغلق المناوبة واحسب الفرق"}
                  <Icon name="check" size={17} />
                </button>
              </form>
            </Modal>
          )}
          {paymentOrder && (
            <Modal
              title="تسجيل تحصيل تجريبي"
              onClose={() => {
                if (!busy) setPaymentOrder(null);
              }}
            >
              <p className="auth-intro">
                طلب #{orderNumber(paymentOrder.id)} · لا يتم الاتصال بأي بوابة
                دفع أو تحصيل أموال.
              </p>
              <div className="payment-amount">
                <span>الإجمالي</span>
                <strong>
                  {money(paymentOrder.total)} <small>ر.س</small>
                </strong>
              </div>
              {!activeShift ? (
                <div className="app-alert error">
                  <Icon name="alert" size={18} />
                  <div>
                    <p>افتح مناوبة أولًا لتتمكن من تسجيل التحصيل.</p>
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => {
                        setPaymentOrder(null);
                        navigate("shifts");
                        setModalError("");
                        setShiftModal("open");
                      }}
                    >
                      ابدأ مناوبة الآن
                      <Icon name="arrow" size={15} />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="payment-methods">
                    {["cash", "card", "electronic"].map((method) => (
                      <button
                        type="button"
                        key={method}
                        aria-pressed={paymentMethod === method}
                        className={paymentMethod === method ? "selected" : ""}
                        onClick={() => setPaymentMethod(method)}
                      >
                        <Icon
                          name={
                            method === "cash"
                              ? "cash"
                              : method === "card"
                                ? "card"
                                : "wallet"
                          }
                          size={26}
                        />
                        <span>{paymentLabels[method]}</span>
                        {paymentMethod === method && (
                          <Icon name="check" size={13} />
                        )}
                      </button>
                    ))}
                  </div>
                  {modalError && (
                    <p className="form-error" role="alert">
                      {modalError}
                    </p>
                  )}
                  <button
                    className="button button-primary full-width"
                    type="button"
                    disabled={!!busy}
                    onClick={() =>
                      updateOrder(paymentOrder, "paid", paymentMethod)
                    }
                  >
                    {busy ? "جارٍ التسجيل..." : "أكّد التحصيل التجريبي"}
                    <Icon name="check" size={17} />
                  </button>
                  <p className="form-note">
                    بعد التأكيد، يُغلق الطلب ولا يمكن تعديله. تُحسب العمليات
                    النقدية وحدها في رصيد الصندوق.
                  </p>
                </>
              )}
            </Modal>
          )}
          {cancelOrder && (
            <Modal
              title="هل تريد إلغاء هذا الطلب؟"
              onClose={() => {
                if (!busy) setCancelOrder(null);
              }}
            >
              <p className="auth-intro">
                طلب #{orderNumber(cancelOrder.id)} بقيمة{" "}
                {money(cancelOrder.total)} ر.س. سيتوقف ظهوره في المطبخ، ويظل
                محفوظًا بحالة «ملغي».
              </p>
              {modalError && (
                <p className="form-error" role="alert">
                  {modalError}
                </p>
              )}
              <div className="confirmation-actions">
                <button
                  type="button"
                  className="button button-outline"
                  onClick={() => setCancelOrder(null)}
                  disabled={!!busy}
                >
                  احتفظ بالطلب
                </button>
                <button
                  type="button"
                  className="button button-primary"
                  disabled={!!busy}
                  onClick={() => updateOrder(cancelOrder, "cancelled")}
                >
                  {busy ? "جارٍ الإلغاء..." : "نعم، ألغِ الطلب"}
                  <Icon name="close" size={16} />
                </button>
              </div>
            </Modal>
          )}
          {deleteModal && (
            <Modal
              title="حذف مساحة التجربة نهائيًا"
              onClose={() => {
                if (!busy) setDeleteModal(false);
              }}
            >
              <form onSubmit={deleteWorkspace}>
                <p className="auth-intro">
                  سيُحذف حساب المطعم وطلباته ومناوباته. لا يمكن التراجع. طلبات
                  التواصل السابقة تخضع لسياسة الاحتفاظ المستقلة.
                </p>
                <div className="form-grid">
                  <label className="full-width">
                    للتأكيد، اكتب اسم مطعمك: {company.name}
                    <input
                      name="confirmation"
                      required
                      maxLength={120}
                      autoComplete="off"
                      placeholder="اسم المطعم كاملًا"
                    />
                  </label>
                </div>
                {modalError && (
                  <p className="form-error" role="alert">
                    {modalError}
                  </p>
                )}
                <button
                  type="submit"
                  className="button button-primary full-width modal-submit"
                  disabled={!!busy}
                >
                  {busy ? "جارٍ الحذف..." : "احذف المساحة وبيانات التشغيل"}
                  <Icon name="close" size={17} />
                </button>
              </form>
            </Modal>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
