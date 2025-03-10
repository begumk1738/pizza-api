const express = require("express");
const { v4: uuidv4 } = require("uuid"); 
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;


app.use(bodyParser.json());

const orders = []; 

app.post('/api/orders', (req, res) => {
  const { size, toppings, quantity } = req.body;

  if (!size || !toppings || !quantity) {
      return res.status(400).json({ error: "Size, toppings, and quantity are required!" });
  }

  if (typeof quantity !== 'number' || quantity < 1) {
      return res.status(400).json({ error: "Quantity must be a positive number!" });
  }

  if (!Array.isArray(toppings)) {
      return res.status(400).json({ error: "Toppings must be an array!" });
  }

  const newOrder = {
      id: uuidv4(),
      size,
      toppings,
      quantity,
      status: "pending"
  };

  orders.push(newOrder);
  res.status(201).json(newOrder);
});

app.post('/api/orders/:orderId/complete', (req, res) => {
  const { orderId } = req.params;

  const orderIndex = orders.findIndex(order => order.id === orderId);

  if (orderIndex === -1) {
      return res.status(404).json({ error: "Order not found!" });
  }

  const completedOrder = orders[orderIndex];
  orders.splice(orderIndex, 1); 

  res.json({
      message: "Order completed successfully!",
      orderSummary: completedOrder
  });
});


app.get("/api/orders", (req, res) => {
    res.json(orders);
});

app.get("/api/orders/:orderId", (req, res) => {
    const order = orders.find(o => o.id === req.params.orderId);

    if (!order) {
        return res.status(404).json({ error: "Order not found" });
    }

    res.json(order);
});

app.put('/api/orders/:orderId', (req, res) => {
  const { orderId } = req.params;
  const { size, toppings, quantity } = req.body;

  const order = orders.find(order => order.id === orderId);
  if (!order) {
      return res.status(404).json({ error: "Order not found!" });
  }

  if (size) order.size = size;
  if (Array.isArray(toppings)) order.toppings = toppings;
  if (quantity && typeof quantity === 'number' && quantity > 0) {
      order.quantity = quantity;
  } else if (quantity) {
      return res.status(400).json({ error: "Quantity must be a positive number!" });
  }

  res.json({ message: "Order updated successfully!", order });
});


app.delete('/api/orders/:orderId', (req, res) => {
  const { orderId } = req.params;

  const orderIndex = orders.findIndex(order => order.id === orderId);
  if (orderIndex === -1) {
      return res.status(404).json({ error: "Order not found!" });
  }

  orders.splice(orderIndex, 1);
  res.json({ message: "Order cancelled successfully!" });
});


const SIZE_PRICES = {
  small: 10.99,
  medium: 14.99,
  large: 18.99
};

const TOPPING_PRICE = 1.5;


app.post("/api/orders/:orderId/complete", (req, res) => {
    const { orderId } = req.params;


    const orderIndex = orders.findIndex(order => order.id === orderId);
    if (orderIndex === -1) {
        return res.status(404).json({ error: "Order not found" });
    }

    const order = orders[orderIndex];


    const basePrice = SIZE_PRICES[order.size.toLowerCase()] || 0;
    const toppingsCost = order.toppings.length * TOPPING_PRICE;
    const totalPrice = (basePrice + toppingsCost) * order.quantity;


    const completedOrder = {
        id: order.id,
        size: order.size,
        toppings: order.toppings,
        quantity: order.quantity,
        totalPrice: totalPrice.toFixed(2), 
        status: "completed"
    };

    orders.splice(orderIndex, 1);


    res.json({
        message: "Order completed successfully!",
        orderSummary: completedOrder
    });
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

