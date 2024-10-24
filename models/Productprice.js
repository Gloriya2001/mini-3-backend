const mongoose = require("mongoose")

const schema = mongoose.Schema(
    {
        "category":{type:String},
        "price": { type: String, }
        

        }
)
let pricemodel = mongoose.model("price", schema)
module.exports = { pricemodel }