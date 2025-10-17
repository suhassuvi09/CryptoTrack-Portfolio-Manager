# CryptoTrack - Premium Cryptocurrency Portfolio Manager

A full-stack cryptocurrency portfolio tracker with real-time price data, user authentication, and portfolio management features.

![CryptoTrack Dashboard](client/public/dashboard-preview.png)

## Features

- Real-time cryptocurrency price tracking with live updates
- Advanced portfolio management with profit/loss calculations
- Interactive watchlist functionality with price alerts
- Comprehensive analytics and performance charts
- User authentication with JWT-based security
- Export functionality (PDF/CSV) for portfolio reports
- Responsive design with premium dark/light theme toggle
- Mobile-first approach with touch-friendly interface
- Premium UI/UX design with gradients, shadows, and animations

## Tech Stack

### Frontend
- React.js with Vite for lightning-fast development
- Tailwind CSS for responsive styling
- React Router for navigation
- Chart.js for data visualization
- Axios for HTTP requests
- React Hot Toast for notifications
- Lucide React for icons

### Backend
- Node.js with Express.js framework
- MongoDB with Mongoose for data persistence
- JWT authentication for secure user sessions
- bcryptjs for password hashing
- Helmet & CORS for security
- Rate limiting for API protection
- CoinGecko API for cryptocurrency data

## Premium UI/UX Enhancements

### Visual Design
- Custom premium color palette with gradients
- Consistent shadow system for depth perception
- Smooth animations and transitions
- Enhanced typography hierarchy
- Premium card components with hover effects
- Gradient buttons and interactive elements

### User Experience
- Intuitive dashboard with quick actions
- Responsive tables with enhanced styling
- Improved form validation and user feedback
- Loading states with premium spinners
- Seamless dark/light theme toggle
- Mobile-optimized layouts

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account or local MongoDB installation
- Git

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd cryptotrack
```

2. Install backend dependencies
```bash
cd server
npm install
```

3. Install frontend dependencies
```bash
cd ../client
npm install
```

4. Set up environment variables
- Copy `.env.example` to `.env` in both client and server directories
- Configure your MongoDB connection string and JWT secret
- Add CoinGecko API credentials if needed

5. Start the development servers
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

6. Open your browser and navigate to `http://localhost:5173`

## Project Structure

```
cryptotrack/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── auth/          # Authentication components
│   │   │   ├── crypto/        # Cryptocurrency components
│   │   │   ├── layout/        # Layout components (Header, Sidebar)
│   │   │   ├── portfolio/     # Portfolio components
│   │   │   └── ui/            # Generic UI components
│   │   ├── context/           # React Context providers
│   │   ├── pages/             # Page components
│   │   ├── services/          # API service functions
│   │   ├── utils/             # Utility functions
│   │   ├── App.jsx            # Main application component
│   │   ├── index.css          # Global styles
│   │   └── main.jsx           # Application entry point
│   └── public/                # Static assets
├── server/                    # Express backend
│   ├── controllers/           # Request handlers
│   ├── middleware/            # Custom middleware
│   ├── models/                # MongoDB models
│   ├── routes/                # API routes
│   ├── services/              # Business logic
│   ├── utils/                 # Utility functions
│   ├── config/                # Configuration files
│   ├── .env                   # Environment variables
│   ├── server.js              # Server entry point
│   └── package.json           # Dependencies
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Portfolio
- `GET /api/portfolio` - Get user portfolio
- `POST /api/portfolio/holdings` - Add new holding
- `PUT /api/portfolio/holdings/:id` - Update holding
- `DELETE /api/portfolio/holdings/:id` - Delete holding
- `GET /api/portfolio/export` - Export portfolio data

### Watchlist
- `GET /api/watchlist` - Get user watchlist
- `POST /api/watchlist` - Add coin to watchlist
- `DELETE /api/watchlist/:coinId` - Remove coin from watchlist

### Crypto Data
- `GET /api/crypto/markets` - Get cryptocurrency market data
- `GET /api/crypto/global` - Get global market data
- `GET /api/crypto/coins/:id` - Get specific coin data

## Development

### Frontend Development
- Uses Vite for fast development and hot module replacement
- Tailwind CSS for utility-first styling
- Component-based architecture for reusability

### Backend Development
- RESTful API design
- MongoDB with Mongoose for data modeling
- JWT-based authentication
- Error handling and logging

## Security Features

- Password hashing with bcrypt
- JWT token-based authentication
- CORS configuration
- API rate limiting
- Input validation and sanitization
- Secure HTTP headers with Helmet

## Performance Optimizations

- Database indexing for faster queries
- API response caching
- Efficient data fetching
- Code splitting
- Asset optimization

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [CoinGecko API](https://www.coingecko.com/en/api) for cryptocurrency data
- [React](https://reactjs.org/) for the frontend framework
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Node.js](https://nodejs.org/) for the backend runtime