var express = require('express'),
	app = express(),
	server = require('http').Server(app),
	path = require('path');

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views')); 
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'jade'); 


app.listen(app.get('port'), function(){
	console.log('Listening on ' + app.get('port') + ' ...'); 
});