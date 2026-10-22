import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
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

// ─── Logo ───────────────────────────────────────────────────────────────────

function TiffinBuddyLogo({ size = 56 }: { size?: number }) {
  const scale = size / 56;
  return (
    <svg width={size} height={size * 0.75} viewBox="0 0 56 42" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Lid */}
      <rect x="22" y="2" width="12" height="5" rx="2.5" fill="#8B4B2C"/>
      <rect x="14" y="7" width="28" height="7" rx="3.5" fill="#8B4B2C"/>
      {/* Middle bowl */}
      <rect x="10" y="16" width="36" height="10" rx="5" fill="#E09B1A"/>
      {/* Bottom bowl */}
      <path d="M8 28h40l-4 10H12L8 28z" fill="#2C5F3D" rx="4"/>
    </svg>
  );
}

function WordMark({ dark = false }: { dark?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span
        className="text-2xl font-display font-bold tracking-tight"
        style={{ color: dark ? "#1C1917" : "#1C1917", fontFamily: "Fraunces, serif" }}
      >
        tiffinbuddy
      </span>
      <span className="text-xs font-medium tracking-wide" style={{ color: "#78716C" }}>
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
    <nav className="app-nav flex items-center justify-around px-2 py-2 border-t bg-card" style={{ borderColor: "var(--border)" }}>
      {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => onNavigate(id as Screen)}
            className="flex flex-col items-center gap-0.5 px-3 py-1 min-w-[44px] min-h-[44px] justify-center"
          >
            <div className="relative">
              <Icon size={22} color={isActive ? "var(--primary)" : "#A8A29E"} />
              {id === "plans" && cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-accent text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
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

function ShieldIcon({ size = 14, color = "#2C5F3D" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2l8 3v7c0 5-4 9-8 10C8 21 4 17 4 12V5l8-3z" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M9 12l2 2 4-4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
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
    <div className="flex items-center px-4 py-3 gap-3" style={{ minHeight: 56 }}>
      {onBack && (
        <button onClick={onBack} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "var(--secondary)" }}>
          <ChevronLeft size={20} />
        </button>
      )}
      {title && <h2 className="flex-1 text-base font-bold text-foreground">{title}</h2>}
      {right && <div className="ml-auto">{right}</div>}
    </div>
  );
}

function PrimaryButton({ label, onClick, disabled = false, fullWidth = true }: { label: string; onClick?: () => void; disabled?: boolean; fullWidth?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${fullWidth ? "w-full" : ""} flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm transition-opacity ${disabled ? "opacity-50" : "active:opacity-80"}`}
      style={{ background: "var(--primary)", color: "#1C1917", minHeight: 52 }}
    >
      {label}
    </button>
  );
}

function SecondaryButton({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm border transition-opacity active:opacity-80"
      style={{ borderColor: "var(--border)", color: "var(--foreground)", background: "transparent", minHeight: 52 }}
    >
      {label}
    </button>
  );
}

function QuantitySelector({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange(Math.max(0, value - 1))}
        className="w-9 h-9 rounded-full flex items-center justify-center border"
        style={{ borderColor: "var(--border)", background: "var(--secondary)" }}
      >
        <MinusIcon size={14} />
      </button>
      <span className="w-5 text-center font-bold text-sm">{value}</span>
      <button
        onClick={() => onChange(value + 1)}
        className="w-9 h-9 rounded-full flex items-center justify-center"
        style={{ background: "var(--primary)" }}
      >
        <PlusIcon size={14} color="#1C1917" />
      </button>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4a4.6 4.6 0 01-2 3v2.5h3.3c1.9-1.8 2.9-4.4 2.9-7.4z"/>
      <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.4l-3.3-2.5c-.9.6-2.1 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3v2.6A10 10 0 0012 22z"/>
      <path fill="#FBBC05" d="M6.4 14a6 6 0 010-3.9V7.4H3a10 10 0 000 9.2L6.4 14z"/>
      <path fill="#EA4335" d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.9-2.8A9.7 9.7 0 0012 2a10 10 0 00-9 5.4L6.4 10A6 6 0 0112 5.9z"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.8 12.7c0-2.3 1.9-3.4 2-3.5a4.4 4.4 0 00-3.5-1.9c-1.5-.2-2.9.9-3.6.9-.8 0-1.9-.9-3.1-.8a4.6 4.6 0 00-3.9 2.4c-1.7 2.9-.4 7.2 1.2 9.5.8 1.1 1.7 2.4 3 2.3 1.2 0 1.6-.7 3.1-.7 1.4 0 1.8.7 3.1.7 1.3 0 2.1-1.1 2.9-2.3.9-1.3 1.3-2.6 1.3-2.7-.1 0-2.5-1-2.5-3.9zM14.3 5.7A4.2 4.2 0 0015.4 2a4.2 4.2 0 00-2.8 1.4 4 4 0 00-1.1 3.5 3.5 3.5 0 002.8-1.2z"/>
    </svg>
  );
}

function SocialAuthButtons({ action, onGoogle, onApple }: { action: "Sign in" | "Sign up"; onGoogle: () => void; onApple: () => void }) {
  return (
    <div className="social-auth">
      <div className="auth-divider"><span>or continue with</span></div>
      <div className="social-auth-grid">
        <button type="button" onClick={onGoogle}><GoogleIcon /><span>{action} with Google</span></button>
        <button type="button" onClick={onApple}><AppleIcon /><span>{action} with Apple</span></button>
      </div>
      <p>Social sign-in runs as a local demo. No external Google or Apple account is contacted.</p>
    </div>
  );
}

async function hashPassword(password: string) {
  const bytes = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function AuthWelcomeScreen({ onLogin, onSignup }: { onLogin: () => void; onSignup: () => void }) {
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
          <div className="sm:hidden"><WordMark /></div>
          <p className="eyebrow mt-8 sm:mt-0">Welcome to TiffinBuddy</p>
          <h2 className="mt-2 font-display text-3xl font-bold">Your daily dabba starts here</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Sign in to continue, or create your first customer or tiffin-provider account.</p>
          <div className="mt-7 space-y-3">
            <PrimaryButton label="Create an account" onClick={onSignup} />
            <SecondaryButton label="I already have an account" onClick={onLogin} />
          </div>
          <div className="mt-6 grid grid-cols-3 gap-2">
            {["Homemade meals", "Flexible plans", "Local kitchens"].map((item) => <div key={item} className="rounded-2xl bg-secondary p-3 text-center text-[11px] font-bold text-secondary-foreground">{item}</div>)}
          </div>
          <p className="mt-6 rounded-xl border border-border bg-card p-3 text-[11px] leading-relaxed text-muted-foreground">Demo authentication is stored only in this browser. No remote account server, OTP provider, or password-recovery service is configured.</p>
        </div>
      </section>
    </div>
  );
}

function LoginScreen({ account, onBack, onSuccess, onSignup }: { account: AuthAccount | null; onBack: () => void; onSuccess: (session: AuthSession) => void; onSignup: () => void }) {
  const [email, setEmail] = useState(account?.email ?? "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setSubmitting(true);
    const passwordHash = await hashPassword(password);
    if (!account || account.email.toLowerCase() !== email.trim().toLowerCase() || account.passwordHash !== passwordHash) {
      setError(account ? "The email or password is incorrect." : "No account exists on this device yet. Create an account first.");
      setSubmitting(false);
      return;
    }
    onSuccess({ name: account.name, email: account.email, role: account.role });
  };

  return (
    <div className="auth-page">
      <button onClick={onBack} aria-label="Back" className="auth-back"><ChevronLeft /></button>
      <div className="auth-card">
        <div className="flex items-center gap-3"><TiffinBuddyLogo size={48} /><div><p className="eyebrow">Welcome back</p><h1 className="font-display text-2xl font-bold">Sign in to TiffinBuddy</h1></div></div>
        <p className="mt-3 text-sm text-muted-foreground">Continue to your meals, plans, orders, or provider dashboard.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="auth-label">Email address<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="auth-input" /></label>
          <label className="auth-label">Password
            <span className="auth-password"><input type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" className="auth-input pr-20" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="auth-password-toggle">{showPassword ? "Hide" : "Show"}</button></span>
          </label>
          {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</div>}
          <PrimaryButton label={submitting ? "Signing in…" : "Sign in"} disabled={submitting} />
        </form>
        <SocialAuthButtons
          action="Sign in"
          onGoogle={() => onSuccess({ name: "Google User", email: "google.user@demo.tiffinbuddy.local", role: "customer" })}
          onApple={() => onSuccess({ name: "Apple User", email: "apple.user@demo.tiffinbuddy.local", role: "customer" })}
        />
        <p className="mt-6 text-center text-sm text-muted-foreground">New to TiffinBuddy? <button onClick={onSignup} className="min-h-11 font-bold text-accent">Create an account</button></p>
      </div>
    </div>
  );
}

function SignupScreen({ onBack, onSuccess, onLogin }: { onBack: () => void; onSuccess: (account: AuthAccount) => void; onLogin: () => void }) {
  const [role, setRole] = useState<UserRole>("customer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (name.trim().length < 2) return setError("Enter your full name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError("Enter a valid email address.");
    if (!/^[6-9]\d{9}$/.test(phone.replace(/\D/g, ""))) return setError("Enter a valid 10-digit Indian mobile number.");
    if (password.length < 8) return setError("Use at least 8 characters for your password.");
    if (password !== confirmPassword) return setError("Passwords do not match.");
    if (!accepted) return setError("Accept the demo terms to continue.");
    setSubmitting(true);
    const passwordHash = await hashPassword(password);
    onSuccess({ name: name.trim(), email: email.trim().toLowerCase(), phone: phone.replace(/\D/g, ""), role, passwordHash });
  };

  return (
    <div className="auth-page overflow-y-auto">
      <button onClick={onBack} aria-label="Back" className="auth-back"><ChevronLeft /></button>
      <div className="auth-card my-6">
        <div className="flex items-center gap-3"><TiffinBuddyLogo size={48} /><div><p className="eyebrow">First time here?</p><h1 className="font-display text-2xl font-bold">Create your account</h1></div></div>
        <p className="mt-3 text-sm text-muted-foreground">Choose how you plan to use TiffinBuddy. You can access the appropriate customer or provider journey after sign-up.</p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button onClick={() => setRole("customer")} className={`role-card ${role === "customer" ? "active" : ""}`}><UserIcon size={22} color={role === "customer" ? "var(--accent)" : "var(--muted-foreground)"} /><strong>Customer</strong><span>Order daily meals</span></button>
          <button onClick={() => setRole("provider")} className={`role-card ${role === "provider" ? "active" : ""}`}><TiffinBuddyLogo size={28} /><strong>Food Provider</strong><span>Manage a kitchen</span></button>
        </div>
        <form onSubmit={submit} className="mt-5 space-y-4">
          <label className="auth-label">Full name<input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your full name" className="auth-input" /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="auth-label">Email address<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="auth-input" /></label>
            <label className="auth-label">Mobile number<input type="tel" inputMode="numeric" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="10-digit number" className="auth-input" /></label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="auth-label">Password<input type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" className="auth-input" /></label>
            <label className="auth-label">Confirm password<input type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repeat password" className="auth-input" /></label>
          </div>
          <label className="flex items-start gap-3 rounded-xl bg-secondary p-3 text-xs leading-relaxed text-muted-foreground"><input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-primary" /><span>I understand this is a local demo account. No OTP, remote identity verification, or cloud account recovery is configured.</span></label>
          {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</div>}
          <PrimaryButton label={submitting ? "Creating account…" : role === "customer" ? "Create customer account" : "Create provider account"} disabled={submitting} />
        </form>
        <SocialAuthButtons
          action="Sign up"
          onGoogle={() => onSuccess({ name: "Google User", email: "google.user@demo.tiffinbuddy.local", phone: "", role, passwordHash: "local-demo-google" })}
          onApple={() => onSuccess({ name: "Apple User", email: "apple.user@demo.tiffinbuddy.local", phone: "", role, passwordHash: "local-demo-apple" })}
        />
        <p className="mt-5 text-center text-sm text-muted-foreground">Already registered? <button onClick={onLogin} className="min-h-11 font-bold text-accent">Sign in</button></p>
      </div>
    </div>
  );
}

// ─── Screen: Splash ──────────────────────────────────────────────────────────

function SplashScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6" style={{ background: "var(--background)" }}>
      <div className="flex flex-col items-center gap-4">
        <TiffinBuddyLogo size={80} />
        <WordMark />
      </div>
      <p className="text-xs text-muted-foreground text-center px-8 leading-relaxed">
        Homely food. Healthy choices. Delivered daily.
      </p>
      <div className="flex gap-1.5 mt-8">
        {[0, 1, 2].map((i) => (
          <span key={i} className="h-1 rounded-full" style={{ width: i === 0 ? 24 : 8, background: i === 0 ? "var(--primary)" : "var(--muted)" }}/>
        ))}
      </div>
    </div>
  );
}

// ─── Screen: Onboarding ──────────────────────────────────────────────────────

const ONBOARDING_SLIDES = [
  {
    img: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&h=400&fit=crop&auto=format",
    title: "Homely meals, every day",
    body: "Fresh, everyday food from trusted local tiffin sellers in your neighbourhood.",
    emoji: "🏠",
  },
  {
    img: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&h=400&fit=crop&auto=format",
    title: "Choose your plate",
    body: "Build your meal exactly how you like it. Pick what you want, skip what you don't.",
    emoji: "🍱",
  },
  {
    img: "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600&h=400&fit=crop&auto=format",
    title: "Reliable daily delivery",
    body: "Know your meal, your seller, and your delivery status — clearly and always on time.",
    emoji: "🛵",
  },
];

function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const slide = ONBOARDING_SLIDES[step];

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--background)" }}>
      {/* Image */}
      <div className="relative flex-shrink-0" style={{ height: "45%" }}>
        <img src={slide.img} alt={slide.title} className="w-full h-full object-cover" style={{ background: "#E8E0CF" }}/>
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 60%, var(--background))" }}/>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 px-6 pt-4 pb-6 gap-4">
        <div className="flex-1">
          <div className="text-3xl mb-3">{slide.emoji}</div>
          <h1 className="text-2xl font-bold text-foreground mb-2 leading-snug" style={{ fontFamily: "Fraunces, serif" }}>
            {slide.title}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">{slide.body}</p>
        </div>

        {/* Dots */}
        <div className="flex gap-1.5 items-center">
          {ONBOARDING_SLIDES.map((_, i) => (
            <span key={i} className="h-1.5 rounded-full transition-all duration-300"
              style={{ width: i === step ? 24 : 8, background: i === step ? "var(--primary)" : "var(--muted)" }}/>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {step < 2 ? (
            <>
              <SecondaryButton label="Skip" onClick={onDone} />
              <PrimaryButton label="Next" onClick={() => setStep(step + 1)} />
            </>
          ) : (
            <PrimaryButton label="Get Started" onClick={onDone} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Screen: Location ────────────────────────────────────────────────────────

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

function LocationScreen({ onDone }: { onDone: (loc: string) => void }) {
  const [selected, setSelected] = useState("Vastrapur");

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--background)" }}>
      <div className="px-6 pt-10 pb-4">
        <TiffinBuddyLogo size={40} />
        <h1 className="text-2xl font-bold text-foreground mt-4 leading-snug" style={{ fontFamily: "Fraunces, serif" }}>
          Where should we deliver?
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Ahmedabad, Gujarat</p>
      </div>

      {/* Current location */}
      <div className="mx-4 mb-3">
        <button className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all"
          style={{ borderColor: "var(--primary)", background: "var(--card)" }}
          onClick={() => setSelected("Current location")}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "#FEF3D7" }}>
            <MapPinIcon size={18} color="#E09B1A" />
          </div>
          <div>
            <div className="font-semibold text-sm text-foreground">Use current location</div>
            <div className="text-xs text-muted-foreground mt-0.5">GPS will detect your locality</div>
          </div>
        </button>
      </div>

      <div className="px-4 mb-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Select locality</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {LOCALITIES.map(({ name, available }) => {
          const isSelected = selected === name;
          return (
            <button
              key={name}
              onClick={() => available && setSelected(name)}
              className="w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all"
              style={{
                borderColor: isSelected ? "var(--primary)" : "var(--border)",
                background: isSelected ? "#FEF3D7" : "var(--card)",
                opacity: available ? 1 : 0.5,
              }}
            >
              <span className="font-medium text-sm text-foreground">{name}</span>
              {available ? (
                isSelected ? (
                  <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "var(--primary)" }}>
                    <CheckIcon size={12} color="#1C1917" />
                  </div>
                ) : (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#E8F5ED", color: "#2C5F3D" }}>
                    Available
                  </span>
                )
              ) : (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#FEE2E2", color: "#DC2626" }}>
                  Coming soon
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="px-4 pb-6 pt-2">
        <PrimaryButton label={`Deliver to ${selected}`} onClick={() => onDone(selected)} />
      </div>
    </div>
  );
}

const AHMEDABAD_CENTER: [number, number] = [23.0225, 72.5714];

type GeocodingResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    suburb?: string;
    neighbourhood?: string;
    city_district?: string;
    city?: string;
    town?: string;
  };
};

function LiveLocationScreen({ onDone }: { onDone: (location: DeliveryLocation) => void }) {
  const { deliveryLocation } = useAppData();
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [mode, setMode] = useState<"manual" | "map">("manual");
  const [selected, setSelected] = useState<DeliveryLocation>(deliveryLocation);
  const [manualArea, setManualArea] = useState(
    LOCALITIES.some((area) => area.name === deliveryLocation.locality && area.available)
      ? deliveryLocation.locality
      : "Vastrapur",
  );
  const [manualAddress, setManualAddress] = useState(
    deliveryLocation.locality !== "Ahmedabad"
      ? [deliveryLocation.details, deliveryLocation.address].filter(Boolean).join(", ")
      : "",
  );
  const [manualError, setManualError] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState("");
  const [message, setMessage] = useState("");
  const [details, setDetails] = useState(deliveryLocation.details ?? "");
  const [instructions, setInstructions] = useState(deliveryLocation.instructions ?? "");

  const updateMapSelection = (location: DeliveryLocation, zoom = 16) => {
    setSelected(location);
    mapRef.current?.setView([location.latitude, location.longitude], zoom);
    markerRef.current?.setLatLng([location.latitude, location.longitude]);
  };

  const reverseGeocode = async (latitude: number, longitude: number) => {
    setMessage("Resolving address…");
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`, {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error(`Reverse geocoding failed (${response.status})`);
      const result = await response.json() as GeocodingResult;
      const locality = result.address?.suburb ?? result.address?.neighbourhood ?? result.address?.city_district ?? result.address?.city ?? "Selected location";
      updateMapSelection({ address: result.display_name, locality, latitude, longitude });
      setMessage("");
    } catch {
      updateMapSelection({ address: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`, locality: "Selected map point", latitude, longitude });
      setMessage("The address service is unavailable. You can still confirm these map coordinates or search again.");
    }
  };

  useEffect(() => {
    if (mode !== "map" || !mapElementRef.current || mapRef.current) return;
    try {
      const initialPoint: [number, number] = [deliveryLocation.latitude, deliveryLocation.longitude];
      const map = L.map(mapElementRef.current, { zoomControl: true, attributionControl: true }).setView(initialPoint, 13);
      const tiles = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap contributors",
      });
      tiles.on("load", () => {
        setMapReady(true);
        setMapError("");
      });
      tiles.on("tileerror", () => setMapError("Map tiles could not be loaded. Check your connection and retry."));
      tiles.addTo(map);
      const icon = L.divIcon({
        className: "tiffin-map-marker",
        html: '<span aria-hidden="true">●</span>',
        iconSize: [36, 44],
        iconAnchor: [18, 40],
      });
      const marker = L.marker(initialPoint, { icon, draggable: true }).addTo(map);
      marker.on("dragend", () => {
        const point = marker.getLatLng();
        void reverseGeocode(point.lat, point.lng);
      });
      map.on("click", (event: L.LeafletMouseEvent) => void reverseGeocode(event.latlng.lat, event.latlng.lng));
      mapRef.current = map;
      markerRef.current = marker;
      window.setTimeout(() => map.invalidateSize(), 100);
    } catch {
      setMapError("The interactive map could not be initialized. Refresh the map or use address search.");
    }
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [mode]);

  const searchAddress = async (event: React.FormEvent) => {
    event.preventDefault();
    if (query.trim().length < 3) {
      setMessage("Enter at least 3 characters to search.");
      return;
    }
    setSearching(true);
    setMessage("");
    try {
      const params = new URLSearchParams({
        format: "jsonv2",
        addressdetails: "1",
        limit: "6",
        countrycodes: "in",
        q: query.trim(),
      });
      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(`Search failed (${response.status})`);
      const data = await response.json() as GeocodingResult[];
      setResults(data);
      if (!data.length) setMessage("No matching address was found. Try a society, landmark, or a broader locality.");
    } catch {
      setResults([]);
      setMessage("Address search is temporarily unavailable. Select a point on the map or try again.");
    } finally {
      setSearching(false);
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMessage("This browser does not support location access. Search or select a point on the map.");
      return;
    }
    setLocating(true);
    setMessage("Waiting for location permission…");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        void reverseGeocode(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        setLocating(false);
        const reason = error.code === error.PERMISSION_DENIED ? "Location permission was denied." : "Your current location could not be determined.";
        setMessage(`${reason} Search for an address or select a point on the map instead.`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  const confirmManualLocation = () => {
    const area = LOCALITIES.find((item) => item.name === manualArea && item.available);
    if (!area) {
      setManualError("Choose an available delivery area.");
      return;
    }
    if (manualAddress.trim().length < 10) {
      setManualError("Add your complete flat, building, street and landmark.");
      return;
    }
    setManualError("");
    onDone({
      address: manualAddress.trim(),
      locality: area.name,
      latitude: area.latitude,
      longitude: area.longitude,
      instructions: instructions.trim() || undefined,
    });
  };

  return (
    <div className="location-screen flex h-full flex-col overflow-y-auto bg-background">
      <div className={`location-layout ${mode === "manual" ? "location-layout-manual" : ""}`}>
        <section className="location-panel">
          <div className="flex items-center gap-3">
            <TiffinBuddyLogo size={42} />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-accent">Delivery location</p>
              <h1 className="font-display text-2xl font-bold">Where should we deliver?</h1>
            </div>
          </div>

          <div className="location-mode-switch mt-5" aria-label="Choose how to add your delivery location">
            <button type="button" onClick={() => setMode("manual")} className={mode === "manual" ? "active" : ""}>
              Area & address
            </button>
            <button type="button" onClick={() => setMode("map")} className={mode === "map" ? "active" : ""}>
              Use map
            </button>
          </div>

          {mode === "manual" ? (
            <div className="manual-location-form mt-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">1. Choose your area</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Select an Ahmedabad area to check nearby home kitchens.</p>
                <div className="area-choice-grid mt-3">
                  {LOCALITIES.map((area) => (
                    <button
                      key={area.name}
                      type="button"
                      disabled={!area.available}
                      onClick={() => {
                        setManualArea(area.name);
                        setManualError("");
                      }}
                      className={manualArea === area.name ? "active" : ""}
                    >
                      <span>{area.name}</span>
                      {!area.available && <small>Coming soon</small>}
                      {area.available && manualArea === area.name && <CheckIcon size={14} color="var(--accent)" />}
                    </button>
                  ))}
                </div>
              </div>

              <label className="mt-6 block text-xs font-bold uppercase tracking-wider text-muted-foreground" htmlFor="manual-address">
                2. Add your complete address
                <textarea
                  id="manual-address"
                  value={manualAddress}
                  onChange={(event) => {
                    setManualAddress(event.target.value);
                    setManualError("");
                  }}
                  rows={4}
                  placeholder="Flat / house number, building or society, street and nearby landmark"
                  className="manual-address-input"
                />
              </label>
              <label className="mt-4 block text-xs font-bold text-muted-foreground" htmlFor="manual-instructions">
                Delivery instructions <span className="font-medium">(optional)</span>
                <input
                  id="manual-instructions"
                  value={instructions}
                  onChange={(event) => setInstructions(event.target.value)}
                  placeholder="Gate, floor or who to call"
                  className="manual-instructions-input"
                />
              </label>
              {manualError && <div role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">{manualError}</div>}
              <div className="mt-5">
                <PrimaryButton label={`Deliver to ${manualArea}`} onClick={confirmManualLocation} />
              </div>
            </div>
          ) : (
            <>
              <form onSubmit={searchAddress} className="mt-5">
                <label className="text-xs font-bold text-muted-foreground" htmlFor="address-search">Search Ahmedabad</label>
                <div className="location-search-row mt-1 flex gap-2">
                  <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border border-border bg-card px-3">
                    <SearchIcon size={18} color="var(--muted-foreground)" />
                    <input id="address-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Society, landmark or locality" className="min-h-12 min-w-0 flex-1 bg-transparent text-sm outline-none" />
                    {query && <button type="button" aria-label="Clear address search" onClick={() => { setQuery(""); setResults([]); }} className="min-h-11 min-w-11 text-lg text-muted-foreground">×</button>}
                  </div>
                  <button disabled={searching} className="min-h-12 rounded-2xl bg-primary px-4 text-sm font-bold disabled:opacity-50">{searching ? "Searching…" : "Search"}</button>
                </div>
              </form>

              {results.length > 0 && (
                <div className="mt-2 max-h-48 space-y-1 overflow-y-auto rounded-2xl border border-border bg-card p-2">
                  {results.map((result) => (
                    <button key={result.place_id} onClick={() => {
                      const latitude = Number(result.lat);
                      const longitude = Number(result.lon);
                      const locality = result.address?.suburb ?? result.address?.neighbourhood ?? result.address?.city_district ?? result.address?.city ?? query;
                      updateMapSelection({ address: result.display_name, locality, latitude, longitude });
                      setResults([]);
                      setQuery(locality);
                    }} className="w-full rounded-xl p-3 text-left text-xs hover:bg-secondary">
                      <strong className="block text-sm">{result.address?.suburb ?? result.address?.neighbourhood ?? result.address?.city_district ?? query}</strong>
                      <span className="line-clamp-2 text-muted-foreground">{result.display_name}</span>
                    </button>
                  ))}
                </div>
              )}

              <button onClick={useCurrentLocation} disabled={locating} className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-primary bg-card text-sm font-bold disabled:opacity-50">
                <MapPinIcon size={18} color="var(--primary)" />
                {locating ? "Finding your location…" : "Use My Current Location"}
              </button>

              {message && <div role="status" className="mt-3 rounded-xl bg-secondary p-3 text-xs text-muted-foreground">{message}</div>}
            </>
          )}
        </section>

        {mode === "map" && <section className="map-section">
          <div ref={mapElementRef} className="live-map" aria-label="Interactive map of Ahmedabad. Click or drag the marker to select a delivery location." />
          {!mapReady && !mapError && <div className="map-status">Loading live map…</div>}
          {mapError && <div className="map-status map-error"><span>{mapError}</span><button onClick={() => { setMapError(""); mapRef.current?.invalidateSize(); }} className="mt-2 rounded-xl bg-primary px-4 py-2 font-bold">Retry map</button></div>}
          <div className="map-tip">Tap the map or drag the marker</div>
        </section>}

        {mode === "map" && <section className="location-summary">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-50"><MapPinIcon size={20} color="var(--accent)" /></div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-accent">Selected location</p>
              <p className="mt-1 text-sm font-bold">{selected.locality}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{selected.address}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{selected.latitude.toFixed(5)}, {selected.longitude.toFixed(5)}</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-bold text-muted-foreground">Flat, building or society
              <input value={details} onChange={(event) => setDetails(event.target.value)} placeholder="Optional address details" className="mt-1 min-h-11 w-full rounded-xl border border-border bg-transparent px-3 text-sm text-foreground" />
            </label>
            <label className="text-xs font-bold text-muted-foreground">Delivery instructions
              <input value={instructions} onChange={(event) => setInstructions(event.target.value)} placeholder="Gate, floor or landmark" className="mt-1 min-h-11 w-full rounded-xl border border-border bg-transparent px-3 text-sm text-foreground" />
            </label>
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">All listed tiffin providers deliver across Ahmedabad. Confirm an Ahmedabad location to continue.</p>
          <div className="mt-4">
            <PrimaryButton label="Confirm Location" onClick={() => onDone({ ...selected, details: details.trim() || undefined, instructions: instructions.trim() || undefined })} />
          </div>
        </section>}
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

const TODAY_MENU = [
  { id: "d1", name: "Dal Tadka", category: "Dal", price: 40, available: true },
  { id: "d2", name: "Rotli (2 pcs)", category: "Base", price: 15, available: true },
  { id: "d3", name: "Mix Veg Sabzi", category: "Sabzi", price: 40, available: true },
  { id: "d4", name: "Jeera Rice", category: "Base", price: 35, available: false },
  { id: "d5", name: "Salad", category: "Sides", price: 20, available: true },
  { id: "d6", name: "Chaas (Glass)", category: "Sides", price: 15, available: true },
];

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

type CheckoutDraft =
  | { kind: "meal"; mealId: string; quantity: number; customPlate?: CustomPlate; items?: CartItem[] }
  | { kind: "subscription"; plan: "Weekly" | "Monthly"; planOptionId?: string; mealId: string; mealType: "Lunch" | "Dinner" };

type ConfirmedOrder = {
  id: string;
  kind: "meal" | "subscription";
  title: string;
  kitchen: string;
  amount: number;
  quantity?: number;
  address: string;
  schedule: string;
  payment: string;
};

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
  {
    id: "healthy-snack",
    sellerId: "3",
    name: "Steamed Handvo Snack",
    kitchen: "Ghar Jaisa Tiffin",
    description: "Protein-rich lentil handvo with mint chutney",
    price: 85,
    image: FOOD_IMAGES.handvo,
    labels: ["Vegetarian", "Healthy"],
    cuisine: "Gujarati",
    mealType: "Snacks",
    category: "Snack",
    keywords: ["handvo", "snack", "protein", "steamed"],
    available: false,
  },
];

const PLAN_OPTIONS: PlanOption[] = [
  { id: "daily-1", sellerId: "1", mealId: "ghar-jaisa", name: "Daily Lunch", duration: "Daily", meals: 1, price: 120 },
  { id: "weekly-1", sellerId: "1", mealId: "ghar-jaisa", name: "Weekly Lunch Plan", duration: "Weekly", meals: 5, price: 495 },
  { id: "monthly-1", sellerId: "1", mealId: "ghar-jaisa", name: "Monthly Lunch Plan", duration: "Monthly", meals: 20, price: 1800 },
  { id: "weekly-2", sellerId: "2", mealId: "sonal-thali", name: "Weekly North Indian Plan", duration: "Weekly", meals: 5, price: 575 },
  { id: "monthly-3", sellerId: "3", mealId: "jain-tiffin", name: "Monthly Jain Plan", duration: "Monthly", meals: 20, price: 1700 },
];

const dateAfter = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const makeSchedule = (count = 5): ScheduledMeal[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `scheduled-${index + 1}`,
    date: dateAfter(index + 1),
    slot: "1:00–1:30 PM",
    mealType: "Lunch",
    mealId: "ghar-jaisa",
    status: "Scheduled",
  }));

const DEFAULT_SUBSCRIPTION: Subscription = {
  id: "SUB-RK-204",
  kitchen: "Ramaben's Kitchen",
  plan: "Weekly",
  status: "Active",
  mealId: "ghar-jaisa",
  mealType: "Lunch",
  remainingMeals: 5,
  price: 495,
  billingPeriod: "per week",
  schedule: makeSchedule(),
};

type AppData = {
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  subscription: Subscription;
  setSubscription: React.Dispatch<React.SetStateAction<Subscription>>;
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
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short" }).format(new Date(`${date}T12:00:00`));
}

function isBeforeSkipCutoff(date: string) {
  const cutoff = new Date(`${date}T20:00:00`);
  cutoff.setDate(cutoff.getDate() - 1);
  return Date.now() < cutoff.getTime();
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
}: {
  location: string;
  onNavigate: (s: Screen, data?: unknown) => void;
  onAddToCart: () => void;
}) {
  const categories = [
    { label: "Today's Meal", emoji: "🍱", screen: "meal-detail" as Screen },
    { label: "Build Your Plate", emoji: "🥘", screen: "build-plate" as Screen },
    { label: "Healthy Meals", emoji: "🥗", screen: "explore" as Screen },
    { label: "Weekly Plans", emoji: "📅", screen: "plans" as Screen },
  ];

  return (
    <div className="home-screen flex-1 overflow-y-auto" style={{ background: "var(--background)" }}>
      {/* Header */}
      <div className="home-header px-5 pt-8 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Good afternoon,</p>
            <h1 className="text-xl font-bold text-foreground">Priya Mehta 👋</h1>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold"
            onClick={() => onNavigate("location")}
            style={{ borderColor: "var(--border)", background: "var(--card)", color: "var(--muted-foreground)" }}>
            <MapPinIcon size={12} />
            Home • {location}
          </button>
        </div>
      </div>

      {/* Today's Tiffin — hero card */}
      <div className="home-hero-wrap px-4 mb-5">
        <div className="home-hero-card rounded-3xl overflow-hidden" style={{ background: "var(--card)", boxShadow: "0 2px 16px rgba(0,0,0,0.07)" }}>
          <div className="relative" style={{ height: 180 }}>
            <img
              src={FOOD_IMAGES.gharJaisaMeal}
              alt="Today's tiffin"
              className="w-full h-full object-cover"
              style={{ background: "#E8E0CF" }}
            />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(28,25,23,0.6) 0%, transparent 70%)" }}/>
            <div className="absolute top-3 left-3">
              <span className="text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide"
                style={{ background: "var(--primary)", color: "#1C1917" }}>Today's Tiffin</span>
            </div>
            <div className="absolute bottom-3 left-3 right-3">
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
                <div className="text-xl font-bold text-foreground">₹120</div>
                <button
                  onClick={() => onNavigate("meal-detail")}
                  className="mt-1 px-4 py-1.5 rounded-xl text-xs font-bold"
                  style={{ background: "var(--primary)", color: "#1C1917" }}>
                  Order Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category shortcuts */}
      <div className="home-categories px-4 mb-5">
        <h2 className="text-sm font-bold text-foreground mb-3">Choose what you need</h2>
        <div className="grid grid-cols-4 gap-2">
          {categories.map(({ label, emoji, screen }) => (
            <button key={label} onClick={() => onNavigate(screen)}
              className="home-category-button flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all active:scale-95"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <span className="text-2xl">{emoji}</span>
              <span className="text-[10px] font-semibold text-center leading-tight text-foreground">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Popular near you */}
      <div className="home-popular px-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-foreground">Popular near you</h2>
          <button className="text-xs font-semibold" style={{ color: "var(--primary)" }}>See all</button>
        </div>
        <div className="space-y-3">
          {SELLERS.map((seller) => (
            <SellerCard key={seller.id} seller={seller} onClick={() => onNavigate("seller-profile", seller)} />
          ))}
        </div>
      </div>

      <div className="h-4" />
    </div>
  );
}

function SellerCard({ seller, onClick }: { seller: typeof SELLERS[0]; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="seller-card w-full flex gap-3 p-3 rounded-2xl border text-left transition-all active:scale-[0.99]"
      style={{ background: "var(--card)", borderColor: "var(--border)" }}>
      <img src={seller.img} alt={seller.name}
        className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
        style={{ background: "#E8E0CF" }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-1">
          <div>
            <div className="font-bold text-sm text-foreground">{seller.name}</div>
            <div className="text-xs text-muted-foreground mt-0.5 truncate">{seller.cuisine}</div>
          </div>
          <VegBadge small />
        </div>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <div className="flex items-center gap-0.5">
            <StarIcon size={11} />
            <span className="text-xs font-semibold">{seller.rating}</span>
            <span className="text-xs text-muted-foreground">({seller.reviews})</span>
          </div>
          <span className="text-muted-foreground text-xs">·</span>
          <div className="flex items-center gap-0.5 text-muted-foreground">
            <ClockIcon size={11} />
            <span className="text-xs">{seller.delivery}</span>
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-muted-foreground">from <span className="font-bold text-foreground">₹{seller.price}</span></span>
          {seller.remaining <= 5 && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#FEF3D7", color: "#92400E" }}>
              Only {seller.remaining} left
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Screen: Explore ─────────────────────────────────────────────────────────

const FILTERS = ["Veg", "Healthy", "Jain", "Low Oil", "High Protein", "Budget"];
const CATEGORIES = ["Home Food", "Gujarati", "North Indian", "Healthy", "Jain", "Light Meals"];

function ExploreScreen({ onNavigate }: { onNavigate: (s: Screen, d?: unknown) => void }) {
  const [query, setQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState("Home Food");

  const toggleFilter = (f: string) =>
    setActiveFilters((prev) => prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]);

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: "var(--background)" }}>
      <div className="px-4 pt-8 pb-3">
        <h1 className="text-xl font-bold text-foreground mb-4">Explore</h1>
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl border" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <SearchIcon size={18} color="#A8A29E" />
          <input
            type="text"
            placeholder="Search meals, dishes or tiffin sellers"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 text-sm bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 mb-3">
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {FILTERS.map((f) => {
            const active = activeFilters.includes(f);
            return (
              <button key={f} onClick={() => toggleFilter(f)}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
                style={{
                  background: active ? "var(--primary)" : "var(--card)",
                  borderColor: active ? "var(--primary)" : "var(--border)",
                  color: active ? "#1C1917" : "var(--muted-foreground)",
                }}>
                {f}
              </button>
            );
          })}
        </div>
      </div>

      {/* Categories */}
      <div className="px-4 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {CATEGORIES.map((c) => {
            const active = activeCategory === c;
            return (
              <button key={c} onClick={() => setActiveCategory(c)}
                className="flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all"
                style={{
                  background: active ? "var(--accent)" : "var(--card)",
                  color: active ? "#fff" : "var(--foreground)",
                  border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
                }}>
                {c}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results */}
      <div className="px-4 mb-2">
        <p className="text-xs text-muted-foreground font-medium">{SELLERS.length} sellers found</p>
      </div>
      <div className="px-4 space-y-3 pb-6">
        {SELLERS.map((s) => <SellerCard key={s.id} seller={s} onClick={() => onNavigate("seller-profile", s)} />)}
      </div>
    </div>
  );
}

const DEFAULT_EXPLORE_STATE: ExploreState = {
  query: "",
  cuisines: [],
  diets: [],
  mealTypes: [],
  plan: "All",
  minPrice: 0,
  maxPrice: 2000,
  availableOnly: true,
  sort: "Recommended",
};

function FunctionalExploreScreen({ onNavigate }: { onNavigate: (s: Screen, d?: unknown) => void }) {
  const { cart, setCart, setCheckoutDraft, deliveryLocation, exploreState, setExploreState } = useAppData();
  const [showFilters, setShowFilters] = useState(false);
  const [draft, setDraft] = useState(exploreState);
  const [notice, setNotice] = useState("");
  const serviceableSellers = SELLERS.filter((seller) => sellerDeliversTo(seller, deliveryLocation));
  const normalizedQuery = exploreState.query.trim().toLowerCase();

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
      if (exploreState.plan !== "All" && !PLAN_OPTIONS.some((plan) => plan.mealId === meal.id && plan.duration === exploreState.plan)) return false;
      return true;
    });
    return [...filtered].sort((a, b) => {
      if (exploreState.sort === "Price: Low to High") return a.price - b.price;
      if (exploreState.sort === "Price: High to Low") return b.price - a.price;
      if (exploreState.sort === "Newest") {
        const sellerA = SELLERS.find((item) => item.id === a.sellerId);
        const sellerB = SELLERS.find((item) => item.id === b.sellerId);
        return (sellerB?.addedAt ?? "").localeCompare(sellerA?.addedAt ?? "");
      }
      return Number(b.available) - Number(a.available);
    });
  }, [exploreState, normalizedQuery, serviceableSellers]);

  const matchingSellers = serviceableSellers.filter((seller) => {
    if (exploreState.cuisines.length && !exploreState.cuisines.some((cuisine) => seller.cuisine.toLowerCase().includes(cuisine.toLowerCase()))) return false;
    if (exploreState.diets.length && !exploreState.diets.every((diet) => seller.dietary.some((label) => label.toLowerCase() === diet.toLowerCase()))) return false;
    if (!normalizedQuery) return true;
    return [seller.name, seller.tagline, seller.cuisine, ...seller.dietary].join(" ").toLowerCase().includes(normalizedQuery)
      || MEALS.some((meal) => meal.sellerId === seller.id && [meal.name, ...meal.keywords].join(" ").toLowerCase().includes(normalizedQuery));
  }).sort((a, b) => {
    if (exploreState.sort === "Price: Low to High") return a.price - b.price;
    if (exploreState.sort === "Price: High to Low") return b.price - a.price;
    if (exploreState.sort === "Newest") return b.addedAt.localeCompare(a.addedAt);
    return b.rating - a.rating;
  });

  const visiblePlans = PLAN_OPTIONS.filter((plan) => {
    const meal = MEALS.find((item) => item.id === plan.mealId);
    return meal && matchingMeals.some((item) => item.id === meal.id) && (exploreState.plan === "All" || exploreState.plan === plan.duration);
  });

  const toggleDraft = (key: "cuisines" | "diets" | "mealTypes", value: string) => {
    setDraft((current) => ({
      ...current,
      [key]: current[key].includes(value) ? current[key].filter((item) => item !== value) : [...current[key], value],
    }));
  };

  const addMeal = (meal: Meal) => {
    if (!meal.available) {
      setNotice(`${meal.name} is currently unavailable.`);
      return;
    }
    const seller = SELLERS.find((item) => item.id === meal.sellerId);
    if (!seller || !sellerDeliversTo(seller, deliveryLocation)) {
      setNotice(`${meal.kitchen} currently delivers only within Ahmedabad.`);
      return;
    }
    setCart((current) => addItemToCart(current, { mealId: meal.id, quantity: 1 }));
    setNotice(`${meal.name} added to My Tiffin.`);
  };

  const choosePlan = (plan: PlanOption) => {
    const meal = MEALS.find((item) => item.id === plan.mealId);
    if (!meal) return;
    if (plan.duration === "Daily") {
      addMeal(meal);
      onNavigate("cart");
      return;
    }
    setCheckoutDraft({ kind: "subscription", plan: plan.duration, planOptionId: plan.id, mealId: meal.id, mealType: meal.mealType === "Dinner" ? "Dinner" : "Lunch" });
    onNavigate("checkout");
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      <div className="explore-container">
        <header className="explore-header">
          <div className="explore-title-block">
            <h1 className="font-display text-2xl font-bold">Explore</h1>
            <button onClick={() => onNavigate("location")} className="explore-location">
              <MapPinIcon size={14} color="var(--accent)" />
              <span>Delivering to <strong>{deliveryLocation.locality}</strong></span>
            </button>
          </div>
          {cart.length > 0 && <button onClick={() => onNavigate("cart")} className="explore-cart-button">My Tiffin · {cartItemCount(cart)}</button>}
        </header>

        <div className="explore-toolbar">
          <div className="explore-search">
            <SearchIcon size={18} color="var(--muted-foreground)" />
            <input value={exploreState.query} onChange={(event) => setExploreState((current) => ({ ...current, query: event.target.value }))} placeholder="Search meals, dishes or tiffin sellers" className="min-h-12 min-w-0 flex-1 bg-transparent text-sm outline-none" />
            {exploreState.query && <button aria-label="Clear search" onClick={() => setExploreState((current) => ({ ...current, query: "" }))} className="min-h-11 min-w-11 text-lg text-muted-foreground">×</button>}
          </div>
        </div>

        <div className="meal-type-strip">
          {["All food", "Gujarati", "North Indian", "Jain"].map((type) => {
            const active = type === "All food" ? exploreState.cuisines.length === 0 : exploreState.cuisines.includes(type);
            return <button key={type} onClick={() => setExploreState((current) => ({ ...current, cuisines: type === "All food" ? [] : [type] }))} className={active ? "active" : ""}>{type}</button>;
          })}
          <button onClick={() => { setDraft(exploreState); setShowFilters(true); }}>
            Filters {exploreState.diets.length + exploreState.mealTypes.length > 0 ? `(${exploreState.diets.length + exploreState.mealTypes.length})` : ""}
          </button>
        </div>

        {notice && <div role="status" className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-green-50 p-3 text-sm text-green-900"><span>{notice}</span><button aria-label="Dismiss" onClick={() => setNotice("")} className="min-h-11 min-w-11 font-bold">×</button></div>}

        {serviceableSellers.length === 0 ? (
          <div className="explore-empty">
            <MapPinIcon size={30} color="var(--accent)" />
            <h2 className="mt-3 text-lg font-bold">This location is outside Ahmedabad</h2>
            <p className="mt-1 text-sm text-muted-foreground">TiffinBuddy currently supports delivery across Ahmedabad. Choose an Ahmedabad delivery location to continue.</p>
            <div className="mt-4"><PrimaryButton label="Choose another location" onClick={() => onNavigate("location")} /></div>
          </div>
        ) : matchingMeals.length === 0 && matchingSellers.length === 0 ? (
          <div className="explore-empty">
            <SearchIcon size={30} color="var(--accent)" />
            <h2 className="mt-3 text-lg font-bold">No meals match your search</h2>
            <p className="mt-1 text-sm text-muted-foreground">Try a broader term, increase the price range, or clear filters.</p>
            <button onClick={() => setExploreState(DEFAULT_EXPLORE_STATE)} className="mt-4 min-h-12 rounded-2xl bg-primary px-5 text-sm font-bold">Clear search and filters</button>
          </div>
        ) : (
          <>
            {matchingSellers.length > 0 && (
              <section className="explore-provider-results">
                <div className="explore-result-row">
                  <p>{matchingSellers.length} tiffin place{matchingSellers.length === 1 ? "" : "s"} found</p>
                  <select aria-label="Sort results" value={exploreState.sort} onChange={(event) => setExploreState((current) => ({ ...current, sort: event.target.value as ExploreState["sort"] }))}>
                    <option>Recommended</option>
                    <option>Price: Low to High</option>
                    <option>Price: High to Low</option>
                    <option>Newest</option>
                  </select>
                </div>
                <div className="provider-grid">
                  {matchingSellers.map((seller) => (
                    <button key={seller.id} onClick={() => onNavigate("seller-profile", { sellerId: seller.id })} className="provider-discovery-card">
                      <img src={seller.img} alt={seller.name} />
                      <span className="min-w-0 flex-1 text-left">
                        <strong className="block truncate">{seller.name}</strong>
                        <span className="mt-1 block text-xs text-muted-foreground">{seller.cuisine} · {seller.delivery}</span>
                        <span className="provider-price">From ₹{seller.price}</span>
                      </span>
                      <span className="provider-rating">★ {seller.rating}</span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            <section className="explore-section">
              <div className="section-heading"><div><p className="eyebrow">From these kitchens</p><h2>Popular homemade meals</h2></div><span>{matchingMeals.length} results</span></div>
              <div className="meal-grid">
                {matchingMeals.map((meal) => (
                  <article key={meal.id} className="meal-discovery-card">
                    <button onClick={() => onNavigate("meal-detail", { mealId: meal.id })} className="meal-card-main">
                      <div className="relative shrink-0">
                        <img src={meal.image} alt={meal.name} />
                        {!meal.available && <span className="availability-pill unavailable">Unavailable</span>}
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <p className="text-xs text-muted-foreground">{meal.kitchen}</p>
                        <h3 className="mt-1 truncate font-bold">{meal.name}</h3>
                        <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{meal.description}</p>
                        <p className="mt-2 text-xs font-bold text-accent">₹{meal.price} · {meal.mealType}</p>
                      </div>
                      <span className="provider-rating">★ {SELLERS.find((item) => item.id === meal.sellerId)?.rating}</span>
                    </button>
                    <button disabled={!meal.available} onClick={() => addMeal(meal)} className="meal-add-button">{cart.some((item) => item.mealId === meal.id) ? `Add another (${cart.find((item) => item.mealId === meal.id)?.quantity})` : "Add to Tiffin"}</button>
                  </article>
                ))}
              </div>
            </section>

            {visiblePlans.length > 0 && (
              <section className="explore-section">
                <div className="section-heading"><div><p className="eyebrow">Plans</p><h2>Daily, weekly & monthly</h2></div></div>
                <div className="plan-grid">
                  {visiblePlans.map((plan) => {
                    const meal = MEALS.find((item) => item.id === plan.mealId)!;
                    return <article key={plan.id} className="plan-discovery-card"><p className="text-xs font-bold uppercase tracking-wider text-accent">{plan.duration}</p><h3 className="mt-1 font-bold">{plan.name}</h3><p className="mt-1 text-xs text-muted-foreground">{meal.kitchen} · {plan.meals} {plan.meals === 1 ? "meal" : "meals"}</p><div className="mt-4 flex items-end justify-between gap-3"><div><strong className="text-xl">₹{plan.price}</strong><span className="block text-[10px] text-muted-foreground">₹{Math.round(plan.price / plan.meals)}/meal</span></div><button onClick={() => choosePlan(plan)} className="min-h-11 rounded-xl bg-accent px-4 text-xs font-bold text-white">Choose Plan</button></div></article>;
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {showFilters && (
        <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setShowFilters(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="filter-title" className="dialog-sheet">
            <div className="flex items-start justify-between gap-3">
              <div><p className="eyebrow">Refine discovery</p><h2 id="filter-title" className="font-display text-xl font-bold">Filters</h2></div>
              <button aria-label="Close filters" onClick={() => setShowFilters(false)} className="min-h-11 min-w-11 rounded-full bg-secondary font-bold">×</button>
            </div>
            <FilterGroup label="Cuisine" values={["Gujarati", "North Indian", "Jain"]} active={draft.cuisines} onToggle={(value) => toggleDraft("cuisines", value)} />
            <FilterGroup label="Diet" values={["Vegetarian", "Jain", "Low Oil", "High Protein", "Healthy"]} active={draft.diets} onToggle={(value) => toggleDraft("diets", value)} />
            <FilterGroup label="Meal type" values={["Breakfast", "Lunch", "Dinner", "Snacks"]} active={draft.mealTypes} onToggle={(value) => toggleDraft("mealTypes", value)} />
            <div className="mt-5">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Plan duration</p>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">{(["All", "Daily", "Weekly", "Monthly"] as const).map((value) => <button key={value} onClick={() => setDraft((current) => ({ ...current, plan: value }))} className={`min-h-11 rounded-xl border text-xs font-bold ${draft.plan === value ? "border-primary bg-primary" : "border-border"}`}>{value}</button>)}</div>
            </div>
            <div className="mt-5">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Price per selection</p>
              <div className="mt-2 grid grid-cols-2 gap-3"><label className="text-xs text-muted-foreground">Minimum<input type="number" min="0" value={draft.minPrice} onChange={(event) => setDraft((current) => ({ ...current, minPrice: Math.max(0, Number(event.target.value)) }))} className="mt-1 min-h-11 w-full rounded-xl border border-border bg-transparent px-3 text-sm" /></label><label className="text-xs text-muted-foreground">Maximum<input type="number" min="0" value={draft.maxPrice} onChange={(event) => setDraft((current) => ({ ...current, maxPrice: Math.max(0, Number(event.target.value)) }))} className="mt-1 min-h-11 w-full rounded-xl border border-border bg-transparent px-3 text-sm" /></label></div>
            </div>
            <label className="mt-5 flex min-h-12 items-center justify-between rounded-xl bg-secondary px-3 text-sm font-semibold">Available now only<input type="checkbox" checked={draft.availableOnly} onChange={(event) => setDraft((current) => ({ ...current, availableOnly: event.target.checked }))} className="h-5 w-5 accent-primary" /></label>
            <div className="mt-5 flex gap-3"><SecondaryButton label="Clear All" onClick={() => setDraft({ ...DEFAULT_EXPLORE_STATE, query: exploreState.query, sort: exploreState.sort })} /><PrimaryButton label="Apply Filters" onClick={() => { setExploreState(draft); setShowFilters(false); }} /></div>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterGroup({ label, values, active, onToggle }: { label: string; values: string[]; active: string[]; onToggle: (value: string) => void }) {
  return <div className="mt-5"><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p><div className="mt-2 flex flex-wrap gap-2">{values.map((value) => <button key={value} onClick={() => onToggle(value)} className={`min-h-11 rounded-full border px-4 text-xs font-bold ${active.includes(value) ? "border-primary bg-primary" : "border-border bg-card"}`}>{value}</button>)}</div></div>;
}

// ─── Screen: Seller Profile ───────────────────────────────────────────────────

function SellerProfileScreen({
  onBack,
  onNavigate,
}: {
  onBack: () => void;
  onNavigate: (s: Screen) => void;
}) {
  const seller = SELLERS[0];
  const [cartItems, setCartItems] = useState<Record<string, number>>({});

  const cartTotal = TODAY_MENU.reduce((acc, item) => acc + (cartItems[item.id] || 0) * item.price, 0);
  const cartCount = Object.values(cartItems).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--background)" }}>
      <div className="flex-1 overflow-y-auto">
        {/* Hero */}
        <div className="relative" style={{ height: 220 }}>
          <img src={seller.img} alt={seller.name} className="w-full h-full object-cover" style={{ background: "#E8E0CF" }}/>
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 40%, rgba(28,25,23,0.7))" }}/>
          <button onClick={onBack}
            className="absolute top-4 left-4 w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.9)" }}>
            <ChevronLeft size={20} />
          </button>
          <div className="absolute bottom-4 left-4 right-4">
            <h1 className="text-xl font-bold text-white">{seller.name}</h1>
            <p className="text-xs text-white/80 mt-0.5">{seller.tagline}</p>
          </div>
        </div>

        {/* Info bar */}
        <div className="mx-4 -mt-4 relative z-10 rounded-2xl p-4" style={{ background: "var(--card)", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5">
                <StarIcon size={14} />
                <span className="font-bold text-sm">{seller.rating}</span>
              </div>
              <span className="text-xs text-muted-foreground">({seller.reviews} reviews)</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <ClockIcon size={13} />
              <span className="text-xs">{seller.delivery}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPinIcon size={13} />
              <span className="text-xs">{seller.distance} away</span>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <div className="flex items-center gap-1 px-2 py-1 rounded-full" style={{ background: "#E8F5ED" }}>
              <ShieldIcon size={13} />
              <span className="text-[11px] font-semibold" style={{ color: "#2C5F3D" }}>Verified Tiffin Partner</span>
            </div>
            <VegBadge small />
          </div>
          {seller.remaining <= 5 && (
            <div className="mt-2 px-3 py-1.5 rounded-xl text-xs font-semibold" style={{ background: "#FEF3D7", color: "#92400E" }}>
              ⚠ Only {seller.remaining} meals remaining today
            </div>
          )}
        </div>

        {/* Today's menu */}
        <div className="px-4 mt-5">
          <h2 className="text-sm font-bold text-foreground mb-3">Today's Menu</h2>
          <div className="space-y-2">
            {TODAY_MENU.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-2xl border"
                style={{ background: "var(--card)", borderColor: "var(--border)", opacity: item.available ? 1 : 0.5 }}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">{item.name}</span>
                    {!item.available && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#FEE2E2", color: "#DC2626" }}>Sold Out</span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{item.category}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-sm">₹{item.price}</span>
                  {item.available && (
                    cartItems[item.id] ? (
                      <QuantitySelector value={cartItems[item.id]} onChange={(n) => setCartItems({ ...cartItems, [item.id]: n })} />
                    ) : (
                      <button onClick={() => setCartItems({ ...cartItems, [item.id]: 1 })}
                        className="w-8 h-8 rounded-full flex items-center justify-center border-2"
                        style={{ borderColor: "var(--primary)", background: "transparent" }}>
                        <PlusIcon size={14} color="var(--primary)" />
                      </button>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="h-28" />
      </div>

      {/* Sticky cart */}
      {cartCount > 0 && (
        <div className="px-4 pb-4 pt-2" style={{ background: "var(--background)", borderTop: "1px solid var(--border)" }}>
          <button onClick={() => onNavigate("cart")}
            className="w-full flex items-center justify-between px-5 py-4 rounded-2xl font-bold text-sm"
            style={{ background: "var(--primary)", color: "#1C1917" }}>
            <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "rgba(0,0,0,0.15)" }}>{cartCount}</span>
            <span>View Cart</span>
            <span>₹{cartTotal}</span>
          </button>
        </div>
      )}
    </div>
  );
}

function FunctionalSellerProfileScreen({ sellerId, onBack, onNavigate }: { sellerId: string; onBack: () => void; onNavigate: (s: Screen, data?: unknown) => void }) {
  const { cart, setCart, setCheckoutDraft, deliveryLocation } = useAppData();
  const seller = SELLERS.find((item) => item.id === sellerId) ?? SELLERS[0];
  const meals = MEALS.filter((meal) => meal.sellerId === seller.id);
  const plans = PLAN_OPTIONS.filter((plan) => plan.sellerId === seller.id);
  const delivers = sellerDeliversTo(seller, deliveryLocation);
  const addMeal = (meal: Meal) => setCart((current) => addItemToCart(current, { mealId: meal.id, quantity: 1 }));

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex-1 overflow-y-auto">
        <div className="seller-detail-hero">
          <img src={seller.img} alt={seller.name} />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent" />
          <button onClick={onBack} aria-label="Back" className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/90"><ChevronLeft size={20} /></button>
          <div className="absolute inset-x-4 bottom-4 text-white"><p className="text-xs font-bold uppercase tracking-wider text-amber-300">Development provider listing</p><h1 className="font-display text-2xl font-bold">{seller.name}</h1><p className="mt-1 text-sm text-white/80">{seller.tagline}</p></div>
        </div>
        <div className="seller-detail-layout">
          <main>
            <div className={`rounded-2xl border p-4 ${delivers ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}`}>
              <p className="font-bold">{delivers ? `Delivers across Ahmedabad, including ${deliveryLocation.locality}` : `Outside Ahmedabad delivery area`}</p>
              <p className="mt-1 text-xs text-muted-foreground">{delivers ? `${seller.delivery} · checkout uses the app's existing ₹15 one-time delivery fee.` : "Choose an Ahmedabad address to order from this provider."}</p>
              <p className="mt-2 text-[11px] text-muted-foreground">Delivery coverage: All Ahmedabad areas</p>
            </div>

            <section className="mt-5">
              <p className="eyebrow">{seller.name} menu</p>
              <div className="flex items-end justify-between gap-3">
                <div><h2 className="text-lg font-bold">Choose your meal</h2><p className="mt-1 text-xs text-muted-foreground">Explore everything currently available from this tiffin provider.</p></div>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-muted-foreground">{meals.filter((meal) => meal.available).length} available</span>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {meals.map((meal) => (
                  <article key={meal.id} className="overflow-hidden rounded-2xl border border-border bg-card">
                    <button onClick={() => onNavigate("meal-detail", { mealId: meal.id })} className="w-full text-left"><img src={meal.image} alt={meal.name} className="aspect-[16/9] w-full object-cover" /><div className="p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-bold">{meal.name}</h3><p className="mt-1 text-xs text-muted-foreground">{meal.description}</p></div><strong>₹{meal.price}</strong></div></div></button>
                    <div className="flex gap-2 px-4 pb-4"><button onClick={() => onNavigate("meal-detail", { mealId: meal.id })} className="min-h-11 flex-1 rounded-xl border border-border text-xs font-bold">View Meal</button><button disabled={!meal.available || !delivers} onClick={() => addMeal(meal)} className="min-h-11 flex-1 rounded-xl bg-primary text-xs font-bold disabled:opacity-40">{cart.some((item) => item.mealId === meal.id) ? `Add (${cart.find((item) => item.mealId === meal.id)?.quantity})` : "Add to Tiffin"}</button></div>
                  </article>
                ))}
              </div>
            </section>
          </main>

          <aside>
            <div className="rounded-2xl border border-border bg-card p-4"><p className="eyebrow">Provider details</p><h2 className="mt-1 font-bold">{seller.cuisine}</h2><div className="mt-3 space-y-2 text-sm text-muted-foreground"><p>{seller.delivery} estimated delivery</p><p>Capacity: {seller.capacity} meals/day</p><p>{seller.remaining} meals currently shown available</p><p>Dietary support: {seller.dietary.join(", ")}</p></div><p className="mt-3 rounded-xl bg-secondary p-3 text-[11px] text-muted-foreground">Provider names, availability, capacity and any legacy ratings are development data, not verified marketplace claims.</p></div>
            {plans.length > 0 && <div className="mt-4 rounded-2xl border border-border bg-card p-4"><p className="eyebrow">Plans</p><div className="mt-2 space-y-2">{plans.map((plan) => <button key={plan.id} disabled={!delivers} onClick={() => {
              const meal = MEALS.find((item) => item.id === plan.mealId)!;
              if (plan.duration === "Daily") { addMeal(meal); onNavigate("cart"); return; }
              setCheckoutDraft({ kind: "subscription", plan: plan.duration, planOptionId: plan.id, mealId: plan.mealId, mealType: meal.mealType === "Dinner" ? "Dinner" : "Lunch" });
              onNavigate("checkout");
            }} className="w-full rounded-xl border border-border p-3 text-left disabled:opacity-40"><span className="flex justify-between gap-2 text-sm font-bold"><span>{plan.name}</span><span>₹{plan.price}</span></span><span className="mt-1 block text-xs text-muted-foreground">{plan.meals} meals · {plan.duration}</span></button>)}</div></div>}
          </aside>
        </div>
      </div>
      {cart.length > 0 && <div className="border-t border-border bg-background p-4"><PrimaryButton label={`View My Tiffin · ${cartItemCount(cart)} item${cartItemCount(cart) === 1 ? "" : "s"}`} onClick={() => onNavigate("cart")} /></div>}
    </div>
  );
}

function FunctionalMealDetailScreen({ mealId, onBack, onNavigate }: { mealId: string; onBack: () => void; onNavigate: (s: Screen) => void }) {
  const { setCart, deliveryLocation } = useAppData();
  const meal = MEALS.find((item) => item.id === mealId) ?? MEALS[0];
  const seller = SELLERS.find((item) => item.id === meal.sellerId) ?? SELLERS[0];
  const [quantity, setQuantity] = useState(1);
  const [slot, setSlot] = useState(meal.mealType === "Dinner" ? "7:30–8:00 PM" : "1:00–1:30 PM");
  const delivers = sellerDeliversTo(seller, deliveryLocation);

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex-1 overflow-y-auto">
        <div className="relative h-64 sm:h-80"><img src={meal.image} alt={meal.name} className="h-full w-full object-cover" /><button onClick={onBack} aria-label="Back" className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/90"><ChevronLeft size={20} /></button></div>
        <div className="mx-auto w-full max-w-3xl p-4 sm:p-6">
          <p className="text-xs font-bold text-accent">{meal.kitchen} · {meal.cuisine}</p>
          <div className="mt-1 flex items-start justify-between gap-4"><div><h1 className="font-display text-2xl font-bold">{meal.name}</h1><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{meal.description}</p></div><strong className="text-2xl">₹{meal.price}</strong></div>
          <div className="mt-3 flex flex-wrap gap-2">{meal.labels.map((label) => <span key={label} className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">{label}</span>)}</div>
          <div className={`mt-5 rounded-2xl p-4 ${delivers ? "bg-green-50" : "bg-amber-50"}`}><p className="text-sm font-bold">{delivers ? `Available for ${deliveryLocation.locality}` : `Not available for ${deliveryLocation.locality}`}</p><button onClick={() => onNavigate("location")} className="mt-1 min-h-11 text-xs font-bold text-accent">Change delivery location</button></div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-xs font-bold text-muted-foreground">Delivery slot<select value={slot} onChange={(event) => setSlot(event.target.value)} className="mt-1 min-h-12 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground"><option>{meal.mealType === "Dinner" ? "7:30–8:00 PM" : "1:00–1:30 PM"}</option><option>{meal.mealType === "Dinner" ? "8:00–8:30 PM" : "1:30–2:00 PM"}</option></select></label><div><p className="text-xs font-bold text-muted-foreground">Quantity</p><div className="mt-1 flex min-h-12 items-center justify-between rounded-xl border border-border bg-card px-3"><QuantitySelector value={quantity} onChange={(value) => setQuantity(Math.max(1, value))} /><strong>₹{meal.price * quantity}</strong></div></div></div>
          <p className="mt-4 text-[11px] text-muted-foreground">Ingredients and customization beyond listed labels are not configured in the development data.</p>
        </div>
      </div>
      <div className="border-t border-border bg-background p-4"><PrimaryButton disabled={!meal.available || !delivers} label={!meal.available ? "Currently unavailable" : !delivers ? "Outside Ahmedabad delivery area" : `Add to My Tiffin · ₹${meal.price * quantity}`} onClick={() => { setCart((current) => addItemToCart(current, { mealId: meal.id, quantity })); onNavigate("cart"); }} /></div>
    </div>
  );
}

// ─── Screen: Meal Detail ─────────────────────────────────────────────────────

function MealDetailScreen({ onBack, onNavigate, onAddToCart }: { onBack: () => void; onNavigate: (s: Screen) => void; onAddToCart: (quantity?: number) => void }) {
  const [qty, setQty] = useState(1);

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--background)" }}>
      <div className="flex-1 overflow-y-auto">
        <div className="relative" style={{ height: 260 }}>
          <img src={FOOD_IMAGES.gharJaisaMeal}
            alt="Ghar Jaisa Tiffin"
            className="w-full h-full object-cover" style={{ background: "#E8E0CF" }} />
          <button onClick={onBack}
            className="absolute top-4 left-4 w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.9)" }}>
            <ChevronLeft size={20} />
          </button>
        </div>

        <div className="px-4 pt-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <VegBadge small />
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "#E8F5ED", color: "#2C5F3D" }}>Healthy</span>
              </div>
              <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: "Fraunces, serif" }}>Ghar Jaisa Tiffin</h1>
              <p className="text-xs text-muted-foreground mt-0.5">by Ramaben's Kitchen</p>
              <div className="flex items-center gap-2 mt-1.5">
                <StarIcon size={13} />
                <span className="text-sm font-semibold">4.8</span>
                <span className="text-xs text-muted-foreground">(312 ratings)</span>
              </div>
            </div>
            <div className="text-2xl font-bold text-foreground">₹120</div>
          </div>

          <div className="mt-4 p-3 rounded-2xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">What's included</p>
            <div className="flex flex-wrap gap-1.5">
              {["Dal Tadka", "3 Rotli", "Mix Veg Sabzi", "Jeera Rice", "Salad", "Chaas"].map((item) => (
                <span key={item} className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ background: "var(--secondary)", color: "var(--secondary-foreground)" }}>{item}</span>
              ))}
            </div>
          </div>

          <div className="mt-3 p-3 rounded-2xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Preparation</p>
            <p className="text-xs text-muted-foreground leading-relaxed">Fresh, made-to-order. No preservatives. Cooked in a hygiene-certified home kitchen. Oil usage: moderate.</p>
          </div>

          <div className="mt-3 p-3 rounded-2xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Delivery slots</p>
            <div className="flex gap-2">
              {["12:30–1:00 PM", "1:00–1:30 PM", "1:30–2:00 PM"].map((slot, i) => (
                <button key={slot}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold border text-center"
                  style={{
                    borderColor: i === 1 ? "var(--primary)" : "var(--border)",
                    background: i === 1 ? "#FEF3D7" : "transparent",
                    color: i === 1 ? "#92400E" : "var(--muted-foreground)",
                  }}>{slot}</button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <span className="font-semibold text-sm text-foreground">Quantity</span>
            <QuantitySelector value={qty} onChange={setQty} />
          </div>
        </div>
        <div className="h-32" />
      </div>

      <div className="px-4 pb-4 pt-2 flex gap-3" style={{ borderTop: "1px solid var(--border)", background: "var(--background)" }}>
        <SecondaryButton label="Order for later" onClick={() => {}} />
        <PrimaryButton label={`Add to Cart — ₹${120 * qty}`} onClick={() => { onAddToCart(qty); onNavigate("cart"); }} />
      </div>
    </div>
  );
}

// ─── Screen: Build Your Plate ────────────────────────────────────────────────

type PlateOption = { name: string; price: number };
type PlateMenu = {
  bases: PlateOption[];
  sabzis: PlateOption[];
  proteins: PlateOption[];
  sides: PlateOption[];
  preferences: string[];
};

const PLATE_MENUS: Record<string, PlateMenu> = {
  "1": {
    bases: [{ name: "3 Rotli", price: 20 }, { name: "Jeera Rice", price: 30 }, { name: "Moong Khichdi", price: 40 }],
    sabzis: [{ name: "Mix Veg Sabzi", price: 45 }, { name: "Sev Tameta", price: 50 }, { name: "Bhindi Masala", price: 50 }],
    proteins: [{ name: "Gujarati Dal", price: 40 }, { name: "Dal Tadka", price: 45 }, { name: "Kadhi", price: 35 }],
    sides: [{ name: "Salad", price: 15 }, { name: "Chaas", price: 15 }, { name: "Papad", price: 10 }, { name: "Pickle", price: 5 }],
    preferences: ["Less oil", "Less spicy", "No onion", "No garlic", "Jain"],
  },
  "2": {
    bases: [{ name: "3 Phulka", price: 25 }, { name: "Jeera Rice", price: 35 }, { name: "2 Paratha", price: 45 }],
    sabzis: [{ name: "Aloo Gobi", price: 45 }, { name: "Palak Paneer", price: 65 }, { name: "Seasonal Veg", price: 45 }],
    proteins: [{ name: "Dal Fry", price: 45 }, { name: "Chana Masala", price: 50 }, { name: "Rajma", price: 55 }],
    sides: [{ name: "Salad", price: 15 }, { name: "Curd", price: 20 }, { name: "Mint Chutney", price: 10 }, { name: "Roasted Papad", price: 10 }],
    preferences: ["Less oil", "Less spicy", "No onion", "No garlic", "Extra protein"],
  },
  "3": {
    bases: [{ name: "3 Jain Rotli", price: 20 }, { name: "Steamed Rice", price: 30 }, { name: "Jain Khichdi", price: 40 }],
    sabzis: [{ name: "Jain Mix Veg", price: 50 }, { name: "Raw Banana Sabzi", price: 50 }, { name: "Capsicum Paneer", price: 65 }],
    proteins: [{ name: "Jain Dal", price: 45 }, { name: "Moong Dal", price: 45 }, { name: "Chana Masala", price: 50 }],
    sides: [{ name: "Salad", price: 15 }, { name: "Chaas", price: 15 }, { name: "Curd", price: 20 }, { name: "Papad", price: 10 }],
    preferences: ["Less oil", "Less spicy", "No dairy", "Extra protein", "No sugar"],
  },
};

function BuildPlateScreen({ onBack, onNavigate }: { onBack: () => void; onNavigate: (s: Screen) => void }) {
  const { deliveryLocation, setCart } = useAppData();
  const serviceableSellers = SELLERS.filter((seller) => seller.available && sellerDeliversTo(seller, deliveryLocation));
  const initialSeller = serviceableSellers[0] ?? SELLERS[0];
  const initialMenu = PLATE_MENUS[initialSeller.id];
  const [step, setStep] = useState(0);
  const [sellerId, setSellerId] = useState(initialSeller.id);
  const [base, setBase] = useState(initialMenu.bases[0].name);
  const [sabzi, setSabzi] = useState(initialMenu.sabzis[0].name);
  const [protein, setProtein] = useState(initialMenu.proteins[0].name);
  const [sides, setSides] = useState<string[]>([]);
  const [prefs, setPrefs] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const seller = SELLERS.find((item) => item.id === sellerId) ?? initialSeller;
  const menu = PLATE_MENUS[seller.id];
  const delivers = sellerDeliversTo(seller, deliveryLocation);

  const toggleSide = (s: string) => setSides((p) => p.includes(s) ? p.filter((x) => x !== s) : [...p, s]);
  const togglePref = (s: string) => setPrefs((p) => p.includes(s) ? p.filter((x) => x !== s) : [...p, s]);
  const optionPrice = (options: PlateOption[], name: string) => options.find((option) => option.name === name)?.price ?? 0;
  const plateTotal = optionPrice(menu.bases, base) + optionPrice(menu.sabzis, sabzi) + optionPrice(menu.proteins, protein)
    + sides.reduce((total, side) => total + optionPrice(menu.sides, side), 0);
  const plateSummary = [base, sabzi, protein, ...sides].join(" · ");

  const chooseSeller = (nextSellerId: string) => {
    const nextMenu = PLATE_MENUS[nextSellerId];
    setSellerId(nextSellerId);
    setBase(nextMenu.bases[0].name);
    setSabzi(nextMenu.sabzis[0].name);
    setProtein(nextMenu.proteins[0].name);
    setSides([]);
    setPrefs([]);
  };

  const addCustomPlate = () => {
    const meal = MEALS.find((item) => item.sellerId === seller.id && item.available);
    if (!meal || !delivers) return;
    setCart((current) => addItemToCart(current, {
      mealId: meal.id,
      quantity,
      customPlate: { sellerId: seller.id, base, sabzi, protein, sides, preferences: prefs, unitPrice: plateTotal },
    }));
    onNavigate("cart");
  };

  const optionButtons = (options: PlateOption[], selected: string, onSelect: (value: string) => void) => (
    <div className="plate-option-grid">
      {options.map((option) => (
        <button key={option.name} onClick={() => onSelect(option.name)} className={selected === option.name ? "active" : ""}>
          <span>{option.name}</span>
          <small>₹{option.price}</small>
          {selected === option.name && <CheckIcon size={14} color="var(--accent)" />}
        </button>
      ))}
    </div>
  );

  const steps = [
    { label: "Choose a tiffin place", content: (
      <>
        <div className="plate-provider-grid">
          {SELLERS.map((item) => {
            const servesArea = sellerDeliversTo(item, deliveryLocation);
            return (
              <button key={item.id} disabled={!item.available || !servesArea} onClick={() => chooseSeller(item.id)} className={sellerId === item.id ? "active" : ""}>
                <img src={item.img} alt="" />
                <span className="min-w-0 flex-1">
                  <strong>{item.name}</strong>
                  <small>{item.cuisine} · {item.delivery}</small>
                  <small>{servesArea ? `Delivers to ${deliveryLocation.locality}` : `Not available in ${deliveryLocation.locality}`}</small>
                </span>
                {sellerId === item.id && <CheckIcon size={17} color="var(--accent)" />}
              </button>
            );
          })}
        </div>
        {serviceableSellers.length === 0 && (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <strong>No customizable tiffin place currently serves {deliveryLocation.locality}.</strong>
            <button onClick={() => onNavigate("location")} className="mt-2 block min-h-11 text-xs font-bold text-accent">Choose another delivery area</button>
          </div>
        )}
      </>
    )},
    { label: "Choose your base", content: optionButtons(menu.bases, base, setBase) },
    { label: "Choose sabzi", content: optionButtons(menu.sabzis, sabzi, setSabzi) },
    { label: "Choose dal or protein", content: optionButtons(menu.proteins, protein, setProtein) },
    { label: "Add sides", content: (
      <div className="plate-option-grid">
        {menu.sides.map((side) => {
          const active = sides.includes(side.name);
          return (
            <button key={side.name} onClick={() => toggleSide(side.name)} className={active ? "active" : ""}>
              <span>{side.name}</span>
              <small>+₹{side.price}</small>
              {active && <CheckIcon size={14} color="var(--accent)" />}
            </button>
          );
        })}
      </div>
    )},
    { label: "Preferences", content: (
      <div className="plate-preference-list">
        {menu.preferences.map((p) => {
          const active = prefs.includes(p);
          return (
            <button key={p} onClick={() => togglePref(p)} className={active ? "active" : ""}>
              {active && <CheckIcon size={13} color="var(--accent)" />}
              {p}
            </button>
          );
        })}
      </div>
    )},
  ];

  return (
    <div className="plate-builder flex h-full flex-col bg-background">
      <div className="plate-builder-header flex items-center gap-3">
        <button onClick={onBack} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "var(--secondary)" }}>
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="font-bold text-base text-foreground">Build Your Plate</h1>
          <p className="text-xs text-muted-foreground">Pick what you want. Skip what you don't.</p>
        </div>
      </div>

      {/* Step progress */}
      <div className="plate-progress flex gap-1.5">
        {steps.map((_, i) => (
          <div key={i} className="flex-1 h-1 rounded-full transition-all"
            style={{ background: i <= step ? "var(--primary)" : "var(--muted)" }} />
        ))}
      </div>

      <div className="plate-builder-content">
        <div className="plate-step-card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="eyebrow">Step {step + 1} of {steps.length}</p>
              <h2 className="mt-1 font-display text-2xl font-bold">{steps[step].label}</h2>
            </div>
            {step > 0 && <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-muted-foreground">{seller.name}</span>}
          </div>
          <div className="mt-5">{steps[step].content}</div>
        </div>
      </div>

      {/* Live summary */}
      <div className="plate-summary">
        <div className="min-w-0">
          <p className="text-xs font-bold text-muted-foreground">{seller.name}</p>
          <p className="mt-1 line-clamp-2 text-xs font-medium leading-relaxed text-foreground">{plateSummary}</p>
          {prefs.length > 0 && <p className="mt-1 text-[11px] text-accent">{prefs.join(" · ")}</p>}
        </div>
        <div className="flex items-center justify-between mt-3 gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-foreground">₹{plateTotal * quantity}</span>
            {step === steps.length - 1 && <QuantitySelector value={quantity} onChange={(value) => setQuantity(Math.max(1, value))} />}
          </div>
          <div className="plate-footer-actions">
            {step > 0 && (
              <SecondaryButton label="Back" onClick={() => setStep(step - 1)} />
            )}
            {step < steps.length - 1 ? (
              <PrimaryButton disabled={step === 0 && !delivers} label="Next" onClick={() => setStep(step + 1)} />
            ) : (
              <PrimaryButton disabled={!delivers} label="Add to Tiffin" onClick={addCustomPlate} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Screen: Cart ─────────────────────────────────────────────────────────────

function CartScreen({ onBack, onNavigate }: { onBack: () => void; onNavigate: (s: Screen) => void }) {
  const { cart, setCart, setCheckoutDraft, address, deliveryLocation } = useAppData();
  const cartDetails = cart.map((item) => {
    const meal = MEALS.find((candidate) => candidate.id === item.mealId);
    const seller = SELLERS.find((candidate) => candidate.id === (item.customPlate?.sellerId ?? meal?.sellerId));
    return { item, meal, seller };
  }).filter((detail): detail is { item: CartItem; meal: Meal; seller: typeof SELLERS[number] } => Boolean(detail.meal && detail.seller));
  const providerIds = new Set(cartDetails.map(({ seller }) => seller.id));
  const subtotal = cartDetails.reduce((total, { item, meal }) => total + (item.customPlate?.unitPrice ?? meal.price) * item.quantity, 0);
  const deliveryFee = providerIds.size * 15;
  const total = subtotal + deliveryFee;
  const delivers = cartDetails.every(({ seller }) => sellerDeliversTo(seller, deliveryLocation));

  const updateItemQuantity = (index: number, quantity: number) => {
    setCart((current) => quantity <= 0
      ? current.filter((_, itemIndex) => itemIndex !== index)
      : current.map((item, itemIndex) => itemIndex === index ? { ...item, quantity } : item));
  };

  if (cartDetails.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center px-8 gap-4" style={{ background: "var(--background)" }}>
        <div className="text-6xl">🛒</div>
        <h2 className="text-lg font-bold text-foreground">Your tiffin is empty</h2>
        <p className="text-sm text-muted-foreground text-center">Add a meal from home screen or explore page to get started.</p>
        <PrimaryButton label="Explore meals" onClick={() => onNavigate("explore")} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--background)" }}>
      <TopBar title="Your Tiffin" onBack={onBack} />
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        <div className="flex items-center justify-between gap-3 px-1">
          <div><p className="eyebrow">Your selection</p><h2 className="font-display text-xl font-bold">{cartItemCount(cart)} meals from {providerIds.size} kitchen{providerIds.size === 1 ? "" : "s"}</h2></div>
          <button onClick={() => setCart([])} className="min-h-11 text-xs font-bold text-muted-foreground">Clear all</button>
        </div>

        {cartDetails.map(({ item, meal, seller }, index) => {
          const unitPrice = item.customPlate?.unitPrice ?? meal.price;
          return (
            <div key={`${meal.id}-${index}`} className="p-4 rounded-2xl border" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">{seller.name}</p>
                  <p className="font-bold text-sm text-foreground">{item.customPlate ? "Your Custom Plate" : meal.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.customPlate ? [item.customPlate.base, item.customPlate.sabzi, item.customPlate.protein, ...item.customPlate.sides].join(" · ") : meal.description}</p>
                  {item.customPlate && item.customPlate.preferences.length > 0 && <p className="mt-1 text-[11px] font-semibold text-accent">{item.customPlate.preferences.join(" · ")}</p>}
                </div>
                <img src={meal.image} alt={meal.name} className="w-16 h-16 rounded-xl object-cover" style={{ background: "#E8E0CF" }} />
              </div>
              <div className="flex items-center justify-between mt-3">
                <QuantitySelector value={item.quantity} onChange={(quantity) => updateItemQuantity(index, quantity)} />
                <span className="font-bold text-base">₹{unitPrice * item.quantity}</span>
              </div>
            </div>
          );
        })}

        {/* Delivery info */}
        <div className="p-4 rounded-2xl border" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2 mb-2">
            <MapPinIcon size={16} color="#E09B1A" />
            <p className="font-semibold text-sm text-foreground">Delivery address</p>
          </div>
          <p className="text-sm text-muted-foreground">{address}</p>
          <div className="flex items-center gap-2 mt-2 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
            <ClockIcon size={16} color="#E09B1A" />
            <p className="text-sm text-muted-foreground">Today · 1:00–1:30 PM</p>
          </div>
        </div>

        {/* Bill */}
        <div className="p-4 rounded-2xl border" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <p className="font-bold text-sm text-foreground mb-3">Bill Summary</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{subtotal}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Delivery fees · {providerIds.size} kitchen{providerIds.size === 1 ? "" : "s"}</span><span>₹{deliveryFee}</span></div>
            <div className="flex justify-between font-bold text-base pt-2" style={{ borderTop: "1px solid var(--border)" }}>
              <span>Total</span><span>₹{total}</span>
            </div>
          </div>
        </div>

        {!delivers && <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><strong>One or more kitchens currently deliver only within Ahmedabad.</strong><button onClick={() => onNavigate("location")} className="mt-2 block min-h-11 text-xs font-bold text-accent">Choose an Ahmedabad location</button></div>}

        <button onClick={() => onNavigate("home")} className="text-sm font-semibold w-full text-center py-2" style={{ color: "var(--primary)" }}>
          + Add another item
        </button>
      </div>

      <div className="px-4 pb-6 pt-2" style={{ borderTop: "1px solid var(--border)", background: "var(--background)" }}>
        <PrimaryButton disabled={!delivers} label={delivers ? `Proceed to Checkout — ₹${total}` : "Delivery unavailable at this address"} onClick={() => {
          const first = cartDetails[0].item;
          setCheckoutDraft({ kind: "meal", mealId: first.mealId, quantity: first.quantity, customPlate: first.customPlate, items: cart });
          onNavigate("checkout");
        }} />
      </div>
    </div>
  );
}

// ─── Screen: Checkout ────────────────────────────────────────────────────────

function CheckoutScreen({ onBack, onNavigate }: { onBack: () => void; onNavigate: (s: Screen) => void }) {
  const { checkoutDraft, setCheckoutDraft, setConfirmedOrder, address, setAddress, setCart, setSubscription, deliveryLocation, setDeliveryLocation } = useAppData();
  const [payment, setPayment] = useState("UPI");
  const [schedule, setSchedule] = useState("Tomorrow · 1:00–1:30 PM");
  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const paymentMethods = ["UPI", "Card", "Cash on Delivery"];
  const meal = MEALS.find((item) => item.id === checkoutDraft?.mealId) ?? MEALS[0];
  const isSubscription = checkoutDraft?.kind === "subscription";
  const quantity = checkoutDraft?.kind === "meal" ? checkoutDraft.quantity : 1;
  const customPlate = checkoutDraft?.kind === "meal" ? checkoutDraft.customPlate : undefined;
  const checkoutItems = checkoutDraft?.kind === "meal"
    ? (checkoutDraft.items ?? [{ mealId: checkoutDraft.mealId, quantity: checkoutDraft.quantity, customPlate: checkoutDraft.customPlate }])
    : [];
  const checkoutItemDetails = checkoutItems.map((item) => {
    const itemMeal = MEALS.find((candidate) => candidate.id === item.mealId) ?? MEALS[0];
    const itemSeller = SELLERS.find((candidate) => candidate.id === (item.customPlate?.sellerId ?? itemMeal.sellerId)) ?? SELLERS[0];
    return { item, meal: itemMeal, seller: itemSeller };
  });
  const checkoutProviderCount = new Set(checkoutItemDetails.map(({ seller }) => seller.id)).size;
  const seller = SELLERS.find((item) => item.id === meal.sellerId);
  const delivers = isSubscription
    ? Boolean(seller && sellerDeliversTo(seller, deliveryLocation))
    : checkoutItemDetails.every(({ seller: itemSeller }) => sellerDeliversTo(itemSeller, deliveryLocation));
  const configuredPlan = checkoutDraft?.kind === "subscription" ? PLAN_OPTIONS.find((plan) => plan.id === checkoutDraft.planOptionId) : undefined;
  const planPrice = checkoutDraft?.kind === "subscription" ? (configuredPlan?.price ?? (checkoutDraft.plan === "Weekly" ? 495 : 1800)) : 0;
  const mealCount = checkoutDraft?.kind === "subscription" ? (configuredPlan?.meals ?? (checkoutDraft.plan === "Weekly" ? 5 : 20)) : 0;
  const subtotal = isSubscription ? planPrice : checkoutItemDetails.reduce((sum, detail) => sum + (detail.item.customPlate?.unitPrice ?? detail.meal.price) * detail.item.quantity, 0);
  const deliveryFee = isSubscription ? 0 : checkoutProviderCount * 15;
  const discount = couponApplied ? Math.min(10, subtotal) : 0;
  const total = Math.max(0, subtotal + deliveryFee - discount);

  const updateQuantity = (index: number, next: number) => {
    if (checkoutDraft?.kind !== "meal" || next < 1) return;
    const nextItems = checkoutItems.map((item, itemIndex) => itemIndex === index ? { ...item, quantity: next } : item);
    const first = nextItems[0];
    setCheckoutDraft({ ...checkoutDraft, mealId: first.mealId, quantity: first.quantity, customPlate: first.customPlate, items: nextItems });
    setCart(nextItems);
  };

  const confirmOrder = () => {
    if (submitting) return;
    if (!address.trim()) {
      setError("Add a delivery address before continuing.");
      return;
    }
    if (!delivers) {
      setError(`${meal.kitchen} currently delivers only within Ahmedabad. Choose an Ahmedabad address.`);
      return;
    }
    const unavailableMeal = checkoutItemDetails.find(({ meal: itemMeal }) => !itemMeal.available);
    if (!isSubscription && unavailableMeal) {
      setError(`${unavailableMeal.meal.name} is no longer available.`);
      return;
    }
    setSubmitting(true);
    setError("");
    const order: ConfirmedOrder = {
      id: `TB${Date.now().toString().slice(-5)}`,
      kind: isSubscription ? "subscription" : "meal",
      title: isSubscription && checkoutDraft?.kind === "subscription"
        ? `${checkoutDraft.plan} Tiffin Plan`
        : checkoutItemDetails.length === 1
          ? (customPlate ? "Custom Plate" : meal.name)
          : `${cartItemCount(checkoutItems)} meals from ${checkoutProviderCount} kitchens`,
      kitchen: isSubscription ? meal.kitchen : Array.from(new Set(checkoutItemDetails.map(({ seller: itemSeller }) => itemSeller.name))).join(", "),
      amount: total,
      quantity: isSubscription || checkoutItemDetails.length > 1 ? undefined : checkoutItems[0]?.quantity,
      address,
      schedule: isSubscription ? `${checkoutDraft?.kind === "subscription" ? checkoutDraft.mealType : "Lunch"} · starts ${formatDate(dateAfter(1))}` : schedule,
      payment,
    };
    setConfirmedOrder(order);
    if (!isSubscription) {
      setCart([]);
    } else if (checkoutDraft.kind === "subscription") {
      const selectedPlan = PLAN_OPTIONS.find((plan) => plan.id === checkoutDraft.planOptionId);
      const planPrice = selectedPlan?.price ?? (checkoutDraft.plan === "Weekly" ? 495 : 1800);
      const mealCount = selectedPlan?.meals ?? (checkoutDraft.plan === "Weekly" ? 5 : 20);
      setSubscription({
        ...DEFAULT_SUBSCRIPTION,
        id: `SUB-${Date.now().toString().slice(-5)}`,
        plan: checkoutDraft.plan,
        mealType: checkoutDraft.mealType,
        mealId: checkoutDraft.mealId,
        remainingMeals: mealCount,
        price: planPrice,
        billingPeriod: checkoutDraft.plan === "Weekly" ? "per week" : "per month",
        schedule: makeSchedule(mealCount).map((item) => ({ ...item, mealType: checkoutDraft.mealType, mealId: checkoutDraft.mealId })),
      });
    }
    window.setTimeout(() => {
      setSubmitting(false);
      onNavigate("order-confirm");
    }, 350);
  };

  if (!checkoutDraft) {
    return (
      <div className="flex flex-col h-full items-center justify-center px-6 gap-4">
        <p className="font-bold text-lg">Nothing to check out yet</p>
        <PrimaryButton label="Browse meals" onClick={() => onNavigate("home")} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--background)" }}>
      <TopBar title="Checkout" onBack={onBack} />
      <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-4">
        <div className="p-4 rounded-2xl border" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <div className="flex justify-between gap-3">
            <p className="font-bold text-sm text-foreground">Deliver to</p>
            <button onClick={() => setEditingAddress((value) => !value)} className="text-xs font-bold text-accent min-h-11 px-2">Edit</button>
          </div>
          {editingAddress ? (
            <textarea value={address} onChange={(event) => {
              setAddress(event.target.value);
              setDeliveryLocation((current) => ({ ...current, address: event.target.value }));
            }} rows={3} className="w-full mt-2 rounded-xl border bg-transparent p-3 text-sm outline-none focus:ring-2 focus:ring-primary" />
          ) : <p className="text-sm text-muted-foreground mt-1">{address}</p>}
        </div>

        <div className="p-4 rounded-2xl border" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <p className="font-bold text-sm text-foreground">{isSubscription ? "Your subscription" : `${cartItemCount(checkoutItems)} items from ${checkoutProviderCount} kitchens`}</p>
          {isSubscription ? (
            <div className="flex items-center gap-3 mt-3">
              <img src={meal.image} alt={meal.name} className="w-16 h-16 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm">{checkoutDraft.kind === "subscription" ? `${checkoutDraft.plan} · ${checkoutDraft.mealType}` : meal.name}</p>
                <p className="text-xs text-muted-foreground">{meal.kitchen}</p>
                <p className="text-xs text-muted-foreground mt-1">{mealCount} meals · ₹{Math.round(planPrice / mealCount)}/meal</p>
              </div>
            </div>
          ) : (
            <div className="mt-3 divide-y divide-border">
              {checkoutItemDetails.map((detail, index) => (
                <div key={`${detail.item.mealId}-${index}`} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <img src={detail.meal.image} alt={detail.meal.name} className="h-14 w-14 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{detail.item.customPlate ? "Custom Plate" : detail.meal.name}</p>
                    <p className="text-xs text-muted-foreground">{detail.seller.name} · ₹{detail.item.customPlate?.unitPrice ?? detail.meal.price}</p>
                    {detail.item.customPlate && <p className="mt-1 line-clamp-1 text-[10px] text-muted-foreground">{[detail.item.customPlate.base, detail.item.customPlate.sabzi, detail.item.customPlate.protein].join(" · ")}</p>}
                  </div>
                  <QuantitySelector value={detail.item.quantity} onChange={(next) => updateQuantity(index, next)} />
                </div>
              ))}
            </div>
          )}
          {isSubscription && checkoutDraft.kind === "subscription" && (
            <label className="mt-3 block border-t border-border pt-3 text-xs font-bold text-muted-foreground">Change plan
              <select value={checkoutDraft.plan} onChange={(event) => setCheckoutDraft({ ...checkoutDraft, plan: event.target.value as "Weekly" | "Monthly", planOptionId: undefined })} className="mt-1 min-h-11 w-full rounded-xl border border-border bg-transparent px-3 text-sm text-foreground">
                <option value="Weekly">Weekly · 5 meals · ₹495</option>
                <option value="Monthly">Monthly · 20 meals · ₹1,800</option>
              </select>
            </label>
          )}
        </div>

        <div className="p-4 rounded-2xl border" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <p className="font-bold text-sm text-foreground mb-2">{isSubscription ? "Plan schedule" : "Delivery time"}</p>
          {isSubscription ? (
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Starts {formatDate(dateAfter(1))} · weekdays</p>
              <p>{checkoutDraft.kind === "subscription" ? checkoutDraft.mealType : "Lunch"} · 1:00–1:30 PM</p>
              <p>Delivery included · no automatic renewal in demo</p>
            </div>
          ) : (
            <select value={schedule} onChange={(event) => setSchedule(event.target.value)} className="w-full min-h-11 rounded-xl border border-border bg-transparent px-3 text-sm">
              <option>Tomorrow · 1:00–1:30 PM</option>
              <option>Tomorrow · 7:30–8:00 PM</option>
              <option>Day after tomorrow · 1:00–1:30 PM</option>
            </select>
          )}
        </div>

        {/* Payment */}
        <div className="p-4 rounded-2xl border" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <p className="font-bold text-sm text-foreground mb-3">Payment</p>
          <div className="space-y-2">
            {paymentMethods.map((m) => (
              <button key={m} onClick={() => setPayment(m)}
                className="w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all"
                style={{ borderColor: payment === m ? "var(--primary)" : "var(--border)", background: payment === m ? "#FEF3D7" : "transparent" }}>
                <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                  style={{ borderColor: payment === m ? "var(--primary)" : "var(--muted)" }}>
                  {payment === m && <div className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--primary)" }} />}
                </div>
                <span className="font-medium text-sm text-foreground">{m}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="p-4 rounded-2xl border" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <div className="flex gap-2 mb-4">
            <input value={coupon} onChange={(event) => setCoupon(event.target.value)} placeholder="Coupon code" className="min-w-0 flex-1 min-h-11 rounded-xl border border-border bg-transparent px-3 text-sm uppercase" />
            <button onClick={() => {
              if (couponApplied) {
                setCouponApplied(false);
                setCoupon("");
                setError("");
                return;
              }
              const valid = coupon.trim().toUpperCase() === "TIFFIN10";
              setCouponApplied(valid);
              setError(valid ? "" : "Try TIFFIN10 for ₹10 off.");
            }} className="min-h-11 rounded-xl border border-accent px-4 text-xs font-bold text-accent">{couponApplied ? "Remove" : "Apply"}</button>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">{isSubscription ? "Plan subtotal" : "Item subtotal"}</span><span>₹{subtotal}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{isSubscription ? "Delivery fee" : `Delivery fees · ${checkoutProviderCount} kitchens`}</span><span>{deliveryFee ? `₹${deliveryFee}` : "Included"}</span></div>
            {discount > 0 && <div className="flex justify-between text-accent"><span>TIFFIN10 discount</span><span>−₹{discount}</span></div>}
            <div className="flex justify-between"><span className="text-muted-foreground">Taxes & other fees</span><span>₹0</span></div>
            <div className="flex justify-between font-bold text-base pt-2" style={{ borderTop: "1px solid var(--border)" }}>
              <span>Amount due today</span><span>₹{total}</span>
            </div>
          </div>
        </div>
        {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</div>}
        {!delivers && <button onClick={() => onNavigate("location")} className="min-h-12 w-full rounded-2xl border border-accent text-sm font-bold text-accent">Choose another delivery location</button>}
        <p className="text-xs text-muted-foreground text-center">Demo checkout only. No real payment will be processed.</p>
      </div>

      <div className="px-4 pb-6 pt-2" style={{ borderTop: "1px solid var(--border)", background: "var(--background)" }}>
        <PrimaryButton label={submitting ? "Confirming…" : `Confirm demo order — ₹${total}`} disabled={submitting || !delivers || (!isSubscription && checkoutItemDetails.some(({ meal: itemMeal }) => !itemMeal.available)) || (isSubscription && !meal.available)} onClick={confirmOrder} />
      </div>
    </div>
  );
}

// ─── Screen: Order Confirmation ──────────────────────────────────────────────

const ORDER_STEPS = ["Order placed", "Preparing", "Picked up", "Out for delivery", "Delivered"];

function OrderConfirmScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const { confirmedOrder } = useAppData();
  const [activeStep] = useState(1); // Preparing
  if (!confirmedOrder) return null;

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--background)" }}>
      <div className="flex-1 overflow-y-auto px-4 pt-8 pb-6 space-y-5">
        {/* Status */}
        <div className="flex flex-col items-center gap-3 py-6">
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
            style={{ background: "#E8F5ED" }}>🍱</div>
          <h1 className="text-2xl font-bold text-foreground text-center" style={{ fontFamily: "Fraunces, serif" }}>
            Tiffin's on the way!
          </h1>
          <p className="text-sm text-muted-foreground">Order #{confirmedOrder.id} · {confirmedOrder.kitchen}</p>
        </div>

        {/* Progress */}
        <div className="p-4 rounded-2xl border" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <div className="relative">
            {/* Line */}
            <div className="absolute left-[18px] top-4 bottom-4 w-0.5" style={{ background: "var(--muted)" }} />
            <div className="absolute left-[18px] top-4" style={{
              width: 2,
              height: `${(activeStep / (ORDER_STEPS.length - 1)) * 100}%`,
              background: "var(--accent)",
            }} />
            <div className="space-y-5 relative">
              {ORDER_STEPS.map((label, i) => {
                const done = i < activeStep;
                const current = i === activeStep;
                return (
                  <div key={label} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 z-10"
                      style={{
                        background: done ? "var(--accent)" : current ? "var(--primary)" : "var(--muted)",
                        boxShadow: current ? "0 0 0 4px #FEF3D7" : "none",
                      }}>
                      {done ? <CheckIcon size={15} color="#fff" /> : (
                        <span className="text-xs font-bold" style={{ color: current ? "#1C1917" : "var(--muted-foreground)" }}>{i + 1}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: done || current ? "var(--foreground)" : "var(--muted-foreground)" }}>{label}</p>
                      {current && <p className="text-xs text-muted-foreground">Your meal is being prepared with care</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="p-4 rounded-2xl border" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between gap-3"><span className="text-muted-foreground">{confirmedOrder.kind === "subscription" ? "Plan" : "Meal"}</span><span className="font-medium text-right">{confirmedOrder.title}{confirmedOrder.quantity ? ` × ${confirmedOrder.quantity}` : ""}</span></div>
            <div className="flex justify-between gap-3"><span className="text-muted-foreground">Delivery to</span><span className="font-medium text-right max-w-[60%]">{confirmedOrder.address}</span></div>
            <div className="flex justify-between gap-3"><span className="text-muted-foreground">Schedule</span><span className="font-semibold text-right" style={{ color: "var(--accent)" }}>{confirmedOrder.schedule}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Demo amount</span><span className="font-bold">₹{confirmedOrder.amount}</span></div>
          </div>
        </div>

        <button onClick={() => onNavigate("order-tracking")}
          className="w-full py-3 rounded-2xl text-sm font-semibold border"
          style={{ borderColor: "var(--border)", background: "var(--card)", color: "var(--foreground)" }}>
          Track Order
        </button>
        <PrimaryButton label="Back to Home" onClick={() => onNavigate("home")} />
      </div>
    </div>
  );
}

// ─── Screen: Orders ───────────────────────────────────────────────────────────

function OrdersScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const [tab, setTab] = useState<"active" | "past">("active");

  const activeOrders = [
    { id: "TB1042", meal: "Ghar Jaisa Tiffin", seller: "Ramaben's Kitchen", amount: 145, status: "Preparing", time: "1:00–1:30 PM" },
  ];

  const pastOrders = [
    { id: "TB1038", meal: "Sonal's Thali Special", seller: "Sonal's Tiffin", amount: 155, status: "Delivered", date: "Yesterday" },
    { id: "TB1031", meal: "Dal-Rice Combo", seller: "Ramaben's Kitchen", amount: 95, status: "Delivered", date: "Mon, 7 Sep" },
    { id: "TB1027", meal: "Ghar Jaisa Tiffin", seller: "Ramaben's Kitchen", amount: 120, status: "Delivered", date: "Sun, 6 Sep" },
  ];

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--background)" }}>
      <div className="px-4 pt-8 pb-2">
        <h1 className="text-xl font-bold text-foreground">Your Orders</h1>
      </div>

      {/* Tabs */}
      <div className="flex px-4 gap-1 mb-4">
        {(["active", "past"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all capitalize"
            style={{
              background: tab === t ? "var(--primary)" : "var(--card)",
              color: tab === t ? "#1C1917" : "var(--muted-foreground)",
              border: `1px solid ${tab === t ? "var(--primary)" : "var(--border)"}`,
            }}>{t} {t === "active" ? `(${activeOrders.length})` : ""}</button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        {tab === "active" ? (
          activeOrders.map((o) => (
            <div key={o.id} className="p-4 rounded-2xl border" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">Order #{o.id}</p>
                  <p className="font-bold text-sm text-foreground mt-0.5">{o.meal}</p>
                  <p className="text-xs text-muted-foreground">{o.seller}</p>
                </div>
                <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: "#FEF3D7", color: "#92400E" }}>{o.status}</span>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <ClockIcon size={13} />
                  <span className="text-xs">ETA: {o.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">₹{o.amount}</span>
                  <button onClick={() => onNavigate("order-tracking")}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold"
                    style={{ background: "var(--primary)", color: "#1C1917" }}>Track</button>
                </div>
              </div>
            </div>
          ))
        ) : (
          pastOrders.map((o) => (
            <div key={o.id} className="p-4 rounded-2xl border" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">{o.date} · #{o.id}</p>
                  <p className="font-bold text-sm text-foreground mt-0.5">{o.meal}</p>
                  <p className="text-xs text-muted-foreground">{o.seller}</p>
                </div>
                <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ background: "#E8F5ED", color: "#2C5F3D" }}>Delivered</span>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                <span className="font-bold text-sm">₹{o.amount}</span>
                <button onClick={() => { onNavigate("cart"); }}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold border"
                  style={{ borderColor: "var(--border)", color: "var(--foreground)", background: "transparent" }}>Reorder</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Screen: Order Tracking ───────────────────────────────────────────────────

function OrderTrackingScreen({ onBack }: { onBack: () => void }) {
  const steps = [
    { label: "Order confirmed", detail: "The kitchen accepted your order" },
    { label: "Freshly prepared", detail: "Your tiffin was packed with care" },
    { label: "Picked up", detail: "Rajesh collected your order" },
    { label: "On the way", detail: "Your delivery partner is heading to you" },
    { label: "Delivered", detail: "Your tiffin has reached home" },
  ];
  const [current, setCurrent] = useState(3);
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState("");
  const [savedNote, setSavedNote] = useState("");
  const [messageSent, setMessageSent] = useState(false);
  const eta = current < 2 ? "25–30 min" : current === 2 ? "12–15 min" : current === 3 ? "6–8 min" : "Delivered";
  const nextUpdate = () => setCurrent((value) => value >= steps.length - 1 ? 0 : value + 1);

  return (
    <div className="flex h-full flex-col bg-background">
      <TopBar title="Track Order" onBack={onBack} />
      <div className="tracking-container">
        <section className="tracking-hero">
          <div className="tracking-live-icon"><TiffinBuddyLogo size={38} /></div>
          <div className="min-w-0 flex-1">
            <p className="eyebrow">{current === 4 ? "Delivered" : "Live order"}</p>
            <h1 className="font-display text-2xl font-bold">{steps[current].label}</h1>
            <p className="mt-1 text-xs text-muted-foreground">{steps[current].detail}</p>
          </div>
          <div className="tracking-eta"><strong>{eta}</strong><span>{current === 4 ? "at your door" : "estimated arrival"}</span></div>
        </section>

        <section className="tracking-map" aria-label="Illustrated live route from the tiffin kitchen to your home">
          <div className="tracking-street street-one" />
          <div className="tracking-street street-two" />
          <div className="tracking-route">
            <span className="tracking-route-fill" style={{ width: `${Math.max(10, (current / 4) * 100)}%` }} />
            <span className="tracking-rider" style={{ left: `${Math.min(94, Math.max(8, (current / 4) * 92))}%` }}>TB</span>
          </div>
          <div className="tracking-place tracking-kitchen"><span>K</span><strong>Kitchen</strong><small>Ramaben's</small></div>
          <div className="tracking-place tracking-home"><span>H</span><strong>Your home</strong><small>Vastrapur</small></div>
          <div className="tracking-map-caption">
            <span className="tracking-live-dot" />
            {current === 4 ? "Delivery completed" : "Location updates every few seconds"}
          </div>
        </section>

        <section className="tracking-progress-card">
          <div className="flex items-center justify-between gap-3">
            <div><p className="eyebrow">Order journey</p><h2 className="mt-1 font-bold">Your tiffin's progress</h2></div>
            <button onClick={nextUpdate} className="tracking-demo-button">{current === 4 ? "Replay demo" : "Next update"}</button>
          </div>
          <div className="tracking-steps">
            <div className="tracking-step-line" />
            <div className="tracking-step-fill" style={{ height: `${(current / (steps.length - 1)) * 100}%` }} />
            {steps.map((step, index) => {
              const done = index < current;
              const isCurrent = index === current;
              return (
                <div key={step.label} className={`tracking-step ${isCurrent ? "current" : ""}`}>
                  <div className="tracking-step-dot">
                    {done || isCurrent ? <CheckIcon size={12} color={isCurrent ? "var(--foreground)" : "var(--accent-foreground)"} /> : <span>{index + 1}</span>}
                  </div>
                  <div>
                    <p>{step.label}</p>
                    {(done || isCurrent) && <small>{step.detail}</small>}
                  </div>
                  {isCurrent && current < 4 && <span className="tracking-now">Now</span>}
                </div>
              );
            })}
          </div>
        </section>

        <section className="tracking-partner-card">
          <div className="tracking-avatar">RK</div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-sm">Rajesh K.</p>
            <p className="text-xs text-muted-foreground">Your delivery partner · 4.9 rating</p>
            {messageSent && <p className="mt-1 text-[11px] font-bold text-accent">Message sent: Please call on arrival</p>}
          </div>
          <div className="tracking-partner-actions">
            <button onClick={() => setMessageSent(true)}>Message</button>
            <a href="tel:+919876543210">Call</a>
          </div>
        </section>

        <section className="tracking-note-card">
          <button onClick={() => setNoteOpen((value) => !value)} className="w-full text-left">
            <span><strong>Delivery note</strong><small>{savedNote || "Add gate, landmark or handoff details"}</small></span>
            <span>{noteOpen ? "Close" : savedNote ? "Edit" : "Add"}</span>
          </button>
          {noteOpen && (
            <div className="tracking-note-form">
              <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="For example: Please call at the gate" />
              <button onClick={() => { setSavedNote(note.trim()); setNoteOpen(false); }}>Save note</button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// ─── Screen: Plans ───────────────────────────────────────────────────────────

function PlansScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const [activePlan, setActivePlan] = useState<"weekly" | "monthly">("weekly");
  const [mealType, setMealType] = useState<string[]>(["Lunch"]);
  const [dietType, setDietType] = useState("Vegetarian");

  const toggleMeal = (m: string) => setMealType((p) => p.includes(m) ? p.filter((x) => x !== m) : [...p, m]);

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: "var(--background)" }}>
      <div className="px-4 pt-8 pb-4">
        <h1 className="text-xl font-bold text-foreground">Tiffin Plans</h1>
        <p className="text-xs text-muted-foreground mt-1">Subscribe for consistent daily meals. Pause or skip anytime.</p>
      </div>

      {/* Plan selector */}
      <div className="px-4 mb-4 flex gap-3">
        {[
          { id: "weekly" as const, label: "Weekly", meals: "5 meals", price: "₹495", per: "₹99/meal" },
          { id: "monthly" as const, label: "Monthly", meals: "20 meals", price: "₹1,800", per: "₹90/meal", badge: "Best Value" },
        ].map((plan) => (
          <button key={plan.id} onClick={() => setActivePlan(plan.id)}
            className="flex-1 p-4 rounded-2xl border-2 text-left transition-all"
            style={{
              borderColor: activePlan === plan.id ? "var(--primary)" : "var(--border)",
              background: activePlan === plan.id ? "#FEF3D7" : "var(--card)",
            }}>
            {plan.badge && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full mb-2 inline-block"
                style={{ background: "var(--accent)", color: "#fff" }}>{plan.badge}</span>
            )}
            <p className="font-bold text-base text-foreground">{plan.label}</p>
            <p className="text-xs text-muted-foreground">{plan.meals}</p>
            <p className="text-xl font-bold text-foreground mt-1">{plan.price}</p>
            <p className="text-[11px] text-muted-foreground">{plan.per}</p>
          </button>
        ))}
      </div>

      {/* Meal type */}
      <div className="px-4 mb-4">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Meal time</p>
        <div className="flex gap-2">
          {["Lunch", "Dinner"].map((m) => {
            const active = mealType.includes(m);
            return (
              <button key={m} onClick={() => toggleMeal(m)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all"
                style={{
                  background: active ? "var(--primary)" : "var(--card)",
                  borderColor: active ? "var(--primary)" : "var(--border)",
                  color: active ? "#1C1917" : "var(--muted-foreground)",
                }}>{m}</button>
            );
          })}
        </div>
      </div>

      {/* Diet type */}
      <div className="px-4 mb-4">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Diet preference</p>
        <div className="flex flex-wrap gap-2">
          {["Vegetarian", "Jain", "Healthy", "Low Oil"].map((d) => (
            <button key={d} onClick={() => setDietType(d)}
              className="px-4 py-2 rounded-xl text-xs font-semibold border transition-all"
              style={{
                background: dietType === d ? "#E8F5ED" : "var(--card)",
                borderColor: dietType === d ? "#2C5F3D" : "var(--border)",
                color: dietType === d ? "#2C5F3D" : "var(--muted-foreground)",
              }}>{d}</button>
          ))}
        </div>
      </div>

      {/* Active plan card */}
      <div className="px-4 mb-4">
        <div className="p-4 rounded-2xl" style={{ background: "#E8F5ED", border: "1px solid #2C5F3D22" }}>
          <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#2C5F3D" }}>Your active plan</p>
          <div className="flex justify-between text-sm font-semibold text-foreground">
            <span>Weekly · Lunch</span>
            <span style={{ color: "#2C5F3D" }}>3 meals left</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Ramaben's Kitchen · Expires 14 Sep</p>
          <div className="flex gap-2 mt-3">
            {["Pause Plan", "Skip a Day", "Change Meal"].map((action) => (
              <button key={action}
                className="flex-1 py-1.5 rounded-xl text-[10px] font-bold border text-center"
                style={{ borderColor: "#2C5F3D44", color: "#2C5F3D", background: "rgba(44,95,61,0.06)" }}>
                {action}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 pb-6">
        <PrimaryButton label={`Subscribe — ${activePlan === "weekly" ? "₹495/week" : "₹1,800/month"}`} onClick={() => onNavigate("checkout")} />
        <p className="text-xs text-muted-foreground text-center mt-2">Cancel or pause anytime. No questions asked.</p>
      </div>
    </div>
  );
}

type PlanAction = "pause" | "skip" | "change" | "billing" | null;

function FunctionalPlansScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const { subscription, setSubscription, setCheckoutDraft } = useAppData();
  const [selectedPlan, setSelectedPlan] = useState<"Weekly" | "Monthly">("Weekly");
  const [mealType, setMealType] = useState<"Lunch" | "Dinner">("Lunch");
  const [action, setAction] = useState<PlanAction>(null);
  const [pauseStart, setPauseStart] = useState(dateAfter(1));
  const [resumeDate, setResumeDate] = useState(dateAfter(3));
  const [selectedScheduleId, setSelectedScheduleId] = useState("");
  const [selectedMealId, setSelectedMealId] = useState(subscription.mealId);
  const [notice, setNotice] = useState("");
  const currentMeal = MEALS.find((meal) => meal.id === subscription.mealId) ?? MEALS[0];
  const eligibleMeals = subscription.schedule.filter((meal) => meal.status === "Scheduled" && meal.date >= dateAfter(1) && isBeforeSkipCutoff(meal.date));
  const nextMeal = eligibleMeals[0];

  const closeAction = () => {
    setAction(null);
    setSelectedScheduleId("");
    setSelectedMealId(subscription.mealId);
  };

  const pausePlan = () => {
    if (!pauseStart || !resumeDate || resumeDate <= pauseStart) {
      setNotice("Choose a resume date after the pause start date.");
      return;
    }
    setSubscription((plan) => ({
      ...plan,
      status: "Paused",
      pauseStart,
      resumeDate,
      schedule: plan.schedule.map((meal) =>
        meal.date >= pauseStart && meal.date < resumeDate && meal.status === "Scheduled"
          ? { ...meal, status: "Paused" }
          : meal,
      ),
    }));
    setNotice(`Plan paused until ${formatDate(resumeDate)}. The kitchen preparation count has been updated.`);
    closeAction();
  };

  const resumePlan = () => {
    setSubscription((plan) => ({
      ...plan,
      status: "Active",
      pauseStart: undefined,
      resumeDate: undefined,
      schedule: plan.schedule.map((meal) => meal.status === "Paused" && meal.date >= dateAfter(1) ? { ...meal, status: "Scheduled" } : meal),
    }));
    setNotice("Your plan is active again and eligible meals are back on the kitchen schedule.");
  };

  const skipMeal = () => {
    const target = eligibleMeals.find((meal) => meal.id === selectedScheduleId);
    if (!target) {
      setNotice("Select an eligible upcoming meal.");
      return;
    }
    setSubscription((plan) => ({
      ...plan,
      remainingMeals: Math.max(0, plan.remainingMeals - 1),
      schedule: plan.schedule.map((meal) => meal.id === target.id ? { ...meal, status: "Skipped" } : meal),
    }));
    setNotice(`${formatDate(target.date)} marked as skipped. Demo policy: no refund or credit is issued.`);
    closeAction();
  };

  const changeMeal = () => {
    const replacement = MEALS.find((meal) => meal.id === selectedMealId);
    if (!replacement?.available || !nextMeal) {
      setNotice("That meal is unavailable or there is no eligible delivery to change.");
      return;
    }
    setSubscription((plan) => ({
      ...plan,
      mealId: replacement.id,
      schedule: plan.schedule.map((meal) => meal.id === nextMeal.id ? { ...meal, mealId: replacement.id } : meal),
    }));
    const difference = replacement.price - currentMeal.price;
    setNotice(`${nextMeal ? formatDate(nextMeal.date) : "Next meal"} changed to ${replacement.name}. ${difference === 0 ? "No price difference." : `${difference > 0 ? "Additional" : "Reduced by"} ₹${Math.abs(difference)}; no charge or refund was processed in demo mode.`}`);
    closeAction();
  };

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: "var(--background)" }}>
      <div className="page-container py-6 sm:py-8">
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-wider text-accent">Daily meal membership</p>
          <h1 className="font-display text-2xl font-bold text-foreground mt-1">My Tiffin</h1>
          <p className="text-sm text-muted-foreground mt-1">Your plan, upcoming meals and controls in one place.</p>
        </div>

        {notice && (
          <div role="status" className="mb-4 flex items-start justify-between gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-900">
            <span>{notice}</span>
            <button aria-label="Dismiss message" onClick={() => setNotice("")} className="min-h-11 min-w-11 font-bold">×</button>
          </div>
        )}

        <div className="active-plan-grid">
          <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
            <img src={currentMeal.image} alt={currentMeal.name} className="h-44 w-full object-cover sm:h-52" />
            <div className="p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">{subscription.kitchen}</p>
                  <h2 className="text-lg font-bold text-foreground">{subscription.plan} Tiffin Plan</h2>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${subscription.status === "Paused" ? "bg-amber-100 text-amber-900" : "bg-green-100 text-green-900"}`}>{subscription.status}</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                <div><p className="text-xs text-muted-foreground">Meal</p><p className="font-semibold">{currentMeal.name}</p></div>
                <div><p className="text-xs text-muted-foreground">Meal type</p><p className="font-semibold">{subscription.mealType}</p></div>
                <div><p className="text-xs text-muted-foreground">Remaining</p><p className="font-semibold">{subscription.remainingMeals} meals</p></div>
                <div><p className="text-xs text-muted-foreground">Next delivery</p><p className="font-semibold">{nextMeal ? formatDate(nextMeal.date) : "Not scheduled"}</p></div>
                <div><p className="text-xs text-muted-foreground">Time</p><p className="font-semibold">{nextMeal?.slot ?? "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Billing</p><p className="font-semibold">₹{subscription.price} {subscription.billingPeriod}</p></div>
              </div>
              {subscription.status === "Paused" && subscription.resumeDate && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">Paused through {formatDate(subscription.resumeDate)}. Paused meals are excluded from preparation. Demo policy does not alter billing.</p>}
              <div className="action-grid mt-5">
                {subscription.status === "Paused" ? (
                  <button onClick={resumePlan} className="action-button bg-accent text-white">Resume Plan</button>
                ) : (
                  <button onClick={() => setAction("pause")} className="action-button">Pause Plan</button>
                )}
                <button disabled={subscription.status === "Paused"} onClick={() => setAction("skip")} className="action-button disabled:cursor-not-allowed disabled:opacity-40">Skip Meal</button>
                <button disabled={subscription.status === "Paused"} onClick={() => setAction("change")} className="action-button disabled:cursor-not-allowed disabled:opacity-40">Change Meal</button>
                <button onClick={() => setAction("billing")} className="action-button">Billing Details</button>
                <a href="tel:+919876543210" className="action-button">Contact Kitchen</a>
              </div>
            </div>
          </section>

          <aside className="rounded-3xl border border-border bg-card p-4 sm:p-5">
            <h2 className="font-bold text-foreground">Upcoming schedule</h2>
            <div className="mt-3 space-y-2">
              {subscription.schedule.map((item) => {
                const meal = MEALS.find((candidate) => candidate.id === item.mealId) ?? currentMeal;
                return (
                  <div key={item.id} className="flex items-center gap-3 rounded-2xl bg-secondary p-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{formatDate(item.date)} · {item.mealType}</p>
                      <p className="truncate text-xs text-muted-foreground">{meal.name} · {item.slot}</p>
                    </div>
                    <span className={`text-xs font-bold ${item.status === "Scheduled" ? "text-accent" : "text-muted-foreground"}`}>{item.status}</span>
                  </div>
                );
              })}
            </div>
          </aside>
        </div>

        <section className="mt-5 rounded-3xl border border-border bg-card p-4 sm:p-5">
          <h2 className="font-bold">Choose another plan</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {(["Weekly", "Monthly"] as const).map((plan) => {
              const price = plan === "Weekly" ? 495 : 1800;
              const count = plan === "Weekly" ? 5 : 20;
              return <button key={plan} onClick={() => setSelectedPlan(plan)} className={`min-h-24 rounded-2xl border-2 p-4 text-left ${selectedPlan === plan ? "border-primary bg-amber-50" : "border-border"}`}><span className="font-bold">{plan}</span><span className="mt-1 block text-sm text-muted-foreground">{count} meals · ₹{price}</span></button>;
            })}
          </div>
          <div className="mt-3 flex gap-2">
            {(["Lunch", "Dinner"] as const).map((type) => <button key={type} onClick={() => setMealType(type)} className={`min-h-11 flex-1 rounded-xl border font-semibold ${mealType === type ? "border-primary bg-primary" : "border-border"}`}>{type}</button>)}
          </div>
          <div className="mt-4">
            <PrimaryButton label={`Continue with ${selectedPlan} · ₹${selectedPlan === "Weekly" ? 495 : 1800}`} onClick={() => {
              setCheckoutDraft({ kind: "subscription", plan: selectedPlan, mealId: subscription.mealId, mealType });
              onNavigate("checkout");
            }} />
          </div>
        </section>
      </div>

      {action && (
        <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && closeAction()}>
          <div role="dialog" aria-modal="true" aria-labelledby="plan-dialog-title" className="dialog-sheet">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-accent">{subscription.kitchen}</p>
                <h2 id="plan-dialog-title" className="font-display text-xl font-bold">
                  {action === "pause" ? "Pause your plan" : action === "skip" ? "Skip an upcoming meal" : action === "change" ? "Change your next meal" : "Billing details"}
                </h2>
              </div>
              <button aria-label="Close dialog" onClick={closeAction} className="min-h-11 min-w-11 rounded-full bg-secondary font-bold">×</button>
            </div>

            {action === "pause" && <div className="mt-4 space-y-4">
              <p className="text-sm text-muted-foreground">{subscription.plan} · {subscription.mealType}. Meals inside the pause window will be removed from the kitchen preparation count.</p>
              <label className="block text-sm font-semibold">Pause starts<input type="date" min={dateAfter(1)} value={pauseStart} onChange={(event) => setPauseStart(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-border bg-transparent px-3" /></label>
              <label className="block text-sm font-semibold">Resume on<input type="date" min={dateAfter(2)} value={resumeDate} onChange={(event) => setResumeDate(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-border bg-transparent px-3" /></label>
              <div className="rounded-xl bg-secondary p-3 text-xs text-muted-foreground"><strong>Demo pause policy:</strong> scheduled meals are held, but billing, refunds and credits are unchanged. This policy is local configuration only; no payment provider is connected.</div>
              <PrimaryButton label="Confirm Pause" onClick={pausePlan} />
              <SecondaryButton label="Keep Plan Active" onClick={closeAction} />
            </div>}

            {action === "skip" && <div className="mt-4 space-y-3">
              <p className="text-sm text-muted-foreground">Select one eligible meal. Cutoff is 8:00 PM on the previous day. Skipping does not change billing or extend the plan in demo mode.</p>
              {eligibleMeals.length ? eligibleMeals.map((item) => {
                const meal = MEALS.find((candidate) => candidate.id === item.mealId) ?? currentMeal;
                return <button key={item.id} onClick={() => setSelectedScheduleId(item.id)} className={`w-full rounded-2xl border p-3 text-left ${selectedScheduleId === item.id ? "border-primary bg-amber-50" : "border-border"}`}><span className="block text-sm font-bold">{formatDate(item.date)} · {item.mealType}</span><span className="text-xs text-muted-foreground">{meal.name} · {item.slot}</span></button>;
              }) : <p className="rounded-xl bg-secondary p-3 text-sm">No eligible meals. Past, paused and already skipped meals cannot be skipped.</p>}
              <PrimaryButton label="Confirm Skip" disabled={!selectedScheduleId} onClick={skipMeal} />
              <SecondaryButton label="Keep Meal" onClick={closeAction} />
            </div>}

            {action === "change" && <div className="mt-4 space-y-3">
              <p className="text-sm text-muted-foreground">Changes apply to the next eligible delivery. Price differences are shown before confirmation; demo mode does not charge or refund them.</p>
              {MEALS.map((meal) => {
                const difference = meal.price - currentMeal.price;
                return <button key={meal.id} disabled={!meal.available} onClick={() => setSelectedMealId(meal.id)} className={`flex w-full gap-3 rounded-2xl border p-3 text-left ${selectedMealId === meal.id ? "border-primary bg-amber-50" : "border-border"}`}><img src={meal.image} alt="" className="h-16 w-16 rounded-xl object-cover" /><span className="min-w-0 flex-1"><strong className="block text-sm">{meal.name}</strong><span className="line-clamp-2 text-xs text-muted-foreground">{meal.description}</span><span className="mt-1 block text-xs font-bold">₹{meal.price} · {difference === 0 ? "No difference" : `${difference > 0 ? "+" : "−"}₹${Math.abs(difference)}`}</span></span></button>;
              })}
              <PrimaryButton label="Confirm Meal Change" onClick={changeMeal} />
              <SecondaryButton label="Keep Current Meal" onClick={closeAction} />
            </div>}

            {action === "billing" && <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Plan price</span><strong>₹{subscription.price}</strong></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Billing period</span><strong>{subscription.billingPeriod}</strong></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><strong>Included</strong></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Renewal</span><strong>Not enabled in demo</strong></div>
              <p className="rounded-xl bg-secondary p-3 text-xs text-muted-foreground">Skipped and paused meals do not trigger automatic credits in this configurable demo policy.</p>
              <PrimaryButton label="Done" onClick={closeAction} />
            </div>}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Screen: Profile ──────────────────────────────────────────────────────────

function ProfileScreen({ onNavigate, account, onSignOut }: { onNavigate: (s: Screen) => void; account: AuthSession | null; onSignOut: () => void }) {
  const prefs = [
    { label: "Vegetarian", active: true },
    { label: "Less spicy", active: true },
    { label: "Less oil", active: false },
    { label: "No onion", active: false },
    { label: "No garlic", active: false },
    { label: "Jain", active: false },
  ];
  const [userPrefs, setUserPrefs] = useState(prefs);
  const togglePref = (i: number) => setUserPrefs((p) => p.map((x, j) => j === i ? { ...x, active: !x.active } : x));

  const menuItems = [
    { label: "Saved Addresses", emoji: "📍" },
    { label: "Payment Methods", emoji: "💳" },
    { label: "Order History", emoji: "📦" },
    { label: "Tiffin Plans", emoji: "📅", screen: "plans" as Screen },
    { label: "Notifications", emoji: "🔔" },
    { label: "Help & Support", emoji: "💬" },
    { label: "Seller Dashboard", emoji: "🍳", screen: "seller-dashboard" as Screen },
  ];

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: "var(--background)" }}>
      {/* Avatar */}
      <div className="px-4 pt-8 pb-5 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
          style={{ background: "var(--primary)", color: "#1C1917" }}>{account?.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "TB"}</div>
        <div>
          <p className="font-bold text-lg text-foreground">{account?.name ?? "TiffinBuddy Guest"}</p>
          <p className="text-xs text-muted-foreground">{account?.email ?? "Local demo session"}</p>
          <p className="text-xs font-semibold capitalize text-accent">{account?.role ?? "customer"} account</p>
        </div>
      </div>

      {/* My Preferences */}
      <div className="px-4 mb-4">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">My Preferences</p>
        <div className="p-4 rounded-2xl border" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <div className="flex flex-wrap gap-2">
            {userPrefs.map((p, i) => (
              <button key={p.label} onClick={() => togglePref(i)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all"
                style={{
                  background: p.active ? "#E8F5ED" : "transparent",
                  borderColor: p.active ? "#2C5F3D" : "var(--border)",
                  color: p.active ? "#2C5F3D" : "var(--muted-foreground)",
                }}>
                {p.active && <CheckIcon size={11} />}
                {p.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-3">These preferences influence your meal recommendations automatically.</p>
        </div>
      </div>

      {/* Menu */}
      <div className="px-4 pb-6">
        <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          {menuItems.map((item, i) => (
            <button key={item.label}
              onClick={() => item.screen && onNavigate(item.screen)}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all active:bg-muted"
              style={{ borderBottom: i < menuItems.length - 1 ? "1px solid var(--border)" : "none" }}>
              <span className="text-xl w-8 text-center">{item.emoji}</span>
              <span className="flex-1 font-medium text-sm text-foreground">{item.label}</span>
              <ChevronLeft size={16} color="#A8A29E" />
            </button>
          ))}
        </div>
        <button onClick={onSignOut} className="mt-4 min-h-12 w-full rounded-2xl border border-red-200 bg-red-50 text-sm font-bold text-red-700">Sign out</button>
      </div>
    </div>
  );
}

// ─── Screen: Seller Dashboard ─────────────────────────────────────────────────

function SellerDashboardScreen({ onBack, onSignOut }: { onBack: () => void; onSignOut: () => void }) {
  const { subscription } = useAppData();
  const [providerTab, setProviderTab] = useState("Home");
  const preparationCount = subscription.schedule.filter((meal) => meal.status === "Scheduled").length;
  const stats = [
    { label: "Total Orders", value: 11 + preparationCount, color: "#1C1917", bg: "#FEF3D7" },
    { label: "Preparing", value: preparationCount, color: "#92400E", bg: "#FEF3D7" },
    { label: "Ready", value: 7, color: "#2C5F3D", bg: "#E8F5ED" },
    { label: "Delivered", value: 2, color: "#2C5F3D", bg: "#E8F5ED" },
  ];

  const [menuItems, setMenuItems] = useState(
    TODAY_MENU.map((m) => ({ ...m }))
  );
  const toggleAvailable = (id: string) =>
    setMenuItems((prev) => prev.map((m) => m.id === id ? { ...m, available: !m.available } : m));

  const orders = [
    { id: "1042", customer: "Priya M.", meal: "2 Tiffins", notes: "Less spicy · No onion", time: "1:00 PM", status: "Preparing" },
    { id: "1043", customer: "Rahul S.", meal: "1 Tiffin", notes: "Regular", time: "1:30 PM", status: "Accepted" },
    { id: "1044", customer: "Neha P.", meal: "1 Tiffin", notes: "Jain · No garlic", time: "1:00 PM", status: "New" },
  ];

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--background)" }}>
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pt-8 pb-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Good morning,</p>
            <h1 className="text-xl font-bold text-foreground">Ramaben's Kitchen 🍳</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onSignOut} className="min-h-11 rounded-xl border border-border px-3 text-xs font-bold text-muted-foreground">Sign out</button>
            <button onClick={onBack} aria-label="Back" className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: "var(--secondary)" }}><ChevronLeft size={18} /></button>
          </div>
        </div>

        {/* Availability toggle */}
        <div className="mx-4 mb-4 p-3 rounded-2xl flex items-center justify-between" style={{ background: "#E8F5ED", border: "1px solid #2C5F3D22" }}>
          <div>
            <p className="font-bold text-sm" style={{ color: "#2C5F3D" }}>Accepting Orders</p>
            <p className="text-xs text-muted-foreground">Today's capacity: 15 · Subscriber meals: {preparationCount}</p>
          </div>
          <div className="w-12 h-6 rounded-full cursor-pointer relative" style={{ background: "#2C5F3D" }}>
            <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
          </div>
        </div>

        {/* Stats */}
        <div className="px-4 mb-4 grid grid-cols-4 gap-2">
          {stats.map((s) => (
            <div key={s.label} className="p-3 rounded-2xl flex flex-col items-center gap-0.5"
              style={{ background: s.bg }}>
              <span className="text-xl font-bold" style={{ color: s.color }}>{s.value}</span>
              <span className="text-[10px] font-medium text-center leading-tight" style={{ color: "var(--muted-foreground)" }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Today's menu */}
        <div className="px-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold text-foreground">Today's Menu</p>
            <button className="text-xs font-semibold" style={{ color: "var(--primary)" }}>+ Add Dish</button>
          </div>
          <div className="space-y-2">
            {menuItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-2xl border"
                style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                <div>
                  <p className="font-semibold text-sm text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">₹{item.price}</p>
                </div>
                <button onClick={() => toggleAvailable(item.id)}
                  className="px-3 py-1 rounded-full text-[11px] font-bold transition-all"
                  style={{
                    background: item.available ? "#E8F5ED" : "#FEE2E2",
                    color: item.available ? "#2C5F3D" : "#DC2626",
                  }}>
                  {item.available ? "Available" : "Sold Out"}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Orders */}
        <div className="px-4 mb-6">
          <p className="text-sm font-bold text-foreground mb-2">Orders</p>
          <div className="space-y-2">
            <div className="p-4 rounded-2xl border" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-sm text-foreground">Subscription #{subscription.id}</p>
                  <p className="text-xs text-muted-foreground">Priya M. · {preparationCount} meals in preparation schedule</p>
                  <p className="text-xs font-medium mt-1" style={{ color: "#92400E" }}>{MEALS.find((meal) => meal.id === subscription.mealId)?.name} · {subscription.mealType}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-green-100 text-green-800">{subscription.status}</span>
              </div>
            </div>
            {orders.map((o) => (
              <div key={o.id} className="p-4 rounded-2xl border" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-bold text-sm text-foreground">Order #{o.id}</p>
                    <p className="text-xs text-muted-foreground">{o.customer} · {o.meal}</p>
                    {o.notes !== "Regular" && (
                      <p className="text-xs font-medium mt-0.5" style={{ color: "#92400E" }}>{o.notes}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{
                        background: o.status === "New" ? "#FEE2E2" : o.status === "Accepted" ? "#FEF3D7" : "#E8F5ED",
                        color: o.status === "New" ? "#DC2626" : o.status === "Accepted" ? "#92400E" : "#2C5F3D",
                      }}>{o.status}</span>
                    <p className="text-xs text-muted-foreground mt-1">{o.time}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {o.status === "New" && (
                    <button className="flex-1 py-1.5 rounded-xl text-xs font-bold text-center"
                      style={{ background: "var(--accent)", color: "#fff" }}>Accept</button>
                  )}
                  {o.status === "Accepted" && (
                    <button className="flex-1 py-1.5 rounded-xl text-xs font-bold text-center"
                      style={{ background: "var(--primary)", color: "#1C1917" }}>Mark Preparing</button>
                  )}
                  {o.status === "Preparing" && (
                    <button className="flex-1 py-1.5 rounded-xl text-xs font-bold text-center"
                      style={{ background: "var(--accent)", color: "#fff" }}>Mark Ready</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <nav className="provider-nav border-t border-border bg-card px-2 py-2">
        {["Home", "Orders", "Menu", "Earnings", "Profile"].map((item) => (
          <button key={item} onClick={() => setProviderTab(item)} className={`min-h-11 rounded-xl px-2 text-xs font-bold ${providerTab === item ? "bg-primary text-foreground" : "text-muted-foreground"}`}>{item}</button>
        ))}
      </nav>
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────

const MAIN_SCREENS: Screen[] = ["home", "explore", "orders", "plans", "profile"];

export default function App() {
  const [screen, setScreen] = useState<Screen>("splash");
  const [location, setLocation] = useState("Vastrapur");
  const [history, setHistory] = useState<Screen[]>([]);
  const [selectedSellerId, setSelectedSellerId] = useState("1");
  const [selectedMealId, setSelectedMealId] = useState("ghar-jaisa");
  const [cart, setCart] = usePersistentState<CartItem[]>("tiffinbuddy-cart-v2", []);
  const [subscription, setSubscription] = usePersistentState<Subscription>("tiffinbuddy-subscription", DEFAULT_SUBSCRIPTION);
  const [checkoutDraft, setCheckoutDraft] = usePersistentState<CheckoutDraft | null>("tiffinbuddy-checkout", null);
  const [confirmedOrder, setConfirmedOrder] = usePersistentState<ConfirmedOrder | null>("tiffinbuddy-last-order", null);
  const [address, setAddress] = usePersistentState("tiffinbuddy-address", "Ahmedabad, Gujarat, India");
  const [deliveryLocation, setDeliveryLocation] = usePersistentState<DeliveryLocation>("tiffinbuddy-delivery-location", {
    address: "Ahmedabad, Gujarat, India",
    locality: "Ahmedabad",
    latitude: AHMEDABAD_CENTER[0],
    longitude: AHMEDABAD_CENTER[1],
  });
  const [exploreState, setExploreState] = usePersistentState<ExploreState>("tiffinbuddy-explore-state", DEFAULT_EXPLORE_STATE);
  const [authAccount, setAuthAccount] = usePersistentState<AuthAccount | null>("tiffinbuddy-auth-account", null);
  const [authSession, setAuthSession] = usePersistentState<AuthSession | null>("tiffinbuddy-auth-session", null);
  const cartCount = cartItemCount(cart);

  useEffect(() => setLocation(deliveryLocation.locality), [deliveryLocation.locality]);

  const navigate = (s: Screen, data?: unknown) => {
    if (s === "seller-profile" && data && typeof data === "object" && "sellerId" in data) {
      setSelectedSellerId(String(data.sellerId));
    } else if (s === "seller-profile" && data && typeof data === "object" && "id" in data) {
      setSelectedSellerId(String(data.id));
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

  const addToCart = (quantity = 1) => setCart((current) => addItemToCart(current, { mealId: "ghar-jaisa", quantity }));

  const finishLogin = (session: AuthSession) => {
    setAuthSession(session);
    setHistory([]);
    setScreen(session.role === "provider" ? "seller-dashboard" : "home");
  };

  const finishSignup = (account: AuthAccount) => {
    setAuthAccount(account);
    setAuthSession({ name: account.name, email: account.email, role: account.role });
    setHistory([]);
    setScreen(account.role === "provider" ? "seller-dashboard" : "onboarding");
  };

  const signOut = () => {
    setAuthSession(null);
    setHistory([]);
    setScreen("auth-welcome");
  };

  const showNav = MAIN_SCREENS.includes(screen);

  const appData = useMemo<AppData>(() => ({
    cart,
    setCart,
    subscription,
    setSubscription,
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
  }), [cart, subscription, checkoutDraft, confirmedOrder, address, deliveryLocation, exploreState]);

  return (
    <AppDataContext.Provider value={appData}>
    <div className="app-shell flex items-center justify-center w-full h-full">
      {/* Mobile frame */}
      <div
        className="app-frame relative flex flex-col overflow-hidden"
      >
        {/* Status bar spacer */}
        {screen !== "splash" && <div className="status-spacer" />}

        {/* Screen content */}
        <main className="app-content flex-1 flex flex-col overflow-hidden">
          {screen === "splash" && <SplashScreen onDone={() => setScreen(authSession ? (authSession.role === "provider" ? "seller-dashboard" : "home") : "auth-welcome")} />}
          {screen === "auth-welcome" && <AuthWelcomeScreen onLogin={() => setScreen("login")} onSignup={() => setScreen("signup")} />}
          {screen === "login" && <LoginScreen account={authAccount} onBack={() => setScreen("auth-welcome")} onSignup={() => setScreen("signup")} onSuccess={finishLogin} />}
          {screen === "signup" && <SignupScreen onBack={() => setScreen("auth-welcome")} onLogin={() => setScreen("login")} onSuccess={finishSignup} />}
          {screen === "onboarding" && <OnboardingScreen onDone={() => setScreen("location")} />}
          {screen === "location" && <LiveLocationScreen onDone={(selected) => {
            setDeliveryLocation(selected);
            setLocation(selected.locality);
            setAddress([selected.details, selected.address].filter(Boolean).join(", "));
            if (history.length > 0) {
              const previous = history[history.length - 1];
              setHistory((items) => items.slice(0, -1));
              setScreen(previous);
            } else {
              setScreen("home");
            }
          }} />}
          {screen === "home" && <HomeScreen location={location} onNavigate={navigate} onAddToCart={addToCart} />}
          {screen === "explore" && <FunctionalExploreScreen onNavigate={navigate} />}
          {screen === "orders" && <OrdersScreen onNavigate={navigate} />}
          {screen === "plans" && <FunctionalPlansScreen onNavigate={navigate} />}
          {screen === "profile" && <ProfileScreen onNavigate={navigate} account={authSession} onSignOut={signOut} />}
          {screen === "seller-profile" && <FunctionalSellerProfileScreen sellerId={selectedSellerId} onBack={goBack} onNavigate={navigate} />}
          {screen === "meal-detail" && <FunctionalMealDetailScreen mealId={selectedMealId} onBack={goBack} onNavigate={navigate} />}
          {screen === "build-plate" && <BuildPlateScreen onBack={goBack} onNavigate={navigate} />}
          {screen === "cart" && <CartScreen onBack={goBack} onNavigate={navigate} />}
          {screen === "checkout" && <CheckoutScreen onBack={goBack} onNavigate={navigate} />}
          {screen === "order-confirm" && <OrderConfirmScreen onNavigate={navigate} />}
          {screen === "order-tracking" && <OrderTrackingScreen onBack={goBack} />}
          {screen === "seller-dashboard" && <SellerDashboardScreen onBack={goBack} onSignOut={signOut} />}
        </main>

        {/* Bottom nav */}
        {showNav && (
          <BottomNav
            active={screen}
            onNavigate={navigate}
            cartCount={cartCount}
          />
        )}

        {/* Home indicator */}
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
