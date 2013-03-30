"use strict";

var ws, wsChat;
var user;
var currentRestaurantName;

function ZentastycCtrl($scope) {
    var id;
    var name;

    name = localStorage.getItem('name');
    while (name === null || name === "null" || name.trim().length === 0) {
        name = prompt("Name?");
        localStorage.setItem('name', name);
    }

    $scope.restaurants = { none: new Restaurant("No restaurant") };

    id = name;

    ws = restaurantsWebSocketBuilder(id, name, $scope);
    wsChat = chatWebSocketBuilder(name, $scope);

    $scope.joinRestaurant = function (restaurantName) {
        var restaurant;

        ws.send(JSON.stringify({ kind: "joinrestaurant", data: { userId: user.id, restaurantName: restaurantName }}));

        restaurant = new Restaurant(restaurantName);
        $scope.restaurants[restaurantName] = restaurant;
        $scope.restaurants[restaurantName].push(user);
        delete $scope.restaurants[currentRestaurantName];
        currentRestaurantName = restaurantName;
    }

    $scope.newRestaurant = function() {
       var restaurantName = prompt("Where?");
       if (restaurantName) $scope.joinRestaurant(restaurantName);
    }

    /* Chat */
    $scope.chatUsers = [];

    $scope.sendMessage = function () {
        if ("" == this.message) return false;

        wsChat.send(JSON.stringify({ kind: "talk", data: { userId: user.id, message: this.message }}));
        this.message = "";

        // Immediate visual feedback after sending a message
        $("#chat-messages").append("&gt; " + name + ": " + this.message + "<br>");
    }

}

function User(name, id) {
    var name, id;
    this.name = name;
    this.id = id.toString();
}

function Restaurant(name) {
    var name, users;
    this.name = name;
    this.users = [];

    this.push = function (user) { this.users.push(user); };
}

function restaurantsWebSocketBuilder(id, username, $scope) {
    var ws;

    ws = new WebSocket("ws://" + window.location.host + jsRoutes.controllers.Application.ws(id, username).url);

    ws.onerror = function (error) {
        throw "An error happened on the restaurants WebSocket: " + error;
    }

    ws.onopen = function () {
        $scope.$apply(function () {
            user = new User(username, id);
            $scope.restaurants.none.push(user);
            currentRestaurantName = "No restaurant";
        });
    };

    ws.onmessage = function(event) {
        var data = JSON.parse(event.data);
        var restaurants = {};

        data.users.map(function(user) {
            if (undefined === restaurants[user.restaurant]) restaurants[user.restaurant] = new Restaurant(user.restaurant);
            restaurants[user.restaurant].push(user);
        });

        $scope.$apply(function() {
            $scope.restaurants = restaurants;
        });
    };

    return ws;
}

function chatWebSocketBuilder(username, $scope) {
    var chatWs;

    chatWs = new WebSocket("ws://" + window.location.host + jsRoutes.controllers.Application.wsChat(username).url);

    chatWs.onmessage = function(event) {
        var data = JSON.parse(event.data);

        switch (data.kind) {
            case "talk": {
                $("#chat-messages").html(data.message);
                break;
            }
            case "join": {
                $scope.$apply(function() { $scope.chatUsers = data.chatUsers; });
                $("#chat-messages").html(data.message);
                break;
            }
            case "quit": {
                $scope.$apply(function() { $scope.chatUsers = data.chatUsers; });
                break;
            }
        }
    }

    return chatWs;
}
