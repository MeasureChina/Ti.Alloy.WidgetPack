module ApplicationHelper

  ###################################################
  #   jbuilder helpers
  ###################################################
  
  def json_paginate_info(json, collection)
    return unless collection
    json.pagination do |json|
			if collection.respond_to? :num_pages
	      json.num_pages      collection.num_pages
	      json.current_page   collection.current_page
	      json.total_count    collection.total_count
			elsif collection.include? :num_pages
	      json.num_pages      collection[:num_pages]
	      json.current_page   collection[:current_page]
	      json.total_count    collection[:total_count]
			end
    end
  end

end
