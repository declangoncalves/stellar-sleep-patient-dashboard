## Quick start

```bash
# backend
cd backend && python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate && python manage.py runserver 8000

# frontend (new terminal)
cd frontend && npm install
npm run dev
