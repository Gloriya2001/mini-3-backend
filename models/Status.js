const mongoose = require("mongoose")

const schema = mongoose.Schema(
    {
        "order_id":{type:String},
        "Status": { type: String, }
        }
)
let statusmodel = mongoose.model("status", schema)
module.exports = { statusmodel }