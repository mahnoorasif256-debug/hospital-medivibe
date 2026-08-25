// Realtime sync manager (plain global class, ES6+ syntax).
//
// The original project relied on a Node/Express + WebSocket backend for
// cross-tab/cross-client sync. This static version has no server, so it
// re-implements the same "live" experience entirely in the browser using:
//   - BroadcastChannel: instantly pushes updates to every other open tab
//   - localStorage: persists appointments/holds so state survives reloads
//     and so brand-new tabs can pick up the current state on load
//
// The public API (appointments, holds, activeClientsCount, isConnected,
// clientId, holdSlot, releaseSlot, bookSlot, cancelBooking) is kept
// identical to the original so app.js needs no changes.

const SYNC_CHANNEL_NAME = 'appointment_sync';
const STORAGE_KEY_APPOINTMENTS = 'bookapt_appointments';
const STORAGE_KEY_HOLDS = 'bookapt_holds';
const STORAGE_KEY_PRESENCE = 'bookapt_presence';
const PRESENCE_TTL_MS = 8000;
const PRESENCE_PING_MS = 3000;

class RealtimeSyncManager {
  constructor(onUpdateCallback) {
    this.onUpdate = onUpdateCallback;

    // Client ID stored in sessionStorage for tab persistence
    let storedId = sessionStorage.getItem('booking_client_id');
    if (!storedId) {
      storedId = `client-${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem('booking_client_id', storedId);
    }
    this.clientId = storedId;

    this.appointments = this._loadFromStorage(STORAGE_KEY_APPOINTMENTS, []);
    this.holds = this._loadFromStorage(STORAGE_KEY_HOLDS, []);
    this.activeClientsCount = 1;
    // There's no server socket to (dis)connect from any more, but other
    // parts of the UI reference isConnected to show a "live" indicator -
    // BroadcastChannel (when available) is effectively always "connected".
    this.isConnected = false;

    this.broadcastChannel = null;
    this.presenceTimer = null;
    this.holdCleanupTimer = null;

    this._pruneExpiredHolds({ silent: true });

    this.initBroadcastChannel();
    this.initPresence();
    this.initHoldCleanup();
  }

  // --- persistence helpers ---
  _loadFromStorage(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  _saveToStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      // ignore quota / privacy-mode errors
    }
  }

  _persistAppointments() {
    this._saveToStorage(STORAGE_KEY_APPOINTMENTS, this.appointments);
  }

  _persistHolds() {
    this._saveToStorage(STORAGE_KEY_HOLDS, this.holds);
  }

  _pruneExpiredHolds({ silent = false } = {}) {
    const before = this.holds.length;
    this.holds = this.holds.filter((h) => h.expiresAt > Date.now());
    if (this.holds.length !== before) {
      this._persistHolds();
      if (!silent && this.onUpdate) this.onUpdate();
    }
  }

  // --- cross-tab channel ---
  initBroadcastChannel() {
    try {
      this.broadcastChannel = new BroadcastChannel(SYNC_CHANNEL_NAME);
      this.broadcastChannel.onmessage = (event) => {
        this.handleIncomingMessage(event.data);
      };
      this.isConnected = true;
    } catch (e) {
      console.warn('BroadcastChannel not supported in this environment; falling back to local-tab-only sync.');
      this.isConnected = false;
    }
    if (this.onUpdate) this.onUpdate();
  }

  broadcastLocal(msg) {
    try {
      this.broadcastChannel?.postMessage(msg);
    } catch (e) {
      // ignore
    }
  }

  handleIncomingMessage(msg) {
    if (!msg) return;
    const { type, payload } = msg;

    if (type === 'SLOT_HELD') {
      const newHold = payload;
      this.holds = this.holds.filter((h) => h.id !== newHold.id);
      this.holds.push(newHold);
      this._persistHolds();
    } else if (type === 'SLOT_RELEASED') {
      const { id } = payload;
      this.holds = this.holds.filter((h) => h.id !== id);
      this._persistHolds();
    } else if (type === 'SLOT_BOOKED') {
      const newApt = payload;
      this.appointments = this.appointments.filter((a) => a.id !== newApt.id);
      this.appointments.push(newApt);
      const holdKey = `${newApt.providerId}:${newApt.date}:${newApt.timeSlot}`;
      this.holds = this.holds.filter((h) => h.id !== holdKey);
      this._persistAppointments();
      this._persistHolds();
    } else if (type === 'SLOT_CANCELLED') {
      const { appointmentId, providerId, date, timeSlot } = payload;
      this.appointments = this.appointments.filter((a) => a.id !== appointmentId);
      const holdKey = `${providerId}:${date}:${timeSlot}`;
      this.holds = this.holds.filter((h) => h.id !== holdKey);
      this._persistAppointments();
      this._persistHolds();
    } else if (type === 'PRESENCE_PING') {
      this._recordPresence(payload.clientId, payload.ts);
    }

    if (this.onUpdate) {
      this.onUpdate();
    }
  }

  // --- presence (active tab count) ---
  initPresence() {
    this._pingPresence();
    this.presenceTimer = setInterval(() => this._pingPresence(), PRESENCE_PING_MS);
    window.addEventListener('beforeunload', () => this._clearOwnPresence());
  }

  _pingPresence() {
    const ts = Date.now();
    this._recordPresence(this.clientId, ts);
    this.broadcastLocal({ type: 'PRESENCE_PING', payload: { clientId: this.clientId, ts } });
  }

  _recordPresence(clientId, ts) {
    const presence = this._loadFromStorage(STORAGE_KEY_PRESENCE, {});
    presence[clientId] = ts;

    // Prune stale entries
    const now = Date.now();
    Object.keys(presence).forEach((id) => {
      if (now - presence[id] > PRESENCE_TTL_MS) delete presence[id];
    });

    this._saveToStorage(STORAGE_KEY_PRESENCE, presence);
    const count = Object.keys(presence).length;
    if (count !== this.activeClientsCount) {
      this.activeClientsCount = Math.max(1, count);
    }
  }

  _clearOwnPresence() {
    const presence = this._loadFromStorage(STORAGE_KEY_PRESENCE, {});
    delete presence[this.clientId];
    this._saveToStorage(STORAGE_KEY_PRESENCE, presence);
  }

  // --- periodic hold expiry cleanup ---
  initHoldCleanup() {
    this.holdCleanupTimer = setInterval(() => this._pruneExpiredHolds(), 1000);
  }

  // --- outgoing actions ---
  sendWS(msg) {
    // Kept the historical method name so callers below don't need renaming,
    // but this now only fans the message out locally + across tabs.
    const fullMsg = { ...msg, clientId: this.clientId };
    this.broadcastLocal(fullMsg);
    this.handleIncomingMessage(fullMsg);
  }

  holdSlot(providerId, date, timeSlot) {
    const id = `${providerId}:${date}:${timeSlot}`;
    this.sendWS({
      type: 'SLOT_HELD',
      payload: {
        id,
        providerId,
        date,
        timeSlot,
        holderClientId: this.clientId,
        expiresAt: Date.now() + 5 * 60 * 1000, // 5 minute hold
      },
    });
  }

  releaseSlot(providerId, date, timeSlot) {
    const id = `${providerId}:${date}:${timeSlot}`;
    this.sendWS({
      type: 'SLOT_RELEASED',
      payload: { id },
    });
  }

  async bookSlot(aptData) {
    const newApt = {
      ...aptData,
      id: `apt-${Date.now()}`,
      status: 'confirmed',
      createdAt: Date.now(),
    };
    this.sendWS({
      type: 'SLOT_BOOKED',
      payload: newApt,
    });
    return newApt;
  }

  async cancelBooking(appointmentId) {
    const apt = this.appointments.find((a) => a.id === appointmentId);
    this.sendWS({
      type: 'SLOT_CANCELLED',
      payload: {
        appointmentId,
        providerId: apt?.providerId,
        date: apt?.date,
        timeSlot: apt?.timeSlot,
      },
    });
  }
}
