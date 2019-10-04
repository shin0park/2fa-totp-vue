const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt-nodejs');

const { User } = require('../models');

module.exports = (passport) => {
    passport.use(new LocalStrategy({
        usernameField: 'email', //req.body.email
        passwordField: 'password',//req.body.password
    }, async (email, password, done) => {
        //done(에러, 성공, 실패)
        try {
            const exUser = await User.findOne({ where: { email } });
            //이메일 있는지 검사
            if (exUser) {
                //있으면 비밀번호 검사
                const result = await bcrypt.compareSync(password, exUser.password);
                if (result) {
                    done(null, exUser);
                } else {
                    done(null, false, { message: '이메일-비밀번호 조합이 맞지 않습니다.' });
                }
            } else {
                //에러x,성공x,실패정보o
                done(null, false, { message: '이메일-비밀번호 조합이 맞지 않습니다.' });
            }
        } catch (error) {
            console.error(error);
            done(error);
        }
    }));
};