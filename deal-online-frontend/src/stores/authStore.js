import { atom } from 'nanostores';
import { persistentAtom } from '@nanostores/persistent';
import { api, socket } from '../services/api.js'; // Importamos también el socket

// ================================================================
// Stores (Almacenes de Estado)
// ================================================================

// Guardan el token y el usuario en localStorage para que la sesión persista
export const $token = persistentAtom('authToken', null);
export const $user = persistentAtom('user', null, {
  encode: JSON.stringify,
  decode: JSON.parse,
});

// Stores temporales para manejar el estado de la UI
export const $authLoading = atom(false);
export const $authError = atom(null);

// ================================================================
// Acciones (Lógica de Autenticación)
// ================================================================
export const authActions = {
  async login(email, password) {
    $authLoading.set(true);
    $authError.set(null);

    try {
      const response = await api.login(email, password);
      const { user, accessToken } = response;
      
      // Actualizamos los stores, lo que guarda los datos en localStorage
      $token.set(accessToken);
      $user.set(user);

      // Conectamos los WebSockets después de un login exitoso
      socket.connect(accessToken);

      return { success: true };
    } catch (error) {
      $authError.set(error.message);
      return { success: false, error: error.message };
    } finally {
      $authLoading.set(false);
    }
  },

  async register(userData) {
    $authLoading.set(true);
    $authError.set(null);

    try {
      const result = await api.register(userData);
      return { success: true, data: result };
    } catch (error) {
      $authError.set(error.message);
      return { success: false, error: error.message };
    } finally {
      $authLoading.set(false);
    }
  },

  async verify(email, code) {
    $authLoading.set(true);
    $authError.set(null);

    try {
      const response = await api.verify(email, code);
      const { user, accessToken } = response;

      // Al verificar, también iniciamos sesión automáticamente
      $token.set(accessToken);
      $user.set(user);

      // Y conectamos los WebSockets
      socket.connect(accessToken);

      return { success: true };
    } catch (error) {
      $authError.set(error.message);
      return { success: false, error: error.message };
    } finally {
      $authLoading.set(false);
    }
  },

  // CORREGIDO: Logout es ahora una operación 100% del lado del cliente.
  logout() {
    // 1. Borramos el token y el usuario de localStorage.
    $token.set(null);
    $user.set(null);
    $authError.set(null);

    // 2. Desconectamos los WebSockets para limpiar la conexión.
    socket.disconnect();

    console.log('Sesión cerrada exitosamente en el frontend.');
    // Opcional: Redirigir a la página de inicio
    // window.location.href = '/'; 
  },

  clearError() {
    $authError.set(null);
  }
};

// ================================================================
// Lógica de Inicialización
// ================================================================
// Este código se ejecuta solo una vez en el cliente cuando la app carga
if (typeof window !== 'undefined') {
  const initialToken = $token.get();
  
  if (initialToken) {
    // Si encontramos un token en localStorage al cargar la página,
    // intentamos conectar los WebSockets inmediatamente.
    console.log('Token encontrado en localStorage, conectando WebSockets...');
    socket.connect(initialToken);
  }
}
