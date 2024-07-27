"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express = require('express');
var mongoose = require('mongoose');
var methodOverride = require('method-override');
var app = express();
mongoose.connect('mongodb://localhost:27017/Birthday')
    .then(function () {
    console.log("MONGO CONNECTION OPEN!!!");
})
    .catch(function (err) {
    console.log("OH NO MONGO CONNECTION ERROR!!!!");
    console.log(err);
});
var schema = new mongoose.Schema({
    name: String,
    date: String
});
var Data = mongoose.model('Date', schema);
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(methodOverride('_method'));
app.listen(3000, function () {
    console.log('Server Activated');
});
app.get('/', function (req, res) {
    console.log('This is the homepage');
    res.render('show');
});
app.get('/update', function (req, res) {
    res.render('update');
});
app.patch('/', function (req, res) {
    var _a = req.body, name = _a.name, date = _a.date;
    var info = Data.findOneAndUpdate({ name: name }, { date: date }, { runValidators: true, new: true })
        .then(function (d) {
        res.redirect('/');
    });
});
app.post('/', function (req, res) {
    var _a = req.body, name = _a.name, date = _a.date;
    var newData = new Data({ name: name, date: date });
    newData.save();
    console.log(newData);
    res.redirect('/');
});
app.get('/delete', function (req, res) {
    res.render('delete');
});
app.delete('/', function (req, res) {
    var _a = req.body, name = _a.name, date = _a.date;
    Data.deleteMany({ name: name })
        .then();
    res.redirect('/');
});
function calculateAge(birthDate) {
    var birth = new Date(birthDate);
    var today = new Date();
    var age = today.getFullYear() - birth.getFullYear();
    var birthMonth = birth.getMonth();
    var todayMonth = today.getMonth();
    var birthDay = birth.getDate();
    var todayDay = today.getDate();
    if (todayMonth < birthMonth || (todayMonth === birthMonth && todayDay < birthDay)) {
        age--;
    }
    return age;
}
app.get('/view', function (req, res) {
    Data.find({})
        .then(function (d) {
        var today = new Date();
        var dataWithAgeAndBirthday = d.map(function (person) {
            var age = calculateAge(person.date);
            var birthdate = new Date(person.date);
            birthdate.setUTCFullYear(today.getUTCFullYear());
            if (birthdate < today) {
                birthdate.setUTCFullYear(today.getUTCFullYear() + 1);
            }
            var nextBirthday = birthdate;
            return {
                name: person.name,
                birthdate: person.date,
                age: age,
                nextBirthday: nextBirthday
            };
        });
        dataWithAgeAndBirthday.sort(function (a, b) {
            return a.nextBirthday - b.nextBirthday;
        });
        var closestBirthday = dataWithAgeAndBirthday.length > 0 ? dataWithAgeAndBirthday[0].nextBirthday : null;
        var closestName = dataWithAgeAndBirthday.length > 0 ? dataWithAgeAndBirthday[0].name : '';
        res.render('view', {
            dataWithAge: dataWithAgeAndBirthday,
            closestBirthday: closestBirthday,
            closestName: closestName
        });
    })
        .catch(function (err) {
        console.log(err);
        res.status(500).send('Error fetching data');
    });
});
app.post('/search', function (req, res) {
    var search = req.body.search;
    Data.find({ name: search })
        .then(function (d) {
        var dataWithAge = d.map(function (person) {
            var age = calculateAge(person.date);
            return {
                name: person.name,
                birthdate: person.date,
                age: age
            };
        });
        res.render('search', { dataWithAge: dataWithAge });
    })
        .catch(function (err) {
        console.log(err);
        res.status(500).send('Error fetching data');
    });
});
app.get('*', function (req, res) {
    res.send("Can't find anything on that!!");
});
