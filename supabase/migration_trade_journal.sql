-- AR4 Mercados — Diario de trading personal (privado, no expuesto vía lectura pública)
create table if not exists trade_journal (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  symbol text not null,
  direction text not null check (direction in ('long', 'short')),
  entry_price numeric,
  exit_price numeric,
  stop_loss numeric,
  take_profit numeric,
  result text check (result in ('ganadora', 'perdedora', 'abierta')),
  emotion text,
  notes text,
  created_at timestamptz not null default now()
);

-- Sin política de lectura pública: solo accesible vía Netlify Functions con la Secret Key,
-- que siempre filtra por el profile_id del usuario autenticado (mismo patrón que points_ledger).
alter table trade_journal enable row level security;
