//
//  CSVParser.js
//  Mr-Data-Converter
//
//  Input CSV or Tab-delimited data and this will parse it into a Data Grid Javascript object
//
//  CSV Parsing Function from Ben Nadel, http://www.bennadel.com/blog/1504-Ask-Ben-Parsing-CSV-Strings-With-Javascript-Exec-Regular-Expression-Command.htm


var isDecimal_re     = /^\s*(\+|-)?((\d+([,\.]\d+)?)|([,\.]\d+))\s*$/;

var nothousandsep = /(^\d+([,.]\d+)?$)/;
var commathousandsep =  /((^\d{1,3}(,\d{3})+(\.\d+)?)$)/;
var dotthousandsep =  /((^\d{1,3}(\.\d{3})+(,\d+)?)$)/;
var spacethousandsep =  /((^\d{1,3}(\s\d{3})+([,.]\d+)?)$)/;
var appostthousandsep =  /((^\d{1,3}('\d{3})+(\.\d+)?)$)/;
var indianthousandsep = /((^\d{1,2}((,\d{2})|(,\d{3}\.))+(\d+)?)$)/;
var thousandseperator = '';
var decimalsign = '.';
var checkforIndiancurrency = false;
var convertFormattedToStdNum=true;

var CSVParser = {

  //---------------------------------------
  // UTILS
  //---------------------------------------

  //This function returns the type of number format also
 isNumber: function(string) { 
	
	var numtype=0;	
	numtype=(nothousandsep.test(string))?1:0;
	if(thousandseperator=='comma'){			
		numtype=numtype || ((commathousandsep.test(string))?2:0);
	}
	if(thousandseperator=='dot'){		
		numtype=numtype || ((dotthousandsep.test(string))?3:0);		
	}
	if(thousandseperator=='space'){		
		numtype=numtype || ((spacethousandsep.test(string))?4:0);		
	}
	if(thousandseperator=='apostrophe'){		
		numtype=numtype || ((appostthousandsep.test(string))?5:0);		
	}
	if(checkforIndiancurrency){
		numtype=numtype || ((indianthousandsep.test(string))?6:0);
	}
	return numtype;
 },

  
cleanupNumber: function(string) {
	if(thousandseperator=='comma'){
		string = string.replace(/,/g, '');		
	}
	if(thousandseperator=='dot'){
		string = string.replace(/\./g, '');				
	}
	if(thousandseperator=='space'){
		string = string.replace(/ /g, '');		
	}
	if(thousandseperator=='apostrophe'){
		string = string.replace(/'/g, '');				
	}
	if(decimalsign=='comma'){
		string = string.replace(/,/, '.');				
	}	
	
	return string;
},	

  //---------------------------------------
  // PARSE
  //---------------------------------------
  //var parseOutput = CSVParser.parse(this.inputText, this.headersProvided, this.delimiter, this.downcaseHeaders, this.upcaseHeaders);

  parse: function (input, headersIncluded, delimiterType, downcaseHeaders, upcaseHeaders, decimalSign, thousandSeperator, checkForIndianCurrency, convertformattedtostdnum) {
	decimalsign = decimalSign;
    thousandseperator =thousandSeperator;
	checkforIndiancurrency=checkForIndianCurrency;
	convertFormattedToStdNum=convertformattedtostdnum;
    var dataArray = [];

    var errors = [];

    //test for delimiter
    //count the number of commas
    var RE = new RegExp("[^,]", "gi");
    var numCommas = input.replace(RE, "").length;

    //count the number of tabs
    RE = new RegExp("[^\t]", "gi");
    var numTabs = input.replace(RE, "").length;

    var rowDelimiter = "\n";
    //set delimiter
    var columnDelimiter = ",";
    if (numTabs > numCommas) {
      columnDelimiter = "\t"
    };

    if (delimiterType === "comma") {
      columnDelimiter = ","
    } else if (delimiterType === "tab") {
      columnDelimiter = "\t"
    }


    // kill extra empty lines
    RE = new RegExp("^" + rowDelimiter + "+", "gi");
    input = input.replace(RE, "");
    RE = new RegExp(rowDelimiter + "+$", "gi");
    input = input.replace(RE, "");

    // var arr = input.split(rowDelimiter);
    //
    // for (var i=0; i < arr.length; i++) {
    //   dataArray.push(arr[i].split(columnDelimiter));
    // };


    // dataArray = jQuery.csv(columnDelimiter)(input);
    dataArray = this.CSVToArray(input, columnDelimiter);

    //escape out any tabs or returns or new lines
    for (var i = dataArray.length - 1; i >= 0; i--){
      for (var j = dataArray[i].length - 1; j >= 0; j--){
        dataArray[i][j] = dataArray[i][j].replace("\t", "\\t");
        dataArray[i][j] = dataArray[i][j].replace("\n", "\\n");
        dataArray[i][j] = dataArray[i][j].replace("\r", "\\r");
        dataArray[i][j] = dataArray[i][j].replace(/[\""]/g,'\\"'); //escape quotes within strings
      };
    };


    var headerNames = [];
    var headerTypes = [];
    var numColumns = dataArray[0].length;
    var numRows = dataArray.length;
    if (headersIncluded) {

      //remove header row
      headerNames = dataArray.splice(0,1)[0];
      numRows = dataArray.length;

    } else { //if no headerNames provided

      //create generic property names
      for (var i=0; i < numColumns; i++) {
        headerNames.push("val"+String(i));
        headerTypes.push("");
      };

    }


    if (upcaseHeaders) {
      for (var i = headerNames.length - 1; i >= 0; i--){
        headerNames[i] = headerNames[i].toUpperCase();
      };
    };
    if (downcaseHeaders) {
      for (var i = headerNames.length - 1; i >= 0; i--){
        headerNames[i] = headerNames[i].toLowerCase();
      };
    };

    //test all the rows for proper number of columns.
    for (var i=0; i < dataArray.length; i++) {
      var numValues = dataArray[i].length;
      if (numValues != numColumns) {this.log("Error parsing row "+String(i)+". Wrong number of columns.")};
    };

    //test columns for number data type
    var numRowsToTest = dataArray.length;
    var threshold = 0.9;
    for (var i=0; i < headerNames.length; i++) {
      var numFloats = 0;
      var numInts = 0;
      for (var r=0; r < numRowsToTest; r++) {
        if (dataArray[r]) {
		  var ntype=ntype=CSVParser.isNumber(dataArray[r][i]);
          if (ntype>0) {
				numInts++;
				if(convertFormattedToStdNum){
					dataArray[r][i]=CSVParser.cleanupNumber(dataArray[r][i]);					
				}else{
					if(ntype>1)numInts=0; //to make this row as string
				}				
				if (String(dataArray[r][i]).indexOf(".") > 0) {
					numFloats++;
				}
			};
        };

      };

      if ((numInts / numRowsToTest) > threshold){
        if (numFloats > 0) {
          headerTypes[i] = "float";
        } else {
          headerTypes[i] = "int";
        }
      } else {
        headerTypes[i] = "string";
      }
    }





    return {'dataGrid':dataArray, 'headerNames':headerNames, 'headerTypes':headerTypes, 'errors':this.getLog()}

  },


  //---------------------------------------
  // ERROR LOGGING
  //---------------------------------------
  errorLog:[],

  resetLog: function() {
    this.errorLog = [];
  },

  log: function(l) {
    this.errorLog.push(l);
  },

  getLog: function() {
    var out = "";
    if (this.errorLog.length > 0) {
      for (var i=0; i < this.errorLog.length; i++) {
        out += ("!!"+this.errorLog[i] + "!!\n");
      };
      out += "\n"
    };

    return out;
  },



  //---------------------------------------
  // UTIL
  //---------------------------------------

    // This Function from Ben Nadel, http://www.bennadel.com/blog/1504-Ask-Ben-Parsing-CSV-Strings-With-Javascript-Exec-Regular-Expression-Command.htm
    // This will parse a delimited string into an array of
    // arrays. The default delimiter is the comma, but this
    // can be overriden in the second argument.
    CSVToArray: function( strData, strDelimiter ){
      // Check to see if the delimiter is defined. If not,
      // then default to comma.
      strDelimiter = (strDelimiter || ",");

      // Create a regular expression to parse the CSV values.
      var objPattern = new RegExp(
        (
          // Delimiters.
          "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

          // Quoted fields.
          "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

          // Standard fields.
          //"([^\"\\" + strDelimiter + "\\r\\n]*))"
          "([^\\" + strDelimiter + "\\r\\n]*))"  //fix for premature cut of strings which contain double quotes
        ),
        "gi"
        );


      // Create an array to hold our data. Give the array
      // a default empty first row.
      var arrData = [[]];

      // Create an array to hold our individual pattern
      // matching groups.
      var arrMatches = null;


      // Keep looping over the regular expression matches
      // until we can no longer find a match.
      while (arrMatches = objPattern.exec( strData )){

        // Get the delimiter that was found.
        var strMatchedDelimiter = arrMatches[ 1 ];

        // Check to see if the given delimiter has a length
        // (is not the start of string) and if it matches
        // field delimiter. If id does not, then we know
        // that this delimiter is a row delimiter.
        if (
          strMatchedDelimiter.length &&
          (strMatchedDelimiter != strDelimiter)
          ){

          // Since we have reached a new row of data,
          // add an empty row to our data array.
          arrData.push( [] );

        }


        // Now that we have our delimiter out of the way,
        // let's check to see which kind of value we
        // captured (quoted or unquoted).
        if (arrMatches[ 2 ]){

          // We found a quoted value. When we capture
          // this value, unescape any double quotes.
          var strMatchedValue = arrMatches[ 2 ].replace(
            new RegExp( "\"\"", "g" ),
            "\""
            );

        } else {

          // We found a non-quoted value.
          var strMatchedValue = arrMatches[ 3 ];

        }


        // Now that we have our value string, let's add
        // it to the data array.
        arrData[ arrData.length - 1 ].push( strMatchedValue );
      }

      // Return the parsed data.
      return( arrData );
    }



}

