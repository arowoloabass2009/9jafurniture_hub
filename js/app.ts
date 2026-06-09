// ============================================================
// 9JA FURNITURE HUB — TypeScript Application Core  v1.0
// Nigeria's Premier Furniture Marketplace
// ============================================================

// ─────────────────── Types ───────────────────
interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: 'buyer' | 'business' | 'designer' | 'admin';
  state?: string;
  businessName?: string;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: 'home' | 'office' | 'kitchen' | 'outdoor';
}

interface FormValidation {
  isValid: boolean;
  errors: Record<string, string>;
}

interface ToastType {
  show(message: string, type?: 'success' | 'error' | 'info' | 'warning', duration?: number): void;
}

type ValidationRule = 'required' | 'email' | 'phone' | 'password' | 'min8';

// ─────────────────── Utilities ───────────────────
const generateId = (): string =>
  Math.random().toString(36).substring(2, 10).toUpperCase();

const formatNaira = (amount: number): string =>
  '₦' + amount.toLocaleString('en-NG');

const formatDate = (date: Date): string =>
  date.toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' });

const debounce = <T extends (...args: unknown[]) => void>(fn: T, delay: number): T => {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: unknown[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  }) as T;
};

const clamp = (n: number, lo: number, hi: number): number =>
  Math.min(hi, Math.max(lo, n));

// ─────────────────── Navbar ───────────────────
class Navbar {
  private nav: HTMLElement;
  private hamburger: HTMLButtonElement | null;
  private navLinks: HTMLElement | null;
  private navActions: HTMLElement | null;

  constructor() {
    this.nav        = document.querySelector('.navbar') as HTMLElement;
    this.hamburger  = document.querySelector('.hamburger');
    this.navLinks   = document.querySelector('.navbar-nav');
    this.navActions = document.querySelector('.navbar-actions');
    this.init();
  }

  private init(): void {
    window.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });
    this.hamburger?.addEventListener('click', this.toggleMenu.bind(this));
    this.setActiveLink();
    document.addEventListener('click', (e) => {
      if (!(e.target as Element).closest('.navbar')) this.closeMenu();
    });
  }

  private handleScroll(): void {
    this.nav?.classList.toggle('scrolled', window.scrollY > 20);
  }

  private toggleMenu(): void {
    this.navLinks?.classList.toggle('open');
    this.navActions?.classList.toggle('open');
  }

  private closeMenu(): void {
    this.navLinks?.classList.remove('open');
    this.navActions?.classList.remove('open');
  }

  private setActiveLink(): void {
    const current = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll<HTMLAnchorElement>('.nav-link').forEach(link => {
      const href = link.getAttribute('href') || '';
      if (href === current || (current === '' && href === 'index.html')) {
        link.classList.add('active');
      }
    });
  }
}

