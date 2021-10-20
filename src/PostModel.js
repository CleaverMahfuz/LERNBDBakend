const mongoose = require('mongoose');

const instance = mongoose.Schema({
    avater:String,
    comments:[],
    reacts:[],
    status:String,
    UserName:String,
    likes:Number,
    file:[],
    timestamp:{ type : Date, default: Date.now },
});
module.exports = mongoose.model("posts",instance)

