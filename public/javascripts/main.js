"use strict";

var ws, wsChat;
var user;
var currentRestaurantName;

function ZentastycCtrl($scope) {
    var username;

    username = localStorage.getItem('username');
    while (username === null || username === "null" || username.trim().length === 0) {
        username = prompt("Name?");
        localStorage.setItem('username', username);
    }

    $scope.restaurants = { none: new Restaurant("No restaurant") };

    ws = restaurantsWebSocketBuilder(username, $scope);
    wsChat = chatWebSocketBuilder(username, $scope);

    $scope.joinRestaurant = function (restaurantName) {
        var restaurant;

        ws.send(JSON.stringify({ kind: "joinrestaurant", data: { username: user.username, restaurantName: restaurantName }}));

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

        wsChat.send(JSON.stringify({ kind: "talk", data: { username: user.username, message: this.message }}));
        this.message = "";

        // Immediate visual feedback after sending a message
        $("#chat-messages").append("&gt; " + username + ": " + this.message + "<br>");
    }

}

function User(username) {
    var username;
    this.username = username;
}

function Restaurant(name) {
    var name, users;
    this.name = name;
    this.users = [];

    this.push = function (user) { this.users.push(user); };
}

function restaurantsWebSocketBuilder(username, $scope) {
    var ws;

    ws = new WebSocket("ws://" + window.location.host + jsRoutes.controllers.Application.ws(username).url);

    ws.onerror = function (error) {
        throw "An error happened on the restaurants WebSocket: " + error;
    }

    ws.onopen = function () {
        $scope.$apply(function () {
            user = new User(username);
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
                console.log($scope.messages);
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
