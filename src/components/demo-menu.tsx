"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { menuItems, money } from "@/lib/site";
import { type ClientOrder, orderNumber, statusLabels, nextStatus, actionLabels } from "@/lib/types";
import { EmptyState, Icon, Logo, Modal } from "./ui";

const categories = ["الكل", "الأطباق الرئيسية", "المقبلات", "المشروبات"];
export default function DemoMenu({ companyName, disabledItems }: { companyName: string | null; disabledItems: string[] }) {
  const [tab, setTab] = useState("menu");
  const [category, setCategory] = useState("الكل");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [hydrated, setHydrated] = useState(false);
  const [note, setNote] = useState("");
  const [orders, setOrders] = useState<ClientOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [product, setProduct] = useState<typeof menuItems[number] | null>(null);
  const [receipt, setReceipt] = useState<ClientOrder | null>(null);
  const [loyaltyCalc, setLoyaltyCalc] = useState(200);
  const requestKey = useRef<string | null>(null);
  const available = menuItems.filter(item => !disabledItems.includes(item.id));
  const cartItems = available.filter(item => cart[item.id] > 0);
  const total = cartItems.reduce((sum, item) => sum + item.price * cart[item.id], 0);
  const count = cartItems.reduce((sum, item) => sum + cart[item.id], 0);
  const storageKey = `sufra-cart-${companyName || "public"}`;
  const fetchOrders = useCallback(async () => {
    try {
      const response = await fetch("/api/orders", { cache: "no-store" });
      if (!response.ok) throw new Error("تعذر تحديث طلباتك. حاول مجددًا.");
      const data = await response.json(); setOrders(data.orders || []);
    } catch (err) { setError(err instanceof Error ? err.message : "تعذر تحميل الطلبات."); }
    finally { setLoadingOrders(false); }
  }, []);
  useEffect(() => {
    try { const saved = JSON.parse(localStorage.getItem(storageKey) || "{}"); const clean: Record<string, number> = {}; menuItems.forEach(item => { if (Number.isInteger(saved[item.id]) && saved[item.id] > 0 && saved[item.id] <= 20 && !disabledItems.includes(item.id)) clean[item.id] = saved[item.id]; }); setCart(clean); } catch { /* An invalid local cart is safely reset. */ }
    setHydrated(true);
  }, [storageKey, disabledItems]);
  useEffect(() => { if (hydrated) localStorage.setItem(storageKey, JSON.stringify(cart)); }, [cart, hydrated, storageKey]);
  useEffect(() => { void fetchOrders(); const interval = setInterval(() => { if (!document.hidden) void fetchOrders(); }, 7000); return () => clearInterval(interval); }, [fetchOrders]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(""), 4200); return () => clearTimeout(timer); }, [toast]);
  function changeQuantity(id: string, delta: number) {
    if (busy === "checkout") return;
    if (disabledItems.includes(id)) { setError("هذا الصنف غير متاح حاليًا."); return; }
    setCart(current => ({ ...current, [id]: Math.max(0, Math.min(20, (current[id] || 0) + delta)) }));
    requestKey.current = null; setError("");
  }
  async function checkout() {
    if (!count || busy) return;
    setBusy("checkout"); setError("");
    requestKey.current ||= crypto.randomUUID();
    try {
      const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requestKey: requestKey.current, items: cartItems.map(item => ({ id: item.id, quantity: cart[item.id] })), note }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error);
      setOrders(current => [data.order, ...current.filter(order => order.id !== data.order.id)]);
      setCart({}); setNote(""); requestKey.current = null; setCartOpen(false); setTab("orders"); setToast("وصل طلبك التجريبي. يمكنك متابعة رحلته الآن.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) { setError(err instanceof Error ? err.message : "تعذر الاتصال. سلتك محفوظة، حاول مجددًا."); }
    finally { setBusy(""); }
  }
  async function advanceOrder(order: ClientOrder, target: string) {
    if (busy) return; setBusy(order.id); setError("");
    try {
      const response = await fetch("/api/orders", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: order.id, status: target, paymentMethod: "cash" }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error);
      setOrders(current => current.map(o => o.id === data.order.id ? data.order : o));
      setToast(target === "cancelled" ? "تم إلغاء الطلب التجريبي." : `تم تحديث الطلب: ${statusLabels[target]}`);
    } catch (err) { setError(err instanceof Error ? err.message : "تعذر تحديث الطلب."); await fetchOrders(); }
    finally { setBusy(""); }
  }
  async function requestService(kind: "service" | "bill") {
    if (busy) return; setBusy(kind); setError("");
    try {
      const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "service", kind }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error);
      setToast(kind === "service" ? "تم حفظ طلب الخدمة التجريبي للطاولة ٠٨." : "تم حفظ طلب الفاتورة. راجع طلباتك أدناه.");
      if (kind === "bill") setTab("orders");
    } catch (err) { setError(err instanceof Error ? err.message : "تعذر إرسال طلب الخدمة."); }
    finally { setBusy(""); }
  }
  function downloadReceipt(order: ClientOrder) {
    const tax = Math.round(order.total * 15 / 115);
    const text = [`Qira — مستند تجربة، ليس فاتورة ضريبية`, companyName || "مطعم Qira التجريبي", `رقم الطلب: ${orderNumber(order.id)}`, `التاريخ: ${new Date(order.createdAt).toLocaleString("ar-SA")}`, "--------------------------", ...order.items.map(item => `${item.name} × ${item.quantity} — ${money(item.price * item.quantity)} ر.س`), "--------------------------", `قبل الضريبة (توضيحي): ${money(order.total - tax)} ر.س`, `ضريبة ١٥٪ (توضيحي): ${money(tax)} ر.س`, `الإجمالي: ${money(order.total)} ر.س`, "لا يمثل هذا المستند تحصيلًا ماليًا أو إرسالًا إلى زاتكا."].join("\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF", text], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = `sufra-demo-${orderNumber(order.id)}.txt`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const points = Math.floor(orders.filter(order => order.status === "paid").reduce((sum, order) => sum + order.total, 0) / 100);
  const shownProducts = available.filter(item => (category === "الكل" || item.category === category) && `${item.name} ${item.description}`.includes(search.trim()));
  const cartContent = <><div className="cart-title"><h2>طلبك، على ذوقك.</h2><span>{count.toLocaleString("ar-SA")} أصناف</span></div>{!count ? <EmptyState icon="bag" title="ماذا تشتهي اليوم؟" description="أضف طبقك المفضل، وسنجمع تفاصيل طلبك هنا." /> : <><div className="cart-lines">{cartItems.map(item => <div className="cart-line" key={item.id}><img src={item.image} alt={item.name} width={51} height={51} /><div><h3>{item.name}</h3><span>{money(item.price)} ر.س</span><div className="quantity-control"><button type="button" aria-label={`تقليل ${item.name}`} onClick={() => changeQuantity(item.id, -1)} disabled={busy === "checkout"}><Icon name="minus" size={13} /></button><b>{cart[item.id].toLocaleString("ar-SA")}</b><button type="button" aria-label={`زيادة ${item.name}`} onClick={() => changeQuantity(item.id, 1)} disabled={cart[item.id] >= 20 || busy === "checkout"}><Icon name="plus" size={13} /></button></div></div><strong>{money(item.price * cart[item.id])}<small>ر.س</small></strong></div>)}</div><label className="cart-note">تفصيلة تحب نعرفها؟ <small>اختياري</small><textarea value={note} onChange={e => setNote(e.target.value)} maxLength={500} placeholder="مثلًا: بدون بصل، أو أي ملاحظة للطلب..." rows={2} disabled={busy === "checkout"} /></label><div className="cart-totals"><span>المجموع قبل الضريبة<b>{money(total - Math.round(total * 15 / 115))} ر.س</b></span><span>ضريبة القيمة المضافة ١٥٪<b>{money(Math.round(total * 15 / 115))} ر.س</b></span><div>الإجمالي <strong>{money(total)} <small>ر.س</small></strong></div></div>{error && cartOpen && <p className="form-error" role="alert">{error}</p>}<button type="button" className="button button-primary full-width" onClick={checkout} disabled={!!busy}>{busy === "checkout" ? "جارٍ إرسال طلبك..." : "أرسل الطلب التجريبي"}<Icon name={busy === "checkout" ? "loading" : "arrow"} className={busy === "checkout" ? "spin" : ""} size={18} /></button><p className="form-note"><Icon name="shield" size={12} />لا تُحصّل مبالغ. هذا طلب تجريبي محفوظ في جلستك.</p></>}</>;

  return <MotionConfig reducedMotion="user"><div className="demo-shell"><div className="demo-notice"><Icon name="sparkles" size={14} /><span>أنت في قائمة تجريبية. استكشف بحرية، لا تُنفّذ طلبات أو مدفوعات حقيقية.</span><Link href={companyName ? "/dashboard" : "/"}>{companyName ? "لوحة مطعمك" : "العودة إلى Qira"}<Icon name="arrow" size={13} /></Link></div><header className="demo-topbar container"><Logo compact /><div className="table-badge"><Icon name="qr" size={20} /><span>أهلًا في طاولتك<b>طاولة ٠٨</b></span><span className="live-dot" /></div><div className="demo-service-actions"><button type="button" onClick={() => requestService("service")} disabled={!!busy}><Icon name="bell" size={19} /><span>اطلب الخدمة</span></button><button type="button" onClick={() => requestService("bill")} disabled={!!busy || !orders.length}><Icon name="receipt" size={19} /><span>اطلب الفاتورة</span></button></div></header>
    <main className="container demo-main"><section className="menu-welcome"><div><span className="eyebrow"><span />{companyName || "مطبخ Qira التجريبي"}</span><h1>أوقات ألذّ.<br /><span>وتفاصيل على ذوقك.</span></h1><p>أهلًا بك. خذ وقتك، واختر ما تحب.<br />كل طبق هنا، بداية للحظة تستمتع بها.</p><span className="menu-open"><span className="live-dot" />قائمة تفاعلية · أسعار شاملة الضريبة</span></div><img src="/images/burger.jpg" alt="برجر طازج من قائمة Qira" width={600} height={350} /><span className="menu-hero-sticker"><Icon name="utensils" size={25} />صُنع بشغف.<br />يُقدّم بحب.</span></section><nav className="menu-page-tabs" aria-label="تجربة العميل">{[{ id: "menu", label: "قائمة الطعام", icon: "utensils" }, { id: "orders", label: "طلباتي وفواتيري", icon: "receipt" }, { id: "loyalty", label: "نقاط الولاء", icon: "gift" }].map(item => <button key={item.id} type="button" aria-pressed={tab === item.id} className={tab === item.id ? "active" : ""} onClick={() => setTab(item.id)}><Icon name={item.icon} size={18} />{item.label}{item.id === "orders" && orders.length > 0 && <span>{orders.length}</span>}</button>)}</nav>
    {error && <div className="app-alert error" role="alert"><Icon name="alert" size={18} /><span>{error}</span><button type="button" onClick={() => { setError(""); void fetchOrders(); }}><Icon name="reset" size={16} />حاول مجددًا</button></div>}
    {tab === "menu" && <div className="menu-layout"><section className="menu-products"><div className="menu-toolbar"><div className="category-tabs" aria-label="تصنيفات الأطباق">{categories.map(cat => <button key={cat} onClick={() => setCategory(cat)} type="button" aria-pressed={category === cat} className={category === cat ? "active" : ""}>{cat}</button>)}</div><label className="menu-search"><Icon name="search" size={17} /><input value={search} onChange={e => setSearch(e.target.value)} type="search" placeholder="ابحث عن طبقك..." aria-label="ابحث في قائمة الطعام" /></label></div><div className="food-grid">{shownProducts.map(item => <motion.article layout key={item.id} className="food-card"><button className="food-image-button" type="button" onClick={() => setProduct(item)} aria-label={`تفاصيل ${item.name}`}><img src={item.image} alt={item.name} width={450} height={280} /><span className="food-badge"><Icon name="sparkles" size={12} />{item.badge}</span></button><div className="food-card-body"><button className="food-name" type="button" onClick={() => setProduct(item)}><h2>{item.name}</h2></button><p>{item.description}</p><div className="food-card-bottom"><strong>{money(item.price)}<small>ر.س</small></strong>{cart[item.id] ? <div className="quantity-control"><button type="button" aria-label={`تقليل ${item.name}`} onClick={() => changeQuantity(item.id, -1)}><Icon name="minus" size={15} /></button><b>{cart[item.id].toLocaleString("ar-SA")}</b><button type="button" aria-label={`زيادة ${item.name}`} onClick={() => changeQuantity(item.id, 1)} disabled={cart[item.id] >= 20}><Icon name="plus" size={15} /></button></div> : <button className="add-food-button" type="button" onClick={() => changeQuantity(item.id, 1)} aria-label={`إضافة ${item.name}`}><Icon name="plus" size={20} /></button>}</div></div></motion.article>)}</div>{!shownProducts.length && <EmptyState icon="search" title="لم نجد هذا الطبق" description="جرّب كلمة أخرى أو عد إلى جميع الأطباق."><button className="button button-outline" type="button" onClick={() => { setSearch(""); setCategory("الكل"); }}>اعرض كل الأطباق<Icon name="reset" size={16} /></button></EmptyState>}<p className="menu-allergy-note"><Icon name="help" size={17} />لديك حساسية غذائية؟ تواصل مع فريق المطعم قبل تأكيد أي طلب حقيقي.</p></section><aside className="cart-panel">{cartContent}</aside></div>}
    {tab === "orders" && <section className="customer-orders"><div className="view-heading"><div><span className="eyebrow">كل التفاصيل محفوظة</span><h2>رحلة طلبك، لحظة بلحظة.</h2></div><button className="button button-outline" type="button" onClick={fetchOrders}><Icon name="reset" size={15} />تحديث الطلبات</button></div>{loadingOrders ? <div className="loading-state" role="status"><Icon name="loading" className="spin" />نحمّل طلباتك...</div> : !orders.length ? <EmptyState title="أول طلب، ينتظرك." description="كل ما تطلبه في هذه الجلسة سيظهر هنا، مع حالته وفاتورته التجريبية."><button type="button" className="button button-primary" onClick={() => setTab("menu")}>اكتشف قائمة الطعام<Icon name="arrow" size={16} /></button></EmptyState> : <><p className="simulation-note"><Icon name="help" size={16} />في التجربة يمكنك محاكاة انتقال الطلب بين مراحله. {companyName && <>التحصيل يتطلب مناوبة نشطة في <Link href="/dashboard">لوحة مطعمك</Link>.</>}</p><div className="customer-order-grid">{orders.map(order => <article className="customer-order-card" key={order.id}><header><span><Icon name="receipt" size={20} /><b dir="ltr">#{orderNumber(order.id)}</b></span><span className={`status-badge status-${order.status}`}>{statusLabels[order.status]}</span></header><p className="order-meta">طاولة {order.tableNumber.toLocaleString("ar-SA")} · {new Date(order.createdAt).toLocaleString("ar-SA", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p><ul>{order.items.map(item => <li key={item.id}><span>{item.quantity.toLocaleString("ar-SA")} × {item.name}</span><b>{money(item.price * item.quantity)} ر.س</b></li>)}</ul>{order.note && <p className="order-note"><Icon name="message" size={13} />{order.note}</p>}<div className="order-progress">{["new", "preparing", "ready", "paid"].map((status, index) => <span key={status} className={["new", "preparing", "ready", "paid"].indexOf(order.status) >= index ? "done" : ""}><i><Icon name={status === "paid" ? "check" : ["bag", "chef", "bell"][index]} size={13} /></i><small>{statusLabels[status]}</small></span>)}</div><div className="order-card-total"><span>الإجمالي</span><strong>{money(order.total)} <small>ر.س</small></strong></div><div className="order-actions">{nextStatus[order.status] && <button type="button" className="button button-primary" disabled={!!busy} onClick={() => advanceOrder(order, nextStatus[order.status])}>{busy === order.id ? "جارٍ التحديث..." : actionLabels[order.status]}<Icon name="arrow" size={15} /></button>}{order.status === "new" && <button type="button" className="button button-outline" disabled={!!busy} onClick={() => { if (window.confirm("هل تريد إلغاء هذا الطلب التجريبي؟")) void advanceOrder(order, "cancelled"); }}>إلغاء الطلب</button>}{order.status === "paid" && <button type="button" className="button button-outline" onClick={() => setReceipt(order)}><Icon name="receipt" size={16} />عرض المستند التجريبي</button>}</div></article>)}</div></>}</section>}
    {tab === "loyalty" && <section className="loyalty-page"><div className="loyalty-balance"><span className="icon-tile"><Icon name="gift" size={34} /></span><span className="eyebrow">كل زيارة، فرصة للعودة.</span><h2>رصيد جلستك التجريبي</h2><strong>{points.toLocaleString("ar-SA")}<small>نقطة</small></strong><p>نموذج توضيحي: ريال واحد من الطلبات المكتملة يساوي نقطة. النقاط ليست رصيدًا ماليًا حقيقيًا، وتبقى ضمن جلسة التجربة.</p><button type="button" className="button button-primary" onClick={() => setTab("menu")}>ابدأ بطلب تحبه<Icon name="arrow" size={17} /></button></div><div className="loyalty-calculator"><span className="eyebrow">برنامجك. قواعدك.</span><h3>جرّب حاسبة المكافآت</h3><p>يمكن للمطعم تخصيص قواعد برنامجه. إليك مثالًا تفاعليًا: كل ١٠٠ نقطة تقابل خصمًا قدره ٥ ريالات.</p><label htmlFor="loyalty-range">عدد النقاط <b>{loyaltyCalc.toLocaleString("ar-SA")}</b></label><input id="loyalty-range" type="range" min="100" max="1000" step="100" value={loyaltyCalc} onChange={e => setLoyaltyCalc(Number(e.target.value))} /><div className="loyalty-result"><Icon name="ticket" size={30} /><span>قيمة الخصم في هذا المثال<strong>{(loyaltyCalc / 100 * 5).toLocaleString("ar-SA")} <small>ر.س</small></strong></span></div><p className="form-note">حاسبة توضيحية فقط، لا تطبّق خصمًا على الطلب. تفعيل الولاء والتحقق برقم الجوال من إضافات المنصة عند الربط الفعلي.</p></div></section>}
    <footer className="menu-footer"><Logo compact /><p>تجربة مطعمك، بكل بساطة.</p><Link href="/">تعرّف على Qira<Icon name="arrow" size={15} /></Link></footer></main>
    {count > 0 && tab === "menu" && <button type="button" className="mobile-cart-button" onClick={() => setCartOpen(true)}><span><Icon name="bag" size={19} /><b>{count.toLocaleString("ar-SA")}</b>عرض طلبي</span><strong>{money(total)} ر.س<Icon name="arrow" size={17} /></strong></button>}
    <AnimatePresence>{toast && <motion.div className="toast" role="status" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }}><Icon name="success" size={20} />{toast}<button type="button" aria-label="إغلاق التنبيه" onClick={() => setToast("")}><Icon name="close" size={15} /></button></motion.div>}{cartOpen && <Modal title="سلتك جاهزة؟" onClose={() => setCartOpen(false)}><div className="mobile-cart-content">{cartContent}</div></Modal>}{product && <Modal title={product.name} onClose={() => setProduct(null)}><div className="product-detail"><img src={product.image} alt={product.name} width={560} height={330} /><span className="eyebrow">{product.category} · {product.badge}</span><p>{product.description}</p><div><strong>{money(product.price)} <small>ر.س</small></strong><span>شامل ضريبة القيمة المضافة</span></div><button type="button" className="button button-primary full-width" onClick={() => { changeQuantity(product.id, 1); setProduct(null); setToast("أضفنا اختيارك إلى السلة."); }}>أضف إلى طلبي<Icon name="plus" size={17} /></button></div></Modal>}{receipt && <Modal title="تفاصيل المستند التجريبي" onClose={() => setReceipt(null)}><div className="receipt-sheet"><Logo compact /><p>ليس فاتورة ضريبية — لا توجد دفعة فعلية</p><h3>{companyName || "مطعم Qira التجريبي"}</h3><span dir="ltr">#{orderNumber(receipt.id)}</span><div className="receipt-items">{receipt.items.map(item => <div key={item.id}><span>{item.name} × {item.quantity.toLocaleString("ar-SA")}</span><b>{money(item.price * item.quantity)} ر.س</b></div>)}</div><div className="receipt-sum"><span>الإجمالي</span><strong>{money(receipt.total)} ر.س</strong></div><div className="receipt-tax"><span>ضريبة ١٥٪ ضمن الإجمالي (توضيحي)</span><b>{money(Math.round(receipt.total * 15 / 115))} ر.س</b></div><p className="form-note">مستند تجربة غير مرسل إلى زاتكا، ولا يثبت أي تحصيل فعلي.</p><button className="button button-primary full-width" type="button" onClick={() => downloadReceipt(receipt)}>تنزيل المستند التجريبي<Icon name="download" size={17} /></button></div></Modal>}</AnimatePresence>
  </div></MotionConfig>;
}
