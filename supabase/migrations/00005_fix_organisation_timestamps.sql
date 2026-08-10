-- The original departments/designations update triggers reference updated_at,
-- but the initial schema did not create those columns.
alter table public.departments
  add column if not exists updated_at timestamptz not null default now();

alter table public.designations
  add column if not exists updated_at timestamptz not null default now();

-- Complete the single-organisation designation hierarchy after the repair.
update public.designations set code = 'MGR', level = 1, parent_id = null where company_id = (select id from public.companies where name = 'Jabit soft' limit 1) and name = 'Manager' and code is null;
update public.designations set code = 'TL', level = 2, parent_id = (select manager.id from public.designations manager where manager.company_id = designations.company_id and manager.name = 'Manager' limit 1) where company_id = (select id from public.companies where name = 'Jabit soft' limit 1) and name = 'Team Lead' and code is null;
update public.designations set code = 'DEV', level = 3, parent_id = (select lead.id from public.designations lead where lead.company_id = designations.company_id and lead.name = 'Team Lead' limit 1) where company_id = (select id from public.companies where name = 'Jabit soft' limit 1) and name = 'Developer' and code is null;
update public.designations set code = 'ANL', level = 3, parent_id = (select lead.id from public.designations lead where lead.company_id = designations.company_id and lead.name = 'Team Lead' limit 1) where company_id = (select id from public.companies where name = 'Jabit soft' limit 1) and name = 'Analyst' and code is null;
update public.designations set code = 'ASC', level = 4, parent_id = (select lead.id from public.designations lead where lead.company_id = designations.company_id and lead.name = 'Team Lead' limit 1) where company_id = (select id from public.companies where name = 'Jabit soft' limit 1) and name = 'Associate' and code is null;
