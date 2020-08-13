#Downloading weather data using Python as a CSV using the Visual Crossing Weather API
#See https://www.visualcrossing.com/resources/blog/how-to-load-historical-weather-data-using-python-without-scraping/ for more information.
import csv
import codecs
import urllib.request
import sys

# This is the core of our weather query URL
BaseURL = 'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/weatherdata/'

if len(sys.argv) < 4:
    print('')
    print('Usage: Location QueryType API_KEY FROMDATE TODATE')
    print()
    print('  Location: Please provide a location for the weather search.')
    print('    (Make sure to use quotes if the name contains spaces.)')
    print('  Date: Please specify a date in the format YYYY-MM-DD to look up weather for a specific date.')
    print('    Or use the FORECAST to look up the current weather forcast.')
    print('  API_KEY: Please specify your Visual Crossing Weather API Key')
    print('    If you don\'t already have an API Key, sign up for one at https://www.visualcrossing.com/weather-api.')
    print()
    print('Example: \"Herndon, VA\" HISTORY YOUR_API_KEY 2019-01-01 2019-01-07')
    print('Example: \"Beverly Hills, CA\" FORECAST YOUR_API_KEY')
    print()
    sys.exit()

print('')
print(' - Requesting weather for: ', sys.argv[1])

# Set up the location parameter for our query
QueryLocation = '&location=' + urllib.parse.quote(sys.argv[1])

# Set up the query type parameter for our query ('FORECAST' or 'HISTORY')
QueryType=sys.argv[2].upper()

# Set up the key parameter for our query
QueryKey = '&key=' + sys.argv[3]

# Set up the date parameters for our query. Used only for historical weather data requests
if len(sys.argv) >4:
    FromDateParam = sys.argv[4]
    ToDateParam = sys.argv[5]





# Set up the specific parameters based on the type of query
if QueryType == 'FORECAST':
    print(' - Fetching forecast data')
    QueryTypeParams = 'forecast?&aggregateHours=24&unitGroup=us&shortColumnNames=false'
else:
    print(' - Fetching history for date: ', FromDateParam,'-',ToDateParam)

    # History requests require a date.  We use the same date for start and end since we only want to query a single date in this example
    QueryDate = '&startDateTime=' + FromDateParam + 'T00:00:00&endDateTime=' +ToDateParam + 'T00:00:00'
    QueryTypeParams = 'history?&aggregateHours=24&unitGroup=us&dayStartTime=0:0:00&dayEndTime=0:0:00' + QueryDate


# Build the entire query
URL = BaseURL + QueryTypeParams + QueryLocation + QueryKey

print(' - Running query URL: ', URL)
print()

# Parse the results as CSV
CSVBytes = urllib.request.urlopen(URL)
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
