-- Extension required for gen_random_uuid()
CREATE extension IF NOT EXISTS pgcrypto;

-- LEADS TABLE
CREATE TABLE leads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid NOT NULL,
    name TEXT,
    business_type TEXT,
    budget_range TEXT,
    timeline TEXT,
    status TEXT NOT NULL DEFAULT 'new' 
        CHECK (status IN ('new', 'qualified', 'booked', 'escalated', 'closed')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_leads_conversation_id ON leads (conversation_id);
CREATE INDEX idx_leads_status ON leads (status);

-- BOOKINGS TABLE
CREATE TABLE bookings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id uuid NOT NULL REFERENCES leads (id) ON DELETE CASCADE,
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 30,
    status TEXT NOT NULL DEFAULT 'scheduled' 
        CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bookings_lead_id ON bookings (lead_id);
CREATE INDEX idx_bookings_scheduled_at ON bookings (scheduled_at);

-- MESSAGES TABLE
CREATE TABLE messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid NOT NULL,
    lead_id uuid REFERENCES leads (id) ON DELETE SET NULL,
    role TEXT NOT NULL
        CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_conversation_id ON messages (conversation_id);
CREATE INDEX idx_messages_lead_id ON messages (lead_id);

-- ESCALATIONS TABLE
CREATE TABLE escalations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid NOT NULL,
    lead_id uuid REFERENCES leads (id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'resolved')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_escalations_conversation_id ON escalations (conversation_id);