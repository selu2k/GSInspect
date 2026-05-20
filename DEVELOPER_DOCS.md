# GSInspect Developer Documentation

## Overview

GSInspect is a full-stack Django + React application for managing and analyzing ground support bolt testing data. This document covers architecture, development workflow, testing, and deployment.

**Tech Stack:**
- **Backend:** Django 5.2 + Django REST Framework 3.16
- **Frontend:** React 19 + Vite 8 + Tailwind CSS
- **Database:** MariaDB 11
- **Authentication:** JWT (djangorestframework-simplejwt)
- **Documentation:** drf-spectacular (Swagger/ReDoc)

---

## Project Structure

```
GSInspect/
├── backend/web/                 # Django application
│   ├── api/                     # Main API app
│   │   ├── models.py            # Data models (Bolt, Test, TestCurve, User, AuditLog)
│   │   ├── views.py             # REST API views
│   │   ├── serializers.py       # DRF serializers
│   │   ├── urls.py              # URL routing
│   │   ├── middleware.py        # Audit logging middleware
│   │   ├── tests.py             # API test suite
│   │   └── migrations/          # Database migrations
│   ├── web/
│   │   ├── settings.py          # Django configuration
│   │   ├── urls.py              # Root URL config
│   │   ├── wsgi.py              # WSGI entry point
│   │   └── test_settings.py     # Test database config
│   ├── Dockerfile              # Backend container
│   ├── entrypoint.sh           # Container startup script
│   ├── requirements.txt        # Python dependencies
│   ├── pytest.ini              # Test configuration
│   ├── pyproject.toml          # Black formatter config
│   └── .env_example            # Environment variables template
│
├── frontend/                    # React application
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/          # Admin-specific components
│   │   │   ├── charts/         # Chart components (Recharts)
│   │   │   ├── filters/        # Filter UI components
│   │   │   └── layout/         # Topbar, Sidebar
│   │   ├── pages/              # Page components
│   │   ├── context/            # React Context (state management)
│   │   ├── api/                # API client (axios)
│   │   ├── App.jsx             # Root component
│   │   └── main.jsx            # Entry point
│   ├── Dockerfile             # Frontend container
│   ├── nginx.conf             # Nginx reverse proxy config
│   ├── vite.config.js         # Vite build config
│   ├── eslint.config.js       # ESLint rules
│   ├── package.json           # Dependencies
│   ├── tailwind.config.js     # Tailwind CSS config
│   └── .env_example           # Environment variables template
│
├── .github/
│   └── workflows/
│       ├── ci.yml             # Linting & testing on PR
│       └── deploy-vm.yml      # Deploy to VPS on push
│
├── docker-compose.yml         # Container orchestration
├── USER_MANUAL.md            # User guide
├── DEPLOYMENT_GUIDE.md       # VPS deployment
└── README.md                 # Quick start
```

---

## Backend Architecture

### Models (`backend/web/api/models.py`)

#### User Model
```python
class User(AbstractUser):
    phone = models.CharField(max_length=20, blank=True, null=True)
    department = models.CharField(max_length=100, blank=True, null=True)
    position = models.CharField(max_length=100, blank=True, null=True)
    is_admin = models.BooleanField(default=False)
```

#### Bolt Model
```python
class Bolt(models.Model):
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE)
    client_product_id = models.CharField(max_length=255, blank=True, null=True)
    name = models.CharField(max_length=255)
    length = models.FloatField()
    diameter = models.FloatField()
    category = models.CharField(max_length=100)
    equipment_compatibility = models.JSONField(default=list)
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('supplier', 'client_product_id')
```

#### Test Model
```python
class Test(models.Model):
    METHODOLOGY_CHOICES = [('static', 'Static'), ('dynamic', 'Dynamic')]
    
    bolt = models.ForeignKey(Bolt, on_delete=models.CASCADE)
    client_test_id = models.CharField(max_length=255, blank=True, null=True)
    methodology = models.CharField(max_length=20, choices=METHODOLOGY_CHOICES)
    facility = models.CharField(max_length=100)
    # ... 15+ numeric fields for test parameters
    is_published = models.BooleanField(default=False)
    
    class Meta:
        unique_together = ('bolt', 'client_test_id')
```

