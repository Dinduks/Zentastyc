package actors

import akka.actor.{ActorRef, Props, Actor}
import akka.util.Timeout
import akka.pattern.ask
import collection.mutable
import models.JsonFormatters._
import models.HungryUsersIndex
import models.HungryUser
import play.api.libs.concurrent.Execution.Implicits._
import play.api.libs.iteratee._
import play.api.libs.json._
import play.api.libs.json.JsObject
import play.libs.Akka
import scala.concurrent.duration._

object HungryUsersHandler {

  implicit val timeout = Timeout(1 second)
  lazy val mainActor: ActorRef = Akka.system.actorOf(Props[HungryUserActor])

  def join(id: String, name: String): scala.concurrent.Future[(Iteratee[JsValue, _], Enumerator[JsValue])] = {
    (mainActor ? Connect(id, name)).map {
      case enumerator: Enumerator[JsValue] => {
        val iteratee = Iteratee.foreach[JsValue] { event =>
          (event \ "kind").as[String] match {
            case "newrestaurant" => {
              mainActor ! NewRestaurant(
                (event \ "data" \ "userId").as[String],
                (event \ "data" \ "restaurantName").as[String]
              )
            }
          }
        }.mapDone { _ =>
        }
        (iteratee, enumerator)
      }
    }
  }

}

class HungryUserActor extends Actor {

  val hungryUsers: HungryUsersIndex = mutable.Map.empty
  val (outEnumerator, chatChannel) = Concurrent.broadcast[JsValue]

  def receive = {
    case Connect(id, name) => {
      hungryUsers += id -> HungryUser(id, name, "No restaurant")
      sender ! outEnumerator
      self ! updateAll
    }
    case NewRestaurant(id, restaurantName) => {
      hungryUsers.get(id).map { hungryUser =>
        hungryUsers += id -> hungryUser.copy(restaurant = restaurantName)
      }
      self ! updateAll
    }
  }

  def updateAll {
    val msg = JsObject(Seq("users" -> Json.toJson(hungryUsers)))
    chatChannel.push(msg)
  }

}

case class Connect(id: String, name: String)
case class NewRestaurant(userId: String, restaurantName: String)
