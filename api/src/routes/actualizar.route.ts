import { Hono } from 'hono';
import { jwt } from 'hono/jwt';
import { db } from '../db'; // Ajusta la ruta según tu estructura de proyecto
import { usersTable } from '../db/schema'; // Ajusta la ruta según tu estructura
import { eq } from 'drizzle-orm';

// Instancia del router Hono
export const actualizarRouter = new Hono();

// Verifica que exista la variable de entorno para el JWT
if (!process.env.JWT_SECRET) {
  throw new Error('Not found JWT_SECRET');
}

// Middleware de autenticación JWT
const authMiddleware = jwt({
  secret: process.env.JWT_SECRET,
});

// Endpoint POST para actualizar el saldo
actualizarRouter.post('/', authMiddleware, async (c) => {
  // Intentar parsear el body de la petición
  let body: { amount: number };
  try {
    body = await c.req.json();
  } catch (error) {
    console.error('Error al parsear JSON:', error);
    return c.json({ error: 'JSON inválido' }, 400);
  }

  const { amount } = body;
  if (typeof amount !== 'number') {
    return c.json({ error: "El valor de 'amount' debe ser un número" }, 400);
  }

  // Extraer el payload del JWT (se espera que contenga el id del usuario)
  const payload = c.get('jwtPayload') as { id?: number };
  if (!payload || !payload.id) {
    console.error('JWT payload inválido:', payload);
    return c.json({ error: 'No se encontró el ID del usuario en el JWT' }, 400);
  }

  // Consultar el saldo actual del usuario en la base de datos
  const users = await db
    .select({ saldo: usersTable.saldo })
    .from(usersTable)
    .where(eq(usersTable.id, Number(payload.id)))
    .limit(1);

  if (users.length === 0) {
    console.error('Usuario no encontrado con ID:', payload.id);
    return c.json({ error: 'Usuario no encontrado' }, 404);
  }

  const currentSaldo = users[0].saldo;
  // Calcular el nuevo saldo (si amount es negativo se está restando)
  const nuevoSaldo = currentSaldo + amount;

  // Validar que el nuevo saldo no sea negativo
  if (nuevoSaldo < 0) {
    return c.json({ error: 'Saldo insuficiente' }, 400);
  }

  // Actualizar el saldo en la base de datos
  try {
    await db
      .update(usersTable)
      .set({ saldo: nuevoSaldo })
      .where(eq(usersTable.id, Number(payload.id)));
  } catch (error) {
    console.error('Error actualizando la base de datos:', error);
    return c.json({ error: 'Error actualizando el saldo' }, 500);
  }

  return c.json({ success: true, saldo: nuevoSaldo });
});

export default actualizarRouter;
