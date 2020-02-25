select o.name as "Empresa", si.name as "Intenção"
from organization o,
service_intent si
where o.id <> 1301 and si.id <> 17850 and si.service_id = 17701 
and not exists (select ur2.id from user_response ur2 where ur2.intent_id = si.id and ur2.organization_id = o.id and ur2.sub_context_id = 1501)
and not exists (select ur3.id from user_response ur3 where ur3.intent_id = si.id and ur3.organization_id = 1301 and ur3.sub_context_id = 1501)
group by o.name, si.name
order by o.name, si.name