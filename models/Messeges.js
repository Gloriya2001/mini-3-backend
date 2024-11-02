const mongoose = require("mongoose")

const schema = mongoose.Schema(
    {
        "to_admin":{type:String},
        "to_doctor": { type: String, },
        "to_tech": { type: String, },
        "order_id": { type: String, }
        }
)
let msgmodel = mongoose.model("msgs", schema)
module.exports = { msgmodel }