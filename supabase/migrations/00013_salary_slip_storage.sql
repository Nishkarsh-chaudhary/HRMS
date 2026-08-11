-- Salary slips are private. Downloads are streamed through an authenticated route.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('salary-slips','salary-slips',false,5242880,array['application/pdf'])
on conflict(id) do update set public=false,file_size_limit=5242880,allowed_mime_types=array['application/pdf'];

