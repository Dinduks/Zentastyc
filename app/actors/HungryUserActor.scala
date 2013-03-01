package actors

import akka.actor.{ActorRef, Props, Actor}
import akka.util.Timeout
import akka.pattern.ask
import collection.mutable
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
    (default ? Join(id, name)).map {
      case Connected(enumerator) => {
        val iteratee = Iteratee.foreach[JsValue] { event =>
          //          default ! Talk(username, (event \ "text").as[String])
        }.mapDone { _ =>
          //          default ! Quit(username)
        }
        (iteratee,enumerator)
      }
      case CannotConnect(error) => {
        val iteratee = Done[JsValue,Unit]((),Input.EOF)
        val enumerator =  Enumerator[JsValue](JsObject(Seq("error" -> JsString(error)))).andThen(Enumerator.enumInput(Input.EOF))
        (iteratee,enumerator)
      }
    }
  }

}

class HungryUserActor extends Actor {

  val hungryUsers: HungryUsersIndex = mutable.Map.empty
  val (outEnumerator, chatChannel) = Concurrent.broadcast[JsValue]

  def receive = {
    case Join(id, name) => {
      if(hungryUsers.contains(name)) {
        sender ! CannotConnect("This username is already used")
      } else {
        hungryUsers += id -> HungryUser(id, name, "none")
        sender ! Connected(outEnumerator)
        self ! NotifyJoin(id, name)
      }
    }

    case NotifyJoin(id, name) => {
      notifyAll("join", id, name, "", "has entered the room")
    }

    case Quit(id) => {
//      members = members - username
      notifyAll("quit", id, "", "", "has left the room")
    }
  }

  def notifyAll(kind: String, id: String, name: String, group: String, message: String) {
    val msg = JsObject(
      Seq(
        "kind" -> JsString(kind),
        "id" -> JsString(id),
        "user" -> JsString(name),
        "group" -> JsString(group)
        //        "group" -> JsString(group),
//        "members" -> JsArray(
//          hungryUsers.toList.map(_ => Json.toJson(_))
//        )
      )
    )
    chatChannel.push(msg)
  }

}

case class Join(id: String, name: String)
case class Quit(id: String)
case class NotifyJoin(id: String, name: String)

case class Connected(enumerator: Enumerator[JsValue])
case class CannotConnect(msg: String)
