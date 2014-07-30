
// This code example is provided by the Office for National Statistics under the terms of the 
// Open Government Licence http://www.nationalarchives.gov.uk/doc/open-government-licence/
// For live API calls please change the apikey= value in the query string to your own API Key

function GoogleVisUtils(jsonDataset) {
    //	The JSON Object containing the Dataset from a Read API call
    this.jsonDataset = jsonDataset;
    this.convertDatasetToJson = function () {
        // create the columns first, then the rows  
        var cols = createColumns(this.jsonDataset);
        var rows = createRows(this.jsonDataset);
        var scols = sortCols(this.jsonDataset,cols);       
	var jsonObject = {};
        jsonObject.cols = scols;
        jsonObject.rows = rows;
        return jsonObject;
    };
}


function sortCols(jsonObject,cols){
// sort the columns by concept

    var scols = [];
    var sections =  jsonObject["ons.dataPackage"]["ons.genericData"]["message.DataSet"]["generic.Group"]["generic.Series"];
    var section = sections[0];
    var skeys = section["generic.SeriesKey"]["generic.Value"];
    for (col = 0; col < skeys.length; col++) {
        var scon = skeys[col]["@concept"];
	for (h = 0; h < cols.length; h++){
	if (scon == cols[h].id) {
		scols.push(cols[h]);
	}
      }
   }
  scols.push(cols[cols.length-1]);
  return scols;
}



function createRows(jsonObject) {
    // create an array containing the dimension item labels  
    var descriptions = populateDescriptions(jsonObject);

    // create a row for each Series in the data   
    var rows = [];
    var sections =  jsonObject["ons.dataPackage"]["ons.genericData"]["message.DataSet"]["generic.Group"]["generic.Series"];
    for (i = 0; i < sections.length; i++) {
        var section = sections[i];
        rows.push(createRow(section, jsonObject, descriptions));
    }
    return rows;
}

function dataItem(value) {
    // Google expects a v object for each value
    return {
        "v": value
    };
}

function createRow(section, jsonObject, descriptions) {
    // Google expects a C object for each row
    var row = {
        "c": []
    };

    // fetch the series key and observation element for each series
    var skeys = section["generic.SeriesKey"]["generic.Value"];
    var observation = section["generic.Obs"]["generic.ObsValue"]["@value"];

    for (col = 0; col < skeys.length; col++) {
        // each data cell is marked with a concept value pair. Need to convert concept to codelist to fetch 
        // dimension item label from descriptions array 
        var skey = skeys[col]["@value"];
        var scon = skeys[col]["@concept"];
        var scl = dims[scon]
        var description = getDescription(descriptions, scl, skey);
        row.c.push(dataItem(description));
    }
    // after adding a number of dimension item values, add the observation (typically a count)  
    var nvalue = parseInt(observation);
    row.c.push(dataItem(nvalue));
    return row;
}

function populateDescriptions(jsonObject) {
    var descriptions = {};
    var codelists = jsonObject["ons.dataPackage"]["ons.structureData"][
        "message.CodeLists"
    ]["structure.CodeList"];
    for (i = 0; i < codelists.length; i++) {
        var codelist = codelists[i];
        var currList = {};
        descriptions[codelist["@id"]] = currList;
        var codes = codelist["structure.Code"];

        // if there is only one code, the length of the array will be undefined 
        if (codes.length == undefined) {
	   if (codelist["@id"] == 'CL_OBS_STATUS' || codelist["@id"] == 'CL_SEGMENT') {
		//skip these
	   }
	   else
	   {
            currList[codes["@value"]] = codes["structure.Description"][0]["$"];
            if (codelist["@id"] == '2011WARDH' || codelist["@id"] == '2011HTWARDH'|| codelist["@id"] == '2011STATH' ) {
                // save the name of the area for later use	
                chosenArea = codes["structure.Description"][0]["$"];
            }
	    }
        }
        // many codes, loop through items
	   if (codelist["@id"] == 'CL_OBS_STATUS' || codelist["@id"] == 'CL_SEGMENT') {
		//skip these
	   }
	   else
	   {
   
            if (codelist["@id"] == '2011WARDH' || codelist["@id"] == '2011HTWARDH'|| codelist["@id"] == '2011STATH' ) {
                // save the name of the area for later use	
                chosenArea = codes[1]["structure.Description"][0]["$"];
            }
     for (j = 0; j < codes.length; j++) {
	var descs = codes[j]["structure.Description"];
	if (descs.length == undefined)
        {
        // skip if no Welsh
	  }
        else
	  {
            currList[codes[j]["@value"]] = codes[j]["structure.Description"][0]
            ["$"];
         }
        }
      }
    }
    return descriptions;
}

function getDescription(descriptions, codelist, code) {
    // return a particular description
    var description = descriptions[codelist][code];
    return description;
}

function createColumns(jsonDataset) {
    // each column has a name and a label  
    var cols = [];
    var headers = getColumnHeaders(jsonDataset);
    var headlabels = getColumnHeaderLabels(jsonDataset);
    for (i = 0; i < headers.length; i++) {
        cols.push(createHeader(headers[i], headlabels[i], "string"));
    }
    // hard-code count for values column (might be different can get from attributes in response)   
    cols.push(createHeader("Count", "Count", "number"));
    return cols;
}

function createHeader(id, label, type) {
    // create Google Data Table style header 
    var header = {
        "id": id,
        "label": label,
        "type": type
    };
    return header;
}

function getColumnHeaders(jsonObject) {
    // fetch the concept value for each column and link it to the corresponding codelist
    var dimensions =  jsonObject["ons.dataPackage"]["ons.structureData"]["message.KeyFamilies"]["structure.KeyFamily"]["structure.Components"]["structure.Dimension"];
    dims = {};
    var headers = new Array();
    for (i = 0; i < dimensions.length; i++) {

	if (dimensions[i]["@conceptRef"] != "SEGMENT")
	{
        headers[headers.length] = dimensions[i]["@conceptRef"];
        dims[dimensions[i]["@conceptRef"]] = dimensions[i]["@codelist"];
	} 
   }

    return headers;
}


function getColumnHeaderLabels(jsonObject) {
    // Get the long name of each column 
    var dimensions =    jsonObject["ons.dataPackage"]["ons.structureData"]["message.KeyFamilies"]["structure.KeyFamily"]["structure.Components"]["structure.Dimension"];
    var codelists = jsonObject["ons.dataPackage"]["ons.structureData"]["message.CodeLists"]["structure.CodeList"];

    var headlabels = new Array();
    for (i = 0; i < dimensions.length; i++) {
        var curcon = dimensions[i]["@conceptRef"];
	if (curcon != "SEGMENT")
	{
        if (curcon == 'Location') {
            // for area, use "Location" instead of full hierarchy name
            headlabels[headlabels.length] = "Location";
        } else {
            var curlist = dimensions[i]["@codelist"];
            for (j = 0; j < codelists.length; j++) {
                if (codelists[j]["@id"] == curlist) {
                    headlabels[headlabels.length] = codelists[j]["structure.Name"][0]["$"];
                }
            }
        }
	}

    }

    return headlabels;
}


function validateJson(alertUser) {
    // call the JSON validator
    try {
        var jsonObject = JSON.parse(document.getElementById('jsonTextArea').value);
        if (alertUser) {
            alert("Valid JSON ");
        }
        return jsonObject;
    } catch (error) {
        alert("Validation failed with error: " + error);
    }
}

function isNumber(n) {
    // check that value is a number 
    return !isNaN(parseFloat(n)) && isFinite(n);
}