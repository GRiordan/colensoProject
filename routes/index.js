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
        client.execute(/*teiSchema +
            "for $n in (collection('Colenso'))\n" +
            "for $m in $n \n" +
            "where matches($m, '"+searchParameter+"') = true()\n" +
            "return db:path($n)"*/
            teiSchema + "for $v in .//TEI[. contains text "+searchParameter+"] return db:path($v)",
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
            });/*
        res.render('search', {
            title: 'Colenso Project',
            searchResult: "'this is where a text search will be stored'",
            search: searchParameter,
            searchType: searchType
        });*/
    }
    ////name[@type = 'place' and position() = 1 and . = '"+searchParameter+"']
    //res.render('search', {title: "Colenso Project", content: req.query.searchString});
});

router.get('/viewDoc', function(req, res){
    var docPath = req.query.doc;
    docPath = docPath.substring(1);
    client.execute("XQUERY doc('"+docPath+"')",
        function(error, result){
            if(error){console.error(error);}
            else {
                res.render('viewDoc', {path: docPath, title: 'Colenso Project', doc: result.result});
            }
        });
//"XQUERY declare namespace tei='http://www.tei-c.org/ns/1.0'; " +
//  "(doc('"+docPath+"')//tei:p)[1]"
    //res.render('search', {title: "Colenso Project", content: req.query.searchString});
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
        client.execute(teiSchema+
            "let $path := '"+ pathToFile +"'" +
            "let $addToo := '"+ pathToAdd + "'" +
            "return db:add('Colenso', $path, $addToo)",
            function(error, result){
                if(error) {
                    console.error(error);
                    res.render('addDoc', {title:'Colenso Project', addDoc: false, pathOfFile: pathToFile, error: true})
                }
                else if(pathToFile === ""){
                    res.render('addDoc', {title:'Colenso Project', addDoc: false, pathOfFile: pathToFile, error: false})
                }
                else{
                    res.render('addDoc', {title:'Colenso Project', addDoc: true,  pathOfFile: pathToFile, error: false})
                }
            });
    }


});

module.exports = router;
