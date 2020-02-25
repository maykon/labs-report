select o.name as "Cliente", lr.intent_name as "Intenção", count(1) as "Total"
from log_response lr 
join organization o on o.api_key = lr.api_sender
where o.id <> 1301 and lr.type = 'NOT_RESPOND' and lr.created_at > (current_date - 1) and lr.user_identity <> ''
group by o.name, lr.intent_name
order by o.name, lr.intent_name