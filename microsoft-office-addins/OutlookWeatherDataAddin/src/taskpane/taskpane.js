// images references in the manifest
import "../../assets/ConditionsIcon-16.png";
import "../../assets/ConditionsIcon-32.png";
import "../../assets/ConditionsIcon-80.png";

/* global document, Office */

var unitGroup="us";
var apiKey="1PYNQ6AWUDJE9AFERDCHJHSXK";

Office.onReady(info => {
  if (info.host === Office.HostType.Outlook) {
    document.getElementById("sideload-msg").style.display = "none";
    document.getElementById("app-body").style.display = "flex";

    // Set up ItemChanged event to update the weather if the selected message changes
    Office.context.mailbox.addHandlerAsync(Office.EventType.ItemChanged, function(e) {
      update();
    });

    update();

    $(".vc-address-input").bind('input propertychange', function() {
      updateWeatherData();
    });

    $(".vc-forecast-input").bind('input propertychange', function() {
      updateWeatherData();
  });
  }
});
export async function update() {
  // Get a reference to the current message
  var item = Office.context.mailbox.item;
  var addresses = item.getEntities().addresses;
  var contacts = item.getEntities().contacts;

  var addressInput=document.getElementsByClassName("vc-address-input")[0];
  var dateInput=document.getElementsByClassName("vc-date-input")[0];
  var possibleAddress=null;


  if (addresses && addresses.length>0) {
    possibleAddress=addresses[0];
  } else if (contacts && contacts.length>0) {
    var contact=contacts[0];
    if (contact && contact.addresses && contact.addresses.length>0) {
      possibleAddress=contact.addresses[0];
    }
  }

  if (possibleAddress) {
    addressInput.value=possibleAddress;
  } else {
    addressInput.value="";
  }

  if (item.dateTimeModified) {
    dateInput.value=formatDate(item.dateTimeModified);
  }

  updateWeatherData();
  
}

var updateWeatherData=(function() {
  var timerHandle;

  return function() {
    clearTimeout(timerHandle);
  
    timerHandle=setTimeout(function() {
      _refreshWeatherData();
    }, 1000);
  }
})();


function _refreshWeatherData() {
  $(".vc-history-contents").html("Loading...");
  $(".vc-forecast-contents").html("Loading...");

  var addressInput=document.getElementsByClassName("vc-address-input")[0];
  var dateInput=document.getElementsByClassName("vc-date-input")[0];
  var location=addressInput.value;
  
  var date=dateInput.value;

  refreshMessageWeatherData(location,date);
  refreshMessageWeatherForecast(location);

}

function refreshMessageWeatherData(location, date) {



  var uri=`https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${location}/${date}?unitGroup=${unitGroup}&key=${apiKey}&include=obs`;


  if (!location) {
    $(".vc-history-contents").html("Please enter a location");
    return;
  }
  if (!date) {
    $(".vc-history-contents").html("Please enter a date");
    return;
  }
  $.get(uri, function( rawResult ) {
      if (!rawResult || rawResult.errorCode) {
        $(".vc-history-contents").html(`<h3>Error loading data: ${rawResult.message || rawResult}</h3>`);
        return;
    }  else {
       
    }

    var day=rawResult && rawResult.days && rawResult.days[0];


    if (!day) {
      $(".vc-history-contents").html("No weather data available");
      return;
    }
    $(".vc-history-title").html(`Weather history for ${day.datetime}`);
    $(".vc-history-contents").html(`<div class="vc-element"><div class="title">Max</div><div class="value">${formatTypeValue(day.tempmax, "temp", unitGroup)}</div></div>`+
                                  `<div class="vc-element"><div class="title">Min</div><div class="value">${formatTypeValue(day.tempmin, "temp", unitGroup)}</div></div>`+
                                  `<div class="vc-element"><div class="title">Precip</div><div class="value">${formatTypeValue(day.precip, "precip", unitGroup)}</div></div>`+
                                  `<div class="vc-element"><div class="title">Wind</div><div class="value">${formatTypeValue(day.windspeed, "wind", unitGroup)}</div></div>`);

  }); 
}

