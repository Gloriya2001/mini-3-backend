const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")

const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

const multer = require('multer');
const path = require('path');
const bodyParser = require('body-parser');

const { usermodel } = require("./models/Users")
const { ordermodel } = require("./models/Orders")
const { productmodel } = require("./models/Products")
const { pricemodel } = require("./models/Productprice")
const { msgmodel } = require("./models/Messeges")
const { statusmodel } = require("./models/Status")

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

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Directory to save uploaded files
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Append timestamp to filename
    },
});


const upload = multer({ storage });




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
                                    res.json({ "status": "success", "userid": response[0]._id, "token": token, "role": response[0].role, "name": response[0].name })
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






//Endpoint to fetch user details
// Endpoint to fetch user details
app.post('/userDetailsView', async (req, res) => {
    const userId = req.body.userId;
    try {
        const user = await usermodel.findById(userId);
        if (!user) {
            return res.status(404).send({ message: 'User  not found' });
        }
        res.send(user);
    } catch (error) {
        console.error("Error fetching user details:", error.message);
        res.status(500).send({ message: 'Internal Server Error', error: error.message });
    }
});

// Endpoint to update user profile
app.put('/updateProfile/:userId', async (req, res) => {
    const userId = req.params.userId;
    try {
        const user = await usermodel.findByIdAndUpdate(userId, req.body, { new: true });
        if (!user) {
            return res.status(404).send({ message: 'User  not found' });
        }
        res.send({ message: 'Profile updated successfully', user });
    } catch (error) {
        console.error("Error updating profile:", error.message);
        res.status(500).send({ message: 'Internal Server Error', error: error.message });
    }
});

app.post("/doctors", (req, res) => {
    usermodel.find({ role: 'Doctor' }) // Filter to find users with role 'doctor'
        .then((data) => {
            res.json(data); // Send the filtered data as a JSON response
        })
        .catch((error) => {
            res.status(500).json({ error: error.message }); // Send error message with status code 500
        });
});
//to take technicians only
app.post("/technicians", (req, res) => {
    usermodel.find({ role: 'Technician' }) // Filter to find users with role 'technician'
        .then((data) => {
            res.json(data); // Send the filtered data as a JSON response
        })
        .catch((error) => {
            res.status(500).json({ error: error.message }); // Send error message with status code 500
        });
});

app.post("/deleteUser", (req, res) => {
    let input = req.body; // Get the input from the request body

    // Use findByIdAndDelete to remove the doctor by ID
    usermodel.findByIdAndDelete(input._id)
        .then((response) => {
            if (response) {
                res.json({ "status": "deleted" }); // Respond with a success message
            } else {
                res.status(404).json({ "status": "not found" }); // Handle case where ID does not exist
            }
        })
        .catch((error) => {
            res.status(500).json({ "error": error.message }); // Send error message with status code 500
        });
});




// Add order
// Update the /addorder route to handle image uploads
app.post("/addorder", upload.single('oral_scan'), async (req, res) => {
    try {
        // Validate the input data
        if (!req.body) {
            return res.status(400).json({ message: "No input data provided." });
        }

        // Create a new order document
        const orderData = {
            ...req.body,
            oral_scan: req.file ? req.file.path : null // Store the path of the uploaded image
        };

        console.log("Order Data:", orderData); // Log the order data

        let orders = new ordermodel(orderData);

        // Save the order to the database and capture the saved order
        const savedOrder = await orders.save(); // Capture the saved order instance

        // Return a success response with the order ID
        res.json({
            status: "added",
            orderId: savedOrder._id // Include the order ID in the response
        });
    } catch (error) {
        console.error("Error adding order:", error);
        res.status(500).json({ message: "Internal server error." });
    }
});



app.use('/uploads', express.static(path.join(__dirname, 'uploads')));





//delete order by admin
app.post("/deleteOrder", (req, res) => {
    console.log("Delete order request received:", req.body); // Log the request body
    let input = req.body;
    ordermodel.findByIdAndDelete(input._id).then((response) => {
        if (response) {
            res.json({ "status": "deleted" });
        } else {
            res.status(404).json({ "status": "not found" });
        }
    }).catch((error) => {
        console.error("Error deleting order:", error);
        res.status(500).send("Error deleting order");
    });
});

