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

    ws = new WebSocket("ws://" + window.location.host + jsRoutes.controllers.Application.ws(id, name).url);
    wsChat = new WebSocket("ws://" + window.location.host + jsRoutes.controllers.Application.wsChat(name).url);

    ws.onerror = function (error) {
        throw "An error happened on the WebSocket: " + error;
    }

    ws.onopen = function () {
        $scope.$apply(function () {
            user = new User(name, id);
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

        var message = this.message;
        this.message = "";
        wsChat.send(JSON.stringify({ kind: "talk", data: { userId: user.id, message: message }}));
    }

    wsChat.onmessage = function(event) {
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