package models

import play.api.libs.json._
import collection.mutable
import play.api.libs.json.JsObject
import play.api.libs.json.JsString

object JsonFormatters {

  implicit object HungryUserFormat extends Format[HungryUser] {
    def reads(json: JsValue)  = JsSuccess(HungryUser(
      (json \ "username").as[String],
      (json \ "restaurant").as[String]
    ))

    def writes(hungryUser: HungryUser) = JsObject(Seq(
      "username" -> JsString(hungryUser.username),
      "restaurant" -> JsString(hungryUser.restaurant)
    ))
  }

  implicit object HungryUsersIndexFormat extends Format[HungryUsersIndex] {
    def reads(json: JsValue) = ???

    def writes(hungryUsers: HungryUsersIndex) = {
      JsArray(
        hungryUsers.map { case (username, hungryUser) =>
          JsObject(Seq(
            "username" -> JsString(hungryUser.username),
            "restaurant" -> JsString(hungryUser.restaurant)
          ))
        }.toSeq
      )
    }
  }

}