// ─────────────────── Form Validator ───────────────────
class FormValidator {
  static validateEmail(v: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  static validatePhone(v: string): boolean {
    return /^(\+234|0)[789][01]\d{8}$/.test(v.replace(/[\s\-()]/g, ''));
  }

  static validatePassword(v: string): boolean {
    return v.length >= 8;
  }

  static validateRequired(v: string): boolean {
    return v.trim().length > 0;
  }

  static getPasswordStrength(password: string): { score: number; label: string; color: string } {
    let score = 0;
    if (password.length >= 8)           score++;
    if (password.length >= 12)          score++;
    if (/[A-Z]/.test(password))         score++;
    if (/[0-9]/.test(password))         score++;
    if (/[^A-Za-z0-9]/.test(password))  score++;
    const levels = [
      { label: 'Very Weak', color: '#ef4444' },
      { label: 'Weak',      color: '#f59e0b' },
      { label: 'Fair',      color: '#fbbf24' },
      { label: 'Good',      color: '#d4930a' },
      { label: 'Strong',    color: '#b45309' },
    ];
    return { score, ...levels[clamp(score, 0, 4)] };
  }

  static validate(form: HTMLFormElement): FormValidation {
    const errors: Record<string, string> = {};
    form.querySelectorAll<HTMLInputElement>('[data-validate]').forEach(el => {
      const rules  = (el.dataset.validate || '').split('|') as ValidationRule[];
      const label  = el.dataset.label || el.name || 'Field';
      const value  = el.value;
      rules.forEach(rule => {
        if (rule === 'required' && !this.validateRequired(value))
          errors[el.name] = label + ' is required';
        if (rule === 'email' && value && !this.validateEmail(value))
          errors[el.name] = 'Enter a valid email address';
        if (rule === 'phone' && value && !this.validatePhone(value))
          errors[el.name] = 'Enter a valid Nigerian phone number';
        if ((rule === 'password' || rule === 'min8') && value && !this.validatePassword(value))
          errors[el.name] = 'Password must be at least 8 characters';
      });
    });
    return { isValid: Object.keys(errors).length === 0, errors };
  }

  static showErrors(form: HTMLFormElement, errors: Record<string, string>): void {
    form.querySelectorAll('.field-error').forEach(el => el.remove());
    form.querySelectorAll('.form-control').forEach(el => el.classList.remove('error'));
    Object.entries(errors).forEach(([name, message]) => {
      const inp = form.querySelector<HTMLInputElement>('[name="' + name + '"]');
      if (!inp) return;
      inp.classList.add('error');
      const span = document.createElement('span');
      span.className   = 'field-error';
      span.textContent = message;
      inp.parentElement?.appendChild(span);
      inp.addEventListener('input', () => {
        inp.classList.remove('error');
        span.remove();
      }, { once: true });
    });
    (form.querySelector<HTMLElement>('.form-control.error'))?.focus();
  }

  static clearErrors(form: HTMLFormElement): void {
    form.querySelectorAll('.field-error').forEach(el => el.remove());
    form.querySelectorAll('.form-control').forEach(el => el.classList.remove('error'));
  }
}

// ─────────────────── Toast ───────────────────
class Toast implements ToastType {
  private container: HTMLElement;

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'toast-container';
    document.body.appendChild(this.container);
  }

  show(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', duration = 4500): void {
    const icons: Record<string, string> = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
    const toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.innerHTML =
      '<span class="toast-icon">' + icons[type] + '</span>' +
      '<span class="toast-msg">'  + message      + '</span>' +
      '<button class="toast-close" aria-label="Close">✕</button>';
    this.container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('toast-enter'));
    const close = () => {
      toast.classList.add('toast-exit');
      toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    };
    toast.querySelector('.toast-close')?.addEventListener('click', close);
    setTimeout(close, duration);
  }
}

// ─────────────────── Cart Manager ───────────────────
class CartManager {
  private static STORAGE_KEY = '9ja_furniture_cart';

  static getItems(): CartItem[] {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  }

  static addItem(name: string, price: number, category: CartItem['category'] = 'home'): void {
    const items = this.getItems();
    const existing = items.find(i => i.name === name);
    if (existing) {
      existing.quantity++;
    } else {
      items.push({ id: generateId(), name, price, quantity: 1, category });
    }
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
    this.updateCartUI();
  }

  static removeItem(id: string): void {
    const items = this.getItems().filter(i => i.id !== id);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
    this.updateCartUI();
  }

  static getTotal(): number {
    return this.getItems().reduce((sum, i) => sum + i.price * i.quantity, 0);
  }

  static getCount(): number {
    return this.getItems().reduce((sum, i) => sum + i.quantity, 0);
  }

  static updateCartUI(): void {
    const countEl = document.getElementById('cartCount');
    if (countEl) countEl.textContent = String(this.getCount());
  }

  static clear(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.updateCartUI();
  }
}

// ─────────────────── Scroll Animator ───────────────────
class ScrollAnimator {
  private observer: IntersectionObserver;

  constructor() {
    this.observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          this.observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal, .reveal-left, .reveal-right')
      .forEach(el => this.observer.observe(el));
  }

  refresh(): void {
    document.querySelectorAll('.reveal:not(.visible),.reveal-left:not(.visible),.reveal-right:not(.visible)')
      .forEach(el => this.observer.observe(el));
  }
}

// ─────────────────── Counter Animation ───────────────────
const animateCounter = (el: HTMLElement, target: number, duration = 2000): void => {
  const t0     = performance.now();
  const prefix = el.dataset.prefix || '';
  const suffix = el.dataset.suffix || '';
  const useSep = el.dataset.nosep === undefined;
  const fmt    = (n: number) => (useSep ? n.toLocaleString() : String(n));
  const tick   = (now: number) => {
    const p = Math.min((now - t0) / duration, 1);
    const v = Math.floor((1 - Math.pow(1 - p, 3)) * target);
    el.textContent = prefix + fmt(v) + suffix;
    if (p < 1) requestAnimationFrame(tick);
    else el.textContent = prefix + fmt(target) + suffix;
  };
  requestAnimationFrame(tick);
};

