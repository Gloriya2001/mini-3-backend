const mongoose = require("mongoose")

const schema = mongoose.Schema(
    {
        "name": { type: String, },
        "email": { type: String,},
        "password": { type: String, },
        "role": { type: String, },
        "lab_licence_number": { type: String, },
        "doctor_id": { type: String, },
        "technician_id": { type: String, },
        "address": { type: String, },
        "phone_number": { type: String, },
        "alternate_phone_number": { type: String, },
        "clinic_name": { type: String, },
        "lab_name": { type: String, }    
    }
)
let usermodel = mongoose.model("users", schema)
module.exports = { usermodel }