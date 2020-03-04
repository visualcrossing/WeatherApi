var WeatherForecastDisplay=(function() {
    
    /*
    * WeatherForecastWidget - encapsulates data retrieval and display for the Weather Forecast Widget
    * initConfig - configuration instance passed from the attach function
    */
    function WeatherForecastWidget(initConfig) {

        //the root HTML tag selector
        this.rawSelector=initConfig.selector;
        if ((!initConfig.location) && localStorage) {
            initConfig.location=localStorage.getItem("loc");
        }
        if (!initConfig.location) initConfig.location="_auto_";

        //Initialize the widget using the container parameters
        this.config={
            "location":initConfig.location, //initial location
            "unitGroup":initConfig.unitGroup || "us", //initial location
            "key":initConfig.apiKey, //api key
            "hourly":false, //whether data should be shown hourly (if not then show daily)
            "showInstallLink":initConfig.showInstallLink
        }

        //weather forecast data populated by the Weather API calls
        this.dailydata=null;
        this.hourlydata=null;
        this.error=null;
        var me=this;

        //setLocation - updates the location and triggers a data reload
        this.setLocation=function(location) {
            if (!location) location="_auto_";
            me.config.location=location;
            me.dailydata=null;
            me.hourlydata=null;
            me.loadForecastData();
        }

        //constructs Weather API request and then loads the weather forecast data from the Weather API
        this.loadForecastData=function() {
            //for now abandon loading data if an error has been recorded
            if ( me.error) return;


            if ((me.config.hourly && me.hourlydata) || (!me.config.hourly && me.dailydata)) return;

            //endpoint
            var uri=(initConfig.root || "https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/weatherdata/");
            uri+='forecast?';
            //parameters
            uri+="unitGroup="+me.config.unitGroup+"&contentType=json&shortColumnNames=true&location="+me.config.location+"&key="+me.config.key;
            uri+="&aggregateHours="+(me.config.hourly?"1":"24")
            d3.json(uri, function(err, rawResult) {
                


                //simple error handling for various error cases 
                if (err) {
                    console.error("Error loading weather forecast data: "+err);
                    me.error="Error loading data";
                } else if (!rawResult) {
                    console.error("Error loading weather forecast data (no data)");
                    me.error="Error loading data";
                } else if (rawResult.errorCode) {
                    console.error("Error loading weather forecast data: "+rawResult.message)
                    me.error="Error loading data";
                   
                } else {
                    //process and populate the data
                    me.processValues(rawResult);
                    if (me.config.hourly) {
                        me.hourlydata=rawResult;
                    } else {
                        me.dailydata=rawResult;
                    }
                }


                //refresh the display
                me.refresh();
            });
            
        }
        //checks the forecast values and create Date instances for the data time values
        this.processValues=function(data) {
            var forecastValues=me.getForecastValues(data);
            if (!forecastValues) return;
            var current=new Date();
            var offset=current.getTimezoneOffset()*60000;
            forecastValues.forEach(function(d) {
                d.datetime=new Date(d.datetime+offset );
            });
        }

        //extracts the array of forecast values representing each time period in the data
        this.getForecastValues=function(data) {
            if (!data) {
               throw "No data available for "+me.config.location;
            }
            var locations=data.locations;

            if (!locations) {
                throw "No locations found in data for "+me.config.location;
            }

            var locationsIds=Object.keys(locations);
            var locationData=locations[locationsIds[0]];

            if (locationData && locationData.address) {
                if (localStorage) localStorage.setItem("loc", locationData.address);
                me.config.location=locationData.address;
            }
            var forecastValues=locationData.values;
            forecastValues=forecastValues.filter(function(d) {
                return d && (d.temp || d.temp===0);
            });
            return forecastValues;
        }

        //displays the weather data inside the container tag
        this.refresh=function() {

            //check if the data is available
            me.loadForecastData();

            //me refers to the WeatherForecastWidget instance
            var root=d3.select(me.rawSelector)
            if (me.error) {
                root.html("<div class='error'>"+me.error+"</div>");
                return;
            }
            //extract the appropriate forecast values array
            var forecastValues=me.getForecastValues(me.config.hourly?me.hourlydata:me.dailydata);

            //helper functions for formatting dates, values and conversion
            var formatDate =d3.timeFormat("%b %d"); 
            var formatTime=d3.timeFormat("%H");
            var formatTemp=d3.format(".0f");
            var toK=function(t) {
                if (me.config.unitGroup==="us") {
                    return (t+ 459.67)*5/9
                } else {
                    return t+273.15;
                }
            }    
       
          
            root.classed("forecastwidget", true);

            //create the main widget structure if not present
            if (root.select(".location").empty()) {

                root.html("<div class='location'><span class='value'>-</span><input type='text' class='editor' value=''></input>"+
                                "<div class='viewchooser day' title='View by day'>Daily</div>"+
                                "<div class='viewchooser hour' title='View by hour'>Hourly</div>"+
                            "</div>"+
                            "<div class='days noselect'>"+
                            "</div>"+
                            "<svg class='chart'></svg>"+
                            "<div class='footer'>"+
                                (me.config.showInstallLink?"<a href='https://www.visualcrossing.com/weather-widgets' title='Install this weather widget' target='_blank'>Install</a>":"")+
                                "<a href='https://www.visualcrossing.com/weather-api' title='Powered by the Visual Crossing Weather API' target='_blank'>Credit</a>"+
                            "</div>"
                            );
                //react to the window being resized
                if (window["ResizeObserver"]) {           
                    var resizeObserver = new ResizeObserver(function() {
                        me.refresh();
                    }); 
                    
                    resizeObserver.observe(root.node());     
                }          
            }
            
            //viewchooser buttons switch between daily and hourly mode 
            root.selectAll(".viewchooser")
                .classed("selected", function() {
                    return (d3.select(this).classed("day") && !me.config.hourly) || 
                        (d3.select(this).classed("hour") && me.config.hourly)
                })
                .on("click", function(d){
                if (d3.select(this).classed("day")) {
                    me.config.hourly=false;
                } else {
                    me.config.hourly=true;
                }
                
                me.refresh();
            });
            //location displays the current location and allows user to click to change it via a simple text box
            var locationRoot=root.select(".location")
            locationRoot.select(".value").html(me.config.location);
            var locationEditor=locationRoot.select(".editor");
            locationEditor.attr("value",me.config.location)
            locationEditor.on("keypress", function() {
                if(d3.event.keyCode === 13){
                    locationRoot.classed("edit", false);
                    me.setLocation(locationEditor.node().value);
                }
            })
           
            locationRoot.select(".value").on("click", function(){
                
                if (d3.event.target===locationEditor.node()) return;
                locationRoot.classed("edit", !locationRoot.classed("edit"));
                d3.event.stopPropagation(); 
            });       
            
            d3.select("body").on("click",function(){
                var outside = locationEditor.filter(function(d) {return this == d3.event.target}).empty();
                if (outside) {
                    locationRoot.classed("edit", false);
                }
            });

            //measure the available space and fit the time periods into the space
            var rect=root.node().getBoundingClientRect();

            var margin = {top: 0, right: 20, bottom: 0, left: 20},
                width = rect.width - margin.left - margin.right;
            var minWidth=me.config.hourly?60:70;
            var timeextent=d3.extent(forecastValues, function(d) { return d.datetime; });
            var periods=me.config.hourly?d3.timeHour.count(timeextent[0],timeextent[1]):d3.timeDay.count(timeextent[0],timeextent[1]);
            var periodWidth=width/periods;
            //if the forecast periods (days or hours) will be too small, set them to a minimum size
            //in this case the periods will be draggable to view periods out of view
            if (periodWidth<minWidth) {
                periodWidth=minWidth;
            }
            
            //set up the x axis representing time
            var x = d3.scaleTime().range([0, periods*periodWidth]);
            x.domain(timeextent);
            
            //create a day HTML instance for each time period
            //
            var daysContainer=root.select(".days")
                .style("width",width+"px")
                .style("left",margin.left+"px")
                .selectAll(".day").data(forecastValues);

            daysContainer.exit().remove();

            //basic period display HTML
            var daysContainerEnter=daysContainer.enter()
                .append("div")
                .attr("class", "day")
                .html("<div class='date'></div>"+
                        "<div class='icon'></div>"+
                        "<div class='maxt'></div>"+
                        "<div class='mint'></div>"+
                        "<div class='temp'></div>"+
                        "<div class='precip'><span class='value'></span></div>"+
                        "<div class='conditions'></div>"
                        )

            daysContainer=daysContainer.merge(daysContainerEnter);

            //move the period location based on the time axis
            daysContainer
                .style("top","5px")
                .transition()
                .style("left", function (d) {
                                return (x(d.datetime))+"px";
                          })
                .style("width",(periodWidth)+"px")
            
            //set the icon
            daysContainer.select(".icon").each(function(d) {
                var icon=d3.select(this);
                var icons={
                    "sunny":false,
                    "partsunny":false,
                    "cloudy":false,
                    "wind":false,
                    "rain":false,
                    "snow":false,

                }
                if (d) {
                    if (+d.precip>0.1 || +d.pop>40) {
                        icons["rain"]=true;
                    } else if (+d.wspd>40) {
                        icons["wind"]=true;
                    } else if  (+d.cloudcover>75) {
                        icons["cloudy"]=true;
                    }  else if  (+d.cloudcover>30) {
                        icons["partsunny"]=true;
                    } else {
                        icons["sunny"]=true;
                    }
                }

                Object.keys(icons).forEach(function(d) {
                    icon.classed(d, icons[d]);
                });
            });

            //set the precipition
            daysContainer.select(".precip").each(function(d) {
                d3.select(this).classed("hidden", !d.precip)
                d3.select(this).select(".value").html(d.precip);
            });
            //set the conditions
            
            daysContainer.select(".conditions").html(function(d) {
                return d.conditions;
            });
            daysContainer.select(".date").html(function(d) {

                if (!me.config.hourly || +d3.timeDay.floor(d.datetime) === +d.datetime) return formatDate(d.datetime);
                return formatTime(d.datetime);

            });
            //set the max temperature (used only for daily view)  
            daysContainer.select(".maxt")
                .classed("hidden",me.config.hourly)
                .html(function(d) {
                    return formatTemp(d.maxt);
                });
             //set the min temperature (used only for daily view)  
            daysContainer.select(".mint")
                .classed("hidden",me.config.hourly)
                .html(function(d) {
                    return formatTemp(d.mint);
                });
             //set the temperature  (used only for hourly view)  
            daysContainer.select(".temp")
                .classed("hidden",!me.config.hourly)
                .html(function(d) {
                    return formatTemp(d.temp);
                });
            
            //now create the chart
            var chartContainer=d3.select(me.rawSelector).select(".chart")

            //measure the chart area
            var rect=chartContainer.node().getBoundingClientRect();
            
            var height = rect.height - margin.top - margin.bottom;
            
            //create the drawing area if not present
            var chartDrawing;
            if (chartContainer.select("g").empty()) {
                var chartRoot=chartContainer; 

                chartRoot.append("clipPath")
                    .attr("id", "clippath")   
                    .append("rect")
                        .attr("x",0)
                        .attr("y",0)
                        .attr("width",0)
                        .attr("height",0)


                chartRoot=chartRoot.append("g")
                    .attr("transform",
                        "translate(" + margin.left + "," + margin.top + ")")
                    .attr("clip-path","url(#clippath)")

               
                chartDrawing=chartRoot.append("g")
                    .attr("class", "container")
                

                chartDrawing.append("path")
                    .attr("class", "line")

                chartDrawing.append("g")
                    .attr("class", 'bars')


                chartDrawing.append("linearGradient")
                    .attr("id", "temperature-gradient")
                    .attr("gradientUnits", "userSpaceOnUse")
                    
                chartDrawing.append("g")			
                    .attr("class", "grid")

                
            } else {
                chartDrawing=chartContainer.select(".container");
            }

            chartContainer.select("#clippath rect")
                .attr("x",-margin.left)
                .attr("width", rect.width)
                .attr("height", rect.height);

            chartDrawing.attr("transform", null);

            //set up vertical y scales for the temperature and precipitation fields
            var y = d3.scaleLinear().range([height, 0]);
            var yprecip = d3.scaleLinear().range([height, height*.67]);

            //area creation function for the temperature 
            var temparea = d3.area()
                .x(function(d, i) { 
                    if (i===0) {
                        return x(d.datetime) 
                    } else if (i===forecastValues.length-1) {
                        return x(me.config.hourly?d3.timeHour.offset( d.datetime,1):d3.timeHour.offset( d.datetime,24));
                    } else {
                        return x(me.config.hourly?d3.timeHour.offset( d.datetime,0.5):d3.timeHour.offset( d.datetime,12));
                    }
                   
                })
                .y0(height)
                .y1(function(d) { return y(me.config.hourly?d.temp:d.maxt); })
                .curve(d3.curveCatmullRom)  
           
            //scale the temperature scale based on the max and minimum values
            y.domain([d3.min(forecastValues, function(d) { return (me.config.hourly?d.temp:d.mint)-10; }), d3.max(forecastValues, function(d) { return (me.config.hourly?d.temp:d.maxt); })]);

            //scale the precipitation scale based on the max and minimum values
            yprecip.domain([0, d3.max(forecastValues, function(d) { return d.precip; })]).nice();

           
            //create a gradient that maps the colors to particular temperature
            //in this case we will use the turbo colors from d3 and interpolate them between 255 and 311K (approx 0-100F)
            var colorStopCount=10, minTempStop=255, maxTempStop=311;
            var minTempK=toK(y.domain()[0]), 
                maxTempK=toK(y.domain()[1]);

            var tempInterval= (maxTempK-minTempK)/(colorStopCount+1);
            var colors=[];
            for (var i=0;i<=colorStopCount;i++) {
                //for each gradient stop, find the color in the the turbo palette based on the min and max temp stops
                var t=((minTempK+tempInterval*i)-minTempStop)/(maxTempStop-minTempStop);
                t=Math.max(t,0);
                t=Math.min(t,1);
                colors.push({offset: i*(100/colorStopCount)+"%", color:turbo(t)});
              
            }
            //create the gradient stops based on the above stop array
            var stopsContainer=chartDrawing.select("#temperature-gradient").attr("x1", 0).attr("y1", y(y.domain()[0]))
                    .attr("x2", 0).attr("y2", y(y.domain()[1]))
                    .selectAll("stop")
                    .data(colors, function(d) {return d.color})
            stopsContainer.exit().remove();
            stopsContainer=stopsContainer.merge(stopsContainer.enter().append("stop"))
            
            stopsContainer.attr("offset", function(d) { return d.offset; })
                    .attr("stop-color", function(d) { return d.color; })
                    .attr("stop-opacity", function(d,i) { return 0.5+0.5*i/colors.length; });
            


            //create simple colored rectangle bar charts for the precipitation bars
            var precipBarContainer=chartDrawing.select(".bars").selectAll(".precipbar").data(forecastValues);
            precipBarContainer.exit().remove();
            var precipBarContainerEnter=precipBarContainer.enter()
                .append("rect")
                .attr("class", "precipbar")
                .attr("x", 0)
                .attr("y", 0)
                .attr("height", 0)

            precipBarContainer=precipBarContainer.merge(precipBarContainerEnter);
            precipBarContainer
                .transition()
                .attr("x", function(d, i) {
                    return x(me.config.hourly?d3.timeHour.offset( d.datetime,0.5):d3.timeHour.offset( d.datetime,12))-5;
                })
                .attr("width", function(d, i) {
                    return 10;

                  
                })
                .attr("y", function(d, i) {
                    return yprecip(d.precip);
                })
                .attr("height", function(d, i) {
                    return yprecip(0)-yprecip(d.precip);
                })

            
            //populate the area chart for the temperature view
            chartDrawing.select(".line")
                .data([forecastValues])
                .transition()
                .attr("d", temparea);
            
            
            //draw vertical lines at the boundaries of each period
            chartDrawing.select(".grid")
                .attr("transform", "translate(0," + height + ")")
                .call(d3.axisBottom(x)
                    .ticks(periods)
                    .tickSize(-height)
                    .tickFormat("")
                )
            
            //add a simple zoom to handle the draggging of the time periods
            var zoom = d3.zoom()
                .scaleExtent([1, 1])
                .translateExtent([[0, 0], [(periods+2)*periodWidth, 0]])
                .on("zoom", zoomed);
            
                //attach the d3 zoom instance to the root element.

            root.call(zoom);
            
            //handler for the 
            function zoomed() {
                var t=d3.event.transform;
                t.k=1;
                t.y=0;
                
                root.select(".days")
                    .style("left",(margin.left+t.x)+"px");

                chartDrawing.attr("transform", t);
                
                
            }    
        }

    }
    
   

    /*
    * Attach the widget code to the widgets on the page
    * For each widget config found, create an instance of the widget object
    */

    var attach=function(config) {

        var instance=new WeatherForecastWidget(config );
        instance.loadForecastData();
        return instance;
    }
    /*
    * look for the global scope weatherWidgetConfig
    * This is an array of widget config (one for each widget on the page)
    */
    if (!window.weatherWidgetConfig) {
        console.error("No weather widget configuration found!");
    } else {
        window.weatherWidgetConfig.forEach(function(config) {
            attach(config);
        })
    }
    /*
    * From d3 chromatic library 
    */
    function turbo(t) {
        t = Math.max(0, Math.min(1, t));
        return "rgb("
            + Math.max(0, Math.min(255, Math.round(34.61 + t * (1172.33 - t * (10793.56 - t * (33300.12 - t * (38394.49 - t * 14825.05))))))) + ", "
            + Math.max(0, Math.min(255, Math.round(23.31 + t * (557.33 + t * (1225.33 - t * (3574.96 - t * (1073.77 + t * 707.56))))))) + ", "
            + Math.max(0, Math.min(255, Math.round(27.2 + t * (3211.1 - t * (15327.97 - t * (27814 - t * (22569.18 - t * 6838.66)))))))
            + ")";
      }
    /*
    Place holder for public methods if we add them
     */
    return {
        
    }
    

})();