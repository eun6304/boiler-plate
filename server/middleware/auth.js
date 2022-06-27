const { User } = require('../model/User'); 

let auth = (req, res, next) => {
  // 인증 처리

  // 1. 클라이언트 쿠키에서 토큰을 가져온다.
  let token = req.cookies.x_auth;

  // 2. 토큰을 복호화 한 후, 유저를 찾는다.
  User.findByToken(token, (err, user) => {
    if(err) throw err;
    if(!user) return res.json({ isAuth: false, error: true }) // user로 넘어가지 않고 미들웨어에서 빠져나간다.
    req.token = token
    req.user = user
    next();
  })
  // 3. 유저가 있으면 인증 OKAY

  // 4. 유저가 있으면 인증 NO
}

module.exports  = { auth }