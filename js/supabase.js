// ============================================================
// 9JA FURNITURE HUB — Supabase Client & Services
// Project: xzgrcahunjnhpqicvpwp.supabase.co  ✅ Connected
// ============================================================
'use strict';

const SUPABASE_URL = 'https://xzgrcahunjnhpqicvpwp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6Z3JjYWh1bmpuaHBxaWN2cHdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5ODE2OTUsImV4cCI6MjA5NjU1NzY5NX0.zjLbg3apxg_pTGCiGjwGx5k__qylIfuPshp9agN1l1g';

const _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, storageKey: '9ja_furniture_xzgrcahunjnhpqicvpwp' }
});

// ============================================================
// AUTH SERVICE
// ============================================================
const SupabaseAuth = {

  async signUp({ firstName, lastName, email, password, phone,
                 role, state, businessName }) {
    const { data, error } = await _sb.auth.signUp({
      email, password,
      options: {
        data: {
          first_name:    firstName,
          last_name:     lastName,
          role:          role || 'buyer',
          phone:         phone || null,
          state:         state || null,
          business_name: businessName || null,
        }
      }
    });
    if (error) throw error;
    const uid = data.user?.id;
    if (!uid) throw new Error('Sign-up failed — no user ID returned.');

    // Upsert profile row
    const { error: pErr } = await _sb.from('profiles').upsert({
      id: uid, first_name: firstName, last_name: lastName,
      email, phone: phone || null, role: role || 'buyer',
      state: state || null, business_name: businessName || null,
    }, { onConflict: 'id' });
    if (pErr) console.warn('Profile upsert:', pErr.message);

    return data;
  },

  async signIn(email, password) {
    const { data, error } = await _sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signOut() {
    await _sb.auth.signOut();
    window.location.href = 'login.html';
  },

  async getSession() {
    const { data: { session } } = await _sb.auth.getSession();
    return session;
  },

  async getUser() {
    const { data: { user } } = await _sb.auth.getUser();
    return user;
  },

  async getProfile() {
    const user = await this.getUser();
    if (!user) return null;
    const { data } = await _sb.from('profiles').select('*').eq('id', user.id).single();
    return data;
  },

  async isLoggedIn() {
    return !!(await this.getSession());
  },

  async requireAuth(redirectTo = 'login.html') {
    if (!(await this.isLoggedIn())) window.location.href = redirectTo;
  }
};

// ============================================================
// KYC SERVICE
// ============================================================
const KYCService = {

  async getMine() {
    const user = await SupabaseAuth.getUser();
    if (!user) return null;
    const { data } = await _sb.from('kyc_records')
      .select('*').eq('profile_id', user.id).maybeSingle();
    return data;
  },

  async save(payload) {
    const user = await SupabaseAuth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { error } = await _sb.from('kyc_records').upsert(
      { profile_id: user.id, ...payload, updated_at: new Date().toISOString() },
      { onConflict: 'profile_id' }
    );
    if (error) throw error;
  },

  async submit(payload) {
    const user = await SupabaseAuth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { error } = await _sb.from('kyc_records').upsert(
      {
        profile_id: user.id, ...payload,
        status: 'under_review',
        submitted_at: new Date().toISOString()
      },
      { onConflict: 'profile_id' }
    );
    if (error) throw error;
  },

  async uploadFile(file, folder) {
    const user = await SupabaseAuth.getUser();
    if (!user) throw new Error('Not authenticated');
    const ext  = file.name.split('.').pop();
    const path = `${user.id}/${folder}/${Date.now()}.${ext}`;
    const { error } = await _sb.storage
      .from('kyc-documents').upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = await _sb.storage
      .from('kyc-documents').createSignedUrl(path, 604800);
    return data?.signedUrl || path;
  }
};

// ============================================================
// ORDERS SERVICE
// ============================================================
const OrdersService = {

  async getMyOrders() {
    const user = await SupabaseAuth.getUser();
    if (!user) return [];
    const { data } = await _sb.from('orders')
      .select('*').eq('user_id', user.id)
      .order('created_at', { ascending: false });
    return data || [];
  },

  async createOrder({ productId, productName, price, category, state }) {
    const user = await SupabaseAuth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { data, error } = await _sb.from('orders').insert({
      user_id:      user.id,
      product_id:   productId,
      product_name: productName,
      price,
      category,
      delivery_state: state,
      status:         'confirmed',
      order_ref:      '9JF-' + Math.random().toString(36).substring(2,7).toUpperCase(),
    }).select().single();
    if (error) throw error;
    return data;
  },

  async getOrderStats() {
    const user = await SupabaseAuth.getUser();
    if (!user) return { total: 0, active: 0, totalSpent: 0 };
    const { data } = await _sb.from('orders').select('*').eq('user_id', user.id);
    const rows = data || [];
    return {
      total:      rows.length,
      active:     rows.filter(o => o.status !== 'delivered').length,
      totalSpent: rows.reduce((s, o) => s + (o.price || 0), 0),
    };
  }
};

// ============================================================
// WISHLIST SERVICE
// ============================================================
const WishlistService = {

  async getMine() {
    const user = await SupabaseAuth.getUser();
    if (!user) return [];
    const { data } = await _sb.from('wishlists')
      .select('*').eq('user_id', user.id)
      .order('created_at', { ascending: false });
    return data || [];
  },

  async toggle(productId, productName, price) {
    const user = await SupabaseAuth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { data: existing } = await _sb.from('wishlists')
      .select('id').eq('user_id', user.id).eq('product_id', productId).maybeSingle();
    if (existing) {
      await _sb.from('wishlists').delete().eq('id', existing.id);
      return false; // removed
    } else {
      await _sb.from('wishlists').insert({ user_id: user.id, product_id: productId, product_name: productName, price });
      return true; // added
    }
  }
};

// ============================================================
// CONTACT SERVICE
// ============================================================
const ContactService = {
  async send({ firstName, lastName, email, subject, message }) {
    const { error } = await _sb.from('contact_messages').insert(
      { first_name: firstName, last_name: lastName, email, subject, message }
    );
    if (error) throw error;
  }
};

// Expose globally
window.SupabaseAuth    = SupabaseAuth;
window.KYCService      = KYCService;
window.OrdersService   = OrdersService;
window.WishlistService = WishlistService;
window.ContactService  = ContactService;
window._sb             = _sb;
