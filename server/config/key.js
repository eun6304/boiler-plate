// 환경 변수가 배포 이후면 prod 파일에서 uri 가져온다
// heroku를 이용해 배포할 경우를 분기해놓는다
if(process.env.NODE_ENV==='production') { 
    module.exports = require('./prod')
} else {
    module.exports = require('./dev')
}