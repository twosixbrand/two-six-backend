-- Secuencia atómica para generar entry_number del journal_entry.
-- Reemplaza la lógica de "MAX(entry_number)+1" que era race-prone en concurrencia.
-- 100% aditivo: crea la sequence si no existe y la posiciona según el máximo
-- entry_number actual para evitar colisiones con entries existentes.

CREATE SEQUENCE IF NOT EXISTS journal_entry_number_seq;

-- Posiciona la sequence después del máximo entry_number numérico existente
-- (formato esperado: AC-000NNN). Si no hay entries, queda en 1.
SELECT setval(
  'journal_entry_number_seq',
  COALESCE(
    (
      SELECT MAX(CAST(substring(entry_number from 'AC-(\d+)') AS INTEGER))
      FROM "journal_entry"
      WHERE entry_number ~ '^AC-\d+$'
    ),
    0
  ) + 1,
  false
);
