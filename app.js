const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');

require('dotenv').config();

const indexRouter = require('./routes/index');
const{sequelize} = require('./models');
const passportConfig = require('./passport');

const app = express();

sequelize.sync();
passportConfig(passport);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);
app.set('port', process.env.PORT || 8001);

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(session({
    resave: false,
    saveUninitialized: false,
    secret: process.env.COOKIE_SECRET,
    cookie: {
        httpOnly: true,
        secure: false,
    },
}));

app.use(flash());
app.use(passport.initialize());//passport 설정 초기화
app.use(passport.session());

//router
app.use('/', indexRouter);

//error
app.use(function (req, res, next) {
    next(createError(404));
});

app.use((err, req, res, next) => {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.status(err.status || 500);

    res.render('error');
});

app.listen(app.get('port'), () => {
    console.log(`operating server in ${app.get('port')} port.`);
});

module.exports = app;
