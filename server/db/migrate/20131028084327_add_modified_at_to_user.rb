class AddModifiedAtToUser < ActiveRecord::Migration
  def change
    add_column :users, :modified_at, :datetime
  end
end
