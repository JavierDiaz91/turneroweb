-- Ejecutar manualmente en Neon, primero en una base de pruebas.
-- Información sensible: acceso exclusivamente desde rutas administrativas autenticadas.
CREATE TABLE IF NOT EXISTS patient_records (
  patient_id INTEGER PRIMARY KEY REFERENCES patients(id) ON DELETE CASCADE,
  birth_date DATE,
  locality TEXT NOT NULL DEFAULT '',
  intake_date DATE,
  allergies TEXT NOT NULL DEFAULT '',
  heart_or_pressure TEXT NOT NULL DEFAULT '',
  recent_surgeries TEXT NOT NULL DEFAULT '',
  pregnancy TEXT NOT NULL DEFAULT '',
  chronic_pain TEXT NOT NULL DEFAULT '',
  injuries TEXT NOT NULL DEFAULT '',
  medications TEXT NOT NULL DEFAULT '',
  consultation_reason TEXT NOT NULL DEFAULT '',
  massage_type TEXT NOT NULL DEFAULT '',
  work_areas TEXT NOT NULL DEFAULT '',
  avoid_areas TEXT NOT NULL DEFAULT '',
  preferred_intensity TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS patient_session_notes (
  id BIGSERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
  session_date DATE NOT NULL,
  treatment TEXT NOT NULL DEFAULT '',
  observations TEXT NOT NULL DEFAULT '',
  next_appointment TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_patient_session_notes_patient ON patient_session_notes(patient_id,session_date DESC);
