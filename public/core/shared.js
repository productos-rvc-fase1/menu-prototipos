import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut }
  from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';
import { doc, getDoc }
  from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

// Detectar si la página corre dentro de un iframe (ej. cargada desde dashboard)
const IN_IFRAME = window.self !== window.top;
if (IN_IFRAME) document.documentElement.classList.add('in-iframe');

/**
 * Guard de autenticación + verificación de permiso por módulo.
 * Rellena #usr-nombre, #avatar, #admin-bar, #btn-salir y gestiona conexión.
 * Si corre en iframe, redirige la ventana PADRE en vez del propio frame.
 * @param {string|null} moduloId
 * @returns {Promise<{user, userData, permiso}>}
 */
export function initPage(moduloId = null) {
  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      unsub();

      if (!user) {
        _redirect('index.html');
        return;
      }

      try {
        const userId = user.email.toLowerCase();
        const permisoRef = moduloId
          ? getDoc(doc(db, 'permisos', `${userId}_${moduloId}`))
          : Promise.resolve(null);

        const [userSnap, permisoSnap] = await Promise.all([
          getDoc(doc(db, 'usuarios', userId)),
          permisoRef
        ]);

        // Sin permiso → volver al dashboard
        if (moduloId && (!permisoSnap?.exists() || !permisoSnap.data().puede_ver)) {
          _redirect('dashboard.html');
          return;
        }

        const userData = userSnap.exists() ? userSnap.data() : {};
        const nombre   = user.displayName || user.email.split('@')[0];

        _set('usr-nombre', el => el.textContent = nombre);
        _set('avatar',     el => el.textContent = iniciales(nombre));
        _set('admin-bar',  el => { if (userData.esAdmin) el.style.display = 'flex'; });
        _set('btn-salir',  el => el.addEventListener('click', salir));

        window.addEventListener('online',  () => _setConexion(true));
        window.addEventListener('offline', () => _setConexion(false));

        resolve({ user, userData, permiso: permisoSnap?.data() ?? null });
      } catch (e) { reject(e); }
    });
  });
}

// Redirige respetando contexto iframe
function _redirect(url) {
  if (IN_IFRAME) { window.top.location.href = new URL(url, window.top.location.href).href; }
  else           { window.location.href = url; }
}

function _set(id, fn) {
  const el = document.getElementById(id);
  if (el) fn(el);
}

function _setConexion(ok) {
  _set('dot',     el => el.className = 'dot' + (ok ? '' : ' off'));
  _set('txt-con', el => el.textContent = ok ? 'Conectado' : 'Sin conexión');
}

export function salir() {
  signOut(auth).then(() => { _redirect('index.html'); });
}

export function toast(msg, duration = 2600) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), duration);
}

export function formatUF(n) {
  return new Intl.NumberFormat('es-CL', {
    minimumFractionDigits: 0, maximumFractionDigits: 0
  }).format(n) + ' UF';
}

export function formatCLP(n) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency', currency: 'CLP', maximumFractionDigits: 0
  }).format(n);
}

function iniciales(str) {
  const p = str.trim().split(/\s+/);
  return p.length >= 2
    ? (p[0][0] + p[1][0]).toUpperCase()
    : str.substring(0, 2).toUpperCase();
}