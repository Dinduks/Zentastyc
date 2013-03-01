"use strict";

var ws;
var user;
var currentRestaurantName;

function ZentastycCtrl($scope) {
    var id;
    var name = "";

    while (null === name || 0 === name.length)
        name = prompt("Name?");

    $scope.restaurants = { none: new Restaurant("none") };

    id = guid();

    ws = new WebSocket("ws://localhost:9000/ws?id=" + id + "&name=" + name);

    ws.onopen = function () {
        $scope.$apply(function () {
            user = new User(name, id);
            $scope.restaurants.none.push(user);
            currentRestaurantName = "none";
            ws.send(JSON.stringify({ kind: "connect", data: user }));
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

function guid() {
    return (new Date()).getTime() + Math.random();
}
