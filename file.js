var fs = require("fs");
var jsdiff = require('./jsdiff');
// var fileName = "C:/Users/kong/Downloads/au";
// var fileName = "C:/Users/kong/Downloads/au/ces-test.xml";

var File = function(folderPath){

	if(!folderPath || folderPath == "" || folderPath == null || typeof folderPath === "undefined"){
		throw new Error('Invalid format of folderPath');
	}

	this.folderPath = folderPath;
}

var searchReplace = function(keyword, replaceWith, fileName, done){
	fs.exists(fileName, function(exists) {
	  if (exists) {
	    fs.stat(fileName, function(error, stats) {
	      if(error) return done(error)
	      fs.open(fileName, "r", function(error, fd) {
	      	if(error) return done(error);
	      	if(stats.size === 0) return done();

	        var buffer = new Buffer(stats.size);

	        fs.read(fd, buffer, 0, buffer.length, null, function(error, bytesRead, buffer) {
	          if(error) return done(error)
	          var data = buffer.toString("utf8", 0, buffer.length);
	 		  // search and replace goes here	
	 		  data = replaceAll(keyword, replaceWith, data);

	 		  // write back to file
	 		  fs.writeFile(fileName, data, 'utf8', function (error) {
			     if (error) return done(error);
			  });
	          																																																																
	          fs.close(fd);
	          done();
	        });
	      });
	    });
	  }
	});
}


var walk = function(dir, done) {
  var results = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);
    var pending = list.length;
    if (!pending) return done(null, results);

    list.forEach(function(file) {
      file = dir + '/' + file;
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function(err, res) {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          results.push(file);
          if (!--pending) done(null, results);
        }
      });
    });
  });
};

var replaceAll = function(find, replace, str) {
  return str.replace(new RegExp(find, 'g'), replace);
}

var gerFileContent = function(fileName, done){
	fs.exists(fileName, function(exists) {
		fs.stat(fileName, function(error, stats) {
	      if(error) return done(error)
	      fs.open(fileName, "r", function(error, fd) {
	      	if(error) return done(error);
	      	if(stats.size === 0) return done("file content empty");

	        var buffer = new Buffer(stats.size);

	        fs.read(fd, buffer, 0, buffer.length, null, function(error, bytesRead, buffer) {
	          if(error) return done(error)
	          var data = buffer.toString("utf8", 0, buffer.length);
	          done(null, data);
	        });
	      });
	    });
	});
}

function serializeFunctionsInArray(funcArr, paramArr, cb){

	var resultCount = 0;
	var resultArr = new Array;

	for(var i=0; i < funcArr.length; i++){
		wrapping_function(i, cb);	
	}

	function wrapping_function(i, cb){
		funcArr[i](paramArr[i], function(err, results){
			
			resultCount++;

			resultArr[i] = results;
			if(resultCount == funcArr.length){
				cb(resultArr);
			}
		});
	}

}

File.prototype.searchReplaceContentInDir = function(find, replace){

	if(!find || find == null || typeof find === "undefined" || !replace || replace == null || typeof replace === "undefined"){
		throw new Error('Invalid format of search and replace string');
	}

	walk(this.folderPath, function(err, results){

		results.forEach(function(el){
			searchReplace(find, replace, String(el), function(error){
				if(error){
					console.log("searchReplace couldn't operate on file : "+ el);
				}
			});
		});
	});
}

File.prototype.getFilesArr = function(folderPath, cb){
	// console.log(this.folderPath);
	walk(folderPath, function(err, results){
		cb(err, results);
	});
}

