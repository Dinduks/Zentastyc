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

  val hungryUsers: HungryUsersIndex = mutable.Map.empty
  val logger = Logger

  def index = Action {
    Ok(views.html.index())
  }
  
  def ws(id: String, name: String) = WebSocket.async[JsValue] { request =>
    val tmp = HungryUsersHandler.join(id, name)

    tmp.onFailure {
      case t => println(t.getMessage)
    }

    tmp

//    val in = Iteratee.foreach[JsValue] { message =>
//      logger.info("New message: %s".format(message))
//
//      (message \ "kind").as[String] match {
//        case "connect" => {
//          val id: String = (message \ "data" \ "id").as[String]
//          val name: String = (message \ "data" \ "name").as[String]
//          val groupName: String = "none"
//
//          hungryUsers += id -> HungryUser(id, name, groupName)
//
//          HungryUsersHandler.join(id, name)
//        }
//        case "newgroup" => {
//          val id: String = (message \ "data" \ "userId").as[String]
//          val groupName: String = (message \ "data" \ "groupName").as[String]
//
//          hungryUsers.get(id).map { hungryUser =>
//            hungryUsers += id -> hungryUser.copy(group = groupName)
//          }
//        }
//      }
//    }
//
//    val (out, _) = Concurrent.broadcast[JsValue]
//
//    (in, out)
  } 
  
}