package controllers

import collection.mutable
import actors._
import play.api._
import libs.iteratee.{Concurrent, Iteratee}
import libs.json.JsValue
import models._
import play.api.mvc._
import play.api.libs.concurrent.Execution.Implicits._

object Application extends Controller {

  val logger = Logger

  def index = Action { implicit request =>
    Ok(views.html.index())
  }

  def ws(id: String, name: String) = WebSocket.async[JsValue] { request =>
    HungryUsersHandler.join(id, name)
  }

  def wsChat(id: String, name: String) = WebSocket.async[JsValue] { request =>
    ChatHandler.join(name)
  }

}