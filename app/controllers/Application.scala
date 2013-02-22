package controllers

import play.api._
import libs.iteratee.{Concurrent, Iteratee}
import libs.json.JsValue
import play.api.mvc._
import models._
import collection.mutable

object Application extends Controller {
  
  val hungryUsers: mutable.Map[String, HungryUser] = mutable.Map.empty
  val logger = Logger
  
  def index = Action {
    Ok(views.html.index())
  }
  
  def ws = WebSocket.using[JsValue] { request =>
    val in = Iteratee.foreach[JsValue] { message =>
      logger.info("New message: %s".format(message))

      (message \ "kind").as[String] match {
        case "connect" => {
          val id: String = (message \ "data" \ "id").as[String]
          val name: String = (message \ "data" \ "name").as[String]
          val groupName: String = "none"

          hungryUsers += id -> HungryUser(id, name, groupName)
        }
        case "newgroup" => {
          val id: String = (message \ "data" \ "userId").as[String]
          val groupName: String = (message \ "data" \ "groupName").as[String]

          hungryUsers.get(id).map { hungryUser =>
            hungryUsers += id -> hungryUser.copy(group = groupName)
          }
        }
      }
    }

    val (out, _) = Concurrent.broadcast[JsValue]

    (in, out)
  } 
  
}