File.diff = function(fileObjectBefore, fileObjectAfter, cb){

	var functions = [fileObjectBefore.getFilesArr, fileObjectAfter.getFilesArr];
	var functionparams = [fileObjectBefore.folderPath, fileObjectAfter.folderPath];
	var modifiedfileNames = [];
	var fileContentCompareFuncArr = [];
	var modifiedFileName = [];

	serializeFunctionsInArray(functions, functionparams, function(resultArr){

		//match file name 
		var fileName1 = "";
		var fileName2 = "";


		for(var i=0; i < resultArr[0].length; i++){
			fileName1 = replaceAll(fileObjectBefore.folderPath, "", resultArr[0][i]);

			for(var j=0; j < resultArr[1].length; j++){
				fileName2 = replaceAll(fileObjectAfter.folderPath, "", resultArr[1][j]);
				if(fileName1 == fileName2){
					// comparedFileIndexArr.push();

					var tempCompareFunc = wrapping_comparison_function(fileObjectBefore.folderPath, fileName1, fileObjectAfter.folderPath, fileName2, fileObjectAfter);
					fileContentCompareFuncArr.push(tempCompareFunc);
					break;

				}
				else{
					if(j == resultArr[1].length-1){
						// console.log("deleted "+fileObjectBefore.folderPath+fileName1);
						//last element on j loop to match, the element in i loop is deleted
						modifiedfileNames.push({action:"deleted", filePath:fileObjectBefore.folderPath+fileName1});
						break;
					}
				}
			}

		}


		// serializeFunctionsInArray(fileContentCompareFuncArr, [], function(resultArr){
		// 	resultArr.forEach(function(item){
		// 		if(item.action != "remained")
		// 			modifiedfileNames.push(item);
		// 	});
		// 	cb(modifiedfileNames);
		// 	modifiedfileNames = [];
		// });




		// fileContentCompareFuncArr = [];
		for(var i=0; i < resultArr[1].length; i++){
			fileName1 = replaceAll(fileObjectAfter.folderPath, "", resultArr[1][i]);

			for(var j=0; j < resultArr[0].length; j++){
				fileName2 = replaceAll(fileObjectBefore.folderPath, "", resultArr[0][j]);

				// comparing file name
				if(fileName1 == fileName2){
					var tempCompareFunc = wrapping_comparison_function(fileObjectAfter.folderPath, fileName1, fileObjectBefore.folderPath, fileName2, fileObjectAfter);
					fileContentCompareFuncArr.push(tempCompareFunc);
					break;

				}
				else{
					if(j == resultArr[0].length-1){
						// console.log("added "+fileObjectAfter.folderPath+fileName1);
						//last element on j loop to match, the element in i loop is deleted
						modifiedfileNames.push({action:"added", filePath:fileObjectAfter.folderPath+fileName1});
						break;
					}
				}
			}

		}


		serializeFunctionsInArray(fileContentCompareFuncArr, [], function(resultArr){

			resultArr.forEach(function(item){
			// console.log(item.action);
				if(item.action != "remained" && item.action != "repeated_change")
					modifiedfileNames.push(item);
			});
			cb(modifiedfileNames);
		});

	});

	function wrapping_comparison_function(filePath1, fileName1, filePath2, fileName2, fileObjectAfter){

		var tempCompareFunc = function(dummyParam, cb){
			serializeFunctionsInArray([gerFileContent, gerFileContent], [filePath1+fileName1, filePath2+fileName2], function(resultArr){
				//comparing file contents
				var results = jsdiff(resultArr[0], resultArr[1]);
				// if(fileName1 == "C:/Users/kong/Downloads/au_before/t430u.xml" && fileName2 == "C:/Users/kong/Downloads/au/t430u.xml"){		
				// 	console.log(results.o);
				// 	// console.log(results.n);
				// }

				// to avoid repeat log of the the same modified file
				if(in_array(fileName1, modifiedFileName) || in_array(fileName2, modifiedFileName)){
				// if(modifiedFileName.indexOf(fileName1) >= 0 || modifiedFileName.indexOf(fileName2) >= 0){
					return cb(null, {action:"repeated_change", filePath:fileObjectAfter.folderPath+fileName2});
				}

				if(!(results.o.length == results.n.length)){
					// modifiedfileNames.push({action:"modified", filePath:fileObjectAfter.folderPath+fileName2});
					// console.log("modified "+fileObjectAfter.folderPath+fileName2);
					modifiedFileName.push(fileName2);
					cb(null, {action:"modified", filePath:fileObjectAfter.folderPath+fileName2});
				}
				else{

					var isDiff = false;

					if (results.n.length == 0) {
						isDiff = true;
					} else {
						if (results.n[0].text == null) {
							isDiff = true;
						}

						for ( var i = 0; i < results.n.length; i++ ) {
						  if (results.n[i].text == null) {
						    isDiff = true;
						    break;
						  } else {

						    for (n = results.n[i].row + 1; n < results.o.length && results.o[n].text == null; n++ ) {
						      isDiff = true;
						      break;
						    }
						  }
						}
					}
  

  					if(isDiff){
  						// modifiedfileNames.push({action:"modified", filePath:fileObjectAfter.folderPath+fileName2});
						// console.log("modified "+fileObjectAfter.folderPath+fileName2);
						modifiedFileName.push(fileName2);
						cb(null, {action:"modified", filePath:fileObjectAfter.folderPath+fileName2});
  					}
  					else{
  						
						// console.log("remained "+fileName2);
						cb("file content same", {action:"remained", filePath:filePath1+fileName2});
  					}
  						
				}

			});
		}
		return tempCompareFunc;
	}

	function in_array (needle, haystack, argStrict) {
		// http://kevin.vanzonneveld.net
		// +   original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
		// +   improved by: vlado houba
		// +   input by: Billy
		// +   bugfixed by: Brett Zamir (http://brett-zamir.me)
		// *     example 1: in_array('van', ['Kevin', 'van', 'Zonneveld']);
		// *     returns 1: true
		// *     example 2: in_array('vlado', {0: 'Kevin', vlado: 'van', 1: 'Zonneveld'});
		// *     returns 2: false
		// *     example 3: in_array(1, ['1', '2', '3']);
		// *     returns 3: true
		// *     example 3: in_array(1, ['1', '2', '3'], false);
		// *     returns 3: true
		// *     example 4: in_array(1, ['1', '2', '3'], true);
		// *     returns 4: false
		var key = '',
		strict = !! argStrict;

		if (strict) {
			for (key in haystack) {
				if (haystack[key] === needle) {
					return true;
				}
			}
		} else {
			for (key in haystack) {
				if (haystack[key] == needle) {
					return true;
				}
			}
		}

		return false;
	}

}


module.exports = File
