require("dotenv").config();     
const express = require("express");
const bp = require("body-parser");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");
const _ = require("lodash");

const app = express();
app.use(bp.urlencoded({
    extended: true
}));
app.use(express.static("public"));
app.set('view engine', 'ejs');
mongoose.connect(String(process.env.SECRET), {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const itemSchema = {
    name: String
};

const Item = mongoose.model("Item", itemSchema);
const item1 = new Item({
    name: "Welcome to your new List"
})
const item2 = new Item({
    name: "Press + to add new items"
})
const item3 = new Item({
    name: "<--- To delete them"
})
const item4 = new Item({
    name: "Accessing any route would create a new List"
})


const defaultItems = [item1, item2, item3, item4];
const listSchema = {
    name: String,
    items: [itemSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", (req, res) => {
    day = date.getDay();
    Item.find((err, items) => {
        if (err) {
            console.log(err);
        } else if (items.length === 0) {
            Item.insertMany(defaultItems).then((toBeSaved) => {
                res.redirect("/");
            }).catch((err) => {
                console.log(err);
            })
        } else {
            res.render('list', {
                today: day,
                title: "Default",
                newItem: items
            })
        }
    })
});
app.post("/", (req, res) => {
    const item = new Item({
        name: req.body.newNote
    });
    if (req.body.list === "Default") {
        item.save().then((toBeSaved) => {
            res.redirect("/");
        }).catch((err) => {
            console.log(err);
        });
    } else {
        List.findOne({
            name: req.body.list
        }, (err, found) => {
            if (err) {
                console.log(err);
            } else {
                found.items.push(item);
                found.save().then((toBeSaved) => {
                    res.redirect("/" + req.body.list);
                }).catch((err) => {
                    console.log(err);
                });
            }
        })
    }
})
app.post("/delete", (req, res) => {
    if (req.body.hide === "Default") {
        Item.deleteOne({
            _id: req.body.checkbox
        }, (err) => {
            if (err) {
                console.log(err);
            } else {
                res.redirect("/");
            }
        })
    } else {
        List.findOneAndUpdate({
            name: req.body.hide
        }, {
            $pull: {
                items: {
                    _id: req.body.checkbox
                }
            }
        }, {
            useFindAndModify: false
        }, (err) => {
            if (err) {
                console.log(err);
            } else {
                res.redirect("/" + req.body.hide);
            }
        })
    }
})
app.get("/:id", (req, res) => {
    const customListName = _.capitalize(req.params.id);
    List.findOne({
        name: customListName
    }, (err, result) => {
        if (err) {
            console.log(err);
        } else {
            if (!result) {
                const list = new List({
                    name: customListName,
                    items: defaultItems
                })
                list.save().then((toBeSaved) => {
                    res.redirect("/" + customListName);
                }).catch((err) => {
                    console.log(err);
                });
            } else {
                res.render("list", {
                    today: date.getDay(),
                    title: result.name,
                    newItem: result.items
                });
            }
        }
    })
})
app.listen(process.env.PORT || 3000, () => {
    console.log("server started on port "+(process.env.PORT!==undefined?process.env.PORT:3000));
});