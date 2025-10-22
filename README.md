# The Unit Decoder

A comprehensive, community-driven encyclopedia and converter for measurement units from around the world. Built to capture the "long tail" of units that standard converters ignore, including historical, regional, and specialized measurement systems.

## 🌟 Features

- **🔍 Three-Layer Intelligent Search**: Exact match, phonetic matching, and fuzzy search
- **🌍 Global Coverage**: Units from India, Japan, China, historical periods, and more
- **📱 Mobile-First Design**: Optimized for slow connections and mobile devices
- **🔄 Conversion Calculator**: Interactive unit conversion tool
- **📚 Comprehensive Database**: 102+ units across 17 measurement categories
- **🎨 Modern UI**: Clean, responsive design with smooth animations
- **⚡ High Performance**: Optimized search and conversion algorithms

## 📊 Database Coverage

### **Measurement Categories (102 Units Total):**
- **Volume** (14 units): Metric, Imperial, Cooking measures
- **Mass** (13 units): Metric, Imperial, Historical units  
- **Length** (11 units): Metric, Imperial, Historical units
- **Time** (10 units): Complete temporal system
- **Data Storage** (6 units): Digital information units
- **Speed** (6 units): Velocity measurements
- **Energy** (5 units): Physics and nutrition
- **Pressure** (5 units): Atmospheric and mechanical
- **Area** (4 units): Surface measurements
- **Electrical** (4 units): Electronics units
- **Frequency** (4 units): Wave measurements
- **Temperature** (4 units): Heat measurements
- **Angle** (3 units): Geometric measurements
- **Force** (3 units): Physics measurements
- **Power** (3 units): Energy rate units
- **Counting** (4 units): Numerical units
- **Currency** (3 units): Historical money units

### **Unit Types Covered:**
- ✅ **Metric System**: Complete SI units
- ✅ **Imperial Units**: US and UK measurements
- ✅ **Historical Units**: Ancient and traditional measures
- ✅ **Regional Units**: Cultural measurement systems
- ✅ **Scientific Units**: Physics, chemistry, engineering
- ✅ **Modern Units**: Digital and technological
- ✅ **Cooking Units**: Culinary measurements

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/unit-decoder.git
   cd unit-decoder
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Initialize the database**
   ```bash
   npm run init-db
   ```

4. **Seed the database with comprehensive units**
   ```bash
   npm run seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   ```
   http://localhost:3000
   ```

## 🧪 Testing

Run the comprehensive test suite:

```bash
# Run all tests
npm run test:everything

# Run specific test suites
npm test                    # Jest unit tests
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests
npm run test:api           # API tests
```

## 📁 Project Structure

```
/
├── server.js                 # Main Express application
├── config.js                 # Environment configuration
├── package.json              # Dependencies and scripts
├── vercel.json              # Vercel deployment config
├── db/
│   ├── schema.sql           # Database schema
│   ├── init.js              # Database initialization
│   ├── database.js          # Database connection and queries
│   └── optimized-database.js # Performance optimizations
├── routes/
│   ├── search.js            # Search API endpoints
│   ├── units.js             # Unit detail endpoints
│   └── convert.js           # Conversion calculator endpoints
├── utils/
│   ├── normalize.js         # Text normalization utilities
│   ├── search.js            # Three-layer search algorithm
│   ├── verification.js      # Automated verification logic
│   └── constants.js         # Application constants
├── scrapers/
│   ├── wikipedia-scraper.js # Wikipedia data extraction
│   └── seed-database.js     # Database seeding script
├── scripts/
│   ├── test-everything.js   # Comprehensive test suite
│   ├── performance-test.js  # Performance testing
│   └── backup-db.js         # Database backup
└── public/
    ├── index.html           # Single page application
    ├── css/modern.css       # Complete design system
    └── js/modern-app.js     # SPA routing and logic
```

## 🔍 Search Algorithm

The Unit Decoder uses a sophisticated three-layer search system:

1. **Exact Match**: Direct string matching with normalization
2. **Phonetic Match**: Double Metaphone algorithm for "sounds-like" matching
3. **Fuzzy Match**: Partial string matching with LIKE queries

This ensures users can find units even with misspellings, different transliterations, or partial names.

## 🎨 Design System

### **Color Palette:**
- **Primary**: Indigo (#4F46E5) with full shade range
- **Secondary**: Emerald green (#10B981)
- **Accent**: Amber orange (#F59E0B)
- **Neutrals**: Professional gray scale
- **Status**: Success, warning, danger, info colors

### **Features:**
- Modern gradient effects
- Smooth animations and transitions
- Responsive grid system
- Professional typography (Inter font)
- Glass morphism effects
- Comprehensive shadow system

## 📝 API Endpoints

### Search
- `GET /api/search?q={query}` - Search for units

### Units
- `GET /api/units/:id` - Get unit by ID
- `GET /api/units/category/:category` - Get units by category

### Conversion
- `POST /api/convert` - Convert between units
  ```json
  {
    "fromUnitId": 1,
    "toUnitId": 2,
    "value": 1000
  }
  ```

### Health
- `GET /api/health` - System health check

## 🚀 Deployment

### Vercel Deployment

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Set environment variables** (in Vercel dashboard)
   ```
   NODE_ENV=production
   DB_PATH=/tmp/unit_decoder.db
   ```

### Alternative Deployment Options

- **Railway**: Supports persistent SQLite files
- **DigitalOcean App Platform**: Full control over file system
- **Heroku**: With persistent storage addon

## 🧪 Performance

- **Search Speed**: < 1 second response time
- **Database**: Optimized SQLite with proper indexing
- **Caching**: Client-side result caching
- **Compression**: Gzip compression enabled
- **CDN Ready**: Static assets optimized

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Data sourced from [Wikipedia](https://en.wikipedia.org) (CC BY-SA)
- Built with Node.js, Express, and SQLite
- Inspired by the need for comprehensive unit conversion tools
- Community contributions welcome

## 📞 Support

For issues and questions:

1. Check the troubleshooting section in the documentation
2. Review the API documentation
3. Open an issue on GitHub
4. Check the server logs for error details

## 🐛 Troubleshooting

### Database Issues
```bash
# Reset the database
rm db/unit_decoder.db
npm run init-db
npm run seed
```

### Search Issues
1. Check that the database is seeded: `npm run seed`
2. Verify the database file exists: `ls -la db/`
3. Check server logs for errors

### Performance Issues
```bash
# Run performance tests
npm run perf

# Monitor performance
npm run monitor
```

---

**The Unit Decoder** - Preserving and sharing the world's measurement heritage, one unit at a time. 🌍📏