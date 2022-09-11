$('document').ready(function() {

  //ANCHOR Function to call Weather API to get Current and Five Day weather
  const getWeatherData = function(){
    const cityValue = $('#user-location').val();
    const stateValue = $('#user-state').val()

    //API call to get the Lat and Lon of searched city/state
    async function getLocationWeather() {
      try {
        const latLonResponse = await fetch(`http://api.openweathermap.org/geo/1.0/direct?q=${cityValue},${stateValue}&limit=1&appid=${keys.weatherKey}`)
        const latLonData = await latLonResponse.json();

        const lat = latLonData[0].lat;
        const lon = latLonData[0].lon;
  
        //API call to get weather data for current and five day based on Lat and Lon
        const weatherResponse = await Promise.all([
          fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${keys.weatherKey}&units=imperial`),
          fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${keys.weatherKey}&units=imperial`)
        ])

        //convert the responses to JSON
        const weatherData = await Promise.all(weatherResponse.map(weather => weather.json()))

        //function call to display weather on page
        showCurrentWeather(weatherData)
        showFiveDayWeather(weatherData)
      } catch (error) {
        console.log(error)
      }
    }
    getLocationWeather();
  }

  //ANCHOR Get current weather on form submit
  $('#user-location-btn').on('click', function(e) {
    e.preventDefault();
    $('#current-weather-container').empty()
    $('#five-day-weather-container').empty()
    getWeatherData(e)
    // $('#search-location-form').trigger('reset');
  })

  //ANCHOR Handlebars to display current weather on page
  function showCurrentWeather(data) {
    const current = data[0];

    const currentWeatherHTML = $('#current-weather-template').html();
    const currentWeatherFunction = Handlebars.compile(currentWeatherHTML)
    const currentWeatherTemplate = currentWeatherFunction(
      {
        city: current.name || null,
        conditionURL: `http://openweathermap.org/img/wn/${current.weather[0].icon}@2x.png` || null,
        temperature: Math.round(current.main.temp) || null,
        condition: current.weather[0].main
      }
    )
    $(currentWeatherTemplate).appendTo('#current-weather-container')
  }


  //ANCHOR Handlebars to display five day forecast on page
  function showFiveDayWeather(data) {
    const fiveDay = data[1].list

    /*  API returns data for every 3 hours, 40 times.  
    Filtering out every 8 which equates to every 24 hours, showing as 5 days */
    let filteredWeatherArr = fiveDay.filter((day, index) => {
      if(index === 0 || index === 7 || index === 15 || index === 23 || index === 31) {
        return day
      }
    })

    //create array with relevant data for Handlebars
    let weatherArrData = filteredWeatherArr.map(day => {
      return {
        'day': convertUTX(day.dt),
        'temp': Math.round(day.main.temp),
        'iconURL': `http://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`,
        'condition': day.weather[0].main
      }
    })

    const fiveDayWeatherHTML = $('#five-day-weather-template').html();
    const fiveDayWeatherFunction = Handlebars.compile(fiveDayWeatherHTML);
    const fiveDayWeatherTemplate = fiveDayWeatherFunction({weatherArrData})

    $(fiveDayWeatherTemplate).appendTo('#five-day-weather-container')
  }


  //ANCHOR button to find users current location
  $('#use-current-location-btn').on('click', function(e) {
    e.preventDefault();

    //show spinner, hide icon, disable button
    toggleLocationSpinner(true)

    navigator.geolocation.getCurrentPosition((position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      fetch(`http://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${keys.weatherKey}`)
        .then(response => response.ok ? response.json() : ("ERROR"))
        .then(data => {
          console.log(data[0].name, data[0].state)
          $('#user-location').val(data[0].name)
          const selectValue = $(`#${data[0].state}`).val()
          $('#user-state').val(selectValue)

          //hide spinner, show icon, enable button
          toggleLocationSpinner(false);
        })
      
    })
  })

  

  const toggleLocationSpinner = function(status) {
    if(status) {
      $('#location-spinner').removeClass('d-none')
      $('#location-icon').addClass('d-none disabled')
    } else {
      $('#location-spinner').addClass('d-none')
      $('#location-icon').removeClass('d-none disabled')
    }
  }
})

//function to convert UTX to day of week
const convertUTX = function(time) {
  const date = new Date(time * 1000);
  const day = date.getDay();

  switch(day) {
    case 0:
      return 'Sunday'
    case 1:
      return "Monday"
    case 2:
      return "Tuesday"
    case 3:
      return "Wednesday"
    case 4:
      return "Thursday"
    case 5:
      return "Friday"
    case 6: 
      return "Saturday"
  }

}
