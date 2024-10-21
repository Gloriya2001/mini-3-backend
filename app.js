const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")

const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")


const { usermodel } = require("./models/Users")
const { ordermodel } = require("./models/Orders")

const app = express()
app.use(cors())
app.use(express.json())




if (mongoose.connect("mongodb+srv://gloria2001:gloria2001@cluster0.ipg35w1.mongodb.net/DentTechSolutionDB?retryWrites=true&w=majority&appName=Cluster0")) {
    console.log("MongoDb connected")
} else {
    console.log("MongoDb not connected")
}

const generatePassword = async (password) => {
    const salt = await bcrypt.genSalt(4)
    return bcrypt.hash(password, salt)
}



//api for sign Up user
app.post("/signup", async (req, res) => {

    let input = req.body

    let hashedPassword = await generatePassword(input.password)
    console.log(hashedPassword)
    input.password = hashedPassword

    let users = new usermodel(input)
    users.save()
    res.json({ "status": "success" })

})




//api for sign In
app.post("/login", (req, res) => {

    let input = req.body
    usermodel.find({ "email": req.body.email }).then(
        (response) => {
            if (response.length > 0) {
                let dbPassword = response[0].password
                console.log(dbPassword)
                bcrypt.compare(input.password, dbPassword, (error, isMatch) => {
                    if (isMatch) {
                        jwt.sign({ email: input.email }, "dentTech-app", { expiresIn: "1d" },
                            (error, token) => {
                                if (error) {
                                    res.json({ "status": "unable to create token" })
                                } else {
                                    res.json({ "status": "success", "userid": response[0]._id, "token": token,"role": response[0].role, "name": response[0].name })
                                }
                            })
                    } else {
                        res.json({ "status": "incorrect password" })
                    }
                })
            }
            else {
                res.json({ "status": "user not found" })
            }
        }
    )
})

//Profile Api
app.post("/Profile", async (req, res) => {

    let input = req.body
    let profile = await usermodel(input)
    profile.save()
    res.json({ "status": "added" })

})

app.post("/addorder", async (req, res) => {

    let input = req.body
    let order = await ordermodel(input)
    profile.save()
    res.json({ "status": "added" })

})

app.post("/deleteorder", (req, res) => {

    let input = req.body
    ordermodel.findByIdAndDelete(input._id).then(

        (response) => {
            res.json({"status":"deleted"})
         }

    ).catch(
        (error)=>{
            res.send("error")
        }
    )
})

app.post("/viewOrders",(req,res)=>{
    ordermodel.find().then(
        (data)=>{
            res.json(data)
        }
    ).catch(
        (error)=>{
            res.json(error)
        }
    )
})

app.put("/assignorder", async (req, res) => {

   // Assign a technician to an order by Admin
    try {
        const { technicianId } = req.body; // Technician ID from request body
        const orderId = req.params.orderId; // Order ID from URL params

        // Check if the technician exists and has the role of 'Technician'
        const technician = await User.findOne({ _id: technicianId, role: 'Technician' });
        if (!technician) {
            return res.status(400).json({ message: 'Technician not found or invalid role' });
        }

        // Find the order by ID and assign the technician
        const order = await Order.findOne({ orderId });
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Assign the technician to the order
        order.technicianId = technician._id;

        // Add a tracking update
        order.trackingUpdates.push({ status: `Assigned to technician ${technician.name}` });

        await order.save();
        res.status(200).json({ message: 'Technician assigned successfully', order });
    } catch (error) {
        res.status(500).json({ message: 'Error assigning technician', error });
    }

})



app.listen(8080, () => {

    console.log("Server started")

})