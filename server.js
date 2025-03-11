const express = require("express");
const { v4: uuidv4 } = require("uuid"); 
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

// this is where orders are stored
const orders = []; 

// this endpoint is to create a new order
app.post('/api/orders', (req, res) => {
  const { size, toppings, quantity } = req.body;

  // this is to validate the order request
  if (!size || !toppings || !quantity) {
      return res.status(400).json({ error: "Size, toppings and quantity have not been provided." });
  }

  if (typeof quantity !== 'number' || quantity < 1) {
      return res.status(400).json({ error: "The number of orders should be greater than 0." });
  }

  if (!Array.isArray(toppings)) {
      return res.status(400).json({ error: "Toppings must be an array." });
  }

  // this is to create a new order object
  const newOrder = {
      id: uuidv4(), // this generates a unique order ID
      size,
      toppings,
      quantity,
      status: "pending"
  };

  orders.push(newOrder); // this adds order to in-memory store
  res.status(201).json(newOrder); // this returns created order
});

// this endpoint is to complete an order
app.post('/api/orders/:orderId/complete', (req, res) => {
  const { orderId } = req.params;

  // this finds order index
  const orderIndex = orders.findIndex(order => order.id === orderId);
  if (orderIndex === -1) {
      return res.status(404).json({ error: "Order invalid." });
  }

  const completedOrder = orders[orderIndex];
  orders.splice(orderIndex, 1); // this removes order from in-memory store

  res.json({
      message: "Order completed successfully.",
      orderSummary: completedOrder
  });
});

// this endpoint is to get all orders
app.get("/api/orders", (req, res) => {
    res.json(orders);
});

// this endpoint is to get a specific order by ID
app.get("/api/orders/:orderId", (req, res) => {
    const order = orders.find(o => o.id === req.params.orderId);

    if (!order) {
        return res.status(404).json({ error: "Order invalid." });
    }

    res.json(order);
});

// this endpoint is to update an order
app.put('/api/orders/:orderId', (req, res) => {
  const { orderId } = req.params;
  const { size, toppings, quantity } = req.body;

  // this is to find the order
  const order = orders.find(order => order.id === orderId);
  if (!order) {
      return res.status(404).json({ error: "Order invalid." });
  }

  // this is to update order properties if provided
  if (size) order.size = size;
  if (Array.isArray(toppings)) order.toppings = toppings;
  if (quantity && typeof quantity === 'number' && quantity > 0) {
      order.quantity = quantity;
  } else if (quantity) {
      return res.status(400).json({ error: "The quantity should be greater than 0." });
  }

  res.json({ message: "Order updated successfully.", order });
});

// this endpoint is to delete an order
app.delete('/api/orders/:orderId', (req, res) => {
  const { orderId } = req.params;

  const orderIndex = orders.findIndex(order => order.id === orderId);
  if (orderIndex === -1) {
      return res.status(404).json({ error: "Order invalid." });
  }

  orders.splice(orderIndex, 1); // Remove order
  res.json({ message: "Order cancelled successfully." });
});

// pricing breakdown 
const SIZE_PRICES = {
  small: 10.99,
  medium: 14.99,
  large: 18.99
};
const TOPPING_PRICE = 1.5;

// this endpoint is an order completion with finalized price
app.post("/api/orders/:orderId/complete", (req, res) => {
    const { orderId } = req.params;

    // this finds the order
    const orderIndex = orders.findIndex(order => order.id === orderId);
    if (orderIndex === -1) {
        return res.status(404).json({ error: "Order invalid." });
    }

    const order = orders[orderIndex];

    // this calculates total price
    const basePrice = SIZE_PRICES[order.size.toLowerCase()] || 0;
    const toppingsCost = order.toppings.length * TOPPING_PRICE;
    const totalPrice = (basePrice + toppingsCost) * order.quantity;

    // this create a completed order summary
    const completedOrder = {
        id: order.id,
        size: order.size,
        toppings: order.toppings,
        quantity: order.quantity,
        totalPrice: totalPrice.toFixed(2), // price format
        status: "completed"
    };

    orders.splice(orderIndex, 1); // this removes the order from list

    res.json({
        message: "Order completed successfully.",
        orderSummary: completedOrder
    });
});

// this starts the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
