// express 모듈 가져오기
const express = require('express')

// function을 이용해서 express 앱을 만들기
const app = express()

// 포트 번호 부여하기
const port = 5000

// port 5000번에서 앱 실행하기
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})

// bodyParser는 클라이언트에 입력되는 정보를 서버에서 처리해주는 것
const bodyParser = require('body-parser');

// cookieParser 는 token을 저장하기 위한 라이브러리
const cookieParser = require('cookie-parser')

// MONGO_URI를 개발 모드, 배포 모드에 따라 나뉘게 하기 위함
const config = require("./config/key")

// 유저 모델을 가져온다
const { User } = require('./model/User'); 

// auth 미들웨어를 가져온다.
const { auth } = require('./middleware/auth')

// 서버에서 분석해서 가져오게 하는 옵션
//application/x-www-form-urlencoded 이렇게 된 데이터를 분석
app.use(express.urlencoded({extended: true})); 

//application/json 이렇게 된 데이터를 분석
app.use(express.json());

// cookieParser 사용하기
app.use(cookieParser());

// mongoose 모듈 가져오기
const mongoose = require('mongoose');
const { urlencoded } = require('body-parser');

// Mongo DB 정보 넣어서 연결 -> then으로 연결 잘 됐는지 확인 -> catch로 에러 잡기
mongoose.connect(config.mongoURI).then(()=>console.log('MongoDB Connected..'))
.catch(err => console.log(err))

// 루트 디렉토리에 hello world 출력
app.get('/', (req, res) => {
  res.send('블로그 언제쓸건데')
})

app.post('/api/users/register', (req, res) => {
    //회원 가입 할때 필요한 정보들을 client에서 가져오면
    //그것들을 데이터베이스에 넣어준다.
    const user = new User(req.body)

    user.save((err,user) => {
        if(err) return res.json({success: false, err})
        return res.status(200).json({
            success: true
        })
    })
})

app.post("/api/users/login", (req, res) => {

  // 요청된 이메일이 데이터베이스에 있는지 찾는다.
  User.findOne({ email : req.body.email }, (err, user) => {
    if(!user){
      return res.json({
        loginSuccess : false,
        message: "제공된 이메일에 해당하는 유저가 없습니다."
      })
    }
    // 비밀번호가 맞는지 확인, user.js 에서 만든 comparePassword 메소드
    user.comparePassword(req.body.password, (err, isMatch) => {
      if(!isMatch) // isMatch가 없으면 비번 틀린거임
      return res.json({loginSuccess: false, message: "비밀번호가 틀렸습니다."})

      // 비밀번호까지 맞다면 토큰을 생성하기
      user.generateToken((err, user) => {
        // 클라이언트에게 400에러 전해주고 err메세지 보내줌
        if(err) return res.status(400).send(err)    
        // 토큰을 저장한다. 어디에 ? 쿠키 or 로컬스토리지
        res.cookie("x_auth", user.token)
        .status(200) // 상태 성공 전달
        .json({loginSuccess: true, userId: user._id, userToken: user.token}) // 메세지 전달
      })
    })
  })
})

// Auth Route 만들기
app.get('/api/users/auth', auth, (req, res) => { // auth는 미들웨어. 콜백 받기전에 처리하는 것
  // 여기까지 미들웨어를 통과해 왔다는 것은 Authentication이 True 라는 말
  res.status(200).json({
    id : req.user._id,
    isAdmin : req.user.role === 0 ? false : true,
    isAuth : true,
    email : res.user.email,
    name : req.user.name
  })
})

app.get('/api/users/logout', auth, (req, res) => {
  // 유저 찾을때는 미들웨어에서 가져와서 찾는다.
  User.findOneAndUpdate({_id: req.user._id}, // 아이디로 찾고
    { token: ""}, // 토큰 없애주고
    (err, user) => { // 에러콜백
      if(err) return res.json({ success:false, err});
      return res.status(200).send({ // 성공하면 success true 보내준다.
        success : true
      })
    })
})
