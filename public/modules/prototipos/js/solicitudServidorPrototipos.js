// ─────────────────────────────────────────────────────────
// solicitudServidorPrototipos.js
// Equivalente en este stack a solicitudServidorProveedores.js:
// maneja la UI y los eventos, y llama al despachador de
// acciones (procesarPeticionPrototipos.js).
// ─────────────────────────────────────────────────────────
import { initPage, toast } from '../../../core/shared.js';
import { procesar } from './procesarPeticionPrototipos.js';

const MODULO_ID = 'prototipos';

let esAdmin = false;
let usuariosCache = null; // se carga una sola vez, al abrir el primer modal

const els = {
  tabla:       () => document.getElementById('tabla-prototipos'),
  form:        () => document.getElementById('form-prototipo'),
  inputId:     () => document.getElementById('prototipo-id'),
  nombre:      () => document.getElementById('nombre'),
  url:         () => document.getElementById('url'),
  version:     () => document.getElementById('version'),
  repo:        () => document.getElementById('repo'),
  btnCancelar: () => document.getElementById('btn-cancelar'),
  modalOverlay:() => document.getElementById('modal-usuarios-overlay'),
  modalBox:    () => document.getElementById('modal-usuarios-box')
};


/* ---- Render ---- */
function renderTabla(prototipos) {
  const tbody = els.tabla().querySelector('tbody');
  tbody.innerHTML = '';

  prototipos.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="td-name">${p.nombre}</td>
      <td>${p.version || '—'}</td>
      <td></td>
      <td></td>
      <td></td>
    `;

    const tdRepo = tr.children[2];
    if (p.repo) {
      const linkRepo = document.createElement('a');
      linkRepo.href = p.repo;
      linkRepo.target = '_blank';
      linkRepo.rel = 'noopener noreferrer';
      linkRepo.textContent = 'Ver repositorio';
      tdRepo.appendChild(linkRepo);
    } else {
      tdRepo.textContent = '—';
    }

    const tdUrl = tr.children[3];
    const btnAcceder = document.createElement('button');
    btnAcceder.className = 'btn-export';
    btnAcceder.textContent = 'Acceder a Prototipo';
    btnAcceder.addEventListener('click', () => abrirPrototipo(p.url));
    tdUrl.appendChild(btnAcceder);

    const tdAcciones = tr.children[4];

    const btnEditar = document.createElement('button');
    btnEditar.className = 'btn-export';
    btnEditar.textContent = 'Editar';
    btnEditar.addEventListener('click', () => llenarFormulario(p));

    const btnEliminar = document.createElement('button');
    btnEliminar.className = 'btn-export';
    btnEliminar.textContent = 'Eliminar';
    btnEliminar.addEventListener('click', () => manejarEliminar(p));

    tdAcciones.appendChild(btnEditar);
    tdAcciones.appendChild(btnEliminar);

    if (esAdmin) {
      const btnUsuarios = document.createElement('button');
      btnUsuarios.className = 'btn-export';
      btnUsuarios.textContent = 'Agregar Usuarios';
      btnUsuarios.addEventListener('click', () => abrirModalUsuarios(p));
      tdAcciones.appendChild(btnUsuarios);
    }

    tbody.appendChild(tr);
  });
}

// Abre la URL del prototipo en una nueva pestana. Se usa
// noopener,noreferrer para que la pestana nueva no tenga
// acceso a la ventana que la abrio (buena practica de
// seguridad al abrir sitios de terceros).
function abrirPrototipo(url) {
  if (!url) return;
  window.open(url, '_blank', 'noopener,noreferrer');
}

function llenarFormulario(p) {
  els.inputId().value = p?.id ?? '';
  els.nombre().value  = p?.nombre ?? '';
  els.url().value     = p?.url ?? '';
  els.version().value = p?.version ?? '';
  els.repo().value    = p?.repo ?? '';
}

function limpiarFormulario() {
  els.form().reset();
  els.inputId().value = '';
}

function leerFormulario() {
  return {
    id: els.inputId().value || null,
    nombre: els.nombre().value.trim(),
    url: els.url().value.trim(),
    version: els.version().value.trim(),
    repo: els.repo().value.trim()
  };
}


/* ---- Llamadas al despachador ---- */
async function fncCargarPrototipos() {
  const prototipos = await procesar('listar');
  renderTabla(prototipos);
}

async function fncGuardarPrototipo(datos) {
  try {
    const resultado = await procesar('guardar', datos);
    toast(resultado.mensaje);
    limpiarFormulario();
    await fncCargarPrototipos();
  } catch (e) {
    console.error('Error al guardar prototipo:', e);
    toast(e.message || 'No se pudo guardar el prototipo');
  }
}

async function manejarEliminar(p) {
  if (!confirm(`Eliminar "${p.nombre}"?`)) return;
  try {
    const resultado = await procesar('eliminar', { id: p.id });
    toast(resultado.mensaje);
    await fncCargarPrototipos();
  } catch (e) {
    console.error('Error al eliminar prototipo:', e);
    toast('No se pudo eliminar el prototipo');
  }
}


/* ---- Eventos ---- */
els.form().addEventListener('submit', (e) => {
  e.preventDefault();
  fncGuardarPrototipo(leerFormulario());
});

els.btnCancelar().addEventListener('click', limpiarFormulario);

document.getElementById('btn-volver-menu').addEventListener('click', () => {
  const enIframe = window.self !== window.top;
  if (enIframe) window.top.postMessage({ type: 'GO_HOME' }, location.origin);
  else window.location.href = '../../dashboard.html';
});


/* ---- Modal: usuarios con acceso a este prototipo ---- */
async function abrirModalUsuarios(p) {
  if (!usuariosCache) usuariosCache = await procesar('listarUsuarios');
  const permisoMap = await procesar('permisosDePrototipo', { prototipoId: p.id });

  els.modalBox().innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:18px 22px 14px;border-bottom:1px solid #eee">
      <h3 style="margin:0;font-size:16px">Usuarios con acceso — ${p.nombre}</h3>
      <button id="modal-usuarios-close" style="width:28px;height:28px;border-radius:50%;border:none;background:#f1f1f1;font-size:18px;cursor:pointer;line-height:1">×</button>
    </div>
    <div style="padding:8px 0;overflow-y:auto">
      ${usuariosCache.length
        ? usuariosCache.map(u => `
          <label style="display:flex;align-items:center;gap:10px;padding:9px 22px;cursor:pointer">
            <input type="checkbox" data-uid="${u.id}" ${permisoMap[u.id]?.puede_ver ? 'checked' : ''}
                   style="width:16px;height:16px;accent-color:#C8102E;cursor:pointer">
            <span style="font-size:13px">${u.nombre || u.email}</span>
          </label>`).join('')
        : `<p style="padding:1.5rem 22px;color:#bbb;font-size:13px;text-align:center">Sin usuarios registrados</p>`}
    </div>
  `;

  els.modalBox().querySelectorAll('input[type="checkbox"]').forEach(chk => {
    chk.addEventListener('change', async () => {
      try {
        const resultado = await procesar('guardarPermisoUsuario', {
          usuarioId: chk.dataset.uid, prototipoId: p.id, puedeVer: chk.checked
        });
        toast(resultado.mensaje);
      } catch (e) {
        toast(e.message || 'No se pudo guardar el permiso');
        chk.checked = !chk.checked;
      }
    });
  });

  document.getElementById('modal-usuarios-close')
    .addEventListener('click', () => { els.modalOverlay().style.display = 'none'; });

  els.modalOverlay().style.display = 'flex';
}


/* ---- Inicio ---- */
(async function iniciar() {
  const { userData } = await initPage(MODULO_ID);
  esAdmin = !!userData?.esAdmin;
  await fncCargarPrototipos();
})();
