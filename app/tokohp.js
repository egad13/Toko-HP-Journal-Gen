/**
 * @file Contains the Toko-HP-Journal-Gen app.<br/><br/> For detailed context on what the code in this app means
 * and does, see PROJECT_SPECIFICATIONS.md.<br/><br/> In order to run, this app needs specific elements with
 * specific id's to be present in the webpage running it. These elements are:
 * <ul>
 * <li>A select element with id "names", which should be empty.</li>
 * <li>Three checkbox inputs with the id's "submis", "block", and "subcat".</li>
 * <li>A disabled button with id "genhtml", which will be enabled and disabled by the app as necessary.</li>
 * <li>A readonly textarea with id "output".</li>
 * <li>A file input element, within a form element that has id "form".</li>
 * </ul>
 * @author EricaG13
 * @version 1.0.0
 */

/** A namespace which encapsulates all the code that is necessary for this app to work. It exists to keep private
 * the app's inner workings and keep the global namespace clean.
 * @namespace
 * @global */
var TokoHPApp = (function(){
  "use strict";

  /** This array contains the list of Toko objects that will be used throughout the app.
   * @static
   * @private
   * @type {TokoHPApp.Toko[]}
   * @memberof TokoHPApp */
  var appwide_tokos = [];


  ///////////////////////////////////////////////////////////
  /////////////////// DATA STORAGE OBJECTS //////////////////
  ///////////////////////////////////////////////////////////

  /** Creates a new Thumb. A Thumb represents a thumbnail, aka a piece of artwork.
   * Thumbs are the smallest unit of an HP Journal, and are immutable.
   * @class
   * @param {string} id - The thumbcode of this Thumb. In the generated HTML, this
   * is used to display the image.
   * @param {string} hpBreakdown - A description of why this Thumb has the HP value it does.
   * @param {number} hp - The HP value of this Thumb.
   * @param {string} subcat - The subcategory of this Thumb. Empty if the user
   * didn't indicate a value for this in their input.
   * @memberof TokoHPApp */
  function Thumb(id, hpBreakdown, hp, subcat) {
    /** @returns {string} the id, or thumbcode, of this Thumb. */
    function getCode() { return id; }

    /** @returns {string} the HP breakdown of this Thumb. */
    function getHpBreakdown() { return hpBreakdown; }

    /** @returns {number} the HP value of this Thumb. */
    function getHp() { return hp; }

    /** @returns {string} the HP value of this Thumb. */
    function getSubcategory() { return subcat; }

    //make necessary methods public
    return {
      getCode: getCode,
      getHpBreakdown: getHpBreakdown,
      getHp: getHp,
      getSubcategory: getSubcategory
    };
  }

  /** Creates a new Tier. A Tier is a higher level structure within an HP journal, which contains a name,
   * a list of Thumbs, and a maximum total HP which the Thumbs it contains can add up to. The HP total can
   * be modified by Tiers that come before it in a single Toko's Journal; ie, if the Tier directly previous
   * overflowed (went over its HP maximum), this Tier should be passed that overflow before any Thumbs are
   * added to it, as that will affect how many Thumbs this Tier can legally hold.
   * @class
   * @param {string} name - The name to display for this Tier in an HP Journal.
   * @param {number} hpMax - The maximum amount of HP the Thumbs in this tier can
   * collectively have.
   * @memberof TokoHPApp */
  function Tier(name, hpMax) {
    var total = 0;
    var thumbArr = [];
    var overflowFromPrev = 0;
    var overflow = 0;

    /** @returns {string} the name of this Tier. */
    function getName() { return name; }

    /** @returns {number} the HP value of this Tier. */
    function getTotal() { return total; }

    /** @returns {string} the Maximum HP value of this Tier. */
    function getMax() { return hpMax; }

    /** @returns {TokoHPApp.Thumb[]} The list of Thumbs contained by this Tier. */
    function getThumbs() { return thumbArr; }

    /** @returns {boolean} whether or not this Tier contains overflow from the previous Tier.*/
    function hasOverflowFromPrevious() { return (overflowFromPrev > 0); }

    /** If the Tier directly previous overflowed, this will return the the value of that overflow. Note that
     * this value is automatically added to the total when this variable is set.
     * @returns {number} The amount of HP which overflowed from the previous Tier. */
    function getOverflowFromPrevious() { return overflowFromPrev; }

    /** @returns {boolean} whether or not this Tier overflowed (went above maximum HP) */
    function isOverflowing() { return (overflow > 0); }

    /** If this Tier overflows, this will return the value of that overflow. This value is automatically subtracted from the
     * total when this variable is set, and that this variable being >0 prevents any more Thumbs from being added to this Tier.
     * @returns {number} the amount by which this Tier has overflowed. */
    function getOverflow() { return overflow; }

    /** Checks if this Tier has overflowed, and if it has, sets the overflow value.
     * @private */
    function checkIfOverflowing(){
      if (overflow === 0 && total >= hpMax){ overflow = total - hpMax; }
    }

    /** Provided this Tier isn't overflowing, adds a Thumb to this Tier's list,
     * and adds that Thumb's HP value to this Tier's total.
     * @param {TokoHPApp.Thumb} thumb - The Thumb to add to this Tier.
     * @returns {boolean} whether or not the Thumb was successfully added. */
    function countThumb(thumb){
      if (overflow === 0){
        thumbArr.push(thumb);
        total += thumb.getHp();
        checkIfOverflowing();
        return true;
      }
      return false;
    }

    /** Used to tell this Tier that the previous Tier overflowed. Will only succeed once. If it needs to be called,
     * it should be called BEFORE any Thumbs are added to the Tier.
     * @param {number} n - The amount of overflow the previous Tier had. */
    function setOverflowFromPrev(n){
      if (overflowFromPrev === 0){
        overflowFromPrev = n;
        total += n;
        checkIfOverflowing();
      }
    }

    /** Sorts this Tier's list of Thumbs alphabetically by their subcategories. */
    function sortBySubcat(){
      thumbArr.sort(function(a, b) {
        var subcatA = a.getSubcategory().toUpperCase();
        var subcatB = b.getSubcategory().toUpperCase();
        if(subcatA < subcatB){ return -1; }
        if(subcatA > subcatB){ return 1; }
        return 0;
      });
    }

    //make necessary methods public
    return {
      getName: getName,
      getTotal: getTotal,
      getMax: getMax,
      getThumbs: getThumbs,
      hasOverflowFromPrevious: hasOverflowFromPrevious,
      getOverflowFromPrevious: getOverflowFromPrevious,
      isOverflowing: isOverflowing,
      getOverflow: getOverflow,
      countThumb: countThumb,
      setOverflowFromPrev: setOverflowFromPrev,
      sortBySubcat: sortBySubcat
    };

  }


  /** Creates a new Toko, an object which represents a Tokota. For the purposes of this app, a Tokota is simply a name
   * and the information needed to generate an HP Journal.
   * @class
   * @param {string} name - The name of the Tokota represented by this object.
   * @memberof TokoHPApp */
  function Toko(name) {

    /** The maximum HP value the "Submissive to Average" Tier can hold.
     * @const {number}
     * @private */
    var SUB_MAX = 75;

    /** The maximum HP value the "Average to Dominant" Tier can hold.
     * @const {number}
     * @private */
    var AVG_MAX = 250;

    /** The maximum HP value the "Dominant to Alpha" Tier can hold.
     * @const {number}
     * @private */
    var DOM_MAX = 300;

    /** The maximum HP value the "Extra Slot" Tiers can hold.
     * @const {number}
     * @private */
    var EXTRA_MAX = 100;

    var grandTotal = 0;
    var thumbs = [];
    var tiers = [];
    var lastUsedIndex;
    var i;

    /** @returns {string} the name of this Toko. */
    function getName() { return name; }

    /** @returns {number} the combined HP value of all Thumbs contained by this Toko. */
    function getGrandTot() { return grandTotal; }

    /** @returns {TokoHPApp.Tier[]} this Toko's list of Tiers. */
    function getTiers() { return tiers; }

    /** Adds a Thumb to this Toko's list, and add's the Thumb's value to the grand HP total.
     * @param {TokoHPApp.Thumb} t - The Thumb to be added to this Toko. */
    function addThumb(t) {
      thumbs.push(t);
      grandTotal += t.getHp();
    }


    /** A helper function for TokoHPApp.Toko.countTiers. Creates a Tier with
     * the specified name and HP maximum, and adds Thumbs to it until it's full.
     * @param {string} tierName - The name the new Tier will have.
     * @param {number} tierMax - The maximum HP this Tier will be able to hold.
     * @private */
    function createTier(tierName, tierMax) {
      var newTier = new Tier(tierName, tierMax);
      if (tiers.length > 0) {
        newTier.setOverflowFromPrev(tiers[tiers.length - 1].getOverflow());
      }
      while (lastUsedIndex < thumbs.length && newTier.isOverflowing() === false) {
        newTier.countThumb(thumbs[lastUsedIndex]);
        lastUsedIndex += 1;
      }
      tiers.push(newTier);
    }

    /** Removes any Tiers this Toko object may have had, and creates and counts for as many Tiers as needed
     * for this Toko's Hp Journal. This must be called before the HTML representation of this Toko can be generated.
     * @param {boolean} sub - Whether or not this Toko should include a "Submissive to Average" Tier. */
    function countTiers(sub) {
      tiers = [];
      lastUsedIndex = 0;
      i = 0;

      if (sub === true) {
        createTier("Submissive to Average", SUB_MAX);
      }
      if (lastUsedIndex < thumbs.length) {
        createTier("Average to Dominant", AVG_MAX);
      }
      if (lastUsedIndex < thumbs.length) {
        createTier("Dominant to Alpha", DOM_MAX);
      }
      for (i = 0; lastUsedIndex < thumbs.length; i += 1) {
        createTier("Extra Slots " + (i+1), EXTRA_MAX);
      }

      for (i = 0; i < tiers.length; i += 1) {
        tiers[i].sortBySubcat();
      }
    }

    //make necessary methods public
    return {
      getName: getName,
      getGrandTot: getGrandTot,
      getTiers: getTiers,
      addThumb: addThumb,
      countTiers: countTiers
    };
  }
  /////////// END OF TOKO


  /////////////////////////////////////////////////
  /////////////// SINGLETON CLASSES ///////////////
  /////////////////////////////////////////////////

  /** A singleton class which is used to generate an HTML representation of a Toko object, ie an HP Journal.
  * @namespace
  * @memberof TokoHPApp */
  var HTMLGenn = (function () {

    /** The HTML template for the Grand Total section of an HP Journal.
     * @const {string}
     * @private
     * @memberof TokoHPApp.HTMLGenn */
    var template_grandTotal = "<div align =\"center\"><h3>Grand Total = "
    + "$grandTotal HP</h3></div><br/><br/>";

    /** The HTML template for a tier header.
     * @const {string}
     * @private
     * @memberof TokoHPApp.HTMLGenn */
    var template_tierHeader = "<h2>$tierName (Total = $tierTotal HP)</h2><br/>";

    /** The HTML template for a subcategory header.
     * @const {string}
     * @private
     * @memberof TokoHPApp.HTMLGenn */
    var template_subcategoryHeader = "<h3>$subcategoryName | Total = "
    + "$subcategoryTotal HP</h3>";

    /** The HTML template for a Thumb enclosed in blockquote tags.
     * @const {string}
     * @private
     * @memberof TokoHPApp.HTMLGenn */
    var template_thumbBlockquote = "<blockquote><da:thumb id=\"$thumbCode\"><b>"
    + "<br/>Total = $thumbHp HP</b><br/>$thumbBreakdown</blockquote>";

    /** The HTML template for a Thumb centered in the journal.
     * @const {string}
     * @private
     * @memberof TokoHPApp.HTMLGenn */
    var template_thumb = "<div align=\"center\"><da:thumb id=\"$thumbCode\"><b>"
    + "<br/>Total = $thumbHp HP</b><br/>$thumbBreakdown</div><br/><br/>";


    /** @returns {string} an HTML string representing a single Thumb.
     * @param {boolean} block - Whether or not the Thumb should be formatted with
     * blockquote tags. If false, Thumb is centered instead.
     * @param {TokoHPApp.Thumb} thumb - The Thumb to generate HTML for.
     * @private
     * @memberof TokoHPApp.HTMLGenn */
    function buildThumbStr(block, thumb) {
      if (block === true) {
        return template_thumbBlockquote.replace("$thumbCode", thumb.getCode())
        .replace("$thumbBreakdown", thumb.getHpBreakdown())
        .replace("$thumbHp", thumb.getHp());
      }
      return template_thumb.replace("$thumbCode", thumb.getCode())
      .replace("$thumbBreakdown", thumb.getHpBreakdown())
      .replace("$thumbHp", thumb.getHp());
    }

    /** A helper method for TokoHPApp.HTMLGenn.buildTierStr.
      * @returns {string} an HTML string representing a Tier's list of Thumbs, without using subcategory headers.
      * @param {boolean} block - Whether or not the Thumbs should be formatted with
      * blockquote tags. If false, Thumbs are centered instead.
      * @param {TokoHPApp.Tier} tier - The Tier to generate HTML for.
      * @private
      * @memberof TokoHPApp.HTMLGenn */
    function buildTier_noHeaders(block, tier) {
      var i;
      var result = "";
      for (i = 0; i < tier.getThumbs().length; i += 1) {
        result = result + buildThumbStr(block, tier.getThumbs()[i]);
      }
      return result;
    }

    /** A helper method for TokoHPApp.HTMLGenn.buildTierStr.
     * @returns {string} an HTML string representing a Tier's list of Thumbs, with subcategory headers included.
     * @param {boolean} block - Whether or not the Thumbs should be formatted with
     * blockquote tags. If false, Thumbs are centered instead.
     * @param {TokoHPApp.Tier} tier - The Tier to generate HTML for.
     * @private
     * @memberof TokoHPApp.HTMLGenn */
    function buildTier_withHeaders(block, tier) {
      var i;
      var currentSubcat = tier.getThumbs()[0].getSubcategory();
      var subtotal = 0;
      var result = template_subcategoryHeader.replace("$subcategoryName", currentSubcat);

      for (i = 0; i < tier.getThumbs().length; i += 1) {
        if (currentSubcat !== tier.getThumbs()[i].getSubcategory()) {
          result = result.replace("$subcategoryTotal", subtotal);
          subtotal = 0;
          result = result + template_subcategoryHeader.replace("$subcategoryName", tier.getThumbs()[i].getSubcategory());
          currentSubcat = tier.getThumbs()[i].getSubcategory();
        }
        subtotal += tier.getThumbs()[i].getHp();
        result = result + buildThumbStr(block, tier.getThumbs()[i]);
      }
      result = result.replace("$subcategoryTotal", subtotal); //ensures subtotal appears if there was only one subcategory in the tier

      return result;
    }

    /** @returns {string} an HTML string representing a Tier object.
     * @param {boolean} block - Whether or not the Thumbs should be formatted with
     * blockquote tags. If false, Thumbs are centered instead.
     * @param {boolean} subcat - Whether or not the Tier should include subcategory headers.
     * @param {TokoHPApp.Tier} tier - The Tier to generate HTML for.
     * @private
     * @memberof TokoHPApp.HTMLGenn */
    function buildTierStr(block, subcat, tier) {
      var result = template_tierHeader.replace("$tierName", tier.getName())
              .replace("$tierTotal", tier.getTotal());
      if (tier.hasOverflowFromPrevious()){
        result = result + "Carried over from previous section: " + tier.getOverflowFromPrevious() + " HP<br/>";
      }

      console.log("subcat " + subcat);

      if(subcat === true){
        return (result + buildTier_withHeaders(block, tier));
      }
      return (result + buildTier_noHeaders(block, tier));
    }

    /** @returns {string} an HTML string representing a full Toko object; ie, an entire HP Journal.
     * @param {TokoHPApp.Toko} toko - The Toko to generate HTML for.
     * @param {boolean} block - Whether or not this Toko's Thumbs should be
     * formatted with blockquote tags. If false, Thumbs are centered instead.
     * @param {boolean} subcat - Whether or not the Toko's Tiers should include subcategory headers.
     * @memberof TokoHPApp.HTMLGenn */
    function getHtml(toko, block, subcat) {
      var finalResult = "";
      finalResult = template_grandTotal.replace("$grandTotal", toko.getGrandTot());
      var i;

      for (i = 0; i < toko.getTiers().length; i += 1) {
        finalResult = finalResult + buildTierStr(block, subcat, toko.getTiers()[i]);
      }

      return finalResult;
    }

    //make necessary methods public
    return { getHtml: getHtml };
  }());


  /** A singleton class containing methods for common interactions with the webpage running the app.
   * @namespace
   * @memberof TokoHPApp */
  var DocUtils = (function(){

    /** Sends text to the output area of the page.
     * @param {string} str - What to output to the page.
     * @memberof TokoHPApp.DocUtils */
    function output(str){
      document.getElementById("output").innerHTML = str;
    }

    /** To be used when the app encounters an error. Resets the input elements
     * and puts an error message in the page's output area.
     * @param {string} str - The error message to output to the page.
     * @memberof TokoHPApp.DocUtils */
    function errorOccurred(str) {
      document.getElementById("form").reset();
      document.getElementById("genhtml").disabled = true;
      document.getElementById("names").innerHTML = "";
      output(str);
    }

    //make necessary methods public
    return { errorOccurred: errorOccurred, output: output };
  }());

  /** A singleton class containing methods which perform useful operations on arrays of Toko objects.
   * @namespace
   * @memberof TokoHPApp */
  var TokoUtils = (function(){

    /** A helper function for array sorting. Sorts Toko objects alphabetically by name.
     * @memberof TokoHPApp.TokoUtils */
    function sortByName(a, b){
      var nameA = a.getName().toUpperCase();
      var nameB = b.getName().toUpperCase();
      if(nameA < nameB) { return -1; }
      if(nameA > nameB) { return 1; }
      return 0;
    }

    /** Given an array of Toko objects sorted by name and a name, searches the
     * array for the Toko with that name using a binary search algorithm.
     * @returns {number} the array index of the specified Toko. If the Toko was not found, returns -1.
     * @param {TokoHPApp.Toko[]} arr - The array of Toko objects to search in.
     * @param {string} name - The name of the Toko to search for.
     * @memberof TokoHPApp.TokoUtils */
    function binarySearchByName(arr, name){
      var min = 0;
      var max = arr.length - 1;
      var idx;

      while (min <= max) {
        idx = Math.floor((max + min) / 2);
        if (arr[idx].getName() === name) { return idx; }
        else if (arr[idx].getName() < name) { min = idx + 1; }
        else { max = idx - 1; }
      }
      return -1;
    }

    //make necessary methods public
    return { sortByName: sortByName, binarySearchByName: binarySearchByName };
  }());


  /** A singleton class containing methods which assist in operations on input files.
  * @namespace
  * @memberof TokoHPApp */
  var FileUtils = (function() {

    /** @returns {boolean} whether or not the extension of the given file name matches the extension specified.
     * @param {string} path - The file path to check the extension of.
     * @param {string} ext - The extension the given file path should have.
     * @memberof TokoHPApp.FileUtils */
    function hasValidExt(path, ext){
      path = path.substring(path.lastIndexOf("."));
      return path === ext;
    }

    /** Given an array of strings with a specific format, creates Thumb and Toko objects to represent
     * those strings. The Thumbs are stored inside their related Tokos, and the Tokos go into an array.
     * If an error is encountered in the input, an error message is output to the document.<br/><br/>
     * The format of a valid string for this method is:<br/><br/>
     * <i>:thumb000000000:,some description of hp breakdown,0,subcategory name,toko name,toko name,toko name...</i><br/><br/>
     * That is, a valid string represents a Thumb and names its associated Tokos, and is comma-separated,
     * with each section in order being thumbcode, HP breakdown, HP total, subcategory, and then any amount of Tokota names.
     * <b>This method discards the first line of input, under the assumption that it is a row of headers.</b><br/>
     * @returns {?TokoHPApp.Toko[]} null if the input contained errors and could
     * not be fully read. Returns an array of Toko objects if the read was successful.
     * @param {string[]} linesArr - The array of strings containing the input to
     * be processed into Thumb and Toko objects.
     * @memberof TokoHPApp.FileUtils */
    function interpretInput(linesArr) {
      //regexs
      var numberRegex = /[\-]?[\d]?[.]?[\d]+/; //string can be parsed to a number
      var codeRegex = /[:]([thumb]+)?/g; //allows easy retrieval of necessary part of a thumbcode
      var validLnRegex = /[^,\s]/g; //string contains something readable
      var whitespaceRegex = /^[\s]+$/; // string is ONLY whitespace

      //variables
      var line;
      var thumb;
      var namesFound = "";
      var i;
      var j;
      var k;
      var tokos = [];

      A: for (i = 1; i < linesArr.length; i += 1) {
        line = linesArr[i].split(",");

        if (line.toString().length === 0  || validLnRegex.test(line.toString()) === false) {
          break A;
        }

        //handle errors
        if (line[2].length === 0 || numberRegex.test(line[2]) === false) {
          DocUtils.errorOccurred("HP value at line " + (i+1)
          + " is either empty or contains non-numerical\ncharacters. "
          + "Please fix the issue and try again.");
          return null;
        }
        if (line[0].length === 0 || whitespaceRegex.test(line[0]) === true) {
          DocUtils.errorOccurred("Line " + (i+1) + " contains no thumb code. "
          + "Please fix the issue and try again.");
          return null;
        }

        //create the Thumb object for this line
        thumb = new Thumb(line[0].replace(codeRegex, ""), line[1],
        parseFloat(line[2]), line[3]);

        //if there's a new name on this line, create a Toko object for it
        for (j = 4; j < line.length; j += 1) {
          if (line[j].length !== 0 && whitespaceRegex.test(line[j]) === false
          && namesFound.indexOf(line[j]) === -1) {
            tokos.push(new Toko(line[j]));
            namesFound = namesFound + "|||" + line[j];
          }
        }

        //give the new thumbnail to all the tokos associated with it
        for (j = 4; j < line.length; j += 1){
          var idx = TokoUtils.binarySearchByName(tokos, line[j]);
          if (idx != -1) { tokos[idx].addThumb(thumb); }
        }
      }// end of for loop 'A'

      tokos.sort(TokoUtils.sortByName);

      return tokos;
    }

    //make necessary methods public
    return { hasValidExt: hasValidExt, interpretInput: interpretInput };
  }());


  ///////////////////////////////////////////////////////////
  //////////////////// PUBLIC INTERFACE /////////////////////
  ///////////////////////////////////////////////////////////

  /** To be set as a file input element's onchange method. Determines if the
   * chosen file is of a valid type, and if so, reads its data into memory.
   * @memberof TokoHPApp
   * @static */
  function loadFile(filepicker) {
    var reader;
    var fileContents;
    var dropdown = document.getElementById("names");
    var i;
    var newOption;

    if (FileUtils.hasValidExt(filepicker.value, ".csv") === false) {
      DocUtils.errorOccurred("Invalid file type. Please choose a Comma Separated Document (.csv)");
      return;
    }

    reader = new FileReader();
    reader.onloadstart = function() {
      DocUtils.output("Loading File...");
      dropdown.innerHTML = "";
    };

    reader.onload = function(e) {
      fileContents = e.target.result.split("\n");
    };

    reader.onloadend = function() {
      appwide_tokos = FileUtils.interpretInput(fileContents);
      if (appwide_tokos !== null) {
        for (i = 0; i < appwide_tokos.length; i += 1) {
          newOption = document.createElement("OPTION");
          newOption.text = appwide_tokos[i].getName();
          dropdown.appendChild(newOption);
        }
        DocUtils.output("FILE LOADED");
        document.getElementById("genhtml").disabled = false;
      }
    };

    reader.readAsText(filepicker.files[0]);

  }


  /** To be set as the "gethtml" button element's onclick method. Generates and
   * outputs an HTML string representation of the chosen Toko.
   * @memberof TokoHPApp
   * @static */
  function generate() {

    var toko;
    var e = document.getElementById("names");
    var name = e.options[e.selectedIndex].value;
    var isSubmis = document.getElementById("submis").checked;
    var useSubcats = document.getElementById("subcat").checked;
    var useBlockQs = document.getElementById("block").checked;

    toko = appwide_tokos[TokoUtils.binarySearchByName(appwide_tokos, name)];
    toko.countTiers(isSubmis);
    DocUtils.output(HTMLGenn.getHtml(toko, useBlockQs, useSubcats));
  }


  //make necessary methods public
  return {
    loadFile: loadFile,
    generate: generate
  };

}()); //end of TokoHPApp
