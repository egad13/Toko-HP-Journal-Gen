/*

LEGEND OF REQUIRED HTML ID'S

filepick - the filepicker input element

names - the dropdown box that will contain toko names
sub - the checkbox indicating born submissive or not
block - the checkbox indicating to use blockquotes or not
act - the checkbox indicating to use activity headers or not

genhtml - the button that will make the program gen and display a toko's html
output - the text area that will contain the generated html.

*/


//Global constants
var SUB_MAX = 75;
var AVG_MAX = 250;
var DOM_MAX = 300;
var EXTRA_MAX = 100;
//Global Variables
var g_fileContents = [];
var g_tokos = [];


///////////////////////////////////////////////////////////
//////////////// FILE-INTERPRETING OBJECTS ////////////////
///////////////////////////////////////////////////////////

/*Represents a thumbnail in a tokota tracking database. Includes the thumbnail's
id code, and the activity name, hp calculations, and hp total associated with
the image.*/
function Thumb(id, hpDesc, hp, actType) {
  "use strict";
  //getter methods
  function getCode() { return id; }
  function getHpDesc() { return hpDesc; }
  function getHp() { return hp; }
  function getActType() { return actType; }

  return {
    getCode: getCode, getHpDesc: getHpDesc,
    getHp: getHp, getActType: getActType
  };
}
/////////// END OF THUMB



/*Represents a Tokota found in a Tokota tracking database. Includes the Tokota's
name, and a list of Thumbnail's the Tokota appears in.*/
function Toko(name) {
  "use strict";
  //variables
  var subHpTotal = 0; var avgHpTotal = 0; var domHpTotal = 0; var extraHpTotals = []; var grandTotal = 0;
  var subOverflow = 0; var avgOverflow = 0; var domOverflow = 0; var extraOverflows = [];
  var thumbs = []; var subThumbs = []; var avgThumbs = []; var domThumbs = []; var extraThumbs = [[]];
  var lastUsedIndex; var i; var j;

  //getter methods
  function getName() { return name; }
  function getGrandTot() { return grandTotal; }     //totals
  function getSubHpTot() { return subHpTotal; }
  function getAvgHpTot() { return avgHpTotal; }
  function getDomHpTot() { return domHpTotal; }
  function getExtraHpTots() { return extraHpTotals; }
  function getSubThumbs() { return subThumbs; }     //thumbs
  function getAvgThumbs() { return avgThumbs; }
  function getDomThumbs() { return domThumbs; }
  function getExtraThumbs() { return extraThumbs; }
  function getSubOverflow() { return subOverflow; } // overflows
  function getAvgOverflow() { return avgOverflow; }
  function getDomOverflow() { return domOverflow; }
  function getExtraOverflows() { return extraOverflows; }

  //setter methods
  function addThumb(t) { thumbs.push(t); }

  // functionality
  function organizeTier(thumbArr, max) {
    var total = 0;
    for (i = lastUsedIndex; i < thumbs.length && total < max; i += 1) {
      total += thumbs[i].getHp();
      thumbArr.push(thumbs[i]);
      lastUsedIndex += 1;
    }
    thumbArr.sort(function(a,b) {
      var actA = a.getActType().toUpperCase();
      var actB = b.getActType().toUpperCase();
      if(actA < actB){ return -1; }
      if(actA > actB){ return 1; }
      return 0;
    });
    return total;
  }

  function organizer(sub) {
    //reset all variables to prevent duplicate data
    subHpTotal = 0; avgHpTotal = 0; domHpTotal = 0; extraHpTotals = []; grandTotal = 0;
    subOverflow = 0; avgOverflow = 0; domOverflow = 0; extraOverflows = [];
    subThumbs = []; avgThumbs = []; domThumbs = []; extraThumbs = [[]];
    lastUsedIndex = 0; i = 0; j = 0;

    ///if the tokota was born submissive, include counting for its submissive tier.
    if (sub === true) {
      subHpTotal = organizeTier(getSubThumbs(), SUB_MAX);
      //if we went over the HP limit for this tier, make not of that and add
      //the overflow to the next tier.
      subOverflow = 0;
      if (subHpTotal > SUB_MAX){
        subOverflow = subHpTotal - SUB_MAX;
        avgHpTotal = subOverflow;
        subHpTotal = SUB_MAX;
      }
    }
    ///count for the average tier
    avgHpTotal += organizeTier(getAvgThumbs(), AVG_MAX - subOverflow);
    //if we went over the HP limit for this tier, make not of that and add
    //the overflow to the next tier.
    avgOverflow = 0;
    if (avgHpTotal > AVG_MAX){
      avgOverflow = avgHpTotal - AVG_MAX;
      domHpTotal = avgOverflow;
      avgHpTotal = AVG_MAX;
    }
    ///count for the dominant tier
    domHpTotal += organizeTier(getDomThumbs(), DOM_MAX - avgOverflow);
    //if we went over the HP limit for this tier, make not of that and add
    //the overflow to the next tier.
    domOverflow = 0;
    if (domHpTotal > DOM_MAX){
      domOverflow = domHpTotal - DOM_MAX;
      extraHpTotals[0] = domOverflow;
      domHpTotal = DOM_MAX;
    }

    ///count any remaining thumbnails in extra slot tiers
    for (j = 0; lastUsedIndex < thumbs.length; j += 1) {
      //if there was no overflow from the previous tier, this tier's total starts at 0.
      if(extraHpTotals[j] === undefined){ extraHpTotals[j] = 0; }
      //count for this extra tier
      extraThumbs[j] = [];

      if (j !== 0){
        extraHpTotals[j] += organizeTier(getExtraThumbs()[j], EXTRA_MAX - extraOverflows[j-1]);
      }
      if (j === 0){
        extraHpTotals[j] += organizeTier(getExtraThumbs()[j], EXTRA_MAX - domOverflow);
      }

      //if we went over the HP limit for this tier, make not of that and add
      //the overflow to the next tier.
      extraOverflows[j] = 0;
      if (extraHpTotals[j] > EXTRA_MAX){
        extraOverflows[j] = extraHpTotals[j] - EXTRA_MAX;
        extraHpTotals[j+1] = extraOverflows[j];
        extraHpTotals[j] = EXTRA_MAX;
      }
    }

    grandTotal = subHpTotal + avgHpTotal + domHpTotal;
    for (i = 0; i < extraHpTotals.length; i += 1) {
      grandTotal += extraHpTotals[i];
    }
  }

  return {
    getName: getName, getGrandTot: getGrandTot, getSubHpTot: getSubHpTot,
    getAvgHpTot: getAvgHpTot, getDomHpTot: getDomHpTot,
    getExtraHpTots: getExtraHpTots, getSubOverflow: getSubOverflow,
    getAvgOverflow: getAvgOverflow, getDomOverflow: getDomOverflow,
    getExtraOverflows: getExtraOverflows, getSubThumbs: getSubThumbs,
    getAvgThumbs: getAvgThumbs, getDomThumbs: getDomThumbs,
    getExtraThumbs: getExtraThumbs, addThumb: addThumb, organizer: organizer
  };
}
/////////// END OF TOKO


