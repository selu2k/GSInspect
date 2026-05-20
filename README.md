# GSInspect

A centralized web-based system designed to manage and visualize ground support and rockbolt testing data. Allows engineers to query test results across different bolt products, filter by specific parameters, and overlay force-displacement curves to compare performances.

**Features:**
- Query test results across different bolt products
- Filter by specific parameters (category, supplier, length range)
- Overlay force-displacement curves to compare performances
- Access detailed test data and statistics
- **[Admin Only]** Upload CSV data, publish/unpublish tests, and manage bolt specifications

---

## System Requirements

### Required Software
- Docker Desktop (includes Docker Engine and Docker Compose)
- Git (for cloning the repository)

**Verify Installation:**
```bash
docker --version
docker compose version
```

---

## Quick Start

### Step 1: Clone Repository
```bash
git clone <repository-url>
cd GSInspect
```

### Step 2: Create Environment Files
```bash
# Create .env files from examples (dev environment)
cp .env_example .env
cp backend/web/.env_example backend/web/.env
```

Edit the files if needed (default values work for local development).

### Step 3: Start the System
```bash
docker compose up --build
```

The first run takes 2-3 minutes as it downloads images and builds containers.

### Step 4: Seed Sample Data
To see data in the dashboard, you need to seed the database:
```bash
docker compose exec web python manage.py seed
```

This creates sample bolt and test data.

### Step 5: Create Admin User
To access the admin panel, create an admin user:
```bash
docker compose exec web python manage.py create_api_user <username> <password> --staff
```

**Example:**
```bash
docker compose exec web python manage.py create_api_user admin admin123 --staff
```

### Step 6: Access the Application
- **Frontend:** http://localhost:5173
- **Admin Login:** http://localhost:5173/admin/login (use credentials from Step 5)
- **API Health:** http://localhost:8000/api/health/
- **API Docs:** http://localhost:8000/api/docs/

---

## Common Operations

### Running in Background
```bash
docker compose up --build -d
```

### View Logs
```bash
# All services
docker compose logs -f

# Specific services
docker compose logs -f web       # Backend API
docker compose logs -f db        # Database
docker compose logs -f frontend  # Frontend
```

### Open Shell in Container
```bash
docker compose exec web sh       # Backend
docker compose exec db sh        # Database
docker compose exec frontend sh  # Frontend
```

### Database Management
```bash
# Run migrations (automatic on startup)
docker compose exec web python manage.py migrate

# Create migrations after model changes
docker compose exec web python manage.py makemigrations

# Reset database (WARNING: all data lost)
docker compose down -v
```

### Create Additional Users
```bash
docker compose exec web python manage.py create_api_user jane_admin password456 --staff
```

### Stop the System
```bash
# Stop (keep data)
docker compose stop

# Stop and remove containers (keep data)
docker compose down

# Stop and remove everything including database (WARNING: data loss)
docker compose down -v
```

---

## Using the Dashboard

### Public Dashboard (No Login Required)
Navigate to http://localhost:5173

**Features:**
- **Search:** Find products by name, supplier, or category
- **Filters:** 
  - Support Type (locked to ground support)
  - Bolt Category (multi-select)
  - Supplier (multi-select)
  - Bolt Length Range (min-max)
- **Product Selection:** Click product names to plot force-displacement curves
- **Visualization:** 
  - Force-Displacement Chart (interactive line graph)
  - Color by Product or Facility
  - Show/hide averages
  - Histogram distributions
  - Summary statistics
  - Detailed test data table

### Admin Panel (Login Required)

**Access:** http://localhost:5173/admin/login

**Create Admin User First:**
```bash
docker compose exec web python manage.py create_api_user admin admin123 --staff
```

**Admin Features:**

1. **Manage Data (CRUD)**
   - Create, read, update, delete suppliers, bolts and tests
   - Filter by name and publication status
   - Edit specifications and test parameters

2. **Vette & Publish**
   - Review unpublished test data
   - Publish tests to make visible to engineers

3. **CSV Upload & Link**
   - Upload bolt specifications (CSV)
   - Upload test results (CSV)
   - Import test curve data (CSV)
   - Map external product IDs to internal system

---

## Admin CSV Import Guide

### Bolt Specifications CSV

**File:** `bolts.csv`

```csv
supplier_id,client_product_id,name,length,diameter,category,equipment_compatibility
1,PROD-001,M24 Rockbolt,3.5,24,Ground Support,"Multi-OEM;Handheld;Boltec"
2,PROD-002,Resin Bolt,2.0,20,Specialty,Multi-OEM
```

**Column Descriptions:**
- `supplier_id`: Internal supplier ID
- `client_product_id`: External product code (your system reference)
- `name`: Display name
- `length`: Bolt length in meters
- `diameter`: Bolt diameter in mm
- `category`: Classification (Ground Support, Specialty, etc.)
- `equipment_compatibility`: Semicolon-separated equipment types

### Test Results CSV

**File:** `tests.csv`

```csv
product_id,supplier_id,client_product_id,client_test_id,methodology,facility,installation_method,encapsulation_method,peak_strength,bond_strength,yield_strength,ultimate_deformation,stiffness,loading_rate,energy_absorption,number_of_drops
1,,PRD-001,TEST-001,static,Lab A,Standard,Full,150.5,45.2,120.3,8.5,18000,0.5,500,0
```

**Column Descriptions:**
- `product_id`: Internal bolt ID (takes priority)
- `supplier_id` + `client_product_id`: Fallback composite lookup
- `client_test_id`: External test reference code
- `methodology`: "static" or "dynamic"
- `facility`: Test location name
- Numeric fields: Peak strength (kN), bond strength (kN), yield strength (kN), ultimate deformation (mm), stiffness (kN/mm), loading rate (mm/s), energy absorption (kJ)

### Test Curve Data CSV

**File:** `curves.csv`

```csv
test_id,supplier_id,client_test_id,displacement,load
1,,TEST-001,0.0,0.0
1,,TEST-001,0.5,25.3
1,,TEST-001,1.0,51.2
1,,TEST-001,1.5,75.8
```

---

## API Documentation

### Interactive Swagger UI
Navigate to: http://localhost:8000/api/docs/

**Features:**
- View all available endpoints
- Test API calls directly
- See request/response formats
- Authentication examples

### ReDoc Alternative
Navigate to: http://localhost:8000/api/redoc/

## FAQ

**Q: How do I seed the database?**
A: `docker compose exec web python manage.py seed`

**Q: How do I create an admin user?**
A: `docker compose exec web python manage.py create_api_user <username> <password> --staff`

**Q: How do I reset the database?**
A: `docker compose down -v && docker compose up --build` (WARNING: deletes all data)

**Q: Can I export data?**
A: Currently not supported. Data is viewable via API endpoints.

---

## Documentation

- **Deployment Guide:** [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Deploy to VPS
- **Developer Docs:** [DEVELOPER_DOCS.md](./DEVELOPER_DOCS.md) - Technical reference


## Architecture

**Backend:** Django 5.2 + Django REST Framework  
**Frontend:** React 19 + Vite + Tailwind CSS  
**Database:** MariaDB 11  
**Authentication:** JWT (djangorestframework-simplejwt)  
**Documentation:** Swagger/ReDoc (drf-spectacular)

---

## Support

- **API Schema:** `/api/docs/` for endpoint details
- **Logs:** `docker compose logs -f`
