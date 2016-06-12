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
                            self.AddRequest(change.value);
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

    self.AddRequest = function (object) {
        $.ajax({
            url: self.url,
            dataType: "json",
            contentType: "application/json",
            data: ko.mapping.toJSON(object),
            method: "POST",
            complete: function (data) {
                if (data.status === 201) {
                    var ignored = {
                            'ignore': ["link"]
                        },
                        response = ko.mapping.fromJS(data.responseJSON, ignored);
                    object[objectId](response[objectId]());
                    object.link = data.responseJSON.link.uri;
                }
            }
        });
    };

    self.add = function (form) {
        var data = {};
        $(form).serializeArray().map(function (field) {
            data[field.name] = field.value;
        });
        data.studentId = null;
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