"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowUpLeft,
  ArrowUpRight,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  X,
  Menu,
  Play,
  QrCode,
  ChefHat,
  Wallet,
  ReceiptText,
  ChartNoAxesCombined,
  Monitor,
  Clock3,
  ShieldCheck,
  Gift,
  Building2,
  Store,
  Bell,
  UserRound,
  Heart,
  Calculator,
  Link2,
  Layers3,
  LockKeyhole,
  Database,
  Palette,
  TicketPercent,
  Sparkles,
  CircleHelp,
  Mail,
  Phone,
  MapPin,
  MessageCircle,
  Send,
  LoaderCircle,
  Eye,
  EyeOff,
  LogOut,
  LayoutDashboard,
  Settings2,
  ShoppingBag,
  Search,
  CalendarDays,
  Download,
  TrendingUp,
  UsersRound,
  CheckCheck,
  CreditCard,
  Banknote,
  Expand,
  CircleCheck,
  CircleAlert,
  Utensils,
  Cloud,
  PanelTop,
  SlidersHorizontal,
  ExternalLink,
  RotateCcw,
  Printer,
  Copy,
  Circle,
  Flag,
  type LucideIcon,
} from "lucide-react";
import { site } from "@/lib/site";
import { useNationalDayTheme } from "@/lib/national-day";
import Image from "next/image";
import { useMediaQuery } from "react-responsive";

const iconMap: Record<string, LucideIcon> = {
  arrow: ArrowLeft,
  arrowUp: ArrowUpLeft,
  arrowRight: ArrowRight,
  trend: TrendingUp,
  arrowUpRight: ArrowUpRight,
  check: Check,
  down: ChevronDown,
  left: ChevronLeft,
  right: ChevronRight,
  plus: Plus,
  minus: Minus,
  close: X,
  menu: Menu,
  play: Play,
  qr: QrCode,
  chef: ChefHat,
  wallet: Wallet,
  receipt: ReceiptText,
  chart: ChartNoAxesCombined,
  monitor: Monitor,
  clock: Clock3,
  shield: ShieldCheck,
  gift: Gift,
  building: Building2,
  store: Store,
  bell: Bell,
  user: UserRound,
  heart: Heart,
  calculator: Calculator,
  link: Link2,
  layers: Layers3,
  lock: LockKeyhole,
  database: Database,
  palette: Palette,
  ticket: TicketPercent,
  sparkles: Sparkles,
  help: CircleHelp,
  mail: Mail,
  phone: Phone,
  pin: MapPin,
  message: MessageCircle,
  send: Send,
  loading: LoaderCircle,
  eye: Eye,
  eyeOff: EyeOff,
  logout: LogOut,
  dashboard: LayoutDashboard,
  settings: Settings2,
  bag: ShoppingBag,
  search: Search,
  calendar: CalendarDays,
  download: Download,
  users: UsersRound,
  doubleCheck: CheckCheck,
  card: CreditCard,
  cash: Banknote,
  expand: Expand,
  success: CircleCheck,
  alert: CircleAlert,
  utensils: Utensils,
  cloud: Cloud,
  panel: PanelTop,
  sliders: SlidersHorizontal,
  external: ExternalLink,
  reset: RotateCcw,
  print: Printer,
  copy: Copy,
  flag: Flag,
};
export function Icon({
  name,
  size = 20,
  className = "",
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const Component = iconMap[name] || Circle;
  return (
    <Component
      size={size}
      strokeWidth={1.7}
      className={className}
      aria-hidden="true"
    />
  );
}

export function getFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return "";

  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));

  return String.fromCodePoint(...codePoints);
}

export function CountryFlag({
  code,
  size = 20,
  className = "",
}: {
  code: string;
  size?: number;
  className?: string;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  if (!code) return null;
  const isoCode = code.toLowerCase();
  const height = Math.round((size * 2) / 3);

  return (
    <span
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height }}
    >
      {(!isLoaded || hasError) && (
        <Icon
          name="flag"
          size={Math.round(size * 0.75)}
          className="text-gray-400 animate-pulse"
        />
      )}

      {!hasError && (
        <Image
          src={`https://flagcdn.com/${isoCode}.svg`}
          alt={`علم ${code}`}
          width={size}
          height={height}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={`rounded-xs object-cover transition-opacity duration-300 ${
            isLoaded
              ? "opacity-100 block"
              : "opacity-0 absolute inset-0 pointer-events-none"
          }`}
        />
      )}
    </span>
  );
}

export function Logo({
  light = false,
  compact = false,
  withBadge = false,
}: {
  light?: boolean;
  compact?: boolean;
  withBadge?: boolean;
}) {
  const isNationalDay = useNationalDayTheme();
  const logoSrc = isNationalDay ? "/logo-national-day.svg" : site.logo;

  const isMobile = useMediaQuery({ query: "(max-width: 719px)" });
  return (
    <Link
      className={`brand ${light ? "brand-light" : ""}`}
      href="/"
      aria-label="Qira — الرئيسية"
    >
      <Image src={logoSrc} width={46} height={46} alt="" />
      <span className="brand-word"></span>
      {withBadge && (
        <span className="national-day-badge">
          {/* <Icon name="flag" size={12} /> */}
          <CountryFlag code="sa" size={isMobile ? 35 : 25} />
          <span>اليوم الوطني السعودي</span>
        </span>
      )}
    </Link>
  );
}
export function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={`reveal ${className}`}
      initial={{ y: 18 }}
      whileInView={{ y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
export function SectionHeading({
  eyebrow,
  title,
  description,
  center = true,
  light = false,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: string;
  center?: boolean;
  light?: boolean;
}) {
  return (
    <Reveal
      className={`section-heading ${center ? "center" : ""} ${light ? "on-dark" : ""}`}
    >
      {/* <span className="eyebrow">
        <span />
        {eyebrow}
      </span> */}
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </Reveal>
  );
}
export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const id = useId();
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timeout = setTimeout(
      () =>
        ref.current
          ?.querySelector<HTMLElement>("input, button, a, select, textarea")
          ?.focus(),
      50,
    );
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
      if (e.key !== "Tab" || !ref.current) return;
      const focusable = Array.from(
        ref.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([type="hidden"]):not([disabled]), select, textarea, [tabindex="0"]',
        ),
      ).filter((el) => el.offsetParent !== null);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      }
      if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(timeout);
      document.body.style.overflow = oldOverflow;
      document.removeEventListener("keydown", onKey);
      before?.focus();
    };
  }, []);
  return (
    <motion.div
      className="modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        className={`modal ${wide ? "modal-wide" : ""}`}
        initial={{ y: 24, scale: 0.98 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 15, opacity: 0 }}
        transition={{ duration: 0.22 }}
      >
        <div className="modal-header">
          <div>
            <span className="eyebrow">خطوتك القادمة تبدأ هنا</span>
            <h2 id={id}>{title}</h2>
          </div>
          <button
            className="icon-button"
            type="button"
            onClick={onClose}
            aria-label="إغلاق النافذة"
          >
            <Icon name="close" />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}
export function Reassurance({ light = false }: { light?: boolean }) {
  return (
    <div className={`reassurance ${light ? "light" : ""}`}>
      <span>
        <Icon name="check" size={14} />
        شهر مجانًا
      </span>
      <i />
      <span>دون بطاقة ائتمانية</span>
      <i />
      <span>دون التزام</span>
    </div>
  );
}
export function EmptyState({
  icon = "bag",
  title,
  description,
  children,
}: {
  icon?: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="icon-tile">
        <Icon name={icon} size={30} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {children}
    </div>
  );
}
