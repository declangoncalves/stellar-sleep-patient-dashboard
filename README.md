# Patient Dashboard

## Live Demo

Visit the live application: [Stellar Sleep Patient Dashboard](https://stellar-sleep-patient-dashboard.vercel.app/patients)

## Features

- Patient management with detailed information
- Sleep tracking with ISI scores visualization
- Custom fields for additional patient data
- Address management
- Search and filtering capabilities

## Environment Setup

1. Clone the repository
2. Create a `.env.local` file in the frontend directory with the following variable:
   ```
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
   ```
3. Install pnpm if you haven't already:

   ```bash
   # Using npm
   npm install -g pnpm

   # Or using Homebrew (macOS)
   brew install pnpm
   ```

## Quick Start

```bash
# backend
cd backend && python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate && python manage.py runserver 8000

# frontend
cd frontend && pnpm install
pnpm dev
```

## API Documentation

The backend API provides the following endpoints:

### Patients

- `GET /api/patients/` - List all patients
- `POST /api/patients/` - Create a new patient
- `GET /api/patients/{id}/` - Get a specific patient
- `PUT /api/patients/{id}/` - Update a patient
- `DELETE /api/patients/{id}/` - Delete a patient

### Addresses

- `GET /api/addresses/?patient={id}` - List addresses for a specific patient
- `POST /api/addresses/` - Create a new address
- `GET /api/addresses/{id}/` - Get a specific address
- `PUT /api/addresses/{id}/` - Update an address
- `DELETE /api/addresses/{id}/` - Delete an address

### ISI Scores

- `GET /api/isi-scores/?patient={id}` - List all ISI scores for a specific patient
- `POST /api/isi-scores/` - Create a new ISI score
- `GET /api/isi-scores/{id}/` - Get a specific ISI score
- `PUT /api/isi-scores/{id}/` - Update an ISI score
- `DELETE /api/isi-scores/{id}/` - Delete an ISI score

### Custom Fields

- `GET /api/custom-fields/` - List all custom fields
- `POST /api/custom-fields/` - Create a new custom field
- `GET /api/custom-fields/{id}/` - Get a specific custom field
- `PUT /api/custom-fields/{id}/` - Update a custom field
- `DELETE /api/custom-fields/{id}/` - Delete a custom field

### Custom Field Values

- `GET /api/custom-field-values/?patient={id}` - List values for a specific patient
- `POST /api/custom-field-values/` - Create a new custom field value
- `GET /api/custom-field-values/{id}/` - Get a specific custom field value
- `PUT /api/custom-field-values/{id}/` - Update a custom field value
- `DELETE /api/custom-field-values/{id}/` - Delete a custom field value

## Testing

```bash
# backend tests
cd backend
python manage.py test

# frontend tests
cd frontend
pnpm test
```

## Deployment

The application is deployed across two platforms:

- **Frontend**: Hosted on [Vercel](https://vercel.com) at [https://stellar-sleep-patient-dashboard.vercel.app/patients](https://stellar-sleep-patient-dashboard.vercel.app/patients)
- **Backend API**: Hosted on [Render](https://render.com) at [https://stellar-sleep-patient-dashboard.onrender.com](https://stellar-sleep-patient-dashboard.onrender.com)

### Environment Variables

For local development:

- Frontend: Create a `.env.local` file in the frontend directory with `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`
- Backend: No environment variables required

For production:

- Frontend: Vercel environment variables are set to connect to the Render backend
- Backend: The CORS settings are configured to allow requests from the Vercel frontend