/////////////////////////////////////////////////
//////////////// UTILITY CLASSES ////////////////
/////////////////////////////////////////////////

var HTMLGenn = (function () {
  "use strict";
  //IN-TEXT VARIABLE KEYS:
  //// $thumbCode
  //// $thumbHp
  //// $thumbDesc
  //// $grandTotal - the total HP for all tiers.
  //// $tierName - the name of the tier
  //// $tierTotal - the total HP for this tier
  //// $subtierName - the name of an activity, aka subtier.
  //// $subtierTotal - the total HP for a subtier.

  // FIELDS (all private unless added to the return statement)
  var temp_grandTotal = "<div align =\"center\"><h3>Grand Total = $grandTotal HP</h3></div><br/><br/>";
  var temp_tierHeader = "<h2>$tierName (Total = $tierTotal HP)</h2>";
  var temp_subtierHeader = "<h3>$subtierName | Total = $subtierTotal HP</h3>";
  var temp_thumbBlockquote = "<blockquote><da:thumb id=\"$thumbCode\"><b><br/>Total = $thumbHp HP</b><br/>$thumbDesc</blockquote>";
  var temp_thumb = "<div align=\"center\"><da:thumb id=\"$thumbCode\"><b><br/>Total = $thumbHp HP</b><br/>$thumbDesc</div><br/><br/>";

  var finalResult = "";

  // METHODS
  //creates and returns an HTML string representing a single Thumb object.
  function singleThumb(block, thumb) {
    if (block === true) {
      return temp_thumbBlockquote.replace("$thumbCode", thumb.getCode())
      .replace("$thumbDesc", thumb.getHpDesc())
      .replace("$thumbHp", thumb.getHp());
    }
    return temp_thumb.replace("$thumbCode", thumb.getCode())
    .replace("$thumbDesc", thumb.getHpDesc())
    .replace("$thumbHp", thumb.getHp());
  }//end of function 'singleThumb'

  //creates and returns an HTML string representing a full tier of a Toko object.
  function tier(block, act, total, thumbs, tName, overflow) {
    var i;
    var result = temp_tierHeader.replace("$tierName", tName)
                .replace("$tierTotal", total) + "<br/>";

    // TODO add in support for the carried over HP.
    if (overflow > 0){
      result = result + "Carried over from previous section: " + overflow + " HP<br/>";
    }

    //if activity headers were not requested, don't do them.
    if (act === false) {
      for (i = 0; i < thumbs.length; i += 1) {
        result = result + singleThumb(block, thumbs[i]);
      }//end for
      return result;
    }//end if

    //if activity headers were requested, do them.
    var currentAct = thumbs[0].getActType(); total = 0;
    result = result + temp_subtierHeader.replace("$subtierName", thumbs[0].getActType());
    for (i = 0; i < thumbs.length; i += 1) {
      if (currentAct !== thumbs[i].getActType()) {
        result = result.replace("$subtierTotal", total);
        total = 0;
        result = result + temp_subtierHeader.replace("$subtierName", thumbs[i].getActType());
        currentAct = thumbs[i].getActType();
      }
      total += thumbs[i].getHp();
      result = result + singleThumb(block, thumbs[i]);
    }
    result = result.replace("$subtierTotal", total); //ensures subtotal appears if there was only one activity in the tier
    return result;
  }//end of funtion 'tier'

  //creates and returns an HTML string representing a full Toko object.
  function getHtml(toko, sub, block, act) {
    finalResult = "";
    finalResult = temp_grandTotal.replace("$grandTotal", toko.getGrandTot());
    var i;

    //appends submissive tier, if required
    if (sub === true) {
      finalResult = finalResult + tier(block, act, toko.getSubHpTot(), toko.getSubThumbs(), "Submissive to Average", 0);
    }
    //appends average tier, if required
    if (toko.getAvgHpTot() > 0) {
      finalResult = finalResult + tier(block, act, toko.getAvgHpTot(), toko.getAvgThumbs(), "Average to Dominant", toko.getSubOverflow());
    }
    //appends dominant tier, if required
    if (toko.getDomHpTot() > 0) {
      finalResult = finalResult + tier(block, act, toko.getDomHpTot(), toko.getDomThumbs(), "Dominant to Alpha", toko.getAvgOverflow());
    }

    //appends extra tiers, if required
    if (toko.getExtraHpTots().length > 0) {
      finalResult = finalResult + tier(block, act, toko.getExtraHpTots()[0], toko.getExtraThumbs()[0], "Extra Slots 1", toko.getDomOverflow());
    }
    for (i = 1; i < toko.getExtraHpTots().length; i += 1) {
      finalResult = finalResult + tier(block, act, toko.getExtraHpTots()[i], toko.getExtraThumbs()[i], "Extra Slots " + (i+1), toko.getExtraOverflows()[i-1]);
    }

    return finalResult;
  }//end of function 'getHtml'

  return {
    getHtml: getHtml
  };
}());


