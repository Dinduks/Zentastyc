package actors

import akka.actor.{ActorRef, Props, Actor}
import akka.util.Timeout
import akka.pattern.ask
import collection.mutable
import models.JsonFormatters._
import models._
import play.api.libs.concurrent.Execution.Implicits._
import play.api.libs.iteratee._
import play.api.libs.json._
import play.api.libs.json.JsObject
import play.libs.Akka
import scala.concurrent.duration._

object ChatHandler {

  implicit val timeout = Timeout(1 second)
  lazy val chatActor: ActorRef = Akka.system.actorOf(Props[ChatActor])

  def join(username: String): scala.concurrent.Future[(Iteratee[JsValue, _], Enumerator[JsValue])] = {
    val result = (chatActor ? Join(username)).map {
      case enumerator: Enumerator[JsValue] => {
        val iteratee = Iteratee.foreach[JsValue] { event =>
          (event \ "kind").as[String] match {
            case "talk" => {
              val userId = (event \ "data" \ "userId").as[String]
              val message = (event \ "data" \ "message").as[String]
              chatActor ! Talk(userId, message)
            }
          }
        }.mapDone { _ =>
          chatActor ! Quit(username)
        }

        (iteratee,enumerator)
      }
    }

    result.onComplete( _ => chatActor ! NewUser(username))

    result
  }

}

class ChatActor extends Actor {

  var chatUsers: collection.mutable.Buffer[String] = mutable.Buffer.empty
  var chatLog: String = ""
  val (outEnumerator, outChannel) = Concurrent.broadcast[JsValue]

  def receive = {
    case Join(username) => {
      chatUsers += username
      sender ! outEnumerator
    }

    case Talk(username, message) => {
      // TODO: Refactor this
      chatLog = chatLog + "&gt; " + username + ": " + message + "<br>"
      updateAll("talk", username, Some(chatLog))
    }

    case Quit(username) => {
      chatUsers = chatUsers diff Seq(username)
      updateAll("quit", username, None)
    }

    case NewUser(username) => updateAll("join", username, Some(chatLog))

  }

  def updateAll(kind: String, user: String, message: Option[String]) {
    val msg = JsObject(Seq(
      "kind" -> JsString(kind),
      "username" -> JsString(user),
      "chatUsers" -> Json.toJson(chatUsers),
      "message" -> JsString(message.getOrElse(""))
    ))

    outChannel.push(msg)
  }
}

case class Join(username: String)
case class Quit(username: String)
case class Talk(username: String, message: String)
case class NotifyJoin(username: String)
case class NewUser(username: String)