#### TestCurve Model
```python
class TestCurve(models.Model):
    test = models.OneToOneField(Test, on_delete=models.CASCADE)
    curve_pair = models.JSONField()  # [{disp: float, load: float}, ...]
    is_published = models.BooleanField(default=False)
```

#### AuditLog Model
```python
class AuditLog(models.Model):
    timestamp = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(User, null=True, on_delete=models.SET_NULL)
    method = models.CharField(max_length=10)  # GET, POST, etc.
    path = models.CharField(max_length=255)
    query_params = models.JSONField(default=dict)
    status_code = models.IntegerField()
    response_time_ms = models.IntegerField()
    request_body = models.JSONField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    error_message = models.TextField(blank=True)
```

### API Endpoints

**Authentication:**
- `POST /api/auth/login/` - Obtain JWT token
- `POST /api/auth/refresh/` - Refresh JWT token

**Public Endpoints (No Auth Required):**
- `GET /api/public/filter-options/` - Get filter values
- `GET /api/public/bolts/` - List published bolts
- `GET /api/public/tests/` - List published tests
- `GET /api/public/curves/<test_id>/` - Get test curve data

**Admin Endpoints (Auth Required):**
- `GET/POST /api/admin/bolts/` - CRUD bolts
- `GET/POST /api/admin/tests/` - CRUD tests
- `POST /api/admin/bolts/import-csv/` - Bulk import bolts
- `POST /api/admin/tests/import-csv/` - Bulk import tests
- `POST /api/admin/test-curves/import-csv/` - Bulk import curves
- `PATCH /api/admin/bolts/<id>/publish/` - Publish bolt
- `GET /api/admin/audit-logs/` - View audit logs

**Filtering:**
```
?name=search_term&is_published=true
?facility=Lab%20A&methodology=static
```

### Serializers (`backend/web/api/serializers.py`)

```python
class AdminBoltSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bolt
        fields = ['id', 'name', 'supplier', 'client_product_id', 
                  'length', 'diameter', 'category', 
                  'equipment_compatibility', 'is_published']

class AdminTestSerializer(serializers.ModelSerializer):
    curve = TestCurveSerializer()
    class Meta:
        model = Test
        fields = ['id', 'bolt', 'client_test_id', 'methodology', 'facility',
                  'peak_strength', 'bond_strength', 'is_published', 'curve']
```

### Middleware

**AuditLogMiddleware** (`backend/web/api/middleware.py`):
- Logs all API requests/responses
- Records: timestamp, user, method, path, query params, status code, response time
- Filters sensitive data (passwords, tokens)
- Used for compliance and troubleshooting

---

## Frontend Architecture

### Directory Structure

```
frontend/src/
├── components/
│   ├── admin/
│   │   ├── ManageDataPanel.jsx      # CRUD interface
│   │   └── UploadPanel.jsx          # CSV upload
│   ├── charts/
│   │   ├── ForceDisplacementCanvas.jsx  # Main chart
│   │   └── ScatterPlot.jsx
│   ├── filters/
│   │   └── MultiSelect.jsx          # Reusable filter component
│   └── layout/
│       ├── Topbar.jsx               # Header with auth
│       └── Sidebar.jsx              # Filter sidebar
├── pages/
│   ├── Dashboard.jsx                # Main data visualization
│   ├── AdminPanel.jsx               # Admin dashboard
│   └── LoginPage.jsx                # Auth page
├── context/
│   ├── AppContext.jsx               # Provider component
│   └── AppContextCore.js            # Context definition
├── api/
│   └── client.js                    # Axios instance
├── App.jsx                          # Root component
└── main.jsx                         # Entry point
```

### State Management (React Context)

**AppContext.jsx** provides:
```javascript
const {
  // Data
  filteredProductsList,
  filteredTests,
  filteredCurves,
  
  // Filters
  selectedProductIds,
  methodology,
  selectedFacilities,
  searchTerm,
  
  // Functions
  setSelectedProductIds,
  toggleProductSelection,
  setMethodology,
  setSelectedFacilities,
  setSearchTerm,
  triggerSearch,
  resetFilters,
} = useAppContext();
```

### API Client (`frontend/src/api/client.js`)

```javascript
import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
});

// Interceptor: Add JWT token to requests
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor: Handle token refresh
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Attempt token refresh
      const refreshToken = localStorage.getItem('refresh_token');
      // ... refresh logic
    }
    return Promise.reject(error);
  }
);

export default client;
```

