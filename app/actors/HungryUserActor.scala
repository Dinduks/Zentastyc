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
import scala.concurrent.Future

object HungryUsersHandler {

  implicit val timeout = Timeout(1 second)
  lazy val mainActor: ActorRef = Akka.system.actorOf(Props[HungryUserActor])

  def join(username: String): Future[(Iteratee[JsValue, _], Enumerator[JsValue])] = {
    val result = (mainActor ? Connect(username)).map {
      case enumerator: Enumerator[JsValue] => {
        val iteratee = Iteratee.foreach[JsValue] { event =>
          (event \ "kind").as[String] match {
            case "joinrestaurant" => {
              val username = (event \ "data" \ "username").as[String]
              val restaurantName = (event \ "data" \ "restaurantName").as[String]
              mainActor ! JoinRestaurant(username, restaurantName)
            }
          }
        }.mapDone { _ =>
          mainActor ! HungryQuit(username)
        }

        (iteratee, enumerator)
      }
    }

    result.onComplete( _ => mainActor ! UpdateAll)

    result
  }

}

class HungryUserActor extends Actor {

  val hungryUsers: HungryUsersIndex = mutable.Map.empty
  val (outEnumerator, outChannel) = Concurrent.broadcast[JsValue]
  val noRestaurantTitle = "No restaurant"

  def receive = {
    case Connect(username) => {
      if (!hungryUsers.contains(username)) hungryUsers += username -> HungryUser(username, noRestaurantTitle)
      sender ! outEnumerator
    }

    case JoinRestaurant(username, restaurantName) => {
      hungryUsers.get(username).map { hungryUser =>
        hungryUsers += username -> hungryUser.copy(restaurant = restaurantName)
      }
      updateAll
    }

    case UpdateAll => {
      updateAll
    }

    case HungryQuit(username) => {
      hungryUsers.get(username).map { hungryUser =>
        if (hungryUser.restaurant == noRestaurantTitle) hungryUsers -= username
      }
      updateAll
    }
  }

  def updateAll {
    val msg = JsObject(Seq("kind" -> JsString("restaurant"), "users" -> Json.toJson(hungryUsers)))
    outChannel.push(msg)
  }

}

case class Connect(username: String)
case class JoinRestaurant(username: String, restaurantName: String)
case class UpdateAll()
case class HungryQuit(username: String)
