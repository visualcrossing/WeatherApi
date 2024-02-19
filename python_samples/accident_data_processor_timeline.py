import pandas as pd
import math
import datetime
from datetime import timedelta
import urllib.request
import json


#Enter your Weather API key - see https://www.visualcrossing.com/weather-api
weather_api_key="YOUR_API_KEY"
#Path to input and output data
dataPath="D:\\data"
#Prevents using up all API requests and costing money. Set to -1 to process all data
maxRowsToProcess=25


print("Reading data from file...")

raw_accident_data=pd.read_csv("{}\\Motor_Vehicle_Collisions_FairfaxCountyVa.csv".format(dataPath))


records=[]
labels = ['Crash Date', 'GPS Latitude', 'GPS Longitude','Document Number','Crash Type','temp','precip','wspd','sunrise','sunset']

#Step through the input data row by row. Reading the location as latitude and longitude and accident time. These will be passed to the Weather API
for i, row in raw_accident_data.iterrows(): 
    #check maximum rows to process and stop if necessary
    if maxRowsToProcess>0 and i>maxRowsToProcess:
        print("Maximum rows processed. Ending: {}/{}".format(maxRowsToProcess, len(raw_accident_data.index)))
        break
    #print a status update every 10 rows
    if (i%10==0):
        print("Processing row {}/{}. records size={}".format(i,len(raw_accident_data.index) , len(records)))

    #read the latitude, longitude and data from the source data
    latitude=row['GPS Latitude']
    longitude=row['GPS Longitude']

    #check that the latitude and longitude are valid. skip row if necessary
    if math.isnan(latitude) or math.isnan(longitude) or (latitude==0 and longitude==0):
        print("Bad latlon {},{}".format(latitude,longitude))
        continue

    latitude='{:.5f}'.format(latitude)
    longitude='{:.5f}'.format(longitude)

    datetimeStr=row['Crash Date']

    #check that the date_time are valid. skip row if necessary
    try:
        date_time=datetime.datetime.strptime(datetimeStr, '%m/%d/%Y %H:%M')
    except ValueError:
        print("Bad date format {}".format(datetimeStr))
        continue
    
    #the Weather API specific time truncates to the previous hour. 
    #If the minute>30, add another hour so it rounds up to the next hour.
    if (date_time.minute>=30):
        date_time=date_time+timedelta(hours=1)


    documentNumber=row['Document Number']
    crashType=row['Crash Type']



    #Request data using Timeline Weather API specific time request.
    #See https://www.visualcrossing.com/resources/documentation/weather-api/timeline-weather-api/ "Specific Time Request Example" for more information. 

    weatherApiQuery = 'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/{},{}/{}?unitGroup=us&key={}&contentType=json&include=current'

    weatherApiQuery=weatherApiQuery.format(latitude,longitude,date_time.isoformat(),weather_api_key)

    try:
        response = urllib.request.urlopen(weatherApiQuery)
        data = response.read()
    except urllib.error.HTTPError  as e:
        ErrorInfo= e.read().decode() 
        print('Error code: ', e.code, ErrorInfo)
        continue
    except  urllib.error.URLError as e:
        ErrorInfo= e.read().decode() 
        print('Error code: ', e.code,ErrorInfo)
        continue

    #parse the response JSON
    weatherDataJson = json.loads(data.decode('utf-8'))

    #read exact time weather data from the 'currentConditions' JSON property
    weatherData=weatherDataJson["currentConditions"]

    #create an output row using the crash and weather data
    records.append((date_time.isoformat(),latitude,longitude,documentNumber,crashType,weatherData["temp"],weatherData["precip"],weatherData["windspeed"],weatherData["sunrise"],weatherData["sunset"]))


    #write data every 100 rows
    if (len(records)%100==0):
        output_df = pd.DataFrame.from_records(records, columns=labels)
        output_df.to_csv("{}\\out.csv".format(dataPath), index=False)


print("records Rows={}".format(len(records)))

#write final dataset
output_df = pd.DataFrame.from_records(records, columns=labels)
output_df.to_csv("{}\\out.csv".format(dataPath), index=False)