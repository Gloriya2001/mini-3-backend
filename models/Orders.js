const mongoose = require("mongoose")

const schema = mongoose.Schema(
    {
        "patient_name": { type: String, },
        "file_num": { type: String,},
        "date": { type: Date, },
        "shade1": { type: String, },
        "shade2": { type: String, },
        "shade3": { type: String, },
        "category": { type: String, },
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
            enum: ['Placed', 'In Progress', 'Shipped', 'Delivered', 'Cancelled'],
            default: 'Placed'
        }

    }
)
let ordermodel = mongoose.model("orders", schema)
module.exports = { ordermodel }