### Component Examples

**Dashboard.jsx - Data Visualization:**
- Fetches published data from `/api/public/` endpoints
- Manages local state for filters and selections
- Renders interactive charts using Recharts
- No authentication required

**AdminPanel.jsx - Admin Management:**
- Protected route (redirects if not authenticated)
- Manages bolts, tests, and publications
- Handles CSV uploads
- Uses admin endpoints (`/api/admin/...`)

---

## Development Workflow

### Setup Local Environment

```bash
# 1. Clone repository
git clone <url>
cd GSInspect

# 2. Create environment files
cp backend/web/.env_example backend/web/.env
cp .env_example .env

# 3. Edit .env files with your values
nano backend/web/.env

# 4. Start services
docker compose up --build

# 5. Access applications
# Frontend: http://localhost:5173
# Backend: http://localhost:8000
# API Docs: http://localhost:8000/api/docs/
```

### Code Style & Quality

**Backend:**
```bash
# Format with Black
docker compose exec web black .

# Lint with Flake8
docker compose exec web flake8

# Run tests
docker compose exec web pytest
```

**Frontend:**
```bash
# Lint
docker compose exec frontend npm run lint

# Format
docker compose exec frontend npm run lint -- --fix
```

**Configuration Files:**
- **Black:** `backend/web/pyproject.toml` (line-length: 100)
- **Flake8:** Max line length 100
- **ESLint:** `frontend/eslint.config.js`
- **Tailwind CSS:** `frontend/tailwind.config.js`

### Making Changes

**Backend Example:**

1. Create feature branch:
   ```bash
   git checkout -b feature/add-export-csv
   ```

2. Make changes to models/views/serializers:
   ```bash
   nano backend/web/api/models.py
   ```

3. Create migration:
   ```bash
   docker compose exec web python manage.py makemigrations
   ```

4. Run tests:
   ```bash
   docker compose exec web pytest
   ```

5. Format and lint:
   ```bash
   docker compose exec web black .
   docker compose exec web flake8
   ```

6. Commit and push:
   ```bash
   git add .
   git commit -m "feat: add export CSV functionality"
   git push origin feature/add-export-csv
   ```

7. Create Pull Request on GitHub

**Frontend Example:**

1. Create feature branch:
   ```bash
   git checkout -b feature/add-facility-filter
   ```

2. Create component:
   ```bash
   nano frontend/src/components/FacilityFilter.jsx
   ```

3. Test in browser (HMR updates automatically):
   - Edit file and save
   - Browser refreshes with changes

4. Lint:
   ```bash
   docker compose exec frontend npm run lint
   ```

5. Commit and push

---

## Testing

### Backend Testing

**Test File:** `backend/web/api/tests.py`

**Run All Tests:**
```bash
docker compose exec web pytest
```

**Run Specific Test:**
```bash
docker compose exec web pytest api/tests.py::TestBoltListView
```

**With Coverage:**
```bash
docker compose exec web pytest --cov=api --cov-report=html
```

**Coverage Report:**
- Generated in `backend/web/htmlcov/index.html`
- Target: >80% coverage

**Test Structure:**
```python
class TestBoltListView(TestCase):
    def setUp(self):
        self.supplier = Supplier.objects.create(name="Test Supplier")
        self.bolt = Bolt.objects.create(
            supplier=self.supplier,
            name="Test Bolt",
            client_product_id="PROD-001",
            # ...
        )
    
    def test_list_published_bolts(self):
        self.bolt.is_published = True
        self.bolt.save()
        response = self.client.get('/api/public/bolts/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
```

---

## Database Migrations

### Creating Migrations

After modifying models:

```bash
docker compose exec web python manage.py makemigrations
```

This creates a migration file in `backend/web/api/migrations/`.

### Applying Migrations

Migrations run automatically on container startup via `entrypoint.sh`.

Manual application:
```bash
docker compose exec web python manage.py migrate
```

### Reviewing Migrations

```bash
# Show migration status
docker compose exec web python manage.py showmigrations

# Reverse a migration
docker compose exec web python manage.py migrate api 0001
```

---

## Debugging

### Backend Debugging

