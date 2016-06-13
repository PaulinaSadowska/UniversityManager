"use strict";

var backendAddress = "http://localhost:8100/";

var fetchedObject;

/*global $, ko, alert*/
var DataCollection = function (url, objectId) {
    var self = ko.observableArray();
    self.url = url;
    self.get = function (query) {
        var paramUrl = self.url;
        if (query) {
            paramUrl = self.url + query;
        }
        $.ajax({
            url: paramUrl,
            dataType: "json",
            success: function (data) {
                if (self.subscription !== undefined) {
                    self.subscription.dispose();
                }
                self.removeAll();
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
            },
            error: function (data) {
                if (self.subscription !== undefined) {
                    self.subscription.dispose();
                }
                self.removeAll();
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
                ignore: ["link", "id", "grades", "gradesList", "student"]
            })
        });
    };

    self.AddRequest = function (object) {
        alert("add" + self.url);
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
                ko.computed(function () {
                        return ko.toJSON(object);
                    })
                    .subscribe(function () {
                        self.UpdateRequest(object);
                    });
            }
        });
    };

    self.add = function (form) {
        var data = {};
        $(form).serializeArray().map(function (field) {
            data[field.name] = field.value;
        });

        data[objectId] = null;
        self.push(ko.mapping.fromJS(data));
        $(form).each(function () {
            this.reset();
        });
    };

    self.ParseQuery = function () {
        self.get('/search?' + $.param(ko.mapping.toJS(self.queryParams)));
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
    self.students.queryParams = {
        studentIdQuery: ko.observable(),
        firstNameQuery: ko.observable(),
        lastNameQuery: ko.observable(),
        birthDateQuery: ko.observable()
    };
    Object.keys(self.students.queryParams).forEach(function (key) {
        self.students.queryParams[key].subscribe(function () {
            self.students.ParseQuery();
        });
    });
    self.students.get();

    self.subjects = new DataCollection(backendAddress + "subjects", "subjectId");
    self.subjects.getGrades = function () {
        window.location = "#gradesSection";
        self.grades.selectedSubject = this.subjectId;
        self.grades.subjectId = this.subjectId();
        self.grades.url = backendAddress + "subjects/" + this.subjectId() + "/grades";
        self.grades.get();
    };
    self.subjects.queryParams = {
        subjectNameQuery: ko.observable(),
        teacherNameQuery: ko.observable()
    };
    Object.keys(self.subjects.queryParams).forEach(function (key) {
        self.subjects.queryParams[key].subscribe(function () {
            self.subjects.ParseQuery();
        });
    });
    self.subjects.get();

    self.grades = new DataCollection(backendAddress + "grades", "studentId");
    self.grades.selectedSubject = ko.observable();
    self.grades.add = function (form) {
        var data = {};
        $(form).serializeArray().map(function (field) {
            data[field.name] = field.value;
        });
        data.subjectId = self.grades.subjectId;
        fetchedObject = data;
        self.grades.push(ko.mapping.fromJS(data));
        $(form).each(function () {
            this.reset();
        });
    };
    self.grades.queryParams = {
        studentIdQuery: ko.observable(),
        gradeQuery: ko.observable(),
        gradeDateQuery: ko.observable(),
    };
    Object.keys(self.grades.queryParams).forEach(function (key) {
        self.grades.queryParams[key].subscribe(function () {
            self.grades.ParseQuery();
        });
    });
}

var model = new ViewModel();

$(document).ready(function () {
    ko.applyBindings(model);
});