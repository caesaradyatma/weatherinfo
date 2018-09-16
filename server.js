var express = require('express');
var request = require('request');
var request_promise = require('request-promise');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var empty = require('is-empty');
var morgan = require('morgan');
var app = express();

app.use(morgan('short'));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({ extended : true}));
app.use(express.static(__dirname + '/public'));

//days of week array
var weekday = new Array(7);
weekday[0] = "Sunday";
weekday[1] = "Monday";
weekday[2] = "Tuesday";
weekday[3] = "Wednesday";
weekday[4] = "Thursday";
weekday[5] = "Friday";
weekday[6] = "Saturday";

//connect to mongo db
mongoose.connect('mongodb://user:password12@ds157422.mlab.com:57422/weatherinfo'), { useNewUrlParser: true};

//city database schema 
var citySchema = new mongoose.Schema({
    name: String,
    woeid: String
});

//city table model in the database
var cityModel = mongoose.model('City',citySchema);

//dashboard route
app.get("/dashboard", (req, res) => {

    //find all of the visited cities from mongodb database
    cityModel.find({}, function(err, cities){
        var weather_data = {weather_data : cities};
        //pass the data to dashboard ejs
        res.render('dashboard',weather_data);
    });
    
})

//post / route
app.post('/',function(req, res){
    
    //get city value from user input
    var city = req.body.city_name;
    
    //api call settings
    var options = {
        uri: 'https://www.metaweather.com/api/location/search/?query=' + city,
        json: true 
    };

    //begin request promise chain
    request_promise(options)
        .then(function (data) {
            
            //if data is empty
            if(empty(data)){
                //directly go to weather ejs
                weather_array = []
                res.render('weather', weather_array);
            }
            //else
            else{
                //get woeid and city name from the api
                var id = data[0].woeid;
                var city_name = data[0].title;

                //use the retrieved api to get another request for the weather information
                var options2 = {
                    uri: 'https://www.metaweather.com/api/location/' + id + '/',
                    json: true
                };

                //save searched city
                var query = { name: city_name };
                
                //find for duplicates
                cityModel.find(query, function (err, result) {
                    if (err) throw err;
                    //if there are no duplicates
                    if(empty(result)){
                        //save the searched city
                        var searched_city = new cityModel({name: city_name, woeid: id});
                        searched_city.save();
                    }
                    
                });
                
                //continue to the next chain
                return request_promise(options2);
            }
            
        })
        .then(function (details) {

            //initialize weather array to be passed to the weather.ejs
            weather_array = [];
            
            //loop through the number of forecast days
            for (x = 0; x < 6; x++) {
                //get the day from retrieved date
                var mydate = new Date(details.consolidated_weather[x].applicable_date);
                //weather object initialization
                var weather = {
                    city: details.title,
                    the_temp: Number(details.consolidated_weather[x].the_temp).toFixed(1),
                    weather_state_name: details.consolidated_weather[x].weather_state_name,
                    weather_state_abbr: details.consolidated_weather[x].weather_state_abbr,
                    humidity: details.consolidated_weather[x].humidity,
                    max_temp: Number(details.consolidated_weather[x].max_temp).toFixed(1),
                    min_temp: Number(details.consolidated_weather[x].min_temp).toFixed(1),
                    wind_speed: Number(details.consolidated_weather[x].wind_speed).toFixed(1),
                    wind_direction_compass: details.consolidated_weather[x].wind_direction_compass,
                    applicable_date: weekday[mydate.getDay()]
                }
                //push each data to the weather array
                weather_array.push(weather);
            }
            //render weather ejs and pass weather array 
            res.render('weather', weather_array);
        })
        .catch(function (err) {
            //API call fail
        });

})

//the get is similar to post
app.get('/', function(req,res) {
    
    city = 'Jakarta';//default city

    var options = {
        uri: 'https://www.metaweather.com/api/location/search/?query='+city,
        json: true 
    };

    request_promise(options)
        .then(function (data) {
            var id = data[0].woeid;
            var options2 = {
                uri: 'https://www.metaweather.com/api/location/' + id + '/',
                json: true 
            };
            return request_promise(options2);
        })
        .then(function (details){
            
            weather_array = [];
            for(x =0;x<6;x++){
                
                var mydate = new Date(details.consolidated_weather[x].applicable_date);
                var weather = {
                    city: city,
                    the_temp: Number(details.consolidated_weather[x].the_temp).toFixed(1),
                    weather_state_name: details.consolidated_weather[x].weather_state_name,
                    weather_state_abbr: details.consolidated_weather[x].weather_state_abbr,
                    humidity: details.consolidated_weather[x].humidity,
                    max_temp: Number(details.consolidated_weather[x].max_temp).toFixed(1),
                    min_temp: Number(details.consolidated_weather[x].min_temp).toFixed(1),
                    wind_speed: Number(details.consolidated_weather[x].wind_speed).toFixed(1),
                    wind_direction_compass: details.consolidated_weather[x].wind_direction_compass,
                    applicable_date: weekday[mydate.getDay()]//get day
                }
                weather_array.push(weather);
            }
            res.render('weather',weather_array);
        })
        .catch(function (err) {
            // API call failed
        });
});
app.listen(8000);