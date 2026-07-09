-- AR4 Mercados — Migración: reemplazo de Culqi por Mercado Pago
-- Ejecutar en el SQL Editor de Supabase

alter table avatar_purchases add column if not exists mercadopago_payment_id text;
-- culqi_charge_id se deja tal cual (historial de compras antiguas), solo se deja de escribir en esa columna.
