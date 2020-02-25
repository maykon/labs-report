select resp.org_name as "Cliente", resp.intent_name as "Intenção", ur.user_response as "Resposta configurada", case ur.organization_id when 1301 then 'DB1' else resp.org_name end as "Definido por", case ur.disabled when false then 'Não' else 'Sim' end as "Desabilitada",  case resp.training when false then 'Não' else 'Sim' end as "Em treinamento"
from (select o.id as org_id, o.name as org_name, o.in_training as training, si.id as intent_id, si.name as intent_name
from organization o,
service_intent si
where o.id <> 1301 and si.id <> 17850 and si.service_id = 17701 
and (exists (select ur2.id from user_response ur2 where ur2.service_id = 17701 and ur2.intent_id = si.id and ur2.organization_id = o.id and ur2.sub_context_id = 1501)
OR exists (select ur3.id from user_response ur3 where ur3.service_id = 17701 and ur3.intent_id = si.id and ur3.organization_id = 1301 and ur3.sub_context_id = 1501))
group by o.id, o.name, o.in_training, si.id, si.name
order by o.name, si.name) resp
join user_response ur on ur.service_id = 17701 and ur.intent_id = resp.intent_id and ur.sub_context_id =1501
where (ur.organization_id = resp.org_id or ur.organization_id = 1301)
order by RESP.ORG_NAME,  resp.intent_name