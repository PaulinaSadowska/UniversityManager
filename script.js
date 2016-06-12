"use strict";

var backendAddress = "http://localhost:8100/";

var fetchedObject;

/*global $, ko, alert*/
var DataCollection = function (url, objectId) {
    var self = ko.observableArray();
    self.url = url;
    self.get = function () {
        self.removeAll();
        $.ajax({
            url: self.url,
            dataType: "json",
            success: function (data) {
                data.forEach(function (element, index, array) {
                    var ignored = {
                            'ignore': ["link"]
                        },
                        object = ko.mapping.fromJS(element, ignored);

                    if (element.link !== undefined) {
                        object.link = element.link.uri;
                    }
                    self.push(object);

                    ko.computed(function () {
                            return ko.toJSON(object);
                        })
                        .subscribe(function () {
                            self.UpdateRequest(object);
                        });
                });
                if (self.subscription !== undefined) {
                    self.subscription.dispose();
                }

                self.subscription = self.subscribe(function (changes) {
                    changes.forEach(function (change) {
                        if (change.status === 'added') {
                            self.SaveRequest(change.value);
                        }
                        if (change.status === 'deleted') {
                            self.DeleteRequest(change.value);
                        }
                    });
                }, null, "arrayChange");
            }
        });
    };

    self.UpdateRequest = function (object) {
        alert(ko.mapping.toJSON(object, {
            ignore: ["link", "id", "grades", "gradesList"]
        }));
        $.ajax({
            url: self.url,
            method: "PUT",
            dataType: "json",
            contentType: "application/json",
            data: ko.mapping.toJSON(object, {
                ignore: ["link", "id", "grades", "gradesList"]
            })
        });
    };

    self.SaveRequest = function (object) {
        $.ajax({
            url: self.url,
            dataType: "json",
            contentType: "application/json",
            data: ko.mapping.toJSON(object),
            method: "POST",
            success: function (data) {
                alert("success");
                fetchedObject = data;
                var response = ko.mapping.fromJS(data);
                object.id = response.id;
                if (data.link !== undefined) {
                    object.link = response.link.uri;
                }
            }
        });
    };

    self.add = function (form) {
        alert("add");
        var data = {};
        $(form).serializeArray().map(function (field) {
            data[field.name] = field.value;
        });
        self.push(ko.mapping.fromJS(data));
        $(form).each(function () {
            this.reset();
        });
    };

    self.DeleteRequest = function (object) {
        $.ajax({
            url: object.link,
            method: "DELETE"
        });
    };

    self.Delete = function () {
        self.remove(this);
    };

    return self;
};

function ViewModel() {
    var self = this;
    self.students = new DataCollection(backendAddress + "students", "studentId");
    self.students.get();

    self.subjects = new DataCollection(backendAddress + "subjects", "subjectId");
    self.subjects.get();
}

var model = new ViewModel();

$(document).ready(function () {
    ko.applyBindings(model);
});