// ─────────────────── DOM Init ───────────────────
document.addEventListener('DOMContentLoaded', () => {
  new Navbar();
  new ScrollAnimator();

  // Inject shared utility styles
  const style = document.createElement('style');
  style.textContent = [
    '.toast-container{position:fixed;bottom:28px;right:28px;z-index:9999;display:flex;flex-direction:column;gap:10px;pointer-events:none;}',
    '.toast{display:flex;align-items:center;gap:10px;padding:14px 18px;border-radius:12px;background:#fff;',
    'box-shadow:0 10px 40px rgba(59,26,8,.22);font-size:.9rem;font-weight:500;min-width:290px;max-width:390px;',
    'pointer-events:all;opacity:0;transform:translateX(40px);transition:opacity .35s,transform .35s;}',
    '.toast.toast-enter{opacity:1;transform:none;}',
    '.toast.toast-exit{opacity:0;transform:translateX(40px);}',
    '.toast-success{border-left:4px solid #b45309;}',
    '.toast-error{border-left:4px solid #ef4444;}',
    '.toast-info{border-left:4px solid #3b1a08;}',
    '.toast-warning{border-left:4px solid #d4930a;}',
    '.toast-icon{font-size:1rem;font-weight:800;flex-shrink:0;}',
    '.toast-success .toast-icon{color:#b45309;}.toast-error .toast-icon{color:#ef4444;}',
    '.toast-info .toast-icon{color:#3b1a08;}.toast-warning .toast-icon{color:#d4930a;}',
    '.toast-msg{flex:1;}.toast-close{background:none;border:none;color:#a07850;font-size:.85rem;cursor:pointer;padding:2px;margin-left:4px;}',
    '.toast-close:hover{color:#3b1a08;}',
    '.form-control.error{border-color:#ef4444!important;box-shadow:0 0 0 4px rgba(239,68,68,.14)!important;}',
    '.field-error{display:block;color:#ef4444;font-size:.78rem;margin-top:4px;font-weight:600;}',
  ].join('');
  document.head.appendChild(style);

  // Animate counters on scroll
  const counters = document.querySelectorAll<HTMLElement>('[data-counter]');
  if (counters.length) {
    const co = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const el = e.target as HTMLElement;
          animateCounter(el, parseInt(el.dataset.counter || '0', 10));
          co.unobserve(el);
        }
      });
    }, { threshold: 0.4 });
    counters.forEach(el => co.observe(el));
  }

  // Password strength meter
  const pwInput = document.querySelector<HTMLInputElement>('#password');
  const pwSegs  = document.querySelectorAll<HTMLElement>('.pw-strength-seg');
  const pwLabel = document.querySelector<HTMLElement>('.pw-strength-label');
  if (pwInput) {
    pwInput.addEventListener('input', () => {
      const { score, label, color } = FormValidator.getPasswordStrength(pwInput.value);
      pwSegs.forEach((seg, i) => { seg.style.background = i < score ? color : 'var(--border)'; });
      if (pwLabel) { pwLabel.textContent = label; pwLabel.style.color = color; }
    });
  }

  // Password visibility toggle
  document.querySelectorAll<HTMLElement>('[data-toggle-pw]').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.togglePw || '';
      const input = document.getElementById(targetId) as HTMLInputElement | null;
      if (!input) return;
      const isText = input.type === 'text';
      input.type = isText ? 'password' : 'text';
      btn.textContent = isText ? '👁' : '🙈';
    });
  });

  // Update cart count
  CartManager.updateCartUI();

  // Expose to inline scripts
  const g = window as unknown as Record<string, unknown>;
  g._toast         = new Toast();
  g.FormValidator  = FormValidator;
  g.CartManager    = CartManager;
  g.debounce       = debounce;
  g.generateId     = generateId;
  g.formatDate     = formatDate;
  g.formatNaira    = formatNaira;
  g.animateCounter = animateCounter;
});
