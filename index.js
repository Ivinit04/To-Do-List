import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";

mongoose.connect("mongodb+srv://vinitjoshiofficial:bW66u8QcHqzCsU0Z@cluster0.djs8bwe.mongodb.net/eCommerceDB?retryWrites=true&w=majority");

async function main(){

    const app = express();
    const port = 3000;

    app.use(bodyParser.urlencoded({extended: true}));

    app.use(express.static("public"));

    const options = {
        weekday: "long",
        month: "long",
        day: "numeric"
    };
    const day = new Date().toLocaleDateString("en-US", options);

    const itemSchema = new mongoose.Schema({
        name: String
    });

    const Item = new mongoose.model('Item' , itemSchema);

    const item1 = new Item({
        name: "Welcome to your todolist!"
    });
    const item2 = new Item({
        name: "Hit + button to add new item."
    });
    const item3 = new Item({
        name: "<-- Hit this to delete item."
    });

    const defaultItemsArray = [item1 , item2 , item3];

    // await Item.insertMany(defaultItemsArray);

    const listSchema = new mongoose.Schema({
        name: String,
        items: [itemSchema]
    });

    const List = new mongoose.model("List" , listSchema);


    //need to make the request and response method asynchronous bcuz result of find() need to handle with promises or async/await
    //if not then error renders for index.ejs file on forEach loop
    app.get("/", async (req , res) => {   
        
        const listOfItems = await Item.find()  //gives array of objects
        // console.log(listOfItems); 

        //default items should be added only once in database when collection is empty 
        if(listOfItems.length === 0){
            Item.insertMany(defaultItemsArray);
            //After insering the items when collection is empty , items must be shown in home page and for that we need to redirect to 
            //home page, so that when it again hits get route method it goes to else condition where it renders the index.ejs file and output displays
            res.redirect("/");  
        }
        else{
            res.render("index.ejs" , {
                Title : day , 
                items : listOfItems,
            });
        }
        
    });

    app.post("/" , async (req , res) => {

        // console.log(req.body);
        const itemName = req.body["newItem"];
        const listName = req.body["list"];

        //create a new item document that is going to add into database
        const newItem = new Item({
            name: itemName
        });
        //new item that got added at listOfItems array will be gone once we re start the server bcuz listOfItems will be render with the 
        //items that are present in database i.e listOfItems = Item.find() , therefore we need to save the new item into database instead
        //of pushing it to listOfItems array.

        // listOfItems.push(newItem);

        if(listName === day){
            //That means item is from home page , so the item will save into items database
            await newItem.save();

            //this will re enter us into get route method
            res.redirect("/"); 
        }else{
            //That means item is from custom list , so the item will save into items array of listName document in lists database
            const listDoc = await List.findOne({name: listName});
            listDoc.items.push(newItem);
            await listDoc.save();
            res.redirect(`/${listName}`);
        }
         
    });

    app.post("/delete" , async (req , res)=> {
        // console.log(req.body);
        const checkedItemId = req.body["checkbox"];
        // console.log(checkedItemId);

        const checkedItemName = req.body["ListName"];
        
        if(checkedItemName === day){
            await Item.findByIdAndRemove(checkedItemId);
            res.redirect("/");
        }else{
            const listItem = await List.findOne({name: checkedItemName});

            listItem.items = listItem.items.filter(item => {
                return item._id != checkedItemId;
            });
            // console.log(listItem.items);
            await listItem.save();
            res.redirect(`/${checkedItemName}`);

        }
        
    });

    // express route parameters to dynamically create routes
    app.get("/:customRouteName" , async (req , res) => {
        // console.log(req.params.customRouteName);
        const currentRouteName = req.params.customRouteName;
        
        const alreadyExits = await List.findOne({name: currentRouteName});
        
        if(!alreadyExits){
            const listItem = new List({
                name: currentRouteName,
                items: defaultItemsArray
            });
            await listItem.save()
            res.redirect(`/${currentRouteName}`);
        }else{
            res.render("index.ejs" , {
                Title: alreadyExits.name,
                items: alreadyExits.items,
            });
        }
    });

    app.listen(port , () => {
        console.log(`Server running on port ${port}`);
    });    

}
main().catch(err => {
    console.log(err);
})



