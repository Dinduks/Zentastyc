package models

import play.api.libs.json._
import collection.mutable
import play.api.libs.json.JsObject
import play.api.libs.json.JsString

object JsonFormatters {

  implicit object HungryUserFormat extends Format[HungryUser] {
    def reads(json: JsValue)  = JsSuccess(HungryUser(
      (json \ "id").as[String],
      (json \ "name").as[String],
      (json \ "restaurant").as[String]
    ))

    def writes(hungryUser: HungryUser) = JsObject(Seq(
      "id" -> JsString(hungryUser.id),
      "name" -> JsString(hungryUser.name),
      "restaurant" -> JsString(hungryUser.restaurant)
    ))
  }

  implicit object HungryUsersIndexFormat extends Format[HungryUsersIndex] {
    def reads(json: JsValue) = ???

    def writes(hungryUsers: HungryUsersIndex) = {
      JsArray(
        hungryUsers.map { case (id, hungryUser) =>
          JsObject(Seq(
            "id" -> JsString(hungryUser.id),
            "name" -> JsString(hungryUser.name),
            "restaurant" -> JsString(hungryUser.restaurant)
          ))
        }.toSeq
      )
    }
  }

}
