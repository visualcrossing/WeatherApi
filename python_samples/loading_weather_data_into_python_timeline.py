#Downloading weather data using Python as a CSV using the Visual Crossing Weather API
#See https://www.visualcrossing.com/resources/blog/how-to-load-historical-weather-data-using-python-without-scraping/ for more information.
import csv
import codecs
import urllib.request
import urllib.error
import sys

# This is the core of our weather query URL
BaseURL = 'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/'

ApiKey='YOUR_API_KEY'
#UnitGroup sets the units of the output - us or metric
UnitGroup='us'

#Location for the weather data
Location='Washington,DC'

#Optional start and end dates
#If nothing is specified, the forecast is retrieved. 
#If start date only is specified, a single historical or forecast day will be retrieved
#If both start and and end date are specified, a date range will be retrieved
StartDate = ''
EndDate=''

#JSON or CSV 
#JSON format supports daily, hourly, current conditions, weather alerts and events in a single JSON package
#CSV format requires an 'include' parameter below to indicate which table section is required
ContentType="csv"

#include sections
#values include days,hours,current,alerts
Include="days"


print('')
print(' - Requesting weather : ')

#basic query including location
ApiQuery=BaseURL + Location

#append the start and end date if present
if (len(StartDate)):
    ApiQuery+="/"+StartDate
    if (len(EndDate)):
        ApiQuery+="/"+EndDate

#Url is completed. Now add query parameters (could be passed as GET or POST)
ApiQuery+="?"

#append each parameter as necessary
if (len(UnitGroup)):
    ApiQuery+="&unitGroup="+UnitGroup

if (len(ContentType)):
    ApiQuery+="&contentType="+ContentType

if (len(Include)):
    ApiQuery+="&include="+Include

ApiQuery+="&key="+ApiKey



print(' - Running query URL: ', ApiQuery)
print()

try: 
    CSVBytes = urllib.request.urlopen(ApiQuery)
except urllib.error.HTTPError  as e:
    ErrorInfo= e.read().decode() 
    print('Error code: ', e.code, ErrorInfo)
    sys.exit()
except  urllib.error.URLError as e:
    ErrorInfo= e.read().decode() 
    print('Error code: ', e.code,ErrorInfo)
    sys.exit()


# Parse the results as CSV
CSVText = csv.reader(codecs.iterdecode(CSVBytes, 'utf-8'))

RowIndex = 0

# The first row contain the headers and the additional rows each contain the weather metrics for a single day
# To simply our code, we use the knowledge that column 0 contains the location and column 1 contains the date.  The data starts at column 4
for Row in CSVText:
    if RowIndex == 0:
        FirstRow = Row
    else:
        print('Weather in ', Row[0], ' on ', Row[1])

        ColIndex = 0
        for Col in Row:
            if ColIndex >= 4:
                print('   ', FirstRow[ColIndex], ' = ', Row[ColIndex])
            ColIndex += 1
    RowIndex += 1

# If there are no CSV rows then something fundamental went wrong
if RowIndex == 0:
    print('Sorry, but it appears that there was an error connecting to the weather server.')
    print('Please check your network connection and try again..')

# If there is only one CSV  row then we likely got an error from the server
if RowIndex == 1:
    print('Sorry, but it appears that there was an error retrieving the weather data.')
    print('Error: ', FirstRow)

print()