Google Charts
====================

Render output from ONS-API using Google Charts


This demo uses the Native JSON object, so requires a reasonably modern browser (Internet Explorer 8 is OK but 7 is too old).
 
Google Charts is a free tool which allows anyone to incorporate dynamic charting into their web pages using Javascript. Google Charts likes to be fed data in JSON format in this case a slice from a dataset for a single area is converted into a Google DataTable, which is then rendered as a table and a chart using the visualizer.
 
There are two versions of the demo provided, one uses the SDMX-like JSON output which requires quite a bit of custom javascript to convert into a Google Datatable. The other uses the simpler JSON-Stat output which can be converted to a Google Datatable using a library function.


![Screenshot](https://raw.githubusercontent.com/ONSdigital/ons-api_googlecharts/master/screenshot.jpg "Screenshot")