var express = require('express')
var request = require('request')

var app = express();

app.set('view engine','ejs');

var city = 'London'
var location_url = 'https://www.metaweather.com/api/location/search/?query=${city}';
var url = 'https://www.metaweather.com/api/location/44418/';

app.get('/', function(req,res) {
    res.render('weather');
});

app.listen(8000);