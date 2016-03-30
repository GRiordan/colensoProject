var express = require('express');
var router = express.Router();
var basex = require('basex');
var client = new basex.Session("127.0.0.1", 1984, "admin", "admin");
client.execute("OPEN Colenso");


/* GET home page. */
router.get("/", function(req, res) {
    res.render('index', {title: 'Colenso Letter Database', place: 'temp'});
});


router.get("/list", function(req, res) {
    var path = 'Colenso';
    var filePath =req.query.place;
    if(filePath === undefined){
        path = "Colenso";
    }
    else {
        path = filePath.substring(1, (filePath.length-1));
    }
    var path2 = path;
    // path = 'Colenso/Broughton'
    client.execute("XQUERY file:list('"+path+"')",
        function(error, result) {
            if(error){
                client.execute("XQUERY db:list('Colenso', '"+path+"')",
                    function(error, result){
                        if(error){console.log(error)}
                        else{
                            res.render('list', {title: 'File Explorer', place: list, path: path2});
                        }
                    });
            }
            else {
                var list = result.result;
                list = list.split("\n");
                res.render('list', {title: 'File Explorer', place: list, path: path2});
            }
        });
});

router.get('/search', function(req, res){
    var searchParameter = req.query.searchString;
    var searchType = req.query.gridRadios;
    var teiSchema = "XQUERY declare default element namespace 'http://www.tei-c.org/ns/1.0';";
    if(searchType === "option2") {
        client.execute(teiSchema +
            "for $n in (collection('Colenso/')"+searchParameter+") return db:path($n)",
            function (error, result) {
                if (error) {
                    console.error(error);
                }
                else {
                    res.render('search', {
                        title: 'Colenso Project',
                        searchResult: result.result,
                        search: searchParameter,
                        searchType: searchType
                    });
                }
            });
    }
    else if(searchType === "option1"){
        var search = createSearch(searchParameter);
        console.log(search);
        client.execute(teiSchema + "for $v in .//TEI[. contains text "+search+"] return db:path($v)",
            function (error, result) {
                if (error) {
                    console.error(error);
                }
                else {
                    res.render('search', {
                        title: 'Colenso Project',
                        searchResult: result.result,
                        search: searchParameter,
                        searchType: searchType
                    });
                }
            });
    }
});

router.get('/viewDoc', function(req, res){
    var searchType = req.query.type;
    var searchString = req.query.search;
    var docPath = req.query.doc;
    var saving = req.query.saveAt;
    docPath = docPath.substring(1);
    var teiSchema = "XQUERY declare default element namespace 'http://www.tei-c.org/ns/1.0'; ";
    client.execute("XQUERY doc('"+docPath+"')",
        function(error, result){
            if(error){console.error(error);}
            else {
                if(saving === "" || saving === undefined){res.render('viewDoc', {path: docPath, title: 'Colenso Project', doc: result.result, type: searchType, search: searchString});}
                else {
                    //var path = saving.replace(/\\/g, "\\\\");
                    client.execute("XQUERY " +
                        "let $path := '"+saving+"'\n"+
                        "for $item in (collection('"+docPath+"'))\n"+
                        "return (" +
                        "file:create-dir(file:parent($path))," +
                        "file:write($path, $item))",
                        function (err, result1) {
                            if(err){
                                console.error(err);
                                res.render('viewDoc', {path: docPath, title: 'Colenso Project', doc: result.result, savedTo: saving, noDir: true, type: searchType, search: searchString});
                            }
                            else {
                                res.render('viewDoc', {
                                    path: docPath,
                                    title: 'Colenso Project',
                                    doc: result.result,
                                    savedTo: saving,
                                    type: searchType,
                                    search: searchString
                                });
                            }
                        })
                }
            }
        });
});

router.get("/addDoc", function(req, res) {
    var pathToFile = req.query.path;
    var pathToAdd = req.query.addToo;
    if(pathToAdd === '') {pathToAdd = "Colenso/"}
    var teiSchema = "XQUERY declare default element namespace 'http://www.tei-c.org/ns/1.0';";

    //initial page
    if(pathToFile === undefined){
        res.render('addDoc', {title: 'Colenso Project', addDoc: false, currentPage: "1"})
    }
    //page after users submits a file path
    else{
        console.log(pathToAdd);
        console.log(pathToFile);
        client.execute("XQUERY\n" +
            "let $path := '"+ pathToFile +"'\n" +
            "let $addToo := '"+ pathToAdd + "'\n" +
            "return (db:add('Colenso', $path, $addToo))",
            //"ADD TO "+pathToAdd+" "+pathToFile,
            function(error, result){
                if(error) {
                    console.error(error);
                    res.render('addDoc', {title:'Colenso Project', addDoc: false, pathOfFile: pathToFile, error: true})
                }
                else if(pathToFile === ""){
                    res.render('addDoc', {title:'Colenso Project', addDoc: false, pathOfFile: pathToFile, error: false})
                }
                else{
                    res.render('addDoc', {title:'Colenso Project', addDoc: true,  pathOfFile: pathToFile, addedTo: pathToAdd, error: false})
                }
            });
    }
});

//Helper functions

var createSearch = function(str){
    // pass in a str ie Dear mr so && how are you today
    // return string 'Dear mr so'ftand'how are you today'
    var toReturn = "'";

    var list = str.split(" ");

    for (var i = 0; i < list.length; i++) {
        if(list[i] === '&&' || list[i] === 'AND'){
            toReturn += "'ftand'";
        }
        else if(list[i] === '||' || list[i] === 'OR'){
            toReturn += "'ftor'";
        }
        else if(list[i] === '!=' || list[i] === 'NOT'){
            toReturn += "'ftnot'";
        }
        else {
            if(i == list.length - 1
                || (list[i+1] === '&&'
                || list[i+1] === 'AND'
                || list[i+1] === '||'
                || list[i+1] === 'OR'
                || list[i+1] === '!='
                || list[i+1] === 'NOT')){
                toReturn += list[i];
            }
            else {toReturn += list[i]+" ";}

        }
    }

    toReturn += "'";
    return toReturn;
}


module.exports = router;
