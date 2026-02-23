-- CreateTable
CREATE TABLE IF NOT EXISTS "substitute_logs" (
    "id"              SERIAL NOT NULL,
    "created_at"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "sick_teacher_id"  INTEGER,
    "sick_teacher_name" VARCHAR(200) NOT NULL,
    "start_date"      VARCHAR(20) NOT NULL,
    "end_date"        VARCHAR(20) NOT NULL,
    "status"          VARCHAR(20) NOT NULL DEFAULT 'success',
    "total_lessons"   INTEGER NOT NULL DEFAULT 0,
    "substituted"     INTEGER NOT NULL DEFAULT 0,
    "failed"          INTEGER NOT NULL DEFAULT 0,
    "details"         JSONB,

    CONSTRAINT "substitute_logs_pkey" PRIMARY KEY ("id")
);