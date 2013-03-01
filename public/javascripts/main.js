"use strict";

var ws;
var user;
var currentRestaurantName;

function ZentastycCtrl($scope) {
    var id;
    var name;

    while (null === (name = localStorage.getItem('name')) || 0 === localStorage.getItem('name').length) {
        name = prompt("Name?");
        localStorage.setItem('name', name);
    }

    $scope.restaurants = { none: new Restaurant("No restaurant") };

    id = name;

    ws = new WebSocket("ws://" + window.location.host + jsRoutes.controllers.Application.ws(id, name).url);

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

    $(document).ready(function () {

        var handleNewRestaurant = function (event) {
          var restaurantName = prompt("Where?");
          $scope.joinRestaurant(restaurantName);
        };
        $("#newrestaurant").click(function (event) { handleNewRestaurant(event) });

    });
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