///////////////////////////////////////////////////////////
/////////////////// UTILITY FUNCTIONS ////////////////////
///////////////////////////////////////////////////////////

/* takes in a FULL filepath and a desired extension. returns true if the file is
of the correct extension, false otherwise.*/
function validateFile(path, ext) {
  "use strict";
  path = path.substring(path.lastIndexOf("."));
  if (path !== ext) {
    return false;
  }
  return true;
}

//resets the gui.
function reset() {
  "use strict";
  document.getElementById("form").reset();
  document.getElementById("genhtml").disabled = true;
  document.getElementById("output").innerHTML = "pick a file to begin.";
  document.getElementById("names").innerHTML = "";
}

//shows an error dialog and resets the gui.
function showError(errStr) {
  "use strict";
  alert(errStr);
  reset();
}



/*takes the global filecontents variable and turns it into an array of tokotas
containing their related thumbnails.*/
function interpretFile() {
  "use strict";
  var line;
  var numberRegex = /[\-]?[\d]?[.]?[\d]+/; var codeRegex = /[:]([t][h][u][m][b])?/g;
  var thumb;
  var namesFound = "";
  var i; var j; var k;
  var dropdown = document.getElementById("names");
  var option;
  var filledLineRegex = /[^,]/g; var whitespaceRegex = /[\s]+/;

  //create an array of all the tokos
  A: for (i = 1; i < g_fileContents.length; i += 1) {
    line = g_fileContents[i].split(",");

    ////error check the line of data
    //if the line is empty(contains only commas and a possibly newline character), reached EoF, so exit.
    if (line.toString() === "" || line.toString().match(filledLineRegex).length <= 1) { break A; }
    //if missing an HP value, inform the user
    if (line[2] === "" || line[2].match(numberRegex).length === -1) {
      showError("HP value at line " + (i+1) + " is either empty or contains non-numerical\ncharacters. Please fix the issue and try again.");
      return false;
    }
    //if missing a thumb code, inform the user
    if (line[0] === "") {
      showError("Line " + (i+1) + " contains no thumb code. Please fix the issue and try again.");
      return false;
    }

    //create the thumbnail
    thumb = new Thumb(line[0].replace(codeRegex, ""), line[1], parseFloat(line[2]), line[3]);

    //if there's a new tokota name on this line, add it to the list
    for (j = 4; j < line.length; j += 1) {
      if (line[j].length !== 0 && line[j].match(whitespaceRegex) === null && namesFound.indexOf(line[j]) === -1) {
        g_tokos.push(new Toko(line[j]));
        namesFound = namesFound + " " + line[j];
      }
    }//end for

    //give the new thumbnail to all the tokos in it
    for (j = 0; j < g_tokos.length; j += 1) {
      for (k = 4; k < line.length; k += 1) {
        if (line[k] === g_tokos[j].getName()) {
          g_tokos[j].addThumb(thumb);
        }
      }//end for
    }//end for
  }

  //sort the toko array alphabetically by name
  g_tokos.sort(function(a,b) {
    var nameA = a.getName().toUpperCase();
    var nameB = b.getName().toUpperCase();
    if(nameA < nameB) { return -1; }
    if(nameA > nameB) { return 1; }
    return 0;
  });

  //add all toko names to the dropdown
  for (i = 0; i < g_tokos.length; i += 1) {
    option = document.createElement("OPTION");
    option.text = g_tokos[i].getName();
    dropdown.appendChild(option);
  }

  return true;
}



