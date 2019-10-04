const local = require('./localStrategy');
const { User } = require('../models');

//strategy(전략): 누구를 로그인 시킬 것인가.
module.exports = (passport) => {
    passport.serializeUser((user, done) => {
        //{id:1, name:shinyoung, age:23} 이를 session에 모두 저장하기에는 너무 무겁기 때문에.
        //id가 고유값이므로 id만저장.
        done(null, user.id);//mongo db -- user._id
    });
    //메모리session에 id 만 저장.
    passport.deserializeUser((id, done) => {
        console.log("deserializeUser passport");
        User.findOne({ where: { id } })
        //id를 이용해 완전한 user정보로 복구--> req.user
            .then(user => done(null, user))
            .catch(err => done(err));
    });
    local(passport);
};