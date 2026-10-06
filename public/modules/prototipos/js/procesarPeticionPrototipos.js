// ─────────────────────────────────────────────────────────
// procesarPeticionPrototipos.js — Despachador
// Equivalente en este stack a procesarPeticionProveedores.js:
// recibe una accion y datos, y delega a clsPrototipo.js.
// No manipula el DOM, no conoce la vista.
// ─────────────────────────────────────────────────────────
import { Prototipo } from '../modelo/clsPrototipo.js';

function validarUrl(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function procesar(accion, datos) {

  switch (accion) {

    case 'listar':
      return await Prototipo.listar();

    case 'obtener':
      return await Prototipo.obtener(datos.id);

    case 'guardar':
      if (!datos.nombre) {
        throw new Error('El nombre del prototipo es obligatorio');
      }
      if (!datos.url || !validarUrl(datos.url)) {
        throw new Error('La URL del prototipo no es valida (debe empezar con http:// o https://)');
      }
      if (datos.id) {
        await Prototipo.actualizar(datos.id, datos);
        return { id: datos.id, mensaje: 'Prototipo actualizado' };
      } else {
        const ref = await Prototipo.crear(datos);
        return { id: ref.id, mensaje: 'Prototipo creado' };
      }

    case 'eliminar':
      await Prototipo.eliminar(datos.id);
      return { id: datos.id, mensaje: 'Prototipo eliminado' };

    case 'listarUsuarios':
      return await Prototipo.listarUsuarios();

    case 'permisosDePrototipo':
      return await Prototipo.permisosDe(datos.prototipoId);

    case 'guardarPermisoUsuario':
      await Prototipo.setPermiso(datos.usuarioId, datos.prototipoId, datos.puedeVer);
      return { mensaje: datos.puedeVer ? 'Acceso concedido' : 'Acceso revocado' };

    default:
      throw new Error(`Accion no reconocida: ${accion}`);
  }
}
