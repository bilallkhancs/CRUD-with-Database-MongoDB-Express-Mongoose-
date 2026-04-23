const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
require('dotenv').config();

const productRoutes                 = require('./routes/productRoutes');
const { notFound, errorHandler }    = require('./middleware/errorMiddleware');

const app  = express();
const PORT = process.env.PORT || 5000;

// ─── MIDDLEWARE ──────────────────────────────────────────────────
app.use(helmet());                          // Security headers
app.use(cors());                            // Enable CORS
app.use(morgan('dev'));                     // HTTP request logging
app.use(express.json());                   // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// ─── ROUTES ─────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'ProductVault API is running 🚀',
    version: '1.0.0',
    endpoints: {
      products: '/api/products',
    },
  });
});

app.use('/api/products', productRoutes);

// ─── ERROR HANDLING ─────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── DATABASE CONNECTION + SERVER START ─────────────────────────
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected successfully');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📦 API ready at http://localhost:${PORT}/api/products`);
    });
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('\n🛑 MongoDB disconnected. Server shutting down.');
  process.exit(0);
});

startServer();
