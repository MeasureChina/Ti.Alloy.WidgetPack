json.users @users do |user|
  json.partial! user
end

json_paginate_info(json, @users)