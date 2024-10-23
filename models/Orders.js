const mongoose = require("mongoose")

const schema = mongoose.Schema(
    {
        "doctor_name":{type:String},
        "patient_name": { type: String, },
        "file_num": { type: String, },
        "date": { type: String, },
        "shade1": { type: String, },
        "shade2": { type: String, },
        "shade3": { type: String, },
        "category": { type: String, },
        "tooth_detail": { type: String, },
        "tooth_count": { type: Number, },
        "order_count": { type: String, },
        "oral_scan": { type: String, },
        "Remarks": { type: String, },
        "technician_id": { type: String, },
        "product": { type: String, },
        "price": { type: Number, },
        "total_price": { type: Number, },
        "order_id": { type: String, },
        "order_status": {
            type: String,

        }

    }
)
let ordermodel = mongoose.model("orders", schema)
module.exports = { ordermodel }