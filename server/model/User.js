const mongoose = require("mongoose"); // mongoose 모듈 가져오기
const bcrypt = require('bcrypt') // bcrypt를 가져온다.
const saltRounds = 10
const jwt = require('jsonwebtoken')

// schema 생성
const userSchema = mongoose.Schema({
    name: {
        type: String,
        maxlength: 50
    },
    email:{
        type: String,
        trim: true,
        //unique: 1
    },
    password: {
        type: String,
        minlength: 5
    },
    lastname: {
        type: String,
        maxlength: 50
    },
    role:{
        type: Number,
        default: 0
    },
    image: {
        type : String
    },
    token:{
        type: String
    },
    tokenExp: {
        type: Number
    }
})

// 몽구스에서 가져온 메소드
// user save 하기 전에 실행되는 함수
// next라는 param을 줘서 전처리를 한 다음에 next()로 user save로 보내버리는 것이다.
userSchema.pre('save', function( next ){
    var user = this 
    // field 중 password가 변경될 때만 실행한다. 
    if(user.isModified('password')){
    // 비밀 번호를 암호화 시킨다.
    bcrypt.genSalt(saltRounds, function(err, salt) {
        // 에러나면 user save에 에러 전달한다.
        if(err) return next(err) 
        bcrypt.hash(user.password, salt, function(err, hash) {
           if(err) return next(err)
           user.password = hash
           next()
        });
    });
    }else {
        next()
    }
})

userSchema.methods.comparePassword = function(plainPassword, cb) {
    //plainPassword 1234567  암호화된 비밀번호 
    bcrypt.compare(plainPassword, this.password, function(err, isMatch){
        if(err) return cb(err)
        cb(null, isMatch) // err는 없고 isMatch가 true
    })
}

userSchema.methods.generateToken = function(cb) {

    var user = this //es5 문법을 쓰고 있어서 이렇게 해야함

    //jsonwebtoken 을 이용해서 토큰을 생성하기
    // user._id + 'secretToken' = token
    var token = jwt.sign(user._id.toHexString(), 'secretToken')

    user.token = token
    user.save(function(err, user) {
        if(err) return cb(err)
        cb(null, user)
    })
}

userSchema.statics.findByToken = function(token, cb) {
    var user = this;
    // 토큰을 decode 한다. 암호화 할때 썼던 'secretToken'을 넣는다.
    jwt.verify(token, 'secretToken', function(err, decoded) {
        // 유저 id를 이용해서 유저를 찾은 다음에
        // 클라이언트에서 가져온 token과 DB에 보관된 토큰이 일치하는지 확인
        user.findOne({"_id":decoded, "token":token}, function(err, user) {
            if(err) return cb(err);
            cb(null, user)
        })
    })
}

// 유저를 모델로 감싸준다. 
const User = mongoose.model('User',userSchema)

module.exports = { User }