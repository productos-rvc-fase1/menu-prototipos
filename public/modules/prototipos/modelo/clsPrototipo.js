// ─────────────────────────────────────────────────────────
// clsPrototipo.js — Modelo
// Unica capa del modulo que conoce Firestore. No manipula
// el DOM ni conoce nada de la vista o del despachador.
// ─────────────────────────────────────────────────────────
import { db } from '../../../core/firebase-config.js';
import {
  collection, doc, getDocs, getDoc,
  addDoc, updateDoc, deleteDoc, setDoc, query, orderBy, where
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

const COLECCION = 'prototipos';

export class Prototipo {

  static async listar() {
    const q = query(collection(db, COLECCION), orderBy('nombre'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  static async obtener(id) {
    const snap = await getDoc(doc(db, COLECCION, id));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  }

  static async crear(data) {
    return addDoc(collection(db, COLECCION), {
      nombre: data.nombre,
      url: data.url,
      version: data.version || '',
      repo: data.repo || '',
      creadoEn: new Date().toISOString()
    });
  }

  static async actualizar(id, data) {
    return updateDoc(doc(db, COLECCION, id), {
      nombre: data.nombre,
      url: data.url,
      version: data.version || '',
      repo: data.repo || ''
    });
  }

  static async eliminar(id) {
    return deleteDoc(doc(db, COLECCION, id));
  }

  // ── Acceso por usuario a un prototipo puntual (permisos/{uid}_{prototipoId}) ──

  static async listarUsuarios() {
    const q = query(collection(db, 'usuarios'), orderBy('nombre'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  static async permisosDe(prototipoId) {
    const q = query(collection(db, 'permisos'), where('moduloId', '==', prototipoId));
    const snap = await getDocs(q);
    const map = {};
    snap.forEach(d => { map[d.data().usuarioId] = d.data(); });
    return map;
  }

  static async setPermiso(usuarioId, prototipoId, puedeVer) {
    const docId = `${usuarioId}_${prototipoId}`;
    return setDoc(doc(db, 'permisos', docId), {
      usuarioId, moduloId: prototipoId, puede_ver: puedeVer
    }, { merge: true });
  }
}
