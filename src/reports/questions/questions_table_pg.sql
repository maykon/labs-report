select o.name as "Cliente", count(1) as "Total"
from log_response lr 
join organization o on o.api_key = lr.api_sender
join user_response ur on ur.id = lr.user_response_id 
where o.id <> 1301 and lr.type = 'RESPONSE' and o.in_training = false and lr.user_identity <> ''
and ur.disabled = false
and lr.created_at > (current_date -1)
group by o.name
order by o.name