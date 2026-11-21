-- Lets a student have two trip mileages to pick from per invoice
-- (e.g. normal route vs. when the previous client cancels).
alter table students add column if not exists default_mileage_label text;
alter table students add column if not exists alt_mileage numeric;
alter table students add column if not exists alt_mileage_label text;
