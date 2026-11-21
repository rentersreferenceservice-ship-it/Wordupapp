-- Lets a student have two trip mileages to pick from per invoice
-- (e.g. normal route vs. when the previous client cancels).
alter table students add column if not exists default_mileage_label text;
alter table students add column if not exists alt_mileage numeric;
alter table students add column if not exists alt_mileage_label text;

-- Drive home/office after the last session of the day: miles stored per
-- student, logged per invoice as its own row so switching trips keeps it.
alter table students add column if not exists home_mileage numeric;
alter table mileage_log add column if not exists is_trip_home boolean not null default false;
