class UsersController < ApplicationController

  def index
    @users = User.order("id DESC").page(params[:page]).per(20)
  end

  def create
		@user = User.new(user_params)
    
    if @user.save
      render action: "show"
    else
			render json: { messages: @user.errors.full_messages }, status: :not_acceptable
    end
  end

  def update
    @user = User.find(params[:id])
    
    if @user.update_attributes(user_params)
      render action: "show"
    else
			render json: { messages: @user.errors.full_messages }, status: :not_acceptable
    end
  end

  def destroy
    @user = User.find(params[:id])
    @user.destroy
    
    render json: ''
  end
  
  
  private
    
    def user_params
      params.require(:user).permit(:name, :modified_at)
      # (:name, :keywords, :desc, :category, :list_cover_id, :user_id, :person_id, :position, :status,
      #   { list_items_attributes: [ :book_attributes ] }
      # )
    end

end
