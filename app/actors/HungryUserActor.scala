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
  lazy val default: ActorRef = Akka.system.actorOf(Props[HungryUserActor])

  def join(id: String, name: String): scala.concurrent.Future[(Iteratee[JsValue, _], Enumerator[JsValue])] = {
    (default ? Connect(id, name)).map {
      case enumerator: Enumerator[JsValue] => {
        val iteratee = Iteratee.foreach[JsValue] { event =>
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
      hungryUsers += id -> HungryUser(id, name, "none")
      sender ! outEnumerator
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
