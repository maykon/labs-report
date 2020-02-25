select o.name as "Cliente", count(1) as "Total"
from log_response lr 
join organization o on o.api_key = lr.api_sender
where o.id <> 1301 and lr.type = 'NOT_INTENT' and lr.created_at > (current_date - 1) and lr.user_identity <> ''
group by o.name
order by o.name