///////////////////////////////////////////////////////////
///////////////////// EVENT FUNCTIONS /////////////////////
///////////////////////////////////////////////////////////

/* Upon the user using the filepicker, determines whether the file given (if
any) is of a valid type, and if not, does not allow the user to continue the
program with that file.*/
function loadFile(filepicker) {
  "use strict";
  var reader; var fileReadSuccess;

  if (filepicker.value.length === 0) {
    reset();
    return;
  }
  if (validateFile(filepicker.value, ".csv") === false) {
    showError("Invalid file type. Please choose a Comma Separated Document (.csv)");
    return;
  }

  //if the file is of the correct type, read it in as individual lines, keeping
  //the user up to date on the progress.
  reader = new FileReader();
  reader.onloadstart = function() {
    document.getElementById("output").innerHTML = "Loading File...";
  };
  reader.onload = function(e) {
    g_fileContents = e.target.result.split("\n");
  };
  reader.onloadend = function() {
    fileReadSuccess = interpretFile();
    if (fileReadSuccess === true) {
      document.getElementById("output").innerHTML = "FILE LOADED";
      document.getElementById("genhtml").disabled = false;
    }
  };
  reader.readAsText(filepicker.files[0]);
}

/*Called when the Generate button is pushed, generates and outputs html for
the chosen tokota.*/
function generate() {
  "use strict";
  var outputBox = document.getElementById("output"); //output text area
  var e = document.getElementById("names"); //name of tokota to gen for
  var name = e.options[e.selectedIndex].value;
  var toko; //tokota to gen html for
  var sub = document.getElementById("sub").checked; //check boxes
  var act = document.getElementById("act").checked;
  var block = document.getElementById("block").checked;
  var i;

  //TODO change this to a binary search
  //find the toko to gen html for
  B: for (i = 0; i < g_tokos.length; i += 1) {
    if (name === g_tokos[i].getName()) {
      toko = g_tokos[i];
      break B;
    }
  }

  //organize the toko
  toko.organizer(sub);

  //gen and spit out its html, using HTMLGenn with the toko's info
  outputBox.innerHTML = HTMLGenn.getHtml(toko, sub, block, act);
}
