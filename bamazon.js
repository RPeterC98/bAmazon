var mysql = require('mysql');
var inquirer = require('inquirer');

var connection = mysql.createConnection({
  host: "localhost",
  port: 8889,
  user: "root",
  password: "root",
  database: "bamazon_db"
});

connection.connect(function (err) {
  if (err) {
    console.log(err);
    return;
  }
  console.log("connected as id " + connection.threadId);
  displayInventory();
});

var purchasePrompt = {
  type: 'input',
  message: "Type in the ID of the product you would like to purchase:",
  name: 'product_purchase'
};
var quantityPrompt = {
  type: 'input',
  message: "How many units of the product would you like to purchase?",
  name: 'product_quantity'
};
var restartPrompt = {
  type: "list",
  message: "Would you like to shop again?",
  choices: ["Yes", "No"],
  name: "restart_prompt"
};

var displayInventory = function () {
  connection.query("SELECT * FROM products", function (err, res) {
    console.log("DISPLAYING ALL INVENTORY:" + "\n" + "----------------------------");
    for (var i = 0; i < res.length; i++) {
      console.log("Item ID: " + res[i].item_id + "\n" + "Product Name: " + res[i].product_name + "\n" + "Price: " + res[i].price + "\n" + "Available Quantity: " + res[i].stock_quantity + "\n----------------------------");
    }
    promptCustomer(res);
  })
}

var promptCustomer = function (res) {
  inquirer.prompt([purchasePrompt]).then(function (inquirerResponse) {

    var chosenProductID = parseInt(inquirerResponse.product_purchase);
    for (var i = 0; i < res.length; i++) {
      if (res[i].item_id === chosenProductID) {

        var id = i;

        inquirer.prompt([quantityPrompt]).then(function (inquirerResponse) {

          var chosenQuantity = parseInt(inquirerResponse.product_quantity);


          if ((res[id].stock_quantity - chosenQuantity) >= 0) {

            var newQuantity = res[id].stock_quantity - chosenQuantity;

            var totalCost = res[id].price * chosenQuantity;

            var sql = "UPDATE ?? SET ?? = ? WHERE ?? = ?";
            var values = ['products', 'stock_quantity', newQuantity, 'item_id', chosenProductID];
            connection.query(sql, values, function (err, res) {
              if (err) {
                console.log(err);
                connection.end();
              }

              console.log("Product(s) bought!" + "\n" + "Total Cost of Transaction: $" + totalCost);

              inquirer.prompt([restartPrompt]).then(function (inquirerResponse) {
                if (inquirerResponse.restart_prompt === "Yes") {
                  displayInventory();
                } else {
                  console.log("Thank You!");
                  connection.end();
                }
              })
            })
          }

          else {
            console.log("Insufficient Quantity! Please enter a number less than or equal to the selected item's available quantity.");
            promptCustomer(res);
          }
        })
      }
    }
  })
}
