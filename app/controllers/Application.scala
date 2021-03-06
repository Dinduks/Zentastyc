package controllers

import actors._
import play.api._
import play.api.mvc._
import libs.json.JsValue

object Application extends Controller {

  def index = Action { implicit request =>
    Ok(views.html.index())
  }

  def ws(name: String) = WebSocket.async[JsValue] { request =>
    HungryUsersHandler join name
  }

  def wsChat(name: String) = WebSocket.async[JsValue] { request =>
    ChatHandler join name
  }

}