function refreshMessageWeatherForecast(location) {

  if (!location) {
    $(".vc-forecast-contents").html("Please enter a location");
    return;
  }

  var uri=`https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${location}?unitGroup=${unitGroup}&key=${apiKey}&include=fcst`;

  $.get(uri, function( rawResult ) {
   
    if (!rawResult || rawResult.errorCode) {
        $(".vc-forecast-contents").html(`<h3>Error loading data: ${rawResult.message || rawResult}</h3>`);
        return;
    }  else {
       
    }

    var days=rawResult && rawResult.days;
    if (!days) {
      $(".vc-forecast-contents").html("No weather data available");
      return;
    }
   
    //var html="<table><tr><th>Date</th><th>Max</th><th>Min</th><th>Precip</th></tr>"
    var html="";
    days.forEach(function(day) {
      html+=`<div class="vc-element"><div class="vc-max">${formatTypeValue(day.tempmax, "temp", unitGroup)}</div>`+
                                  `<div class="vc-min">${formatTypeValue(day.tempmin, "temp", unitGroup)}</div>`+
                                  `<div class="vc-precip">${formatTypeValue(day.precip, "precip", unitGroup)}</div>`+
                                  `<div class="vc-date">${dateFromEpochIso(day.datetimeEpoch, rawResult.timezone )}</div></div>`;
     // html+=`<tr><th>${d.datetime}</th><td>${formatTypeValue(d.tempmax, "temp", unitGroup)}</td><td>${formatTypeValue(d.tempmin, "temp", unitGroup)}</td><td>${formatTypeValue(d.precip, "precip", unitGroup)}</td></tr>`;
    });
    //html+="</table>"
    $(".vc-forecast-contents").html(html);
  }); 
}


function formatDate(date) {
  var d = new Date(date),
      month = '' + (d.getMonth() + 1),
      day = '' + d.getDate(),
      year = d.getFullYear();

  if (month.length < 2) 
      month = '0' + month;
  if (day.length < 2) 
      day = '0' + day;

  return [year, month, day].join('-');
}
function dateFromEpochIso(epochSecs,tz) {
  var date=new Date(epochSecs*1000);
        var options = {
   weekday: 'short', day:'numeric',
   timeZone: tz
  };
  return (new Intl.DateTimeFormat('en-US', options).format(date));
}
function formatTypeValue(value, type, unitgroup, fixed,  unicode,emptyvalue) {
			
			
  if (!value && value!==0) {
    
    return emptyvalue || "-";
  }

  if (!fixed && fixed!==0) {
    fixed = (Math.abs(value)<10)?1:0;
  }
  
  var symbol;
  if (unicode) {
    symbol=VcUnitGroups[unitgroup][type+"_u"];
  }
  if (!symbol) {
    symbol=VcUnitGroups[unitgroup][type];
  }
  if (symbol) {
    return value.toFixed(fixed)+symbol;
  }

  
  return value.toFixed(fixed);
  
  
}

var VcUnitGroups={
  "base":{
    "temp":"K",
    "precip":"mm",
    "snow":"cm",
    "wind":"m/s",
    "visibility":"km",
    "percent":"%",
    "distance":"m"
  },
  "us":{
    "temp":"&#8457;",
    "temp_u":"\u2109",
    "precip":"in",
    "snow":"in",
    "wind":"mph",
    "visibility":"mi",
    "percent":"%",
    "distance":"mi"
  },
  "uk":{
    "temp":"&#8451;",
    "temp_u":"\u2103",
    "precip":"mm",
    "snow":"cm",
    "wind":"mph",
    "visibility":"mi",
    "percent":"%"
  },
  "metric":{
    "temp":"&#8451;",
    "temp_u":"\u2103",
    "precip":"mm",
    "snow":"cm",
    "wind":"kph",
    "visibility":"km",
    "percent":"%",
    "distance":"km"
  }
}