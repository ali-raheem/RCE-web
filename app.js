var http = require('http');
var url = require('url');
var jade = require('jade');
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const dbUrl = 'mongodb://localhost:27017';

const dbName = 'exchange_bot';

var traders = [];

var prices = {};

function getPrices() {
    console.log('getPrices()');
    prices = [];
    const pricesDb = db.collection('prices');
    pricesDb.find({}).toArray((err, result) => {
	var i;
	for(i = 0; i < result.length; i++) {
	    if(result[i].pair.split('_')[0] != 'BTC')
		continue;
	    var curr = result[i].pair.split('_')[1];
	    prices[curr] = result[i].last;
	}
    });
}
function getValue(t) {
    console.log('getValue()');
    var v = 0;
    var i;
    for(var curr in t.assets) {
	v += prices[curr] * t.assets[curr];
    }
    return v;
}

function calcValues() {
    console.log('calcValues()');
    var i;
    for(i = 0; i < traders.length; i++) {
	var value = getValue(traders[i]);
	traders[i].value = value;
	console.log(value);
    }
}


function getTraders() {
    console.log('getTraders()');
    const users = db.collection('traders_db');
    users.find({}).toArray((err, result) => {
	traders = result;
    });
}

var index_html = jade.renderFile('index.jade', {});

var users_html;
function getUsersHtml() {
    var i;
    var list = "ul\n";
    for(i = 0; i < traders.length; i++) {
	list += " li "+traders[i].name+"\n"
    }
    users_html = jade.render(list, {});
}

MongoClient.connect(dbUrl, (err, client) => {
    assert.equal(null, err);
    console.log("Connected to mongodb");
    db = client.db(dbName);
    getPrices();
    getTraders();
    setTimeout(calcValues, 5000);
    setTimeout(getUsersHtml, 5000);
});


http.createServer((req, res) => {
    var q = url.parse(req.url, true);
    res.writeHead(200, {'Content-Type': 'text/html'});
    if(q.pathname == '/data'){
	res.write('data');
    }else if(q.pathname == '/users'){
	res.write(users_html);
    }else if(q.pathname == '/prices'){
	for(var curr in prices)
	    res.write(curr+": "+prices[curr]+"<br/>");
    }else{
	res.write(index_html);
    }
    res.end();
}).listen(3000);

