"use strict";

var ws;
var user;
var currentGroupName;

function OmnomCtrl($scope) {
    var id;
    var name;

    name = prompt("Name?");

    $scope.users = {};
    $scope.groups = { none: new Group("none") };

    ws = new WebSocket("ws://localhost:9005/ws");

    id = guid();

    ws.onopen = function () {
        $scope.$apply(function () {
            user = new User(name, id);
            $scope.users.id = user;
            $scope.groups.none.push(user);
            currentGroupName = "none";
            ws.send(JSON.stringify({ kind: "connect", data: user }));
        });
    };

    $(document).ready(function () {
        var handleNewGroup = function (event, $scope) {
            var groupName;
            var group;

            groupName = prompt("Where?");
            ws.send(JSON.stringify({ kind: "newgroup", data: { userId: user.id, groupName: groupName }}));

            group = new Group(groupName);
            $scope.$apply(function () {
                $scope.groups[groupName] = group;
                $scope.groups[groupName].push(user);
                delete $scope.groups[currentGroupName];
                currentGroupName = groupName;
            });

            event.preventDefault();
        };
        $("#newgroup").click(function (event) { handleNewGroup(event, $scope) });
    });
}

function User(name, id) {
    var name, id;
    this.name = name;
    this.id = id.toString();
}

function Group(name) {
    var name, users;
    this.name = name;
    this.users = [];

    this.push = function (user) { this.users.push(user); };
}

function guid() {
    return (new Date()).getTime() + Math.random();
}

