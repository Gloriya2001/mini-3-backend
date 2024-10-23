const mongoose = require("mongoose")

const schema = mongoose.Schema(
    {
        "product_name":{type:String},
        "about_product": { type: String, },
        "product_price": { type: String, },
        "product_img": { type: String, }
        

        }
)
let productmodel = mongoose.model("products", schema)
module.exports = { productmodel }