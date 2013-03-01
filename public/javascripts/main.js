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

    $(document).ready(function () {
        var handleNewRestaurant = function (event, $scope) {
            var restaurantName;
            var restaurant;

            restaurantName = prompt("Where?");
            ws.send(JSON.stringify({ kind: "newrestaurant", data: { userId: user.id, restaurantName: restaurantName }}));

            restaurant = new Restaurant(restaurantName);
            $scope.$apply(function () {
                $scope.restaurants[restaurantName] = restaurant;
                $scope.restaurants[restaurantName].push(user);
                delete $scope.restaurants[currentRestaurantName];
                currentRestaurantName = restaurantName;
            });

            event.preventDefault();
        };
        $("#newrestaurant").click(function (event) { handleNewRestaurant(event, $scope) });
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
