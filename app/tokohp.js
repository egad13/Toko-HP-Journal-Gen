/**
 * @file Contains the Toko-HP-Journal-Gen app.<br/><br/> For detailed context
 * on what the code in this app does, see docs/PROJECT_SPECIFICATIONS.md.
 * @author Erica G (egad13)
 * @version 1.1.7
 */

// TODO figure out how to more safely parse the CSV input. quoted strings,
// line breaks inside of cells, etc, will break things.

/** A namespace which encapsulates all the code that is necessary for this app
 * to work, mostly to keep the global namespace clean.
 * @namespace
 * @global */
var TokoHPApp = (function(){
	"use strict";

	/** This array contains the list of Toko objects that will be used
	 * throughout the app.
	 * @static
	 * @private
	 * @type {TokoHPApp.Toko[]}
	 * @memberof TokoHPApp */
	var appwide_tokos = [];


	///////////////////////////////////////////////////////////
	/////////////////// DATA STORAGE OBJECTS //////////////////
	///////////////////////////////////////////////////////////

	/** The smallest unit of an HP Journal. Immutable.
	 * @class
	 * @param {string} url - The url of this Artwork. In the generated HTML,
	 * this is used to display the image.
	 * @param {string} descrip - A description of why this Artwork has the HP
	 * value it does.
	 * @param {number} hp - The HP value of this Artwork.
	 * @param {string} subcat - The subcategory of this Artwork. Empty if the
	 * user didn't indicate a value for this in their input.
	 * @memberof TokoHPApp */
	function Artwork(url, descrip, hp, subcat) {
		return {
			/** @returns {string} The url of this Artwork. *
			 * @instance
			 * @method 
			 * @memberOf TokoHPApp.Artwork */
			url: function() { return url; },
			
			/** @returns {string} The HP breakdown of this Artwork.
			 * @instance
			 * @method 
			 * @memberOf TokoHPApp.Artwork */
			description: function() { return descrip; },
			
			/** @returns {number} The HP value of this Artwork.
			 * @instance
			 * @method 
			 * @memberOf TokoHPApp.Artwork */
			hp: function() { return hp; },
			
			/** @returns {string} The HP value of this Artwork.
			 * @instance
			 * @method 
			 * @memberOf TokoHPApp.Artwork */
			subcategory: function() { return subcat; }
		};
	}

	/** A specialized list of Artworks. Each Tier has a maximum HP which its
	 * component Artworks can add up to - once this value is passed, no more
	 * Artworks can be added to the Tier. The amount by which a Tier surpasses
	 * its HP maximum is considered the Tier's overflow. A Tier should be
	 * initialized with the overflow from the previous Tier.
	 * @class
	 * @param {string} name - The display name of this Tier.
	 * @param {number} hp_max - The maximum HP value this Tier can hold.
	 * @param {number} overflow_from_prev - Optional. The amount of HP which
	 * overflowed from the previous Tier into this one.
	 * @memberof TokoHPApp */
	function Tier(name, hp_max, overflow_from_prev) {
		var artwork = [];
		var overflow_prev =
			(overflow_from_prev === undefined ? 0 : overflow_from_prev);
		var overflow = 0;
		var hp_total = overflow_prev;
		
		// A dictionary to keep track of HP totals for each known subcat of art.
		var hp_subtotal = {};
		
		return {
			/** @returns {string} The Tier's name.
			 * @instance
			 * @method 
			 * @memberOf TokoHPApp.Tier */
			name: function() { return name; },
			
			/** @returns {number} The Tier's HP total.
			 * @instance
			 * @method 
			 * @memberOf TokoHPApp.Tier */
			hp_total: function() { return hp_total; },
			
			/** @returns {number} The HP subtotals for each subcategory of
			 * Artwork in the Tier.
			 * @instance
			 * @method 
			 * @memberOf TokoHPApp.Tier */
			hp_subtotal: function() { return hp_subtotal; },
			
			/** @returns {string} The Tier's maximum HP value.
			 * @instance
			 * @method 
			 * @memberOf TokoHPApp.Tier */
			hp_max: function() { return hp_max; },
			
			/** @returns {TokoHPApp.Artwork[]} The list of Artworks included
			 * in this Tier.
			 * @instance
			 * @method 
			 * @memberOf TokoHPApp.Tier */
			artwork: function() { return artwork; },
			
			/** @returns {number} The amount by which this Tier has exceeded
			 * its maximum HP.
			 * @instance
			 * @method 
			 * @memberOf TokoHPApp.Tier */
			overflow: function() { return overflow; },
			
			/** The amount by which the previous Tier exceeded its maximum HP.
			 * This is considered part of this Tier's total HP.
			 * @returns {number} The amount by which the previous Tier exceeded
			 * its maximum HP.
			 * @instance
			 * @method 
			 * @memberOf TokoHPApp.Tier */
			overflow_from_prev: function() { return overflow_prev; },
			
			/** If this Tier isn't already full, adds an Artwork to this Tier.
			 * @param {TokoHPApp.Artwork} thumb - The Artwork to try to add.
			 * @returns {boolean} Whether or not the Artwork was added.
			 * @instance
			 * @method 
			 * @memberOf TokoHPApp.Tier */
			add_artwork: function(art){
				if (overflow === 0){
					// add the art, update the hp total
					artwork.push(art);
					hp_total += art.hp();
					
					// update subtotal, if necessary
					if (art.subcategory() !== "" && art.subcategory() !== undefined){
						if (hp_subtotal[art.subcategory()] === undefined){
							hp_subtotal[art.subcategory()] = art.hp();
						} else {
							hp_subtotal[art.subcategory()] += art.hp();
						}
					}
					
					// detect if this tier is overflowing or not
					if (hp_total >= hp_max){
						overflow = hp_total - hp_max;
					}
					return true;
				}
				return false;
			},
			
			/** Sorts this Tier's list of Artworks alphabetically by
			 * subcategory.
			 * @instance
			 * @method 
			 * @memberOf TokoHPApp.Tier */
			sort_by_subcat: function(){
				artwork.sort(function(a, b) {
					var subcatA = a.subcategory().toUpperCase();
					var subcatB = b.subcategory().toUpperCase();
					if(subcatA < subcatB){ return -1; }
					if(subcatA > subcatB){ return 1; }
					return 0;
				});
			}
		};

	}


	/** A representation of an HP journal; a Tokota name and associated artwork,
	 * which can be constructed into tiers.
	 * @class
	 * @param {string} name - The name of the Tokota represented by this object.
	 * @memberof TokoHPApp */
	function Toko(name) {

		/** The maximum HP value the "Submissive to Average" Tier can hold.
		 * @const {number}
		 * @private */
		const SUB_MAX = 75;
		
		/** The maximum HP value the "Submissive to Average" Tier can hold when the Leadership/Inheritance option is true.
		 * @const {number}
		 * @private */
		const SUB_MAX_LEADER = 50;

		/** The maximum HP value the "Average to Dominant" Tier can hold.
		 * @const {number}
		 * @private */
		const AVG_MAX = 250;
		
		/** The maximum HP value the "Average to Dominant" Tier can hold when the Leadership/Inheritance option is true.
		 * @const {number}
		 * @private */
		const AVG_MAX_LEADER = 200;

		/** The maximum HP value the "Dominant to Alpha" Tier can hold.
		 * @const {number}
		 * @private */
		const DOM_MAX = 300;
		
		/** The maximum HP value the "Dominant to Alpha" Tier can hold when the Leadership/Inheritance option is true.
		 * @const {number}
		 * @private */
		const DOM_MAX_LEADER = 250;

		/** The maximum HP value the "Extra Slot" Tiers can hold.
		 * @const {number}
		 * @private */
		const EXTRA_MAX = 100;

		var grand_total = 0;
		var artwork = [];
		var tiers = [];

		/** Creates a Tier with the specified name and HP maximum, and adds
		 * Artworks to it until it's full or we've run out of Artwork.
		 * @param {string} name - The name the new Tier will have.
		 * @param {number} max - The maximum HP this Tier will be able to hold.
		 * @param {number} idx - The starting index in the artwork list.
		 * @returns {number} The last visited idx in the artwork list.
		 * @private */
		function create_tier(name, max, idx) {
			var new_tier = new Tier(name, max, 
					(tiers.length === 0) ? 0 : tiers[tiers.length - 1].overflow());
			while (idx < artwork.length && new_tier.overflow() === 0) {
				new_tier.add_artwork(artwork[idx]);
				idx += 1;
			}
			new_tier.sort_by_subcat();
			tiers.push(new_tier);
			return idx;
		}

		// PUBLIC METHODS
		return {
			/** @returns {string} the name of this Toko.
			 * @instance
			 * @method 
			 * @memberOf TokoHPApp.Toko */
			name: function() { return name; },
			
			/** @returns {number} the combined HP value of all Artworks
			 * contained by this Toko.
			 * @instance
			 * @method 
			 * @memberOf TokoHPApp.Toko */
			grand_total: function() { return grand_total; },
			
			/** @returns {TokoHPApp.Tier[]} this Toko's list of Tiers.
			 * @instance
			 * @method 
			 * @memberOf TokoHPApp.Toko */
			tiers: function() { return tiers; },
			
			/** Adds a Artwork to this Toko's list, and add's the Artwork's
			 * value to the grand HP total.
			 * @param {TokoHPApp.Artwork} a - The Artwork to be added.
			 * @instance
			 * @method 
			 * @memberOf TokoHPApp.Toko */
			add_artwork: function (a) {
				artwork.push(a);
				grand_total += a.hp();
			},
			
			/** Removes any Tiers this Toko may have had, and creates and
			 * counts for as many Tiers as needed for this Toko's Hp Journal.
			 * This must be called before the HTML for this Toko is generated.
			 * @param {boolean} sub - Whether or not this Toko should include
			 * a "Submissive to Average" Tier.
			 * @param {boolean} leader - If true, this Toko's tier's hp limits
			 * should be the leadership/inheritance totals (50/200/250/100). If
			 * false, they should be the regular totals (75/250/300/100).
			 * @instance
			 * @method 
			 * @memberOf TokoHPApp.Toko */
			construct_tiers: function (sub, leader) {
				tiers = [];
				var idx = 0;
				var max;

				if (sub === true) {
					max = (leader === true ? SUB_MAX_LEADER : SUB_MAX);
					idx = create_tier("Submissive to Average", max, idx);
				}
				if (idx < artwork.length) {
					max = (leader === true ? AVG_MAX_LEADER : AVG_MAX);
					idx = create_tier("Average to Dominant", max, idx);
				}
				if (idx < artwork.length) {
					max = (leader === true ? DOM_MAX_LEADER : DOM_MAX);
					idx = create_tier("Dominant to Alpha", max, idx);
				}
				for (var i = 1; idx < artwork.length; i += 1) {
					idx = create_tier("Extra Slots "+i, EXTRA_MAX, idx);
				}
			}
		};
	}
	/////////// END OF TOKO


	/////////////////////////////////////////////////
	/////////////// SINGLETON CLASSES ///////////////
	/////////////////////////////////////////////////

	/** Generates HP journals from Toko objects.
	 * @namespace
	 * @memberof TokoHPApp */
	var HTMLGenn = (function () {
		
		/** @returns {boolean} Whether or not the given url leads to a piece of
		 * art on Deviantart.
		 * @param {string} url - The URL to test.
		 * @private
		 * @memberof TokoHPApp.HTMLGenn */
		function is_url_devart(url){
			return /^http[s]?:\/\/[^\s"]*(deviantart|sta\.sh|fav\.me)[^\s"]+$/i
				.test(url);
		}

		// PUBLIC METHODS
		return {
			/** Generates an HTML formatted HP journal for the given Toko, then
			 * passes it to the given callback function.
			 * @param {TokoHPApp.Toko} toko - The Toko to generate HTML for.
			 * @param {boolean} block - If true, Artworks are formatted with
			 * blockquotes. If false, Artworks are centered.
			 * @param {boolean} subcat - If true, subtotals for Artwork
			 * subcategories are included.
			 * @param {function(string):void} callback - A function which takes
			 * one string argument, to be called when the HTML has finished
			 * generating.
			 * @memberof TokoHPApp.HTMLGenn */
			gen_journal: function(toko, block, subcat, callback) {
				var tier;
				var art;
				var cur_subcat;
				var content;
				var oembedurl;
				var ajax_calls = [];
				var ajax_codes = [];
				var ajax_urls = [];
				var start = "<div align=\"center\" style=\"display:inline-block;vertical-align:top;max-width:300px;margin:10px\">";
				var end = "</div>";
				var result = `<div align ="center"><h3>Grand Total = ${toko.grand_total()} HP</h3></div><br/><br/>`;
			
				// optional blockquote formatting
				if (block === true){
					start = "<blockquote>";
					end = "</blockquote>";
				}
				
				// tier loop
				for (var i = 0; i < toko.tiers().length; i += 1) {
					tier = toko.tiers()[i];
					// tier header
					var result = `${result}<h2>${tier.name()} (Total = ${tier.hp_total()} HP)</h2><br/>`;
					if (tier.overflow_from_prev() > 0){
						result = `${result}Carried over from previous section: ${tier.overflow_from_prev()} HP<br/>`;
					}
					
					// artwork loop
					cur_subcat = "";
					for (var j = 0; j < tier.artwork().length; j += 1){
						art = tier.artwork()[j];
						// include subcategory headers, if that was requested.
						if (subcat === true && cur_subcat !== tier.artwork()[j].subcategory()){
							cur_subcat = tier.artwork()[j].subcategory();
							result = `${result}<h3>${cur_subcat} | Total = ${tier.hp_subtotal()[cur_subcat]} HP</h3>`;
						}
						
						// deviantart embeds
						if (is_url_devart(art.url()) === true){
							content = `t${i}_a${j}`;
							oembedurl = 
							"https://backend.deviantart.com/oembed?format=jsonp&callback=?&url="
								+encodeURIComponent(art.url());
							ajax_urls.push(art.url());
							ajax_codes.push(content);
							ajax_calls.push(
								$.ajax({
									dataType: "json",
									type: "GET",
									url: oembedurl
								})
							);
						}
						// bonuses with no visuals - just a simple link
						else {
							content = art.url();
						}
						result = `${result}${start}<a href="${art.url()}">${content}</a><br/><b>Total = ${art.hp()} HP</b><br/>${art.description()}${end}`;
					} // end of artwork loop
				} // end of tier loop
				
				// when all api calls are done, add the proper embeds to the html, then call back
				$.when.apply($, ajax_calls).done( function(){
					var json;
					for (var k = 0; k < ajax_calls.length; k += 1){
						json = ajax_calls[k].responseJSON;
						if (json.type === "photo"){
							result = result.replace(ajax_codes[k], `<img style="width:auto" src="${json.thumbnail_url}" />`);
						} else if (json.type === "rich"){
							result = result.replace(ajax_codes[k], `<div style="display:inline-block;width:250px;border:1px solid black;padding:5px"><p><b>${json.title}</b></p><p>${json.html.substring(0,150)}...</p></div>`);
						// if the API tossed us an error, make a text link
						// instead of an embed, and inform the user at the top
						// of the output that something has gone wrong.
						} else if (json.error !== undefined && json.error !== null) {
							console.log(json);
							result = result.replace(ajax_codes[k], ajax_urls[k]);
							result = `An error occurred when trying to get the deviation with url ${ajax_urls[k]}&#10;Error: ${json.error}. Message: ${json.message}.&#10;&#10;${result}`;
						}
					}
					callback(result);
				});
			}
		};
	}());

	/** A singleton containing methods which perform useful operations on
	 * arrays of Toko objects.
	 * @namespace
	 * @memberof TokoHPApp */
	var TokoUtils = (function(){
		// PUBLIC METHODS
		return {
			/** A helper function for array sorting. Sorts Toko objects
			 * alphabetically by name. CASE SENSITIVE.
			 * @memberof TokoHPApp.TokoUtils */
			sort_by_name: function(a, b){
				var nameA = a.name();
				var nameB = b.name();
				if(nameA < nameB) { return -1; }
				if(nameA > nameB) { return 1; }
				return 0;
			},
			
			/** Given an array of sorted Tokos and a name, searches for
			 * the Toko with that name. CASE SENSITIVE.
			 * @returns {number} the array index of the specified Toko. If the
			 * Toko was not found, returns -1.
			 * @param {TokoHPApp.Toko[]} arr - The array of Tokos to search.
			 * @param {string} name - The name of the Toko to search for.
			 * @memberof TokoHPApp.TokoUtils */
			binary_search_by_name: function(arr, name){
				var min = 0;
				var max = arr.length - 1;
				var idx;
				
				while (min <= max) {
					idx = Math.floor((max + min) / 2);
					if (arr[idx].name() === name) {
						return idx;
					} else if (arr[idx].name() < name) {
						min = idx + 1;
					} else {
						max = idx - 1;
					}
				}
				return -1;
			}
		};
	}());

	/** A singleton containing methods which assist in operating on input and
	 * outputting to the web page.
	 * @namespace
	 * @memberof TokoHPApp */
	var InOutUtils = (function() {
		// PUBLIC METHODS
		return {
			/** Sends text to the output area of the page.
			 * @param {string} str - What to output to the page.
			 * @memberof TokoHPApp.InOutUtils */
			output: function(str){
				document.getElementById("output").innerHTML = str;
			},
			
			/** To be used when the app encounters an error. Resets the input elements
			 * and puts an error message in the page's output area.
			 * @param {string} str - The error message to output to the page.
			 * @memberof TokoHPApp.InOutUtils */
			fatal_error: function(str) {
				document.getElementById("form").reset();
				document.getElementById("genhtml").disabled = true;
				document.getElementById("names").innerHTML = "";
				appwide_tokos = [];
				InOutUtils.output("I have terrible news. " + str);
			},
			
			/** @returns {boolean} True if the extension of the given file path
			 * matches the given target extension.
			 * @param {string} path - The file path to check the extension of.
			 * @param {string} ext - The correct extension.
			 * @memberof TokoHPApp.InOutUtils */
			has_valid_ext: function(path, ext){
				path = path.substring(path.lastIndexOf("."));
				return path === ext;
			},
			
			/** Given an array of strings representing Artwork, constructs
			 * Artwork and Toko object representations of the data. See
			 * docs/PROJECT_SPECIFICATIONS.md for details of the expected
			 * format. The first line of input is assumed to be headers and
			 * is discarded.
			 * @returns {?TokoHPApp.Toko[]} An array of completed Tokos, or
			 * null if the input contained errors.
			 * @param {string[]} lines_arr - An array of Artwork strings.
			 * @memberof TokoHPApp.InOutUtils */
			// TODO modify for the new URL data
			interpret_input: function(lines_arr) {
				
				//regexs
				var number_regex = /^[\-]?[\d]*[.]?[\d]+$/; //string can be parsed to a number
				var whitespace_regex = /^[\s]+$/; // string is ONLY whitespace

				//variables
				var line;
				var art;
				var idx;
				var tokos = [];

				A: for (var i = 1; i < lines_arr.length; i += 1) {
					if (lines_arr[i].length !== 0) {

						line = lines_arr[i].split(",");
						
						//handle errors
						if (line[2].length === 0 || number_regex.test(line[2]) === false) {
							InOutUtils.fatal_error("HP value at line " + (i+1)
							+ " is either empty or contains non-numerical\ncharacters. "
							+ "Please fix the issue and try again.");
							return null;
						}

						//create the Artwork object for this line
						art = new Artwork(line[0], line[1], parseFloat(line[2]), line[3]);

						//if there's a new name on this line, create a Toko object for it
						for (var j = 4; j < line.length; j += 1) {
							
							line[j] = line[j].trim();
							if (line[j].length !== 0 && whitespace_regex.test(line[j]) === false){
								idx = TokoUtils.binary_search_by_name(tokos, line[j]);
								if (idx === -1){
									tokos.push(new Toko(line[j]));
									tokos.sort(TokoUtils.sort_by_name);
								}
							}
							
						}

						//give the new thumbnail to all the tokos associated with it
						for (var j = 4; j < line.length; j += 1){
							if (line[j].length !== 0 && whitespace_regex.test(line[j]) === false){
								idx = TokoUtils.binary_search_by_name(tokos, line[j]);
								if (idx !== -1) { tokos[idx].add_artwork(art); }
							}
						}
					
					}
				}// end of for loop 'A'

				return tokos;
			}
		};
	}());


	///////////////////////////////////////////////////////////
	//////////////////// PUBLIC INTERFACE /////////////////////
	///////////////////////////////////////////////////////////

	return {
		/** To be set as a file input element's onchange method. Determines if the
		 * chosen file is of a valid type, and if so, reads its data into memory.
		 * @memberof TokoHPApp
		 * @static */
		load_file: function(filepicker) {
			var reader;
			var file_contents;
			var dropdown = document.getElementById("names");
			var new_option;

			if (InOutUtils.has_valid_ext(filepicker.value, ".csv") === false) {
				InOutUtils.fatal_error("Invalid file type. Please choose a Comma Separated Document (.csv)");
				return;
			}

			reader = new FileReader();
			reader.onerror = function(evt) {
				console.log(evt);
				InOutUtils.fatal_error(reader.error);
				reader.abort();
			};
			reader.onloadstart = function() {
				InOutUtils.output("Loading File...");
				dropdown.innerHTML = "";
			};
			reader.onload = function(e) {
				file_contents = e.target.result.trim().split(/\r?\n/);
			};
			reader.onloadend = function() {
				appwide_tokos = InOutUtils.interpret_input(file_contents);
				if (appwide_tokos !== null) {
					for (var i = 0; i < appwide_tokos.length; i += 1) {
						new_option = document.createElement("OPTION");
						new_option.text = appwide_tokos[i].name();
						dropdown.appendChild(new_option);
					}
					InOutUtils.output("FILE LOADED");
					document.getElementById("genhtml").disabled = false;
				}
			};

			reader.readAsText(filepicker.files[0]);
		},
		
		/** To be set as the "gethtml" button element's onclick method. Generates and
		 * outputs an HTML string representation of the chosen Toko.
		 * @memberof TokoHPApp
		 * @static */
		generate: function() {
			var toko;
			var e = document.getElementById("names");
			var name = e.options[e.selectedIndex].value;
			var is_submis = document.getElementById("submis").checked;
			var use_subcats = document.getElementById("subcat").checked;
			var use_blocks = document.getElementById("block").checked;
			var is_leader = document.getElementById("leadership").checked;
			
			try {
				InOutUtils.output("Generating HTML, please hold...");
				toko = appwide_tokos[TokoUtils.binary_search_by_name(appwide_tokos, name)];
				toko.construct_tiers(is_submis, is_leader);
				
				HTMLGenn.gen_journal(toko, use_blocks, use_subcats, function(html){
					InOutUtils.output(html);
				});
			} catch (err) {
				console.error(err);
				InOutUtils.fatal_error(err.message);
			}
		}
	};

}()); //end of TokoHPApp
