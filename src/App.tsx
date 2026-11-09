import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ─── Types ──────────────────────────────────────────────────────────────────

type Screen =
  | "splash"
  | "auth-welcome"
  | "login"
  | "signup"
  | "onboarding"
  | "location"
  | "home"
  | "explore"
  | "orders"
  | "plans"
  | "profile"
  | "seller-profile"
  | "build-plate"
  | "meal-detail"
  | "cart"
  | "checkout"
  | "order-confirm"
  | "order-tracking"
  | "seller-dashboard";

type DeliveryLocation = {
  address: string;
  locality: string;
  latitude: number;
  longitude: number;
  details?: string;
  instructions?: string;
};

type ExploreState = {
  query: string;
  cuisines: string[];
  diets: string[];
  mealTypes: string[];
  plan: "All" | "Daily" | "Weekly" | "Monthly";
  minPrice: number;
  maxPrice: number;
  availableOnly: boolean;
  sort: "Recommended" | "Price: Low to High" | "Price: High to Low" | "Newest";
};

type UserRole = "customer" | "provider";

type AuthAccount = {
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  passwordHash: string;
};

type AuthSession = {
  name: string;
  email: string;
  role: UserRole;
};

type Meal = {
  id: string;
  sellerId: string;
  name: string;
  kitchen: string;
  description: string;
  price: number;
  image: string;
  labels: string[];
  cuisine: string;
  mealType: "Breakfast" | "Lunch" | "Dinner" | "Snacks";
  category: string;
  keywords: string[];
  available: boolean;
};

type PlateOption = {
  name: string;
  price: number;
};

type PlateMenu = {
  bases: PlateOption[];
  sabzis: PlateOption[];
  proteins: PlateOption[];
  sides: PlateOption[];
  preferences: string[];
};

type CustomPlate = {
  sellerId: string;
  base: string;
  sabzi: string;
  protein: string;
  sides: string[];
  preferences: string[];
  unitPrice: number;
};

type CartItem = {
  mealId: string;
  quantity: number;
  customPlate?: CustomPlate;
};

type PlanOption = {
  id: string;
  sellerId: string;
  mealId: string;
  name: string;
  duration: "Daily" | "Weekly" | "Monthly";
  meals: number;
  price: number;
};

type ScheduledMeal = {
  id: string;
  date: string;
  slot: string;
  mealType: "Lunch" | "Dinner";
  mealId: string;
  status: "Scheduled" | "Skipped" | "Paused";
};

type Subscription = {
  id: string;
  kitchen: string;
  plan: "Weekly" | "Monthly";
  status: "Active" | "Paused" | "Change Pending" | "Cancelled";
  mealId: string;
  mealType: "Lunch" | "Dinner";
  remainingMeals: number;
  price: number;
  billingPeriod: string;
  pauseStart?: string;
  resumeDate?: string;
  schedule: ScheduledMeal[];
};

type CheckoutDraft =
  | { kind: "meal"; mealId: string; quantity: number; customPlate?: CustomPlate; items?: CartItem[] }
  | { kind: "subscription"; plan: "Weekly" | "Monthly"; planOptionId?: string; mealId: string; mealType: "Lunch" | "Dinner" };

type OrderStatus = "Order Placed" | "Order Confirmed" | "Preparing" | "Out for Delivery" | "Delivered" | "Cancelled";

type ConfirmedOrder = {
  id: string;
  kind: "meal" | "subscription";
  title: string;
  kitchen: string;
  amount: number;
  quantity?: number;
  itemsSummary?: string;
  address: string;
  schedule: string;
  payment: string;
  placedAt: string;
  status: OrderStatus;
  currentStep: number;
  estimatedDeliveryTime: string;
  deliveredAt?: string;
};

type AppData = {
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  subscription: Subscription | null;
  setSubscription: React.Dispatch<React.SetStateAction<Subscription | null>>;
  orders: ConfirmedOrder[];
  setOrders: React.Dispatch<React.SetStateAction<ConfirmedOrder[]>>;
  activeOrderId: string | null;
  setActiveOrderId: React.Dispatch<React.SetStateAction<string | null>>;
  checkoutDraft: CheckoutDraft | null;
  setCheckoutDraft: React.Dispatch<React.SetStateAction<CheckoutDraft | null>>;
  confirmedOrder: ConfirmedOrder | null;
  setConfirmedOrder: React.Dispatch<React.SetStateAction<ConfirmedOrder | null>>;
  address: string;
  setAddress: React.Dispatch<React.SetStateAction<string>>;
  deliveryLocation: DeliveryLocation;
  setDeliveryLocation: React.Dispatch<React.SetStateAction<DeliveryLocation>>;
  exploreState: ExploreState;
  setExploreState: React.Dispatch<React.SetStateAction<ExploreState>>;
  authAccount: AuthAccount | null;
  setAuthAccount: React.Dispatch<React.SetStateAction<AuthAccount | null>>;
  authSession: AuthSession | null;
  setAuthSession: React.Dispatch<React.SetStateAction<AuthSession | null>>;
  authRedirectTarget: Screen | null;
  setAuthRedirectTarget: React.Dispatch<React.SetStateAction<Screen | null>>;
  showOrderSuccessPopup: boolean;
  setShowOrderSuccessPopup: React.Dispatch<React.SetStateAction<boolean>>;
  dismissedOrderPopupIds: string[];
  setDismissedOrderPopupIds: React.Dispatch<React.SetStateAction<string[]>>;
  toastMessage: string | null;
  showToast: (msg: string) => void;
};

// ─── Logo ───────────────────────────────────────────────────────────────────

function TiffinBuddyLogo({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.75} viewBox="0 0 56 42" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="22" y="2" width="12" height="5" rx="2.5" fill="#8B4B2C"/>
      <rect x="14" y="7" width="28" height="7" rx="3.5" fill="#8B4B2C"/>
      <rect x="10" y="16" width="36" height="10" rx="5" fill="#E09B1A"/>
      <path d="M8 28h40l-4 10H12L8 28z" fill="#2C5F3D" rx="4"/>
    </svg>
  );
}

function WordMark({ dark = false }: { dark?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span
        className="text-2xl font-display font-bold tracking-tight text-foreground"
        style={{ fontFamily: "Fraunces, serif" }}
      >
        tiffinbuddy
      </span>
      <span className="text-xs font-medium tracking-wide text-muted-foreground">
        your daily dabba, sorted.
      </span>
    </div>
  );
}

// ─── Navigation ──────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: "home", label: "Home", icon: HomeIcon },
  { id: "explore", label: "Discover", icon: SearchIcon },
  { id: "plans", label: "My Tiffin", icon: CalIcon },
  { id: "orders", label: "Orders", icon: BagIcon },
  { id: "profile", label: "Profile", icon: UserIcon },
];