// Endpoint to assign technician
app.post('/assignTechnician', async (req, res) => {
    try {
        const { orderId, technicianId } = req.body;
        const order = await ordermodel.findByIdAndUpdate(orderId, { technicianId }, { new: true });
        if (order) {
            res.json({ status: 'assigned' });
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error assigning technician' });
    }
});









//add product by user
app.post("/addproduct", upload.single('product_img'), async (req, res) => {
    try {
        // Validate the input data
        if (!req.body) {
            return res.status(400).json({ message: "No input data provided." });
        }

        // Create a new order document
        const productData = {
            ...req.body,
            product_img: req.file ? req.file.path : null // Store the path of the uploaded image
        };

        console.log("Product Data :", productData); // Log the order data

        let products = new productmodel(productData);

        // Save the order to the database
        await products.save();

        // Return a success response
        res.json({ "status": "added" });
    } catch (error) {
        console.error("Error adding order:", error);
        res.status(500).json({ message: "Internal server error." });
    }
});

app.post("/viewProduct", (req, res) => {
    productmodel.find().then(
        (data) => {
            res.json(data)
        }
    ).catch(
        (error) => {
            res.json(error)
        }
    )
})
app.post("/deleteProduct", (req, res) => {

    let input = req.body
    productmodel.findByIdAndDelete(input._id).then(

        (response) => {
            res.json({ "status": "deleted" })
        }

    ).catch(
        (error) => {
            res.send("error")
        }
    )
})

app.get('/getProfile', async (req, res) => {
    try {
        const profile = await usermodel.findOne(); // Fetch the first profile (you may want to implement user authentication)
        res.json(profile);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching profile data' });
    }
});

// Update profile data
app.post('/updateProfile', upload.single('profile_pic'), async (req, res) => {
    try {
        const updatedData = {
            ...req.body,
            profile_pic: req.file ? req.file.path : undefined, // Use the uploaded file path if available
        };

        await usermodel.updateOne({}, updatedData); // Update the first profile (you may want to implement user authentication)
        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating profile' });
    }
});


// Update order status

app.post("/searchOrder", (req, res) => {
    let input = req.body; // This should contain the doctor's name or ID
    ordermodel.find(input).then((data) => {
        res.json(data);
    }).catch((error) => {
        console.error(error);
        res.status(500).send("Error fetching orders");
    });
});





//Price details

app.post("/addPrice", (req, res) => {
    let input = req.body
    let price = new pricemodel(input)
    price.save()
    res.json({ "status": "added" })
})


app.post("/viewPrice", (req, res) => {

    pricemodel.find().then(

        (data) => {
            res.json(data)
        }
    ).catch(
        (error) => {
            res.json(error)
        }
    )

})

app.post("/viewPrice/:category", (req, res) => {
    const category = req.params.category;  // Extract the category from the URL parameters

    pricemodel.find({ category: category })  // Filter by the category
        .then((data) => {
            res.json(data);  // Send the filtered data
        })
        .catch((error) => {
            console.error("Error fetching prices:", error);  // Log error for debugging
            res.status(500).json({ message: 'Error fetching prices', error });
        });
});



app.post("/deletePrice", (req, res) => {

    let input = req.body
    pricemodel.findByIdAndDelete(input._id).then(

        (response) => {
            res.json({ "status": "deleted" })
        }

    ).catch(
        (error) => {
            res.send("error")
        }
    )
})

/////Update Order Status

app.put('/updateOrder/:id', (req, res) => {
    console.log("Request Body:", req.body); // Log the request body

    const orderId = req.params.id; // Get orderId from URL parameters
    const { assigned_technician } = req.body; // Get assigned_technician from the request body

    if (!orderId || !assigned_technician) {
        return res.status(400).json({ message: 'Order ID and assigned technician are required.' });
    }

    ordermodel.updateOne({ _id: orderId }, { assigned_technician })
        .then(result => {
            if (result.nModified === 0) {
                return res.status(404).json({ message: 'Order not found or no changes made' });
            }
            res.json({ status: 'updated' });
        })
        .catch(error => {
            console.error("Mongoose error:", error);
            res.status(500).json({ message: 'Error updating order', error });
        });
});


//View only new orders.
app.post("/viewNewOrders", (req, res) => {
    ordermodel.find({ assigned_technician: "" }) // Correctly query for assigned_technician
        .then((data) => {
            res.json(data);
        })
        .catch((error) => {
            console.error("Error fetching orders:", error); // Log the error for debugging
            res.status(500).json({ message: "Error fetching orders", error });
        });
});


app.post("/viewOrders", (req, res) => {
    ordermodel.find() // Correctly query for assigned_technician
        .then((data) => {
            res.json(data);
        })
        .catch((error) => {
            console.error("Error fetching orders:", error); // Log the error for debugging
            res.status(500).json({ message: "Error fetching orders", error });
        });
});

app.post("/viewAssignedOrders", (req, res) => {

    const name = req.body.name

    ordermodel.find({
        assigned_technician: name,
        order_status: "Assigned"
    }) // Correctly query for assigned_technician
        .then((data) => {
            res.json(data);
        })
        .catch((error) => {
            console.error("Error fetching orders:", error); // Log the error for debugging
            res.status(500).json({ message: "Error fetching orders", error });
        });
});

app.post("/onlinePayed", (req, res) => {
    ordermodel.find({ order_status: "Online Payment" }) // Corrected syntax here
        .then((data) => {
            res.json(data);
        })
        .catch((error) => {
            res.json(error);
        });
});


///Order Tracking


app.post("/viewPending", (req, res) => {
    ordermodel.find({
        $or: [
            { order_status: "Pending" },
            { order_status: "Accepted" }
        ]
    })
        .then((data) => {
            res.json(data);
        })
        .catch((error) => {
            console.error("Error fetching orders:", error); // Log the error for debugging
            res.status(500).json({ message: "Error fetching orders", error });
        });
});

app.post("/placed", (req, res) => {
    ordermodel.find({
        $or: [
            { order_status: "Cash On Delivery" },
            { order_status: "Online Payment" }
        ]
    }).then((data) => {
        res.json(data);
    })
        .catch((error) => {
            res.json(error);
        });
});

app.post("/inProgress", (req, res) => {
    ordermodel.find({ order_status: "In Progress" }) // Corrected syntax here
        .then((data) => {
            res.json(data);
        })
        .catch((error) => {
            res.json(error);
        });
});

app.post("/delivered", (req, res) => {
    ordermodel.find({ order_status: "delivered" }) // Corrected syntax here
        .then((data) => {
            res.json(data);
        })
        .catch((error) => {
            res.json(error);
        });
});

app.post("/cancelled", (req, res) => {
    ordermodel.find({ order_status: "in_progress" }) // Corrected syntax here
        .then((data) => {
            res.json(data);
        })
        .catch((error) => {
            res.json(error);
        });
});

app.post("/return", (req, res) => {
    ordermodel.find({ order_status: "return" }) // Corrected syntax here
        .then((data) => {
            res.json(data);
        })
        .catch((error) => {
            res.json(error);
        });
});




app.post("/techInProgress", (req, res) => {
    const name = req.body.name;

    // Correctly query for assigned_technician and order_status
    ordermodel.find({
        assigned_technician: name,
        order_status: "In Progress"
    })
        .then((data) => {
            res.json(data);
        })
        .catch((error) => {
            console.error("Error fetching orders:", error); // Log the error for debugging
            res.status(500).json({ message: "Error fetching orders", error });
        });
});

app.post("/techCompleted", (req, res) => {
    const name = req.body.name;

    // Correctly query for assigned_technician and order_status
    ordermodel.find({
        assigned_technician: name,
        order_status: "Completed By Tech"
    })
        .then((data) => {
            res.json(data);
        })
        .catch((error) => {
            console.error("Error fetching orders:", error); // Log the error for debugging
            res.status(500).json({ message: "Error fetching orders", error });
        });
});


///Messages
app.put('/orderStatus/:id', (req, res) => {
    console.log("Request Body:", req.body); // Log the request body

    const orderId = req.params.id; // Get orderId from URL parameters
    const { status } = req.body; // Get status from the request body

    if (!orderId || !status) {
        return res.status(400).json({ message: 'Order ID and status are required.' });
    }

    ordermodel.updateOne({ _id: orderId }, { $set: { order_status: status } })
        .then(result => {
            if (result.nModified === 0) {
                return res.status(404).json({ message: 'Order not found or no changes made' });
            }
            res.json({ status: 'updated' });
        })
        .catch(error => {
            console.error("Mongoose error:", error);
            res.status(500).json({ message: 'Error updating order', error });
        });
});

app.put('/orderStatusPay/:id', (req, res) => {
    console.log("Request Body:", req.body); // Log the request body

    const { orderId } = req.body; // Get orderId from URL parameters
    const { status } = req.body; // Get status from the request body

    if (!orderId || !status) {
        return res.status(400).json({ message: 'Order ID and status are required.' });
    }

    ordermodel.updateOne({ _id: orderId }, { $set: { order_status: status } })
        .then(result => {
            if (result.nModified === 0) {
                return res.status(404).json({ message: 'Order not found or no changes made' });
            }
            res.json({ status: 'updated' });
        })
        .catch(error => {
            console.error("Mongoose error:", error);
            res.status(500).json({ message: 'Error updating order', error });
        });
});

app.put('/orderStatusAdmin/:id', (req, res) => {
    console.log("Request Body:", req.body); // Log the request body

    const orderId = req.params.id; // Get orderId from URL parameters
    const { status, message, deliveryDate } = req.body; // Get status, message, and deliveryDate from the request body

    if (!orderId || !status) {
        return res.status(400).json({ message: 'Order ID and status are required.' });
    }

    ordermodel.updateOne({ _id: orderId }, { $set: { order_status: status, message, deliveryDate } })
        .then(result => {
            if (result.nModified === 0) {
                return res.status(404).json({ message: 'Order not found or no changes made' });
            }
            res.json({ status: 'updated' });
        })
        .catch(error => {
            console.error("Mongoose error:", error);
            res.status(500).json({ message: 'Error updating order', error });
        });
});




app.listen(8080, () => {

    console.log("Server started")

})