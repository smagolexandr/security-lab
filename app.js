var express = require('express'),
  app = express(),
	Twig = require('twig'),
  twig = Twig.twig,
  cookieSession = require('cookie-session'),
  bodyParser = require('body-parser'),
  nodemailer = require('nodemailer'),
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'sender@gmail.com',
      pass: 'password'
    }
  })
  port = 8999,
  alphabet = 'АБВГҐДЕЄЖЗИІЇЙКЛМНОПРСТУФХЦЧШЩЬЮЯ'

var shiftAlphabet = function (shift) {
  var shiftedAlphabet = ''; //новий алфавіт
  for (var i = 0; i < alphabet.length; i++) {
    currentLetter = (alphabet[i + shift] === undefined) ? (alphabet[i + shift - alphabet.length]) : (alphabet[i + shift]);          shiftedAlphabet = shiftedAlphabet.concat(currentLetter);
  }
  return shiftedAlphabet;
}

var encrypt = function (message, shift) {
  var shiftedAlphabet = shiftAlphabet(shift);
  var encryptedMessage = '';
  for (var i = 0; i < message.length; i++) {
    var indexOfLetter = alphabet.indexOf(message[i].toUpperCase());
    encryptedMessage = encryptedMessage.concat(shiftedAlphabet[indexOfLetter]);
  }
  return encryptedMessage
}

var decrypt = function (message, shift) {
  var shiftedAlphabet = shiftAlphabet(shift);
  var encryptedMessage = '';
  for (var i = 0; i < message.length; i++) {
    if (message[i] == ' ') {
      encryptedMessage = encryptedMessage.concat(' ');
      continue};
    var indexOfLetter = shiftedAlphabet.indexOf(message[i].toUpperCase());
    encryptedMessage = encryptedMessage.concat(alphabet[indexOfLetter]);
  }
  return encryptedMessage;
}

app.use(bodyParser.urlencoded({
  extended: true
}))
app.use(cookieSession({
  name: 'session',
  keys: ['topsecret'],
  resave: false,
  saveUninitialized: true,
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))
app.use('/scripts', express.static(__dirname + '/node_modules/'))
app.use('/public', express.static(__dirname + '/public/'))

app.set('views', __dirname + '/views')
app.set('view engine', 'twig')
app.set('twig options', {
  strict_variables: false
})

app.get('/', function (req, res) {
  res.render('index');
});

app.get('/welcome', function (req, res) {
  res.render('welcome');
});

app.get('/secure', function (req, res) {
  if (req.url === '/secure' && (!req.session || !req.session.authenticated)) {
    res.render('unauthorised', {status: 403});
  } else
  res.render('secure');
});

app.post('/', function (req, res) {
  console.log(req.body.password, req.session)
    if (req.body.username && req.body.username === 'user' && req.body.password && req.body.password === encrypt('пароль', 7)) {
    req.session.authenticated = true;
    console.log(req.body.password, req.session)
    res.redirect('/secure');
  } else {
    res.redirect('/');
  }

});

app.post('/welcome', function (req, res) {
  console.log(req.body)
  if (req.body.password && req.body.cost && req.body.email) {
    var passwordEmail = {
      from: 'sender@gmail.com', // sender address
      to: req.body.email, // list of receivers
      subject: 'Your encrypted password', // Subject line
      html: '<p> Your password: <strong>' + encrypt(req.body.password, parseInt(req.body.cost)) + '</strong></p>'// plain text body
    }

    transporter.sendMail(passwordEmail, function (err, info) {
    if(err)
      console.log(err)
    else
      console.log(info)
    });
  }
})

app.get('/logout', function (req, res, next) {
  delete req.session.authenticated;
  res.redirect('/');
});

app.listen(port);
console.log('Node listening on port %s', port);
