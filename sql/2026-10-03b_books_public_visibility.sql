-- Adds a third visibility option, "public", so a book can appear in a
-- browsable public library instead of only being reachable by direct link.
alter table books drop constraint if exists books_visibility_check;
alter table books add constraint books_visibility_check
  check (visibility in ('private', 'link', 'public'));
