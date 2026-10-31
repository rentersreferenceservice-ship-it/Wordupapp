alter table tt_session_pairings add column if not exists student_id uuid references students(id);
create unique index if not exists tt_session_pairings_student_id_key on tt_session_pairings(student_id);
