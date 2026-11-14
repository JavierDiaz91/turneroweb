CREATE TABLE IF NOT EXISTS business_settings (
 id INTEGER PRIMARY KEY DEFAULT 1 CHECK(id=1),
 business_name TEXT NOT NULL DEFAULT 'RENASER Masajes',
 address TEXT NOT NULL DEFAULT '',
 phone TEXT NOT NULL DEFAULT '',
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO business_settings(id) VALUES(1) ON CONFLICT(id) DO NOTHING;
CREATE TABLE IF NOT EXISTS professionals (
 id BIGSERIAL PRIMARY KEY,
 full_name TEXT NOT NULL,
 specialty TEXT NOT NULL DEFAULT '',
 license_number TEXT NOT NULL DEFAULT '',
 phone TEXT NOT NULL DEFAULT '',
 active BOOLEAN NOT NULL DEFAULT TRUE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE patient_session_notes ADD COLUMN IF NOT EXISTS professional_id BIGINT REFERENCES professionals(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_patient_session_notes_professional ON patient_session_notes(professional_id);