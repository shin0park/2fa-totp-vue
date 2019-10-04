exports.isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) {//로그인 여부 알려줌
        //req.login //req.logout --passport가 추가해줌
        next();
    } else {
        res.status(403).send('로그인 필요');
    }
};

exports.isNotLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        next();
    } else {
        res.redirect('/');
    }
};

