select count(1) as "text"
from log_response lr 
where lr.organization_id <> 1301 and lr.type = 'RESPONSE' and lr.in_training = false
and lr.created_at > (current_date -1)