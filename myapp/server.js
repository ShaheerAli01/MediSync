const express = require("express");
const app = express();

const port = 3000;
/*
app.get(`/`, (req, res) => {
    res.json({
        email: "john.doe.453@gmail.com",
        password: "I_exist123",
        age: 20,
        firstName: "John",
        lastName: "Doe",
        doctor: "Mr. Smith"
    });
})
*/
app.listen(port, () => {
    console.log(`Server is listenting on ${port}`);
})


let userDatabase = [{id: 1, email: "jeff.paterson23@gmail.com", password: "20L67KG112", firstName: "Jeff", lastName: "Paterson"}];
let nextId = 2;

//user creation
app.post("/users",(req, res)=>{
    const {email, password, firstName, lastName} = req.body;

    if(!email || !password || !firstName || !lastName){
        return res.status(400).json({error: `Not all of the required fields have been filled out.`});
    }

    const newUser ={
        id: nextId,
        email: email,
        password: password,
        firstName: firstName,
        lastName: lastName
    };

    userDatabase.push(newUser);
    nextId++;
    return res.status(201).json({message:`New user created successfully!`});
});

//User account removal
app.delete("/user/:id",(req, res)=>{
    const userId = parseInt(req.params.id);

    //finds the user in the database via id #
    const userIndex = userDatabase.findIndex(user => user.id === userId);

    if(userIndex = -1){
        return res.status.json({error:`User ${userId} not found in database.`});
    }

    userDatabase.splice(userIndex,1);

    return res.status(200).json({message:`User ${userId} deleted successfully!`});
});

//view user 

app.get(`/users`, (req,res)=>{
    return res.status(200).json(userDatabase);
});

app.listen(port, ()=> {
    console.log(`Server is running on http://localhost:${port}`);

});