// AR4 Mercados — Asegura que el usuario autenticado tenga su perfil de comunidad.
// Se llama al iniciar sesión. Es seguro: solo puede crear el perfil de UNO MISMO,
// porque usa la identidad del JWT (context.clientContext.user), no datos del cliente.
// Así el contador "Traders registrados" crece cuando un registrado entra por primera vez.
const { ensureProfile } = require('./_profiles');

exports.handler = async (event, context) => {
  const user = context.clientContext && context.clientContext.user;
  if (!user || !user.sub) {
    return json(401, { success: false, error: 'No autenticado.' });
  }
  try {
    const r = await ensureProfile({ id: user.sub, email: user.email, user_metadata: user.user_metadata });
    return json(200, { success: true, created: !!(r && r.created) });
  } catch (e) {
    // No romper el flujo de sesión por esto.
    return json(200, { success: false, error: String((e && e.message) || e) });
  }
};

function json(statusCode, body) {
  return { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}
