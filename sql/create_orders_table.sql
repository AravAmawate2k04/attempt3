CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY,
    order_type VARCHAR(16) NOT NULL,
    token_in VARCHAR(64) NOT NULL,
    token_out VARCHAR(64) NOT NULL,
    amount_in NUMERIC(36, 18) NOT NULL,

    status VARCHAR(16) NOT NULL,

    chosen_dex VARCHAR(16),
    executed_price NUMERIC(36, 18),
    tx_hash VARCHAR(128),
    failed_reason TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger for updated_at (optional nice-to-have)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_updated_at ON orders;

CREATE TRIGGER trg_set_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE PROCEDURE set_updated_at();