/*

  From: http://dobiatowski.blogspot.com/
  License: MIT

  Requires jQuery to work

  Example usage:

  var myEllipsis = new FastEllipsis("font-family: arial; font-size: 10pt; letter-spacing: 0;");
  var longText = "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum";
  var ellipsed = myEllipsis.ellipseIt(
    longText, // string to ellipsis
    2,        // maxline number 
    200       // width of container
  );
  $("#containter").html(ellipsed);


  TODO:
    - support entities
    - solve unicode chars widths in better way
    - if even first word dont fits - cut the word
    - add local storage for cache if avail
*/


function FastEllipsis(cssStyle) {
  var _charWidthArray = {},
      _cssStyle = (!!cssStyle) ? cssStyle : "font-family: arial; font-size: 12pt",
      _maxWidth = 0,
      
      testDrive = 0;
			
  // Generate cache for width of all ASCII chars 
  var generateASCIIwidth = function() {
    var container, charWrapper, obj, character,
        totalWidth = 0, oldTotalWidth = 0, charWidth = 0;
				
    // Temporary container for generated ASCII chars
    container = $("<div style='width:6000px; visibility:hidden;'></div>").appendTo("body");
		charWrapper = $("<span style='"+_cssStyle+"'></span>").appendTo(container);
    
    // DUMMY chars
    charWrapper.append("f");
    testDrive = $("<span>i</span>");
    testDrive.appendTo(charWrapper);
    totalWidth = charWrapper.width();
    
    // Space char
    testDrive.before("&nbsp;");
    oldTotalWidth = totalWidth;
    totalWidth = charWrapper.width();
    charWidth = (totalWidth - oldTotalWidth)+0.4; // hack: add 0.4px to every space 
    _charWidthArray["_ "] = charWidth;
            
    // Other ASCII chars
    for( var i = 33; i <= 126; i++ ) {
      character = String.fromCharCode( i );
      testDrive.before(""+character+character);
      
      oldTotalWidth = totalWidth;
      totalWidth = charWrapper.width();
      charWidth = (totalWidth - oldTotalWidth)/2; // While cache is generating add two the same chars at once, and then divide per 2 to get better kerning accuracy.
      _charWidthArray["_"+character] = charWidth;
        
      // Finds max width for char - it will be given for every undefined char like: Ą or Ć
      if (_maxWidth < _charWidthArray["_"+character]) {
        _maxWidth = _charWidthArray["_"+character];
      }
    }
				
    // Remove temporary container   
    container.remove();
  },
  
  // Get the width of specified char
  getCharWidth = function (myChar) {
        
    // If there is a char in cache
    if (!!_charWidthArray["_"+myChar]) {
      return _charWidthArray["_"+myChar];
    }
        
    // If there is no char in cache set max width and save in cache
    else {
      _charWidthArray["_"+myChar] = _maxWidth;
      return _maxWidth;
    }
        
  },
			
  // Get the width of the word
  getWordWidth = function(myWord) {
    
    myWord = myWord.trim();
    
    // Check if this word is already cached
    if (!!_charWidthArray["_"+myWord]) {
      return _charWidthArray["_"+myWord];
    }
        
    // If no, calculate it
    else {
      var sum = 0;
      for (var i = 0, len = myWord.length; i < len; i++) {
        sum = sum + getCharWidth(myWord[i]);
      }
	  sum = Math.floor(sum);
      _charWidthArray["_"+myWord] = sum;
      return sum;
    }
        
  },
      
  // Ellipse text based on CSS styling set in constructor.
  ellipseIt = function(myString, maxLine, lineWidth) {
    var lineNo = 1,
        wordsInLineWidth = 0,
        wordArr = myString.trim().strip_tags().replace("-", "- ").split(/\s+/g), // trim string, remove HTML tags, remove space duplicates, detect dash word breaking
        spaceWidth = getCharWidth(" "),
        threeDotsWidth = getWordWidth("...");

    for (var i = 0, len = wordArr.length; i < len; i++) {

      // Adding widths of words in the loop
      wordsInLineWidth += getWordWidth(wordArr[i]);

      // Check if the total width of words calculated so far is larger than width of container passed in the parameter
      if (wordsInLineWidth > lineWidth) {

        // If yes, go to next line and reset the words width
        lineNo++;
        wordsInLineWidth = 0;
                
        // If accessing to the last line subtract width of ellipsis (...) from line width to reserve place for ellipsis
        if (lineNo == maxLine) {
          lineWidth -= threeDotsWidth;
        }

        // When you reached the end of maxLine parameter break the loop and return the result
        else if (lineNo > maxLine) {
          return wordArr.slice(0, i).join(" ").replace("- ", "-") + "..."; // replace to reverse dash word breaking
        }

        // If the words width was bigger than line width go back in the loop to take last word for use in the beggining of next line
        i--;
      }
      else {
        // Adding width of space between words
        wordsInLineWidth += spaceWidth;
      }
    }

    // If there was no need to ellipsis
    return myString;
        
  };
  
  generateASCIIwidth();
  
  // Public interface
  return {
    getCharWidth: getCharWidth,
    getWordWidth: getWordWidth,
    ellipseIt: ellipseIt
  }
};

// Add string functions to String prototype

if (typeof String.prototype.trim !== "function") {
  String.prototype.trim = function () {
      return this.replace(/^\s*/, "").replace(/\s*$/, "");
  };
};

if (typeof String.prototype.strip_tags !== "function") {
  String.prototype.strip_tags = function() {
    return this.replace(/<\/?[^>]+(>|$)/g, "");
  };
};