function BottomNav({
  active,
  onNavigate,
  cartCount,
}: {
  active: string;
  onNavigate: (s: Screen) => void;
  cartCount: number;
}) {
  return (
    <nav className="app-nav flex items-center justify-around px-2 py-2 border-t bg-card/95 backdrop-blur-md" style={{ borderColor: "var(--border)" }}>
      {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => onNavigate(id as Screen)}
            className="flex flex-col items-center gap-0.5 px-3 py-1 min-w-[48px] min-h-[48px] justify-center active:scale-95 transition-transform"
          >
            <div className="relative">
              <Icon size={22} color={isActive ? "var(--primary)" : "#A8A29E"} />
              {id === "orders" && cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-accent text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                  {cartCount}
                </span>
              )}
            </div>
            <span
              className="text-[10px] font-semibold"
              style={{ color: isActive ? "var(--primary)" : "#A8A29E" }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

// ─── Icon Components ─────────────────────────────────────────────────────────

function HomeIcon({ size = 20, color = "#1C1917" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M3 9.5L12 3l9 6.5V21a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M9 22V12h6v10" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/>
    </svg>
  );
}

function SearchIcon({ size = 20, color = "#1C1917" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="7" stroke={color} strokeWidth="1.8"/>
      <path d="M16.5 16.5L21 21" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

function BagIcon({ size = 20, color = "#1C1917" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16 10a4 4 0 01-8 0" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function CalIcon({ size = 20, color = "#1C1917" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="1.8"/>
      <path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="8" cy="15" r="1" fill={color}/>
      <circle cx="12" cy="15" r="1" fill={color}/>
      <circle cx="16" cy="15" r="1" fill={color}/>
    </svg>
  );
}

function UserIcon({ size = 20, color = "#1C1917" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke={color} strokeWidth="1.8"/>
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

function ChevronLeft({ size = 20, color = "#1C1917" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M15 18l-6-6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ChevronRight({ size = 20, color = "#1C1917" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function StarIcon({ size = 14, filled = true }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        fill={filled ? "#E09B1A" : "none"} stroke="#E09B1A" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  );
}

function VegBadge({ small = false }) {
  return (
    <span className={`inline-flex items-center gap-1 ${small ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-0.5"} rounded-full font-semibold`}
      style={{ background: "#E8F5ED", color: "#2C5F3D", border: "1px solid #2C5F3D" }}>
      <span className={`${small ? "w-1.5 h-1.5" : "w-2 h-2"} rounded-full bg-accent inline-block`}/>
      Veg
    </span>
  );
}

function CheckIcon({ size = 16, color = "#2C5F3D" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M20 6L9 17l-5-5" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function PlusIcon({ size = 16, color = "#1C1917" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12h14" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
}

function MinusIcon({ size = 16, color = "#1C1917" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M5 12h14" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
}

function MapPinIcon({ size = 14, color = "#78716C" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 21C12 21 5 13.5 5 9a7 7 0 1114 0c0 4.5-7 12-7 12z" stroke={color} strokeWidth="1.8"/>
      <circle cx="12" cy="9" r="2.5" stroke={color} strokeWidth="1.8"/>
    </svg>
  );
}

function ClockIcon({ size = 14, color = "#78716C" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8"/>
      <path d="M12 7v5l3 3" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

// ─── Reusable Components ─────────────────────────────────────────────────────

function TopBar({
  title,
  onBack,
  right,
}: {
  title?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  return (
    <header className="flex items-center px-4 py-3 gap-3 border-b border-border/70 bg-card/80 backdrop-blur-md sticky top-0 z-30" style={{ minHeight: 56 }}>
      {onBack ? (
        <button
          onClick={onBack}
          aria-label="Back"
          className="w-10 h-10 rounded-full flex items-center justify-center bg-secondary hover:bg-secondary/80 active:scale-95 transition-all text-foreground flex-shrink-0"
        >
          <ChevronLeft size={20} />
        </button>
      ) : (
        <div className="w-10 flex-shrink-0" />
      )}
      {title ? (
        <h1 className="flex-1 text-base font-bold text-foreground text-center truncate">{title}</h1>
      ) : (
        <div className="flex-1" />
      )}
      {right ? <div className="ml-auto flex items-center flex-shrink-0">{right}</div> : <div className="w-10 flex-shrink-0" />}
    </header>
  );
}

function PrimaryButton({
  label,
  onClick,
  disabled = false,
  fullWidth = true,
  sublabel,
  loading = false,
}: {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
  sublabel?: string;
  loading?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${fullWidth ? "w-full" : ""} flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all duration-150 ${disabled || loading ? "opacity-50 cursor-not-allowed" : "hover:brightness-105 active:scale-[0.98] shadow-sm"}`}
      style={{ background: "var(--primary)", color: "#1C1917", minHeight: 52 }}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-stone-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      <span>{loading ? "Please wait…" : label}</span>
      {sublabel && <span className="text-xs font-semibold opacity-85 ml-1">• {sublabel}</span>}
    </button>
  );
}

function SecondaryButton({ label, onClick, disabled = false }: { label: string; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm border transition-all active:scale-[0.98] hover:bg-secondary/50"
      style={{ borderColor: "var(--border)", color: "var(--foreground)", background: "transparent", minHeight: 52 }}
    >
      {label}
    </button>
  );
}

function QuantitySelector({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center gap-2 bg-secondary/80 p-1 rounded-full border border-border/60">
      <button
        onClick={() => onChange(Math.max(0, value - 1))}
        aria-label="Decrease quantity"
        className="w-8 h-8 rounded-full flex items-center justify-center bg-card shadow-xs active:scale-90 transition-transform"
      >
        <MinusIcon size={13} />
      </button>
      <span className="w-6 text-center font-bold text-sm select-none">{value}</span>
      <button
        onClick={() => onChange(value + 1)}
        aria-label="Increase quantity"
        className="w-8 h-8 rounded-full flex items-center justify-center text-foreground font-bold active:scale-90 transition-transform"
        style={{ background: "var(--primary)" }}
      >
        <PlusIcon size={13} color="#1C1917" />
      </button>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4a4.6 4.6 0 01-2 3v2.5h3.3c1.9-1.8 2.9-4.4 2.9-7.4z"/>
      <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.4l-3.3-2.5c-.9.6-2.1 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3v2.6A10 10 0 0012 22z"/>
      <path fill="#FBBC05" d="M6.4 14a6 6 0 010-3.9V7.4H3a10 10 0 000 9.2L6.4 14z"/>
      <path fill="#EA4335" d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.9-2.8A9.7 9.7 0 0012 2a10 10 0 00-9 5.4L6.4 10A6 6 0 0112 5.9z"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.8 12.7c0-2.3 1.9-3.4 2-3.5a4.4 4.4 0 00-3.5-1.9c-1.5-.2-2.9.9-3.6.9-.8 0-1.9-.9-3.1-.8a4.6 4.6 0 00-3.9 2.4c-1.7 2.9-.4 7.2 1.2 9.5.8 1.1 1.7 2.4 3 2.3 1.2 0 1.6-.7 3.1-.7 1.4 0 1.8.7 3.1.7 1.3 0 2.1-1.1 2.9-2.3.9-1.3 1.3-2.6 1.3-2.7-.1 0-2.5-1-2.5-3.9zM14.3 5.7A4.2 4.2 0 0015.4 2a4.2 4.2 0 00-2.8 1.4 4 4 0 00-1.1 3.5 3.5 3.5 0 002.8-1.2z"/>
    </svg>
  );
}

function SocialAuthButtons({ action, onGoogle, onApple }: { action: "Sign in" | "Sign up"; onGoogle: () => void; onApple: () => void }) {
  return (
    <div className="social-auth">
      <div className="auth-divider"><span>or continue with</span></div>
      <div className="social-auth-grid">
        <button type="button" onClick={onGoogle} className="active:scale-95 transition-transform"><GoogleIcon /><span>{action} with Google</span></button>
        <button type="button" onClick={onApple} className="active:scale-95 transition-transform"><AppleIcon /><span>{action} with Apple</span></button>
      </div>
      <p>Local demonstration account. No remote third-party credentials needed.</p>
    </div>
  );
}

async function hashPassword(password: string) {
  const bytes = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function AuthWelcomeScreen({ onLogin, onSignup, onGuest, onBack }: { onLogin: () => void; onSignup: () => void; onGuest: () => void; onBack?: () => void }) {
  return (
    <div className="auth-screen">
      <section className="auth-visual">
        <img src="https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1200&h=1200&fit=crop&auto=format" alt="A warm homemade Indian meal" />
        <div className="auth-visual-overlay" />
        <div className="auth-brand">
          <TiffinBuddyLogo size={64} />
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-amber-300">Ahmedabad's home-food community</p>
          <h1 className="mt-2 font-display text-4xl font-bold leading-tight text-white">Everyday food,<br />made with care.</h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-white/80">Discover trusted local tiffin kitchens, manage daily meal plans, and keep your dabba routine simple.</p>
        </div>
      </section>
      <section className="auth-form-panel">
        <div className="auth-form-inner">
          <div className="flex items-center justify-between mb-4">
            {onBack ? (
              <button onClick={onBack} aria-label="Back" className="w-10 h-10 rounded-full flex items-center justify-center bg-secondary active:scale-95 transition-all">
                <ChevronLeft size={20} />
              </button>
            ) : <div />}
            <div className="sm:hidden"><WordMark /></div>
            <div className="w-10" />
          </div>
          <p className="eyebrow mt-4 sm:mt-0">Welcome to TiffinBuddy</p>
          <h2 className="mt-2 font-display text-3xl font-bold">Your daily dabba starts here</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Sign in to sync your meals, or explore homemade menus as a guest.</p>
          <div className="mt-7 space-y-3">
            <PrimaryButton label="Sign in to your account" onClick={onLogin} />
            <SecondaryButton label="Create an account" onClick={onSignup} />
            <button
              onClick={onGuest}
              className="w-full min-h-[48px] rounded-2xl text-xs font-bold text-accent hover:underline flex items-center justify-center gap-1 active:scale-98 transition-all"
            >
              Continue browsing as guest →
            </button>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-2">
            {["Homemade meals", "Flexible plans", "Local kitchens"].map((item) => (
              <div key={item} className="rounded-2xl bg-secondary p-3 text-center text-[11px] font-bold text-secondary-foreground">{item}</div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function LoginScreen({
  account,
  onBack,
  onSuccess,
  onSignup,
  isCheckoutAuth = false,
}: {
  account: AuthAccount | null;
  onBack: () => void;
  onSuccess: (session: AuthSession) => void;
  onSignup: () => void;
  isCheckoutAuth?: boolean;
}) {
  const [email, setEmail] = useState(account?.email ?? "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setSubmitting(true);
    const passwordHash = await hashPassword(password);
    if (!account || account.email.toLowerCase() !== email.trim().toLowerCase() || account.passwordHash !== passwordHash) {
      if (email.toLowerCase().includes("@") && password.length >= 6) {
        onSuccess({ name: email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, l => l.toUpperCase()), email: email.trim(), role: "customer" });
        return;
      }
      setError("Incorrect email or password. Use at least 6 characters or register below.");
      setSubmitting(false);
      return;
    }
    onSuccess({ name: account.name, email: account.email, role: account.role });
  };

  return (
    <div className="auth-page overflow-y-auto">
      <button onClick={onBack} aria-label="Back" className="auth-back active:scale-90 transition-transform"><ChevronLeft size={20} /></button>
      <div className="auth-card">
        {isCheckoutAuth && (
          <div className="mb-4 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
            <span className="text-base">🍱</span>
            <span><strong>Almost there!</strong> Sign in to place your order. Your cart is preserved.</span>
          </div>
        )}
        <div className="flex items-center gap-3">
          <TiffinBuddyLogo size={48} />
          <div>
            <p className="eyebrow">Welcome back</p>
            <h1 className="font-display text-2xl font-bold">Sign in to TiffinBuddy</h1>
          </div>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">Continue to meals, daily plans, active orders, and checkout.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="auth-label">
            Email address
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="auth-input focus:ring-2 focus:ring-primary outline-none"
              required
            />
          </label>
          <label className="auth-label">
            Password
            <span className="auth-password">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter password (min 6 chars)"
                className="auth-input pr-20 focus:ring-2 focus:ring-primary outline-none"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="auth-password-toggle text-xs font-bold text-accent"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </span>
          </label>
          {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</div>}
          <PrimaryButton label={submitting ? "Signing in…" : "Sign in"} loading={submitting} />
        </form>
        <SocialAuthButtons
          action="Sign in"
          onGoogle={() => onSuccess({ name: "Priya Mehta", email: "priya.mehta@ahmedabad.local", role: "customer" })}
          onApple={() => onSuccess({ name: "Rahul Patel", email: "rahul.patel@ahmedabad.local", role: "customer" })}
        />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          New to TiffinBuddy?{" "}
          <button onClick={onSignup} className="min-h-11 font-bold text-accent underline">Create an account</button>
        </p>
      </div>
    </div>
  );
}

function SignupScreen({
  onBack,
  onSuccess,
  onLogin,
  isCheckoutAuth = false,
}: {
  onBack: () => void;
  onSuccess: (account: AuthAccount) => void;
  onLogin: () => void;
  isCheckoutAuth?: boolean;
}) {
  const [role, setRole] = useState<UserRole>("customer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accepted, setAccepted] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (name.trim().length < 2) return setError("Please enter your full name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError("Please enter a valid email address.");
    if (!/^[6-9]\d{9}$/.test(phone.replace(/\D/g, ""))) return setError("Please enter a valid 10-digit Indian mobile number.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirmPassword) return setError("Passwords do not match.");
    if (!accepted) return setError("Please accept the terms to continue.");
    setSubmitting(true);
    const passwordHash = await hashPassword(password);
    onSuccess({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.replace(/\D/g, ""),
      role,
      passwordHash,
    });
  };

  return (
    <div className="auth-page overflow-y-auto">
      <button onClick={onBack} aria-label="Back" className="auth-back active:scale-90 transition-transform"><ChevronLeft size={20} /></button>
      <div className="auth-card my-6">
        {isCheckoutAuth && (
          <div className="mb-4 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
            <span className="text-base">🍱</span>
            <span><strong>Almost there!</strong> Create your account to place your order. Your cart is preserved.</span>
          </div>
        )}
        <div className="flex items-center gap-3">
          <TiffinBuddyLogo size={48} />
          <div>
            <p className="eyebrow">First time here?</p>
            <h1 className="font-display text-2xl font-bold">Create your account</h1>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setRole("customer")}
            className={`role-card active:scale-95 transition-transform ${role === "customer" ? "active ring-2 ring-accent" : ""}`}
          >
            <UserIcon size={20} color={role === "customer" ? "var(--accent)" : "var(--muted-foreground)"} />
            <strong>Customer</strong>
            <span>Order daily meals</span>
          </button>
          <button
            type="button"
            onClick={() => setRole("provider")}
            className={`role-card active:scale-95 transition-transform ${role === "provider" ? "active ring-2 ring-primary" : ""}`}
          >
            <TiffinBuddyLogo size={24} />
            <strong>Tiffin Kitchen</strong>
            <span>Manage food orders</span>
          </button>
        </div>
        <form onSubmit={submit} className="mt-4 space-y-3">
          <label className="auth-label">Full name<input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Priya Mehta" className="auth-input focus:ring-2 focus:ring-primary outline-none" required /></label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="auth-label">Email address<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="auth-input focus:ring-2 focus:ring-primary outline-none" required /></label>
            <label className="auth-label">Mobile number<input type="tel" inputMode="numeric" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="10-digit number" className="auth-input focus:ring-2 focus:ring-primary outline-none" required /></label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="auth-label">Password<input type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Min 6 characters" className="auth-input focus:ring-2 focus:ring-primary outline-none" required /></label>
            <label className="auth-label">Confirm password<input type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repeat password" className="auth-input focus:ring-2 focus:ring-primary outline-none" required /></label>
          </div>
          <label className="flex items-start gap-2.5 rounded-xl bg-secondary p-3 text-xs leading-relaxed text-muted-foreground cursor-pointer">
            <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-primary" />
            <span>I agree to TiffinBuddy Ahmedabad terms of service and delivery policy.</span>
          </label>
          {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</div>}
          <PrimaryButton label={submitting ? "Creating account…" : "Create account"} loading={submitting} />
        </form>
        <SocialAuthButtons
          action="Sign up"
          onGoogle={() => onSuccess({ name: "Google User", email: "user@gmail.com", phone: "9876543210", role, passwordHash: "google-hash" })}
          onApple={() => onSuccess({ name: "Apple User", email: "user@icloud.com", phone: "9876543210", role, passwordHash: "apple-hash" })}
        />
        <p className="mt-5 text-center text-sm text-muted-foreground">
          Already registered? <button onClick={onLogin} className="min-h-11 font-bold text-accent underline">Sign in</button>
        </p>
      </div>
    </div>
  );
}

// ─── Screen: Splash ──────────────────────────────────────────────────────────

function SplashScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onDone, 1200);
    return () => window.clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center select-none" style={{ background: "var(--background)" }}>
      <div className="animate-bounce mb-2">
        <TiffinBuddyLogo size={80} />
      </div>
      <WordMark />
      <div className="mt-8 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
        <span className="text-xs font-semibold text-muted-foreground">Starting Ahmedabad's home tiffins…</span>
      </div>
    </div>
  );
}

// ─── Screen: Onboarding ──────────────────────────────────────────────────────

const ONBOARDING_SLIDES = [
  {
    emoji: "🍱",
    title: "Fresh home food every day",
    body: "Wholesome, balanced meals from trusted neighbourhood home cooks and verified tiffin centres across Ahmedabad.",
    img: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&h=600&fit=crop&auto=format",
  },
  {
    emoji: "🥘",
    title: "Build your own plate",
    body: "Choose your rotli, seasonal sabzi, dal, and healthy sides. Pure vegetarian and Jain preparations made fresh daily.",
    img: "https://images.unsplash.com/photo-1589778655375-3e622a9fc91c?w=800&h=600&fit=crop&auto=format",
  },
  {
    emoji: "🛵",
    title: "Reliable daily delivery",
    body: "Scheduled lunch and dinner delivery right to your office desk or apartment doorstep on time, every time.",
    img: "https://images.unsplash.com/photo-1559561724-732dbca7be1e?w=800&h=600&fit=crop&auto=format",
  },
];

function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const slide = ONBOARDING_SLIDES[step];

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--background)" }}>
      <div className="relative flex-shrink-0" style={{ height: "45%" }}>
        <img src={slide.img} alt={slide.title} className="w-full h-full object-cover" style={{ background: "#E8E0CF" }}/>
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 60%, var(--background))" }}/>
      </div>
      <div className="flex flex-col flex-1 px-6 pt-4 pb-6 gap-4">
        <div className="flex-1">
          <div className="text-3xl mb-3">{slide.emoji}</div>
          <h1 className="text-2xl font-bold text-foreground mb-2 leading-snug" style={{ fontFamily: "Fraunces, serif" }}>
            {slide.title}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">{slide.body}</p>
        </div>
        <div className="flex gap-1.5 items-center">
          {ONBOARDING_SLIDES.map((_, i) => (
            <span key={i} className="h-1.5 rounded-full transition-all duration-300"
              style={{ width: i === step ? 24 : 8, background: i === step ? "var(--primary)" : "var(--muted)" }}/>
          ))}
        </div>
        <div className="flex gap-3">
          {step < 2 ? (
            <>
              <SecondaryButton label="Skip" onClick={onDone} />
              <PrimaryButton label="Next" onClick={() => setStep(step + 1)} />
            </>
          ) : (
            <PrimaryButton label="Start Ordering" onClick={onDone} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Screen: Location ────────────────────────────────────────────────────────

const AHMEDABAD_CENTER: [number, number] = [23.0225, 72.5714];

const LOCALITIES = [
  { name: "Navrangpura", available: true, latitude: 23.0365, longitude: 72.5611 },
  { name: "Vastrapur", available: true, latitude: 23.0351, longitude: 72.5293 },
  { name: "Satellite", available: true, latitude: 23.0158, longitude: 72.5178 },
  { name: "Bopal", available: true, latitude: 23.0331, longitude: 72.4632 },
  { name: "Prahlad Nagar", available: true, latitude: 23.012, longitude: 72.5108 },
  { name: "Bodakdev", available: true, latitude: 23.0392, longitude: 72.515 },
  { name: "Thaltej", available: true, latitude: 23.0497, longitude: 72.5112 },
  { name: "Maninagar", available: true, latitude: 22.9962, longitude: 72.5996 },
  { name: "Chandkheda", available: true, latitude: 23.112, longitude: 72.5716 },
  { name: "SG Highway", available: true, latitude: 23.0606, longitude: 72.5107 },
  { name: "Gota", available: true, latitude: 23.0998, longitude: 72.5486 },
  { name: "Ahmedabad Old City", available: true, latitude: 23.0258, longitude: 72.5873 },
  { name: "Motera", available: true, latitude: 23.1047, longitude: 72.6021 },
];

function LiveLocationScreen({ onDone, onBack }: { onDone: (location: DeliveryLocation) => void; onBack?: () => void }) {
  const { deliveryLocation } = useAppData();
  const [manualArea, setManualArea] = useState(
    LOCALITIES.some((area) => area.name === deliveryLocation.locality && area.available)
      ? deliveryLocation.locality
      : "Vastrapur",
  );
  const [manualAddress, setManualAddress] = useState(
    deliveryLocation.address && deliveryLocation.address !== "Ahmedabad, Gujarat, India"
      ? deliveryLocation.address
      : "",
  );
  const [manualError, setManualError] = useState("");
  const [instructions, setInstructions] = useState(deliveryLocation.instructions ?? "");

  const confirmLocation = () => {
    const area = LOCALITIES.find((item) => item.name === manualArea && item.available);
    if (!area) {
      setManualError("Please select a delivery area.");
      return;
    }
    const cleanAddress = manualAddress.trim();
    if (cleanAddress.length < 5) {
      setManualError("Please enter your flat/house number and building name.");
      return;
    }
    setManualError("");
    onDone({
      address: cleanAddress,
      locality: area.name,
      latitude: area.latitude,
      longitude: area.longitude,
      instructions: instructions.trim() || undefined,
    });
  };

  return (
    <div className="location-screen flex h-full flex-col overflow-y-auto bg-background">
      <TopBar title="Delivery Address" onBack={onBack} />
      <div className="p-4 max-w-xl mx-auto w-full space-y-4 pb-12">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border">
          <TiffinBuddyLogo size={40} />
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-accent">Ahmedabad Delivery Zone</p>
            <h2 className="font-display text-lg font-bold">Where should we deliver your meal?</h2>
          </div>
        </div>

        <div className="space-y-3 p-4 rounded-3xl bg-card border border-border shadow-xs">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
              1. Select Ahmedabad Locality
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {LOCALITIES.map((area) => {
                const isSelected = manualArea === area.name;
                return (
                  <button
                    key={area.name}
                    type="button"
                    onClick={() => { setManualArea(area.name); setManualError(""); }}
                    className={`p-2.5 rounded-xl border text-left text-xs font-bold flex items-center justify-between transition-all active:scale-95 ${isSelected ? "border-accent bg-accent/10 text-accent font-extrabold" : "border-border hover:bg-secondary/40"}`}
                  >
                    <span className="truncate">{area.name}</span>
                    {isSelected && <CheckIcon size={14} color="var(--accent)" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5" htmlFor="address-input">
              2. Complete House / Flat / Society Address
            </label>
            <textarea
              id="address-input"
              value={manualAddress}
              onChange={(e) => { setManualAddress(e.target.value); setManualError(""); }}
              rows={3}
              placeholder="e.g. 402, Shivam Heights, Near Vastrapur Lake, Vastrapur"
              className="w-full rounded-xl border border-border bg-secondary/30 p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
              3. Delivery Instructions (Optional)
            </label>
            <input
              type="text"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Leave with security / Ring bell twice"
              className="w-full rounded-xl border border-border bg-secondary/30 p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          {manualError && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
              {manualError}
            </div>
          )}

          <div className="pt-2">
            <PrimaryButton label="Save Delivery Location" onClick={confirmLocation} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sample Data ─────────────────────────────────────────────────────────────

const FOOD_IMAGES = {
  ramabenKitchen: "https://images.unsplash.com/photo-1589778655375-3e622a9fc91c?w=900&h=700&fit=crop&auto=format",
  sonalKitchen: "https://images.unsplash.com/photo-1742281257687-092746ad6021?w=900&h=700&fit=crop&auto=format",
  gharJaisaKitchen: "https://images.unsplash.com/photo-1680993032090-1ef7ea9b51e5?w=900&h=700&fit=crop&auto=format",
  gharJaisaMeal: "https://images.unsplash.com/photo-1559561724-732dbca7be1e?w=900&h=700&fit=crop&auto=format",
  gujaratiThali: "https://images.unsplash.com/photo-1742281257707-0c7f7e5ca9c6?w=900&h=700&fit=crop&auto=format",
  khichdi: "https://images.unsplash.com/photo-1728910758653-7e990e489cac?w=900&h=700&fit=crop&auto=format",
  northIndianThali: "https://images.unsplash.com/photo-1742281258189-3b933879867a?w=900&h=700&fit=crop&auto=format",
  poha: "https://images.unsplash.com/photo-1789991184412-c29c9dfa2b39?w=900&h=700&fit=crop&auto=format",
  jainThali: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=900&h=700&fit=crop&auto=format",
  handvo: "https://images.unsplash.com/photo-1591022132290-26a8144bd9c4?w=900&h=700&fit=crop&auto=format",
};

const SELLERS = [
  {
    id: "1",
    name: "Ramaben's Kitchen",
    tagline: "Authentic Gujarati home-food since 2018",
    rating: 4.8,
    reviews: 312,
    distance: "0.8 km",
    delivery: "25–35 min",
    price: 110,
    cuisine: "Gujarati Home Food",
    img: FOOD_IMAGES.ramabenKitchen,
    verified: true,
    available: true,
    capacity: 15,
    remaining: 4,
    coverageAreas: ["All Ahmedabad"],
    addedAt: "2026-08-20",
    dietary: ["Vegetarian", "Jain"],
  },
  {
    id: "2",
    name: "Sonal's Tiffin Center",
    tagline: "Fresh North Indian thali daily",
    rating: 4.6,
    reviews: 187,
    distance: "1.2 km",
    delivery: "30–40 min",
    price: 130,
    cuisine: "North Indian",
    img: FOOD_IMAGES.sonalKitchen,
    verified: true,
    available: true,
    capacity: 20,
    remaining: 11,
    coverageAreas: ["All Ahmedabad"],
    addedAt: "2026-09-02",
    dietary: ["Vegetarian", "High Protein"],
  },
  {
    id: "3",
    name: "Ghar Jaisa Tiffin",
    tagline: "Jain & healthy options available",
    rating: 4.9,
    reviews: 425,
    distance: "0.4 km",
    delivery: "20–30 min",
    price: 95,
    cuisine: "Home Food • Jain",
    img: FOOD_IMAGES.gharJaisaKitchen,
    verified: true,
    available: true,
    capacity: 25,
    remaining: 8,
    coverageAreas: ["All Ahmedabad"],
    addedAt: "2026-09-06",
    dietary: ["Vegetarian", "Jain", "Low Oil"],
  },
];

const MEALS: Meal[] = [
  {
    id: "ghar-jaisa",
    sellerId: "1",
    name: "Ghar Jaisa Tiffin",
    kitchen: "Ramaben's Kitchen",
    description: "Dal tadka, 3 rotli, seasonal sabzi, rice, salad and chaas",
    price: 120,
    image: FOOD_IMAGES.gharJaisaMeal,
    labels: ["Vegetarian", "Homestyle"],
    cuisine: "Gujarati",
    mealType: "Lunch",
    category: "Tiffin",
    keywords: ["dal", "rotli", "sabzi", "rice", "home food"],
    available: true,
  },
  {
    id: "gujarati-special",
    sellerId: "1",
    name: "Gujarati Special Thali",
    kitchen: "Ramaben's Kitchen",
    description: "Gujarati dal, rotli, sev tameta, rice, farsan and chaas",
    price: 150,
    image: FOOD_IMAGES.gujaratiThali,
    labels: ["Vegetarian", "Gujarati"],
    cuisine: "Gujarati",
    mealType: "Dinner",
    category: "Thali",
    keywords: ["sev tameta", "farsan", "dal", "rotli", "thali"],
    available: true,
  },
  {
    id: "light-khichdi",
    sellerId: "1",
    name: "Light Khichdi Bowl",
    kitchen: "Ramaben's Kitchen",
    description: "Moong dal khichdi, kadhi, roasted papad and fresh salad",
    price: 105,
    image: FOOD_IMAGES.khichdi,
    labels: ["Vegetarian", "Low oil"],
    cuisine: "Gujarati",
    mealType: "Dinner",
    category: "Light Meal",
    keywords: ["khichdi", "kadhi", "low oil", "healthy"],
    available: true,
  },
  {
    id: "sonal-thali",
    sellerId: "2",
    name: "North Indian Lunch Thali",
    kitchen: "Sonal's Tiffin Center",
    description: "Dal fry, 3 phulka, paneer sabzi, jeera rice and salad",
    price: 135,
    image: FOOD_IMAGES.northIndianThali,
    labels: ["Vegetarian", "High Protein"],
    cuisine: "North Indian",
    mealType: "Lunch",
    category: "Thali",
    keywords: ["paneer", "phulka", "dal fry", "rice"],
    available: true,
  },
  {
    id: "poha-breakfast",
    sellerId: "2",
    name: "Poha Breakfast Box",
    kitchen: "Sonal's Tiffin Center",
    description: "Fresh poha with peanuts, coriander, lemon and seasonal fruit",
    price: 75,
    image: FOOD_IMAGES.poha,
    labels: ["Vegetarian", "Breakfast"],
    cuisine: "North Indian",
    mealType: "Breakfast",
    category: "Breakfast",
    keywords: ["poha", "breakfast", "light", "snack"],
    available: true,
  },
  {
    id: "jain-tiffin",
    sellerId: "3",
    name: "Jain Home Tiffin",
    kitchen: "Ghar Jaisa Tiffin",
    description: "Jain dal, 3 rotli, seasonal sabzi, rice and fresh salad",
    price: 110,
    image: FOOD_IMAGES.jainThali,
    labels: ["Vegetarian", "Jain", "Low Oil"],
    cuisine: "Jain",
    mealType: "Lunch",
    category: "Tiffin",
    keywords: ["jain", "no onion", "no garlic", "home food"],
    available: true,
  },
];

const PLAN_OPTIONS: PlanOption[] = [
  { id: "p1", sellerId: "1", mealId: "ghar-jaisa", name: "Weekly Ghar Jaisa", duration: "Weekly", meals: 5, price: 495 },
  { id: "p2", sellerId: "1", mealId: "ghar-jaisa", name: "Monthly Ghar Jaisa", duration: "Monthly", meals: 20, price: 1800 },
  { id: "p3", sellerId: "2", mealId: "sonal-thali", name: "Weekly North Indian", duration: "Weekly", meals: 5, price: 595 },
  { id: "p4", sellerId: "2", mealId: "sonal-thali", name: "Monthly North Indian", duration: "Monthly", meals: 20, price: 2200 },
  { id: "p5", sellerId: "3", mealId: "jain-tiffin", name: "Weekly Jain Plan", duration: "Weekly", meals: 5, price: 450 },
  { id: "p6", sellerId: "3", mealId: "jain-tiffin", name: "Monthly Jain Plan", duration: "Monthly", meals: 20, price: 1650 },
];

const PLATE_MENUS: Record<string, PlateMenu> = {
  "1": {
    bases: [{ name: "3 Phulkas", price: 30 }, { name: "Jeera Rice", price: 35 }, { name: "Khichdi", price: 40 }],
    sabzis: [{ name: "Sev Tameta", price: 40 }, { name: "Bhindi Masala", price: 45 }, { name: "Aloo Palak", price: 40 }],
    proteins: [{ name: "Gujarati Dal", price: 35 }, { name: "Kadhi", price: 30 }, { name: "Moong Dal", price: 35 }],
    sides: [{ name: "Chaas", price: 15 }, { name: "Papad", price: 10 }, { name: "Salad", price: 15 }],
    preferences: ["Less spicy", "Less oil", "Jain (No onion/garlic)"],
  },
  "2": {
    bases: [{ name: "3 Tawa Roti", price: 30 }, { name: "Steamed Rice", price: 30 }, { name: "Pulao", price: 45 }],
    sabzis: [{ name: "Paneer Butter Masala", price: 65 }, { name: "Aloo Gobhi", price: 40 }, { name: "Mix Veg", price: 45 }],
    proteins: [{ name: "Dal Fry", price: 40 }, { name: "Rajma", price: 50 }, { name: "Chole", price: 50 }],
    sides: [{ name: "Boondi Raita", price: 25 }, { name: "Pickle", price: 10 }, { name: "Sirka Onion", price: 15 }],
    preferences: ["Medium spicy", "Extra gravy", "Ghee on roti"],
  },
  "3": {
    bases: [{ name: "3 Rotli (Jain)", price: 30 }, { name: "Plain Rice", price: 30 }, { name: "Moong Khichdi", price: 40 }],
    sabzis: [{ name: "Dudhi Chana Sabzi", price: 40 }, { name: "Gunda Keri", price: 45 }, { name: "Karela Fry", price: 45 }],
    proteins: [{ name: "Jain Dal Tadka", price: 35 }, { name: "Tuver Dal", price: 35 }, { name: "Jain Kadhi", price: 30 }],
    sides: [{ name: "Sweet Chaas", price: 15 }, { name: "Khakhra", price: 15 }, { name: "Cucumber Salad", price: 15 }],
    preferences: ["Strict Jain", "Low salt", "No root vegetables"],
  },
};

const DEFAULT_EXPLORE_STATE: ExploreState = {
  query: "",
  cuisines: [],
  diets: [],
  mealTypes: [],
  plan: "All",
  minPrice: 0,
  maxPrice: 2000,
  availableOnly: false,
  sort: "Recommended",
};

const AppDataContext = createContext<AppData | null>(null);

function useAppData() {
  const value = useContext(AppDataContext);
  if (!value) throw new Error("App data is unavailable");
  return value;
}

function addItemToCart(current: CartItem[], item: CartItem) {
  if (item.customPlate) return [...current, item];
  const existingIndex = current.findIndex((currentItem) => currentItem.mealId === item.mealId && !currentItem.customPlate);
  if (existingIndex < 0) return [...current, item];
  return current.map((currentItem, index) => index === existingIndex
    ? { ...currentItem, quantity: currentItem.quantity + item.quantity }
    : currentItem);
}

function cartItemCount(cart: CartItem[]) {
  return cart.reduce((total, item) => total + item.quantity, 0);
}

function usePersistentState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) as T : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }, [key, value]);

  return [value, setValue] as const;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short" }).format(new Date(`${date}T12:00:00`));
}

function dateAfter(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function sellerDeliversTo(_seller: typeof SELLERS[number], location: DeliveryLocation) {
  const haystack = `${location.locality} ${location.address}`.toLowerCase();
  const isKnownAhmedabadArea = LOCALITIES.some((area) => haystack.includes(area.name.toLowerCase()));
  return isKnownAhmedabadArea || haystack.includes("ahmedabad") || haystack.includes("amdavad");
}

// ─── Screen: Home ────────────────────────────────────────────────────────────

function HomeScreen({
  location,
  onNavigate,
  onAddToCart,
  cartCount,
}: {
  location: string;
  onNavigate: (s: Screen, data?: unknown) => void;
  onAddToCart: (quantity?: number) => void;
  cartCount: number;
}) {
  const { authSession, confirmedOrder, showOrderSuccessPopup, setShowOrderSuccessPopup, dismissedOrderPopupIds, setDismissedOrderPopupIds, showToast } = useAppData();
  const categories = [
    { label: "Today's Meal", emoji: "🍱", screen: "meal-detail" as Screen },
    { label: "Build Your Plate", emoji: "🥘", screen: "build-plate" as Screen },
    { label: "Healthy Meals", emoji: "🥗", screen: "explore" as Screen },
    { label: "Weekly Plans", emoji: "📅", screen: "plans" as Screen },
  ];

  const greetingName = authSession?.name ? authSession.name.split(" ")[0] : "Foodie";
  const showPopup = Boolean(showOrderSuccessPopup && confirmedOrder && !dismissedOrderPopupIds.includes(confirmedOrder.id));

  const dismissPopup = () => {
    setShowOrderSuccessPopup(false);
    if (confirmedOrder) {
      setDismissedOrderPopupIds((prev) => [...prev, confirmedOrder.id]);
    }
  };

  return (
    <div className="home-screen flex-1 overflow-y-auto pb-28 relative" style={{ background: "var(--background)" }}>
      {/* Top Header */}
      <div className="home-header px-4 pt-4 pb-3 flex items-center justify-between border-b border-border/50 bg-card/60 backdrop-blur-md sticky top-0 z-20">
        <div>
          <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Ahmedabad Dabba</p>
          <h1 className="text-lg font-bold text-foreground">Good afternoon, {greetingName} 👋</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate("location")}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full border text-xs font-semibold bg-card hover:bg-secondary/60 active:scale-95 transition-all text-muted-foreground shadow-2xs"
            style={{ borderColor: "var(--border)" }}
          >
            <MapPinIcon size={12} color="var(--primary)" />
            <span>{location}</span>
            <span className="text-[10px] text-muted-foreground">▾</span>
          </button>
          {cartCount > 0 && (
            <button
              onClick={() => onNavigate("cart")}
              aria-label="View Cart"
              className="relative p-2 rounded-full bg-primary/20 text-foreground active:scale-90 transition-transform"
            >
              <BagIcon size={18} color="#1C1917" />
              <span className="absolute -top-1 -right-1 bg-accent text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                {cartCount}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Blinkit / Zepto Food Order Confirmation Popup */}
      {showPopup && confirmedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-5 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-green-100 text-2xl flex items-center justify-center">🍱</div>
                <div>
                  <span className="inline-block px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-[10px] font-extrabold uppercase tracking-wide">
                    Order Confirmed
                  </span>
                  <h3 className="font-display font-bold text-lg text-foreground mt-0.5">Tiffin is on the way!</h3>
                </div>
              </div>
              <button onClick={dismissPopup} aria-label="Close" className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm font-bold text-muted-foreground hover:text-foreground">
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-secondary/50 border border-border/70 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order ID</span>
                <span className="font-mono font-bold text-foreground">#{confirmedOrder.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Meal Summary</span>
                <span className="font-semibold text-foreground truncate max-w-[170px]">{confirmedOrder.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kitchen</span>
                <span className="font-semibold text-foreground">{confirmedOrder.kitchen}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estimated Delivery</span>
                <span className="font-bold text-accent">{confirmedOrder.estimatedDeliveryTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivering to</span>
                <span className="font-medium text-foreground truncate max-w-[170px]">{confirmedOrder.address}</span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <PrimaryButton
                label="Track Order Live"
                onClick={() => {
                  dismissPopup();
                  onNavigate("order-tracking");
                }}
              />
              <button
                onClick={dismissPopup}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground transition-colors text-center"
              >
                Continue Exploring Menus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Order Card on Home Screen (Blinkit style floating pill) */}
      {confirmedOrder && confirmedOrder.status !== "Delivered" && !showPopup && (
        <div className="mx-4 mt-3 p-3.5 rounded-2xl bg-accent text-white shadow-md flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-300 animate-ping shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-extrabold uppercase tracking-wide truncate">
                {confirmedOrder.status} • #{confirmedOrder.id}
              </p>
              <p className="text-[11px] opacity-90 truncate">
                ETA: {confirmedOrder.estimatedDeliveryTime} • {confirmedOrder.kitchen}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate("order-tracking")}
            className="px-3.5 py-1.5 rounded-xl bg-white text-stone-900 text-xs font-bold shrink-0 hover:brightness-95 active:scale-95 transition-all shadow-xs"
          >
            Track →
          </button>
        </div>
      )}

      {/* Today's Tiffin — hero card */}
      <div className="home-hero-wrap px-4 mt-3 mb-4">
        <div className="home-hero-card rounded-3xl overflow-hidden border border-border/80 bg-card shadow-xs">
          <div className="relative" style={{ height: 170 }}>
            <img
              src={FOOD_IMAGES.gharJaisaMeal}
              alt="Today's tiffin"
              className="w-full h-full object-cover"
              style={{ background: "#E8E0CF" }}
            />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(28,25,23,0.65) 0%, transparent 70%)" }}/>
            <div className="absolute top-3 left-3">
              <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wide bg-primary text-stone-950 shadow-xs">
                Today's Special Tiffin
              </span>
            </div>
            <div className="absolute bottom-3 left-3">
              <VegBadge small />
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-bold text-base text-foreground">Ramaben's Kitchen</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Dal · Rotli · Sabzi · Rice · Salad</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <div className="flex items-center gap-1">
                    <StarIcon size={12} />
                    <span className="text-xs font-semibold">4.8</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <ClockIcon size={12} />
                    <span className="text-xs">25–35 min</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-extrabold text-foreground">₹120</div>
                <div className="flex items-center gap-1 mt-1.5">
                  <button
                    onClick={() => {
                      onAddToCart(1);
                      showToast('Added "Ghar Jaisa Tiffin" to your cart!');
                    }}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-secondary hover:bg-secondary/80 active:scale-95 transition-all text-foreground border border-border"
                  >
                    + Add
                  </button>
                  <button
                    onClick={() => onNavigate("meal-detail")}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold active:scale-95 transition-all shadow-xs"
                    style={{ background: "var(--primary)", color: "#1C1917" }}
                  >
                    Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category shortcuts */}
      <div className="home-categories px-4 mb-5">
        <h2 className="text-sm font-bold text-foreground mb-2.5">Choose what you need</h2>
        <div className="grid grid-cols-4 gap-2">
          {categories.map(({ label, emoji, screen }) => (
            <button
              key={label}
              onClick={() => onNavigate(screen)}
              className="home-category-button flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all active:scale-95 hover:bg-secondary/30 shadow-2xs"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}
            >
              <span className="text-2xl select-none">{emoji}</span>
              <span className="text-[10px] font-bold text-center leading-tight text-foreground">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Popular near you */}
      <div className="home-popular px-4 mb-4">
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-sm font-bold text-foreground">Popular kitchens near you</h2>
          <button
            onClick={() => onNavigate("explore")}
            className="text-xs font-bold text-accent hover:underline flex items-center gap-0.5"
          >
            See all →
          </button>
        </div>
        <div className="space-y-3">
          {SELLERS.map((seller) => (
            <SellerCard key={seller.id} seller={seller} onClick={() => onNavigate("seller-profile", seller)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SellerCard({ seller, onClick }: { seller: typeof SELLERS[0]; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="seller-card w-full flex gap-3 p-3 rounded-2xl border text-left transition-all active:scale-[0.99] hover:bg-secondary/30 shadow-2xs"
      style={{ background: "var(--card)", borderColor: "var(--border)" }}>
      <img src={seller.img} alt={seller.name}
        className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
        style={{ background: "#E8E0CF" }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-1">
          <div>
            <div className="font-bold text-sm text-foreground truncate">{seller.name}</div>
            <div className="text-xs text-muted-foreground mt-0.5 truncate">{seller.cuisine}</div>
          </div>
          <VegBadge small />
        </div>
        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1 text-foreground font-semibold">
            <StarIcon size={12} />
            <span>{seller.rating}</span>
          </div>
          <div className="flex items-center gap-1">
            <ClockIcon size={12} />
            <span>{seller.delivery}</span>
          </div>
          <div className="ml-auto font-bold text-foreground">
            From ₹{seller.price}
          </div>
        </div>
      </div>
    </button>
  );
}

// ─── Screen: Explore ─────────────────────────────────────────────────────────

function FunctionalExploreScreen({ onNavigate }: { onNavigate: (s: Screen, d?: unknown) => void }) {
  const { cart, setCart, deliveryLocation, exploreState, setExploreState, showToast } = useAppData();
  const [showFilters, setShowFilters] = useState(false);
  const [draft, setDraft] = useState(exploreState);
  const serviceableSellers = SELLERS.filter((seller) => sellerDeliversTo(seller, deliveryLocation));
  const normalizedQuery = exploreState.query.trim().toLowerCase();

  const matchingSellers = useMemo(() => {
    return serviceableSellers.filter((seller) => {
      const searchable = [seller.name, seller.tagline, seller.cuisine, ...seller.coverageAreas, ...seller.dietary].join(" ").toLowerCase();
      if (normalizedQuery && !searchable.includes(normalizedQuery)) {
        const hasMatchingMeal = MEALS.some((m) => m.sellerId === seller.id && [m.name, m.description, m.cuisine, ...m.labels].join(" ").toLowerCase().includes(normalizedQuery));
        if (!hasMatchingMeal) return false;
      }
      if (exploreState.cuisines.length && !exploreState.cuisines.some((c) => seller.cuisine.toLowerCase().includes(c.toLowerCase()))) return false;
      if (exploreState.diets.length && !exploreState.diets.every((d) => seller.dietary.some((label) => label.toLowerCase() === d.toLowerCase()))) return false;
      return true;
    }).sort((a, b) => {
      if (exploreState.sort === "Price: Low to High") return a.price - b.price;
      if (exploreState.sort === "Price: High to Low") return b.price - a.price;
      return b.rating - a.rating;
    });
  }, [exploreState, normalizedQuery, serviceableSellers]);

  const matchingMeals = useMemo(() => {
    const filtered = MEALS.filter((meal) => {
      const seller = SELLERS.find((item) => item.id === meal.sellerId);
      if (!seller || !serviceableSellers.some((item) => item.id === seller.id)) return false;
      const searchable = [meal.name, meal.kitchen, meal.description, meal.cuisine, meal.category, meal.mealType, ...meal.labels, ...meal.keywords, seller.tagline].join(" ").toLowerCase();
      if (normalizedQuery && !searchable.includes(normalizedQuery)) return false;
      if (exploreState.cuisines.length && !exploreState.cuisines.includes(meal.cuisine)) return false;
      if (exploreState.diets.length && !exploreState.diets.every((diet) => meal.labels.some((label) => label.toLowerCase() === diet.toLowerCase()))) return false;
      if (exploreState.mealTypes.length && !exploreState.mealTypes.includes(meal.mealType)) return false;
      if (meal.price < exploreState.minPrice || meal.price > exploreState.maxPrice) return false;
      if (exploreState.availableOnly && !meal.available) return false;
      return true;
    });
    return [...filtered].sort((a, b) => {
      if (exploreState.sort === "Price: Low to High") return a.price - b.price;
      if (exploreState.sort === "Price: High to Low") return b.price - a.price;
      return b.price - a.price;
    });
  }, [exploreState, normalizedQuery, serviceableSellers]);

  const visiblePlans = useMemo(() => {
    return PLAN_OPTIONS.filter((plan) => {
      const seller = serviceableSellers.find((s) => s.id === plan.sellerId);
      if (!seller) return false;
      if (exploreState.plan !== "All" && plan.duration !== exploreState.plan) return false;
      if (normalizedQuery && ![plan.name, seller.name, seller.cuisine].join(" ").toLowerCase().includes(normalizedQuery)) return false;
      return true;
    });
  }, [exploreState.plan, normalizedQuery, serviceableSellers]);

  const activeFilterCount =
    exploreState.cuisines.length +
    exploreState.diets.length +
    exploreState.mealTypes.length +
    (exploreState.plan !== "All" ? 1 : 0);

  const addMeal = (meal: Meal) => {
    setCart((current) => addItemToCart(current, { mealId: meal.id, quantity: 1 }));
    showToast(`Added "${meal.name}" to your tiffin!`);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background pb-28">
      <div className="explore-container">
        <header className="explore-header">
          <div className="explore-title-block">
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">Discover</h1>
            <button
              onClick={() => onNavigate("location")}
              className="explore-location"
            >
              <MapPinIcon size={12} color="var(--accent)" />
              <span>Delivering to <strong>{deliveryLocation.locality}</strong> ▾</span>
            </button>
          </div>
          {cart.length > 0 && (
            <button
              onClick={() => onNavigate("cart")}
              className="explore-cart-button"
            >
              <BagIcon size={14} color="#1C1917" />
              <span>Cart ({cartItemCount(cart)})</span>
            </button>
          )}
        </header>

        <div className="explore-toolbar">
          <div className="explore-search">
            <SearchIcon size={16} color="var(--muted-foreground)" />
            <input
              value={exploreState.query}
              onChange={(e) => setExploreState((c) => ({ ...c, query: e.target.value }))}
              placeholder="Search thalis, rotli, sabzi or kitchens…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {exploreState.query && (
              <button
                onClick={() => setExploreState((c) => ({ ...c, query: "" }))}
                aria-label="Clear search"
                className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs text-muted-foreground hover:text-foreground active:scale-90"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="meal-type-strip">
          {["All food", "Gujarati", "North Indian", "Jain", "Healthy"].map((type) => {
            const active = type === "All food"
              ? exploreState.cuisines.length === 0 && !exploreState.diets.includes("Healthy")
              : type === "Healthy"
              ? exploreState.diets.includes("Healthy")
              : exploreState.cuisines.includes(type);
            return (
              <button
                key={type}
                onClick={() => {
                  if (type === "All food") {
                    setExploreState((c) => ({ ...c, cuisines: [], diets: c.diets.filter((d) => d !== "Healthy") }));
                  } else if (type === "Healthy") {
                    setExploreState((c) => ({
                      ...c,
                      diets: c.diets.includes("Healthy") ? c.diets.filter((d) => d !== "Healthy") : [...c.diets, "Healthy"],
                    }));
                  } else {
                    setExploreState((c) => ({ ...c, cuisines: c.cuisines.includes(type) ? [] : [type] }));
                  }
                }}
                className={active ? "active" : ""}
              >
                {type}
              </button>
            );
          })}
          <button
            onClick={() => { setDraft(exploreState); setShowFilters(true); }}
            className={`filter-chip-btn ${activeFilterCount > 0 ? "active" : ""}`}
          >
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-400 text-stone-950 text-[10px] font-extrabold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        <div className="explore-result-row">
          <p className="text-xs font-bold text-muted-foreground">
            {matchingSellers.length} kitchen{matchingSellers.length === 1 ? "" : "s"} · {matchingMeals.length} fresh meal{matchingMeals.length === 1 ? "" : "s"}
          </p>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground font-semibold">Sort:</span>
            <select
              value={exploreState.sort}
              onChange={(e) => setExploreState((c) => ({ ...c, sort: e.target.value as ExploreState["sort"] }))}
              aria-label="Sort options"
            >
              <option>Recommended</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Section 1: Kitchens / Centers */}
        {matchingSellers.length > 0 && (
          <section className="explore-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Local Dabba Partners</p>
                <h2>Trusted Home Kitchens</h2>
              </div>
            </div>
            <div className="provider-grid">
              {matchingSellers.map((seller) => (
                <button
                  key={seller.id}
                  onClick={() => onNavigate("seller-profile", { sellerId: seller.id })}
                  className="provider-discovery-card"
                >
                  <img src={seller.img} alt={seller.name} />
                  <div className="min-w-0 flex-1 text-left">
                    <div className="flex items-center gap-1">
                      <strong className="block truncate text-sm font-bold text-foreground">{seller.name}</strong>
                      {seller.verified && (
                        <span className="text-[10px] font-bold text-accent shrink-0">✓</span>
                      )}
                    </div>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">{seller.cuisine} · {seller.delivery}</span>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="provider-price">From ₹{seller.price}</span>
                      <span className="text-xs font-semibold text-muted-foreground">{seller.distance}</span>
                    </div>
                  </div>
                  <span className="provider-rating">★ {seller.rating}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Section 2: Homemade Meals & Thalis */}
        {matchingMeals.length > 0 && (
          <section className="explore-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Fresh Today</p>
                <h2>Homemade Meals & Thalis</h2>
              </div>
              <span className="text-xs font-bold text-muted-foreground">{matchingMeals.length} items</span>
            </div>
            <div className="meal-grid">
              {matchingMeals.map((meal) => {
                const inCart = cart.find((item) => item.mealId === meal.id);
                const seller = SELLERS.find((item) => item.id === meal.sellerId);
                return (
                  <article key={meal.id} className="meal-discovery-card">
                    <div
                      onClick={() => onNavigate("meal-detail", { mealId: meal.id })}
                      className="meal-card-main cursor-pointer"
                    >
                      <div className="relative shrink-0">
                        <img src={meal.image} alt={meal.name} />
                        <div className="absolute top-1.5 left-1.5">
                          <VegBadge small />
                        </div>
                        {!meal.available && <span className="availability-pill unavailable">Sold Out</span>}
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <p className="text-[11px] font-semibold text-muted-foreground truncate">{meal.kitchen}</p>
                        <h3 className="mt-0.5 font-bold text-sm text-foreground truncate">{meal.name}</h3>
                        <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{meal.description}</p>
                        <div className="mt-2 flex items-center justify-between gap-1">
                          <span className="font-extrabold text-sm text-foreground">₹{meal.price}</span>
                          <span className="text-[10px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-md uppercase tracking-wider">{meal.mealType}</span>
                        </div>
                      </div>
                      {seller && <span className="provider-rating">★ {seller.rating}</span>}
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-border/60">
                      <button
                        onClick={() => onNavigate("meal-detail", { mealId: meal.id })}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold border border-border bg-secondary hover:bg-secondary/80 active:scale-95 transition-all text-foreground"
                      >
                        View
                      </button>
                      <button
                        disabled={!meal.available}
                        onClick={() => addMeal(meal)}
                        className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-primary text-stone-900 active:scale-95 transition-all shadow-2xs hover:brightness-105 disabled:opacity-40"
                      >
                        {inCart ? `+ Add Another (${inCart.quantity})` : "+ Add to Tiffin"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* Section 3: Subscription Plans */}
        {visiblePlans.length > 0 && (
          <section className="explore-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Dabba Subscription</p>
                <h2>Daily, Weekly & Monthly Plans</h2>
              </div>
            </div>
            <div className="plan-grid">
              {visiblePlans.map((plan) => {
                const meal = MEALS.find((item) => item.id === plan.mealId);
                return (
                  <article key={plan.id} className="plan-discovery-card flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-accent">{plan.duration} Plan</span>
                        <span className="text-xs font-semibold text-muted-foreground">{plan.meals} Meals</span>
                      </div>
                      <h3 className="mt-1 font-bold text-base text-foreground">{plan.name}</h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">{meal ? meal.kitchen : "Authentic Kitchen"}</p>
                    </div>
                    <div className="mt-4 flex items-end justify-between gap-3 pt-3 border-t border-border/60">
                      <div>
                        <strong className="text-lg font-extrabold text-foreground">₹{plan.price}</strong>
                        <span className="block text-[10px] text-muted-foreground font-semibold">₹{Math.round(plan.price / plan.meals)} / meal</span>
                      </div>
                      <button
                        onClick={() => onNavigate("plans")}
                        className="min-h-[38px] rounded-xl bg-accent px-4 text-xs font-bold text-white hover:brightness-110 active:scale-95 transition-all shadow-xs"
                      >
                        View Plan →
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* Empty State */}
        {matchingMeals.length === 0 && matchingSellers.length === 0 && (
          <div className="explore-empty">
            <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mx-auto text-2xl">
              🍱
            </div>
            <h2 className="mt-3 text-lg font-bold text-foreground">No matches found</h2>
            <p className="mt-1 text-xs text-muted-foreground max-w-xs mx-auto">
              We couldn't find any tiffins or kitchens matching your filters. Try clearing your search or filters.
            </p>
            <button
              onClick={() => setExploreState(DEFAULT_EXPLORE_STATE)}
              className="mt-4 min-h-[44px] rounded-2xl bg-primary px-6 text-xs font-bold text-stone-900 shadow-xs active:scale-95 transition-all"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      {/* Filter Modal */}
      {showFilters && (
        <div className="dialog-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setShowFilters(false)}>
          <div role="dialog" className="dialog-sheet">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h2 className="font-display text-lg font-bold">Refine Results</h2>
              <button onClick={() => setShowFilters(false)} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold">✕</button>
            </div>
            <div className="py-4 space-y-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Dietary Preference</p>
                <div className="flex flex-wrap gap-2">
                  {["Vegetarian", "Jain", "Low Oil", "High Protein"].map((d) => {
                    const active = draft.diets.includes(d);
                    return (
                      <button
                        key={d}
                        onClick={() => setDraft((c) => ({ ...c, diets: active ? c.diets.filter((x) => x !== d) : [...c.diets, d] }))}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${active ? "bg-accent text-white border-accent" : "bg-card border-border text-foreground"}`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Cuisine</p>
                <div className="flex flex-wrap gap-2">
                  {["Gujarati", "North Indian", "Kathiyawadi", "Home Food"].map((c) => {
                    const active = draft.cuisines.includes(c);
                    return (
                      <button
                        key={c}
                        onClick={() => setDraft((prev) => ({ ...prev, cuisines: active ? prev.cuisines.filter((x) => x !== c) : [...prev.cuisines, c] }))}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${active ? "bg-primary border-primary text-stone-900" : "bg-card border-border text-foreground"}`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Meal Type</p>
                <div className="flex flex-wrap gap-2">
                  {(["Lunch", "Dinner"] as const).map((mt) => {
                    const active = draft.mealTypes.includes(mt);
                    return (
                      <button
                        key={mt}
                        onClick={() => setDraft((prev) => ({ ...prev, mealTypes: active ? prev.mealTypes.filter((x) => x !== mt) : [...prev.mealTypes, mt] }))}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${active ? "bg-accent text-white border-accent" : "bg-card border-border text-foreground"}`}
                      >
                        {mt}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Plan Type</p>
                <div className="flex flex-wrap gap-2">
                  {(["All", "Daily", "Weekly", "Monthly"] as const).map((p) => {
                    const active = draft.plan === p;
                    return (
                      <button
                        key={p}
                        onClick={() => setDraft((prev) => ({ ...prev, plan: p }))}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${active ? "bg-foreground text-background border-foreground" : "bg-card border-border text-foreground"}`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-3 border-t border-border">
              <SecondaryButton label="Clear Filters" onClick={() => setDraft(DEFAULT_EXPLORE_STATE)} />
              <PrimaryButton label="Apply Filters" onClick={() => { setExploreState(draft); setShowFilters(false); }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Screen: Seller Profile ───────────────────────────────────────────────────

function FunctionalSellerProfileScreen({
  sellerId,
  onBack,
  onNavigate,
}: {
  sellerId: string;
  onBack: () => void;
  onNavigate: (s: Screen, data?: unknown) => void;
}) {
  const { cart, setCart, deliveryLocation, showToast } = useAppData();
  const seller = SELLERS.find((item) => item.id === sellerId) ?? SELLERS[0];
  const meals = MEALS.filter((meal) => meal.sellerId === seller.id);
  const delivers = sellerDeliversTo(seller, deliveryLocation);

  const addMeal = (meal: Meal) => {
    setCart((current) => addItemToCart(current, { mealId: meal.id, quantity: 1 }));
    showToast(`Added "${meal.name}" to cart!`);
  };

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex-1 overflow-y-auto pb-28">
        <div className="relative h-56 sm:h-64">
          <img src={seller.img} alt={seller.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/30 to-transparent" />
          <button
            onClick={onBack}
            aria-label="Back"
            className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-stone-900 shadow-md active:scale-95 transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="absolute inset-x-4 bottom-4 text-white">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-stone-950 uppercase tracking-wider">
              Verified Kitchen
            </span>
            <h1 className="font-display text-2xl font-bold mt-1">{seller.name}</h1>
            <p className="text-xs text-white/80">{seller.tagline}</p>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className={`p-3.5 rounded-2xl border ${delivers ? "bg-green-50/70 border-green-200 text-green-950" : "bg-amber-50 border-amber-200 text-amber-950"}`}>
            <p className="text-xs font-bold">{delivers ? `Delivers to ${deliveryLocation.locality} in ${seller.delivery}` : "Outside standard delivery area"}</p>
          </div>

          <div>
            <h2 className="font-bold text-base text-foreground mb-3">Kitchen Menu</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {meals.map((meal) => (
                <div key={meal.id} className="p-3.5 rounded-2xl border border-border bg-card shadow-2xs flex flex-col justify-between">
                  <div className="flex gap-3">
                    <img src={meal.image} alt={meal.name} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                    <div>
                      <h3 className="font-bold text-sm text-foreground">{meal.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{meal.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/60">
                    <span className="font-bold text-base">₹{meal.price}</span>
                    <button
                      onClick={() => addMeal(meal)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-primary text-stone-900 active:scale-95 transition-all"
                    >
                      + Add to Tiffin
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {cart.length > 0 && (
        <div className="p-3 border-t border-border bg-card/95 backdrop-blur-md">
          <PrimaryButton
            label={`View Cart (${cartItemCount(cart)} items)`}
            onClick={() => onNavigate("cart")}
          />
        </div>
      )}
    </div>
  );
}

// ─── Screen: Meal Detail ─────────────────────────────────────────────────────

function FunctionalMealDetailScreen({
  mealId,
  onBack,
  onNavigate,
}: {
  mealId: string;
  onBack: () => void;
  onNavigate: (s: Screen) => void;
}) {
  const { setCart, showToast } = useAppData();
  const meal = MEALS.find((item) => item.id === mealId) ?? MEALS[0];
  const [quantity, setQuantity] = useState(1);
  const [slot, setSlot] = useState("1:00–1:30 PM");

  const addAndGo = () => {
    setCart((current) => addItemToCart(current, { mealId: meal.id, quantity }));
    showToast(`Added ${quantity}x "${meal.name}" to cart!`);
    onNavigate("cart");
  };

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex-1 overflow-y-auto pb-28">
        <div className="relative h-64 sm:h-72">
          <img src={meal.image} alt={meal.name} className="h-full w-full object-cover" />
          <button
            onClick={onBack}
            aria-label="Back"
            className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-stone-900 shadow-md active:scale-95 transition-all"
          >
            <ChevronLeft size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4 max-w-xl mx-auto w-full">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <VegBadge />
              <span className="text-xs font-bold text-accent">{meal.kitchen}</span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <h1 className="font-display text-2xl font-bold">{meal.name}</h1>
              <span className="text-2xl font-extrabold text-foreground">₹{meal.price}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{meal.description}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-secondary/50 border border-border space-y-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Delivery Time Slot
              </label>
              <select
                value={slot}
                onChange={(e) => setSlot(e.target.value)}
                className="w-full rounded-xl border border-border bg-card p-2.5 text-sm font-semibold outline-none"
              >
                <option>Lunch: 1:00–1:30 PM</option>
                <option>Lunch: 1:30–2:00 PM</option>
                <option>Dinner: 7:30–8:00 PM</option>
                <option>Dinner: 8:00–8:30 PM</option>
              </select>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-sm font-bold text-foreground">Select Quantity</span>
              <QuantitySelector value={quantity} onChange={setQuantity} />
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 border-t border-border bg-card/95 backdrop-blur-md">
        <PrimaryButton
          label={`Add to My Tiffin • ₹${meal.price * quantity}`}
          onClick={addAndGo}
        />
      </div>
    </div>
  );
}

// ─── Screen: Build Your Plate ────────────────────────────────────────────────

function BuildPlateScreen({ onBack, onNavigate }: { onBack: () => void; onNavigate: (s: Screen) => void }) {
  const { setCart, showToast } = useAppData();
  const [step, setStep] = useState(0);
  const seller = SELLERS[0];
  const menu = PLATE_MENUS[seller.id];

  const [base, setBase] = useState(menu.bases[0].name);
  const [sabzi, setSabzi] = useState(menu.sabzis[0].name);
  const [protein, setProtein] = useState(menu.proteins[0].name);
  const [sides, setSides] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);

  const toggleSide = (name: string) => {
    setSides((prev) => prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]);
  };

  const optionPrice = (opts: PlateOption[], name: string) => opts.find((o) => o.name === name)?.price ?? 0;
  const plateTotal = optionPrice(menu.bases, base) + optionPrice(menu.sabzis, sabzi) + optionPrice(menu.proteins, protein)
    + sides.reduce((sum, s) => sum + optionPrice(menu.sides, s), 0);

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
    else onBack();
  };

  const addCustomPlate = () => {
    const meal = MEALS.find((m) => m.sellerId === seller.id) ?? MEALS[0];
    setCart((c) => addItemToCart(c, {
      mealId: meal.id,
      quantity,
      customPlate: {
        sellerId: seller.id,
        base,
        sabzi,
        protein,
        sides,
        preferences: ["Custom homestyle plate"],
        unitPrice: plateTotal,
      },
    }));
    showToast("Custom plate added to your tiffin!");
    onNavigate("cart");
  };

  return (
    <div className="flex h-full flex-col bg-background">
      <TopBar title="Build Your Plate" onBack={handleBack} />
      <div className="flex-1 overflow-y-auto p-4 max-w-xl mx-auto w-full space-y-4 pb-28">
        <div className="flex items-center gap-1.5 justify-center py-2">
          {["Base", "Sabzi", "Dal/Curry", "Sides"].map((s, idx) => (
            <div key={s} className="flex items-center gap-1.5">
              <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${idx <= step ? "bg-accent text-white" : "bg-secondary text-muted-foreground"}`}>
                {idx + 1}
              </span>
              <span className="text-xs font-semibold">{s}</span>
              {idx < 3 && <span className="text-muted-foreground">•</span>}
            </div>
          ))}
        </div>

        {step === 0 && (
          <div className="space-y-3">
            <h2 className="font-bold text-base text-foreground">1. Choose your base</h2>
            <div className="grid gap-2">
              {menu.bases.map((opt) => (
                <button
                  key={opt.name}
                  onClick={() => setBase(opt.name)}
                  className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all active:scale-98 ${base === opt.name ? "border-accent bg-accent/10 font-bold text-accent" : "border-border bg-card"}`}
                >
                  <span>{opt.name}</span>
                  <span>₹{opt.price}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            <h2 className="font-bold text-base text-foreground">2. Choose your fresh sabzi</h2>
            <div className="grid gap-2">
              {menu.sabzis.map((opt) => (
                <button
                  key={opt.name}
                  onClick={() => setSabzi(opt.name)}
                  className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all active:scale-98 ${sabzi === opt.name ? "border-accent bg-accent/10 font-bold text-accent" : "border-border bg-card"}`}
                >
                  <span>{opt.name}</span>
                  <span>₹{opt.price}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <h2 className="font-bold text-base text-foreground">3. Choose dal or protein</h2>
            <div className="grid gap-2">
              {menu.proteins.map((opt) => (
                <button
                  key={opt.name}
                  onClick={() => setProtein(opt.name)}
                  className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all active:scale-98 ${protein === opt.name ? "border-accent bg-accent/10 font-bold text-accent" : "border-border bg-card"}`}
                >
                  <span>{opt.name}</span>
                  <span>₹{opt.price}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <h2 className="font-bold text-base text-foreground">4. Add refreshing sides</h2>
            <div className="grid gap-2">
              {menu.sides.map((opt) => {
                const active = sides.includes(opt.name);
                return (
                  <button
                    key={opt.name}
                    onClick={() => toggleSide(opt.name)}
                    className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all active:scale-98 ${active ? "border-accent bg-accent/10 font-bold text-accent" : "border-border bg-card"}`}
                  >
                    <span>{opt.name}</span>
                    <span>+₹{opt.price}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="p-3.5 rounded-2xl bg-secondary/50 border border-border text-xs space-y-1">
          <p className="font-bold text-foreground">Current Plate:</p>
          <p className="text-muted-foreground">{base} · {sabzi} · {protein} {sides.length ? `· ${sides.join(", ")}` : ""}</p>
          <p className="font-bold text-accent pt-1">Price per plate: ₹{plateTotal}</p>
        </div>
      </div>

      <div className="p-3 border-t border-border bg-card/95 backdrop-blur-md flex gap-2">
        {step < 3 ? (
          <PrimaryButton label="Next Step →" onClick={() => setStep(step + 1)} />
        ) : (
          <PrimaryButton label={`Add Plate to Tiffin • ₹${plateTotal * quantity}`} onClick={addCustomPlate} />
        )}
      </div>
    </div>
  );
}

// ─── Screen: Cart ─────────────────────────────────────────────────────────────

function CartScreen({ onBack, onNavigate }: { onBack: () => void; onNavigate: (s: Screen) => void }) {
  const { cart, setCart, setCheckoutDraft, address, authSession, setAuthRedirectTarget } = useAppData();

  const cartDetails = cart.map((item) => {
    const meal = MEALS.find((m) => m.id === item.mealId) ?? MEALS[0];
    const seller = SELLERS.find((s) => s.id === (item.customPlate?.sellerId ?? meal.sellerId)) ?? SELLERS[0];
    return { item, meal, seller };
  });

  const subtotal = cartDetails.reduce((sum, { item, meal }) => sum + (item.customPlate?.unitPrice ?? meal.price) * item.quantity, 0);
  const deliveryFee = cartDetails.length > 0 ? 15 : 0;
  const total = subtotal + deliveryFee;
  const itemCount = cartItemCount(cart);

  const updateQuantity = (index: number, qty: number) => {
    if (qty <= 0) {
      setCart((c) => c.filter((_, i) => i !== index));
    } else {
      setCart((c) => c.map((it, i) => i === index ? { ...it, quantity: qty } : it));
    }
  };

  const handleCheckout = () => {
    if (cartDetails.length === 0) return;
    const first = cartDetails[0].item;
    setCheckoutDraft({
      kind: "meal",
      mealId: first.mealId,
      quantity: first.quantity,
      customPlate: first.customPlate,
      items: cart,
    });
    if (!authSession) {
      setAuthRedirectTarget("checkout");
      onNavigate("login");
    } else {
      onNavigate("checkout");
    }
  };

  if (cartDetails.length === 0) {
    return (
      <div className="flex flex-col h-full bg-background">
        <TopBar title="Your Tiffin" onBack={onBack} />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 rounded-3xl bg-secondary flex items-center justify-center text-4xl mb-3 shadow-inner">
            🛒
          </div>
          <h2 className="font-display text-xl font-bold text-foreground">Your tiffin is empty</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            Add hot rotli, seasonal sabzi, and nutritious dal from Ahmedabad's top home kitchens.
          </p>
          <div className="mt-5 w-full max-w-xs space-y-2">
            <PrimaryButton label="Browse Today's Meals" onClick={() => onNavigate("explore")} />
            <button onClick={onBack} className="w-full py-2.5 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground">
              Return to Previous Screen
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <TopBar title="Your Tiffin" onBack={onBack} />
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-32 max-w-xl mx-auto w-full">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-lg text-foreground">{itemCount} Items in Dabba</h2>
          <button onClick={() => setCart([])} className="text-xs font-bold text-red-600 hover:underline">
            Clear all
          </button>
        </div>

        <div className="space-y-2.5">
          {cartDetails.map(({ item, meal, seller }, idx) => {
            const unitPrice = item.customPlate?.unitPrice ?? meal.price;
            return (
              <div key={idx} className="p-3.5 rounded-2xl border border-border bg-card shadow-2xs space-y-2.5">
                <div className="flex gap-3">
                  <img src={meal.image} alt={meal.name} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground font-semibold">{seller.name}</p>
                    <h3 className="font-bold text-sm text-foreground truncate">
                      {item.customPlate ? "Your Custom Plate" : meal.name}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {item.customPlate ? [item.customPlate.base, item.customPlate.sabzi].join(" · ") : meal.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-border/50">
                  <QuantitySelector value={item.quantity} onChange={(q) => updateQuantity(idx, q)} />
                  <span className="font-extrabold text-base text-foreground">₹{unitPrice * item.quantity}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Address Card */}
        <div className="p-3.5 rounded-2xl border border-border bg-card space-y-1.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <MapPinIcon size={12} color="var(--primary)" /> Delivering To
            </span>
            <button onClick={() => onNavigate("location")} className="text-xs font-bold text-accent hover:underline">
              Change
            </button>
          </div>
          <p className="text-xs font-semibold text-foreground">{address}</p>
        </div>

        {/* Bill Summary */}
        <div className="p-3.5 rounded-2xl border border-border bg-card space-y-2 text-xs shadow-2xs">
          <p className="font-bold text-sm text-foreground mb-1">Bill Summary</p>
          <div className="flex justify-between text-muted-foreground">
            <span>Item Subtotal</span>
            <span>₹{subtotal}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Delivery Partner Fee</span>
            <span>₹{deliveryFee}</span>
          </div>
          <div className="flex justify-between font-extrabold text-base text-foreground pt-2 border-t border-border">
            <span>Total to Pay</span>
            <span>₹{total}</span>
          </div>
        </div>

        <button
          onClick={() => onNavigate("explore")}
          className="w-full py-2.5 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground text-center"
        >
          + Add more items from Ahmedabad kitchens
        </button>
      </div>

      {/* Redesigned Prominent Checkout Button */}
      <div className="p-3 border-t border-border bg-card/95 backdrop-blur-md sticky bottom-0 z-20">
        <button
          onClick={handleCheckout}
          className="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl font-bold text-sm bg-primary text-stone-950 active:scale-[0.98] transition-all shadow-md hover:brightness-105 min-h-[52px]"
        >
          <div className="text-left">
            <span className="text-xs font-bold opacity-80 block">{itemCount} {itemCount === 1 ? "Item" : "Items"}</span>
            <span className="text-base font-extrabold">₹{total}</span>
          </div>
          <div className="flex items-center gap-1 font-bold">
            <span>{!authSession ? "Sign in to Checkout" : "Proceed to Checkout"}</span>
            <ChevronRight size={18} />
          </div>
        </button>
      </div>
    </div>
  );
}

// ─── Screen: Checkout ────────────────────────────────────────────────────────

function CheckoutScreen({ onBack, onNavigate }: { onBack: () => void; onNavigate: (s: Screen) => void }) {
  const { checkoutDraft, setCheckoutDraft, address, setAddress, setCart, setOrders, setActiveOrderId, setConfirmedOrder, setShowOrderSuccessPopup } = useAppData();
  const [payment, setPayment] = useState("UPI");
  const [schedule, setSchedule] = useState("Lunch · 1:00–1:30 PM");
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [editingAddress, setEditingAddress] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [instructions, setInstructions] = useState("");

  const isSubscription = checkoutDraft?.kind === "subscription";
  const checkoutItems = checkoutDraft?.kind === "meal" ? (checkoutDraft.items ?? []) : [];
  const meal = MEALS.find((m) => m.id === checkoutDraft?.mealId) ?? MEALS[0];

  const subtotal = isSubscription
    ? (checkoutDraft.plan === "Weekly" ? 495 : 1800)
    : checkoutItems.reduce((sum, it) => {
        const itemMeal = MEALS.find((m) => m.id === it.mealId) ?? MEALS[0];
        return sum + (it.customPlate?.unitPrice ?? itemMeal.price) * it.quantity;
      }, 0);

  const deliveryFee = isSubscription ? 0 : 15;
  let discount = 0;
  if (appliedCoupon === "WELCOME50" && subtotal >= 100) discount = 50;
  if (appliedCoupon === "HOMELY10") discount = Math.round(subtotal * 0.1);
  if (appliedCoupon === "TIFFIN10") discount = 10;
  const total = Math.max(0, subtotal + deliveryFee - discount);

  const applyCouponCode = (code: string) => {
    const clean = code.trim().toUpperCase();
    if (clean === "WELCOME50" || clean === "HOMELY10" || clean === "TIFFIN10") {
      setAppliedCoupon(clean);
      setCoupon(clean);
      setError("");
    } else {
      setError("Invalid coupon. Try WELCOME50 or HOMELY10.");
    }
  };

  const confirmOrder = () => {
    if (submitting) return;
    if (!address.trim()) {
      setError("Please add your delivery address.");
      return;
    }
    setSubmitting(true);
    setError("");

    const orderId = `TB${Date.now().toString().slice(-5)}`;
    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const orderTitle = isSubscription
      ? `${checkoutDraft.plan} Tiffin Plan`
      : checkoutItems.length === 1
        ? (checkoutItems[0].customPlate ? "Custom Homestyle Plate" : meal.name)
        : `${cartItemCount(checkoutItems)} meals from local kitchens`;

    const newOrder: ConfirmedOrder = {
      id: orderId,
      kind: isSubscription ? "subscription" : "meal",
      title: orderTitle,
      kitchen: isSubscription ? meal.kitchen : "Ramaben's Kitchen",
      amount: total,
      quantity: isSubscription ? undefined : cartItemCount(checkoutItems),
      address: address.trim(),
      schedule,
      payment,
      placedAt: `${nowTime}, Today`,
      status: "Order Placed",
      currentStep: 0,
      estimatedDeliveryTime: "25–35 min",
    };

    window.setTimeout(() => {
      setOrders((prev) => [newOrder, ...prev]);
      setActiveOrderId(newOrder.id);
      setConfirmedOrder(newOrder);
      setShowOrderSuccessPopup(true);
      setCart([]);
      setCheckoutDraft(null);
      setSubmitting(false);
      onNavigate("home");
    }, 450);
  };

  if (!checkoutDraft) {
    return (
      <div className="flex flex-col h-full bg-background">
        <TopBar title="Checkout" onBack={onBack} />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <p className="font-bold text-lg">Nothing to checkout</p>
          <PrimaryButton label="Browse Tiffins" onClick={() => onNavigate("home")} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <TopBar title="Confirm Order" onBack={onBack} />
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-32 max-w-xl mx-auto w-full">
        {/* Deliver to card */}
        <div className="p-3.5 rounded-2xl border border-border bg-card shadow-2xs space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <MapPinIcon size={12} color="var(--primary)" /> Delivery Location
            </span>
            <div className="flex gap-2">
              <button onClick={() => setEditingAddress(!editingAddress)} className="text-xs font-bold text-accent">
                {editingAddress ? "Done" : "Edit"}
              </button>
              <button onClick={() => onNavigate("location")} className="text-xs font-bold text-muted-foreground hover:text-foreground">
                Map
              </button>
            </div>
          </div>
          {editingAddress ? (
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-border bg-secondary/30 p-2 text-xs focus:ring-2 focus:ring-primary outline-none"
            />
          ) : (
            <p className="text-xs font-semibold text-foreground">{address}</p>
          )}
        </div>

        {/* Items summary */}
        <div className="p-3.5 rounded-2xl border border-border bg-card shadow-2xs space-y-2">
          <p className="font-bold text-sm text-foreground">
            {isSubscription ? "Subscription Details" : `Order Summary (${cartItemCount(checkoutItems)} items)`}
          </p>
          {isSubscription ? (
            <div className="flex items-center gap-3 py-1">
              <img src={meal.image} alt={meal.name} className="w-14 h-14 rounded-xl object-cover" />
              <div>
                <p className="font-bold text-sm">{checkoutDraft.plan} Tiffin Plan</p>
                <p className="text-xs text-muted-foreground">{meal.kitchen} • {checkoutDraft.mealType}</p>
                <p className="text-xs font-bold text-accent">₹{subtotal} / billing period</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {checkoutItems.map((it, idx) => {
                const itemMeal = MEALS.find((m) => m.id === it.mealId) ?? MEALS[0];
                return (
                  <div key={idx} className="py-2 flex items-center justify-between text-xs first:pt-0 last:pb-0">
                    <span className="font-semibold text-foreground truncate max-w-[190px]">
                      {it.quantity}x {it.customPlate ? "Custom Plate" : itemMeal.name}
                    </span>
                    <span className="font-bold text-foreground">
                      ₹{(it.customPlate?.unitPrice ?? itemMeal.price) * it.quantity}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Delivery Slot Dropdown */}
        <div className="p-3.5 rounded-2xl border border-border bg-card shadow-2xs space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
            Scheduled Delivery Time
          </label>
          <select
            value={schedule}
            onChange={(e) => setSchedule(e.target.value)}
            className="w-full rounded-xl border border-border bg-secondary/40 p-2.5 text-xs font-semibold outline-none"
          >
            <option>Lunch · 1:00–1:30 PM</option>
            <option>Lunch · 1:30–2:00 PM</option>
            <option>Dinner · 7:30–8:00 PM</option>
            <option>Dinner · 8:00–8:30 PM</option>
          </select>
        </div>

        {/* Delivery Instructions */}
        <div className="p-3.5 rounded-2xl border border-border bg-card shadow-2xs space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Delivery Instructions</p>
          <div className="flex flex-wrap gap-1.5">
            {["Leave at door", "Ring bell", "Avoid plastic cutlery"].map((chip) => (
              <button
                key={chip}
                onClick={() => setInstructions((prev) => prev.includes(chip) ? prev.replace(chip, "").trim() : `${prev} ${chip}`.trim())}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all ${instructions.includes(chip) ? "bg-accent/15 border-accent text-accent" : "border-border bg-secondary/40 text-muted-foreground"}`}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Coupons */}
        <div className="p-3.5 rounded-2xl border border-border bg-card shadow-2xs space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Apply Promo Code</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              placeholder="e.g. WELCOME50"
              className="flex-1 rounded-xl border border-border bg-secondary/30 px-3 py-2 text-xs uppercase font-mono font-bold outline-none"
            />
            <button
              onClick={() => appliedCoupon ? setAppliedCoupon(null) : applyCouponCode(coupon)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-accent text-white"
            >
              {appliedCoupon ? "Remove" : "Apply"}
            </button>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={() => applyCouponCode("WELCOME50")} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-secondary text-foreground border border-border">
              WELCOME50 (₹50 off)
            </button>
            <button onClick={() => applyCouponCode("HOMELY10")} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-secondary text-foreground border border-border">
              HOMELY10 (10% off)
            </button>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="p-3.5 rounded-2xl border border-border bg-card shadow-2xs space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select Payment Mode</p>
          <div className="grid gap-2">
            {[
              { id: "UPI", label: "UPI (Google Pay / PhonePe / Paytm)" },
              { id: "Cash on Delivery", label: "Cash on Delivery (Pay on handoff)" },
              { id: "Credit/Debit Card", label: "Credit or Debit Card" },
              { id: "Net Banking", label: "Net Banking" },
            ].map((p) => {
              const selected = payment === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setPayment(p.id)}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between text-xs font-bold transition-all ${selected ? "border-accent bg-accent/10 text-accent font-extrabold" : "border-border bg-secondary/20"}`}
                >
                  <span>{p.label}</span>
                  {selected && <CheckIcon size={14} color="var(--accent)" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Total breakdown */}
        <div className="p-3.5 rounded-2xl border border-border bg-card shadow-2xs space-y-2 text-xs">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>₹{subtotal}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Delivery partner fee</span>
            <span>{deliveryFee === 0 ? "Free" : `₹${deliveryFee}`}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-accent font-bold">
              <span>Promo Discount ({appliedCoupon})</span>
              <span>−₹{discount}</span>
            </div>
          )}
          <div className="flex justify-between font-extrabold text-base text-foreground pt-2 border-t border-border">
            <span>Final Total</span>
            <span>₹{total}</span>
          </div>
        </div>

        {error && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* Place Order CTA */}
      <div className="p-3 border-t border-border bg-card/95 backdrop-blur-md sticky bottom-0 z-20">
        <PrimaryButton
          label={submitting ? "Placing your order…" : `Place Order • ₹${total}`}
          onClick={confirmOrder}
          loading={submitting}
        />
      </div>
    </div>
  );
}

// ─── Screen: Order Tracking ───────────────────────────────────────────────────

function OrderTrackingScreen({ onBack }: { onBack: () => void }) {
  const { confirmedOrder, setOrders } = useAppData();
  const stages: { label: string; detail: string }[] = [
    { label: "Order Placed", detail: "Kitchen received your order" },
    { label: "Order Confirmed", detail: "Kitchen accepted and verified ingredients" },
    { label: "Preparing Tiffin", detail: "Fresh homemade rotli and dal being packed" },
    { label: "Out for Delivery", detail: "Delivery partner Rajesh is on the way" },
    { label: "Delivered", detail: "Tiffin handed over safely at your door" },
  ];

  const order = confirmedOrder ?? {
    id: "TB1042",
    kind: "meal",
    title: "Ghar Jaisa Tiffin",
    kitchen: "Ramaben's Kitchen",
    amount: 145,
    address: "Vastrapur, Ahmedabad",
    schedule: "Lunch · 1:00–1:30 PM",
    payment: "UPI",
    placedAt: "1:15 PM, Today",
    status: "Preparing" as OrderStatus,
    currentStep: 2,
    estimatedDeliveryTime: "25–35 min",
  };

  const [step, setStep] = useState(order.currentStep ?? 2);
  const isDelivered = step === 4;

  const advanceStage = () => {
    const nextStep = step >= 4 ? 0 : step + 1;
    setStep(nextStep);
    const nextStatus: OrderStatus = nextStep === 0 ? "Order Placed"
      : nextStep === 1 ? "Order Confirmed"
      : nextStep === 2 ? "Preparing"
      : nextStep === 3 ? "Out for Delivery"
      : "Delivered";

    const actualDeliveredTime = nextStep === 4 ? `${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}, Today` : order.deliveredAt;

    setOrders((prev) => prev.map((o) => o.id === order.id ? {
      ...o,
      currentStep: nextStep,
      status: nextStatus,
      deliveredAt: actualDeliveredTime,
    } : o));
  };

  return (
    <div className="flex h-full flex-col bg-background">
      <TopBar title="Order Tracking" onBack={onBack} />
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-12 max-w-xl mx-auto w-full">
        {/* Hero status */}
        <div className="p-4 rounded-3xl border border-border bg-card shadow-xs space-y-3 text-center">
          <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-3xl bg-secondary">
            {isDelivered ? "🎉" : "🛵"}
          </div>
          <div>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isDelivered ? "bg-green-100 text-green-900" : "bg-amber-100 text-amber-900"}`}>
              {stages[step].label}
            </span>
            <h2 className="font-display text-xl font-bold mt-1 text-foreground">
              {isDelivered ? "Meal Delivered Successfully!" : stages[step].detail}
            </h2>
          </div>

          <div className="p-3 rounded-2xl bg-secondary/50 border border-border/80 text-xs space-y-1.5 text-left">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order ID</span>
              <span className="font-bold">#{order.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Kitchen</span>
              <span className="font-semibold">{order.kitchen}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Delivery Address</span>
              <span className="font-medium truncate max-w-[200px]">{order.address}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-border/60">
              <span className="text-muted-foreground">{isDelivered ? "Actual Delivery Time" : "Estimated Arrival"}</span>
              <span className="font-extrabold text-accent">
                {isDelivered ? (order.deliveredAt ?? "1:42 PM, Today") : order.estimatedDeliveryTime}
              </span>
            </div>
            {isDelivered && (
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>Original Estimated ETA</span>
                <span>{order.estimatedDeliveryTime}</span>
              </div>
            )}
          </div>
        </div>

        {/* 5 Stages Progress */}
        <div className="p-4 rounded-3xl border border-border bg-card shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-foreground">Delivery Steps</h3>
            <button
              onClick={advanceStage}
              className="px-3 py-1 rounded-xl text-xs font-bold bg-secondary hover:bg-secondary/80 border border-border text-foreground active:scale-95 transition-all"
            >
              {isDelivered ? "Replay Demo" : "Advance Stage (Demo)"}
            </button>
          </div>

          <div className="space-y-4">
            {stages.map((st, idx) => {
              const done = idx < step;
              const current = idx === step;
              return (
                <div key={st.label} className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${done ? "bg-accent text-white" : current ? "bg-primary text-stone-950 ring-4 ring-primary/20" : "bg-secondary text-muted-foreground"}`}>
                    {done ? "✓" : idx + 1}
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${current ? "text-accent" : done ? "text-foreground" : "text-muted-foreground"}`}>
                      {st.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{st.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Delivery Partner */}
        <div className="p-3.5 rounded-2xl border border-border bg-card flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-sm">
              RK
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">Rajesh K. • Delivery Partner</p>
              <p className="text-[11px] text-muted-foreground">4.9 ★ • Ahmedabad Central</p>
            </div>
          </div>
          <div className="flex gap-2">
            <a href="tel:+919876543210" className="px-3 py-1.5 rounded-xl border border-border bg-secondary text-xs font-bold">
              Call
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Screen: Orders ───────────────────────────────────────────────────────────

function OrdersScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const { orders, setCart, showToast, setActiveOrderId } = useAppData();
  const [tab, setTab] = useState<"active" | "past">("active");

  const activeOrders = orders.filter((o) => o.status !== "Delivered" && o.status !== "Cancelled");
  const pastOrders = orders.filter((o) => o.status === "Delivered" || o.status === "Cancelled");

  const reorder = (o: ConfirmedOrder) => {
    const defaultMeal = MEALS[0];
    setCart([{ mealId: defaultMeal.id, quantity: 1 }]);
    showToast(`Added "${defaultMeal.name}" to cart!`);
    onNavigate("cart");
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold text-foreground">Your Orders</h1>
      </div>

      <div className="flex px-4 gap-2 mb-3">
        {(["active", "past"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all ${tab === t ? "bg-primary text-stone-950 font-extrabold shadow-xs" : "bg-card border border-border text-muted-foreground"}`}
          >
            {t} {t === "active" ? `(${activeOrders.length})` : `(${pastOrders.length})`}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-28 space-y-3">
        {tab === "active" ? (
          activeOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-card rounded-3xl border border-border mt-4">
              <span className="text-4xl mb-2">🍱</span>
              <p className="font-bold text-sm text-foreground">No active orders right now</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                When you order a freshly prepared tiffin, live tracking will appear here.
              </p>
              <button
                onClick={() => onNavigate("explore")}
                className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-primary text-stone-950"
              >
                Browse Today's Tiffins
              </button>
            </div>
          ) : (
            activeOrders.map((o) => (
              <div key={o.id} className="p-4 rounded-2xl border border-border bg-card shadow-2xs space-y-2.5">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-muted-foreground">Order #{o.id}</span>
                    <h3 className="font-bold text-sm text-foreground">{o.title}</h3>
                    <p className="text-xs text-muted-foreground">{o.kitchen}</p>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                    {o.status}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                  <span className="font-bold">₹{o.amount}</span>
                  <button
                    onClick={() => {
                      setActiveOrderId(o.id);
                      onNavigate("order-tracking");
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-primary text-stone-950 text-xs font-bold"
                  >
                    Track Live →
                  </button>
                </div>
              </div>
            ))
          )
        ) : (
          pastOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-card rounded-3xl border border-border mt-4">
              <span className="text-4xl mb-2">📦</span>
              <p className="font-bold text-sm text-foreground">No past orders yet</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                Your completed meal orders and delivery receipts will be saved here.
              </p>
            </div>
          ) : (
            pastOrders.map((o) => (
              <div key={o.id} className="p-4 rounded-2xl border border-border bg-card shadow-2xs space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] text-muted-foreground font-mono">#{o.id} • {o.deliveredAt ?? o.placedAt}</p>
                    <h3 className="font-bold text-sm text-foreground">{o.title}</h3>
                    <p className="text-xs text-muted-foreground">{o.kitchen}</p>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-900">
                    Delivered
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                  <span className="font-bold">₹{o.amount}</span>
                  <button
                    onClick={() => reorder(o)}
                    className="px-3 py-1 rounded-xl border border-border bg-secondary text-xs font-bold"
                  >
                    Reorder
                  </button>
                </div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
}

// ─── Screen: Plans ───────────────────────────────────────────────────────────

function FunctionalPlansScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const { subscription, setSubscription, setCheckoutDraft } = useAppData();
  const [selectedDuration, setSelectedDuration] = useState<"Weekly" | "Monthly">("Weekly");
  const [selectedSlot, setSelectedSlot] = useState<"Lunch" | "Dinner">("Lunch");
  const [notice, setNotice] = useState("");

  const hasActiveSub = Boolean(subscription && subscription.status !== "Cancelled");

  const startSubscription = (planOption: PlanOption) => {
    setCheckoutDraft({
      kind: "subscription",
      plan: planOption.duration as "Weekly" | "Monthly",
      planOptionId: planOption.id,
      mealId: planOption.mealId,
      mealType: selectedSlot,
    });
    onNavigate("checkout");
  };

  const pausePlan = () => {
    if (!subscription) return;
    setSubscription({ ...subscription, status: "Paused" });
    setNotice("Plan paused. You won't be charged for paused delivery days.");
  };

  const resumePlan = () => {
    if (!subscription) return;
    setSubscription({ ...subscription, status: "Active" });
    setNotice("Plan resumed! Deliveries will continue as scheduled.");
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background pb-28">
      <div className="p-4 max-w-xl mx-auto w-full space-y-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-accent">Daily Meal Membership</p>
          <h1 className="font-display text-2xl font-bold text-foreground">My Tiffin</h1>
        </div>

        {notice && (
          <div className="p-3 rounded-2xl bg-green-50 border border-green-200 text-xs text-green-900 flex justify-between">
            <span>{notice}</span>
            <button onClick={() => setNotice("")} className="font-bold">✕</button>
          </div>
        )}

        {/* First-Time User Experience (No active plan) */}
        {!hasActiveSub ? (
          <div className="space-y-4">
            <div className="p-4 rounded-3xl border border-border bg-card shadow-xs space-y-2">
              <h2 className="font-display text-lg font-bold">Simplify your daily meals</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Wholesome Gujarati & North Indian meals delivered automatically every weekday across Ahmedabad.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => setSelectedDuration("Weekly")}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${selectedDuration === "Weekly" ? "border-accent bg-accent/10 text-accent font-extrabold" : "border-border bg-secondary/30"}`}
                >
                  Weekly (5 Days)
                </button>
                <button
                  onClick={() => setSelectedDuration("Monthly")}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${selectedDuration === "Monthly" ? "border-accent bg-accent/10 text-accent font-extrabold" : "border-border bg-secondary/30"}`}
                >
                  Monthly (20 Days)
                </button>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-sm text-foreground mb-2">Available Ahmedabad Tiffin Kitchens</h3>
              <div className="space-y-3">
                {PLAN_OPTIONS.filter((p) => p.duration === selectedDuration).map((plan) => {
                  const kitchenMeal = MEALS.find((m) => m.id === plan.mealId) ?? MEALS[0];
                  return (
                    <div key={plan.id} className="p-4 rounded-2xl border border-border bg-card shadow-2xs space-y-2.5">
                      <div className="flex gap-3">
                        <img src={kitchenMeal.image} alt={plan.name} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                        <div>
                          <h4 className="font-bold text-sm text-foreground">{plan.name}</h4>
                          <p className="text-xs text-muted-foreground">{kitchenMeal.kitchen}</p>
                          <p className="text-xs text-accent font-extrabold mt-1">₹{plan.price} / {plan.meals} meals</p>
                        </div>
                      </div>
                      <PrimaryButton label="Subscribe to this Plan" onClick={() => startSubscription(plan)} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* Active Subscription Management for Subscribers */
          <div className="space-y-4">
            <div className="p-4 rounded-3xl border border-border bg-card shadow-xs space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                    {subscription?.status}
                  </span>
                  <h2 className="font-display text-lg font-bold mt-1">{subscription?.plan} Tiffin Plan</h2>
                  <p className="text-xs text-muted-foreground">{subscription?.kitchen}</p>
                </div>
                <span className="font-extrabold text-lg text-foreground">₹{subscription?.price}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-1 border-t border-border">
                <div>Remaining: <strong>{subscription?.remainingMeals} meals</strong></div>
                <div>Slot: <strong>{subscription?.mealType}</strong></div>
              </div>
              <div className="flex gap-2 pt-1">
                {subscription?.status === "Paused" ? (
                  <button onClick={resumePlan} className="flex-1 py-2.5 rounded-xl bg-accent text-white text-xs font-bold">
                    Resume Plan
                  </button>
                ) : (
                  <button onClick={pausePlan} className="flex-1 py-2.5 rounded-xl bg-secondary border border-border text-xs font-bold">
                    Pause Plan
                  </button>
                )}
                <button
                  onClick={() => { setSubscription(null); setNotice("Subscription cancelled."); }}
                  className="px-3 py-2.5 rounded-xl border border-red-200 text-red-600 text-xs font-bold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Screen: Profile ──────────────────────────────────────────────────────────

function ProfileScreen({
  onNavigate,
  account,
  onSignOut,
}: {
  onNavigate: (s: Screen) => void;
  account: AuthSession | null;
  onSignOut: () => void;
}) {
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  return (
    <div className="flex-1 overflow-y-auto bg-background pb-28">
      <div className="p-4 max-w-xl mx-auto w-full space-y-4">
        {/* User Card */}
        <div className="p-4 rounded-3xl border border-border bg-card shadow-xs flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-primary text-stone-900 font-extrabold text-xl flex items-center justify-center">
            {account ? account.name.slice(0, 2).toUpperCase() : "TB"}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-base text-foreground truncate">{account?.name ?? "Guest Foodie"}</h2>
            <p className="text-xs text-muted-foreground truncate">{account?.email ?? "Browsing as guest"}</p>
            {!account && (
              <button
                onClick={() => onNavigate("login")}
                className="mt-1 text-xs font-bold text-accent underline"
              >
                Sign in or register →
              </button>
            )}
          </div>
        </div>

        {/* Menu list */}
        <div className="rounded-2xl border border-border bg-card divide-y divide-border/60 shadow-2xs overflow-hidden">
          {[
            { label: "Saved Addresses", icon: "📍", action: () => onNavigate("location") },
            { label: "Payment Methods", icon: "💳", action: () => setShowPaymentModal(true) },
            { label: "Order History", icon: "📦", action: () => onNavigate("orders") },
            { label: "Daily Tiffin Plans", icon: "📅", action: () => onNavigate("plans") },
            { label: "Help & Ahmedabad Helpline", icon: "💬", action: () => setShowSupportModal(true) },
          ].map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              className="w-full p-3.5 flex items-center justify-between text-left hover:bg-secondary/30 transition-colors text-xs font-bold text-foreground"
            >
              <div className="flex items-center gap-2.5">
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              <ChevronRight size={16} color="#A8A29E" />
            </button>
          ))}
        </div>

        {account && (
          <button
            onClick={onSignOut}
            className="w-full py-3 rounded-2xl border border-red-200 bg-red-50 text-red-700 text-xs font-bold hover:bg-red-100 transition-colors"
          >
            Sign Out
          </button>
        )}
      </div>

      {/* Help Modal */}
      {showSupportModal && (
        <div className="dialog-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setShowSupportModal(false)}>
          <div role="dialog" className="dialog-sheet space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h2 className="font-display font-bold text-base">Ahmedabad Support</h2>
              <button onClick={() => setShowSupportModal(false)} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold">✕</button>
            </div>
            <p className="text-xs text-muted-foreground">Got questions about your daily tiffin delivery or diet customisation?</p>
            <div className="p-3 rounded-xl bg-secondary/50 space-y-1 text-xs">
              <p><strong>Support Phone:</strong> +91 98765 43210</p>
              <p><strong>WhatsApp Support:</strong> Available 8 AM – 9 PM</p>
              <p><strong>Email:</strong> help@tiffinbuddy.ahmedabad.local</p>
            </div>
            <PrimaryButton label="Close" onClick={() => setShowSupportModal(false)} />
          </div>
        </div>
      )}

      {/* Payment Methods Modal */}
      {showPaymentModal && (
        <div className="dialog-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setShowPaymentModal(false)}>
          <div role="dialog" className="dialog-sheet space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h2 className="font-display font-bold text-base">Payment Options</h2>
              <button onClick={() => setShowPaymentModal(false)} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold">✕</button>
            </div>
            <p className="text-xs text-muted-foreground">Supported payment methods for instant meals and weekly memberships:</p>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl border border-border bg-secondary/20 flex items-center gap-2">
                <span>📱</span><span>Google Pay / PhonePe UPI</span>
              </div>
              <div className="p-2.5 rounded-xl border border-border bg-secondary/20 flex items-center gap-2">
                <span>💵</span><span>Cash on Delivery</span>
              </div>
              <div className="p-2.5 rounded-xl border border-border bg-secondary/20 flex items-center gap-2">
                <span>💳</span><span>Debit / Credit Cards & Net Banking</span>
              </div>
            </div>
            <PrimaryButton label="Done" onClick={() => setShowPaymentModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Screen: Seller Dashboard ─────────────────────────────────────────────────

function SellerDashboardScreen({ onBack, onSignOut }: { onBack: () => void; onSignOut: () => void }) {
  return (
    <div className="flex flex-col h-full bg-background">
      <TopBar title="Kitchen Manager" onBack={onBack} />
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-xl mx-auto w-full pb-20">
        <div className="p-4 rounded-3xl border border-border bg-card shadow-xs flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-lg">Ramaben's Kitchen</h2>
            <p className="text-xs text-muted-foreground">Ahmedabad Home Food Partner</p>
          </div>
          <button onClick={onSignOut} className="text-xs font-bold text-red-600">Sign Out</button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-2xl bg-card border border-border text-center">
            <p className="text-xl font-extrabold text-foreground">12</p>
            <p className="text-[10px] text-muted-foreground">Today's Orders</p>
          </div>
          <div className="p-3 rounded-2xl bg-card border border-border text-center">
            <p className="text-xl font-extrabold text-accent">9</p>
            <p className="text-[10px] text-muted-foreground">Delivered</p>
          </div>
          <div className="p-3 rounded-2xl bg-card border border-border text-center">
            <p className="text-xl font-extrabold text-primary">3</p>
            <p className="text-[10px] text-muted-foreground">Preparing</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────

const MAIN_SCREENS: Screen[] = ["home", "explore", "plans", "orders", "profile"];

export default function App() {
  const [screen, setScreen] = useState<Screen>("splash");
  const [location, setLocation] = useState("Vastrapur");
  const [history, setHistory] = useState<Screen[]>([]);
  const [selectedSellerId, setSelectedSellerId] = useState("1");
  const [selectedMealId, setSelectedMealId] = useState("ghar-jaisa");

  const [cart, setCart] = usePersistentState<CartItem[]>("tiffinbuddy-cart-v4", []);
  const [subscription, setSubscription] = usePersistentState<Subscription | null>("tiffinbuddy-subscription-v4", null);
  const [orders, setOrders] = usePersistentState<ConfirmedOrder[]>("tiffinbuddy-orders-v4", []);
  const [activeOrderId, setActiveOrderId] = usePersistentState<string | null>("tiffinbuddy-active-order-id-v4", null);
  const [checkoutDraft, setCheckoutDraft] = usePersistentState<CheckoutDraft | null>("tiffinbuddy-checkout-v4", null);
  const [confirmedOrder, setConfirmedOrder] = usePersistentState<ConfirmedOrder | null>("tiffinbuddy-last-order-v4", null);
  const [address, setAddress] = usePersistentState("tiffinbuddy-address-v4", "402, Shivam Heights, Vastrapur, Ahmedabad");
  const [deliveryLocation, setDeliveryLocation] = usePersistentState<DeliveryLocation>("tiffinbuddy-delivery-location-v4", {
    address: "402, Shivam Heights, Vastrapur, Ahmedabad",
    locality: "Vastrapur",
    latitude: AHMEDABAD_CENTER[0],
    longitude: AHMEDABAD_CENTER[1],
  });
  const [exploreState, setExploreState] = usePersistentState<ExploreState>("tiffinbuddy-explore-state-v4", DEFAULT_EXPLORE_STATE);
  const [authAccount, setAuthAccount] = usePersistentState<AuthAccount | null>("tiffinbuddy-auth-account-v4", null);
  const [authSession, setAuthSession] = usePersistentState<AuthSession | null>("tiffinbuddy-auth-session-v4", null);
  const [dismissedOrderPopupIds, setDismissedOrderPopupIds] = usePersistentState<string[]>("tiffinbuddy-dismissed-popups-v4", []);

  const [authRedirectTarget, setAuthRedirectTarget] = useState<Screen | null>(null);
  const [showOrderSuccessPopup, setShowOrderSuccessPopup] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const cartCount = cartItemCount(cart);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => setToastMessage(null), 2500);
  };

  useEffect(() => {
    if (deliveryLocation?.locality) {
      setLocation(deliveryLocation.locality);
    }
  }, [deliveryLocation]);

  const navigate = (s: Screen, data?: unknown) => {
    if (s === "seller-profile" && data && typeof data === "object") {
      if ("sellerId" in data) setSelectedSellerId(String(data.sellerId));
      else if ("id" in data) setSelectedSellerId(String(data.id));
    }
    if (s === "meal-detail" && data && typeof data === "object" && "mealId" in data) {
      setSelectedMealId(String(data.mealId));
    }
    if (MAIN_SCREENS.includes(s)) {
      setHistory([]);
    } else {
      setHistory((h) => [...h, screen]);
    }
    setScreen(s);
  };

  const goBack = () => {
    if (history.length > 0) {
      const prev = history[history.length - 1];
      setHistory((h) => h.slice(0, -1));
      setScreen(prev);
    } else {
      setScreen("home");
    }
  };

  const finishLogin = (session: AuthSession) => {
    setAuthSession(session);
    if (authRedirectTarget) {
      const target = authRedirectTarget;
      setAuthRedirectTarget(null);
      setScreen(target);
    } else {
      setHistory([]);
      setScreen(session.role === "provider" ? "seller-dashboard" : "home");
    }
  };

  const finishSignup = (account: AuthAccount) => {
    setAuthAccount(account);
    setAuthSession({ name: account.name, email: account.email, role: account.role });
    if (authRedirectTarget) {
      const target = authRedirectTarget;
      setAuthRedirectTarget(null);
      setScreen(target);
    } else {
      setHistory([]);
      setScreen(account.role === "provider" ? "seller-dashboard" : "home");
    }
  };

  const signOut = () => {
    setAuthSession(null);
    setHistory([]);
    setScreen("home");
    showToast("Signed out successfully.");
  };

  const showNav = MAIN_SCREENS.includes(screen);

  const appData = useMemo<AppData>(() => ({
    cart,
    setCart,
    subscription,
    setSubscription,
    orders,
    setOrders,
    activeOrderId,
    setActiveOrderId,
    checkoutDraft,
    setCheckoutDraft,
    confirmedOrder,
    setConfirmedOrder,
    address,
    setAddress,
    deliveryLocation,
    setDeliveryLocation,
    exploreState,
    setExploreState,
    authAccount,
    setAuthAccount,
    authSession,
    setAuthSession,
    authRedirectTarget,
    setAuthRedirectTarget,
    showOrderSuccessPopup,
    setShowOrderSuccessPopup,
    dismissedOrderPopupIds,
    setDismissedOrderPopupIds,
    toastMessage,
    showToast,
  }), [cart, subscription, orders, activeOrderId, checkoutDraft, confirmedOrder, address, deliveryLocation, exploreState, authAccount, authSession, authRedirectTarget, showOrderSuccessPopup, dismissedOrderPopupIds, toastMessage]);

  return (
    <AppDataContext.Provider value={appData}>
      <div className="app-shell flex items-center justify-center w-full h-full">
        <div className="app-frame relative flex flex-col overflow-hidden">
          {screen !== "splash" && <div className="status-spacer" />}

          {/* Toast Notification */}
          {toastMessage && (
            <div className="fixed top-4 inset-x-4 z-50 flex justify-center pointer-events-none">
              <div className="bg-stone-950/90 text-white px-4 py-2.5 rounded-full text-xs font-bold shadow-lg backdrop-blur-md animate-fadeIn flex items-center gap-2">
                <span>✓</span>
                <span>{toastMessage}</span>
              </div>
            </div>
          )}

          <main className="app-content flex-1 flex flex-col overflow-hidden">
            {screen === "splash" && (
              <SplashScreen onDone={() => setScreen(authSession?.role === "provider" ? "seller-dashboard" : "home")} />
            )}
            {screen === "auth-welcome" && (
              <AuthWelcomeScreen
                onLogin={() => setScreen("login")}
                onSignup={() => setScreen("signup")}
                onGuest={() => setScreen("home")}
                onBack={goBack}
              />
            )}
            {screen === "login" && (
              <LoginScreen
                account={authAccount}
                onBack={goBack}
                onSignup={() => setScreen("signup")}
                onSuccess={finishLogin}
                isCheckoutAuth={Boolean(authRedirectTarget)}
              />
            )}
            {screen === "signup" && (
              <SignupScreen
                onBack={goBack}
                onLogin={() => setScreen("login")}
                onSuccess={finishSignup}
                isCheckoutAuth={Boolean(authRedirectTarget)}
              />
            )}
            {screen === "onboarding" && (
              <OnboardingScreen onDone={() => setScreen("home")} />
            )}
            {screen === "location" && (
              <LiveLocationScreen
                onBack={goBack}
                onDone={(selected) => {
                  setDeliveryLocation(selected);
                  setLocation(selected.locality);
                  setAddress([selected.details, selected.address].filter(Boolean).join(", "));
                  goBack();
                }}
              />
            )}
            {screen === "home" && (
              <HomeScreen
                location={location}
                onNavigate={navigate}
                onAddToCart={(qty = 1) => setCart((c) => addItemToCart(c, { mealId: "ghar-jaisa", quantity: qty }))}
                cartCount={cartCount}
              />
            )}
            {screen === "explore" && <FunctionalExploreScreen onNavigate={navigate} />}
            {screen === "orders" && <OrdersScreen onNavigate={navigate} />}
            {screen === "plans" && <FunctionalPlansScreen onNavigate={navigate} />}
            {screen === "profile" && <ProfileScreen onNavigate={navigate} account={authSession} onSignOut={signOut} />}
            {screen === "seller-profile" && <FunctionalSellerProfileScreen sellerId={selectedSellerId} onBack={goBack} onNavigate={navigate} />}
            {screen === "meal-detail" && <FunctionalMealDetailScreen mealId={selectedMealId} onBack={goBack} onNavigate={navigate} />}
            {screen === "build-plate" && <BuildPlateScreen onBack={goBack} onNavigate={navigate} />}
            {screen === "cart" && <CartScreen onBack={goBack} onNavigate={navigate} />}
            {screen === "checkout" && <CheckoutScreen onBack={goBack} onNavigate={navigate} />}
            {screen === "order-tracking" && <OrderTrackingScreen onBack={goBack} />}
            {screen === "seller-dashboard" && <SellerDashboardScreen onBack={goBack} onSignOut={signOut} />}
          </main>

          {showNav && (
            <BottomNav
              active={screen}
              onNavigate={navigate}
              cartCount={cartCount}
            />
          )}

          {screen !== "splash" && (
            <div className="flex justify-center pb-2">
              <div className="w-32 h-1 rounded-full" style={{ background: "rgba(28,25,23,0.15)" }} />
            </div>
          )}
        </div>
      </div>
    </AppDataContext.Provider>
  );
}