**Django Shell:**
```bash
docker compose exec web python manage.py shell
>>> from api.models import Bolt
>>> Bolt.objects.all()
```

**Logging:**
```python
import logging
logger = logging.getLogger(__name__)
logger.info("User created")
```

**Print Debugging:**
```bash
docker compose logs -f web
# Print statements appear in logs
```

### Frontend Debugging

**Browser DevTools:**
1. Open Chrome/Firefox DevTools (F12)
2. Console tab for errors
3. Network tab for API requests
4. React DevTools extension for component inspection

**Console Logging:**
```javascript
console.log('Component state:', state);
console.error('API error:', error);
```

---

## CI/CD Pipeline

### GitHub Actions Workflow (`.github/workflows/ci.yml`)

Runs on Pull Requests:

1. **Backend Linting** (Flake8):
   - Checks code style
   - Reports errors and warnings

2. **Backend Tests** (pytest):
   - Runs full test suite
   - Checks coverage (target >80%)

3. **API Integration Tests**:
   - Tests real endpoints
   - Verifies database integration

### Deployment Workflow (`.github/workflows/deploy-vm.yml`)

Runs on push to main branch:

1. Checkout code
2. Create `.env` file from GitHub secrets
3. SCP files to VPS
4. SSH into VPS and:
   - Stop old containers
   - Start new containers with `--build`
   - Wait 15 seconds
   - Health check (curl API)
   - Fail if unhealthy

---

## Common Tasks

### Add a New API Endpoint

1. **Create model if needed:**
   ```python
   # backend/web/api/models.py
   class NewModel(models.Model):
       name = models.CharField(max_length=100)
   ```

2. **Create serializer:**
   ```python
   # backend/web/api/serializers.py
   class NewModelSerializer(serializers.ModelSerializer):
       class Meta:
           model = NewModel
           fields = ['id', 'name']
   ```

3. **Create view:**
   ```python
   # backend/web/api/views.py
   class NewModelListView(generics.ListCreateAPIView):
       queryset = NewModel.objects.all()
       serializer_class = NewModelSerializer
   ```

4. **Add URL:**
   ```python
   # backend/web/api/urls.py
   path('new-models/', NewModelListView.as_view())
   ```

5. **Create tests:**
   ```python
   # backend/web/api/tests.py
   class TestNewModel(TestCase):
       def test_list(self):
           response = self.client.get('/api/new-models/')
           self.assertEqual(response.status_code, 200)
   ```

### Add a New Frontend Component

1. **Create component file:**
   ```bash
   nano frontend/src/components/NewComponent.jsx
   ```

2. **Implement component:**
   ```jsx
   export default function NewComponent() {
     return <div>New Component</div>;
   }
   ```

3. **Use in page:**
   ```jsx
   import NewComponent from '../components/NewComponent';
   
   export default function Dashboard() {
     return (
       <div>
         <NewComponent />
       </div>
     );
   }
   ```

### Modify Database Schema

1. Update model in `backend/web/api/models.py`
2. Create migration: `docker compose exec web python manage.py makemigrations`
3. Apply migration: `docker compose exec web python manage.py migrate`
4. Commit migration files to git

---

## Troubleshooting

### Database Connection Refused

```bash
# Check database container
docker compose ps db

# Check logs
docker compose logs db

# Solution: Wait 30 seconds, DB needs time to start
```

### API Returns 401 Unauthorized

```
# Check JWT token
localStorage.getItem('access_token')

# Token may be expired
# Send refresh request to /api/auth/refresh/

# Or remove token and login again
localStorage.removeItem('access_token')
localStorage.removeItem('refresh_token')
```

### Migration Conflicts

```bash
# Show migration status
docker compose exec web python manage.py showmigrations

# If conflicts, reset database
docker compose down -v
docker compose up --build
```

### Hot Module Replacement (HMR) Not Working

```bash
# Check frontend container
docker compose logs frontend

# Solution: Restart frontend
docker compose restart frontend
```

---

## Resources

- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Recharts](https://recharts.org/)
- [Docker Documentation](https://docs.docker.com/)

---

## Contributing

1. Fork repository
2. Create feature branch: `git checkout -b feature/description`
3. Make changes and test
4. Format and lint code
5. Create Pull Request with description
6. Wait for CI/CD checks to pass
7. Request review from maintainers
