alter table public.book_statuses
  add column if not exists price integer;

alter table public.book_statuses
  drop constraint if exists book_statuses_price_check;

alter table public.book_statuses
  add constraint book_statuses_price_check
  check (price is null or (price >= 0 and price <= 100000));

insert into public.book_statuses (book_id, price)
values
  (1, 35), (2, 35), (3, 35), (4, 45), (5, 45), (6, 25),
  (7, 25), (8, 35), (9, 35), (10, 30), (11, 35), (12, 35),
  (13, 35), (14, 40), (15, 40), (16, 25), (17, 25), (18, 15),
  (19, 15), (20, 20), (21, 15), (22, 15), (23, 15), (24, 25),
  (25, 5), (26, 30), (27, 30), (28, 20), (29, 20), (30, 25),
  (31, 20), (32, 20), (33, 10), (34, 10), (35, 10), (36, 5),
  (37, 15), (38, 15), (39, 20), (40, 20), (41, 25), (42, 35),
  (43, 15), (44, 20)
on conflict (book_id) do update
set price = excluded.price
where public.book_statuses.price is null;

alter table public.book_statuses
  alter column price set not null;
