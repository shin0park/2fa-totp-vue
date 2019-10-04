const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt-nodejs');
var speakeasy = require('speakeasy');
var QRCode = require('qrcode');

const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const { User } = require('../models');

const router = express.Router();

router.get('/', function (req, res) {
    res.render('main', {
        user: req.user//로그인된 사용자.
    });
});
//회원가입
router.post('/join', isNotLoggedIn, async (req, res, next) => {
    const { email, password, nick } = req.body;
    try {
        const exUser = await User.findOne({ where: { email } });
        if (exUser) {
            req.flash('joinError', '이미 가입된 이메일입니다.');
            return res.send("joinError");
        }
        //이미 가입된 회원 없다면 bcrypt로 비밀번호 암호화
        //console.time('암호화 시간');
        const hash = await bcrypt.hashSync(password, bcrypt.genSaltSync(12), null);
        //console.timeEnd('암호화 시간');
        //gensaltsync 인자의 숫자 커질수록 암호화 복잡 but 속도 감소.
        await User.create({
            email,
            password: hash,
            nick,
        });// db에 user 생성.
        return res.send('success');//회원가입 완료후 메인페이지이동
    } catch (error) {
        console.error(error);
        return next(error);
    }
});
//로그인
router.post('/login', isNotLoggedIn, (req, res, next) => {//req.body.email / req.body.password
    passport.authenticate('local', (authError, user, info) => {//에러, 성공, 실패
        if (authError) {
            console.error(authError);
            return next(authError);//에러핸들러 처리로
        }
        if (!user) {
            //사용자 정보 없으면 실패
            req.flash('loginError', info.message);//일회성 메세지
            return res.send('loginError');
        }
        return req.login(user, (loginError) => {//session에 로그인 저장됨 이때 serializeUser가 실행되며 req.user로 사용자 정보 찾을수 있다.
            if (loginError) {
                console.error(loginError);
                return next(loginError);
            }
            if (!!req.user.secret) {//user가 tfa otp가 설정되어있을 경우.otp 인증으로 이동.
                return res.send('otpAccess');
            }
            return res.send('success');
        })

    })(req, res, next);// 미들웨어 내의 미들웨어에는 (req, res, next)를 붙인다.
});
//로그아웃
router.get('/logout', isLoggedIn, (req, res) => {
    req.logout();
    req.session.destroy();
    return res.send('logout');
});
//로그인이 완료된 이후 otp setting
router.post('/setup', isLoggedIn, async (req, res, next) => {
    try {
        const nowUser = req.user;//현재 로그인된 유저
        const secret = speakeasy.generateSecret({ length: 10, name: nowUser.email, issuer: 'Magins' });
        // secretKey 생성. length: secretKey의 길이
        const url = speakeasy.otpauthURL({ //다음 정보를 갖고 있는 url 생성
            secret: secret.base32, //secret key
            label: nowUser.email,
            issuer: 'Magnis',
            encoding: 'base32'
        });
        //secretkey를 갖고있는 url 주소를 담는 qrcode 이미지 생성
        await QRCode.toDataURL(url, (err, data_url) => { //data_url: 생성된 qrcode url 저장.base64 인코딩된 png img
            nowUser.update({
                dataURL: data_url,
                otpURL: url
            });
            //json의 형태로 응답.
            return res.json({
                message: 'OTP Setting',
                tempSecret: secret.base32,
                dataURL: data_url, //qrcode url
                otpURL: url //secretkey 담고 있는 url
            });
        });
    } catch (error) {
        console.error(error);
        return next(error);
    }
});

router.get('/setup', isLoggedIn, async (req, res, next) => {
    res.json(req.user);
});
//otp 해지
router.delete('/setup',isLoggedIn, function (req, res) {
    const nowUser = req.user;
    if(!nowUser.secret){ //이미 해지된경우
        return res.send('alreayDelete');
    }
    nowUser.update({ //otp관련 data db에서 삭제
        secret: "",
        dataURL: "",
        otpURL: ""
    });
    return res.send('success');
});
//otp setting시 사용자가 입력한 otp번호가 confirm 한지 check
router.post('/verify', isLoggedIn, function (req, res) {
    const nowUser = req.user;
    const secret = req.body.tempSecret; 
    if(!req.body.token){//사용자가 otp인증번호를 입력하지 않은 경우
        return res.send('otpEmpty');
    }
    var verified = speakeasy.totp.verify({
        secret: secret, //setting할 secretKey
        encoding: 'base32',
        token: req.body.token //사용자가 입력한 otp인증번호
    });
    
    if (verified) {
        nowUser.update({
            secret: secret,
        });//인증완료시 db에 저장함으로써 setting완료.
        return res.send('tfaEnabled');
    }
    return res.send('notVerified');
});
//otp setting이 된 이후 사용자가 1차로그인을 한 다음 otp 인증을 할 때 사용자가 입력한 otp 인증번호 인증.
router.post('/otp',isLoggedIn, (req, res, next) => {
    if (!req.body.token) {//otp 인증번호 입력하지 않은 경우
        return res.send('otpEmpty');
    }
    const verified = speakeasy.totp.verify({//사용자가 입력한 otp 일치한지 검사.
        secret: req.user.secret, //사용자의 secretKey
        encoding: 'base32',
        token: req.body.token //사용자가 입력한 otp 인증번호
    });
    if (verified) {
        return res.send('success');//인증완료
    } else {
        return res.send('otpError');
    }

});

module.exports = router;