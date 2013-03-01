"use strict";

var ws;
var user;
var currentGroupName;

function ZentastycCtrl($scope) {
    var id;
    var name = "";

    while (null === name || 0 === name.length)
        name = prompt("Name?");

    $scope.groups = { none: new Group("none") };

    id = guid();

    ws = new WebSocket("ws://localhost:9000/ws?id=" + id + "&name=" + name);
    ws.onopen = function () {
        $scope.$apply(function () {
            user = new User(name, id);
            $scope.groups.none.push(user);
            currentGroupName = "none";
            ws.send(JSON.stringify({ kind: "connect", data: user }));
        });
    };

    var receiveEvent = function(event) {
        var data = JSON.parse(event.data);
        var groups = {};

        data.users.map(function(user) {
            if (undefined === groups[user.group]) groups[user.group] = new Group(user.group);
            groups[user.group].push(user);
        });

        $scope.$apply(function() {
            $scope.groups = groups;
        });
    }

    ws.onmessage = receiveEvent;

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
